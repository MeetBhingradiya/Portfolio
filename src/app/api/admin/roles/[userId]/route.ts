/**
 * PATCH  /api/admin/roles/[userId]   → update roles/permissions
 * DELETE /api/admin/roles/[userId]   → remove role record (resets to default user)
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { UserRole } from "@Models/UserRole";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const admin = auth.session?.user;
        if (!admin) return permissionError(401, "Unauthorized: Not authenticated");

        const body = await req.json();
        const { roles, permissions, notes } = body;
        const record = await UserRole.findOneAndUpdate(
            { userId },
            {
                $set: {
                    ...(roles !== undefined && {
                        roles: roles.length > 0 ? roles : ["user"]
                    }),
                    ...(permissions !== undefined && { permissions }),
                    ...(notes !== undefined && { notes }),
                    grantedBy: admin.email
                }
            },
            { new: true, runValidators: false }
        );
        if (!record) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: record });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await UserRole.findOneAndDelete({ userId });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
