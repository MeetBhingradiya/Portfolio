/**
 * GET /api/tools/hardware-unlock/devices
 * List all paired devices for authenticated user
 * 
 * Protected: Requires authentication + permission
 * 
 * Response:
 * {
 *   "success": true,
 *   "devices": [
 *     {
 *       "deviceId": "uuid",
 *       "deviceName": "iPhone 14",
 *       "platform": "ios",
 *       "platformVersion": "17.0",
 *       "trustedAt": "2026-05-10T...",
 *       "lastUnlockAt": "2026-05-10T...",
 *       "isActive": true,
 *       "deviceType": "phone"
 *     }
 *   ]
 * }
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getResolvedUser } from "@/Utils/RolePermissions";
import { HardwareUnlockDevice } from "@/Models/HardwareUnlockDevice";

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

        const devices = await HardwareUnlockDevice.find(
            { userId: user.userId || user.email },
            {
                deviceId: 1,
                deviceName: 1,
                deviceType: 1,
                platform: 1,
                platformVersion: 1,
                appVersion: 1,
                trustedAt: 1,
                lastUnlockAt: 1,
                isActive: 1,
                failedChallenges: 1,
                _id: 0
            }
        ).lean();

        return NextResponse.json(
            {
                success: true,
                devices,
                count: devices.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get hardware unlock devices error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch devices" },
            { status: 500 }
        );
    }
}
