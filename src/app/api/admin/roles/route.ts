/**
 * GET  /api/admin/roles        → list all role records
 * POST /api/admin/roles        → upsert roles for a user (looks up userId from email if needed)
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { UserRole } from "@Models/UserRole";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

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
        const auth = await requirePermission(req, "admin.roles.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const admin = auth.session?.user;
        if (!admin) return permissionError(401, "Unauthorized: Not authenticated");

        const body = await req.json();
        let { userId, email, roles, permissions, notes } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
        }
        // Auto-resolve userId from Better Auth user collection when not supplied
        if (!userId) {
            const db = mongoose.connection.db;
            if (!db) {
                return NextResponse.json({ success: false, error: "DB not ready" }, { status: 503 });
            }
            const user = await db.collection("user").findOne(
                { email: email.toLowerCase() },
                { projection: { _id: 1 } }
            );
            if (!user) {
                return NextResponse.json({ success: false, error: "No user found with that email" }, { status: 404 });
            }
            userId = String(user._id);
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
