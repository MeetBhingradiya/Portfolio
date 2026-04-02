/**
 * Admin — Immich Whitelist item API
 * PATCH  /api/admin/immich-whitelist/[id]   update (enable/disable, note)
 * DELETE /api/admin/immich-whitelist/[id]   remove
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { ImmichWhitelist } from "@Models/ImmichWhitelist";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        const { id } = await context.params;
        const body = await req.json();

        await dbConnect();
        const entry = await ImmichWhitelist.findById(id);
        if (!entry) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }

        if (typeof body.enabled === "boolean") entry.enabled = body.enabled;
        if (body.label !== undefined) entry.label = body.label.trim();
        if (body.note !== undefined) entry.note = body.note?.trim() || undefined;
        // subOverride: empty string clears it, any other string sets it
        if (body.subOverride !== undefined) (entry as any).subOverride = body.subOverride?.trim() || undefined;

        await entry.save();
        return NextResponse.json({ success: true, data: entry });
    } catch (err: any) {
        if (err?.message?.includes("Forbidden") || err?.message?.includes("Permission")) {
            return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        const { id } = await context.params;

        await dbConnect();
        const result = await ImmichWhitelist.findByIdAndDelete(id);
        if (!result) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err?.message?.includes("Forbidden") || err?.message?.includes("Permission")) {
            return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
