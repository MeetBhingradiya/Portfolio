/**
 * External CDN Asset Serve — authenticated with API key
 *
 * GET /api/cdn/external/[assetId]
 *
 * Like /api/cdn/[assetId] but enforces per-key rate limits.
 * Useful when an external app needs to proxy CDN assets through its own
 * backend without exposing the asset directly to browsers.
 *
 * Rate-limit headers are returned on every response:
 *   X-RateLimit-Remaining-Minute
 *   X-RateLimit-Remaining-Hour
 *   X-RateLimit-Remaining-Day
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubDownload } from "@Utils/GitHubCDN";
import { validateCDNKey, consumeRateLimit, rateLimitHeaders } from "@Utils/CDNKeyAuth";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    // ── Auth & rate limit ────────────────────────────────────────────────
    const validation = await validateCDNKey(req);
    if (!validation.ok || !validation.key) {
        return NextResponse.json({ error: validation.error }, { status: validation.status ?? 401 });
    }

    const rl = await consumeRateLimit(validation.key, "download");
    if (!rl.allowed) {
        return NextResponse.json(
            { error: rl.error, retryAfter: rl.retryAfter },
            {
                status: 429,
                headers: { "Retry-After": String(rl.retryAfter ?? 60) },
            }
        );
    }

    // ── Serve asset ──────────────────────────────────────────────────────
    const { assetId } = await params;

    try {
        await dbConnect();
        const asset = await CDNAsset.findOne({ assetId }).lean();

        if (!asset) {
            return NextResponse.json({ error: "Asset not found." }, { status: 404 });
        }

        if (asset.status === "deleted") {
            return NextResponse.json({ error: "Asset has been deleted." }, { status: 410 });
        }

        const result = await githubDownload(asset.githubRepo, asset.githubPath);

        if (!result) {
            await CDNAsset.updateOne(
                { assetId },
                { $set: { status: "missing", lastChecked: new Date(), lastCheckOk: false } }
            );
            return NextResponse.json(
                { error: "Asset file not found in storage." },
                { status: 404, headers: { "Cache-Control": "public, max-age=300" } }
            );
        }

        return new NextResponse(new Uint8Array(result.buffer), {
            status: 200,
            headers: {
                "Content-Type":   asset.mimeType,
                "Content-Length": String(result.size),
                "Cache-Control":  "public, max-age=31536000, immutable",
                "X-Asset-Id":     asset.assetId,
                "X-Asset-Type":   asset.type,
                ...rateLimitHeaders(rl),
            },
        });
    } catch (err: any) {
        console.error("[CDN External Serve]", assetId, err);
        return NextResponse.json({ error: "Internal error." }, { status: 500 });
    }
}
