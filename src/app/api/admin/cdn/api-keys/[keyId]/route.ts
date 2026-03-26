/**
 * Admin — CDN API Key Actions
 *
 * GET    /api/admin/cdn/api-keys/[keyId]     — get key detail (no hash)
 * PATCH  /api/admin/cdn/api-keys/[keyId]     — revoke | suspend | reinstate | update policy
 * DELETE /api/admin/cdn/api-keys/[keyId]     — hard-delete (use revoke instead where possible)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAPIKey, IRateLimitPolicy } from "@Models/CDNAPIKey";
import { CDNRateWindow } from "@Models/CDNRateWindow";

type Params = { params: Promise<{ keyId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await requireAdmin(_req.headers);
        await dbConnect();
        const { keyId } = await params;

        const key = await CDNAPIKey.findOne({ keyId }).select("-keyHash").lean();
        if (!key) return NextResponse.json({ error: "Key not found." }, { status: 404 });

        return NextResponse.json({ key });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        await requireAdmin(req.headers);
        const session  = await getSession(req.headers);
        await dbConnect();
        const { keyId } = await params;

        const body = await req.json() as {
            action?: "revoke" | "suspend" | "reinstate";
            revokeReason?: string;
            notes?: string;
            expiresAt?: string | null;
            rateLimitOverride?: Partial<IRateLimitPolicy>;
        };

        const key = await CDNAPIKey.findOne({ keyId });
        if (!key) return NextResponse.json({ error: "Key not found." }, { status: 404 });

        const adminId = session?.user?.email || "admin";
        const now = new Date();

        if (body.action === "revoke") {
            key.status       = "revoked";
            key.revokedAt    = now;
            key.revokedBy    = adminId;
            key.revokeReason = body.revokeReason?.trim() || undefined;
        } else if (body.action === "suspend") {
            key.status = "suspended";
        } else if (body.action === "reinstate") {
            // Only allow if not permanently revoked
            if (key.status === "revoked") {
                return NextResponse.json({ error: "Revoked keys cannot be reinstated. Issue a new key." }, { status: 409 });
            }
            key.status    = "active";
            key.revokedAt = undefined as any;
            key.revokedBy = undefined as any;
        }

        if (body.notes !== undefined)    key.notes = body.notes.trim() || undefined as any;
        if (body.expiresAt !== undefined) key.expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined as any;

        if (body.rateLimitOverride) {
            key.rateLimit = { ...key.rateLimit.toObject?.() ?? key.rateLimit, ...body.rateLimitOverride } as any;
        }

        await key.save();

        return NextResponse.json({
            keyId: key.keyId,
            status: key.status,
            message: `Key ${body.action ? body.action + "d" : "updated"} successfully.`,
        });
    } catch (err: any) {
        console.error("[Admin CDN API Key PATCH]", err);
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();
        const { keyId } = await params;

        const key = await CDNAPIKey.findOne({ keyId });
        if (!key) return NextResponse.json({ error: "Key not found." }, { status: 404 });

        // Also purge rate windows
        await Promise.all([
            key.deleteOne(),
            CDNRateWindow.deleteMany({ keyId }),
        ]);

        return NextResponse.json({ message: `Key ${keyId} permanently deleted.` });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}
