/**
 * Admin — CDN Applications List
 *
 * GET /api/admin/cdn/applications
 *   List applications with optional filters: status, search, page, limit
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNApplication } from "@Models/CDNApplication";

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "cdn.applications.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const q = req.nextUrl.searchParams;
        const status = q.get("status") || "";
        const search = q.get("search") || "";
        const page = Math.max(1, parseInt(q.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(q.get("limit") || "50", 10)));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { applicantName: { $regex: search, $options: "i" } },
                { applicantEmail: { $regex: search, $options: "i" } },
                { appName: { $regex: search, $options: "i" } },
                { appOrganisation: { $regex: search, $options: "i" } }
            ];
        }

        const [apps, total, counts] = await Promise.all([
            CDNApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            CDNApplication.countDocuments(filter),
            CDNApplication.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        ]);

        const statusCounts = Object.fromEntries(counts.map((c: any) => [c._id, c.count]));

        return NextResponse.json({
            applications: apps,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            statusCounts
        });
    } catch (err: any) {
        console.error("[Admin CDN Applications GET]", err);
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}
