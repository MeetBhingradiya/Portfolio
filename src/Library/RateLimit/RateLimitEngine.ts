/**
 * Rate Limit Engine — Sliding Window Counter
 *
 * Edge-runtime compatible rate limiting engine using a fixed-window counter
 * with fractional previous-window interpolation (industry standard approach
 * used by Cloudflare, Stripe, GitHub).
 *
 * Identity resolution:
 *   - IP address: extracted from standard proxy headers
 *   - Device fingerprint: canvas/WebGL hash sent via `x-device-fp` header
 *   - "both" mode: enforces limits on BOTH identities independently
 *     (if either is exceeded, the request is blocked)
 *
 * Storage:
 *   - In-memory LRU Map per Edge isolate (fast, no network)
 *   - Entries auto-evict when the map exceeds MAX_ENTRIES
 *   - Each isolate has its own counter space (acceptable for rate limiting)
 */

import {
    type RateLimitConfig,
    type RateLimitRule,
    resolveRule,
    loadRateLimitConfig
} from "./RateLimitConfig";
import { getClientIp } from "../IP";
import { UserAgent } from "../UserAgent";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitIdentity {
    /** Client IP address (may be null if behind certain proxies) */
    ip: string | null;
    /** Device fingerprint hash from x-device-fp header */
    fingerprint: string | null;
    /** Parsed device name for UI/logs */
    deviceName: string | null;
}

export interface RateLimitResult {
    /** Whether the request is allowed through */
    allowed: boolean;
    /** Maximum requests allowed in the window */
    limit: number;
    /** Remaining requests in the current window */
    remaining: number;
    /** Unix timestamp (seconds) when the window resets */
    resetAt: number;
    /** Seconds until the client should retry (0 if allowed) */
    retryAfter: number;
    /** The rule that was applied */
    ruleId: string;
    /** The rule name for logging */
    ruleName: string;
    /** Which identity triggered the limit (null if allowed) */
    triggeredBy: "ip" | "fingerprint" | null;
    /** The device name for UI / logging */
    deviceName: string | null;
}

// ── Sliding Window Store ─────────────────────────────────────────────────────

interface WindowBucket {
    /** Count in the current fixed window */
    currentCount: number;
    /** Count in the previous fixed window */
    previousCount: number;
    /** Timestamp (ms) when the current window started */
    windowStart: number;
    /** Window duration in ms */
    windowMs: number;
}

/**
 * Maximum entries in the in-memory store.
 * ~10K entries × ~100 bytes each ≈ 1MB — acceptable for Edge isolates.
 */
const MAX_ENTRIES = 10_000;

/** In-memory rate limit counter store */
const store = new Map<string, WindowBucket>();

/**
 * Build a composite key for the store.
 * Format: "{identityType}:{identityValue}:{ruleId}"
 */
function buildKey(identityType: "ip" | "fp", identityValue: string, ruleId: string): string {
    return `${identityType}:${identityValue}:${ruleId}`;
}

/**
 * Evict oldest entries when the store exceeds MAX_ENTRIES.
 * Map iteration order is insertion order, so we delete the first entries.
 */
function evictIfNeeded(): void {
    if (store.size <= MAX_ENTRIES) return;

    const toEvict = store.size - MAX_ENTRIES + Math.floor(MAX_ENTRIES * 0.1); // Evict 10% extra
    let evicted = 0;
    for (const key of store.keys()) {
        if (evicted >= toEvict) break;
        store.delete(key);
        evicted++;
    }
}

/**
 * Get or create a window bucket for the given key.
 * Handles window rotation: when the current window has expired,
 * the current count becomes the previous count and a new window starts.
 */
function getOrCreateBucket(key: string, windowMs: number, now: number): WindowBucket {
    let bucket = store.get(key);

    if (!bucket) {
        // New entry
        bucket = {
            currentCount: 0,
            previousCount: 0,
            windowStart: now,
            windowMs
        };
        store.set(key, bucket);
        evictIfNeeded();
        return bucket;
    }

    const elapsed = now - bucket.windowStart;

    if (elapsed >= windowMs * 2) {
        // More than 2 windows have passed — reset completely
        bucket.previousCount = 0;
        bucket.currentCount = 0;
        bucket.windowStart = now;
    } else if (elapsed >= windowMs) {
        // Current window expired — rotate
        bucket.previousCount = bucket.currentCount;
        bucket.currentCount = 0;
        bucket.windowStart = bucket.windowStart + windowMs * Math.floor(elapsed / windowMs);
    }

    return bucket;
}

/**
 * Calculate the effective request count using sliding window interpolation.
 *
 * Formula: previous_count × (1 - elapsed_fraction) + current_count
 *
 * This smooths out the "burst at window boundary" problem of pure fixed windows.
 */
