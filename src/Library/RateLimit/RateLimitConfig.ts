/**
 * Rate Limit Configuration Schema & Loader
 *
 * Defines the configuration structure for rate limiting rules and provides
 * a loader that fetches config from GitHub CDN raw URLs with environment-aware
 * caching (24h production, no cache in development).
 *
 * Edge-runtime compatible — no Node.js-only dependencies.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitRule {
    /** Unique identifier for this rule */
    id: string;
    /** Human-readable name */
    name: string;
    /** Whether this rule is active */
    enabled: boolean;

    // ── Targeting ──────────────────────────────────────────────────────────
    /** Exact endpoint paths this rule applies to, e.g. ["/api/auth/login"] */
    endpoints: string[];
    /** Glob-like prefix patterns, e.g. ["/api/admin/*"] */
    endpointPatterns: string[];
    /** Named group for grouping endpoints, e.g. "auth", "cdn", "public" */
    group?: string;
    /** HTTP methods this rule applies to (empty = all methods) */
    methods?: string[];

    // ── Limits ─────────────────────────────────────────────────────────────
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum requests allowed per window */
    maxRequests: number;

    // ── Identity ───────────────────────────────────────────────────────────
    /** How to identify the client: "ip", "fingerprint", or "both" (stricter) */
    identityMode: "ip" | "fingerprint" | "both";

    // ── Bypass ─────────────────────────────────────────────────────────────
    /** If true, admin-bypassed requests skip this rule */
    bypassForAdmins: boolean;

    // ── Response ───────────────────────────────────────────────────────────
    /** Custom message returned when rate limited */
    customMessage?: string;

    /** Priority — higher number = evaluated first (for overlapping rules) */
    priority: number;
}

export interface RateLimitConfig {
    /** Schema version for forward compatibility */
    version: number;
    /** ISO 8601 timestamp of last update */
    updatedAt: string;
    /** Global kill switch for rate limiting */
    globalEnabled: boolean;
    /** Fallback rule for endpoints that don't match any specific rule */
    defaultRule: RateLimitRule;
    /** Specific rate limit rules */
    rules: RateLimitRule[];

    // ── Global bypass lists ────────────────────────────────────────────────
    /** IP addresses that bypass all rate limiting */
    whitelistedIPs: string[];
    /** Device fingerprint hashes that bypass all rate limiting */
    whitelistedFingerprints: string[];
    /** Device names that bypass all rate limiting */
    whitelistedDeviceNames?: string[];
}

// ── Default Configuration ────────────────────────────────────────────────────

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    version: 1,
    updatedAt: new Date().toISOString(),
    globalEnabled: true,
    defaultRule: {
        id: "default",
        name: "Global Default",
        enabled: true,
        endpoints: [],
        endpointPatterns: [],
        group: "default",
        methods: [],
        windowMs: 60_000, // 1 minute
        maxRequests: 100, // 100 req/min
        identityMode: "both",
        bypassForAdmins: true,
        customMessage: "Too many requests. Please try again later.",
        priority: 0
    },
    rules: [
        {
            id: "auth-login",
            name: "Auth Login",
            enabled: true,
            endpoints: ["/api/auth/sign-in", "/api/auth/sign-up"],
            endpointPatterns: [],
            group: "auth",
            methods: ["POST"],
            windowMs: 900_000, // 15 minutes
            maxRequests: 10, // 10 attempts per 15 min
            identityMode: "both",
            bypassForAdmins: true,
            customMessage: "Too many login attempts. Please wait 15 minutes.",
            priority: 100
        },
        {
            id: "api-general",
            name: "API General",
            enabled: true,
            endpoints: [],
            endpointPatterns: ["/api/*"],
            group: "api",
            methods: [],
            windowMs: 60_000, // 1 minute
            maxRequests: 60, // 60 req/min
            identityMode: "both",
            bypassForAdmins: true,
            priority: 10
        },
        {
            id: "cdn-public",
            name: "CDN Public Access",
            enabled: true,
            endpoints: [],
            endpointPatterns: ["/api/cdn/*"],
            group: "cdn",
            methods: ["GET"],
            windowMs: 60_000,
            maxRequests: 120,
            identityMode: "ip",
            bypassForAdmins: true,
            priority: 50
        }
    ],
    whitelistedIPs: [],
    whitelistedFingerprints: [],
    whitelistedDeviceNames: []
};

// ── Config Cache ─────────────────────────────────────────────────────────────

interface ConfigCache {
    config: RateLimitConfig;
    fetchedAt: number;
}

let configCache: ConfigCache | null = null;

/** 24 hours in production, 0 in development */
function getCacheTtlMs(): number {
    // Edge runtime: process.env is available
    const isDev =
        (typeof process !== "undefined" && process.env?.NODE_ENV === "development") ||
        (typeof process !== "undefined" && process.env?.VERCEL_ENV === "development");
    return isDev ? 0 : 86_400_000; // 24h
}

// ── Config Loader ────────────────────────────────────────────────────────────

/**
 * Build the raw GitHub CDN URL for the rate limit config file.
 * Uses raw.githubusercontent.com which serves files with GitHub CDN caching.
 */
