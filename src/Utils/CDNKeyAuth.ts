/**
 * CDN API Key Rate-Limiter
 *
 * Validates an incoming API key and enforces rate limits using MongoDB
 * sliding-window counters stored in CDNRateWindow.
 *
 * Usage:
 *   import { validateCDNKey, consumeRateLimit } from "@Utils/CDNKeyAuth";
 *
 *   const validation = await validateCDNKey(req);
 *   if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: validation.status });
 *
 *   const rl = await consumeRateLimit(validation.key!, "download");
 *   if (!rl.allowed) return NextResponse.json({ error: rl.error, retryAfter: rl.retryAfter }, { status: 429 });
 */

import { createHash } from "crypto";
import { NextRequest } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { CDNAPIKey, ICDNAPIKey } from "@Models/CDNAPIKey";
import { CDNRateWindow } from "@Models/CDNRateWindow";

// ── Key extraction ────────────────────────────────────────────────────────────

/**
 * Extract the API key from the request.
 * Checks (in order):
 *   1. Authorization: Bearer <key>
 *   2. X-CDN-Key: <key>   header
 *   3. ?api_key=<key>     query param
 */
export function extractAPIKey(req: NextRequest): string | null {
    const auth = req.headers.get("authorization") || "";
    if (auth.startsWith("Bearer ")) {
        const key = auth.slice(7).trim();
        if (key) return key;
    }
    const header = req.headers.get("x-cdn-key");
    if (header) return header.trim();

    const query = req.nextUrl.searchParams.get("api_key");
    if (query) return query.trim();

    return null;
}

// ── Key hashing ───────────────────────────────────────────────────────────────

export function hashAPIKey(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
}

// ── Validation result ─────────────────────────────────────────────────────────

export interface KeyValidationResult {
    ok: boolean;
    key?: ICDNAPIKey;
    error?: string;
    status?: number;
}

export async function validateCDNKey(req: NextRequest): Promise<KeyValidationResult> {
    const raw = extractAPIKey(req);
    if (!raw) {
        return { ok: false, error: "Missing API key. Supply via Authorization: Bearer <key>, X-CDN-Key header, or ?api_key= query param.", status: 401 };
    }

    if (!raw.startsWith("cdn_")) {
        return { ok: false, error: "Invalid API key format.", status: 401 };
    }

    await dbConnect();

    const hash = hashAPIKey(raw);
    const keyDoc = await CDNAPIKey.findOne({ keyHash: hash }).lean() as ICDNAPIKey | null;

    if (!keyDoc) {
        return { ok: false, error: "Invalid API key.", status: 401 };
    }

    if (keyDoc.status === "revoked") {
        return { ok: false, error: "API key has been revoked.", status: 403 };
    }

    if (keyDoc.status === "suspended") {
        return { ok: false, error: "API key is suspended. Contact support.", status: 403 };
    }

    if (keyDoc.status === "expired") {
        return { ok: false, error: "API key has expired. Please request a new key.", status: 403 };
    }

    // Check expiry (if set)
    if (keyDoc.expiresAt && new Date() > keyDoc.expiresAt) {
        // Mark expired in DB (best-effort, non-blocking)
        CDNAPIKey.updateOne({ keyId: keyDoc.keyId }, { $set: { status: "expired" } }).catch(() => {});
        return { ok: false, error: "API key has expired.", status: 403 };
    }

    return { ok: true, key: keyDoc };
}

// ── Rate-limit window helpers ─────────────────────────────────────────────────

