/**
 * GET  /api/trade-journal   – list trades (requires Tools.Private.TradeJournal.Access)
 * POST /api/trade-journal   – create trade (requires Tools.Private.TradeJournal.Access)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { hasPermission } from "@Library/permissions";
import { TradeDirection, TradeHitStatus, TradeJournal, TradePnLSign, TradeResult } from "@Models/TradeJournal";

const AM_PM_TIME_RE = /^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

function toNum(v: unknown): number | undefined {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function toArray(v: unknown): string[] {
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
}

function computeHitStatus(direction: string, exitPrice?: number, stopLoss?: number, target?: number): TradeHitStatus {
    if (exitPrice == null) return TradeHitStatus.NONE;
    const isShort = direction === TradeDirection.SHORT;
    if (target != null) {
        const targetHit = isShort ? exitPrice <= target : exitPrice >= target;
        if (targetHit) return TradeHitStatus.TARGET_ACHIEVED;
    }
    if (stopLoss != null) {
        const slHit = isShort ? exitPrice >= stopLoss : exitPrice <= stopLoss;
        if (slHit) return TradeHitStatus.STOPLOSS_HIT;
    }
    return TradeHitStatus.NONE;
}

function computePnL(direction: string, entryPrice?: number, exitPrice?: number, quantity?: number, lotSize?: number): number | undefined {
    if (entryPrice == null || exitPrice == null) return undefined;
    const qty = quantity ?? 1;
    const lot = lotSize ?? 1;
    const raw = direction === TradeDirection.SHORT ? (entryPrice - exitPrice) * qty * lot : (exitPrice - entryPrice) * qty * lot;
    return Number(raw.toFixed(2));
}

function parseAmPmMinutes(t?: string): number | undefined {
    if (!t || !AM_PM_TIME_RE.test(t.trim())) return undefined;
    const m = t
        .trim()
        .toUpperCase()
        .match(/^(\d{2}):(\d{2})\s?(AM|PM)$/);
    if (!m) return undefined;
    let h = Number(m[1]);
    const min = Number(m[2]);
    const meridiem = m[3];
    if (meridiem === "PM" && h < 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    return h * 60 + min;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Check permission to access trade journal
        const canAccess = await hasPermission(user.userId, "Tools.Private.TradeJournal.Access");
        if (!canAccess) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Permission required: Tools.Private.TradeJournal.Access" },
                { status: 403 }
            );
        }

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(50, parseInt(q.get("limit") || "20"));
        const result = q.get("result");
        const segment = q.get("segment");
        const direction = q.get("direction");
        const from = q.get("from");
        const to = q.get("to");
        const search = q.get("search");

        const includeDrafts = q.get("includeDrafts") === "1";
        const onlyDrafts = q.get("onlyDrafts") === "1";

        const query: Record<string, any> = { UserID: user.userId };
        if (onlyDrafts) query.IsDraft = true;
        else if (!includeDrafts) query.IsDraft = { $ne: true };

        if (result) query.Result = result;
        if (segment) query.Segment = segment;
        if (direction) query.Direction = direction;
        if (from || to) {
            query.Date = {};
            if (from) query.Date.$gte = new Date(from);
            if (to) query.Date.$lte = new Date(to);
        }
        if (search) {
            query.$or = [
                { Instrument: { $regex: search, $options: "i" } },
                { StrategyName: { $regex: search, $options: "i" } },
                { PostTradeNotes: { $regex: search, $options: "i" } },
                { Tags: { $in: [new RegExp(search, "i")] } }
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
                {
                    $group: {
                        _id: null,
                        wins: {
                            $sum: { $cond: [{ $eq: ["$Result", "WIN"] }, 1, 0] }
                        },
                        losses: {
                            $sum: {
                                $cond: [{ $eq: ["$Result", "LOSS"] }, 1, 0]
                            }
                        },
                        breakeven: {
                            $sum: {
                                $cond: [{ $eq: ["$Result", "BREAKEVEN"] }, 1, 0]
                            }
                        },
                        netPnl: { $sum: "$NetPnL" }
                    }
                }
            ])
        ]);

        const sm = summaryAgg[0] ?? {
            wins: 0,
            losses: 0,
            breakeven: 0,
            netPnl: 0
        };
        const closed = sm.wins + sm.losses + sm.breakeven;
        const summary = {
            wins: sm.wins,
            losses: sm.losses,
            breakeven: sm.breakeven,
            netPnl: parseFloat((sm.netPnl ?? 0).toFixed(2)),
            winRate: closed > 0 ? parseFloat(((sm.wins / closed) * 100).toFixed(1)) : 0
        };

        return NextResponse.json({
            success: true,
            data: {
                trades,
                summary,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
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

        // Check permission to access trade journal
        const canAccess = await hasPermission(user.userId, "Tools.Private.TradeJournal.Access");
        if (!canAccess) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Permission required: Tools.Private.TradeJournal.Access" },
                { status: 403 }
            );
        }

        const body = await req.json();

        const isDraft = Boolean(body.IsDraft);
        const tradeDate = body.Date;
        const entryTime = String(body.EntryTime || "")
            .trim()
            .toUpperCase();
        const exitTime = String(body.ExitTime || "")
            .trim()
            .toUpperCase();

        const instrumentName = String(body.InstrumentName || body.Instrument || "")
            .trim()
            .toUpperCase();
        const instrument = String(body.Instrument || instrumentName)
            .trim()
            .toUpperCase();
        const segment = String(body.Segment || "OPTIONS").toUpperCase();
        const direction = String(body.PositionDuration || body.Direction || "SHORT").toUpperCase();

        const entryPrice = toNum(body.EntryPrice);
        const exitPrice = toNum(body.ExitPrice);
        const stopLoss = toNum(body.StopLoss);
        const target = toNum(body.Target);
        const quantity = toNum(body.Quantity);
        const lotSize = toNum(body.LotSize) ?? 1;
        const strikePrice = toNum(body.StrikePrice ?? body.Strike);

        const brokerage = toNum(body.Brokerage) ?? 0;
        const taxes = toNum(body.Taxes) ?? 0;
        const explicitPnlAmount = toNum(body.PnLAmount);
        const pnlSign = String(body.PnLSign || "").toUpperCase() === TradePnLSign.LOSS ? TradePnLSign.LOSS : TradePnLSign.PROFIT;

        const optionTypeMap: Record<string, string> = {
            CE: "CALL",
            CALL: "CALL",
            PE: "PUT",
            PUT: "PUT",
            NA: "NA"
        };
        const resolvedOptionType = body.OptionType ? (optionTypeMap[String(body.OptionType).toUpperCase()] ?? "NA") : "NA";

        if (!isDraft) {
            if (!tradeDate || !entryTime || !exitTime || !instrumentName || entryPrice == null || exitPrice == null) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Date, EntryTime, ExitTime, Instrument, EntryPrice, ExitPrice are required"
                    },
                    { status: 400 }
                );
            }
            if (!AM_PM_TIME_RE.test(entryTime) || !AM_PM_TIME_RE.test(exitTime)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "EntryTime and ExitTime must be in hh:mm AM/PM format"
                    },
                    { status: 400 }
                );
            }
            if (quantity == null && toNum(body.LotSize) == null) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Either Quantity or Lot Size is required"
                    },
                    { status: 400 }
                );
            }
        }

        const computedRawPnL = computePnL(direction, entryPrice, exitPrice, quantity, lotSize);
        const signedProvidedPnl =
            explicitPnlAmount != null
                ? pnlSign === TradePnLSign.LOSS
                    ? -Math.abs(explicitPnlAmount)
                    : Math.abs(explicitPnlAmount)
                : undefined;
        const grossPnl = toNum(body.GrossPnL) ?? signedProvidedPnl ?? computedRawPnL ?? 0;
        const netPnl = toNum(body.NetPnL) ?? Number((grossPnl - brokerage - taxes).toFixed(2));

        const result =
            exitPrice == null ? TradeResult.PENDING : netPnl > 0 ? TradeResult.WIN : netPnl < 0 ? TradeResult.LOSS : TradeResult.BREAKEVEN;

        let actualRR: number | undefined;
        if (entryPrice != null && exitPrice != null && stopLoss != null && stopLoss !== entryPrice) {
            actualRR = Number((Math.abs(exitPrice - entryPrice) / Math.abs(entryPrice - stopLoss)).toFixed(2));
        }

        const inferredHit = computeHitStatus(direction, exitPrice, stopLoss, target);
        const isHit =
            String(body.IsHit || "").toUpperCase() === "AUTO"
                ? inferredHit
                : (String(body.IsHit || inferredHit).toUpperCase() as TradeHitStatus);

        const entryMinutes = parseAmPmMinutes(entryTime);
        const exitMinutes = parseAmPmMinutes(exitTime);
        const holdingDurationMinutes = entryMinutes != null && exitMinutes != null ? exitMinutes - entryMinutes : undefined;

        const orUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

        const payload = {
            UserID: user.userId,
            IsDraft: isDraft,
            DraftID: body.DraftID || undefined,
            DraftUpdatedAt: new Date(),
            Date: tradeDate ? new Date(tradeDate) : new Date(),
            EntryTime: entryTime || undefined,
            ExitTime: exitTime || undefined,
            InstrumentName: instrumentName || undefined,
            Instrument: instrument || undefined,
            Segment: segment,
            Direction: direction,
            PositionDuration: direction,
            OptionType: resolvedOptionType,
            StrikePrice: strikePrice,
            Expiry: orUndef(body.Expiry),
            EntryPrice: entryPrice,
            ExitPrice: exitPrice,
            StopLoss: stopLoss,
            Target: target,
            Quantity: quantity,
            LotSize: lotSize,
            TotalCapital: toNum(body.TotalCapital),
            RiskPercentage: toNum(body.RiskPercentage),
            PlannedRiskAmount: toNum(body.PlannedRiskAmount),
            PlannedRewardAmount: toNum(body.PlannedRewardAmount),
            PlannedRR: toNum(body.PlannedRR),
            ActualRR: actualRR,
            GrossPnL: grossPnl,
            NetPnL: netPnl,
            Brokerage: brokerage,
            Taxes: taxes,
            Result: result,
            IsHit: isHit,
            PnLAmount: explicitPnlAmount ?? Math.abs(netPnl),
            PnLSign: pnlSign,
            HoldingDurationMinutes: holdingDurationMinutes,
            SetupType: orUndef(body.SetupType),
            StrategyName: orUndef(body.StrategyName || body.Strategy),
            MarketCondition: orUndef(body.MarketCondition),
            EmotionalState: orUndef(body.EmotionalState),
            FollowedPlan: body.FollowedPlan,
            MistakeType: orUndef(body.MistakeType),
            PreTradeAnalysis: orUndef(body.PreTradeAnalysis),
            PostTradeNotes: orUndef(body.PostTradeNotes || body.Notes),
            Lessons: orUndef(body.Lessons),
            Screenshots: toArray(body.Screenshots || body.AttachmentLinks),
            AttachmentUrls: toArray(body.AttachmentUrls || body.ScreenshotCdnUrls),
            Tags: toArray(body.Tags),
            IsOpen: exitPrice == null
        };

        let trade;
        if (!isDraft && body.DraftID) {
            trade = await TradeJournal.findOneAndUpdate(
                { UserID: user.userId, DraftID: body.DraftID, IsDraft: true },
                { $set: { ...payload, IsDraft: false, DraftUpdatedAt: null } },
                { new: true }
            );
        }

        if (!trade) {
            trade = await TradeJournal.create(payload);
        }

        return NextResponse.json({ success: true, data: trade }, { status: 201 });
    } catch (err) {
        console.error("POST /api/trade-journal:", err);
        return NextResponse.json({ success: false, error: "Failed to create trade" }, { status: 500 });
    }
}
