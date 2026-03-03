/**
 * Admin — Role Definitions
 *
 * GET  /api/admin/role-definitions          — list all role definitions
 * POST /api/admin/role-definitions          — create a new custom role
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { RoleDefinition, seedBuiltinRoles } from "@Models/RoleDefinition";
import { requireAdmin } from "@Utils/RolePermissions";
import { ALL_PERMISSION_KEYS } from "@Config/Permissions";

export async function GET() {
    try {
        await dbConnect();
        const h = await headers();
        await requireAdmin(h);
        await seedBuiltinRoles();   // idempotent — only inserts if missing

        const roles = await RoleDefinition.find().sort({ order: 1, createdAt: 1 }).lean();
        return NextResponse.json({ success: true, roles });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        await requireAdmin(h);

        const { key, label, description, permissions = [], color = "#6366f1" } = await req.json();

        if (!key || !label) {
            return NextResponse.json({ success: false, error: "key and label are required." }, { status: 422 });
        }

        // Validate permission keys
        const invalid = permissions.filter((p: string) => !ALL_PERMISSION_KEYS.includes(p));
        if (invalid.length) {
            return NextResponse.json({ success: false, error: `Unknown permission keys: ${invalid.join(", ")}` }, { status: 422 });
        }

        const count = await RoleDefinition.countDocuments();
        const role  = await RoleDefinition.create({
            key       : key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            label     : label.trim(),
            description: (description || "").trim(),
            permissions,
            color,
            order     : count + 10,
            isBuiltin : false,
        });

        return NextResponse.json({ success: true, role }, { status: 201 });
    } catch (err: any) {
        if (err.code === 11000) {
            return NextResponse.json({ success: false, error: "A role with this key already exists." }, { status: 409 });
        }
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
