/**
 * Custom Unlink Account API with server-side validation
 * Ensures users cannot lock themselves out by unlinking their last auth method
 */

import { auth } from "@Library/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Get session from headers
        const session = await auth.api.getSession({ 
            headers: request.headers 
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get request body
        const body = await request.json();
        const { accountId, providerId } = body;

        if (!accountId || !providerId) {
            return NextResponse.json(
                { error: "Missing required fields: accountId and providerId" },
                { status: 400 }
            );
        }

        // Get all linked accounts for this user
        const accounts = await auth.api.listUserAccounts({
            headers: request.headers,
        });

        // Check if user has a password set
        // In Better Auth, if emailVerified exists, the user has set a password
        const hasPassword = session.user.emailVerified !== undefined && session.user.email;

        // Security check: Prevent unlinking the last auth method
        if (!hasPassword && accounts && accounts.length <= 1) {
            return NextResponse.json(
                { 
                    error: "LAST_AUTH_METHOD",
                    message: "Cannot unlink your last sign-in method. Please set a password in Security Settings or link another account first." 
                },
                { status: 400 }
            );
        }

        // Perform the unlink operation
        const unlinkResult = await auth.api.unlinkAccount({
            headers: request.headers,
            body: { accountId, providerId }
        });

        if (!unlinkResult) {
            return NextResponse.json(
                { error: "Failed to unlink account" },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true,
            message: "Account unlinked successfully" 
        });

    } catch (error: any) {
        console.error("Unlink account error:", error);
        return NextResponse.json(
            { 
                error: error.message || "Internal server error",
                details: error.toString()
            },
            { status: 500 }
        );
    }
}
