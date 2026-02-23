/**
 * Admin Users API - list all Better Auth users
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/Library/auth";
import { MongoClient } from "mongodb";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req.headers);

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(100, parseInt(q.get("limit") || "20"));
        const search = q.get("search") || "";

        if (!process.env.MONGODB_01) {
            return NextResponse.json({ success: false, error: "DB not configured" }, { status: 500 });
        }

        const client = new MongoClient(process.env.MONGODB_01);
        await client.connect();
        const db = client.db("PRODUCTION_MeetBhingradiya");
        const collection = db.collection("user");

        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const total = await collection.countDocuments(query);
        const data = await collection
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        await client.close();

        return NextResponse.json({
            success: true,
            data,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
