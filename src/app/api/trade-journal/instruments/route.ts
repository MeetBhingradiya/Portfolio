/**
 * GET /api/trade-journal/instruments
 * Returns a list of distinct instrument names from the user's trade history.
 * Used for autocomplete suggestions in the trade form.
 */
import { NextResponse } from "next/server";
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

        const instruments: string[] = await TradeJournal.distinct("InstrumentName", {
            UserID: user.userId,
            IsDraft: { $ne: true },
            InstrumentName: { $exists: true, $ne: "" },
        });

        return NextResponse.json({ success: true, data: instruments.filter(Boolean).sort() });
    } catch (err) {
        console.error("GET /api/trade-journal/instruments:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch instruments" }, { status: 500 });
    }
}
