/**
 * GET    /api/trade-journal/[id]  – fetch single trade
 * PUT    /api/trade-journal/[id]  – update trade
 * DELETE /api/trade-journal/[id]  – delete trade
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { TradeDirection, TradeHitStatus, TradeJournal, TradePnLSign, TradeResult } from "@Models/TradeJournal";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const trade = await TradeJournal.findOne({
            TradeID: id,
            UserID: user.userId
        }).lean();
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

        const existing: any = await TradeJournal.findOne({
            TradeID: id,
            UserID: user.userId
        });
        if (!existing) return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });

        const body = await req.json();

        const toNum = (v: unknown): number | undefined => {
            if (v == null || v === "") return undefined;
            const n = Number(v);
            return Number.isFinite(n) ? n : undefined;
        };

        const toArray = (v: unknown): string[] => {
            if (Array.isArray(v))
                return v
                    .map(String)
                    .map((s) => s.trim())
                    .filter(Boolean);
            if (typeof v === "string")
                return v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            return [];
        };

        const toMinutes = (t: string): number | undefined => {
            const v = String(t || "")
                .trim()
                .toUpperCase();

            // 12-hour format: HH:MM AM/PM
            const ampm = v.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
            if (ampm) {
                let hh = Number(ampm[1]);
                const mm = Number(ampm[2]);
                if (!Number.isFinite(hh) || !Number.isFinite(mm)) return undefined;
                if (ampm[3] === "PM" && hh < 12) hh += 12;
                if (ampm[3] === "AM" && hh === 12) hh = 0;
                return hh * 60 + mm;
            }

            // 24-hour fallback: HH:MM
            const hm = v.match(/^(\d{1,2}):(\d{2})$/);
            if (hm) {
                const hh = Number(hm[1]);
                const mm = Number(hm[2]);
                if (!Number.isFinite(hh) || !Number.isFinite(mm)) return undefined;
                return hh * 60 + mm;
            }

            return undefined;
        };

        const computeHitStatus = (direction: string, exitPrice?: number, stopLoss?: number, target?: number): TradeHitStatus => {
            if (exitPrice == null) return TradeHitStatus.NONE;
            const isShort = direction === TradeDirection.SHORT;
            if (target != null && (isShort ? exitPrice <= target : exitPrice >= target)) {
                return TradeHitStatus.TARGET_ACHIEVED;
            }
            if (stopLoss != null && (isShort ? exitPrice >= stopLoss : exitPrice <= stopLoss)) {
                return TradeHitStatus.STOPLOSS_HIT;
            }
            return TradeHitStatus.NONE;
        };

        // Map broker shorthand CE/PE → model enum CALL/PUT, strip empty-string enums
        const optionTypeMap: Record<string, string> = {
            CE: "CALL",
            CALL: "CALL",
            PE: "PUT",
            PUT: "PUT",
            NA: "NA"
        };
        const orUndef = (v: unknown) => (v === "" || v == null ? undefined : v);
        const direction = String(body.PositionDuration || body.Direction || existing.Direction || "SHORT").toUpperCase();

        const updates: Record<string, any> = {
            ...body,
            ...(body.InstrumentName !== undefined && {
                InstrumentName: String(body.InstrumentName).toUpperCase()
            }),
            ...(body.Instrument !== undefined && {
                Instrument: String(body.Instrument).toUpperCase()
            }),
            Direction: direction,
            PositionDuration: direction,
            ...(body.PnLSign !== undefined && {
                PnLSign: String(body.PnLSign).toUpperCase() === TradePnLSign.LOSS ? TradePnLSign.LOSS : TradePnLSign.PROFIT
            }),
            ...(body.PnLAmount !== undefined && {
                PnLAmount: toNum(body.PnLAmount)
            }),
            ...(body.StrikePrice === undefined &&
                body.Strike !== undefined && {
                    StrikePrice: toNum(body.Strike)
                }),
            ...(body.OptionType !== undefined && {
                OptionType: body.OptionType ? (optionTypeMap[String(body.OptionType).toUpperCase()] ?? "NA") : "NA"
            }),
            ...(body.SetupType !== undefined && {
                SetupType: orUndef(body.SetupType)
            }),
            ...(body.MarketCondition !== undefined && {
                MarketCondition: orUndef(body.MarketCondition)
            }),
            ...(body.EmotionalState !== undefined && {
                EmotionalState: orUndef(body.EmotionalState)
            }),
            ...(body.MistakeType !== undefined && {
                MistakeType: orUndef(body.MistakeType)
            }),
            ...(body.Notes !== undefined && {
                PostTradeNotes: orUndef(body.Notes)
            }),
            ...(body.StrategyName === undefined &&
                body.Strategy !== undefined && {
                    StrategyName: orUndef(body.Strategy)
                }),
            ...(body.Screenshots === undefined &&
                body.AttachmentLinks !== undefined && {
                    Screenshots: toArray(body.AttachmentLinks)
                }),
            ...(body.ScreenshotCdnUrls !== undefined && {
                AttachmentUrls: toArray(body.ScreenshotCdnUrls)
            })
        };

        // Re-compute derived fields from merged values
        const EntryPrice = toNum(body.EntryPrice) ?? existing.EntryPrice;
        const ExitPrice = toNum(body.ExitPrice) ?? existing.ExitPrice;
        const StopLoss = toNum(body.StopLoss) ?? existing.StopLoss;
        const Target = toNum(body.Target) ?? existing.Target;
        const Quantity = toNum(body.Quantity) ?? existing.Quantity;
        const LotSize = toNum(body.LotSize) ?? existing.LotSize ?? 1;
        const Direction = direction;
        const Brokerage = toNum(body.Brokerage) ?? existing.Brokerage ?? 0;
        const Taxes = toNum(body.Taxes) ?? existing.Taxes ?? 0;
        const EntryTime = body.EntryTime ?? existing.EntryTime;
        const ExitTime = body.ExitTime ?? existing.ExitTime;

        if (ExitPrice != null) {
            const raw =
                Direction === "LONG" ? (ExitPrice - EntryPrice) * Quantity * LotSize : (EntryPrice - ExitPrice) * Quantity * LotSize;
            const providedAmount = toNum(body.PnLAmount);
            const sign = String(body.PnLSign || existing.PnLSign || "PROFIT").toUpperCase() === "LOSS" ? -1 : 1;
            const signedFromAmount = providedAmount != null ? sign * Math.abs(providedAmount) : undefined;
            const GrossPnL = toNum(body.GrossPnL) ?? signedFromAmount ?? raw;
            const NetPnL = GrossPnL - Brokerage - Taxes;
            updates.GrossPnL = GrossPnL;
            updates.NetPnL = NetPnL;
            updates.IsOpen = false;
            updates.Result = NetPnL > 0 ? TradeResult.WIN : NetPnL < 0 ? TradeResult.LOSS : TradeResult.BREAKEVEN;
            updates.PnLAmount = providedAmount ?? Math.abs(NetPnL);
            updates.PnLSign = NetPnL < 0 ? TradePnLSign.LOSS : TradePnLSign.PROFIT;
            updates.IsHit =
                String(body.IsHit || "").toUpperCase() === "AUTO"
                    ? computeHitStatus(Direction, ExitPrice, StopLoss, Target)
                    : body.IsHit || existing.IsHit || TradeHitStatus.NONE;

            if (StopLoss != null && StopLoss !== EntryPrice) {
                updates.ActualRR = parseFloat((Math.abs(ExitPrice - EntryPrice) / Math.abs(EntryPrice - StopLoss)).toFixed(2));
            }
        }

        if (EntryTime && ExitTime) {
            const entryMinutes = toMinutes(String(EntryTime));
            const exitMinutes = toMinutes(String(ExitTime));
            if (entryMinutes != null && exitMinutes != null) {
                updates.HoldingDurationMinutes = exitMinutes - entryMinutes;
            }
        }

        const updated = await TradeJournal.findOneAndUpdate({ TradeID: id, UserID: user.userId }, { $set: updates }, { new: true });

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

        const deleted = await TradeJournal.findOneAndDelete({
            TradeID: id,
            UserID: user.userId
        });
        if (!deleted) return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: "Trade deleted" });
    } catch (err) {
        console.error("DELETE /api/trade-journal/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to delete trade" }, { status: 500 });
    }
}
