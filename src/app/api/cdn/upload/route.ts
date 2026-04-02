/**
 * CDN Upload API
 * POST /api/cdn/upload
 *
 * Accepts multipart/form-data with:
 *   file     — the asset file (required)
 *   type     — asset type: icon | avatar | banner | background | video | document | other
 *   tags     — comma-separated tag list  (optional)
 *   altText  — accessibility description (optional)
 *
 * Returns:
 *   { assetId, cdnUrl, filename, size, type }
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import path from "path";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset, AssetType } from "@Models/CDNAsset";
import { githubUpload } from "@Utils/GitHubCDN";
import { Config } from "@Config/Client";

// Categorise by MIME type if the caller didn't specify
function inferType(mime: string): AssetType {
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf" || mime.startsWith("text/")) return "document";
    if (mime.includes("svg") || mime.includes("icon") || mime.includes("x-icon")) return "icon";
    if (mime.startsWith("image/")) return "other"; // refined below by name
    return "other";
}

// Maximum file size: 49 MB (GitHub file limit is 50 MB but leave a margin)
const MAX_BYTES = 49 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                {
                    error: `File too large. Maximum is ${MAX_BYTES / 1024 / 1024} MB.`
                },
                { status: 413 }
            );
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

        const mimeType = file.type || "application/octet-stream";

        const validTypes: AssetType[] = ["icon", "avatar", "banner", "background", "video", "document", "other"];
        const assetType: AssetType = (validTypes.includes(rawType as AssetType) ? rawType : inferType(mimeType)) as AssetType;

        // Group into sub-folders by type to keep the repo tidy
        const folder = assetType === "other" ? "misc" : `${assetType}s`;
        const githubPath = `uploads/${folder}/${storedFilename}`;

        // ── Compute checksums ──────────────────────────────────────────
        const buffer = Buffer.from(await file.arrayBuffer());
        const checksumMd5 = createHash("md5").update(buffer).digest("hex");
        const checksumSha256 = createHash("sha256").update(buffer).digest("hex");

        // ── Upload to GitHub (auto-selects best repo by size) ──────────
        const { sha, repo: githubRepo } = await githubUpload(githubPath, buffer, `cdn: upload ${assetType} "${file.name}" [${assetId}]`);

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
            tags,
            context,
            uploadedBy: "system",
            status: "active",
            lastChecked: new Date(),
            lastCheckOk: true,
            checksumVerified: true,
            altText
        });

        const cdnUrl = `${Config.Origin}/api/cdn/${assetId}`;

        return NextResponse.json({
            assetId: doc.assetId,
            cdnUrl,
            filename: doc.filename,
            githubRepo: doc.githubRepo,
            size: doc.size,
            mimeType: doc.mimeType,
            type: doc.type,
            githubPath: doc.githubPath,
            checksumMd5: doc.checksumMd5,
            checksumSha256: doc.checksumSha256
        });
    } catch (err: any) {
        console.error("[CDN Upload]", err);
        return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
    }
}
