/**
 * Admin — CDN Asset Commit History (disabled)
 * GET /api/admin/cdn/[id]/history
 *
 * Disabled because CDN repositories run in privacy mode with aggressive
 * history compaction (single-commit branch).
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

export async function GET(req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "cdn.keys.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        return NextResponse.json(
            {
                success: false,
                error: "Commit history is disabled in CDN privacy mode (single-commit repository policy)."
            },
            { status: 410 }
        );
    } catch (err: any) {
        console.error("[CDN History]", err);
        return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
    }
}
