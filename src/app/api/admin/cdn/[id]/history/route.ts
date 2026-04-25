/**
 * Admin - CDN Asset Commit History
 * GET /api/admin/cdn/[id]/history
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubListCommits } from "@Utils/GitHubCDN";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "cdn.keys.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await dbConnect();
        const { id } = await ctx.params;

        const asset = await CDNAsset.findById(id)
            .select("assetId filename githubRepo githubPath status")
            .lean();

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const commits = await githubListCommits(asset.githubRepo, asset.githubPath, 50);

        return NextResponse.json({
            success: true,
            asset: {
                id: asset._id,
                assetId: asset.assetId,
                filename: asset.filename,
                githubRepo: asset.githubRepo,
                githubPath: asset.githubPath,
                status: asset.status
            },
            commits,
            compactHistoryEnabled: (process.env.CDN_COMPACT_HISTORY ?? "false").trim().toLowerCase() === "true"
        });
    } catch (err: any) {
        console.error("[CDN History]", err);
        return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
    }
}
