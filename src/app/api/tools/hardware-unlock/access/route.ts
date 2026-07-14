/**
 * GET /api/tools/hardware-unlock/access
 * Access gate for the hardware unlock tool.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getResolvedUser } from "@Utils/RolePermissions";

const REQUIRED_PERMISSION = "Tools.Private.HardwareUnlock.Access";

export async function GET() {
    try {
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const allowed = user.isAdmin || user.effectivePermissions.has(REQUIRED_PERMISSION);
        if (!allowed) {
            return NextResponse.json(
                { success: false, error: `Forbidden: Permission required: ${REQUIRED_PERMISSION}` },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true, allowed: true, permission: REQUIRED_PERMISSION });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
    }
}
