import { NextRequest, NextResponse } from "next/server";
import { SignJWT, importJWK } from "jose";
import { Config } from "@Config";
import { UserAgent } from "@Utils/UserAgent";
import { IPData } from "@Utils/IPData";
import { changeCase } from "@Utils/CaseChnage";
import { getClientIp } from "@Library/request-ip";
import { ParseIPDataConfig } from "@/Utils/ParseIPDatatoConfig";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import { TraceReportCollector } from "@Utils/TraceReportCollector";

// Using Node.js runtime for database access
// export const runtime = "edge";

const CSRF_KEY = Config.Env.TRACE_SIGNATURE;
const ALLOWED_ORIGINS = [
    ...Config.WhiteListedDomains.map((domain) => `https://${domain}`),
    Config.Environment === "development" ? "http://localhost:3000" : null,
    Config.Environment === "development" ? "http://192.168.1.75:3000" : null
];
const WhiteListedPlatforms = Config.WhiteListedPlatforms;
const WhiteListedBrowsers = Config.WhiteListedBrowsers;

// Advanced bot detection patterns
const BOT_SIGNATURES = {
    // Selenium detection
    selenium: [
        "selenium",
        "webdriver",
        "remote-debugging",
        "automation",
        "chromedriver",
        "geckodriver",
        "safaridriver",
        "msedgedriver"
    ],

    // Playwright detection
    playwright: ["playwright", "headless", "chromium"],

    // Puppeteer detection
    puppeteer: ["puppeteer", "headlesschrome", "chrome-headless-shell"],

    // Other automation tools
    automation: [
        "nodriver",
        "undetected-chromedriver",
        "stealth",
        "bot",
        "crawler",
        "spider",
        "scraper",
        "phantom"
    ]
};

// Headers that indicate automation
const AUTOMATION_HEADERS = [
    "webdriver",
    "selenium-remote-url",
    "x-automation",
    "x-automated",
    "chrome-proxy"
];

// Missing headers that real browsers always send
const REQUIRED_HEADERS = [
    "accept",
    "accept-language",
    "accept-encoding",
    "user-agent",
    "connection",
    // "sec-ch-ua",
    // "sec-ch-ua-platform",
    // "sec-ch-ua-mobile",
    // "sec-fetch-dest",
    // "sec-fetch-mode",
    // "sec-fetch-site",
    "origin"
];

