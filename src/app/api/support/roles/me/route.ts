/**
 * GET /api/support/roles/me
 * Returns the current user's resolved roles and permissions.
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function GET(req: NextRequest) {
    try {
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ success: true, data: user });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
