/**
 * API Route: Sync Profile Image from OAuth
 * Manually fetches and updates user image from OAuth provider
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/Library/auth";

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

        console.log("Found account:", account);

        let imageUrl: string | null = null;

        // Fetch profile image based on provider
        if (providerId === "google") {
            // Google: The easiest way is to have the user sign out and sign in with Google
            // This will automatically capture the profile picture via mapProfileToUser
            // 
            // For now, we'll check if there's stored profile data from initial link
            console.log("Full account object:", JSON.stringify(account, null, 2));
            
            return NextResponse.json(
                { 
                    error: "To get your Google profile picture:\n\n1. Sign out completely\n2. Click 'Continue with Google' to sign in\n3. Your profile picture will be automatically set!\n\nNote: This is the most reliable method since Google requires fresh OAuth tokens to fetch profile data." 
                },
                { status: 400 }
            );
        } else if (providerId === "github") {
            // GitHub API - get user by login name
            // accountId from Better Auth is the numeric GitHub ID
            try {
                // Use the numeric ID to fetch user data
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
                console.log("GitHub user data:", userData);
                imageUrl = userData.avatar_url;
            } catch (error) {
                console.error("Failed to fetch GitHub avatar:", error);
                return NextResponse.json(
                    { error: "Failed to fetch from GitHub API. Please try again later." },
                    { status: 500 }
                );
            }
        } else if (providerId === "microsoft") {
            return NextResponse.json(
                { 
                    error: "To get your Microsoft profile picture, please:\n1. Sign out completely\n2. Sign in again using 'Continue with Microsoft'\n3. Your profile picture will be automatically updated" 
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
