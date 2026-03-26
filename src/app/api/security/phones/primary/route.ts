import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { UserPhone } from "@Models";
import { requireUser } from "../_shared";

export async function PATCH(request: NextRequest) {
    try {
        const session = await requireUser(request);
        const body = await request.json();
        const phoneId = String(body?.phoneId || "").trim();

        if (!phoneId) {
            return NextResponse.json({ success: false, error: "phoneId is required" }, { status: 400 });
        }

        await dbConnect();
        const selected = await UserPhone.findOne({ _id: phoneId, userId: session.user.id, verified: true }).exec();
        if (!selected) {
            return NextResponse.json({ success: false, error: "Phone not found" }, { status: 404 });
        }

        await UserPhone.updateMany({ userId: session.user.id }, { $set: { isPrimary: false } });
        selected.isPrimary = true;
        await selected.save();

        const phones = await UserPhone.find({ userId: session.user.id }).sort({ isPrimary: -1, createdAt: 1 }).lean();
        return NextResponse.json({ success: true, data: { phones } });
    } catch (error: any) {
        const status = error?.message === "Unauthorized" ? 401 : 500;
        return NextResponse.json({ success: false, error: error?.message || "Failed to set primary phone" }, { status });
    }
}