function getEffectiveCount(bucket: WindowBucket, now: number): number {
    const elapsed = now - bucket.windowStart;
    const fraction = Math.min(elapsed / bucket.windowMs, 1);
    const previousWeight = 1 - fraction;

    return Math.floor(bucket.previousCount * previousWeight) + bucket.currentCount;
}

// ── Identity Extraction ──────────────────────────────────────────────────────

/**
 * Extract client identity from a request.
 * Works with any object that has a headers.get() method (NextRequest compatible).
 */
export function extractIdentity(headers: {
    get(name: string): string | null;
}): RateLimitIdentity {
    // Extract IP
    const ipVal = getClientIp({ headers });
    const ip = (Array.isArray(ipVal) ? ipVal[0] : ipVal) || null;

    // Extract device fingerprint
    const fingerprint = headers.get("x-device-fp") || null;

    // Extract device name
    let deviceName: string | null = null;
    const uaString = headers.get("user-agent");
    if (uaString) {
        const ua = new UserAgent().parse(uaString);
        let name = `${ua.browser} on ${ua.os}`;
        if (ua.isMobile && !name.includes("Mobile")) {
            name += " (Mobile)";
        } else if (ua.isTablet && !name.includes("Tablet")) {
            name += " (Tablet)";
        }
        deviceName = name !== "unknown on unknown" ? name : "Unknown Device";
    }

    return { ip, fingerprint, deviceName };
}

// ── Paths excluded from rate limiting ────────────────────────────────────────

const RATE_LIMIT_BYPASS_PREFIXES = [
    "/_next",
    "/favicon",
    "/api/rate-limit-status"
] as const;

