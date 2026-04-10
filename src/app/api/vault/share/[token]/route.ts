/**
 * GET /api/vault/share/[token]
 * Returns basic metadata for a shared vault document (no auth required).
 * Does NOT expose chunk details or full content — only metadata so the
 * share page can display file info and a download button.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { VaultDocument } from "@Models/VaultDocument";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        if (!token) return NextResponse.json({ error: "Invalid share link" }, { status: 400 });

        await dbConnect();

        const doc = await VaultDocument.findOne({
            status: "active",
            $or: [{ "shareLinks.token": token }, { shareToken: token }]
        }).select("docId filename mimeType size type description tags shareLinks shareExpires shareToken createdAt chunks");

        if (!doc) return NextResponse.json({ error: "File not found or link is invalid" }, { status: 404 });

        const shareLinks = Array.isArray((doc as any).shareLinks) ? (doc as any).shareLinks : [];
        const matchedLink =
            shareLinks.find((link: any) => link.token === token) ||
            ((doc as any).shareToken === token
                ? {
                      linkId: "legacy",
                      token,
                      status: (doc as any).isShared ? "active" : "revoked",
                      expiresAt: (doc as any).shareExpires
                  }
                : null);

        if (!matchedLink) {
            return NextResponse.json({ error: "File not found or link is invalid" }, { status: 404 });
        }

        if (matchedLink.status === "revoked" || matchedLink.status === "deleted") {
            return NextResponse.json({ error: "This share link is no longer active" }, { status: 410 });
        }

        if (matchedLink.expiresAt && new Date(matchedLink.expiresAt) <= new Date()) {
            return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
        }

        if (matchedLink.linkId !== "legacy") {
            await VaultDocument.updateOne(
                { _id: (doc as any)._id, "shareLinks.linkId": matchedLink.linkId },
                { $set: { "shareLinks.$.lastUsedAt": new Date() } }
            );
        }

        const firstChunkAssetId = (doc as any).chunks?.[0]?.assetId;
        return NextResponse.json({
            doc: {
                docId: (doc as any).docId,
                filename: (doc as any).filename,
                mimeType: (doc as any).mimeType,
                size: (doc as any).size,
                type: (doc as any).type,
                description: (doc as any).description,
                tags: (doc as any).tags,
                createdAt: (doc as any).createdAt,
                previewUrl: firstChunkAssetId ? `/api/cdn/${firstChunkAssetId}` : null
            },
            shareLink: {
                linkId: matchedLink.linkId,
                expiresAt: matchedLink.expiresAt || null
            }
        });
    } catch (err: any) {
        console.error("[Vault Share GET]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}
