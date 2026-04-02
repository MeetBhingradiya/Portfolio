/**
 * Admin Users - Get/Delete a single user
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import { MongoClient, ObjectId } from "mongodb";

async function getDB() {
    if (!process.env.MONGODB_01) throw new Error("DB not configured");
    const client = new MongoClient(process.env.MONGODB_01);
    await client.connect();
    const db = client.db("PRODUCTION_MeetBhingradiya");
    return { client, col: db.collection("user") };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.users.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const { id } = await params;
        const { client, col } = await getDB();
        const user = await col.findOne({ _id: new ObjectId(id) });
        await client.close();
        if (!user) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: user });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.users.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const { id } = await params;
        const { client, col } = await getDB();
        await col.deleteOne({ _id: new ObjectId(id) });
        await client.close();
        return NextResponse.json({ success: true, message: "User deleted" });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
    }
}
