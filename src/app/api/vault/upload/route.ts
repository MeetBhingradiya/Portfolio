/**
 * Vault Upload API — POST /api/vault/upload
 *
 * Accepts multipart/form-data with:
 *   file        — binary chunk (required)
 *   chunkIndex  — 0-based chunk number (default 0)
 *   totalChunks — total number of chunks (default 1 for small files)
 *   docId       — existing docId for multi-chunk uploads (empty for first chunk)
 *   filename    — display name for the file (first chunk only)
 *   tags        — comma-separated tags (optional, first chunk only)
 *   description — description text (optional, first chunk only)
 *
 * For files ≤ 48 MB a single chunk is expected (totalChunks = 1).
 * For larger files the client slices the file into ≤ 48 MB segments and
 * sends them sequentially; the server accepts up to 49 MB per chunk.
 * On the final chunk the VaultDocument record is created automatically.
 *
 * Files are stored in the GitHub CDN via the existing githubUpload utility.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import path from "path";
import dbConnect from "@Utils/dbConnect";
import { getSession } from "@Library/auth";
import { VaultAccess } from "@Models/VaultAccess";
import { VaultDocument, VaultFileType } from "@Models/VaultDocument";
import { CDNAsset } from "@Models/CDNAsset";
import { githubUpload } from "@Utils/GitHubCDN";
import { encryptVaultBuffer, getVaultEncryptionVersion } from "@Utils/VaultFileCrypto";

const CHUNK_MAX = 49 * 1024 * 1024; // 49 MB — GitHub hard limit

// In-memory accumulator for in-progress multi-chunk uploads.
// Key: docId (generated on first chunk).
// LIMITATION: This only works within a single serverless instance lifetime.
// For production with multiple instances or long-running uploads, a Redis
// or database-backed session store would be required. For single-instance
// deployments (e.g. Vercel edge with sticky routing) this is sufficient.
const pendingChunks = new Map<
    string,
    {
        chunks: Array<{
            chunkIndex: number;
            assetId: string;
            githubRepo: string;
            githubPath: string;
            sha: string;
            size: number;
            iv: string;
            authTag: string;
            encryptedSize: number;
        }>;
        totalChunks: number;
        filename: string;
        originalName: string;
        mimeType: string;
        totalSize: number;
        userId: string;
        tags: string[];
        description: string;
    }
>();

export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        await dbConnect();

        const access = await VaultAccess.findOne({ userId, enabled: true }).lean();
        if (!access) {
            return NextResponse.json({ error: "Vault access not granted" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        if (file.size > CHUNK_MAX) {
            return NextResponse.json(
                { error: `Chunk too large. Maximum chunk size is ${CHUNK_MAX / 1024 / 1024} MB.` },
                { status: 413 }
            );
        }

        const chunkIndex = parseInt((formData.get("chunkIndex") as string) || "0", 10);
        const totalChunks = Math.max(1, parseInt((formData.get("totalChunks") as string) || "1", 10));
        const isFirstChunk = chunkIndex === 0;
        const isLastChunk = chunkIndex === totalChunks - 1;

        // docId: provided for chunks 1..N, generated for chunk 0
        let docId = (formData.get("docId") as string | null)?.trim() || "";
        if (!docId) {
            if (!isFirstChunk) {
                return NextResponse.json({ error: "docId is required for non-first chunks" }, { status: 400 });
            }
            docId = randomUUID().replace(/-/g, "");
        }

        const filename = ((formData.get("filename") as string | null) || file.name).slice(0, 255);
        const originalName = file.name;
        const mimeType = file.type || "application/octet-stream";
        const tags = ((formData.get("tags") as string | null) || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        const description = ((formData.get("description") as string | null) || "").slice(0, 1000);

        // ── Upload chunk to GitHub CDN ────────────────────────────────────
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name) || "";
        const chunkSuffix = totalChunks > 1 ? `.part${chunkIndex}` : "";
        const assetId = randomUUID().replace(/-/g, "");
        const storedFilename = `${assetId}${chunkSuffix}${ext}`;
        const githubPath = `vault/${userId}/${docId}/${storedFilename}`;

        const { encryptedBuffer, iv, authTag } = encryptVaultBuffer(buffer);
        const { sha, repo: githubRepo } = await githubUpload(
            githubPath,
            encryptedBuffer,
            `vault: upload chunk ${chunkIndex + 1}/${totalChunks} for "${filename}" [${docId}]`
        );

        // Persist CDNAsset record for integrity tracking
        const checksumMd5 = createHash("md5").update(buffer).digest("hex");
        const checksumSha256 = createHash("sha256").update(buffer).digest("hex");
        await CDNAsset.create({
            assetId,
            filename: storedFilename,
            githubRepo,
            githubPath,
            sha,
            checksumMd5,
            checksumSha256,
            mimeType: "application/octet-stream",
            size: encryptedBuffer.length,
            type: "document",
            tags: ["vault", "encrypted"],
            context: `vault:${userId}`,
            uploadedBy: userId,
            status: "active",
            lastChecked: new Date(),
            lastCheckOk: true,
            checksumVerified: true
        });

        const chunkMeta = {
            chunkIndex,
            assetId,
            githubRepo,
            githubPath,
            sha,
            size: file.size,
            iv,
            authTag,
            encryptedSize: encryptedBuffer.length
        };

        // ── Single-chunk upload ────────────────────────────────────────────
        if (totalChunks === 1) {
            // Enforce storage quota
            const [agg] = await VaultDocument.aggregate([
                { $match: { userId, status: "active" } },
                { $group: { _id: null, total: { $sum: "$size" } } }
            ]);
            const currentUsed = agg?.total ?? 0;
            if (currentUsed + file.size > access.storageLimitBytes) {
                return NextResponse.json({ error: "Storage quota exceeded" }, { status: 413 });
            }

            const docType: VaultFileType = inferType(mimeType);
            await VaultDocument.create({
                docId,
                userId,
                filename,
                originalName,
                mimeType,
                size: file.size,
                type: docType,
                chunks: [chunkMeta],
                isChunked: false,
                encryptedAtRest: true,
                encryptionVersion: getVaultEncryptionVersion(),
                tags,
                description,
                shareLinks: [],
                isShared: false,
                status: "active"
            });

            VaultAccess.updateOne(
                { userId },
                { $inc: { fileCount: 1, usedBytes: file.size }, $set: { lastActivity: new Date() } }
            ).catch((e) => console.error("[Vault Upload] single-chunk cache update failed", e));

            return NextResponse.json({ docId, complete: true }, { status: 201 });
        }

        // ── Multi-chunk: accumulate ────────────────────────────────────────
        if (isFirstChunk) {
            pendingChunks.set(docId, {
                chunks: [chunkMeta],
                totalChunks,
                filename,
                originalName,
                mimeType,
                totalSize: file.size,
                userId,
                tags,
                description
            });
            return NextResponse.json({ docId, chunkIndex, complete: false });
        }

        // Non-first, non-last chunk
        const pending = pendingChunks.get(docId);
        if (!pending || pending.userId !== userId) {
            return NextResponse.json({ error: "Upload session not found" }, { status: 400 });
        }
        pending.chunks.push(chunkMeta);
        pending.totalSize += file.size;

        if (!isLastChunk) {
            return NextResponse.json({ docId, chunkIndex, complete: false });
        }

        // ── Last chunk: finalise ───────────────────────────────────────────
        const totalSize = pending.totalSize;

        const [agg] = await VaultDocument.aggregate([
            { $match: { userId, status: "active" } },
            { $group: { _id: null, total: { $sum: "$size" } } }
        ]);
        const currentUsed = agg?.total ?? 0;
        if (currentUsed + totalSize > access.storageLimitBytes) {
            pendingChunks.delete(docId);
            return NextResponse.json({ error: "Storage quota exceeded" }, { status: 413 });
        }

        const sortedChunks = [...pending.chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
        await VaultDocument.create({
            docId,
            userId,
            filename: pending.filename,
            originalName: pending.originalName,
            mimeType: pending.mimeType,
            size: totalSize,
            type: inferType(pending.mimeType),
            chunks: sortedChunks,
            isChunked: true,
            encryptedAtRest: true,
            encryptionVersion: getVaultEncryptionVersion(),
            tags: pending.tags,
            description: pending.description,
            shareLinks: [],
            isShared: false,
            status: "active"
        });

        pendingChunks.delete(docId);

        VaultAccess.updateOne(
            { userId },
            { $inc: { fileCount: 1, usedBytes: totalSize }, $set: { lastActivity: new Date() } }
        ).catch((e) => console.error("[Vault Upload] multi-chunk cache update failed", e));

        return NextResponse.json({ docId, complete: true }, { status: 201 });
    } catch (err: any) {
        console.error("[Vault Upload]", err);
        return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferType(mime: string): VaultFileType {
    if (mime === "application/pdf") return "pdf";
    if (
        mime.includes("word") ||
        mime.includes("officedocument.wordprocessingml") ||
        mime.includes("markdown") ||
        mime === "text/plain" ||
        mime === "application/rtf"
    )
        return "document";
    if (mime.includes("presentation") || mime.includes("powerpoint") || mime.includes("officedocument.presentationml"))
        return "presentation";
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    return "other";
}
