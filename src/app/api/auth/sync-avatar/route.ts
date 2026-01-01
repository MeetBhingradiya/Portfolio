/**
 * API Route: Sync Profile Image from OAuth
 * Manually fetches and updates user image from OAuth provider
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/Library/auth";
import { MongoClient, ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
    try {
        // Get current session
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { providerId } = body;

        console.log("Syncing avatar for provider:", providerId);

        // Query MongoDB directly for linked accounts
        if (!process.env.MONGODB_01) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const client = new MongoClient(process.env.MONGODB_01);
        let account: any = null;
        
        try {
            await client.connect();
            const db = client.db("PRODUCTION_MeetBhingradiya");
            
            // Find the account with user_id (ObjectId format)
            const userId = session.user.id;
            account = await db.collection("account").findOne({
                $or: [
                    { user_id: userId },
                    { user_id: new ObjectId(userId) }
                ],
                providerId: providerId
            });
            
            console.log("Found account:", account);
        } finally {
            await client.close();
        }

        if (!account) {
            return NextResponse.json(
                { error: `No ${providerId} account linked` },
                { status: 404 }
            );
        }

        let imageUrl: string | null = null;

        // Fetch profile image based on provider
        if (providerId === "google") {
            // Google requires OAuth re-authentication to get fresh profile data
            console.log("⚠️ Google profile sync requires re-authentication");
            
            return NextResponse.json(
                { 
                    error: "GOOGLE_REQUIRES_SIGNIN",
                    message: "Google profile sync requires fresh authentication. Please:\n\n1. Sign out\n2. Sign in with 'Continue with Google'\n3. Your avatar will be captured automatically\n\nAlternatively, you can manually set an image URL in your profile settings." 
                },
                { status: 400 }
            );
        } else if (providerId === "github") {
            // GitHub API - get user by accountId (numeric GitHub user ID)
            try {
                const response = await fetch(`https://api.github.com/user/${account.accountId}`, {
                    headers: {
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "Portfolio-App",
                    },
                });

                if (!response.ok) {
                    console.error("GitHub API error:", response.status, await response.text());
                    throw new Error(`GitHub API returned ${response.status}`);
                }

                const userData = await response.json();
                console.log("✅ GitHub user data:", userData);
                imageUrl = userData.avatar_url;
            } catch (error) {
                console.error("❌ Failed to fetch GitHub avatar:", error);
                return NextResponse.json(
                    { error: "Failed to fetch from GitHub API. Please try again later." },
                    { status: 500 }
                );
            }
        } else if (providerId === "microsoft") {
            // Microsoft requires OAuth re-authentication to get fresh profile data
            console.log("⚠️ Microsoft profile sync requires re-authentication");
            
            return NextResponse.json(
                { 
                    error: "MICROSOFT_REQUIRES_SIGNIN",
                    message: "Microsoft profile sync requires fresh authentication. Please:\n\n1. Sign out completely\n2. Sign in with 'Continue with Microsoft'\n3. Your profile picture will be automatically updated\n\nAlternatively, you can manually set an image URL in your profile settings." 
                },
                { status: 400 }
            );
        } else if (providerId === "apple") {
            // Apple doesn't provide profile pictures
            return NextResponse.json(
                { 
                    error: "APPLE_NO_AVATAR",
                    message: "Apple Sign In does not provide profile pictures. You can manually set an image URL in your profile settings." 
                },
                { status: 400 }
            );
        } else {
            return NextResponse.json(
                { error: `Avatar sync not supported for ${providerId}` },
                { status: 400 }
            );
        }

        if (imageUrl) {
            console.log("Updating user image to:", imageUrl);
            
            // Update user image using Better Auth API
            const updateResult = await auth.api.updateUser({
                headers: request.headers,
                body: {
                    image: imageUrl,
                },
            });

            console.log("Update result:", updateResult);

            return NextResponse.json({
                success: true,
                image: imageUrl,
            });
        }

        return NextResponse.json(
            { error: "Failed to fetch profile image" },
            { status: 500 }
        );
    } catch (error: any) {
        console.error("Failed to sync profile image:", error);
        return NextResponse.json(
            { error: error.message || "Failed to sync profile image" },
            { status: 500 }
        );
    }
}
