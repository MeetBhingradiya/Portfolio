/**
 * CDN Asset Serve Proxy
 * GET /api/cdn/[assetId]
 *
 * Proxies the file from the private GitHub repository.
 * Because the repo is private, raw.githubusercontent.com requires auth;
 * this route handles that transparently for clients.
 *
 * Cache headers:
 *   - Active assets: 1 year (immutable — assetId is content-addressed)
 *   - Missing:       5 minutes (give admin time to fix)
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubDownload } from "@Utils/GitHubCDN";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const { assetId } = await params;

    try {
        await dbConnect();
        const asset = await CDNAsset.findOne({ assetId }).lean();

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        if (asset.status === "deleted") {
            return NextResponse.json({ error: "Asset has been deleted" }, { status: 410 });
        }

        const result = await githubDownload(asset.githubRepo, asset.githubPath);

        if (!result) {
            // Mark as missing so admin dashboard surfaces the warning
            await CDNAsset.updateOne(
                { assetId },
                { $set: { status: "missing", lastChecked: new Date(), lastCheckOk: false } }
            );
            return NextResponse.json(
                { error: "Asset file not found in storage" },
                {
                    status: 404,
                    headers: { "Cache-Control": "public, max-age=300" },
                }
            );
        }

        return new NextResponse(new Uint8Array(result.buffer), {
            status: 200,
            headers: {
                "Content-Type": asset.mimeType,
                "Content-Length": String(result.size),
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Asset-Id": asset.assetId,
                "X-Asset-Type": asset.type,
            },
        });
    } catch (err: any) {
        console.error("[CDN Serve]", assetId, err);
        return NextResponse.json(
            { error: "Internal error" },
            { status: 500 }
        );
    }
}