function isRateLimitBypassPath(pathname: string): boolean {
    return RATE_LIMIT_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ── Core Rate Limit Check ────────────────────────────────────────────────────

/**
 * Check a single identity (IP or fingerprint) against a rule.
 * Returns the effective count and whether the limit is exceeded.
 */
function checkSingleIdentity(
    identityType: "ip" | "fp",
    identityValue: string,
    rule: RateLimitRule,
    now: number
): { count: number; exceeded: boolean } {
    const key = buildKey(identityType, identityValue, rule.id);
    const bucket = getOrCreateBucket(key, rule.windowMs, now);
    const effectiveCount = getEffectiveCount(bucket, now);

    return {
        count: effectiveCount,
        exceeded: effectiveCount >= rule.maxRequests
    };
}

/**
 * Increment the counter for a single identity.
 */
function incrementSingleIdentity(
    identityType: "ip" | "fp",
    identityValue: string,
    rule: RateLimitRule,
    now: number
): void {
    const key = buildKey(identityType, identityValue, rule.id);
    const bucket = getOrCreateBucket(key, rule.windowMs, now);
    bucket.currentCount++;
}

/**
 * Main rate limit check function.
 *
 * @param identity - Client identity (IP + fingerprint)
 * @param pathname - Request pathname
 * @param method   - HTTP method
 * @param config   - Rate limit configuration
 * @param isAdmin  - Whether the request is from an admin with bypass cookie
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkRateLimit(
    identity: RateLimitIdentity,
    pathname: string,
    method: string,
    config?: RateLimitConfig,
    isAdmin = false
): Promise<RateLimitResult> {
    const now = Date.now();
    const cfg = config || (await loadRateLimitConfig());

    // Global kill switch
    if (!cfg.globalEnabled) {
        return {
            allowed: true,
            limit: 0,
            remaining: 0,
            resetAt: 0,
            retryAfter: 0,
            ruleId: "disabled",
            ruleName: "Rate Limiting Disabled",
            triggeredBy: null,
            deviceName: identity.deviceName
        };
    }

    // Bypass paths (static assets, internal APIs)
    if (isRateLimitBypassPath(pathname)) {
        return {
            allowed: true,
            limit: 0,
            remaining: 0,
            resetAt: 0,
            retryAfter: 0,
            ruleId: "bypass",
            ruleName: "Bypass Path",
            triggeredBy: null,
            deviceName: identity.deviceName
        };
    }

    // Whitelist checks
    if (identity.ip && cfg.whitelistedIPs.includes(identity.ip)) {
        return {
            allowed: true,
            limit: 0,
            remaining: 0,
            resetAt: 0,
            retryAfter: 0,
            ruleId: "whitelist",
            ruleName: "Whitelisted IP",
            triggeredBy: null,
            deviceName: identity.deviceName
        };
    }
    if (identity.fingerprint && cfg.whitelistedFingerprints.includes(identity.fingerprint)) {
        return {
            allowed: true,
            limit: 0,
            remaining: 0,
            resetAt: 0,
            retryAfter: 0,
            ruleId: "whitelist",
            ruleName: "Whitelisted Fingerprint",
            triggeredBy: null,
            deviceName: identity.deviceName
        };
    }
    if (identity.deviceName && cfg.whitelistedDeviceNames?.includes(identity.deviceName)) {
        return {
            allowed: true,
            limit: 0,
            remaining: 0,
            resetAt: 0,
            retryAfter: 0,
            ruleId: "whitelist",
            ruleName: "Whitelisted Device Name",
            triggeredBy: null,
            deviceName: identity.deviceName
        };
    }

    // Resolve which rule applies
    const rule = resolveRule(pathname, method, cfg);

    // Admin bypass
    if (isAdmin && rule.bypassForAdmins) {
        return {
            allowed: true,
            limit: rule.maxRequests,
            remaining: rule.maxRequests,
            resetAt: 0,
            retryAfter: 0,
            ruleId: rule.id,
            ruleName: rule.name,
            triggeredBy: null,
            deviceName: identity.deviceName
        };
    }

    // No identity available — allow but don't track
    if (!identity.ip && !identity.fingerprint) {
        return {
            allowed: true,
            limit: rule.maxRequests,
            remaining: rule.maxRequests,
            resetAt: 0,
            retryAfter: 0,
            ruleId: rule.id,
            ruleName: rule.name,
            triggeredBy: null,
            deviceName: identity.deviceName
        };
    }

    // Check rate limits based on identity mode
    let ipResult: { count: number; exceeded: boolean } | null = null;
    let fpResult: { count: number; exceeded: boolean } | null = null;

    const shouldCheckIp = identity.ip && (rule.identityMode === "ip" || rule.identityMode === "both");
    const shouldCheckFp = identity.fingerprint && (rule.identityMode === "fingerprint" || rule.identityMode === "both");

    if (shouldCheckIp) {
        ipResult = checkSingleIdentity("ip", identity.ip!, rule, now);
    }
    if (shouldCheckFp) {
        fpResult = checkSingleIdentity("fp", identity.fingerprint!, rule, now);
    }

    // Determine if blocked
    let blocked = false;
    let triggeredBy: "ip" | "fingerprint" | null = null;
    let effectiveCount = 0;

    if (ipResult?.exceeded) {
        blocked = true;
        triggeredBy = "ip";
        effectiveCount = ipResult.count;
    }
    if (fpResult?.exceeded) {
        blocked = true;
        triggeredBy = triggeredBy || "fingerprint";
        effectiveCount = Math.max(effectiveCount, fpResult?.count || 0);
    }

    if (!blocked) {
        // Not blocked — increment counters
        if (shouldCheckIp) {
            incrementSingleIdentity("ip", identity.ip!, rule, now);
        }
        if (shouldCheckFp) {
            incrementSingleIdentity("fp", identity.fingerprint!, rule, now);
        }

        // Use the highest count for remaining calculation
        effectiveCount = Math.max(ipResult?.count || 0, fpResult?.count || 0);
    }

    // Calculate reset time
    const windowEndMs = now + rule.windowMs;
    const resetAtSec = Math.ceil(windowEndMs / 1000);
    const retryAfterSec = blocked ? Math.ceil(rule.windowMs / 1000) : 0;

    return {
        allowed: !blocked,
        limit: rule.maxRequests,
        remaining: Math.max(0, rule.maxRequests - effectiveCount - (blocked ? 0 : 1)),
        resetAt: resetAtSec,
        retryAfter: retryAfterSec,
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredBy,
        deviceName: identity.deviceName
    };
}

// ── Utility: Apply rate limit headers to a response ──────────────────────────

/**
 * Apply standard rate limit headers to a NextResponse.
 * Headers follow the IETF RateLimit header fields draft.
 */
export function applyRateLimitHeaders(
    headers: { set(name: string, value: string): void },
    result: RateLimitResult
): void {
    if (result.ruleId === "disabled" || result.ruleId === "bypass" || result.ruleId === "whitelist") {
        return; // Don't expose rate limit headers for bypassed requests
    }

    headers.set("X-RateLimit-Limit", String(result.limit));
    headers.set("X-RateLimit-Remaining", String(result.remaining));
    headers.set("X-RateLimit-Reset", String(result.resetAt));
    headers.set("X-RateLimit-Policy", `${result.limit};w=${Math.ceil(result.retryAfter || 60)}`);

    if (!result.allowed) {
        headers.set("Retry-After", String(result.retryAfter));
    }
}

// ── Store stats (for admin/debugging) ────────────────────────────────────────

export function getStoreStats(): { size: number; maxSize: number } {
    return { size: store.size, maxSize: MAX_ENTRIES };
}

// ── Test helpers ─────────────────────────────────────────────────────────────

export function __resetEngineTestState(): void {
    store.clear();
}