function buildConfigUrl(): string | null {
    if (typeof process === "undefined") return null;

    const owner = process.env.CDN_GITHUB_OWNER;
    const prefix = process.env.CDN_GITHUB_REPO_PREFIX || "PrivateCloud";
    const branch = process.env.CDN_GITHUB_BRANCH || "main";

    if (!owner) return null;

    // Use the first repo in the prefix series for config storage
    return `https://raw.githubusercontent.com/${owner}/${prefix}-1/${branch}/config/rate-limits.json`;
}

/**
 * Validate that a parsed object conforms to the RateLimitConfig schema.
 * Performs structural validation without importing heavy libraries.
 */
function isValidConfig(obj: unknown): obj is RateLimitConfig {
    if (!obj || typeof obj !== "object") return false;
    const c = obj as Record<string, unknown>;

    return (
        typeof c.version === "number" &&
        typeof c.globalEnabled === "boolean" &&
        typeof c.updatedAt === "string" &&
        c.defaultRule !== null &&
        typeof c.defaultRule === "object" &&
        Array.isArray(c.rules) &&
        Array.isArray(c.whitelistedIPs) &&
        Array.isArray(c.whitelistedFingerprints) &&
        (c.whitelistedDeviceNames === undefined || Array.isArray(c.whitelistedDeviceNames))
    );
}

/**
 * Load rate limit configuration with layered caching:
 *
 * 1. In-memory cache (per-isolate, resets on cold start)
 * 2. GitHub CDN raw URL (24h cache in production, no cache in dev)
 * 3. Hardcoded defaults (if fetch fails)
 *
 * @param forceRefresh - Bypass cache and fetch fresh config
 */
export async function loadRateLimitConfig(forceRefresh = false): Promise<RateLimitConfig> {
    const ttl = getCacheTtlMs();

    // Return cached config if still valid
    if (!forceRefresh && configCache && Date.now() - configCache.fetchedAt < ttl) {
        return configCache.config;
    }

    const url = buildConfigUrl();
    if (!url) {
        // No GitHub CDN configured — use defaults
        configCache = { config: DEFAULT_RATE_LIMIT_CONFIG, fetchedAt: Date.now() };
        return configCache.config;
    }

    try {
        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "Accept": "application/json",
                "User-Agent": "MeetBhingradiya-RateLimit/1.0"
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (isValidConfig(data)) {
                configCache = { config: data, fetchedAt: Date.now() };
                return configCache.config;
            }
        }
    } catch {
        // Network error — fall through to defaults/stale cache
    }

    // Return stale cache if available, otherwise defaults
    if (configCache) {
        configCache = { ...configCache, fetchedAt: Date.now() };
        return configCache.config;
    }

    configCache = { config: DEFAULT_RATE_LIMIT_CONFIG, fetchedAt: Date.now() };
    return configCache.config;
}

/**
 * Force-replace the in-memory cached config.
 * Used by the admin API when config is updated locally.
 */
export function setRateLimitConfigCache(config: RateLimitConfig): void {
    configCache = { config, fetchedAt: Date.now() };
}

/**
 * Clear the in-memory config cache.
 * Forces next call to loadRateLimitConfig to re-fetch.
 */
export function clearRateLimitConfigCache(): void {
    configCache = null;
}

// ── Rule Matching ────────────────────────────────────────────────────────────

/**
 * Match a glob-like pattern against a pathname.
 * Supports trailing `*` for prefix matching:
 *   "/api/admin/*" matches "/api/admin/users", "/api/admin/roles", etc.
 *   "/api/auth/login" matches exactly "/api/auth/login"
 */
function matchPattern(pattern: string, pathname: string): boolean {
    if (pattern === pathname) return true;

    if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -2);
        return pathname === prefix || pathname.startsWith(prefix + "/");
    }

    if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1);
        return pathname.startsWith(prefix);
    }

    return false;
}

/**
 * Find the best matching rate limit rule for a given request.
 *
 * Priority order:
 *   1. Exact endpoint match (highest priority by rule.priority)
 *   2. Pattern match
 *   3. Default rule (fallback)
 *
 * @param pathname - Request pathname (e.g., "/api/auth/login")
 * @param method - HTTP method (e.g., "POST")
 * @param config - Current rate limit configuration
 */
export function resolveRule(
    pathname: string,
    method: string,
    config: RateLimitConfig
): RateLimitRule {
    const upperMethod = method.toUpperCase();

    // Filter to enabled rules only, sorted by priority descending
    const candidates = config.rules
        .filter((r) => r.enabled)
        .sort((a, b) => b.priority - a.priority);

    for (const rule of candidates) {
        // Check method restriction
        if (rule.methods && rule.methods.length > 0) {
            if (!rule.methods.some((m) => m.toUpperCase() === upperMethod)) {
                continue;
            }
        }

        // Check exact endpoint match
        if (rule.endpoints.length > 0 && rule.endpoints.includes(pathname)) {
            return rule;
        }

        // Check pattern match
        if (rule.endpointPatterns.length > 0) {
            if (rule.endpointPatterns.some((p) => matchPattern(p, pathname))) {
                return rule;
            }
        }
    }

    return config.defaultRule;
}

// ── Test helpers ─────────────────────────────────────────────────────────────

export function __resetConfigTestState(): void {
    configCache = null;
}
