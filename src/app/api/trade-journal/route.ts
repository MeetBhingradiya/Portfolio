/**
 * GET  /api/trade-journal   – list trades (paginated, filtered)
 * POST /api/trade-journal   – create trade
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { TradeJournal, TradeResult } from "@Models/TradeJournal";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const page      = Math.max(1, parseInt(q.get("page")  || "1"));
        const limit     = Math.min(50, parseInt(q.get("limit") || "20"));
        const result    = q.get("result");
        const segment   = q.get("segment");
        const direction = q.get("direction");
        const from      = q.get("from");
        const to        = q.get("to");
        const search    = q.get("search");

        const query: Record<string, any> = { UserID: user.userId };

        if (result)    query.Result    = result;
        if (segment)   query.Segment   = segment;
        if (direction) query.Direction = direction;
        if (from || to) {
            query.Date = {};
            if (from) query.Date.$gte = new Date(from);
            if (to)   query.Date.$lte = new Date(to);
        }
        if (search) {
            query.$or = [
                { Instrument:     { $regex: search, $options: "i" } },
                { StrategyName:   { $regex: search, $options: "i" } },
                { PostTradeNotes: { $regex: search, $options: "i" } },
                { Tags:           { $in: [new RegExp(search, "i")] } },
            ];
        }

        const [total, trades, summaryAgg] = await Promise.all([
            TradeJournal.countDocuments(query),
            TradeJournal.find(query)
                .sort({ Date: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            TradeJournal.aggregate([
                { $match: query },
                { $group: {
                    _id: null,
                    wins:      { $sum: { $cond: [{ $eq: ["$Result", "WIN"] },       1, 0] } },
                    losses:    { $sum: { $cond: [{ $eq: ["$Result", "LOSS"] },      1, 0] } },
                    breakeven: { $sum: { $cond: [{ $eq: ["$Result", "BREAKEVEN"] }, 1, 0] } },
                    netPnl:    { $sum: "$NetPnL" },
                } },
            ]),
        ]);

        const sm = summaryAgg[0] ?? { wins: 0, losses: 0, breakeven: 0, netPnl: 0 };
        const closed = sm.wins + sm.losses + sm.breakeven;
        const summary = {
            wins:      sm.wins,
            losses:    sm.losses,
            breakeven: sm.breakeven,
            netPnl:    parseFloat((sm.netPnl ?? 0).toFixed(2)),
            winRate:   closed > 0 ? parseFloat(((sm.wins / closed) * 100).toFixed(1)) : 0,
        };

        return NextResponse.json({
            success: true,
            data: {
                trades,
                summary,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (err) {
        console.error("GET /api/trade-journal:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch trades" }, { status: 500 });
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            Date: tradeDate, EntryTime, ExitTime,
            Instrument, Segment, Direction,
            OptionType, StrikePrice, Expiry,
            EntryPrice, ExitPrice, StopLoss, Target,
            Quantity, LotSize = 1, TotalCapital, RiskPercentage,
            PlannedRiskAmount, PlannedRewardAmount, PlannedRR,
            GrossPnL, Brokerage = 0, Taxes = 0,
            SetupType, StrategyName, MarketCondition,
            EmotionalState, FollowedPlan, MistakeType,
            PreTradeAnalysis, PostTradeNotes, Lessons,
            Screenshots = [], Tags = [],
        } = body;

        if (!EntryTime || !Instrument || EntryPrice == null || Quantity == null) {
            return NextResponse.json(
                { success: false, error: "EntryTime, Instrument, EntryPrice, and Quantity are required" },
                { status: 400 }
            );
        }

        // Compute derived fields
        let ActualRR: number | undefined;
        let NetPnL = 0;
        let GrossPnLCalc = GrossPnL;
        let Result: string = TradeResult.PENDING;
        let HoldingDurationMinutes: number | undefined;

        if (ExitPrice != null) {
            const raw = Direction === "LONG"
                ? (ExitPrice - EntryPrice) * Quantity * LotSize
                : (EntryPrice - ExitPrice) * Quantity * LotSize;
            GrossPnLCalc = GrossPnL ?? raw;
            NetPnL = GrossPnLCalc - Brokerage - Taxes;

            if (StopLoss != null && StopLoss !== EntryPrice) {
                ActualRR = parseFloat(
                    (Math.abs(ExitPrice - EntryPrice) / Math.abs(EntryPrice - StopLoss)).toFixed(2)
                );
            }
            Result = NetPnL > 0 ? TradeResult.WIN : NetPnL < 0 ? TradeResult.LOSS : TradeResult.BREAKEVEN;
        }

        if (EntryTime && ExitTime) {
            const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
            HoldingDurationMinutes = mins(ExitTime) - mins(EntryTime);
        }

        const trade = await TradeJournal.create({
            UserID: user.userId,
            Date: tradeDate ? new Date(tradeDate) : new Date(),
            EntryTime, ExitTime,
            Instrument: String(Instrument).toUpperCase(),
            Segment, Direction,
            OptionType, StrikePrice, Expiry,
            EntryPrice, ExitPrice, StopLoss, Target,
            Quantity, LotSize, TotalCapital, RiskPercentage,
            PlannedRiskAmount, PlannedRewardAmount, PlannedRR, ActualRR,
            GrossPnL: GrossPnLCalc ?? 0, Brokerage, Taxes, NetPnL, Result,
            HoldingDurationMinutes,
            SetupType, StrategyName, MarketCondition,
            EmotionalState, FollowedPlan, MistakeType,
            PreTradeAnalysis, PostTradeNotes, Lessons,
            Screenshots, Tags,
            IsOpen: ExitPrice == null,
        });

        return NextResponse.json({ success: true, data: trade }, { status: 201 });
    } catch (err) {
        console.error("POST /api/trade-journal:", err);
        return NextResponse.json({ success: false, error: "Failed to create trade" }, { status: 500 });
    }
}
