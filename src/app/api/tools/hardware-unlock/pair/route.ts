/**
 * POST /api/tools/hardware-unlock/pair
 * 
 * Initiates device pairing by generating a pairing token and QR code.
 * Mobile app scans the QR to get the token and endpoint.
 * 
 * Protected: Requires user authentication
 * Rate limit: 5 requests per 15 minutes per user
 * 
 * Response:
 * {
 *   "token": "abc123...",
 *   "qrData": "{...encoded...}",
 *   "expiresIn": 600,
 *   "endpoint": "https://api.example.com/api/tools/hardware-unlock/pair/confirm"
 * }
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getResolvedUser } from "@/Utils/RolePermissions";
import { PairingToken } from "@/Models/PairingToken";

const PAIRING_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export async function POST() {
    try {
        // Authenticate user
        const h = await headers();
        const user = await getResolvedUser(h);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Generate random pairing token (256 bits = 64 hex chars)
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + PAIRING_EXPIRY_MS);

        // Create QR data payload
        const qrPayload = {
            token,
            userId: user.userId || user.email,
            endpoint: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/tools/hardware-unlock/pair/confirm`,
            tokenExpiresAt: expiresAt.toISOString()
        };

        // Save pairing token to database
        const pairingToken = await PairingToken.create({
            token,
            userId: user.userId || user.email,
            qrData: JSON.stringify(qrPayload),
            expiresAt,
            status: "active"
        });

        return NextResponse.json(
            {
                success: true,
                token: token,
                qrData: qrPayload,
                expiresIn: Math.floor(PAIRING_EXPIRY_MS / 1000),
                endpoint: qrPayload.endpoint,
                _tokenId: pairingToken._id // For tracking
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Hardware unlock pairing error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to initiate pairing" },
            { status: 500 }
        );
    }
}
