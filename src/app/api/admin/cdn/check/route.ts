/**
 * Admin — CDN Integrity Check API
 * POST /api/admin/cdn/check
 *
 * Query params:
 *   deep=1  — also download each file and verify its MD5 checksum (slower, more thorough)
 *
 * Iterates over all active/missing assets, verifies file existence in GitHub,
 * optionally verifies checksum, and updates status accordingly.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubStat, githubDownload } from "@Utils/GitHubCDN";

export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "cdn.keys.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const deep = req.nextUrl.searchParams.get("deep") === "1";
        const cursor = req.nextUrl.searchParams.get("cursor") || "";
        const limitParam = parseInt(req.nextUrl.searchParams.get("limit") || "", 10);
        const budgetParam = parseInt(req.nextUrl.searchParams.get("budgetMs") || "", 10);

        const limit = Number.isFinite(limitParam) ? Math.min(100, Math.max(1, limitParam)) : deep ? 12 : 60;
        const budgetMs = Number.isFinite(budgetParam) ? Math.min(9000, Math.max(1000, budgetParam)) : 8000;

        const query: Record<string, any> = { status: { $ne: "deleted" } };
        if (cursor) query._id = { $gt: cursor };

        const assets = await CDNAsset.find(query)
            .sort({ _id: 1 })
            .limit(limit)
            .select("_id assetId githubRepo githubPath sha status checksumMd5")
            .lean();

        let checked = 0;
        let restored = 0;
        let nowMissing = 0;
        let checksumMismatch = 0;
        const missingIds: string[] = [];
        const mismatchIds: string[] = [];
        const startedAt = Date.now();
        let lastCursor = cursor;

        for (const asset of assets) {
            if (Date.now() - startedAt >= budgetMs) break;
            try {
                const info = await githubStat(asset.githubRepo, asset.githubPath);
                const exists = info !== null;
                const newStatus = exists ? "active" : "missing";
                let checksumVerified: boolean | undefined;

                if (exists && deep && asset.checksumMd5) {
                    // Download and verify bytes
                    const dl = await githubDownload(asset.githubRepo, asset.githubPath);
                    if (dl) {
                        const computedMd5 = createHash("md5").update(dl.buffer).digest("hex");
                        checksumVerified = computedMd5 === asset.checksumMd5;
                        if (!checksumVerified) {
                            checksumMismatch++;
                            mismatchIds.push(asset.assetId);
                        }
                    }
                }

                const update: Record<string, any> = {
                    status: newStatus,
                    lastChecked: new Date(),
                    lastCheckOk: exists,
                    ...(exists && info ? { sha: info.sha } : {}),
                    ...(checksumVerified !== undefined ? { checksumVerified } : {})
                };

                await CDNAsset.updateOne({ assetId: asset.assetId }, { $set: update });

                if (newStatus !== asset.status) {
                    if (!exists) {
                        nowMissing++;
                        missingIds.push(asset.assetId);
                    } else restored++;
                }
                checked++;
                lastCursor = String(asset._id);
            } catch (err) {
                console.error(`[CDN Check] ${asset.assetId}:`, err);
            }

            // Throttle GitHub requests to avoid burst limits.
            await new Promise<void>((r) => setTimeout(r, deep ? 90 : 25));
        }

        const hasCandidateMore = checked < assets.length || assets.length === limit;
        let hasMore = false;
        if (hasCandidateMore && lastCursor) {
            const nextDoc = await CDNAsset.findOne({ status: { $ne: "deleted" }, _id: { $gt: lastCursor } })
                .select("_id")
                .lean();
            hasMore = !!nextDoc;
        }

        return NextResponse.json({
            success: true,
            deep,
            chunked: true,
            hasMore,
            nextCursor: hasMore ? lastCursor : null,
            limit,
            budgetMs,
            checked,
            restored,
            nowMissing,
            checksumMismatch,
            missingIds,
            mismatchIds,
            checkedAt: new Date().toISOString()
        });
    } catch (err: any) {
        console.error("[CDN Check]", err);
        return NextResponse.json({ error: err?.message || "Check failed" }, { status: 500 });
    }
}
