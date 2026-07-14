/**
 * GET /api/tools/hardware-unlock/challenges/pending
 * 
 * Get all pending challenges for the authenticated user
 * This is useful for polling all challenges at once instead of per-device
 * 
 * Protected: Requires authentication + permission
 * 
 * Response:
 * {
 *   "success": true,
 *   "challenges": [
 *     {
 *       "challengeId": "uuid",
 *       "status": "pending",
 *       "createdAt": "2026-05-10T...",
 *       "expiresAt": "2026-05-10T...",
 *       "targetDeviceId": "uuid",
 *       "challengePayload": {
 *         "action": "windows_unlock",
 *         "clientInfo": {...}
 *       }
 *     }
 *   ],
 *   "count": 1
 * }
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getResolvedUser } from "@/Utils/RolePermissions";
import { HardwareUnlockChallenge } from "@/Models/HardwareUnlockChallenge";

const REQUIRED_PERMISSION = "Tools.Private.HardwareUnlock.Access";

export async function GET() {
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

        // Get pending challenges for user
        const challenges = await HardwareUnlockChallenge.find(
            {
                userId: user.userId || user.email,
                status: "pending",
                expiresAt: { $gt: new Date() }
            },
            {
                challengeId: 1,
                status: 1,
                createdAt: 1,
                expiresAt: 1,
                targetDeviceId: 1,
                allowedDevices: 1,
                challengePayload: 1,
                _id: 0
            }
        )
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return NextResponse.json(
            {
                success: true,
                challenges,
                count: challenges.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get pending challenges error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch challenges" },
            { status: 500 }
        );
    }
}
