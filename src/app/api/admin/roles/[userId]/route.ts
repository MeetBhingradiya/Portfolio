/**
 * PATCH  /api/admin/roles/[userId]   → update roles/permissions
 * DELETE /api/admin/roles/[userId]   → remove role record (resets to default user)
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { UserRole } from "@Models/UserRole";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import { normalizePermissionKey } from "@Config/Permissions";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const admin = auth.session?.user;
        if (!admin) return permissionError(401, "Unauthorized: Not authenticated");

        const body = await req.json();
        const { roles, permissions, notes, confirmSelfRoleChange } = body;

        const existing = await UserRole.findOne({ userId }).lean();
        const existingEmail = String(existing?.email ?? "").toLowerCase();
        const adminEmail = String(admin.email ?? "").toLowerCase();
        const isSelfTarget = userId === admin.id || (existingEmail.length > 0 && existingEmail === adminEmail);
        const removesAdminFromSelf = isSelfTarget && Array.isArray(roles) && !roles.includes("admin");

        if (removesAdminFromSelf && !confirmSelfRoleChange) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Self role change confirmation required"
                },
                { status: 409 }
            );
        }

        // Validate and normalize incoming permissions
        let permsToSave: any | undefined = undefined;
        if (permissions !== undefined) {
            if (!Array.isArray(permissions)) {
                return NextResponse.json({ success: false, error: "permissions must be an array" }, { status: 422 });
            }
            permsToSave = [];
            for (const p of permissions) {
                const key = typeof p === "string" ? p : p?.key;
                const granted = typeof p === "object" && typeof p.granted === "boolean" ? p.granted : true;
                const normalized = normalizePermissionKey(String(key ?? "").trim());
                if (!normalized) {
                    return NextResponse.json({ success: false, error: `Unknown permission key: ${key}` }, { status: 422 });
                }
                permsToSave.push({ key: normalized, label: normalized, granted });
            }
        }

        const record = await UserRole.findOneAndUpdate(
            { userId },
            {
                $set: {
                    ...(roles !== undefined && {
                        roles: roles.length > 0 ? roles : ["user"]
                    }),
                    ...(permsToSave !== undefined && { permissions: permsToSave }),
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

        const admin = auth.session?.user;
        if (!admin) return permissionError(401, "Unauthorized: Not authenticated");

        const body = await req.json().catch(() => ({}));
        const confirmSelfRoleChange = Boolean(body?.confirmSelfRoleChange);
        const existing = await UserRole.findOne({ userId }).lean();
        const existingEmail = String(existing?.email ?? "").toLowerCase();
        const adminEmail = String(admin.email ?? "").toLowerCase();
        const isSelfTarget = userId === admin.id || (existingEmail.length > 0 && existingEmail === adminEmail);

        if (isSelfTarget && !confirmSelfRoleChange) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Self role change confirmation required"
                },
                { status: 409 }
            );
        }

        await UserRole.findOneAndDelete({ userId });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
