/**
 * Admin — Immich Whitelist API
 * GET  /api/admin/immich-whitelist          list (joined with BA user data)
 * POST /api/admin/immich-whitelist          create (by userId or email)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/Library/auth";
import dbConnect from "@Utils/dbConnect";
import { ImmichWhitelist } from "@Models/ImmichWhitelist";
import { MongoClient } from "mongodb";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const q = req.nextUrl.searchParams;
        const search = q.get("search") || "";
        const query: any = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: "i" } },
                { label: { $regex: search, $options: "i" } },
            ];
        }

        const entries = await ImmichWhitelist.find(query).sort({ addedAt: -1 }).lean();

        // Enrich linked entries with live BA account data (name, image, emailVerified)
        if (process.env.MONGODB_01) {
            const client = new MongoClient(process.env.MONGODB_01);
            try {
                await client.connect();
                const db = client.db("PRODUCTION_MeetBhingradiya");
                const userCol = db.collection("user");

                const linkedIds = entries
                    .filter((e) => e.userId)
                    .map((e) => e.userId as string);

                const baUsers = linkedIds.length
                    ? await userCol
                        .find({ $or: [{ id: { $in: linkedIds as any } }, { _id: { $in: linkedIds as any } }] })
                        .project({ _id: 1, id: 1, name: 1, image: 1, emailVerified: 1, email: 1 })
                        .toArray()
                    : [];

                // Key by whichever field holds the BA UUID
                const baMap = Object.fromEntries(
                    baUsers.map((u) => [(u.id ?? u._id) as string, u])
                );

                const enriched = entries.map((e) => ({
                    ...e,
                    account: e.userId ? (baMap[e.userId] ?? null) : null,
                }));

                return NextResponse.json({ success: true, data: enriched });
            } finally {
                await client.close();
            }
        }

        return NextResponse.json({ success: true, data: entries });
    } catch (err: any) {
        if (err?.message?.includes("Forbidden") || err?.message?.includes("Admin")) {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await requireAdmin(req.headers);
        // userId  → link an existing Better Auth account (preferred)
        // email   → email-only entry (for people who haven't signed up yet)
        const { userId, email: rawEmail, label: rawLabel, note } = await req.json();

        let resolvedEmail = rawEmail?.toLowerCase().trim();
        let resolvedLabel = rawLabel?.trim();
        let resolvedUserId: string | undefined;
        let linkedAccount = false;

        // ── If a userId was provided, look up the BA account ──────────────
        if (userId && process.env.MONGODB_01) {
            const client = new MongoClient(process.env.MONGODB_01);
            try {
                await client.connect();
                const db = client.db("PRODUCTION_MeetBhingradiya");
                // BA adapter may store its UUID as `id` (with Mongo ObjectId in `_id`)
                // or directly as `_id` (string). Cover both.
                const baUser = await db.collection("user").findOne({
                    $or: [{ id: userId }, { _id: userId }],
                });
                if (!baUser) {
                    return NextResponse.json(
                        { success: false, error: "Better Auth user not found" },
                        { status: 404 }
                    );
                }
                // Override email from the real BA account record
                resolvedEmail = (baUser.email as string).toLowerCase();
                // Auto-label from account name if caller didn't supply one
                resolvedLabel = resolvedLabel || (baUser.name as string) || resolvedEmail;
                resolvedUserId = userId;
                linkedAccount = true;
            } finally {
                await client.close();
            }
        }

        // ── If email-only, try to auto-link to a matching BA account ──────────
        if (!userId && resolvedEmail && process.env.MONGODB_01) {
            const emailClient = new MongoClient(process.env.MONGODB_01);
            try {
                await emailClient.connect();
                const db = emailClient.db("PRODUCTION_MeetBhingradiya");
                const baUser = await db.collection("user").findOne({
                    email: { $regex: new RegExp(`^${resolvedEmail}$`, "i") },
                });
                if (baUser) {
                    resolvedUserId = ((baUser._id ?? baUser.id) as string);
                    resolvedLabel = resolvedLabel || (baUser.name as string) || resolvedEmail;
                    linkedAccount = true;
                }
            } catch {
                // proceed as email-only if lookup fails
            } finally {
                await emailClient.close();
            }
        }

        if (!resolvedEmail || !resolvedLabel) {
            return NextResponse.json(
                { success: false, error: "email (or userId) and label are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check for duplicate email or userId
        const dupQuery: any[] = [{ email: resolvedEmail }];
        if (resolvedUserId) dupQuery.push({ userId: resolvedUserId });
        const existing = await ImmichWhitelist.findOne({ $or: dupQuery });
        if (existing) {
            return NextResponse.json(
                { success: false, error: "Account or email is already whitelisted" },
                { status: 409 }
            );
        }

        const entry = await ImmichWhitelist.create({
            email: resolvedEmail,
            label: resolvedLabel,
            note: note?.trim() || undefined,
            enabled: true,
            addedBy: session.user.email,
            addedAt: new Date(),
            ...(resolvedUserId ? { userId: resolvedUserId, linkedAccount: true } : { linkedAccount: false }),
        });

        return NextResponse.json({ success: true, data: entry }, { status: 201 });
    } catch (err: any) {
        if (err?.message?.includes("Forbidden") || err?.message?.includes("Admin")) {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
