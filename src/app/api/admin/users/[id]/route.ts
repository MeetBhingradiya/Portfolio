/**
 * Admin Users - Get/Delete a single user
 */
import { NextRequest, NextResponse } from "next/server";
import { permissionError, requireAnyPermission, requirePermission } from "@Library/adminApiMiddleware";
import { ObjectId } from "mongodb";
import { getMongoCollection } from "@Utils/dbConnect";

async function getDB() {
    return { col: await getMongoCollection("user") };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAnyPermission(req, ["admin.users.view", "admin.users.manage"]);
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const { id } = await params;
        const { col } = await getDB();
        const user = await col.findOne({ _id: new ObjectId(id) });
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
        const { col } = await getDB();
        await col.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true, message: "User deleted" });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
    }
}
