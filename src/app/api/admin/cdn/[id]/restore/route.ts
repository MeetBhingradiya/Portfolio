/**
 * Admin — CDN Asset Restore from Commit (disabled)
 * POST /api/admin/cdn/[id]/restore
 *
 * Disabled because CDN repositories run in privacy mode with aggressive
 * history compaction (single-commit branch).
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

export async function POST(
    req: NextRequest,
    _ctx: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requirePermission(req, "cdn.keys.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        return NextResponse.json(
            {
                success: false,
                error: "Restore by commit is disabled in CDN privacy mode (single-commit repository policy).",
            },
            { status: 410 }
        );
    } catch (err: any) {
        console.error("[CDN Restore]", err);
        return NextResponse.json({ error: err?.message || "Failed to restore" }, { status: 500 });
    }
}
