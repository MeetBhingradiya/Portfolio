/**
 * GET /api/trade-journal/analytics
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), segment, instrument
 *
 * Returns a comprehensive analytics object for the authenticated user.
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { TradeJournal, TradeResult } from "@Models/TradeJournal";
import { DailyCapital } from "@Models/DailyCapital";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const from      = searchParams.get("from");
        const to        = searchParams.get("to");
        const segment   = searchParams.get("segment");
        const instrument = searchParams.get("instrument");

        const query: Record<string, any> = {
            UserID: user.userId,
            IsDraft: { $ne: true },
            $or: [
                { IsOpen: false },
                { ExitPrice: { $ne: null } },
                { Result: { $in: [TradeResult.WIN, TradeResult.LOSS, TradeResult.BREAKEVEN] } },
            ],
        };

        if (from || to) {
            query.Date = {};
            if (from) {
                const fromDate = new Date(from);
                fromDate.setHours(0, 0, 0, 0);
                query.Date.$gte = fromDate;
            }
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                query.Date.$lte = toDate;
            }
        }
        if (segment)    query.Segment    = segment;
        if (instrument) query.Instrument = { $regex: instrument, $options: "i" };

        const trades: any[] = await TradeJournal.find(query).sort({ Date: 1, EntryTime: 1 }).lean();

        // Charges metrics should be independent of selected date range.
        // Keep segment/instrument filters, but remove from/to dependency.
        const chargeBaseMatch: Record<string, any> = {
            UserID: user.userId,
            IsDraft: { $ne: true },
        };
        if (segment) chargeBaseMatch.Segment = segment;
        if (instrument) chargeBaseMatch.Instrument = { $regex: instrument, $options: "i" };

        const avgChargesAgg = await TradeJournal.aggregate([
            { $match: chargeBaseMatch },
            {
                $project: {
                    charges: {
                        $add: [
                            { $ifNull: ["$Brokerage", 0] },
                            { $ifNull: ["$Taxes", 0] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$charges" },
                    count: { $sum: 1 },
                },
            },
        ]);
        const allTimeAvgCharges = avgChargesAgg[0]?.count
            ? parseFloat(((avgChargesAgg[0].total ?? 0) / avgChargesAgg[0].count).toFixed(2))
            : 0;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayChargesAgg = await TradeJournal.aggregate([
            {
                $match: {
                    ...chargeBaseMatch,
                    Date: { $gte: todayStart, $lte: todayEnd },
                },
            },
            {
                $project: {
                    charges: {
                        $add: [
                            { $ifNull: ["$Brokerage", 0] },
                            { $ifNull: ["$Taxes", 0] },
                        ],
                    },
                },
            },
            { $group: { _id: null, total: { $sum: "$charges" } } },
        ]);
        const todayCharges = parseFloat(((todayChargesAgg[0]?.total ?? 0) as number).toFixed(2));

        // ── Daily capital records for Sharpe ratio ────────────────────────
        const dailyCapitalQuery: Record<string, any> = { UserID: user.userId };
        if (from || to) {
            dailyCapitalQuery.Date = {};
            if (from) dailyCapitalQuery.Date.$gte = from;
            if (to)   dailyCapitalQuery.Date.$lte = to;
        }
        const dailyCapitalRecords: any[] = await DailyCapital
            .find(dailyCapitalQuery)
            .sort({ Date: 1 })
            .lean();

        // Sharpe = (avgDailyReturn - riskFreeDaily) / stdDev × √252
        const RISK_FREE_DAILY = 0.06 / 252; // 6% annual India T-Bill approx
        let sharpeRatio = 0;
        const dailyReturns = dailyCapitalRecords.map(r => r.DailyReturn as number);
        if (dailyReturns.length >= 2) {
            const n   = dailyReturns.length;
            const avg = dailyReturns.reduce((s, r) => s + r, 0) / n;
            const variance = dailyReturns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / (n - 1);
            const stdDev = Math.sqrt(variance);
            sharpeRatio = stdDev > 0
                ? parseFloat((((avg - RISK_FREE_DAILY) / stdDev) * Math.sqrt(252)).toFixed(3))
                : 0;
        }

        if (trades.length === 0) {
            return NextResponse.json({
                success: true,
                data: emptyAnalytics({
                    avgCharges: allTimeAvgCharges,
                    todayCharges,
                }),
            });
        }

        // ── Basic partitioning ────────────────────────────────────────────
        const wins   = trades.filter(t => t.Result === TradeResult.WIN);
        const losses = trades.filter(t => t.Result === TradeResult.LOSS);
        const be     = trades.filter(t => t.Result === TradeResult.BREAKEVEN);

        const total  = trades.length;
        const winPnL  = wins.reduce((s, t)   => s + (t.NetPnL ?? 0), 0);
        const lossPnL = losses.reduce((s, t) => s + Math.abs(t.NetPnL ?? 0), 0);

        const winRate  = wins.length   / total;
        const lossRate = losses.length / total;
        const beRate   = be.length     / total;

        const avgWin  = wins.length   ? winPnL  / wins.length   : 0;
        const avgLoss = losses.length ? lossPnL / losses.length : 0;

        // Expectancy = (WR × avgWin) − (LR × avgLoss)
        const expectancy   = winRate * avgWin - lossRate * avgLoss;
        const profitFactor = lossPnL > 0 ? winPnL / lossPnL : winPnL > 0 ? Infinity : 0;

        // ── Equity curve & max drawdown ───────────────────────────────────
        const equityCurve: Array<{ date: string; equity: number; tradeNo: number }> = [];
        let equity = 0;
        let peak = 0;
        let maxDrawdown = 0;

        for (let i = 0; i < trades.length; i++) {
            equity += trades[i].NetPnL ?? 0;
            if (equity > peak) peak = equity;
            const dd = peak > 0 ? (peak - equity) / peak : 0;
            if (dd > maxDrawdown) maxDrawdown = dd;
            equityCurve.push({ date: new Date(trades[i].Date as Date).toISOString().slice(0, 10), equity: parseFloat(equity.toFixed(2)), tradeNo: i + 1 });
        }
        const maxDrawdownPct = parseFloat((maxDrawdown * 100).toFixed(2));

        // ── Max consecutive losses ────────────────────────────────────────
        let maxConsecLosses = 0;
        let curConsec = 0;
        for (const t of trades) {
            if (t.Result === TradeResult.LOSS) { curConsec++; if (curConsec > maxConsecLosses) maxConsecLosses = curConsec; }
            else curConsec = 0;
        }

        // ── Avg actual RR, plan adherence (via FollowedPlan), holding duration ─
        const tradesWithRR  = trades.filter(t => t.ActualRR != null);
        const avgActualRR   = tradesWithRR.length
            ? tradesWithRR.reduce((s, t) => s + t.ActualRR, 0) / tradesWithRR.length
            : 0;

        const tradesWithFollowedPlan = trades.filter(t => t.FollowedPlan != null);
        const planAdherenceAvg = tradesWithFollowedPlan.length
            ? (tradesWithFollowedPlan.filter((t: any) => t.FollowedPlan).length / tradesWithFollowedPlan.length) * 100
            : 0;

        const holdingTrades       = trades.filter(t => t.HoldingDurationMinutes != null);
        const avgHoldingMinutes   = holdingTrades.length
            ? holdingTrades.reduce((s, t) => s + t.HoldingDurationMinutes, 0) / holdingTrades.length
            : 0;

        // ── Monthly PnL breakdown ─────────────────────────────────────────
        const monthMap: Record<string, number> = {};
        for (const t of trades) {
            const ym = new Date(t.Date as Date).toISOString().slice(0, 7); // "YYYY-MM"
            monthMap[ym] = (monthMap[ym] ?? 0) + (t.NetPnL ?? 0);
        }
        const monthlyPnL = Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, pnl]) => ({ month, pnl: parseFloat(pnl.toFixed(2)) }));

        // ── By instrument ──────────────────────────────────────────────────
        const instMap: Record<string, { trades: number; pnl: number; wins: number }> = {};
        for (const t of trades) {
            const k = t.Instrument ?? "Unknown";
            if (!instMap[k]) instMap[k] = { trades: 0, pnl: 0, wins: 0 };
            instMap[k].trades++;
            instMap[k].pnl  += t.NetPnL ?? 0;
            if (t.Result === TradeResult.WIN) instMap[k].wins++;
        }
        const byInstrument = Object.entries(instMap).map(([instrument, v]) => ({
            instrument,
            trades:  v.trades,
            pnl:     parseFloat(v.pnl.toFixed(2)),
            winRate: parseFloat(((v.wins / v.trades) * 100).toFixed(1)),
        })).sort((a, b) => b.pnl - a.pnl);

        // ── By setup type ─────────────────────────────────────────────────
        const setupMap: Record<string, { trades: number; pnl: number; wins: number }> = {};
        for (const t of trades) {
            const k = t.SetupType ?? "Unknown";
            if (!setupMap[k]) setupMap[k] = { trades: 0, pnl: 0, wins: 0 };
            setupMap[k].trades++;
            setupMap[k].pnl  += t.NetPnL ?? 0;
            if (t.Result === TradeResult.WIN) setupMap[k].wins++;
        }
        const bySetup = Object.entries(setupMap).map(([setup, v]) => ({
            setup,
            trades:  v.trades,
            pnl:     parseFloat(v.pnl.toFixed(2)),
            winRate: parseFloat(((v.wins / v.trades) * 100).toFixed(1)),
        })).sort((a, b) => b.pnl - a.pnl);

        // ── By emotional state ────────────────────────────────────────────
        const emotMap: Record<string, { trades: number; pnl: number; wins: number }> = {};
        for (const t of trades) {
            const k = t.EmotionalState ?? "Unknown";
            if (!emotMap[k]) emotMap[k] = { trades: 0, pnl: 0, wins: 0 };
            emotMap[k].trades++;
            emotMap[k].pnl  += t.NetPnL ?? 0;
            if (t.Result === TradeResult.WIN) emotMap[k].wins++;
        }
        const byEmotion = Object.entries(emotMap).map(([emotion, v]) => ({
            emotion,
            trades:  v.trades,
            pnl:     parseFloat(v.pnl.toFixed(2)),
            winRate: parseFloat(((v.wins / v.trades) * 100).toFixed(1)),
        })).sort((a, b) => b.pnl - a.pnl);

        // ── Mistake type breakdown ────────────────────────────────────────
        const mistakeMap: Record<string, number> = {};
        for (const t of trades) {
            if (t.MistakeType) {
                mistakeMap[t.MistakeType] = (mistakeMap[t.MistakeType] ?? 0) + 1;
            }
        }
        const byMistake = Object.entries(mistakeMap)
            .map(([mistake, count]) => ({ mistake, count }))
            .sort((a, b) => b.count - a.count);

        const netPnLTotal = trades.reduce((s, t) => s + (t.NetPnL ?? 0), 0);

        // ── Additional performance metrics ───────────────────────────────
        const uniqueTradingDays = new Set(
            trades.map(t => new Date(t.Date as Date).toISOString().slice(0, 10))
        ).size;
        const dailyAvgPnL = uniqueTradingDays > 0 ? netPnLTotal / uniqueTradingDays : 0;

        const tradePnLs = trades.map(t => t.NetPnL ?? 0);
        const highestPnL = tradePnLs.length ? Math.max(...tradePnLs) : 0;
        const lowestPnL = tradePnLs.length ? Math.min(...tradePnLs) : 0;

        const avgCharges = allTimeAvgCharges;

        // ── Edge Validation (8-rule system) ──────────────────────────────
        const edgeChecklist = [
            { rule: "Win Rate ≥ 50%",                   pass: winRate  >= 0.5 },
            { rule: "Profit Factor ≥ 1.5",              pass: profitFactor >= 1.5 },
            { rule: "Expectancy > 0",                   pass: expectancy > 0 },
            { rule: "Avg Win ≥ Avg Loss",               pass: avgWin   >= avgLoss },
            { rule: "Max Drawdown < 20%",               pass: maxDrawdownPct < 20 },
            { rule: "Max Consec. Losses ≤ 5",           pass: maxConsecLosses <= 5 },
            { rule: "Avg Actual RR ≥ 1",                pass: avgActualRR >= 1 },
            { rule: "Plan Adherence ≥ 70%",             pass: planAdherenceAvg >= 70 },
        ];
        const edgeScore = edgeChecklist.filter(e => e.pass).length;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    total,
                    wins:   wins.length,
                    losses: losses.length,
                    breakeven: be.length,
                    winRate:  parseFloat((winRate  * 100).toFixed(2)),
                    lossRate: parseFloat((lossRate * 100).toFixed(2)),
                    beRate:   parseFloat((beRate   * 100).toFixed(2)),
                    netPnL:   parseFloat(netPnLTotal.toFixed(2)),
                    grossWin: parseFloat(winPnL.toFixed(2)),
                    grossLoss: parseFloat(lossPnL.toFixed(2)),
                    avgWin:   parseFloat(avgWin.toFixed(2)),
                    avgLoss:  parseFloat(avgLoss.toFixed(2)),
                    expectancy: parseFloat(expectancy.toFixed(2)),
                    profitFactor: parseFloat((isFinite(profitFactor) ? profitFactor : 0).toFixed(2)),
                    maxDrawdownPct,
                    maxConsecLosses,
                    avgActualRR:      parseFloat(avgActualRR.toFixed(2)),
                    planAdherenceAvg: parseFloat(planAdherenceAvg.toFixed(1)),
                    avgHoldingMinutes: parseFloat(avgHoldingMinutes.toFixed(0)),
                    dailyAvgPnL: parseFloat(dailyAvgPnL.toFixed(2)),
                    highestPnL: parseFloat(highestPnL.toFixed(2)),
                    lowestPnL: parseFloat(lowestPnL.toFixed(2)),
                    avgCharges: parseFloat(avgCharges.toFixed(2)),
                    todayCharges,
                    edgeScore,
                    edgeScoreMax: edgeChecklist.length,
                    sharpeRatio,
                    dailyCapitalDays: dailyReturns.length,
                },
                equityCurve,
                monthlyPnL,
                byInstrument,
                bySetup,
                byEmotion,
                byMistake,
                edgeChecklist,
            },
        });
    } catch (err) {
        console.error("GET /api/trade-journal/analytics:", err);
        return NextResponse.json({ success: false, error: "Failed to compute analytics" }, { status: 500 });
    }
}

function emptyAnalytics(charges?: { avgCharges?: number; todayCharges?: number }) {
    return {
        summary: {
            total: 0, wins: 0, losses: 0, breakeven: 0,
            winRate: 0, lossRate: 0, beRate: 0,
            netPnL: 0, grossWin: 0, grossLoss: 0,
            avgWin: 0, avgLoss: 0, expectancy: 0, profitFactor: 0,
            maxDrawdownPct: 0, maxConsecLosses: 0,
            avgActualRR: 0, planAdherenceAvg: 0, avgHoldingMinutes: 0,
            dailyAvgPnL: 0, highestPnL: 0, lowestPnL: 0,
            avgCharges: charges?.avgCharges ?? 0, todayCharges: charges?.todayCharges ?? 0,
            sharpeRatio: 0, dailyCapitalDays: 0,
            edgeScore: 0, edgeScoreMax: 8,
        },
        equityCurve: [],
        monthlyPnL: [],
        byInstrument: [],
        bySetup: [],
        byEmotion: [],
        byMistake: [],
        edgeChecklist: [
            { rule: "Win Rate ≥ 50%", pass: false },
            { rule: "Profit Factor ≥ 1.5", pass: false },
            { rule: "Expectancy > 0", pass: false },
            { rule: "Avg Win ≥ Avg Loss", pass: false },
            { rule: "Max Drawdown < 20%", pass: false },
            { rule: "Max Consec. Losses ≤ 5", pass: false },
            { rule: "Avg Actual RR ≥ 1", pass: false },
            { rule: "Plan Adherence ≥ 70%", pass: false },
        ],
    };
}
