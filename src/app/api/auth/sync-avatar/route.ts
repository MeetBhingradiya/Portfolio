/**
 * API Route: Sync Profile Image from OAuth
 * Fetches a fresh avatar from the linked OAuth provider using the stored (encrypted) access token.
 * Supports Google, GitHub, and Microsoft.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { MongoClient, ObjectId } from "mongodb";
import { symmetricDecrypt } from "better-auth/crypto";

/** Safely convert a string to ObjectId, return null on failure */
function toObjectId(id: string): ObjectId | null {
    try {
        return new ObjectId(id);
    } catch {
        return null;
    }
}

/** Decrypt a token stored by better-auth when encryptOAuthTokens: true */
async function decryptToken(encryptedToken: string): Promise<string | null> {
    try {
        const secret = process.env.BETTER_AUTH_SECRET;
        if (!secret) return null;
        // better-auth uses symmetricDecrypt (xchacha20poly1305) with BETTER_AUTH_SECRET
        return await symmetricDecrypt({ key: secret, data: encryptedToken });
    } catch (err) {
        console.error("[sync-avatar] Token decryption failed:", err);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { providerId } = await request.json();

        if (!providerId) {
            return NextResponse.json({ error: "providerId is required" }, { status: 400 });
        }

        if (!process.env.MONGODB_01) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        if (providerId === "apple") {
            return NextResponse.json(
                { error: "APPLE_NO_AVATAR", message: "Apple Sign In does not provide profile pictures." },
                { status: 400 }
            );
        }

        if (!["google", "github", "microsoft"].includes(providerId)) {
            return NextResponse.json(
                { error: `Avatar sync not supported for ${providerId}` },
                { status: 400 }
            );
        }

        const userId = session.user.id;
        const objectId = toObjectId(userId);

        const client = new MongoClient(process.env.MONGODB_01);
        let avatarField: string;
        let imageUrl: string | null = null;

        try {
            await client.connect();
            const db = client.db("PRODUCTION_MeetBhingradiya");

            // Locate the OAuth account record (user_id may be string or ObjectId)
            const userIdQuery = objectId
                ? { $or: [{ user_id: userId }, { user_id: objectId }] }
                : { user_id: userId };

            const account = await db.collection("account").findOne({
                ...userIdQuery,
                providerId,
            });

            if (!account) {
                return NextResponse.json(
                    { error: `No ${providerId} account linked` },
                    { status: 404 }
                );
            }

            console.log(`[sync-avatar] Found ${providerId} account:`, account.accountId);

            // ── Google ─────────────────────────────────────────────────────────────
            if (providerId === "google") {
                avatarField = "googleAvatar";

                // Decrypt stored access token
                const rawToken = account.accessToken as string | null;
                const accessToken = rawToken ? await decryptToken(rawToken) : null;

                if (!accessToken) {
                    return NextResponse.json(
                        { error: "Cannot decrypt Google access token. Please re-link your Google account." },
                        { status: 400 }
                    );
                }

                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!res.ok) {
                    const body = await res.text();
                    console.error("[sync-avatar] Google userinfo error:", res.status, body);
                    // Token probably expired — surface a clear message
                    return NextResponse.json(
                        {
                            error: "GOOGLE_TOKEN_EXPIRED",
                            message: "Your Google access token has expired. Please sign out and sign in again with Google to refresh it.",
                        },
                        { status: 401 }
                    );
                }

                const profile = await res.json();
                imageUrl = (profile.picture as string) || null;

                if (!imageUrl) {
                    return NextResponse.json(
                        { error: "Google account does not have a profile picture." },
                        { status: 400 }
                    );
                }

                console.log("[sync-avatar] ✅ Google picture:", imageUrl);
            }

            // ── GitHub ─────────────────────────────────────────────────────────────
            else if (providerId === "github") {
                avatarField = "githubAvatar";

                // GitHub avatars are public: https://avatars.githubusercontent.com/u/{numericId}
                const numericId = account.accountId as string;
                imageUrl = `https://avatars.githubusercontent.com/u/${numericId}?v=4`;

                // Verify the URL is reachable (HEAD request)
                try {
                    const check = await fetch(imageUrl, { method: "HEAD" });
                    if (!check.ok) throw new Error(`Status ${check.status}`);
                } catch (e) {
                    console.error("[sync-avatar] GitHub avatar HEAD check failed:", e);
                    return NextResponse.json(
                        { error: "Could not reach GitHub avatar URL. Please try again later." },
                        { status: 500 }
                    );
                }

                console.log("[sync-avatar] ✅ GitHub avatar:", imageUrl);
            }

            // ── Microsoft ──────────────────────────────────────────────────────────
            else {
                avatarField = "microsoftAvatar";

                const rawToken = account.accessToken as string | null;
                const accessToken = rawToken ? await decryptToken(rawToken) : null;

                if (!accessToken) {
                    return NextResponse.json(
                        { error: "Cannot decrypt Microsoft access token. Please re-link your Microsoft account." },
                        { status: 400 }
                    );
                }

                const photoRes = await fetch(
                    "https://graph.microsoft.com/v1.0/me/photos/48x48/$value",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "image/jpeg",
                        },
                    }
                );

                if (!photoRes.ok) {
                    if (photoRes.status === 401) {
                        return NextResponse.json(
                            {
                                error: "MICROSOFT_TOKEN_EXPIRED",
                                message: "Your Microsoft access token has expired. Please sign out and sign in again with Microsoft to refresh it.",
                            },
                            { status: 401 }
                        );
                    }
                    // 404 = no photo set
                    return NextResponse.json(
                        { error: "Your Microsoft account does not have a profile picture." },
                        { status: 400 }
                    );
                }

                const arrayBuffer = await photoRes.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");
                const contentType = photoRes.headers.get("content-type") || "image/jpeg";
                imageUrl = `data:${contentType};base64,${base64}`;

                console.log("[sync-avatar] ✅ Microsoft photo fetched (base64 data URL)");
            }

            // ── Persist to MongoDB + Better Auth ───────────────────────────────────
            if (imageUrl) {
                // 1. Write the provider-specific avatar field directly (input:false additionalField)
                const userQuery = objectId
                    ? { $or: [{ id: userId }, { _id: objectId }] }
                    : { id: userId };

                await db.collection("user").updateOne(userQuery, {
                    $set: { [avatarField!]: imageUrl, image: imageUrl },
                });

                console.log(`[sync-avatar] ✅ Wrote ${avatarField} + image to MongoDB`);
            }
        } finally {
            await client.close();
        }

        if (!imageUrl) {
            return NextResponse.json({ error: "Failed to fetch profile image" }, { status: 500 });
        }

        return NextResponse.json({ success: true, image: imageUrl });
    } catch (error: any) {
        console.error("[sync-avatar] Unexpected error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to sync profile image" },
            { status: 500 }
        );
    }
}
