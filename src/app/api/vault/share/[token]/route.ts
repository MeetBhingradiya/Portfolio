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
            shareToken: token,
            isShared: true,
            status: "active"
        })
            .select("docId filename mimeType size type description tags shareExpires createdAt")
            .lean();

        if (!doc) return NextResponse.json({ error: "File not found or link is invalid" }, { status: 404 });

        // Check expiry
        if (doc.shareExpires && new Date() > new Date(doc.shareExpires)) {
            return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
        }

        return NextResponse.json({ doc });
    } catch (err: any) {
        console.error("[Vault Share GET]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}
