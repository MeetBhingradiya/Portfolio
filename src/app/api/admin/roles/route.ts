/**
 * GET  /api/admin/roles        → list all role records
 * POST /api/admin/roles        → grant roles to a user
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { UserRole } from "@Models/UserRole";
import { requireAdmin } from "@Utils/RolePermissions";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        await requireAdmin(h);

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(100, parseInt(q.get("limit") || "20"));
        const search = q.get("search") || "";
        const role = q.get("role") || "";

        const query: any = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: "i" } },
                { userId: { $regex: search, $options: "i" } },
            ];
        }
        if (role) query.roles = role;

        const total = await UserRole.countDocuments(query);
        const data = await UserRole.find(query)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const admin = await requireAdmin(h);

        const body = await req.json();
        const { userId, email, roles, permissions, notes } = body;

        if (!userId || !email) {
            return NextResponse.json({ success: false, error: "userId and email are required" }, { status: 400 });
        }

        const record = await UserRole.findOneAndUpdate(
            { userId },
            {
                userId,
                email: email.toLowerCase(),
                roles: roles ?? ["user"],
                permissions: permissions ?? [],
                notes,
                grantedBy: admin.email,
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 400;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
