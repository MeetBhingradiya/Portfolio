/**
 * Admin — CDN Single Asset API
 * PATCH  /api/admin/cdn/[id]   — update metadata (tags, altText, type)
 * DELETE /api/admin/cdn/[id]   — hard delete from GitHub + MongoDB
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubDelete } from "@Utils/GitHubCDN";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "cdn.keys.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();
        const { id } = await params;

        const asset = await CDNAsset.findById(id);
        if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const body = await req.json();
        if (body.tags !== undefined) asset.tags = body.tags;
        if (body.altText !== undefined) asset.altText = body.altText;
        if (body.type !== undefined) asset.type = body.type;

        await asset.save();
        return NextResponse.json({ success: true, asset });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "cdn.keys.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();
        const { id } = await params;

        const asset = await CDNAsset.findById(id);
        if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Remove from GitHub (best effort — might already be gone)
        try {
            await githubDelete(
                asset.githubRepo,
                asset.githubPath,
                asset.sha,
                `cdn: delete ${asset.type} "${asset.filename}" [${asset.assetId}]`
            );
        } catch (ghErr) {
            console.warn("[Admin CDN DELETE] GitHub deletion failed (continuing):", ghErr);
        }

        asset.status = "deleted";
        await asset.save();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[Admin CDN DELETE]", err);
        return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
    }
}
