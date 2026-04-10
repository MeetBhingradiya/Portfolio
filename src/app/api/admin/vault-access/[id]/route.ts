/**
 * Admin Vault Access [id] API — PATCH · DELETE
 * PATCH  /api/admin/vault-access/[id] — update quota / enabled / note / label
 * DELETE /api/admin/vault-access/[id] — revoke access (removes entry)
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import { VaultAccess } from "@Models/VaultAccess";

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await dbConnect();

        const { id } = await params;
        const body = await req.json();

        const allowed = ["label", "note", "storageLimitBytes", "enabled"] as const;
        const patch: Record<string, unknown> = {};
        for (const key of allowed) {
            if (key in body) patch[key] = body[key];
        }

        const updated = await VaultAccess.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
        if (!updated) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
    }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await dbConnect();

        const { id } = await params;
        const deleted = await VaultAccess.findByIdAndDelete(id).lean();
        if (!deleted) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
    }
}
