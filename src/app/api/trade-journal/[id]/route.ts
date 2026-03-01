/**
 * GET    /api/trade-journal/[id]  – fetch single trade
 * PUT    /api/trade-journal/[id]  – update trade
 * DELETE /api/trade-journal/[id]  – delete trade
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { TradeJournal, TradeResult } from "@Models/TradeJournal";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const trade = await TradeJournal.findOne({ TradeID: id, UserID: user.userId }).lean();
        if (!trade) return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: trade });
    } catch (err) {
        console.error("GET /api/trade-journal/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch trade" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const existing: any = await TradeJournal.findOne({ TradeID: id, UserID: user.userId });
        if (!existing) return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });

        const body = await req.json();

        // Map broker shorthand CE/PE → model enum CALL/PUT, strip empty-string enums
        const optionTypeMap: Record<string, string> = { CE: "CALL", CALL: "CALL", PE: "PUT", PUT: "PUT", NA: "NA" };
        const orUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

        const updates: Record<string, any> = {
            ...body,
            ...(body.OptionType !== undefined && {
                OptionType: body.OptionType
                    ? (optionTypeMap[String(body.OptionType).toUpperCase()] ?? "NA")
                    : "NA",
            }),
            ...(body.SetupType        !== undefined && { SetupType:        orUndef(body.SetupType) }),
            ...(body.MarketCondition  !== undefined && { MarketCondition:  orUndef(body.MarketCondition) }),
            ...(body.EmotionalState   !== undefined && { EmotionalState:   orUndef(body.EmotionalState) }),
            ...(body.MistakeType      !== undefined && { MistakeType:      orUndef(body.MistakeType) }),
        };

        // Re-compute derived fields from merged values
        const EntryPrice  = body.EntryPrice  ?? existing.EntryPrice;
        const ExitPrice   = body.ExitPrice   ?? existing.ExitPrice;
        const StopLoss    = body.StopLoss    ?? existing.StopLoss;
        const Quantity    = body.Quantity    ?? existing.Quantity;
        const LotSize     = body.LotSize     ?? existing.LotSize   ?? 1;
        const Direction   = body.Direction   ?? existing.Direction;
        const Brokerage   = body.Brokerage   ?? existing.Brokerage ?? 0;
        const Taxes       = body.Taxes       ?? existing.Taxes     ?? 0;
        const EntryTime   = body.EntryTime   ?? existing.EntryTime;
        const ExitTime    = body.ExitTime    ?? existing.ExitTime;

        if (ExitPrice != null) {
            const raw = Direction === "LONG"
                ? (ExitPrice - EntryPrice) * Quantity * LotSize
                : (EntryPrice - ExitPrice) * Quantity * LotSize;
            const GrossPnL = body.GrossPnL ?? raw;
            const NetPnL   = GrossPnL - Brokerage - Taxes;
            updates.GrossPnL = GrossPnL;
            updates.NetPnL   = NetPnL;
            updates.IsOpen   = false;
            updates.Result   = NetPnL > 0 ? TradeResult.WIN : NetPnL < 0 ? TradeResult.LOSS : TradeResult.BREAKEVEN;

            if (StopLoss != null && StopLoss !== EntryPrice) {
                updates.ActualRR = parseFloat(
                    (Math.abs(ExitPrice - EntryPrice) / Math.abs(EntryPrice - StopLoss)).toFixed(2)
                );
            }
        }

        if (EntryTime && ExitTime) {
            const mins = (t: string) => { const [hh, mm] = t.split(":").map(Number); return hh * 60 + mm; };
            updates.HoldingDurationMinutes = mins(ExitTime) - mins(EntryTime);
        }

        const updated = await TradeJournal.findOneAndUpdate(
            { TradeID: id, UserID: user.userId },
            { $set: updates },
            { new: true }
        );

        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        console.error("PUT /api/trade-journal/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to update trade" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const deleted = await TradeJournal.findOneAndDelete({ TradeID: id, UserID: user.userId });
        if (!deleted) return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: "Trade deleted" });
    } catch (err) {
        console.error("DELETE /api/trade-journal/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to delete trade" }, { status: 500 });
    }
}
