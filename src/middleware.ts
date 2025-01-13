/**
 *  @file        middleware.ts
 *  @description No description available for middleware.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importJWK, jwtVerify } from 'jose';

const CSRF_KEY = process.env.CSRF_SESSION_KEY || 'CSRF-SESSION-KEY';

export async function middleware(req: NextRequest) {

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
            '/api/trace',
            '/api/sitemap',
            '/api/robots'
        ];

        if (excludedRoutes.includes(req.nextUrl.pathname)) {
            return NextResponse.next({
                request: {
                    headers: ModifiedHeaders
                }
            });
        }

        if (!csrfTokenFromHeader) {
            return NextResponse.json({ 
                Status: 0,
                Message: 'Invalid Authorization',
                StatusCode: 403
            }, { status: 403 });
        }

        if (!csrfTokenFromCookie) {
            return NextResponse.json({ 
                Status: 0,
                Message: 'Invalid Authorization',
                StatusCode: 403
            }, { status: 403 });
        }

        if (csrfTokenFromHeader !== csrfTokenFromCookie.value) {
            return NextResponse.json({
                Status: 1,
                Message: 'Invalid Authorization',
                StatusCode: 403
            }, { status: 403 });
        }

        try {
            const verified = await jwtVerify(csrfTokenFromCookie?.value ?? "", await importJWK({ kty: 'oct', k: CSRF_KEY }), {
                algorithms: ['HS256'],
            });

            if (!verified) {
                return NextResponse.json({ message: 'Invalid Authorization' }, { status: 403 });
            }
        } catch (error) {
            return NextResponse.json({ message: 'Invalid Authorization' }, { status: 403 });
        }
    }

    return response;
}

export const config = {
    matcher: '/(.*)',
};