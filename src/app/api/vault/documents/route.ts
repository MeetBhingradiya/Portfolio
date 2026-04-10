/**
 * Vault Documents API — GET (list) + POST (create metadata record)
 * GET  /api/vault/documents  — list the user's documents with optional filtering
 * POST /api/vault/documents  — register a completed upload (called by the upload flow)
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import dbConnect from "@Utils/dbConnect";
import { getSession } from "@Library/auth";
import { VaultAccess } from "@Models/VaultAccess";
import { VaultDocument, VaultFileType } from "@Models/VaultDocument";

const PAGE_SIZE = 20;

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
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

        const sp = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
        const type = sp.get("type") || "ALL";
        const search = sp.get("search")?.trim() || "";
        const shared = sp.get("shared");

        const query: Record<string, unknown> = { userId, status: "active" };
        if (type !== "ALL") query.type = type.toLowerCase();
        if (shared === "true") query.isShared = true;
        if (search) {
            query.$or = [
                { filename: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const [docs, total] = await Promise.all([
            VaultDocument.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .select("-chunks")
                .lean(),
            VaultDocument.countDocuments(query)
        ]);

        return NextResponse.json({
            docs,
            total,
            page,
            pages: Math.ceil(total / PAGE_SIZE)
        });
    } catch (err: any) {
        console.error("[Vault List]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────

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

        const body = await req.json();
        const {
            filename,
            originalName,
            mimeType,
            size,
            type,
            chunks,
            isChunked = false,
            tags = [],
            description = ""
        } = body;

        if (!filename || !originalName || !mimeType || !size || !chunks?.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Enforce storage quota
        const [agg] = await VaultDocument.aggregate([
            { $match: { userId, status: "active" } },
            { $group: { _id: null, total: { $sum: "$size" } } }
        ]);
        const currentUsed = agg?.total ?? 0;
        if (currentUsed + size > access.storageLimitBytes) {
            return NextResponse.json(
                {
                    error: `Storage quota exceeded. Used ${formatBytes(currentUsed)} of ${formatBytes(access.storageLimitBytes)}.`
                },
                { status: 413 }
            );
        }

        const validTypes: VaultFileType[] = ["pdf", "document", "presentation", "image", "video", "other"];
        const docType: VaultFileType = validTypes.includes(type) ? type : inferType(mimeType);

        const docId = randomUUID().replace(/-/g, "");

        const doc = await VaultDocument.create({
            docId,
            userId,
            filename: filename.slice(0, 255),
            originalName,
            mimeType,
            size,
            type: docType,
            chunks,
            isChunked,
            tags: (tags as string[]).slice(0, 20).map((t: string) => t.trim()).filter(Boolean),
            description: String(description).slice(0, 1000),
            isShared: false,
            status: "active"
        });

        // Update cached stats (fire-and-forget — actual usage recalculated in /api/vault/storage)
        VaultAccess.updateOne(
            { userId },
            { $inc: { fileCount: 1, usedBytes: size }, $set: { lastActivity: new Date() } }
        ).catch((e) => console.error("[Vault Create] cache update failed", e));

        return NextResponse.json({ docId: doc.docId }, { status: 201 });
    } catch (err: any) {
        console.error("[Vault Create]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferType(mime: string): VaultFileType {
    if (mime === "application/pdf") return "pdf";
    if (
        mime.includes("word") ||
        mime.includes("officedocument.wordprocessingml") ||
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

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}
