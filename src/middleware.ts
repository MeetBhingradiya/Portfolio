import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importJWK, jwtVerify } from 'jose';

const CSRF_KEY = process.env.CSRF_SESSION_KEY || 'CSRF-SESSION-KEY';

export async function middleware(req: NextRequest) {

    const csrfToken = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).sign(
        await importJWK({ kty: 'oct', k: CSRF_KEY }),
    );

    const response = NextResponse.next();
    response.cookies.set('csrf_token', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });

    if (req.nextUrl.pathname.startsWith('/api')) {
        const csrfTokenFromHeader = req.headers.get('x-csrf-token');
        const csrfTokenFromCookie = req.cookies.get('csrf_token');

        const excludedRoutes = [
            '/api/sitemap', 
            '/api/robots'
        ];

        if (excludedRoutes.includes(req.nextUrl.pathname)) {
            return NextResponse.next();
        }

        if (!csrfTokenFromHeader) {
            return NextResponse.json({ 
                Status: 0,
                Message: 'CSRF token missing in request header',
                StatusCode: 403
            }, { status: 403 });
        }

        if (!csrfTokenFromCookie) {
            return NextResponse.json({ 
                Status: 0,
                Message: 'CSRF token missing in cookies',
                StatusCode: 403
            }, { status: 403 });
        }

        if (csrfTokenFromHeader === csrfTokenFromCookie.value) {
            return NextResponse.json({
                Status: 1,
                Message: 'Invalid CSRF token',
                StatusCode: 403
            }, { status: 403 });
        }

        try {
            const verified = await jwtVerify(csrfTokenFromHeader, await importJWK({ kty: 'oct', k: CSRF_KEY }), {
                algorithms: ['HS256'],
            });

            if (!verified) {
                return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 });
            }
        } catch (error) {
            return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 });
        }
    }

    return response;
}

export const config = {
    matcher: '/(.*)',
};