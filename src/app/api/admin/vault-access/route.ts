/**
 * Admin Vault Access API — GET (list) + POST (grant access)
 * GET  /api/admin/vault-access  — list all vault access entries
 * POST /api/admin/vault-access  — grant access to a user
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import { VaultAccess } from "@Models/VaultAccess";
import { MongoClient, ObjectId } from "mongodb";
import { Config as SConfig } from "@Config/Server";

const DEFAULT_LIMIT = 500 * 1024 * 1024; // 500 MB

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        await dbConnect();

        const entries = await VaultAccess.find({}).sort({ grantedAt: -1 }).lean();
        if (!process.env.MONGODB_01) return NextResponse.json({ success: true, data: entries });

        const client = new MongoClient(process.env.MONGODB_01);
        try {
            await client.connect();
            const db = client.db(SConfig.Database.Name);
            const userCol = db.collection("user");

            const linkedIds = entries.map((e) => e.userId).filter(Boolean);
            const linkedObjectIds = linkedIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
            const users = linkedIds.length
                ? await userCol
                      .find({
                          $or: [
                              { id: { $in: linkedIds as any } },
                              { _id: { $in: linkedIds as any } },
                              { _id: { $in: linkedObjectIds as any } }
                          ]
                      })
                      .project({
                          _id: 1,
                          id: 1,
                          name: 1,
                          email: 1,
                          image: 1,
                          emailVerified: 1,
                          googleAvatar: 1,
                          githubAvatar: 1,
                          microsoftAvatar: 1
                      })
                      .toArray()
                : [];

            const userMap: Record<string, any> = {};
            for (const u of users) {
                if (u.id) userMap[String(u.id)] = u;
                if (u._id) userMap[String(u._id)] = u;
            }
            const enriched = entries.map((e) => ({
                ...e,
                account: e.userId ? userMap[e.userId] ?? null : null
            }));
            return NextResponse.json({ success: true, data: enriched });
        } finally {
            await client.close();
        }
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
        let resolvedUserId = (userId || "").trim();
        let resolvedEmail = (email || "").toLowerCase().trim();
        let resolvedLabel = (label || "").trim();

        if (!resolvedEmail && !resolvedLabel) {
            return NextResponse.json({ success: false, error: "Provide at least email or name/label" }, { status: 400 });
        }
        if (!resolvedEmail && !process.env.MONGODB_01) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        if (process.env.MONGODB_01) {
            const client = new MongoClient(process.env.MONGODB_01);
            try {
                await client.connect();
                const db = client.db(SConfig.Database.Name);
                const user = await db.collection("user").findOne({
                    $or: [
                        ...(resolvedEmail ? [{ email: { $regex: new RegExp(`^${escapeRegex(resolvedEmail)}$`, "i") } }] : []),
                        ...(resolvedLabel ? [{ name: { $regex: new RegExp(`^${escapeRegex(resolvedLabel)}$`, "i") } }] : [])
                    ]
                });
                if (user) {
                    resolvedUserId = String(user.id ?? user._id);
                    resolvedEmail = resolvedEmail || String(user.email || "").toLowerCase();
                    resolvedLabel = resolvedLabel || String(user.name || user.email || "").trim();
                }
            } finally {
                await client.close();
            }
        }

        if (!resolvedEmail) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }
        if (!resolvedLabel) {
            resolvedLabel = resolvedEmail.split("@")[0];
        }

        const dedupeOr: Record<string, unknown>[] = [{ email: resolvedEmail }];
        if (resolvedUserId) dedupeOr.push({ userId: resolvedUserId });
        const existing = await VaultAccess.findOne({ $or: dedupeOr });
        if (existing) {
            return NextResponse.json(
                { success: false, error: "Vault access already granted for this user. Use PATCH to update." },
                { status: 409 }
            );
        }

        const entry = await VaultAccess.create({
            userId: resolvedUserId || `manual:${resolvedEmail}`,
            email: resolvedEmail,
            label: resolvedLabel,
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

function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
