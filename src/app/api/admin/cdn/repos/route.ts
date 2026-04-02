/**
 * Admin — CDN Repos API
 * GET /api/admin/cdn/repos
 *
 * Lists all auto-detected GitHub repositories matching the CDN_GITHUB_REPO_PREFIX.
 * Returns their names, sizes, and how many assets are stored in each.
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { listCDNRepos } from "@Utils/GitHubCDN";

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "cdn.keys.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const force = req.nextUrl.searchParams.get("refresh") === "1";
        const [repos, _] = await Promise.all([listCDNRepos(force), dbConnect()]);

        // Per-repo asset counts from MongoDB
        const counts: { _id: string; count: number; totalSize: number }[] = await CDNAsset.aggregate([
            { $match: { status: { $ne: "deleted" } } },
            {
                $group: {
                    _id: "$githubRepo",
                    count: { $sum: 1 },
                    totalSize: { $sum: "$size" }
                }
            }
        ]);

        const countMap = Object.fromEntries(counts.map((c) => [c._id, c]));

        const enriched = repos.map((r) => ({
            name: r.name,
            fullName: r.fullName,
            sizeKb: r.sizeKb,
            private: r.private,
            assetCount: countMap[r.name]?.count ?? 0,
            assetBytes: countMap[r.name]?.totalSize ?? 0
        }));

        return NextResponse.json({ repos: enriched });
    } catch (err: any) {
        console.error("[Admin CDN Repos]", err);
        return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
    }
}
