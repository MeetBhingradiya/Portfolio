/**
 * GET  /api/trade-journal/daily-capital   – list entries (newest first)
 * POST /api/trade-journal/daily-capital   – upsert an entry for a given date
 * DELETE /api/trade-journal/daily-capital?date=YYYY-MM-DD – remove an entry
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { DailyCapital } from "@Models/DailyCapital";

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const from = q.get("from");
        const to = q.get("to");
        const limit = Math.min(500, parseInt(q.get("limit") || "365"));

        const match: Record<string, any> = { UserID: user.userId };
        if (from || to) {
            match.Date = {};
            if (from) match.Date.$gte = from;
            if (to) match.Date.$lte = to;
        }

        const entries = await DailyCapital.find(match).sort({ Date: -1 }).limit(limit).lean();

        return NextResponse.json({ success: true, data: entries });
    } catch (err) {
        console.error("GET /api/trade-journal/daily-capital:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
    }
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { Date: date, StartingCapital, EndingCapital, Notes } = await req.json();

        if (!date || StartingCapital == null || EndingCapital == null) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Date, StartingCapital and EndingCapital are required"
                },
                { status: 400 }
            );
        }

        if (StartingCapital <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "StartingCapital must be greater than 0"
                },
                { status: 400 }
            );
        }

        const NetPnL = EndingCapital - StartingCapital;
        const DailyReturn = NetPnL / StartingCapital;

        const entry = await DailyCapital.findOneAndUpdate(
            { UserID: user.userId, Date: date },
            {
                $set: {
                    StartingCapital,
                    EndingCapital,
                    NetPnL,
                    DailyReturn,
                    Notes
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, data: entry }, { status: 200 });
    } catch (err) {
        console.error("POST /api/trade-journal/daily-capital:", err);
        return NextResponse.json({ success: false, error: "Failed to save entry" }, { status: 500 });
    }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const date = req.nextUrl.searchParams.get("date");
        if (!date) return NextResponse.json({ success: false, error: "date param required" }, { status: 400 });

        await DailyCapital.deleteOne({ UserID: user.userId, Date: date });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/trade-journal/daily-capital:", err);
        return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    }
}
