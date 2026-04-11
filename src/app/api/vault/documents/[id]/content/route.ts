import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { getSession } from "@Library/auth";
import { VaultAccess } from "@Models/VaultAccess";
import { VaultDocument } from "@Models/VaultDocument";
import { githubDownload } from "@Utils/GitHubCDN";
import { decryptVaultBuffer } from "@Utils/VaultFileCrypto";

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
        if (!access) {
            return NextResponse.json({ error: "Vault access not granted" }, { status: 403 });
        }

        const doc = await VaultDocument.findOne({ docId: id, userId, status: "active" }).lean();
        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        const sortedChunks = [...(doc.chunks || [])].sort((a, b) => a.chunkIndex - b.chunkIndex);
        if (sortedChunks.length === 0) {
            return NextResponse.json({ error: "Document content unavailable" }, { status: 404 });
        }

        const decryptedChunks = await Promise.all(
            sortedChunks.map(async (chunk) => {
                const content = await githubDownload(chunk.githubRepo, chunk.githubPath);
                if (!content) throw new Error("Chunk not found in storage");
                if (doc.encryptedAtRest) {
                    return decryptVaultBuffer(content.buffer, chunk.iv, chunk.authTag);
                }
                return content.buffer;
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
        console.error("[Vault Document Content GET]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}
