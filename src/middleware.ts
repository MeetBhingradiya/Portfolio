import { NextResponse, NextRequest } from 'next/server';
import { SignJWT, importJWK, jwtVerify } from 'jose';
import { Config } from '@Config';
import { ControllerResponseMap } from '@Utils';
import { RateLimiter } from '@Utils/RateLimit';
import { handleEmergencyShutdown } from '@Middleware/EmergencyMiddleware';

const CSRF_KEY = Config.Env.TRACE_SIGNATURE || "CSRF_KEY_PLACEHOLDER";

export async function middleware(req: NextRequest) {
    // Check for emergency shutdown first
    // const emergencyResponse = await handleEmergencyShutdown(req, CURRENT_APPLICATION_ID);
    // if (emergencyResponse) {
    //     return emergencyResponse; // Return early if in emergency shutdown mode
    // }

    const csrfToken = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('20m')
        .sign(await importJWK({ kty: 'oct', k: CSRF_KEY }));

    const ModifiedHeaders = new Headers(req.headers);
    ModifiedHeaders.set('x-url', req.url);
    const response = NextResponse.next({
        request: {
            headers: ModifiedHeaders
        }
    });

    if (req.nextUrl.pathname.startsWith('/api')) {
        const rateLimit: any = await RateLimiter(req);

        if (rateLimit instanceof NextResponse) {
            return rateLimit;
        }

        const csrfTokenFromHeader = req.headers.get('x-csrf');
        const csrfTokenFromCookie = req.cookies.get(`${Config.Cookie_Prefix}csrf`);
        const excludedRoutes = [
            // '/api/ip',
            '/api/trace',
            '/api/sitemap',
            '/api/sitemap/*',
            '/api/robots'
        ];

        if (excludedRoutes.some(route => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route))) {
            return NextResponse.next({
                request: {
                    headers: ModifiedHeaders
                }
            });
        }

        if (!csrfTokenFromHeader) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Authorization',
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        if (!csrfTokenFromCookie) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Authorization',
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        if (csrfTokenFromHeader !== csrfTokenFromCookie.value) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Authorization',
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        try {
            const verified = await jwtVerify(
                csrfTokenFromCookie?.value ?? "",
                await importJWK({ kty: 'oct', k: CSRF_KEY }), {
                algorithms: ['HS256'],
            });

            if (!verified) {
                return ControllerResponseMap({
                    Status: 0,
                    Message: 'Invalid Authorization',
                    StatusCode: 'INVALID_AUTHORIZATION',
                    StatusNumber: 403
                });
            }
        } catch (error) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Authorization',
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }
    }

    return response;
}

export const config = {
    matcher: '/(.*)',
};