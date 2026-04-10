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
import { VaultDocument, IVaultDocument, IVaultShareLink } from "@Models/VaultDocument";

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

        const doc = await VaultDocument.findOne({ docId: id, userId, status: "active" });
        if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        await ensureShareLinksMigrated(doc, userId);

        return NextResponse.json({ doc: doc.toObject() });
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
        await ensureShareLinksMigrated(doc, userId);

        const body = await req.json();
        if (body?.shareAction) {
            const shareResult = await applyShareAction(doc as unknown as IVaultDocument, body.shareAction, userId);
            if (!shareResult.ok) {
                return NextResponse.json({ error: shareResult.error }, { status: shareResult.status });
            }
            await doc.save();
            return NextResponse.json({
                doc: doc.toObject(),
                shareLinks: (doc.shareLinks || []).map((link: any) => toClientShareLink(link, req.nextUrl.origin))
            });
        }

        const allowed = ["filename", "tags", "description", "isShared", "shareExpires"] as const;
        const patch: Record<string, unknown> = {};

        for (const key of allowed) {
            if (key in body) patch[key] = body[key];
        }

        // Legacy toggle support (kept for compatibility)
        if ("isShared" in body) {
            if (body.isShared) {
                const activeLegacy = getActiveLinks(doc.shareLinks || []).find((l) => !l.expiresAt);
                if (!activeLegacy) {
                    const link = createLink(userId, body.shareExpires);
                    doc.shareLinks = [...(doc.shareLinks || []), link];
                    patch.shareToken = link.token;
                    patch.shareExpires = link.expiresAt;
                }
                patch.isShared = true;
            } else if (!body.isShared) {
                doc.shareLinks = (doc.shareLinks || []).map((link) =>
                    link.status === "active"
                        ? ({ ...link, status: "revoked", revokedAt: new Date() } as IVaultShareLink)
                        : link
                );
                patch.shareToken = undefined;
                patch.shareExpires = undefined;
                patch.isShared = false;
            }
        }

        patch.shareLinks = doc.shareLinks;
        syncLegacyShareFields(patch, doc.shareLinks || []);

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

        // Update cached stats (fire-and-forget — actual usage recalculated in /api/vault/storage)
        VaultAccess.updateOne(
            { userId },
            { $inc: { fileCount: -1, usedBytes: -doc.size }, $set: { lastActivity: new Date() } }
        ).catch((e) => console.error("[Vault DELETE] cache update failed", e));

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[Vault DELETE doc]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}

function createLink(userId: string, expiresAt?: string | Date): IVaultShareLink {
    const parsedExpiry = expiresAt ? new Date(expiresAt) : undefined;
    return {
        linkId: randomUUID().replace(/-/g, ""),
        token: randomUUID().replace(/-/g, ""),
        status: "active",
        expiresAt: parsedExpiry && !Number.isNaN(parsedExpiry.getTime()) ? parsedExpiry : undefined,
        createdBy: userId,
        createdAt: new Date()
    } as IVaultShareLink;
}

function isExpired(link: Partial<IVaultShareLink>): boolean {
    return !!(link.expiresAt && new Date(link.expiresAt) <= new Date());
}

function getActiveLinks(links: Partial<IVaultShareLink>[]): Partial<IVaultShareLink>[] {
    return (links || []).filter((link) => link.status === "active" && !isExpired(link));
}

function syncLegacyShareFields(patch: Record<string, unknown>, links: Partial<IVaultShareLink>[]) {
    const active = getActiveLinks(links);
    const primary = active[0];
    patch.isShared = active.length > 0;
    patch.shareToken = primary?.token;
    patch.shareExpires = primary?.expiresAt;
}

async function ensureShareLinksMigrated(doc: any, userId: string) {
    const links = Array.isArray(doc.shareLinks) ? doc.shareLinks : [];
    if (links.length > 0) return;
    if (doc.shareToken) {
        const migrated = createLink(userId, doc.shareExpires);
        migrated.token = doc.shareToken;
        doc.shareLinks = [migrated];
        doc.isShared = !isExpired(migrated);
        await doc.save();
        return;
    }
    doc.shareLinks = [];
}

async function applyShareAction(
    doc: IVaultDocument,
    action: any,
    userId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    const links = [...(doc.shareLinks || [])];
    const now = new Date();

    if (action.type === "create") {
        const expiresAt = action.expiresAt ? new Date(action.expiresAt) : undefined;
        if (expiresAt && Number.isNaN(expiresAt.getTime())) {
            return { ok: false, status: 400, error: "Invalid expiry date" };
        }
        const active = getActiveLinks(links);
        const activeExpiring = active.filter((l) => !!l.expiresAt);
        const activeNonExpiring = active.filter((l) => !l.expiresAt);
        if (expiresAt && activeExpiring.length >= 3) {
            return { ok: false, status: 400, error: "Maximum 3 active expiring links allowed" };
        }
        if (!expiresAt && activeNonExpiring.length >= 1) {
            return { ok: false, status: 400, error: "Only 1 active non-expiring link allowed" };
        }

        links.push(createLink(userId, expiresAt));
    } else if (action.type === "revoke") {
        const idx = links.findIndex((l) => l.linkId === action.linkId && l.status !== "deleted");
        if (idx < 0) return { ok: false, status: 404, error: "Share link not found" };
        links[idx] = { ...links[idx], status: "revoked", revokedAt: now };
    } else if (action.type === "reenable") {
        const idx = links.findIndex((l) => l.linkId === action.linkId && l.status === "revoked");
        if (idx < 0) return { ok: false, status: 404, error: "Revoked share link not found" };

        const target = links[idx];
        const active = getActiveLinks(links);
        const activeExpiring = active.filter((l) => !!l.expiresAt);
        const activeNonExpiring = active.filter((l) => !l.expiresAt);
        if (target.expiresAt && activeExpiring.length >= 3) {
            return { ok: false, status: 400, error: "Cannot re-enable: expiring link limit reached" };
        }
        if (!target.expiresAt && activeNonExpiring.length >= 1) {
            return { ok: false, status: 400, error: "Cannot re-enable: non-expiring link already active" };
        }
        links[idx] = { ...target, status: "active", revokedAt: undefined };
    } else if (action.type === "delete") {
        const idx = links.findIndex((l) => l.linkId === action.linkId);
        if (idx < 0) return { ok: false, status: 404, error: "Share link not found" };
        links[idx] = { ...links[idx], status: "deleted", deletedAt: now };
    } else if (action.type === "touch") {
        const idx = links.findIndex((l) => l.linkId === action.linkId && l.status === "active");
        if (idx < 0) return { ok: false, status: 404, error: "Share link not found" };
        links[idx] = { ...links[idx], lastUsedAt: now };
    } else {
        return { ok: false, status: 400, error: "Invalid share action" };
    }

    doc.shareLinks = links as any;
    const patch: Record<string, unknown> = { shareLinks: doc.shareLinks };
    syncLegacyShareFields(patch, links);
    doc.isShared = Boolean(patch.isShared);
    doc.shareToken = patch.shareToken as any;
    doc.shareExpires = patch.shareExpires as any;

    return { ok: true };
}

function toClientShareLink(link: any, origin: string) {
    return {
        ...link,
        url: `${origin}/vault/share/${link.token}`,
        expired: isExpired(link)
    };
}
