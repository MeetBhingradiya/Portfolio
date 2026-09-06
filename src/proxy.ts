/**
 * Next.js Edge Middleware — Security, Rate Limiting & Maintenance Gate
 *
 * Request pipeline:
 *  1. Block disallowed HTTP methods (TRACE/TRACK/CONNECT) → 405
 *  2. Handle CORS preflight → 204
 *  3. CSRF origin validation → 403
 *  4. Rate limiting (IP + device fingerprint) → 429
 *  5. Bypass whitelisted paths
 *  6. Maintenance mode gate → 503/redirect
 *
 * Rate limit config is fetched from GitHub CDN and cached 24h in
 * production (no cache in dev). Identity tracked by both IP and
 * device fingerprint (canvas hash via x-device-fp header).
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isTrustedOrigin as isTrustedOriginValue } from "@Utils/origin";
import {
    extractIdentity,
    checkRateLimit,
    applyRateLimitHeaders
} from "@Library/RateLimit";
import { logSecurity, extractDeviceInfo } from "@Utils/DiscordLogger";

// ── Module-level cache (resets on Edge worker cold start) ────────────────
interface MaintenanceCache {
    enabled: boolean;
    message: string;
    ts: number;
}
let cache: MaintenanceCache = { enabled: false, message: "", ts: 0 };

const CACHE_TTL_MS = 60_000; // 60 seconds

const DISALLOWED_METHODS = new Set(["TRACE", "TRACK", "CONNECT"]);
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const CSRF_BYPASS_PREFIXES = [
    "/api/auth",
    "/api/maintenance-status",
    "/api/admin/is-admin",
    "/api/cdn",
    "/api/rate-limit-status"
];

const PUBLIC_DEVELOPER_API_PREFIXES = ["/api/cdn/external", "/api/cdn/applications"];

// ── Paths that are ALWAYS allowed through ───────────────────────────────
const BYPASS_PREFIXES = [
    "/_next",
    "/favicon",
    "/maintenance",
    "/api/maintenance-status",
    "/api/admin/maintenance",
    "/api/admin/is-admin",
    "/api/auth",
    "/api/cdn",
    "/api/rate-limit-status"
];

function isBypassPath(pathname: string): boolean {
    return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isCsrfBypassPath(pathname: string): boolean {
    return CSRF_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isApiPath(pathname: string): boolean {
    return pathname.startsWith("/api/");
}

function isMutatingMethod(method: string): boolean {
    return MUTATING_METHODS.has(method.toUpperCase());
}

function isDisallowedMethod(method: string): boolean {
    return DISALLOWED_METHODS.has(method.toUpperCase());
}

function isTrustedOrigin(origin: string): boolean {
    return isTrustedOriginValue(origin);
}

function isSameOrigin(origin: string, request: NextRequest): boolean {
    return origin === request.nextUrl.origin;
}

function shouldRejectCsrf(request: NextRequest): boolean {
    const origin = request.headers.get("origin");
    if (!origin) {
        return false;
    }
    return !isSameOrigin(origin, request) && !isTrustedOrigin(origin);
}

function isPublicDeveloperApiPath(pathname: string): boolean {
    if (PUBLIC_DEVELOPER_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
    }

    // Public CDN asset access route: /api/cdn/<assetId>
    return /^\/api\/cdn\/[^/]+$/.test(pathname);
}

function applyCorsHeaders(request: NextRequest, response: NextResponse, pathname: string): void {
    const origin = request.headers.get("origin");
    if (!origin) {
        return;
    }

    if (isPublicDeveloperApiPath(pathname)) {
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        response.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-CDN-Key"
        );
        return;
    }

    if (isSameOrigin(origin, request) || isTrustedOrigin(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        response.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, X-Requested-With, X-CSRF-Token"
        );
        response.headers.set("Vary", "Origin");
    }
}

function applySecurityHeaders(request: NextRequest, response: NextResponse, isApiRoute: boolean, pathname: string): NextResponse {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    response.headers.set("Origin-Agent-Cluster", "?1");
    response.headers.set("X-DNS-Prefetch-Control", "off");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

    if (request.nextUrl.protocol === "https:") {
        response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    if (isApiRoute) {
        response.headers.set("Cache-Control", "no-store");
        applyCorsHeaders(request, response, pathname);
    }

    return response;
}

// ── Fetch maintenance status with cache ─────────────────────────────────
async function getMaintenanceStatus(baseUrl: string): Promise<MaintenanceCache> {
    if (Date.now() - cache.ts < CACHE_TTL_MS) {
        return cache;
    }
    try {
        const res = await fetch(`${baseUrl}/api/maintenance-status`, {
            cache: "no-store"
        });
        if (res.ok) {
            const data = await res.json();
            cache = {
                enabled: !!data.maintenanceMode,
                message: data.maintenanceMessage || "",
                ts: Date.now()
            };
        }
    } catch {
        // Keep stale cache on network error rather than breaking the site
        cache = { ...cache, ts: Date.now() };
    }
    return cache;
}

// ── Verify admin bypass cookie ───────────────────────────────────────────
async function isAdminBypassed(request: NextRequest): Promise<boolean> {
    const bypassCookie = request.cookies.get("x_admin_bypass")?.value;
    if (!bypassCookie) return false;

    try {
        const secret = new TextEncoder().encode(process.env.ADMIN_SIGNATURE || process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me");
        const { payload } = await jwtVerify(bypassCookie, secret);
        return payload.isAdmin === true;
    } catch {
        return false;
    }
}

// ── Proxy (Next.js 16 equivalent of middleware) ─────────────────────────
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isApiRoute = isApiPath(pathname);
    const device = extractDeviceInfo(request.headers);

    // ── Step 1: Block disallowed HTTP methods ────────────────────────────
    if (isDisallowedMethod(request.method)) {
        logSecurity("blocked_method", {
            path: pathname,
            method: request.method,
            device,
            message: `Blocked disallowed HTTP method: ${request.method}`
        });
        const blockedMethod = NextResponse.json(
            {
                Status: 0,
                StatusCode: 405,
                Message: "HTTP method not allowed"
            },
            { status: 405 }
        );
        return applySecurityHeaders(request, blockedMethod, isApiRoute, pathname);
    }

    // ── Step 2: Handle CORS preflight ────────────────────────────────────
    if (isApiRoute && request.method.toUpperCase() === "OPTIONS") {
        const preflight = new NextResponse(null, { status: 204 });
        return applySecurityHeaders(request, preflight, true, pathname);
    }

    // ── Step 3: CSRF origin validation ───────────────────────────────────
    if (isApiRoute && isMutatingMethod(request.method) && !isCsrfBypassPath(pathname) && shouldRejectCsrf(request)) {
        logSecurity("csrf_blocked", {
            path: pathname,
            method: request.method,
            origin: request.headers.get("origin") || "unknown",
            device,
            message: `CSRF origin rejected: ${request.headers.get("origin")}`
        });
        const csrfBlocked = NextResponse.json(
            {
                Status: 0,
                StatusCode: 403,
                Message: "Forbidden request origin"
            },
            { status: 403 }
        );
        return applySecurityHeaders(request, csrfBlocked, true, pathname);
    }

    // ── Step 4: Rate limiting (IP + device fingerprint) ──────────────────
    const identity = extractIdentity(request.headers);
    const isAdmin = await isAdminBypassed(request);

    const rateLimitResult = await checkRateLimit(
        identity,
        pathname,
        request.method,
        undefined, // uses cached config from GitHub CDN
        isAdmin
    );

    if (!rateLimitResult.allowed) {
        logSecurity("rate_limited", {
            path: pathname,
            method: request.method,
            device,
            ruleId: rateLimitResult.ruleId,
            ruleName: rateLimitResult.ruleName,
            remaining: rateLimitResult.remaining,
            retryAfter: rateLimitResult.retryAfter,
            triggeredBy: rateLimitResult.triggeredBy || undefined,
            message: `Rate limit exceeded: ${rateLimitResult.ruleName} (${rateLimitResult.ruleId})`
        });
        const rateLimited = NextResponse.json(
            {
                Status: 0,
                StatusCode: 429,
                Message: rateLimitResult.ruleName
                    ? `Rate limit exceeded (${rateLimitResult.ruleName}). Please try again later.`
                    : "Too many requests. Please try again later.",
                RetryAfter: rateLimitResult.retryAfter
            },
            { status: 429 }
        );
        applyRateLimitHeaders(rateLimited.headers, rateLimitResult);
        return applySecurityHeaders(request, rateLimited, isApiRoute, pathname);
    }

    // ── Step 5: Always allow whitelisted paths ───────────────────────────
    if (isBypassPath(pathname)) {
        const bypassResponse = applySecurityHeaders(request, NextResponse.next(), isApiRoute, pathname);
        applyRateLimitHeaders(bypassResponse.headers, rateLimitResult);
        return bypassResponse;
    }

    // Build base URL for self-fetch
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const maintenance = await getMaintenanceStatus(baseUrl);

    // ── Step 6: Maintenance mode gate ────────────────────────────────────
    // Site is live — pass through with rate limit headers
    if (!maintenance.enabled) {
        const liveResponse = applySecurityHeaders(request, NextResponse.next(), isApiRoute, pathname);
        applyRateLimitHeaders(liveResponse.headers, rateLimitResult);
        return liveResponse;
    }

    // Admin with bypass cookie — allow through during maintenance
    if (isAdmin) {
        logSecurity("admin_bypass", {
            path: pathname,
            method: request.method,
            device,
            message: "Admin bypass during maintenance mode"
        });
        const adminResponse = applySecurityHeaders(request, NextResponse.next(), isApiRoute, pathname);
        applyRateLimitHeaders(adminResponse.headers, rateLimitResult);
        return adminResponse;
    }

    // ── Block non-admins during maintenance ──────────────────────────────
    if (pathname.startsWith("/api/")) {
        logSecurity("maintenance_blocked", {
            path: pathname,
            method: request.method,
            device,
            message: "Non-admin blocked during maintenance mode"
        });
        const maintenanceBlocked = NextResponse.json(
            {
                Status: 0,
                StatusCode: 503,
                Message: maintenance.message || "Site is currently under maintenance. Please try again later."
            },
            { status: 503 }
        );
        return applySecurityHeaders(request, maintenanceBlocked, true, pathname);
    }

    // Redirect page requests to /maintenance
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    if (maintenance.message) {
        url.searchParams.set("message", maintenance.message);
    }
    return applySecurityHeaders(request, NextResponse.redirect(url), false, pathname);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mp3|woff|woff2|ttf|otf|eot)).*)"]
};

export function __resetProxyTestState(): void {
    cache = { enabled: false, message: "", ts: 0 };
}
