/**
 * POST /api/tools/hardware-unlock/pair/confirm
 * 
 * Mobile device confirms pairing by exchanging token for device registration.
 * Device provides:
 * - Pairing token
 * - Device metadata (name, OS, UUID, etc.)
 * - Public key for signature verification
 * 
 * Protected: Token must be valid and not expired
 * 
 * Request body:
 * {
 *   "token": "abc123...",
 *   "deviceName": "iPhone 14",
 *   "deviceType": "phone",
 *   "platform": "ios",
 *   "platformVersion": "17.0",
 *   "appVersion": "1.0.0",
 *   "deviceUUID": "550e8400-e29b-41d4-a716-446655440000",
 *   "publicKeyEd25519": "base64encodedkey==",
 *   "fcmToken": "optional_push_token"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "deviceId": "device-uuid-here",
 *   "trustedAt": "2026-05-10T..."
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { PairingToken } from "@/Models/PairingToken";
import { HardwareUnlockDevice } from "@/Models/HardwareUnlockDevice";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            token,
            deviceName,
            deviceType,
            platform,
            platformVersion,
            appVersion,
            deviceUUID,
            publicKeyEd25519,
            fcmToken,
            appSignature,
            ipAddress
        } = body;

        // Validate required fields
        if (
            !token ||
            !deviceName ||
            !platform ||
            !deviceUUID ||
            !publicKeyEd25519
        ) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Find and validate pairing token
        const pairingToken = await PairingToken.findOne({ token });

        if (!pairingToken) {
            return NextResponse.json(
                { success: false, error: "Invalid pairing token" },
                { status: 404 }
            );
        }

        if (pairingToken.status !== "active") {
            return NextResponse.json(
                { success: false, error: "Pairing token expired or already used" },
                { status: 410 }
            );
        }

        if (new Date() > pairingToken.expiresAt) {
            await PairingToken.updateOne(
                { _id: pairingToken._id },
                { status: "expired" }
            );
            return NextResponse.json(
                { success: false, error: "Pairing token expired" },
                { status: 410 }
            );
        }

        // Check if device UUID is already registered to another user
        const existingDevice = await HardwareUnlockDevice.findOne({ deviceUUID });
        if (existingDevice && existingDevice.userId !== pairingToken.userId) {
            return NextResponse.json(
                { success: false, error: "Device already paired to another account" },
                { status: 409 }
            );
        }

        // Generate device ID
        const deviceId = uuidv4();

        // Create device record
        const device = await HardwareUnlockDevice.create({
            userId: pairingToken.userId,
            deviceId,
            deviceName,
            deviceType: deviceType || "phone",
            platform,
            platformVersion,
            appVersion,
            publicKeyEd25519,
            deviceUUID,
            fcmToken,
            appSignature,
            ipAddress: ipAddress || request.ip,
            isActive: true,
            trustedAt: new Date()
        });

        // Mark pairing token as used
        await PairingToken.updateOne(
            { _id: pairingToken._id },
            {
                status: "used",
                usedAt: new Date(),
                claimedDeviceId: deviceId,
                claimedPublicKey: publicKeyEd25519
            }
        );

        return NextResponse.json(
            {
                success: true,
                deviceId: device.deviceId,
                trustedAt: device.trustedAt,
                message: "Device paired successfully"
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Hardware unlock pairing confirm error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to confirm pairing" },
            { status: 500 }
        );
    }
}
