/**
 * Admin - CDN Asset Restore from Commit
 * POST /api/admin/cdn/[id]/restore
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubRestoreFromCommit } from "@Utils/GitHubCDN";

function isValidCommitSha(value: string) {
    return /^[a-fA-F0-9]{7,40}$/.test(value);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "cdn.keys.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await dbConnect();
        const { id } = await ctx.params;

        const asset = await CDNAsset.findById(id);
        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const body = await req.json().catch(() => ({}));
        const commitShaRaw = String(body?.commitSha || "").trim();

        if (!commitShaRaw || !isValidCommitSha(commitShaRaw)) {
            return NextResponse.json(
                {
                    error: "Invalid commit SHA. Provide 7-40 hex characters."
                },
                { status: 400 }
            );
        }

        const restored = await githubRestoreFromCommit(asset.githubRepo, asset.githubPath, commitShaRaw);

        asset.sha = restored.newSha;
        asset.size = restored.size;
        asset.checksumMd5 = restored.checksumMd5;
        asset.checksumSha256 = restored.checksumSha256;
        asset.status = "active";
        asset.lastChecked = new Date();
        asset.lastCheckOk = true;
        asset.checksumVerified = true;
        await asset.save();

        return NextResponse.json({
            success: true,
            message: "Asset restored from commit.",
            restoredFromCommit: commitShaRaw,
            asset: {
                id: asset._id,
                assetId: asset.assetId,
                sha: asset.sha,
                size: asset.size,
                status: asset.status,
                checksumMd5: asset.checksumMd5,
                checksumSha256: asset.checksumSha256
            }
        });
    } catch (err: any) {
        console.error("[CDN Restore]", err);

        const msg = String(err?.message || "Failed to restore");
        const compactHint = msg.includes("Cannot fetch commit")
            ? " Commit may be unavailable due to history compaction. Set CDN_COMPACT_HISTORY=false for compliance retention."
            : "";

        return NextResponse.json({ error: `${msg}${compactHint}` }, { status: 500 });
    }
}
