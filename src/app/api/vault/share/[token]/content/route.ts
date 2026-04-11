import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { VaultDocument } from "@Models/VaultDocument";
import { githubDownload } from "@Utils/GitHubCDN";
import { decryptVaultBuffer } from "@Utils/VaultFileCrypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        if (!token) return NextResponse.json({ error: "Invalid share link" }, { status: 400 });

        await dbConnect();

        const doc = await VaultDocument.findOne({
            status: "active",
            $or: [{ "shareLinks.token": token }, { shareToken: token }]
        }).lean();

        if (!doc) return NextResponse.json({ error: "File not found or link is invalid" }, { status: 404 });

        const links = Array.isArray(doc.shareLinks) ? doc.shareLinks : [];
        const matchedLink =
            links.find((link: any) => link.token === token) ||
            (doc.shareToken === token
                ? {
                      linkId: "legacy",
                      status: doc.isShared ? "active" : "revoked",
                      expiresAt: doc.shareExpires
                  }
                : null);

        if (!matchedLink) return NextResponse.json({ error: "File not found or link is invalid" }, { status: 404 });
        if (matchedLink.status === "revoked" || matchedLink.status === "deleted") {
            return NextResponse.json({ error: "This share link is no longer active" }, { status: 410 });
        }
        if (matchedLink.expiresAt && new Date(matchedLink.expiresAt) < new Date()) {
            return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
        }

        const sortedChunks = [...(doc.chunks || [])].sort((a, b) => a.chunkIndex - b.chunkIndex);
        if (sortedChunks.length === 0) {
            return NextResponse.json({ error: "Document content unavailable" }, { status: 404 });
        }

        const decryptedChunks = await Promise.all(
            sortedChunks.map(async (chunk: any) => {
                try {
                    const content = await githubDownload(chunk.githubRepo, chunk.githubPath);
                    if (!content) throw new Error("Chunk not found in storage");
                    if (doc.encryptedAtRest) {
                        return decryptVaultBuffer(content.buffer, chunk.iv, chunk.authTag);
                    }
                    return content.buffer;
                } catch (err: any) {
                    throw new Error(
                        `Failed to process shared chunk ${chunk.chunkIndex} for document ${doc.docId}: ${err?.message || "unknown error"}`
                    );
                }
            })
        );

        const fileBuffer = Buffer.concat(decryptedChunks);
        const download = req.nextUrl.searchParams.get("download") === "1";

        return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
                "Content-Type": doc.mimeType || "application/octet-stream",
                "Content-Length": String(fileBuffer.length),
                "Cache-Control": "private, no-store",
                "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
                "X-Frame-Options": "SAMEORIGIN",
                "Content-Security-Policy": "frame-ancestors 'self'; object-src 'self'"
            }
        });
    } catch (err: any) {
        console.error("[Vault Share Content GET]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}
