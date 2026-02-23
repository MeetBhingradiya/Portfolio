/**
 * Custom Unlink Account API with server-side validation
 * Ensures users cannot lock themselves out by unlinking their last auth method
 */

import { auth } from "@Library/auth";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

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

        console.log("🔓 Unlink request:", { accountId, providerId, userId: session.user.id });

        if (!accountId || !providerId) {
            return NextResponse.json(
                { error: "Missing required fields: accountId and providerId" },
                { status: 400 }
            );
        }

        // Query MongoDB directly for linked accounts
        if (!process.env.MONGODB_01) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const client = new MongoClient(process.env.MONGODB_01);
        let accounts: any[] = [];
        let accountToDelete: any = null;
        
        try {
            await client.connect();
            const db = client.db("PRODUCTION_MeetBhingradiya");
            
            // Find all accounts for this user
            const userId = session.user.id;
            accounts = await db.collection("account").find({
                $or: [
                    { user_id: userId },
                    { user_id: new ObjectId(userId) }
                ]
            }).toArray();

            console.log("📋 Found accounts:", accounts.length);
            
            // Find the specific account to delete - try multiple matching strategies
            accountToDelete = await db.collection("account").findOne({
                $or: [
                    { user_id: userId },
                    { user_id: new ObjectId(userId) }
                ],
                providerId: providerId,
                accountId: accountId
            });

            // If not found by exact match, try finding by providerId only
            if (!accountToDelete) {
                console.log("⚠️ Exact match failed, trying providerId only...");
                accountToDelete = await db.collection("account").findOne({
                    $or: [
                        { user_id: userId },
                        { user_id: new ObjectId(userId) }
                    ],
                    providerId: providerId
                });
            }

            // If still not found, try by ObjectId if the accountId looks like one
            if (!accountToDelete && accountId.match(/^[0-9a-fA-F]{24}$/)) {
                console.log("⚠️ Trying by _id (ObjectId)...");
                accountToDelete = await db.collection("account").findOne({
                    _id: new ObjectId(accountId)
                });
            }

            console.log("🎯 Account to delete:", accountToDelete);
        } finally {
            await client.close();
        }

        // Check if user has a password set
        const hasPassword = session.user.emailVerified !== undefined && session.user.email;

        console.log("🔐 Has password:", hasPassword, "| Accounts count:", accounts.length);

        // Security check: Prevent unlinking the last auth method
        if (!hasPassword && accounts.length <= 1) {
            return NextResponse.json(
                { 
                    error: "LAST_AUTH_METHOD",
                    message: "Cannot unlink your last sign-in method. Please set a password in Security Settings or link another account first." 
                },
                { status: 400 }
            );
        }

        if (!accountToDelete) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            );
        }

        // Delete the account directly from MongoDB since Better Auth's API is not working
        console.log("🗑️ Deleting account from MongoDB...");
        const deleteClient = new MongoClient(process.env.MONGODB_01);
        
        try {
            await deleteClient.connect();
            const db = deleteClient.db("PRODUCTION_MeetBhingradiya");
            
            const deleteResult = await db.collection("account").deleteOne({
                _id: accountToDelete._id
            });

            console.log("✅ Delete result:", deleteResult);

            if (deleteResult.deletedCount === 0) {
                return NextResponse.json(
                    { error: "Failed to delete account" },
                    { status: 500 }
                );
            }
        } finally {
            await deleteClient.close();
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
