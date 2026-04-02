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

// ── Fetch maintenance status with cache ─────────────────────────────────
async function getMaintenanceStatus(
    baseUrl: string
): Promise<MaintenanceCache> {
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
        const secret = new TextEncoder().encode(
            process.env.ADMIN_SIGNATURE ||
                process.env.NEXTAUTH_SECRET ||
                "fallback-secret-change-me"
        );
        const { payload } = await jwtVerify(bypassCookie, secret);
        return payload.isAdmin === true;
    } catch {
        return false;
    }
}

// ── Proxy (Next.js 16 equivalent of middleware) ─────────────────────────
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow whitelisted paths
    if (isBypassPath(pathname)) {
        return NextResponse.next();
    }

    // Build base URL for self-fetch
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const maintenance = await getMaintenanceStatus(baseUrl);

    // Site is live — pass through
    if (!maintenance.enabled) {
        return NextResponse.next();
    }

    // Check if requesting user is an admin with bypass cookie
    if (await isAdminBypassed(request)) {
        return NextResponse.next();
    }

    // ── Block non-admins during maintenance ──────────────────────────────
    if (pathname.startsWith("/api/")) {
        return NextResponse.json(
            {
                Status: 0,
                StatusCode: 503,
                Message: maintenance.message || "Site is currently under maintenance. Please try again later."
            },
            { status: 503 }
        );
    }

    // Redirect page requests to /maintenance
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    if (maintenance.message) {
        url.searchParams.set("message", maintenance.message);
    }
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mp3|woff|woff2|ttf|otf|eot)).*)"]
};
