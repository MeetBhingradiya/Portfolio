/**
 * PATCH  /api/admin/roles/[userId]   → update roles/permissions
 * DELETE /api/admin/roles/[userId]   → remove role record (resets to default user)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { UserRole } from "@Models/UserRole";
import { requireAdmin } from "@Utils/RolePermissions";

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        const admin = await requireAdmin(h);

        const body = await req.json();
        const record = await UserRole.findOneAndUpdate(
            { userId: params.userId },
            { ...body, grantedBy: admin.email },
            { new: true }
        );
        if (!record) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: record });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        await requireAdmin(h);

        await UserRole.findOneAndDelete({ userId: params.userId });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
