/**
 * Admin — CDN Asset Commit History
 * GET /api/admin/cdn/[id]/history
 *
 * Returns the full GitHub commit history for the asset's file path,
 * so the admin can see every version ever stored (including after deletion).
 *
 * Query params:
 *   perPage   — max commits to return (default 50, max 100)
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubListCommits } from "@Utils/GitHubCDN";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requirePermission(req, "cdn.keys.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const { id } = await params;
        const perPage = Math.min(
            100,
            Math.max(1, parseInt(req.nextUrl.searchParams.get("perPage") || "50", 10))
        );

        const asset = await CDNAsset.findById(id).lean();
        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const commits = await githubListCommits(asset.githubRepo, asset.githubPath, perPage);

        return NextResponse.json({
            success: true,
            asset: {
                assetId: asset.assetId,
                filename: asset.filename,
                githubRepo: asset.githubRepo,
                githubPath: asset.githubPath,
                status: asset.status,
            },
            commits,
        });
    } catch (err: any) {
        console.error("[CDN History]", err);
        return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
    }
}
