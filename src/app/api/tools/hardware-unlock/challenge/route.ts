/**
 * POST /api/tools/hardware-unlock/challenge
 * Create an unlock challenge (initiated by Windows client or auth system)
 * 
 * This endpoint creates a new challenge that mobile device must approve.
 * Sends push notification to device via Firebase Cloud Messaging.
 * 
 * Protected: Requires special Bearer token or Windows client authentication
 * 
 * Request body:
 * {
 *   "action": "windows_unlock" | "auth_approve" | "payment_confirm",
 *   "clientInfo": {
 *     "osVersion": "Windows 11 23H2",
 *     "deviceName": "DESKTOP-ABC123",
 *     "ipAddress": "192.168.1.100"
 *   },
 *   "targetDeviceId": "uuid-of-device" (optional, defaults to user's first active device)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "challengeId": "challenge-uuid",
 *   "expiresIn": 300,
 *   "pollEndpoint": "/api/tools/hardware-unlock/challenge/challenge-uuid",
 *   "notificationSent": true
 * }
 */

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getResolvedUser } from "@/Utils/RolePermissions";
import { HardwareUnlockChallenge } from "@/Models/HardwareUnlockChallenge";
import { HardwareUnlockDevice } from "@/Models/HardwareUnlockDevice";
import { firebaseMessaging } from "@/Library/FirebaseMessagingService";
import { createNonce } from "@/Library/CryptoUtils";

const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const REQUIRED_PERMISSION = "Tools.Private.HardwareUnlock.Access";

export async function POST(request: NextRequest) {
    try {
        const h = await headers();
        const user = await getResolvedUser(h);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check permission
        const allowed =
            user.isAdmin || user.effectivePermissions?.has(REQUIRED_PERMISSION);
        if (!allowed) {
            return NextResponse.json(
                { success: false, error: "Access denied" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action = "windows_unlock", clientInfo, targetDeviceId } = body;

        // Validate action
        const validActions = ["windows_unlock", "auth_approve", "payment_confirm"];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { success: false, error: "Invalid action type" },
                { status: 400 }
            );
        }

        // If no target device specified, use first active device
        let deviceId = targetDeviceId;
        if (!deviceId) {
            const device = await HardwareUnlockDevice.findOne(
                { userId: user.userId || user.email, isActive: true },
                { deviceId: 1 }
            );
            if (!device) {
                return NextResponse.json(
                    { success: false, error: "No active paired devices found" },
                    { status: 400 }
                );
            }
            deviceId = device.deviceId;
        }

        // Verify device exists and belongs to user
        const device = await HardwareUnlockDevice.findOne({ deviceId });
        if (!device) {
            return NextResponse.json(
                { success: false, error: "Device not found" },
                { status: 404 }
            );
        }
        if (device.userId !== (user.userId || user.email)) {
            return NextResponse.json(
                { success: false, error: "Device not owned by user" },
                { status: 403 }
            );
        }

        // Generate challenge nonce
        const nonce = createNonce();
        const challengeId = uuidv4();
        const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_MS);

        // Create challenge record
        const challenge = await HardwareUnlockChallenge.create({
            challengeId,
            userId: user.userId || user.email,
            nonce,
            challengePayload: {
                action,
                timestamp: Date.now(),
                clientInfo: {
                    osVersion: clientInfo?.osVersion,
                    deviceName: clientInfo?.deviceName,
                    ipAddress: clientInfo?.ipAddress || request.headers.get("x-forwarded-for") || "unknown"
                }
            },
            targetDeviceId: deviceId,
            expiresAt,
            status: "pending"
        });

        // Send push notification (non-blocking)
        let notificationSent = false;
        try {
            notificationSent = await firebaseMessaging.sendChallengeNotification(
                deviceId,
                challengeId,
                action
            );
        } catch (error) {
            console.error("Failed to send push notification:", error);
            // Don't fail the request if notification fails
        }

        return NextResponse.json(
            {
                success: true,
                challengeId: challenge.challengeId,
                expiresIn: Math.floor(CHALLENGE_EXPIRY_MS / 1000),
                pollEndpoint: `/api/tools/hardware-unlock/challenge/${challengeId}`,
                nonce: nonce,
                notificationSent
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create hardware unlock challenge error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create challenge" },
            { status: 500 }
        );
    }
}
