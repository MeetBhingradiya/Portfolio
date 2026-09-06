/**
 * Admin — SSO App Access API
 * GET  /api/admin/sso-access          list access for an app (requires appId in query)
 * POST /api/admin/sso-access          grant access (requires appId in body)
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect, { getMongoCollection } from "@Utils/dbConnect";
import { SSOAppAccess, SSOApp } from "@Models/SSO";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        await dbConnect();

        const q = req.nextUrl.searchParams;
        const search = q.get("search") || "";
        const appId = q.get("appId");
        
        if (!appId) {
            return NextResponse.json({ success: false, error: "appId is required" }, { status: 400 });
        }

        const query: any = { appId: new mongoose.Types.ObjectId(appId) };
        if (search) {
            query.$or = [{ email: { $regex: search, $options: "i" } }, { label: { $regex: search, $options: "i" } }];
        }

        const entries = await SSOAppAccess.find(query).sort({ addedAt: -1 }).lean();

        // Enrich linked entries with live BA account data
        try {
            const userCol = await getMongoCollection("user");
            const linkedIds = entries.filter((e) => e.userId).map((e) => e.userId as string);
            const linkedObjectIds = linkedIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

            const baUsers = linkedIds.length
                ? await userCol
                      .find({
                          $or: [{ id: { $in: linkedIds as any } }, { _id: { $in: linkedIds as any } }, { _id: { $in: linkedObjectIds as any } }]
                      })
                      .project({
                          _id: 1,
                          id: 1,
                          name: 1,
                          image: 1,
                          emailVerified: 1,
                          email: 1,
                          googleAvatar: 1,
                          githubAvatar: 1,
                          microsoftAvatar: 1
                      })
                      .toArray()
                : [];

            const baMap: Record<string, any> = {};
            for (const u of baUsers) {
                if (u.id) baMap[String(u.id)] = u;
                if (u._id) baMap[String(u._id)] = u;
            }

            const enriched = entries.map((e) => ({
                ...e,
                account: e.userId ? (baMap[e.userId] ?? null) : null
            }));

            return NextResponse.json({ success: true, data: enriched });
        } catch {
            return NextResponse.json({ success: true, data: entries });
        }
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        const session = auth.session;
        if (!session?.user) {
            return permissionError(401, "Unauthorized: Not authenticated");
        }
        const { appId, email: rawEmail, label: rawLabel, note } = await req.json();

        if (!appId || !rawEmail || !rawLabel) {
            return NextResponse.json({ success: false, error: "appId, email and label are required" }, { status: 400 });
        }

        let resolvedEmail = rawEmail?.toLowerCase().trim();
        let resolvedLabel = rawLabel?.trim();
        let resolvedUserId: string | undefined;

        // Try to auto-link to a matching BA account by email (case-insensitive).
        if (resolvedEmail) {
            try {
                const userCollection = await getMongoCollection("user");
                const baUser = await userCollection.findOne({ email: { $regex: new RegExp(`^${resolvedEmail}$`, "i") } });
                if (baUser) {
                    resolvedUserId = String(baUser.id ?? baUser._id);
                    resolvedLabel = resolvedLabel || (baUser.name as string) || resolvedEmail;
                }
            } catch {
                // proceed as email-only if lookup fails
            }
        }

        await dbConnect();

        const app = await SSOApp.findById(appId);
        if (!app) {
            return NextResponse.json({ success: false, error: "App not found" }, { status: 404 });
        }

        // Check for duplicate email or userId for this specific app
        const dupQuery: any[] = [{ email: resolvedEmail }];
        if (resolvedUserId) dupQuery.push({ userId: resolvedUserId });
        
        const existing = await SSOAppAccess.findOne({ 
            appId: app._id,
            $or: dupQuery 
        });
        
        if (existing) {
            return NextResponse.json(
                { success: false, error: "Account or email is already granted access to this app" },
                { status: 409 }
            );
        }

        const entry = await SSOAppAccess.create({
            appId: app._id,
            email: resolvedEmail,
            label: resolvedLabel,
            note: note?.trim() || undefined,
            enabled: true,
            addedBy: session.user.email,
            addedAt: new Date(),
            ...(resolvedUserId ? { userId: resolvedUserId, linkedAccount: true } : { linkedAccount: false })
        });

        return NextResponse.json({ success: true, data: entry }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
