/**
 * Admin — CDN Assets API
 * GET  /api/admin/cdn          — list assets (paginated, filterable)
 * POST /api/admin/cdn/check    — trigger bulk integrity check (separate route file)
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "cdn.keys.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const q = req.nextUrl.searchParams;
        const search = q.get("search") || "";
        const type = q.get("type") || "";
        const status = q.get("status") || "";
        const repo = q.get("repo") || "";
        const page = Math.max(1, parseInt(q.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(q.get("limit") || "50", 10)));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (search) {
            filter.$or = [
                { filename: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
                { altText: { $regex: search, $options: "i" } },
                { assetId: { $regex: search, $options: "i" } },
            ];
        }
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (repo) filter.githubRepo = repo;

        const [assets, total] = await Promise.all([
            CDNAsset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            CDNAsset.countDocuments(filter),
        ]);

        // Summary counts for the dashboard header
        const [activeCount, missingCount, totalSize] = await Promise.all([
            CDNAsset.countDocuments({ status: "active" }),
            CDNAsset.countDocuments({ status: "missing" }),
            CDNAsset.aggregate([{ $group: { _id: null, total: { $sum: "$size" } } }]).then(
                (r) => r[0]?.total ?? 0
            ),
        ]);

        return NextResponse.json({
            assets,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            summary: { activeCount, missingCount, totalSize },
        });
    } catch (err: any) {
        console.error("[Admin CDN GET]", err);
        return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
    }
}