function detectAutomationBot(req: NextRequest): {
    isBot: boolean;
    reason: string;
    category?: string;
    confidence?: number;
} {
    const userAgent = req.headers.get("user-agent")?.toLowerCase() || "";
    const secUa = req.headers.get("sec-ch-ua")?.toLowerCase() || "";
    const secUaPlatform = req.headers.get("sec-ch-ua-platform")?.toLowerCase() || "";
    const secUaMobile = req.headers.get("sec-ch-ua-mobile") || "";
    const acceptLanguage = req.headers.get("accept-language") || "";
    const acceptEncoding = req.headers.get("accept-encoding") || "";
    const connection = req.headers.get("connection") || "";

    // 1. Check for explicit automation signatures in User-Agent
    for (const [category, signatures] of Object.entries(BOT_SIGNATURES)) {
        for (const signature of signatures) {
            if (userAgent.includes(signature)) {
                return {
                    isBot: true,
                    reason: `Automation tool detected: ${signature} (${category})`,
                    category: category,
                    confidence: 95
                };
            }
        }
    }

    // 2. Check for automation-specific headers
    for (const header of AUTOMATION_HEADERS) {
        if (req.headers.has(header)) {
            return {
                isBot: true,
                reason: `Automation header detected: ${header}`,
                category: "automation",
                confidence: 90
            };
        }
    }

    // 3. Check for missing required headers
    // for (const header of REQUIRED_HEADERS) {
    //     if (!req.headers.has(header)) {
    //         return {
    //             isBot: true,
    //             reason: `Missing required header: ${header}`
    //         };
    //     }
    // }

    // 4. Selenium-specific detection
    // if (userAgent.includes('chrome')) {
    //     // Selenium often has specific version patterns
    //     if (/chrome\/[\d]+\.0\.0\.0/i.test(userAgent)) {
    //         return { isBot: true, reason: 'Selenium Chrome version pattern detected' };
    //     }
    // }

    // 5. Check for inconsistent Sec-CH-UA headers
    if (secUa) {
        // Real browsers always include version info and brand info
        if (!secUa.includes("version") && !secUa.includes("v=")) {
            return {
                isBot: true,
                reason: "Invalid Sec-CH-UA format",
                category: "automation",
                confidence: 75
            };
        }

        // Check for automation-specific UA strings
        if (secUa.includes("headlesschrome") || secUa.includes("not a;brand")) {
            return {
                isBot: true,
                reason: "Headless browser detected in Sec-CH-UA",
                category: "headless",
                confidence: 85
            };
        }
    }

    // 6. Check Accept-Language patterns
    // if (
    //     !acceptLanguage ||
    //     acceptLanguage === "en-US" ||
    //     acceptLanguage !== "en"
    // ) {
    //     // Real browsers usually have more complex Accept-Language headers
    //     return { isBot: true, reason: "Suspicious Accept-Language header" };
    // }

    // 7. Check Accept-Encoding patterns
    if (
        !acceptEncoding.includes("gzip") ||
        !acceptEncoding.includes("deflate")
    ) {
        return {
            isBot: true,
            reason: "Invalid Accept-Encoding header",
            category: "automation",
            confidence: 70
        };
    }

    // 8. Check for specific automation tool User-Agent patterns
    const suspiciousUaPatterns = [
        /^Mozilla\/5\.0 \(X11; Linux x86_64\) AppleWebKit\/537\.36$/,
        /^Mozilla\/5\.0 \(Windows NT 10\.0; Win64; x64\) AppleWebKit\/537\.36$/,
        /HeadlessChrome/,
        /\bversion\/[\d.]+\s*$/i
    ];

    for (const pattern of suspiciousUaPatterns) {
        if (pattern.test(userAgent)) {
            return {
                isBot: true,
                reason: "Suspicious User-Agent pattern detected",
                category: "automation",
                confidence: 80
            };
        }
    }

    // 9. Check for missing or invalid Sec-CH-UA-Mobile
    // if (secUaMobile !== "?0" && secUaMobile !== "?1") {
    //     return { isBot: true, reason: "Invalid Sec-CH-UA-Mobile header" };
    // }

    // 10. Advanced: Check for WebDriver property (would need client-side JS)
    // This would be implemented on the frontend and sent as a custom header
    const webdriverStatus = req.headers.get("x-webdriver-check");
    if (webdriverStatus === "true") {
        return {
            isBot: true,
            reason: "WebDriver property detected",
            category: "selenium",
            confidence: 100
        };
    }

    return { isBot: false, reason: "", confidence: 0 };
}

function analyzeRequestFingerprint(req: NextRequest): {
    suspicious: boolean;
    reason: string;
} {
    const headerCount = Array.from(req.headers.keys()).length;

    // Real browsers typically send 15-25 headers
    if (headerCount < 10 || headerCount > 25) {
        return {
            suspicious: true,
            reason: `Too many or few headers: ${headerCount}`
        };
    }

    // Check for common header order issues (automation tools often send headers in different orders)
    const headerKeys = Array.from(req.headers.keys()).map((h) =>
        h.toLowerCase()
    );
    const expectedOrder = [
        "accept",
        "accept-encoding",
        "accept-language",
        "content-length",
        "cookie",
        "user-agent"
    ];

    let orderScore = 0;
    let lastIndex = -1;
    for (const expectedHeader of expectedOrder) {
        const currentIndex = headerKeys.indexOf(expectedHeader);
        if (currentIndex > lastIndex) {
            orderScore++;
            lastIndex = currentIndex;
        }
    }

    if (orderScore < 3) {
        return { suspicious: true, reason: "Unusual header order pattern" };
    }

    return { suspicious: false, reason: "" };
}

