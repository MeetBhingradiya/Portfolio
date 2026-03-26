/**
 * Admin Users API - list all Better Auth users with their role data
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@Library/auth";
import { MongoClient } from "mongodb";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req.headers);

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(100, parseInt(q.get("limit") || "20"));
        const search = q.get("search") || "";
        const roleFilter = q.get("role") || "";

        if (!process.env.MONGODB_01) {
            return NextResponse.json({ success: false, error: "DB not configured" }, { status: 500 });
        }

        const client = new MongoClient(process.env.MONGODB_01);
        await client.connect();
        const db = client.db("PRODUCTION_MeetBhingradiya");
        const userCollection = db.collection("user");
        const roleCollection = db.collection("userroles");

        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const total = await userCollection.countDocuments(query);
        const users = await userCollection
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Enrich with role data from UserRole collection
        const emails = users.map(u => (u.email ?? "").toLowerCase());
        const roleRecords = await roleCollection
            .find({ email: { $in: emails } })
            .toArray();

        const roleMap: Record<string, { roles: string[]; permissions: any[] }> = {};
        for (const r of roleRecords) {
            roleMap[r.email] = { roles: r.roles ?? ["user"], permissions: r.permissions ?? [] };
        }

        const enriched = users.map(u => ({
            ...u,
            roles: roleMap[(u.email ?? "").toLowerCase()]?.roles ?? ["user"],
            hasRoleRecord: !!roleMap[(u.email ?? "").toLowerCase()],
        }));

        // Apply role filter after enrichment
        const filtered = roleFilter
            ? enriched.filter(u => u.roles.includes(roleFilter))
            : enriched;

        await client.close();

        return NextResponse.json({
            success: true,
            data: filtered,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
