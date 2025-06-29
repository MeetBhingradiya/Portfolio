import { NextRequest, NextResponse } from "next/server";
import { getCurrentState } from "@Controllers/State";
import { IPData } from "@Utils";

/**
 * Middleware to check IP threats based on state configuration
 */
export async function checkThreatIntelligence(req: NextRequest): Promise<NextResponse | null> {
    try {
        // Get current state configuration
        const currentState = await getCurrentState();
        if (!currentState) {
            return null; // Allow request if state is not available
        }

        // Get client IP
        const clientIP = getClientIP(req);
        if (!clientIP || clientIP === "Unknown") {
            return null; // Allow request if IP is unknown
        }

        // Get IP data for threat analysis
        const ipData = await IPData(clientIP);
        if (!ipData) {
            return null; // Allow request if IP data is not available
        }

        // Check if any blocked threats are detected
        const blockedThreats = currentState.Authentication.Blocked_Threats;
        const detectedThreats: string[] = [];

        // Check various threat categories
        if (blockedThreats.includes("TOR") && ipData.is_tor) {
            detectedThreats.push("TOR");
        }

        if (blockedThreats.includes("VPN") && ipData.is_vpn) {
            detectedThreats.push("VPN");
        }

        if (blockedThreats.includes("ICloud-Relay") && ipData.is_icloud_relay) {
            detectedThreats.push("ICloud-Relay");
        }

        if (blockedThreats.includes("Proxy") && ipData.is_proxy) {
            detectedThreats.push("Proxy");
        }

        if (blockedThreats.includes("Datacenter") && ipData.is_datacenter) {
            detectedThreats.push("Datacenter");
        }

        if (blockedThreats.includes("Anonymous") && ipData.is_anonymous) {
            detectedThreats.push("Anonymous");
        }

        if (blockedThreats.includes("KnownAttacker") && ipData.is_known_attacker) {
            detectedThreats.push("KnownAttacker");
        }

        if (blockedThreats.includes("KnownAbuser") && ipData.is_known_abuser) {
            detectedThreats.push("KnownAbuser");
        }

        if (blockedThreats.includes("Threat") && ipData.is_threat) {
            detectedThreats.push("Threat");
        }

        if (blockedThreats.includes("Bogon") && ipData.is_bogon) {
            detectedThreats.push("Bogon");
        }

        // If threats are detected, block the request
        if (detectedThreats.length > 0) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Access denied due to security policy",
                    StatusCode: 403,
                    Data: {
                        reason: "threat_detected",
                        threats: detectedThreats,
                        ip: clientIP
                    }
                },
                { status: 403 }
            );
        }

        // Allow request if no threats detected
        return null;
    } catch (error) {
        // Log error but allow request to continue
        console.error("Threat intelligence check failed:", error);
        return null;
    }
}

/**
 * Helper function to get client IP from request
 */
function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "Unknown";
}

/**
 * Middleware function to be used in API routes
 */
export async function withThreatProtection(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    // Check for threats first
    const threatResponse = await checkThreatIntelligence(req);
    if (threatResponse) {
        return threatResponse; // Block the request
    }

    // Continue with the original handler
    return handler(req);
}

/**
 * Check if a specific threat type is blocked in current state
 */
export async function isThreatBlocked(threatType: string): Promise<boolean> {
    try {
        const currentState = await getCurrentState();
        if (!currentState) {
            return false;
        }

        return currentState.Authentication.Blocked_Threats.includes(threatType as any);
    } catch (error) {
        console.error("Error checking threat block status:", error);
        return false;
    }
}
