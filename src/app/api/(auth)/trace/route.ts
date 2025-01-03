import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importJWK } from 'jose';
import { Config } from '@Config/index';

const CSRF_KEY = process.env.CSRF_SESSION_KEY || 'CSRF-SESSION-KEY';
const ALLOWED_ORIGINS = [
    ...Config.WhiteListedDomains.map((domain) => `https://${domain}`),
    Config.Environment === 'development' ? 'http://localhost:3000' : null
];

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
            StatusCode: 403 
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
    const browserSignatures = ['HeadlessChrome', 'puppeteer', 'selenium', 'webdriver'];
    if (browserSignatures.some((signature) => userAgent.includes(signature))) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Automated browser detected', 
            StatusCode: 403 
        }, { status: 403 });
    }

    // 3. User-Agent and Sec-CH-UA Validation
    if (!userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Unsupported browser', 
            StatusCode: 403 
        }, { status: 403 });
    }
    if (!secUa.includes('Chrome') && !secUa.includes('Edge')) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Sec-CH-UA does not match User-Agent', 
            StatusCode: 403 
        }, { status: 403 });
    }

    if (!secUaPlatform.includes('Windows') && !secUaPlatform.includes('Linux')) {
        return NextResponse.json({ 
            Status: 0, 
            Message: 'Unsupported platform', 
            StatusCode: 403 
        }, { status: 403 });
    }

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
        Message: 'CSRF token generated successfully', 
        csrfToken 
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