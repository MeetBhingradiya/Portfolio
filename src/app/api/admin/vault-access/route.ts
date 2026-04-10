/**
 * Admin Vault Access API — GET (list) + POST (grant access)
 * GET  /api/admin/vault-access  — list all vault access entries
 * POST /api/admin/vault-access  — grant access to a user
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import { VaultAccess } from "@Models/VaultAccess";

const DEFAULT_LIMIT = 500 * 1024 * 1024; // 500 MB

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await dbConnect();

        const entries = await VaultAccess.find({}).sort({ grantedAt: -1 }).lean();
        return NextResponse.json({ success: true, data: entries });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await dbConnect();

        const body = await req.json();
        const { userId, email, label, note, storageLimitBytes, enabled } = body;

        if (!userId || !email || !label) {
            return NextResponse.json({ success: false, error: "userId, email and label are required" }, { status: 400 });
        }

        // Upsert — admins may re-grant access or update quota
        const existing = await VaultAccess.findOne({ userId });
        if (existing) {
            return NextResponse.json(
                { success: false, error: "Vault access already granted for this user. Use PATCH to update." },
                { status: 409 }
            );
        }

        const entry = await VaultAccess.create({
            userId,
            email: email.toLowerCase().trim(),
            label: label.trim(),
            note: note?.trim(),
            storageLimitBytes: typeof storageLimitBytes === "number" ? storageLimitBytes : DEFAULT_LIMIT,
            enabled: enabled !== false,
            grantedBy: auth.session!.user.id,
            grantedAt: new Date()
        });

        return NextResponse.json({ success: true, data: entry }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
    }
}
