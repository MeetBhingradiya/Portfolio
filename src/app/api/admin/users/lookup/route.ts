/**
 * Admin — User Lookup by Email
 *
 * GET /api/admin/users/lookup?email=...
 *
 * Returns the Better Auth user record (id, name, email, image) for a given email.
 * Used by the Roles manager when adding a new user by email.
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.users.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
        if (!email) return NextResponse.json({ success: false, error: "email query param is required." }, { status: 422 });

        await dbConnect();

        // Better Auth stores users in the "user" collection in the same MongoDB
        const db = mongoose.connection.db;
        if (!db) return NextResponse.json({ success: false, error: "DB not connected." }, { status: 500 });

        const user = await db.collection("user").findOne(
            { email },
            { projection: { _id: 1, id: 1, name: 1, email: 1, image: 1 } }
        );

        if (!user) return NextResponse.json({ success: false, error: "No user found with this email." }, { status: 404 });

        // Better Auth uses _id as the user id
        const userId = (user.id as string) || user._id.toString();

        return NextResponse.json({ success: true, user: { id: userId, name: user.name, email: user.email, image: user.image } });
    } catch (err: any) {
        const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
