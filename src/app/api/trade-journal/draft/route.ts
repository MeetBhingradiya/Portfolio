import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { TradeJournal } from "@Models/TradeJournal";

export async function GET() {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const draft = await TradeJournal.findOne({
            UserID: user.userId,
            IsDraft: true
        })
            .sort({ DraftUpdatedAt: -1, updatedAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: draft || null });
    } catch (error) {
        console.error("GET /api/trade-journal/draft:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch draft" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const draftId = String(body.DraftID || randomUUID());

        const payload = {
            ...body,
            UserID: user.userId,
            IsDraft: true,
            DraftID: draftId,
            DraftUpdatedAt: new Date()
        };

        const draft = await TradeJournal.findOneAndUpdate(
            { UserID: user.userId, DraftID: draftId },
            { $set: payload },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: draft });
    } catch (error) {
        console.error("POST /api/trade-journal/draft:", error);
        return NextResponse.json({ success: false, error: "Failed to save draft" }, { status: 500 });
    }
}
