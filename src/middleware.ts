import { NextResponse, NextRequest } from 'next/server';
import { SignJWT, importJWK, jwtVerify } from 'jose';
import { Config } from '@Config';
import { ControllerResponseMap } from '@Utils';
// import { RateLimiter } from '@Utils/RateLimit';
import { handleEmergencyShutdown } from '@Middleware/EmergencyMiddleware';

const CSRF_KEY = Config.Env.TRACE_SIGNATURE;
const CURRENT_APPLICATION_ID = Config.Env.APPLICATION_ID || '';

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
        // const rateLimit:any = await RateLimiter(req);

        // if (rateLimit instanceof NextResponse) {
        //     return rateLimit;
        // }

        const csrfTokenFromHeader = req.headers.get('x-csrf');
        const csrfTokenFromCookie = req.cookies.get(`${Config.Cookie_Prefix}csrf`);        const excludedRoutes = [
            // '/api/ip',
            '/api/trace',
            '/api/sitemap',
            '/api/sitemap/*',
            '/api/robots',
            '/api/bookmarks',
            '/api/contact', // Allow contact form submissions
            '/api/tickets', // Allow ticket system access
            '/api/admin/tickets', // Allow admin ticket management (auth handled in route)
            '/api/developer/emergency/disable' // Allow emergency recovery endpoint
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
                Message: 'Invalid Authorization by HEADER',
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        if (!csrfTokenFromCookie) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Authorization by COOKIE',
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        if (csrfTokenFromHeader !== csrfTokenFromCookie.value) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Authorization by TOKEN',
                StatusCode: "INVALID_AUTHORIZATION",
                StatusNumber: 403
            });
        }

        try {
            const verified = await jwtVerify(csrfTokenFromCookie?.value ?? "", await importJWK({ kty: 'oct', k: CSRF_KEY }), {
                algorithms: ['HS256'],
            });

            if (!verified) {
                return ControllerResponseMap({
                    Status: 0,
                    Message: 'Invalid Authorization by VERIFY',
                    StatusCode: 'INVALID_AUTHORIZATION',
                    StatusNumber: 403
                });
            }
        } catch (error) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Authorization by 500 VERIFY',
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