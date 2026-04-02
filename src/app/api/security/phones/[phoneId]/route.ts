import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { UserPhone } from "@Models";
import { requireUser } from "../_shared";

interface RouteParams {
    params: Promise<{ phoneId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireUser(request);
        const { phoneId } = await params;

        await dbConnect();

        const existing = await UserPhone.findOne({
            _id: phoneId,
            userId: session.user.id
        }).exec();
        if (!existing) {
            return NextResponse.json({ success: false, error: "Phone not found" }, { status: 404 });
        }

        const wasPrimary = existing.isPrimary;
        await UserPhone.deleteOne({ _id: existing._id });

        if (wasPrimary) {
            const replacement = await UserPhone.findOne({
                userId: session.user.id
            })
                .sort({ createdAt: 1 })
                .exec();
            if (replacement) {
                replacement.isPrimary = true;
                await replacement.save();
            }
        }

        const phones = await UserPhone.find({ userId: session.user.id }).sort({ isPrimary: -1, createdAt: 1 }).lean();
        return NextResponse.json({ success: true, data: { phones } });
    } catch (error: any) {
        const status = error?.message === "Unauthorized" ? 401 : 500;
        return NextResponse.json(
            {
                success: false,
                error: error?.message || "Failed to delete phone"
            },
            { status }
        );
    }
}
