/**
 *  @FileID          middleware.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
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