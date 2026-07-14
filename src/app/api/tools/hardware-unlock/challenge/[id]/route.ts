/**
 * GET /api/tools/hardware-unlock/challenge/[id]
 * Check status of unlock challenge
 * 
 * Protected: Requires authentication
 * 
 * Response:
 * {
 *   "success": true,
 *   "challenge": {
 *     "challengeId": "uuid",
 *     "status": "pending" | "approved" | "denied" | "expired",
 *     "createdAt": "2026-05-10T...",
 *     "expiresAt": "2026-05-10T...",
 *     "approval": {
 *       "deviceId": "uuid",
 *       "approvedAt": "2026-05-10T...",
 *       "biometricType": "fingerprint"
 *     }
 *   }
 * }
 * 
 * PUT /api/tools/hardware-unlock/challenge/[id]/approve
 * Mobile device approves unlock challenge
 * 
 * Request body:
 * {
 *   "deviceId": "uuid",
 *   "signature": "base64-encoded-ed25519-signature",
 *   "biometricType": "fingerprint" | "face" | "iris"
 * }
 * 
 * The signature is Ed25519 signature of the challenge nonce using device's private key.
 * Server verifies using the device's stored public key.
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Challenge approved"
 * }
 */

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getResolvedUser } from "@/Utils/RolePermissions";
import { HardwareUnlockChallenge } from "@/Models/HardwareUnlockChallenge";
import { HardwareUnlockDevice } from "@/Models/HardwareUnlockDevice";
import { verifyEdSignature, isValidNonce, isValidPublicKey } from "@/Library/CryptoUtils";

const REQUIRED_PERMISSION = "Tools.Private.HardwareUnlock.Access";

// GET - Check challenge status
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const h = await headers();
        const user = await getResolvedUser(h);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const challengeId = params.id;
        const challenge = await HardwareUnlockChallenge.findOne(
            { challengeId },
            {
                challengeId: 1,
                status: 1,
                createdAt: 1,
                expiresAt: 1,
                approval: 1,
                nonce: 0 // Don't return sensitive nonce
            }
        );

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: "Challenge not found" },
                { status: 404 }
            );
        }

        // Verify ownership or admin
        if (challenge.userId !== (user.userId || user.email) && !user.isAdmin) {
            return NextResponse.json(
                { success: false, error: "Access denied" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                challenge: challenge.toObject()
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get challenge status error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch challenge" },
            { status: 500 }
        );
    }
}

// PUT - Approve challenge
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { deviceId, signature, biometricType } = body;

        if (!deviceId || !signature) {
            return NextResponse.json(
                { success: false, error: "Missing deviceId or signature" },
                { status: 400 }
            );
        }

        const challengeId = params.id;

        // Find challenge
        const challenge = await HardwareUnlockChallenge.findOne({ challengeId });
        if (!challenge) {
            return NextResponse.json(
                { success: false, error: "Challenge not found" },
                { status: 404 }
            );
        }

        // Verify challenge is pending
        if (challenge.status !== "pending") {
            return NextResponse.json(
                { success: false, error: `Challenge already ${challenge.status}` },
                { status: 400 }
            );
        }

        // Verify challenge not expired
        if (new Date() > challenge.expiresAt) {
            await HardwareUnlockChallenge.updateOne(
                { challengeId },
                { status: "expired", expirationReason: "Approval timeout" }
            );
            return NextResponse.json(
                { success: false, error: "Challenge expired" },
                { status: 410 }
            );
        }

        // Verify device is approved for this challenge
        const allowedDevices = [
            challenge.targetDeviceId,
            ...(challenge.allowedDevices || [])
        ];
        if (!allowedDevices.includes(deviceId)) {
            return NextResponse.json(
                { success: false, error: "Device not allowed for this challenge" },
                { status: 403 }
            );
        }

        // Get device and verify it's active
        const device = await HardwareUnlockDevice.findOne({ deviceId });
        if (!device || !device.isActive) {
            return NextResponse.json(
                { success: false, error: "Device not active" },
                { status: 400 }
            );
        }

        // Validate nonce and public key formats
        if (!isValidNonce(challenge.nonce)) {
            return NextResponse.json(
                { success: false, error: "Invalid challenge nonce format" },
                { status: 400 }
            );
        }

        if (!isValidPublicKey(device.publicKeyEd25519)) {
            return NextResponse.json(
                { success: false, error: "Invalid device public key format" },
                { status: 400 }
            );
        }

        // Verify Ed25519 signature
        const isSignatureValid = await verifyEdSignature(
            challenge.nonce,
            signature,
            device.publicKeyEd25519
        );

        if (!isSignatureValid) {
            // Increment failed challenge counter for security
            await HardwareUnlockDevice.updateOne(
                { deviceId },
                {
                    failedChallenges: (device.failedChallenges || 0) + 1,
                    lastFailedAt: new Date()
                }
            );

            return NextResponse.json(
                { success: false, error: "Invalid signature" },
                { status: 401 }
            );
        }

        // Reset failed challenge counter on successful approval
        await HardwareUnlockDevice.updateOne(
            { deviceId },
            { failedChallenges: 0 }
        );

        // Update challenge with approval
        await HardwareUnlockChallenge.updateOne(
            { challengeId },
            {
                status: "approved",
                approvedAt: new Date(),
                approval: {
                    deviceId,
                    devicePublicKey: device.publicKeyEd25519,
                    signature,
                    biometricType: biometricType || "unknown",
                    approvedAt: new Date()
                }
            }
        );

        // Update device's last unlock time
        await HardwareUnlockDevice.updateOne(
            { deviceId },
            { lastUnlockAt: new Date() }
        );

        return NextResponse.json(
            {
                success: true,
                message: "Challenge approved successfully",
                challengeId
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Approve challenge error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to approve challenge" },
            { status: 500 }
        );
    }
}
