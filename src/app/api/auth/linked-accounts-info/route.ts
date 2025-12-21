/**
 * API Route: Get Linked Accounts with Images
 * Returns all linked OAuth accounts with their profile images
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/Library/auth";

export async function GET(request: NextRequest) {
    try {
        // Get current session
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get all linked accounts
        const accounts = await auth.api.listUserAccounts({
            headers: request.headers,
        });

        // Note: Better Auth account schema doesn't include image by default
        // Images are stored in the user table, not account table
        // We'll return accounts without images for now
        const formattedAccounts = accounts.map((account: any) => ({
            id: account.id,
            providerId: account.providerId,
            accountId: account.accountId,
            image: null, // OAuth images not stored in account table
            name: null,
        }));

        return NextResponse.json({
            accounts: formattedAccounts,
            note: "OAuth profile images are only available during initial authentication",
        });
    } catch (error: any) {
        console.error("Failed to get linked accounts:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get accounts" },
            { status: 500 }
        );
    }
}