export async function POST(req: NextRequest) {
    // Initialize trace report collector
    const traceCollector = TraceReportCollector.create();

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const userAgent = req.headers.get("user-agent") || "";
    const secUa = req.headers.get("sec-ch-ua") || "";
    const secUaPlatform = req.headers.get("sec-ch-ua-platform") || "";
    const parsedUA = new UserAgent(userAgent).parse();

    // console.log({
    //     origin,
    //     referer,
    //     userAgent,
    //     secUa,
    //     secUaPlatform,
    //     headers: Array.from(req.headers.entries())
    //         .map(([key, value]) => `${key}: ${value}`)
    //         .join(", "),
    //     ip: getClientIp(req) || "Unknown IP",
    //     botDetection: detectAutomationBot(req),
    //     platform: parsedUA.platform,
    //     parsedPlateform: changeCase.upperFirst(parsedUA.platform),
    //     browser: parsedUA.browser
    // })

    // **Enhanced Bot Detection**
    traceCollector.startBotDetection();
    const botDetection = detectAutomationBot(req);
    const botDetectionTime = traceCollector.endBotDetection();

    if (botDetection.isBot) {
        const response = ControllerResponseMap({
            Status: 0,
            Message: "Automated browser detected",
            StatusCode: "AUTOMATION_DETECTED",
            StatusNumber: 403,
            Debug:
                Config.Environment === "development"
                    ? { reason: botDetection.reason }
                    : undefined
        });

        // Save trace report for bot detection
        await traceCollector.saveTraceReport({
            req,
            botDetection: {
                isBot: true,
                reason: botDetection.reason,
                category: botDetection.category,
                confidence: botDetection.confidence || 90
            },
            fingerprint: {
                suspicious: false,
                reason: "",
                missingHeaders: [],
                automationHeaders: []
            },
            validation: {
                originValid: !!origin && ALLOWED_ORIGINS.includes(origin),
                refererValid: !referer || referer.startsWith(origin || ""),
                browserSupported: true, // Will be checked later if not bot
                platformSupported: true, // Will be checked later if not bot
                threatDetected: false
            },
            result: {
                status: 0,
                statusCode: "AUTOMATION_DETECTED",
                statusNumber: 403,
                message: "Automated browser detected",
                csrfTokenGenerated: false
            },
            performance: {
                processingTime: traceCollector.getTotalProcessingTime(),
                botDetectionTime
            }
        });

        return response;
    }

    // **Request Fingerprint Analysis**
    const fingerprint = {
        suspicious: false,
        reason: "",
        missingHeaders: [],
        automationHeaders: []
    }
    // const fingerprint = analyzeRequestFingerprint(req);
    // if (fingerprint.suspicious) {
    //     return ControllerResponseMap({
    //         Status: 0,
    //         Message: 'Suspicious request pattern',
    //         StatusCode: 'SUSPICIOUS_REQUEST',
    //         StatusNumber: 403,
    //         Debug: Config.Environment === 'development' ? { reason: fingerprint.reason } : undefined
    //     });
    // }

    // **Validation:**
    traceCollector.startValidation();

    // 1. Origin & Referer Checks
    const originValid = !!origin && ALLOWED_ORIGINS.includes(origin);
    const refererValid = !referer || referer.startsWith(origin || "");

    if (!originValid) {
        const validationTime = traceCollector.endValidation();
        const response = ControllerResponseMap({
            Status: 0,
            Message: "Invalid origin",
            StatusCode: "INVALID_ORIGIN",
            StatusNumber: 403
        });

        // Save trace report for invalid origin
        await traceCollector.saveTraceReport({
            req,
            botDetection: {
                isBot: false,
                reason: "",
                confidence: 0
            },
            validation: {
                originValid: false,
                refererValid,
                browserSupported: true,
                platformSupported: true,
                threatDetected: false
            },
            result: {
                status: 0,
                statusCode: "INVALID_ORIGIN",
                statusNumber: 403,
                message: "Invalid origin",
                csrfTokenGenerated: false
            },
            performance: {
                processingTime: traceCollector.getTotalProcessingTime(),
                botDetectionTime,
                validationTime
            }
        });

        return response;
    }

    if (!refererValid) {
        const validationTime = traceCollector.endValidation();
        const response = ControllerResponseMap({
            Status: 0,
            Message: "Invalid referer",
            StatusCode: "INVALID_REFERER",
            StatusNumber: 403
        });

        // Save trace report for invalid referer
        await traceCollector.saveTraceReport({
            req,
            botDetection: {
                isBot: false,
                reason: "",
                confidence: 0
            },
            fingerprint,
            validation: {
                originValid: true,
                refererValid: false,
                browserSupported: true,
                platformSupported: true,
                threatDetected: false
            },
            result: {
                status: 0,
                statusCode: "INVALID_REFERER",
                statusNumber: 403,
                message: "Invalid referer",
                csrfTokenGenerated: false
            },
            performance: {
                processingTime: traceCollector.getTotalProcessingTime(),
                botDetectionTime,
                validationTime
            }
        });

        return response;
    }

    // 2. Enhanced User-Agent Analysis
    // Check if it's a known bot
    if (parsedUA.isBot) {
        const validationTime = traceCollector.endValidation();
        const response = ControllerResponseMap({
            Status: 0,
            Message: "Bot detected",
            StatusCode: "BOT_DETECTED",
            StatusNumber: 403,
            Debug:
                Config.Environment === "development"
                    ? { botType: parsedUA.isBot }
                    : undefined
        });

        // Save trace report for bot detection via UA
        await traceCollector.saveTraceReport({
            req,
            botDetection: {
                isBot: true,
                reason: "Bot detected in User-Agent",
                category: "crawler",
                confidence: 95
            },
            fingerprint,
            validation: {
                originValid: true,
                refererValid: true,
                browserSupported: false,
                platformSupported: true,
                threatDetected: false
            },
            result: {
                status: 0,
                statusCode: "BOT_DETECTED",
                statusNumber: 403,
                message: "Bot detected",
                csrfTokenGenerated: false
            },
            performance: {
                processingTime: traceCollector.getTotalProcessingTime(),
                botDetectionTime,
                validationTime
            }
        });

        return response;
    }

    const validationTime = traceCollector.endValidation();

    // 3. Browser and Platform Validation
    const browserSupported = true; // Always true for now as commented
    const platformSupported = true; // Always true for now as commented

    // if (
    //     !WhiteListedBrowsers.includes(
    //         changeCase.upperFirst(parsedUA.browser) as any
    //     )
    // ) {
    //     return ControllerResponseMap({
    //         Status: 0,
    //         Message: "Unsupported browser",
    //         StatusCode: "UNSUPPORTED_BROWSER",
    //         StatusNumber: 403,
    //         Debug:
    //             Config.Environment === "development"
    //                 ? { browser: parsedUA.browser }
    //                 : undefined
    //     });
    // }

    // if (
    //     !WhiteListedPlatforms.includes(changeCase.upperFirst(parsedUA.platform) as any)
    // ) {
    //     return ControllerResponseMap({
    //         Status: 0,
    //         Message: "Unsupported Platform",
    //         StatusCode: "UNSUPPORTED_PLATFORM",
    //         StatusNumber: 403,
    //         Debug:
    //             Config.Environment === "development"
    //                 ? { platform: parsedUA.platform }
    //                 : undefined
    //     });
    // }

    // 4. Threat Intelligence Checks
    let threatIntelligence = null;
    let threatCheckTime = 0;
    let threatDetected = false;

    // if (Config.Environment !== "development") {
    //     traceCollector.startThreatCheck();
    //     const IP = getClientIp(req) as string;
    //     const TreatIntelligence = await IPData(IP);
    //     threatCheckTime = traceCollector.endThreatCheck();

    //     if (TreatIntelligence?.isERROR) {
    //         return ControllerResponseMap({
    //             Status: 0,
    //             Message: "Threat Detection Failed",
    //             StatusCode: "THREAT_CHECK_FAILED",
    //             StatusNumber: 500
    //         });
    //     }

    //     if (ParseIPDataConfig(TreatIntelligence).isFound) {
    //         threatDetected = true;
    //         return ControllerResponseMap({
    //             Status: 0,
    //             Message: "Threat Detected",
    //             StatusCode: "THREAT_DETECTED",
    //             StatusNumber: 403
    //         });
    //     }
    //     
    //     threatIntelligence = TreatIntelligence;
    // }

    // **Generate CSRF Token**
    const csrfToken = await new SignJWT({
        // Add any necessary payload data here
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("20m")
        .sign(await importJWK({ kty: "oct", k: CSRF_KEY }));

    // **Set Secure CSRF Cookie**
    const response = ControllerResponseMap({
        Status: 1,
        Message: "Browser verification successful",
        StatusCode: "BROWSER_VERIFIED",
        StatusNumber: 200,
        Data: {
            token: csrfToken,
            browser: parsedUA.browser,
            platform: parsedUA.platform,
            expiresIn: 60 * 20
        }
    });

    response.cookies.set(`${Config.Cookie_Prefix}csrf`, csrfToken, {
        httpOnly: true,
        secure: Config.Environment === "production", // Only secure in production
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 20
    });

    // Save successful trace report
    await traceCollector.saveTraceReport({
        req,
        botDetection: {
            isBot: false,
            reason: "",
            confidence: 0
        },
        fingerprint,
        validation: {
            originValid: true,
            refererValid: true,
            browserSupported,
            platformSupported,
            threatDetected
        },
        result: {
            status: 1,
            statusCode: "BROWSER_VERIFIED",
            statusNumber: 200,
            message: "Browser verification successful",
            csrfTokenGenerated: true
        },
        performance: {
            processingTime: traceCollector.getTotalProcessingTime(),
            botDetectionTime,
            threatCheckTime,
            validationTime
        },
        threatIntelligence,
        // Add geolocation data if available from threat intelligence
        geolocation: threatIntelligence ? {
            country: (threatIntelligence as any).country,
            countryCode: (threatIntelligence as any).country_code,
            region: (threatIntelligence as any).region,
            city: (threatIntelligence as any).city,
            latitude: (threatIntelligence as any).latitude,
            longitude: (threatIntelligence as any).longitude,
            timezone: (threatIntelligence as any).timezone
        } : undefined
    });

    return response;
}
