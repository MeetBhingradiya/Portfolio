/**
 * API Route: List User's Linked Accounts
 * Returns all OAuth accounts linked to the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { ObjectId } from "mongodb";
import { getMongoCollection } from "@Utils/dbConnect";

export async function GET(request: NextRequest) {
    try {
        // Get current session
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("🔍 Fetching accounts for user:", session.user.id);

        // Query MongoDB directly for linked accounts
        const accountCollection = await getMongoCollection("account");
        const userId = session.user.id;
        const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;

        // Query the account collection - field name is "user_id" with underscore
        // user_id can be stored as either string or ObjectId, so try both
        const accounts = await accountCollection
            .find({
                $or: objectId ? [{ user_id: userId }, { user_id: objectId }] : [{ user_id: userId }]
            })
            .toArray();

            console.log("📋 Found accounts in DB:", accounts);

            // Format the accounts for the frontend
            const formattedAccounts = accounts.map((acc: any) => ({
                id: acc._id.toString(),
                accountId: acc.accountId,
                providerId: acc.providerId,
                provider: acc.providerId,
                userId: acc.user_id,
                createdAt: acc.createdAt,
                isPrimary: false // You can add logic to determine primary account
            }));

            console.log("✅ Returning formatted accounts:", formattedAccounts);

        return NextResponse.json({
            success: true,
            data: formattedAccounts
        });
    } catch (error: any) {
        console.error("❌ Failed to list linked accounts:", error);
        return NextResponse.json({ error: error.message || "Failed to list accounts" }, { status: 500 });
    }
}
