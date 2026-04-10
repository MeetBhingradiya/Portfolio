/**
 * Vault Document [id] API — GET · PATCH · DELETE
 * GET    /api/vault/documents/[id] — document details + chunk URLs
 * PATCH  /api/vault/documents/[id] — rename, update tags/description, toggle share
 * DELETE /api/vault/documents/[id] — soft-delete
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import dbConnect from "@Utils/dbConnect";
import { getSession } from "@Library/auth";
import { VaultAccess } from "@Models/VaultAccess";
import { VaultDocument } from "@Models/VaultDocument";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const { id } = await params;

        await dbConnect();

        const access = await VaultAccess.findOne({ userId, enabled: true }).lean();
        if (!access) return NextResponse.json({ error: "Vault access not granted" }, { status: 403 });

        const doc = await VaultDocument.findOne({ docId: id, userId, status: "active" }).lean();
        if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        return NextResponse.json({ doc });
    } catch (err: any) {
        console.error("[Vault GET doc]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const { id } = await params;

        await dbConnect();

        const access = await VaultAccess.findOne({ userId, enabled: true }).lean();
        if (!access) return NextResponse.json({ error: "Vault access not granted" }, { status: 403 });

        const doc = await VaultDocument.findOne({ docId: id, userId, status: "active" });
        if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        const body = await req.json();
        const allowed = ["filename", "tags", "description", "isShared", "shareExpires"] as const;
        const patch: Record<string, unknown> = {};

        for (const key of allowed) {
            if (key in body) patch[key] = body[key];
        }

        // Generate / revoke share token
        if ("isShared" in body) {
            if (body.isShared && !doc.shareToken) {
                patch.shareToken = randomUUID().replace(/-/g, "");
            } else if (!body.isShared) {
                patch.shareToken = undefined;
                patch.shareExpires = undefined;
            }
        }

        const updated = await VaultDocument.findOneAndUpdate(
            { docId: id, userId },
            { $set: patch },
            { new: true }
        ).lean();

        return NextResponse.json({ doc: updated });
    } catch (err: any) {
        console.error("[Vault PATCH doc]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const { id } = await params;

        await dbConnect();

        const access = await VaultAccess.findOne({ userId, enabled: true }).lean();
        if (!access) return NextResponse.json({ error: "Vault access not granted" }, { status: 403 });

        const doc = await VaultDocument.findOne({ docId: id, userId, status: "active" }).lean();
        if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        await VaultDocument.updateOne({ docId: id, userId }, { $set: { status: "deleted" } });

        // Update cached stats
        VaultAccess.updateOne(
            { userId },
            { $inc: { fileCount: -1, usedBytes: -doc.size }, $set: { lastActivity: new Date() } }
        ).catch(() => {});

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[Vault DELETE doc]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}
