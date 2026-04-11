/**
 * Next.js Edge Middleware — Maintenance Mode Gate
 *
 * When maintenance mode is active:
 *  • Page requests → redirect to /maintenance
 *  • API requests  → 503 JSON response
 *  • Admin with valid `x_admin_bypass` cookie → always allowed through
 *
 * Maintenance state is fetched from /api/maintenance-status and cached
 * in module-level memory for CACHE_TTL_MS milliseconds to avoid hitting
 * the database on every request.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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
    "/api/cdn"
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
    "/api/cdn"
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

function getTrustedOrigins(): string[] {
    return (process.env.TRUSTED_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

function isTrustedOrigin(origin: string): boolean {
    return getTrustedOrigins().includes(origin);
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
        const secret = new TextEncoder().encode(process.env.ADMIN_SIGNATURE || process.env.NEXTAUTH_SECRET || "fallback-secret-change-me");
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

    if (isDisallowedMethod(request.method)) {
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

    if (isApiRoute && request.method.toUpperCase() === "OPTIONS") {
        const preflight = new NextResponse(null, { status: 204 });
        return applySecurityHeaders(request, preflight, true, pathname);
    }

    if (isApiRoute && isMutatingMethod(request.method) && !isCsrfBypassPath(pathname) && shouldRejectCsrf(request)) {
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

    // Always allow whitelisted paths
    if (isBypassPath(pathname)) {
        return applySecurityHeaders(request, NextResponse.next(), isApiRoute, pathname);
    }

    // Build base URL for self-fetch
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const maintenance = await getMaintenanceStatus(baseUrl);

    // Site is live — pass through
    if (!maintenance.enabled) {
        return applySecurityHeaders(request, NextResponse.next(), isApiRoute, pathname);
    }

    // Check if requesting user is an admin with bypass cookie
    if (await isAdminBypassed(request)) {
        return applySecurityHeaders(request, NextResponse.next(), isApiRoute, pathname);
    }

    // ── Block non-admins during maintenance ──────────────────────────────
    if (pathname.startsWith("/api/")) {
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
