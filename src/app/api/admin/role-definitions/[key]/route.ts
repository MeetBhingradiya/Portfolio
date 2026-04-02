/**
 * Admin — Single Role Definition
 *
 * GET    /api/admin/role-definitions/[key]
 * PATCH  /api/admin/role-definitions/[key]   — update label / description / permissions / color
 * DELETE /api/admin/role-definitions/[key]   — delete (custom roles only)
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { RoleDefinition } from "@Models/RoleDefinition";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import { ALL_PERMISSION_KEYS } from "@Config/Permissions";

type Params = { params: Promise<{ key: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const auth = await requirePermission(_req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const { key } = await params;

        const role = await RoleDefinition.findOne({ key }).lean();
        if (!role) return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
        return NextResponse.json({ success: true, role });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const { key } = await params;

        const body = await req.json();

        // Validate permissions if provided
        if (body.permissions) {
            const invalid = body.permissions.filter((p: string) => !ALL_PERMISSION_KEYS.includes(p));
            if (invalid.length) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Unknown permission keys: ${invalid.join(", ")}`
                    },
                    { status: 422 }
                );
            }
        }

        // key cannot be changed via PATCH
        const { key: _, isBuiltin: __, ...safe } = body;

        const role = await RoleDefinition.findOneAndUpdate({ key }, { $set: safe }, { new: true });
        if (!role) return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
        return NextResponse.json({ success: true, role });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const auth = await requirePermission(_req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const { key } = await params;

        const role = await RoleDefinition.findOne({ key });
        if (!role) return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
        if (role.isBuiltin) {
            return NextResponse.json({ success: false, error: "Built-in roles cannot be deleted." }, { status: 403 });
        }

        await role.deleteOne();
        return NextResponse.json({ success: true });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
