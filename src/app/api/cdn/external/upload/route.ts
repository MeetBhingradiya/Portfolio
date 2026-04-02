/**
 * External CDN Upload — authenticated with API key
 *
 * POST /api/cdn/external/upload
 *
 * Identical intent to /api/cdn/upload but:
 *   - Requires a valid CDN API key
 *   - Enforces per-key rate limits & file-size caps from the key's rate-limit policy
 *   - Records the upload against the key's usage counters
 *   - Marks uploads with uploadedBy = "ext:<appName>:<keyId>"
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import path from "path";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset, AssetType } from "@Models/CDNAsset";
import { githubUpload } from "@Utils/GitHubCDN";
import { validateCDNKey, consumeRateLimit, rateLimitHeaders } from "@Utils/CDNKeyAuth";
import { Config } from "@Config/Client";

function inferType(mime: string): AssetType {
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf" || mime.startsWith("text/")) return "document";
    if (mime.includes("svg") || mime.includes("icon") || mime.includes("x-icon")) return "icon";
    if (mime.startsWith("image/")) return "other";
    return "other";
}

export async function POST(req: NextRequest) {
    // ── Auth & rate limit ────────────────────────────────────────────────
    const validation = await validateCDNKey(req);
    if (!validation.ok || !validation.key) {
        return NextResponse.json({ error: validation.error }, { status: validation.status ?? 401 });
    }

    const rl = await consumeRateLimit(validation.key, "upload");
    if (!rl.allowed) {
        return NextResponse.json(
            { error: rl.error, retryAfter: rl.retryAfter },
            {
                status: 429,
                headers: { "Retry-After": String(rl.retryAfter ?? 60) }
            }
        );
    }

    const key = validation.key;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }

        // Apply per-key file size cap
        const maxBytes = key.rateLimit.maxFileSizeBytes;
        if (file.size > maxBytes) {
            return NextResponse.json(
                {
                    error: `File too large. Your plan allows up to ${Math.round(maxBytes / 1024 / 1024)} MB per file.`
                },
                { status: 413 }
            );
        }

        // Check mime type restriction
        const mimeType = file.type || "application/octet-stream";
        if (key.rateLimit.allowedMimeTypes.length > 0) {
            const allowed = key.rateLimit.allowedMimeTypes.some((pattern) => {
                if (pattern.endsWith("/*")) {
                    return mimeType.startsWith(pattern.slice(0, -1));
                }
                return mimeType === pattern;
            });
            if (!allowed) {
                return NextResponse.json(
                    {
                        error: `MIME type "${mimeType}" is not allowed for this API key. Allowed: ${key.rateLimit.allowedMimeTypes.join(", ")}`
                    },
                    { status: 415 }
                );
            }
        }

        // ── Resolve metadata ─────────────────────────────────────────────
        const rawType = (formData.get("type") as string | null) || "";
        const tags = ((formData.get("tags") as string | null) || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        const altText = (formData.get("altText") as string | null) || undefined;
        const context = (formData.get("context") as string | null) || undefined;

        const ext = path.extname(file.name) || "";
        const assetId = randomUUID().replace(/-/g, "");
        const storedFilename = `${assetId}${ext}`;

        const validTypes: AssetType[] = ["icon", "avatar", "banner", "background", "video", "document", "other"];
        const assetType: AssetType = validTypes.includes(rawType as AssetType) ? (rawType as AssetType) : inferType(mimeType);

        const folder = assetType === "other" ? "misc" : `${assetType}s`;
        const githubPath = `uploads/${folder}/${storedFilename}`;

        // ── Checksums ────────────────────────────────────────────────────
        const buffer = Buffer.from(await file.arrayBuffer());
        const checksumMd5 = createHash("md5").update(buffer).digest("hex");
        const checksumSha256 = createHash("sha256").update(buffer).digest("hex");

        // ── Upload to GitHub ─────────────────────────────────────────────
        const { sha, repo: githubRepo } = await githubUpload(
            githubPath,
            buffer,
            `cdn[ext]: upload ${assetType} "${file.name}" by ${key.appName} [${assetId}]`
        );

        // ── Persist to MongoDB ───────────────────────────────────────────
        await dbConnect();

        const doc = await CDNAsset.create({
            assetId,
            filename: file.name,
            githubRepo,
            githubPath,
            sha,
            checksumMd5,
            checksumSha256,
            mimeType,
            size: file.size,
            type: assetType,
            tags: [...tags, `api-key:${key.keyId}`, `app:${key.appName}`],
            context,
            uploadedBy: `ext:${key.appName}:${key.keyId}`,
            status: "active",
            lastChecked: new Date(),
            lastCheckOk: true,
            checksumVerified: true,
            altText
        });

        const cdnUrl = `${Config.Origin}/api/cdn/${assetId}`;

        return NextResponse.json(
            {
                assetId: doc.assetId,
                cdnUrl,
                filename: doc.filename,
                githubRepo: doc.githubRepo,
                size: doc.size,
                mimeType: doc.mimeType,
                type: doc.type,
                checksumMd5: doc.checksumMd5,
                checksumSha256: doc.checksumSha256
            },
            {
                status: 201,
                headers: rateLimitHeaders(rl)
            }
        );
    } catch (err: any) {
        console.error("[CDN External Upload]", err);
        return NextResponse.json({ error: err?.message || "Upload failed." }, { status: 500 });
    }
}
