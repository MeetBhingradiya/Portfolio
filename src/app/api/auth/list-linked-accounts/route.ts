/**
 * API Route: List User's Linked Accounts
 * Returns all OAuth accounts linked to the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { MongoClient } from "mongodb";
import { Config as SConfig } from "@Config/Server";

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
        if (!process.env.MONGODB_01) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        const client = new MongoClient(process.env.MONGODB_01);

        try {
            await client.connect();
            const db = client.db(SConfig.Database.Name);

            // Query the account collection - field name is "user_id" with underscore
            // user_id can be stored as either string or ObjectId, so try both
            const { ObjectId } = require("mongodb");
            let userId: any = session.user.id;

            // Try to match both string and ObjectId formats
            const accounts = await db
                .collection("account")
                .find({
                    $or: [{ user_id: userId }, { user_id: new ObjectId(userId) }]
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
        } finally {
            await client.close();
        }
    } catch (error: any) {
        console.error("❌ Failed to list linked accounts:", error);
        return NextResponse.json({ error: error.message || "Failed to list accounts" }, { status: 500 });
    }
}
