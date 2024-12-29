import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importJWK, jwtVerify } from 'jose';

const CSRF_KEY = process.env.CSRF_SESSION_KEY || 'CSRF-SESSION-KEY';

export async function middleware(req: NextRequest) {

    const csrfToken = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('20m')
    .sign(await importJWK({ kty: 'oct', k: CSRF_KEY }));

    const response = NextResponse.next();

    if (!req.cookies.get('csrf')) {
        response.cookies.set('csrf', csrfToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 20
        });
    }

    if (req.nextUrl.pathname.startsWith('/api')) {
        const csrfTokenFromHeader = req.headers.get('x-csrf');
        const csrfTokenFromCookie = req.cookies.get('csrf');

        const excludedRoutes = [
            '/api/csrf',
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

        if (csrfTokenFromHeader !== csrfTokenFromCookie.value) {
            return NextResponse.json({
                Status: 1,
                Message: 'Invalid CSRF token [Mismatch]',
                StatusCode: 403
            }, { status: 403 });
        }

        try {
            const verified = await jwtVerify(csrfTokenFromCookie?.value ?? "", await importJWK({ kty: 'oct', k: CSRF_KEY }), {
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