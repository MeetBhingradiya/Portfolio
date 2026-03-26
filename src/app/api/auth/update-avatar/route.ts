/**
 * API Route: Update User Avatar
 *
 * avatarSource options:
 *   "google"   → set image to the stored googleAvatar
 *   "github"   → set image to the stored githubAvatar
 *   "custom"   → set image to customImageUrl
 *   "initials" → clear image (gradient with initials is generated client-side)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { MongoClient, ObjectId } from "mongodb";

function toObjectId(id: string): ObjectId | null {
    try { return new ObjectId(id); } catch { return null; }
}

/** Read per-provider avatar fields directly from MongoDB (bypasses stale session cache). */
async function getStoredAvatars(userId: string) {
    if (!process.env.MONGODB_01) return {};
    const client = new MongoClient(process.env.MONGODB_01);
    try {
        await client.connect();
        const db = client.db("PRODUCTION_MeetBhingradiya");
        const oid = toObjectId(userId);
        const dbUser = await db.collection("user").findOne(
            oid ? { $or: [{ id: userId }, { _id: oid }] } : { id: userId }
        );
        return {
            googleAvatar:    (dbUser?.googleAvatar    as string | null) ?? null,
            githubAvatar:    (dbUser?.githubAvatar    as string | null) ?? null,
            microsoftAvatar: (dbUser?.microsoftAvatar as string | null) ?? null,
        };
    } catch (err) {
        console.error("[update-avatar] MongoDB read failed:", err);
        return {};
    } finally {
        await client.close();
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const body = await request.json();
        const { avatarSource, customImageUrl } = body as {
            avatarSource: "google" | "github" | "microsoft" | "custom" | "initials";
            customImageUrl?: string;
        };

        // Read avatar fields from MongoDB — session cache may be stale after a sync-avatar call
        const stored = await getStoredAvatars(user.id);

        let newImageUrl: string | null = null;

        switch (avatarSource) {
            case "google":
                newImageUrl = stored.googleAvatar ?? null;
                if (!newImageUrl) {
                    return NextResponse.json(
                        { error: "No Google avatar available. Sign in with Google first." },
                        { status: 400 }
                    );
                }
                break;

            case "github":
                newImageUrl = stored.githubAvatar ?? null;
                if (!newImageUrl) {
                    return NextResponse.json(
                        { error: "No GitHub avatar available. Link your GitHub account first." },
                        { status: 400 }
                    );
                }
                break;

            case "microsoft":
                newImageUrl = stored.microsoftAvatar ?? null;
                if (!newImageUrl) {
                    return NextResponse.json(
                        { error: "No Microsoft avatar available. Link your Microsoft account first." },
                        { status: 400 }
                    );
                }
                break;

            case "custom":
                if (!customImageUrl) {
                    return NextResponse.json(
                        { error: "customImageUrl is required when avatarSource is 'custom'" },
                        { status: 400 }
                    );
                }
                newImageUrl = customImageUrl;
                break;

            case "initials":
            default:
                newImageUrl = null; // null → show gradient initials
                break;
        }

        await auth.api.updateUser({
            headers: request.headers,
            body: { image: newImageUrl },
        });

        return NextResponse.json({ success: true, image: newImageUrl });
    } catch (error: any) {
        console.error("Failed to update avatar:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update avatar" },
            { status: 500 }
        );
    }
}
