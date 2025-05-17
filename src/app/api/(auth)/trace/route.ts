import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importJWK } from 'jose';
import { Config } from '@Config';
import { UserAgent } from '@Utils/UserAgent';
import { IPData } from '@Utils/IPData';
import { changeCase } from '@Utils/CaseChnage';
import { getClientIp } from "@Lib/request-ip";
import { ParseIPDataConfig } from '@/Utils/ParseIPDatatoConfig';

const CSRF_KEY = Config.Env.TRACE_SIGNATURE;
const ALLOWED_ORIGINS = [
    ...Config.WhiteListedDomains.map((domain) => `https://${domain}`),
    Config.Environment === 'development' ? 'http://localhost:3000' : null,
    Config.Environment === 'development' ? 'http://192.168.0.101:3000' : null,
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
        !WhiteListedBrowsers.includes(changeCase.upperFirst(new UserAgent(userAgent).parse().browser) as any)
    ) {
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

    // 5. TreatIntelligence Checks
    if (Config.Environment !== 'development') {
        const IP = getClientIp(req) as string;

        const TreatIntelligence = await IPData(IP);

        if (TreatIntelligence?.isERROR) {
            return NextResponse.json({
                Status: 0,
                Message: 'Threat Detectection Failed',
                StatusCode: "UNSUPPORTED_NETWORK"
            }, { status: 500 });
        }

        if (ParseIPDataConfig(TreatIntelligence).isFound) {
            return NextResponse.json({
                Status: 0,
                Message: 'Threat Detected',
                StatusCode: "UNSUPPORTED_NETWORK"
            })
        }
    }

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
    response.cookies.set(`${Config.Cookie_Prefix}csrf`, csrfToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 20,
    });

    return response;
}