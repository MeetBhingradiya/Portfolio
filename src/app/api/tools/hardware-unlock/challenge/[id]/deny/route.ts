/**
 * PUT /api/tools/hardware-unlock/challenge/[id]/deny
 * Mobile device denies an unlock challenge
 * 
 * User can explicitly deny an unlock request if they initiated it 
 * but then cancelled their intent.
 * 
 * Protected: Requires authentication
 * 
 * Request body:
 * {
 *   "deviceId": "uuid",
 *   "reason": "user_cancelled" | "suspicious_request" | "other"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Challenge denied"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { HardwareUnlockChallenge } from "@/Models/HardwareUnlockChallenge";
import { HardwareUnlockDevice } from "@/Models/HardwareUnlockDevice";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: challengeId } = await params;
        const body = await request.json();
        const { deviceId, reason = "user_cancelled" } = body;

        if (!deviceId) {
            return NextResponse.json(
                { success: false, error: "Missing deviceId" },
                { status: 400 }
            );
        }

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

        // Verify device is allowed to deny
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

        // Get device
        const device = await HardwareUnlockDevice.findOne({ deviceId });
        if (!device || !device.isActive) {
            return NextResponse.json(
                { success: false, error: "Device not active" },
                { status: 400 }
            );
        }

        // Update challenge to denied
        await HardwareUnlockChallenge.updateOne(
            { challengeId },
            {
                status: "denied",
                deniedAt: new Date(),
                expirationReason: `Denied: ${reason}`
            }
        );

        return NextResponse.json(
            {
                success: true,
                message: "Challenge denied successfully",
                challengeId,
                reason
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Deny challenge error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to deny challenge" },
            { status: 500 }
        );
    }
}
