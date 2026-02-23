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
import { requireAdmin } from "@/Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubStat, githubDownload } from "@Utils/GitHubCDN";

export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const deep = req.nextUrl.searchParams.get("deep") === "1";

        const assets = await CDNAsset.find({ status: { $ne: "deleted" } })
            .select("assetId githubRepo githubPath sha status checksumMd5")
            .lean();

        let checked = 0;
        let restored = 0;
        let nowMissing = 0;
        let checksumMismatch = 0;
        const missingIds: string[] = [];
        const mismatchIds: string[] = [];

        for (const asset of assets) {
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
                    ...(checksumVerified !== undefined ? { checksumVerified } : {}),
                };

                await CDNAsset.updateOne({ assetId: asset.assetId }, { $set: update });

                if (newStatus !== asset.status) {
                    if (!exists) { nowMissing++; missingIds.push(asset.assetId); }
                    else restored++;
                }
                checked++;
            } catch (err) {
                console.error(`[CDN Check] ${asset.assetId}:`, err);
            }

            // Throttle to stay under GitHub PAT rate limit (5000 req/h)
            await new Promise<void>((r) => setTimeout(r, deep ? 200 : 80));
        }

        return NextResponse.json({
            success: true,
            deep,
            checked,
            restored,
            nowMissing,
            checksumMismatch,
            missingIds,
            mismatchIds,
            checkedAt: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error("[CDN Check]", err);
        return NextResponse.json({ error: err?.message || "Check failed" }, { status: 500 });
    }
}
