/**
 * Admin — Role Definitions
 *
 * GET  /api/admin/role-definitions          — list all role definitions
 * POST /api/admin/role-definitions          — create a new custom role
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { RoleDefinition, seedBuiltinRoles } from "@Models/RoleDefinition";
import { permissionError, requireAnyPermission, requirePermission } from "@Library/adminApiMiddleware";
import { isRolePermissionKey, normalizePermissionKeys } from "@Config/Permissions";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requireAnyPermission(req, ["admin.roles.manage", "admin.users.manage"]);
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await seedBuiltinRoles(); // idempotent — only inserts if missing

        const roles = await RoleDefinition.find().sort({ order: 1, createdAt: 1 }).lean();
        return NextResponse.json({
            success: true,
            roles: roles.map((role) => ({
                ...role,
                permissions: normalizePermissionKeys(role.permissions ?? [])
            }))
        });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const { key, label, description, permissions = [], color = "#6366f1" } = await req.json();

        if (!key || !label) {
            return NextResponse.json({ success: false, error: "key and label are required." }, { status: 422 });
        }

        // Validate permission keys
        const invalid = permissions.filter((p: string) => !isRolePermissionKey(p));
        if (invalid.length) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Unknown permission keys: ${invalid.join(", ")}`
                },
                { status: 422 }
            );
        }

        const role = await RoleDefinition.create({
            key: key
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_"),
            label: label.trim(),
            description: (description || "").trim(),
            permissions: normalizePermissionKeys(permissions),
            color,
            isBuiltin: false
        });

        return NextResponse.json({ success: true, role }, { status: 201 });
    } catch (err: any) {
        if (err.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    error: "A role with this key already exists."
                },
                { status: 409 }
            );
        }
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
