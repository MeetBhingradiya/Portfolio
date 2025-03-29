/**
 *  @FileID          middleware.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 08/03/25 4:24 PM IST (Kolkata +5:30 UTC)
 */


import { NextResponse, NextRequest } from 'next/server';
import { SignJWT, importJWK, jwtVerify } from 'jose';
import { Config } from '@Config';
import { ControllerResponseMap } from '@Utils';
// import { RateLimiter } from '@Utils/RateLimit';

const CSRF_KEY = Config.Env.TRACE_SIGNATURE;

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

    if (req.nextUrl.pathname.startsWith('/api')) {
        // const rateLimit:any = await RateLimiter(req);

        // if (rateLimit instanceof NextResponse) {
        //     return rateLimit;
        // }

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