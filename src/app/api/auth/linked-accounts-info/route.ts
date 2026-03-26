/**
 * API Route: Get Linked Accounts with Images
 * Returns all linked OAuth accounts with their per-provider avatar URLs.
 *
 * - googleAvatar / githubAvatar are persisted on the user record by auth.ts
 *   whenever the user signs in with that provider.
 * - GitHub avatar is also derivable deterministically from the account ID
 *   as a fallback: https://avatars.githubusercontent.com/u/{id}
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { MongoClient, ObjectId } from "mongodb";

function toObjectId(id: string): ObjectId | null {
    try { return new ObjectId(id); } catch { return null; }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;

        // Read avatar fields directly from MongoDB so that manual sync-avatar
        // writes are immediately reflected (session cache won't have them yet).
        let googleAvatar: string | null = user.googleAvatar ?? null;
        let githubAvatar: string | null = user.githubAvatar ?? null;
        let microsoftAvatar: string | null = user.microsoftAvatar ?? null;
        let currentImage: string | null = user.image ?? null;

        if (process.env.MONGODB_01) {
            const client = new MongoClient(process.env.MONGODB_01);
            try {
                await client.connect();
                const db = client.db("PRODUCTION_MeetBhingradiya");
                const oid = toObjectId(user.id);
                const dbUser = await db.collection("user").findOne(
                    oid ? { $or: [{ id: user.id }, { _id: oid }] } : { id: user.id }
                );
                if (dbUser) {
                    googleAvatar    = dbUser.googleAvatar    ?? googleAvatar;
                    githubAvatar    = dbUser.githubAvatar    ?? githubAvatar;
                    microsoftAvatar = dbUser.microsoftAvatar ?? microsoftAvatar;
                    currentImage    = dbUser.image           ?? currentImage;
                }
            } catch (err) {
                console.error("[linked-accounts-info] MongoDB read failed:", err);
                // fall back to session values already set above
            } finally {
                await client.close();
            }
        }

        // Linked accounts list
        const accounts = await auth.api.listUserAccounts({ headers: request.headers });

        const formattedAccounts = accounts.map((account: any) => {
            let image: string | null = null;

            if (account.providerId === "google") {
                image = googleAvatar;
            } else if (account.providerId === "github") {
                // Prefer stored avatar; fall back to deterministic GitHub URL
                image = githubAvatar ?? `https://avatars.githubusercontent.com/u/${account.accountId}?v=4`;
            } else if (account.providerId === "microsoft") {
                image = microsoftAvatar;
            }
            // apple: no avatar

            return {
                id: account.id,
                providerId: account.providerId,
                accountId: account.accountId,
                image,
            };
        });

        // Apply the same GitHub fallback to the top-level field so AvatarSelector
        // can show a GitHub card even before an explicit sync.
        if (!githubAvatar) {
            const ghAccount = accounts.find((a: any) => a.providerId === "github");
            if (ghAccount) {
                githubAvatar = `https://avatars.githubusercontent.com/u/${ghAccount.accountId}?v=4`;
            }
        }

        return NextResponse.json({
            accounts: formattedAccounts,
            // Expose per-provider avatars directly for easy access
            googleAvatar,
            githubAvatar,
            microsoftAvatar,
            // Current active image on the user profile
            currentImage,
        });
    } catch (error: any) {
        console.error("Failed to get linked accounts:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get accounts" },
            { status: 500 }
        );
    }
}
