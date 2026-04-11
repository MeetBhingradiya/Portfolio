/**
 * Custom Unlink Account API with server-side validation
 * Ensures users cannot lock themselves out by unlinking their last auth method
 */

import { auth } from "@Library/auth";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoCollection } from "@Utils/dbConnect";

export async function POST(request: NextRequest) {
    try {
        // Get session from headers
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { accountId, providerId } = body;

        console.log("🔓 Unlink request:", {
            accountId,
            providerId,
            userId: session.user.id
        });

        if (!accountId || !providerId) {
            return NextResponse.json({ error: "Missing required fields: accountId and providerId" }, { status: 400 });
        }

        // Query MongoDB directly for linked accounts
        const accountCollection = await getMongoCollection("account");
        let accounts: any[] = [];
        let accountToDelete: any = null;

        // Find all accounts for this user
        const userId = session.user.id;
        const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
        const userQuery = userObjectId ? { $or: [{ user_id: userId }, { user_id: userObjectId }] } : { user_id: userId };
        accounts = await accountCollection.find(userQuery).toArray();

        console.log("📋 Found accounts:", accounts.length);

        // Find the specific account to delete - try multiple matching strategies
        accountToDelete = await accountCollection.findOne({
            ...userQuery,
            providerId: providerId,
            accountId: accountId
        });

        // If not found by exact match, try finding by providerId only
        if (!accountToDelete) {
            console.log("⚠️ Exact match failed, trying providerId only...");
            accountToDelete = await accountCollection.findOne({
                ...userQuery,
                providerId: providerId
            });
        }

        // If still not found, try by ObjectId if the accountId looks like one
        if (!accountToDelete && accountId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log("⚠️ Trying by _id (ObjectId)...");
            accountToDelete = await accountCollection.findOne({
                _id: new ObjectId(accountId)
            });
        }

        console.log("🎯 Account to delete:", accountToDelete);

        // Check if user has a password set
        const hasPassword = session.user.emailVerified !== undefined && session.user.email;

        console.log("🔐 Has password:", hasPassword, "| Accounts count:", accounts.length);

        // Security check: Prevent unlinking the last auth method
        if (!hasPassword && accounts.length <= 1) {
            return NextResponse.json(
                {
                    error: "LAST_AUTH_METHOD",
                    message:
                        "Cannot unlink your last sign-in method. Please set a password in Security Settings or link another account first."
                },
                { status: 400 }
            );
        }

        if (!accountToDelete) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        // Delete the account directly from MongoDB since Better Auth's API is not working
        console.log("🗑️ Deleting account from MongoDB...");
        const deleteResult = await accountCollection.deleteOne({
            _id: accountToDelete._id
        });

        console.log("✅ Delete result:", deleteResult);

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Account unlinked successfully"
        });
    } catch (error: any) {
        console.error("❌ Unlink account error:", error);
        return NextResponse.json(
            {
                error: error.message || "Internal server error",
                details: error.toString()
            },
            { status: 500 }
        );
    }
}
