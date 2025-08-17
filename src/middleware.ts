import { NextResponse, NextRequest } from "next/server";
import { SignJWT, importJWK, jwtVerify } from "jose";
import { Config } from "@Config";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import {
    rateLimitMiddleware,
    defaultLimiter,
    strictLimiter,
    publicLimiter,
    contactLimiter
} from "@Library/rate-limit";

const CSRF_KEY = Config.Env.TRACE_SIGNATURE || "CSRF_KEY_PLACEHOLDER";

const RATE_LIMIT_ROUTES = {
    "/api/contact": contactLimiter,
    "/api/auth": strictLimiter,
    "/api/admin": strictLimiter,
    "/api/trace": publicLimiter,
    "/api/sitemap": publicLimiter,
    "/api/robots": publicLimiter
} as const;

export async function middleware(req: NextRequest) {
    const ModifiedHeaders = new Headers(req.headers);
    ModifiedHeaders.set("x-url", req.url);

    if (req.nextUrl.pathname.startsWith("/api")) {
        const limiter =
            Object.entries(RATE_LIMIT_ROUTES).find(([route]) =>
                req.nextUrl.pathname.startsWith(route)
            )?.[1] || defaultLimiter;

        const rateLimitResponse = await rateLimitMiddleware(req, limiter);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        const csrfExcludedRoutes = [
            "/api/trace",
            "/api/sitemap",
            "/api/robots",
            "/api/auth/connect",
            "/api/auth/callback",
            "/api/auth/disconnect",
            "/api/timetable",
            "/api/timetable/*"
        ];

        // Support for regex patterns in excluded routes
        const csrfExcludedRegexRoutes = [
            /^\/api\/timetable(\/.*)?$/,
            /^\/api\/auth\/(connect|callback|disconnect)$/
        ];

        const isExcludedRoute = csrfExcludedRoutes.some(
            (route) =>
                req.nextUrl.pathname === route ||
                req.nextUrl.pathname.startsWith(route)
        ) || csrfExcludedRegexRoutes.some(
            (regex) => regex.test(req.nextUrl.pathname)
        );

        if (isExcludedRoute) {
            return NextResponse.next({
                request: { headers: ModifiedHeaders }
            });
        }

        const csrfTokenFromHeader = req.headers.get("x-csrf");
        const csrfTokenFromCookie = req.cookies.get(
            `${Config.Cookie_Prefix}csrf`
        );

        if (!csrfTokenFromHeader) {
            return ControllerResponseMap({
                Status: 0,
                Message: "CSRF token missing from headers",
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        if (!csrfTokenFromCookie) {
            return ControllerResponseMap({
                Status: 0,
                Message: "CSRF token missing from cookies",
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        if (csrfTokenFromHeader !== csrfTokenFromCookie.value) {
            return ControllerResponseMap({
                Status: 0,
                Message: "CSRF token mismatch",
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        try {
            const verified = await jwtVerify(
                csrfTokenFromCookie?.value ?? "",
                await importJWK({ kty: "oct", k: CSRF_KEY }),
                {
                    algorithms: ["HS256"]
                }
            );

            if (!verified) {
                return ControllerResponseMap({
                    Status: 0,
                    Message: "Invalid CSRF token signature",
                    StatusCode: "INVALID_AUTHORIZATION",
                    StatusNumber: 403
                });
            }
        } catch (error) {
            return ControllerResponseMap({
                Status: 0,
                Message: "CSRF token verification failed",
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }
    }

    return NextResponse.next({
        request: { headers: ModifiedHeaders }
    });
}

export const config = {
    matcher: "/(.*)"
};
