/**
 * API Route: Post-Link Profile Sync
 * Automatically fetches profile picture after linking an OAuth account
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { MongoClient } from "mongodb";

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

        console.log("🔄 Post-link sync for provider:", providerId);
        console.log("User:", session.user);

        // If user already has an image, no need to sync
        if (session.user.image) {
            console.log("✅ User already has an image, skipping sync");
            return NextResponse.json({
                success: true,
                message: "User already has a profile picture",
                image: session.user.image
            });
        }

        // Get linked accounts
        const accounts = await auth.api.listUserAccounts({
            headers: request.headers,
        });

        console.log("Found accounts:", accounts);

        const account = accounts.find((acc: any) => acc.providerId === providerId);

        if (!account) {
            return NextResponse.json(
                { error: `No ${providerId} account linked` },
                { status: 404 }
            );
        }

        let imageUrl: string | null = null;

        // Fetch profile image based on provider
        if (providerId === "google") {
            console.log("⚠️ Google profile pictures require fresh OAuth authentication");
            console.log("User should sign out and sign in with Google to capture the avatar");
            
            // Google doesn't store the profile picture in the account table during linking
            // It only captures it during initial OAuth sign-in via mapProfileToUser
            return NextResponse.json(
                { 
                    error: "GOOGLE_REQUIRES_SIGNIN",
                    message: "Google profile sync requires re-authentication. Please sign out and sign in with Google." 
                },
                { status: 400 }
            );
        } else if (providerId === "github") {
            // GitHub - fetch from API
            try {
                const response = await fetch(`https://api.github.com/user/${(account as any).accountId}`, {
                    headers: {
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "Portfolio-App",
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    imageUrl = userData.avatar_url;
                }
            } catch (error) {
                console.error("Failed to fetch GitHub avatar:", error);
            }
        }

        if (imageUrl) {
            console.log("✅ Updating user image to:", imageUrl);
            
            // Update user image
            await auth.api.updateUser({
                headers: request.headers,
                body: {
                    image: imageUrl,
                },
            });

            return NextResponse.json({
                success: true,
                image: imageUrl,
            });
        }

        return NextResponse.json(
            { error: "Could not fetch profile picture" },
            { status: 404 }
        );
    } catch (error: any) {
        console.error("Post-link sync error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to sync profile" },
            { status: 500 }
        );
    }
}
