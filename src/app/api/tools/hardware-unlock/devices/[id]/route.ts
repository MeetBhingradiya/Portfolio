/**
 * DELETE /api/tools/hardware-unlock/devices/[id]
 * Revoke/delete a paired device
 * 
 * Protected: Requires authentication + permission
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Device revoked successfully"
 * }
 */

import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { getResolvedUser } from "@/Utils/RolePermissions";
import { HardwareUnlockDevice } from "@/Models/HardwareUnlockDevice";

const REQUIRED_PERMISSION = "Tools.Private.HardwareUnlock.Access";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: deviceId } = await params;
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

        // Find device and verify ownership
        const device = await HardwareUnlockDevice.findOne({ deviceId });

        if (!device) {
            return NextResponse.json(
                { success: false, error: "Device not found" },
                { status: 404 }
            );
        }

        if (device.userId !== (user.userId || user.email)) {
            return NextResponse.json(
                { success: false, error: "Cannot revoke device owned by another user" },
                { status: 403 }
            );
        }

        // Revoke device
        await HardwareUnlockDevice.updateOne(
            { deviceId },
            {
                isActive: false,
                revokedAt: new Date(),
                revokationReason: "User initiated revocation"
            }
        );

        return NextResponse.json(
            {
                success: true,
                message: "Device revoked successfully",
                deviceId
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Revoke hardware unlock device error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to revoke device" },
            { status: 500 }
        );
    }
}