function bucketMinute(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function bucketHour(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}`;
}

function bucketDay(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
    return n.toString().padStart(2, "0");
}

function expiresAt(type: "minute" | "hour" | "day"): Date {
    const now = Date.now();
    const offsets: Record<string, number> = {
        minute: 2 * 60 * 1000,
        hour:   2 * 60 * 60 * 1000,
        day:    2 * 24 * 60 * 60 * 1000,
    };
    return new Date(now + offsets[type]);
}

// ── Rate-limit consumption ────────────────────────────────────────────────────

export interface RateLimitResult {
    allowed: boolean;
    error?: string;
    retryAfter?: number;         // seconds until the window resets
    remaining?: {
        minute: number;
        hour:   number;
        day:    number;
    };
}

type EndpointKind = "upload" | "download" | "general";

/**
 * Increment rate-limit counters for the given key and check all three windows.
 * Returns { allowed: false } with retryAfter if any window is exceeded.
 *
 * @param key    Validated ICDNAPIKey document
 * @param kind   "upload" | "download" | "general"
 */
export async function consumeRateLimit(key: ICDNAPIKey, kind: EndpointKind): Promise<RateLimitResult> {
    const { rateLimit, keyId } = key;

    // Check endpoint permissions
    if (kind === "upload" && !rateLimit.allowUpload) {
        return { allowed: false, error: "This API key does not have upload permission.", retryAfter: 0 };
    }
    if (kind === "download" && !rateLimit.allowDownload) {
        return { allowed: false, error: "This API key does not have download permission.", retryAfter: 0 };
    }

    const now = new Date();

    // Atomically increment all three windows in parallel
    const [minDoc, hourDoc, dayDoc] = await Promise.all([
        CDNRateWindow.findOneAndUpdate(
            { keyId, windowType: "minute", bucket: bucketMinute() },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: expiresAt("minute") } },
            { upsert: true, new: true }
        ).lean(),
        CDNRateWindow.findOneAndUpdate(
            { keyId, windowType: "hour", bucket: bucketHour() },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: expiresAt("hour") } },
            { upsert: true, new: true }
        ).lean(),
        CDNRateWindow.findOneAndUpdate(
            { keyId, windowType: "day", bucket: bucketDay() },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: expiresAt("day") } },
            { upsert: true, new: true }
        ).lean(),
    ]);

    const minuteCount = (minDoc as any)?.count ?? 1;
    const hourCount   = (hourDoc as any)?.count ?? 1;
    const dayCount    = (dayDoc as any)?.count  ?? 1;

    // Async update global counters + lastUsedAt (fire-and-forget)
    const counterField = kind === "upload" ? "totalUploads" : kind === "download" ? "totalDownloads" : "totalRequests";
    CDNAPIKey.updateOne(
        { keyId },
        { $inc: { totalRequests: 1, [counterField]: kind !== "general" ? 1 : 0 }, $set: { lastUsedAt: now } }
    ).catch(() => {});

    // Check limits
    if (minuteCount > rateLimit.requestsPerMinute) {
        return {
            allowed: false,
            error: `Rate limit exceeded: ${rateLimit.requestsPerMinute} requests/minute.`,
            retryAfter: 60 - now.getUTCSeconds(),
        };
    }
    if (hourCount > rateLimit.requestsPerHour) {
        return {
            allowed: false,
            error: `Rate limit exceeded: ${rateLimit.requestsPerHour} requests/hour.`,
            retryAfter: (60 - now.getUTCMinutes()) * 60,
        };
    }
    if (dayCount > rateLimit.requestsPerDay) {
        return {
            allowed: false,
            error: `Rate limit exceeded: ${rateLimit.requestsPerDay} requests/day.`,
            retryAfter: (24 - now.getUTCHours()) * 3600,
        };
    }

    return {
        allowed: true,
        remaining: {
            minute: Math.max(0, rateLimit.requestsPerMinute - minuteCount),
            hour:   Math.max(0, rateLimit.requestsPerHour   - hourCount),
            day:    Math.max(0, rateLimit.requestsPerDay    - dayCount),
        },
    };
}

// ── Rate limit headers ────────────────────────────────────────────────────────

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    if (!result.remaining) return {};
    return {
        "X-RateLimit-Remaining-Minute": String(result.remaining.minute),
        "X-RateLimit-Remaining-Hour":   String(result.remaining.hour),
        "X-RateLimit-Remaining-Day":    String(result.remaining.day),
    };
}
