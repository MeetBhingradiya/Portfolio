/**
 *  @FileID          app\api\(auth)\trace\route.ts
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
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
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
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 22/02/25 7:25 PM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importJWK } from 'jose';
import { Config } from '@Config';
import { UserAgent } from '@Utils/UserAgent';
import { changeCase } from '@Utils/CaseChnage';

const CSRF_KEY = process.env.CSRF_SESSION_KEY || 'CSRF-SESSION-KEY';
const ALLOWED_ORIGINS = [
    ...Config.WhiteListedDomains.map((domain) => `https://${domain}`),
    Config.Environment === 'development' ? 'http://localhost:3000' : null
];
const WhiteListedPlatforms = Config.WhiteListedPlatforms;
const WhiteListedBrowsers = Config.WhiteListedBrowsers;

export async function POST(req: NextRequest) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const userAgent = req.headers.get('user-agent') || '';
    const secUa = req.headers.get('sec-ch-ua') || '';
    const secUaPlatform = req.headers.get('sec-ch-ua-platform') || '';

    // **Validation:**
    // 1. Origin & Referer Checks
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Invalid origin', 
            StatusCode: "INVALID_ORIGIN" 
        }, { status: 403 });
    }
    if (referer && !referer.startsWith(origin)) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Invalid referer', 
            StatusCode: 403 
        }, { status: 403 });
    }

    // 2. Browser Automation Detection
    const browserSignatures = [
        'HeadlessChrome', 
        'puppeteer', 
        'selenium', 
        'webdriver',
        'playwright',
    ];
    if (browserSignatures.some((signature) => userAgent.includes(signature))) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Unsupported browser', 
            StatusCode: 403
        }, { status: 403 });
    }

    // 3. User-Agent and Sec-CH-UA Validation
    if (
        // !userAgent.includes('Chrome') && !userAgent.includes('Edge')
        !WhiteListedBrowsers.includes(changeCase.upperFirst(new UserAgent(userAgent).parse().browser) as any)
    ) {
        console.log({
            UserAgent: userAgent.split(' '),
            Condition: WhiteListedBrowsers.includes(changeCase.upperFirst(userAgent.split(' ')[0]) as any)
        });
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Unsupported browser', 
            StatusCode: 403 
        }, { status: 403 });
    }

    if (
        !WhiteListedPlatforms.includes(changeCase.upperFirst(secUaPlatform.replace(/"/g, '')) as any)
    ) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Unsupported Platform', 
            StatusCode: 403 
        }, { status: 403 });
    }

    // 4. WEBRTC Checks
    

    // @ TODO: IP CHECKS Like Tor, VPN, Proxy, etc.

    // **Generate CSRF Token**
    const csrfToken = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('20m')
        .sign(await importJWK({ kty: 'oct', k: CSRF_KEY }));

    // **Set Secure CSRF Cookie**
    const response = NextResponse.json({ 
        Status: 1, 
        Message: 'Supported browser', 
        data: csrfToken 
    });
    response.cookies.set('csrf', csrfToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 20,
    });

    return response;
}