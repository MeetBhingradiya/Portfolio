/**
 * Admin — CDN Asset Restore from Commit
 * POST /api/admin/cdn/[id]/restore
 *
 * Body: { commitSha: string }
 *
 * Re-uploads the file content from the given commit back to HEAD in GitHub,
 * then updates the MongoDB document to reflect the new SHA and marks the
 * asset as "active" again (useful after accidental deletion).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubRestoreFromCommit } from "@Utils/GitHubCDN";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const { id } = await params;
        const body = await req.json();
        const { commitSha } = body as { commitSha?: string };

        if (!commitSha || typeof commitSha !== "string" || commitSha.trim().length < 7) {
            return NextResponse.json({ error: "commitSha is required" }, { status: 400 });
        }

        const asset = await CDNAsset.findById(id);
        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        // Re-upload from the historical commit to HEAD
        const { newSha, size } = await githubRestoreFromCommit(
            asset.githubRepo,
            asset.githubPath,
            commitSha.trim()
        );

        // Update MongoDB record
        asset.sha = newSha;
        asset.size = size;
        asset.status = "active";
        asset.lastChecked = new Date();
        asset.lastCheckOk = true;
        await asset.save();

        return NextResponse.json({
            success: true,
            message: `Asset restored from commit ${commitSha.slice(0, 7)} successfully.`,
            newSha,
            size,
            status: "active",
        });
    } catch (err: any) {
        console.error("[CDN Restore]", err);
        return NextResponse.json({ error: err?.message || "Failed to restore" }, { status: 500 });
    }
}
