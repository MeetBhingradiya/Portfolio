/**
 * POST /api/wallet/contacts/import
 * Import contacts from Google People API using the user's stored OAuth access token.
 * Upserts into WalletContact by matching email or phone.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { MongoClient, ObjectId } from "mongodb";
import { symmetricDecrypt } from "better-auth/crypto";
import dbConnect from "@Utils/dbConnect";
import { WalletContact } from "@Models/WalletContact";
import { Config as SConfig } from "@Config/Server";

function toObjectId(id: string): ObjectId | null {
    try {
        return new ObjectId(id);
    } catch {
        return null;
    }
}

async function decryptToken(encrypted: string): Promise<string | null> {
    try {
        const secret = process.env.BETTER_AUTH_SECRET;
        if (!secret) return null;
        return await symmetricDecrypt({ key: secret, data: encrypted });
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.MONGODB_01) {
            return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
        }

        // ── Get Google access token from better-auth ──────────────────────────
        const userId = session.user.id;
        const objectId = toObjectId(userId);
        const mongoClient = new MongoClient(process.env.MONGODB_01);

        let accessToken: string | null = null;
        try {
            await mongoClient.connect();
            const db = mongoClient.db(SConfig.Database.Name);

            const userIdQuery = objectId ? { $or: [{ user_id: userId }, { user_id: objectId }] } : { user_id: userId };

            const account = await db.collection("account").findOne({
                ...userIdQuery,
                providerId: "google"
            });

            if (!account) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "No Google account linked. Sign in with Google first."
                    },
                    { status: 404 }
                );
            }

            const rawToken = account.accessToken as string | null;
            accessToken = rawToken ? await decryptToken(rawToken) : null;
        } finally {
            await mongoClient.close();
        }

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Google access token expired. Please sign out and sign in again with Google."
                },
                { status: 401 }
            );
        }

        // ── Fetch contacts from Google People API ─────────────────────────────
        const peopleUrl = new URL("https://people.googleapis.com/v1/people/me/connections");
        peopleUrl.searchParams.set("personFields", "names,emailAddresses,phoneNumbers,photos");
        peopleUrl.searchParams.set("pageSize", "200");

        const allContacts: any[] = [];
        let nextPageToken: string | undefined;

        do {
            if (nextPageToken) peopleUrl.searchParams.set("pageToken", nextPageToken);

            const res = await fetch(peopleUrl.toString(), {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!res.ok) {
                const body = await res.text();
                console.error("[contacts/import] People API error:", res.status, body);
                if (res.status === 401 || res.status === 403) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: "Google token expired or contacts permission not granted. Please re-sign-in with Google."
                        },
                        { status: 401 }
                    );
                }
                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to fetch Google contacts"
                    },
                    { status: 500 }
                );
            }

            const data = await res.json();
            if (data.connections) allContacts.push(...data.connections);
            nextPageToken = data.nextPageToken;
        } while (nextPageToken);

        if (allContacts.length === 0) {
            return NextResponse.json({
                success: true,
                data: { imported: 0, skipped: 0, total: 0 }
            });
        }

        // ── Upsert into WalletContact ─────────────────────────────────────────
        await dbConnect();

        // Get the resolved user ID for WalletContact
        const { getResolvedUser } = await import("@Utils/RolePermissions");
        const h = req.headers;
        const resolvedUser = await getResolvedUser(h);
        const walletUserId = resolvedUser?.userId ?? userId;

        let imported = 0;
        let skipped = 0;

        for (const person of allContacts) {
            const name = person.names?.[0]?.displayName;
            if (!name) {
                skipped++;
                continue;
            }

            const email = person.emailAddresses?.[0]?.value || "";
            const phone = person.phoneNumbers?.[0]?.value || "";
            const photo = person.photos?.[0]?.url || "";

            if (!email && !phone) {
                skipped++;
                continue;
            }

            // Try to find existing contact by email or phone
            const matchQuery: Record<string, any>[] = [];
            if (email) matchQuery.push({ Emails: email, UserID: walletUserId });
            if (phone) matchQuery.push({ Phones: phone, UserID: walletUserId });

            const existing = (await WalletContact.findOne({
                UserID: walletUserId,
                $or: matchQuery
            })) as any;

            if (existing) {
                // Update name/photo if they changed
                const updates: Record<string, any> = {};
                if (name && name !== existing.Name) updates.Name = name;
                if (photo && photo !== existing.Avatar) updates.Avatar = photo;
                const addToSet: Record<string, any> = {};
                if (email && !existing.Emails?.includes(email)) addToSet.Emails = email;
                if (phone && !existing.Phones?.includes(phone)) addToSet.Phones = phone;

                const hasUpdates = Object.keys(updates).length > 0;
                const hasAdds = Object.keys(addToSet).length > 0;
                if (hasUpdates || hasAdds) {
                    const op: Record<string, any> = {};
                    if (hasUpdates) op.$set = updates;
                    if (hasAdds) op.$addToSet = addToSet;
                    await WalletContact.updateOne({ _id: existing._id }, op);
                }
                skipped++;
            } else {
                await WalletContact.create({
                    UserID: walletUserId,
                    Name: name,
                    Emails: email ? [email] : [],
                    Phones: phone ? [phone] : [],
                    Avatar: photo || undefined,
                    Source: "google"
                });
                imported++;
            }
        }

        return NextResponse.json({
            success: true,
            data: { imported, skipped, total: allContacts.length }
        });
    } catch (err) {
        console.error("[contacts/import] Error:", err);
        return NextResponse.json({ success: false, error: "Import failed" }, { status: 500 });
    }
}
