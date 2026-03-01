/**
 * Trade Journal — Analytics Dashboard
 * Full P&L analytics: equity curve, monthly breakdown, by-instrument,
 * by-setup, by-emotion, mistake analysis, and edge validation checklist.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import Link from "next/link";
import {
    ArrowBack,
    TrendingUp,
    TrendingDown,
    Refresh,
    Psychology,
    EmojiEvents,
    Warning,
    CheckCircle,
    Cancel,
    BarChart,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
    total: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    lossRate: number;
    beRate: number;
    netPnL: number;
    grossWin: number;
    grossLoss: number;
    avgWin: number;
    avgLoss: number;
    expectancy: number;
    profitFactor: number;
    maxDrawdownPct: number;
    maxConsecLosses: number;
    avgActualRR: number;
    planAdherenceAvg: number;
    avgHoldingMinutes: number;
    edgeScore: number;
    edgeScoreMax: number;
}

interface AnalyticsData {
    summary: Summary;
    equityCurve: { date: string; equity: number; tradeNo: number }[];
    monthlyPnL: { month: string; pnl: number }[];
    byInstrument: { instrument: string; trades: number; pnl: number; winRate: number }[];
    bySetup: { setup: string; trades: number; pnl: number; winRate: number }[];
    byEmotion: { emotion: string; trades: number; pnl: number; winRate: number }[];
    byMistake: { mistake: string; count: number }[];
    edgeChecklist: { rule: string; pass: boolean }[];
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const fmt = (n: number, dp = 2) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });

const pnlColor = (n: number, pos: string, neg: string, zero = "#9ca3af") =>
    n > 0 ? pos : n < 0 ? neg : zero;

// ─── Equity Curve SVG Sparkline ───────────────────────────────────────────────

function EquityCurve({
    data, accentColor, isDark,
}: {
    data: { tradeNo: number; equity: number }[];
    accentColor: string;
    isDark: boolean;
}) {
    if (!data.length) return (
        <p className="text-center py-10 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
            No closed trades yet.
        </p>
    );

    const W = 600; const H = 160; const PAD = 24;
    const values = data.map(d => d.equity);
    const minV   = Math.min(...values);
    const maxV   = Math.max(...values);
    const range  = maxV - minV || 1;
    const innerW = W - PAD * 2;
    const innerH = H - PAD * 2;

    const pts = values.map((v, i) => {
        const x = PAD + (i / (values.length - 1 || 1)) * innerW;
        const y = H - PAD - ((v - minV) / range) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const lastEquity = values[values.length - 1];
    const lineColor  = lastEquity >= 0 ? "#22c55e" : "#ef4444";
    const zeroY      = minV < 0 && maxV > 0
        ? H - PAD - ((0 - minV) / range) * innerH
        : null;

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
                {/* Zero line */}
                {zeroY !== null && (
                    <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY}
                        stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}
                        strokeDasharray="4" strokeWidth={1} />
                )}
                {/* Area fill */}
                <path
                    d={`M ${pts[0]} L ${pts.join(" L ")} L ${(PAD + innerW).toFixed(1)},${(H - PAD).toFixed(1)} L ${PAD},${(H - PAD).toFixed(1)} Z`}
                    fill={`${lineColor}18`}
                />
                {/* Line */}
                <polyline points={pts.join(" ")} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" />
                {/* Axis labels */}
                <text x={PAD} y={H - 4} fontSize={9} fill={isDark ? "#6b7280" : "#9ca3af"}>Trade 1</text>
                <text x={W - PAD} y={H - 4} fontSize={9} fill={isDark ? "#6b7280" : "#9ca3af"} textAnchor="end">
                    Trade {data.length}
                </text>
                <text x={PAD} y={PAD - 4} fontSize={9} fill={isDark ? "#6b7280" : "#9ca3af"}>₹{fmt(maxV)}</text>
                <text x={PAD} y={H - PAD + 12} fontSize={9} fill={isDark ? "#6b7280" : "#9ca3af"}>₹{fmt(minV)}</text>
            </svg>
        </div>
    );
}

// ─── Horizontal bar row ───────────────────────────────────────────────────────

function BarRow({
    label, value, maxValue, pnl, winRate, isDark,
}: {
    label: string; value: number; maxValue: number;
    pnl?: number; winRate?: number; isDark: boolean;
}) {
    const width = maxValue > 0 ? `${(Math.abs(value) / maxValue) * 100}%` : "0%";
    const barColor = (pnl ?? value) >= 0 ? "#22c55e" : "#ef4444";
    return (
        <div className="flex items-center gap-3 py-1.5">
            <span className="text-xs w-28 truncate shrink-0" style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)" }}>
                {label.replace(/_/g, " ")}
            </span>
            <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <div className="h-full rounded-lg transition-all duration-700" style={{ width, background: `${barColor}80` }} />
            </div>
            <div className="flex gap-3 items-center shrink-0">
                {pnl !== undefined && (
                    <span className="text-xs font-semibold w-20 text-right tabular-nums"
                        style={{ color: pnl >= 0 ? "#22c55e" : "#ef4444" }}>
                        ₹{fmt(pnl)}
                    </span>
                )}
                {winRate !== undefined && (
                    <span className="text-xs w-12 text-right tabular-nums"
                        style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                        {winRate}%
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({
    label, value, sub, valueColor, icon, surfaceBg, borderColor, textPrimary, textSecondary,
}: {
    label: string; value: string; sub?: string;
    valueColor?: string; icon?: React.ReactNode;
    surfaceBg: string; borderColor: string;
    textPrimary: string; textSecondary: string;
}) {
    return (
        <div className="p-4 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
            <div className="flex items-center gap-1.5 mb-2" style={{ color: textSecondary }}>
                {icon && <span className="text-sm">{icon}</span>}
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: valueColor ?? textPrimary }}>{value}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{sub}</p>}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
    { label: "All Time",    value: "all" },
    { label: "This Month",  value: "month" },
    { label: "Last 30d",    value: "30d" },
    { label: "Last 90d",    value: "90d" },
    { label: "This Year",   value: "year" },
];

export default function AnalyticsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [data,    setData]    = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period,  setPeriod]  = useState("all");

    const surfaceBg   = isApple
        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const borderColorStrong = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const now = new Date();
            if (period === "month") {
                const from = new Date(now.getFullYear(), now.getMonth(), 1);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to",   now.toISOString().slice(0, 10));
            } else if (period === "30d") {
                const from = new Date(now); from.setDate(now.getDate() - 30);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to",   now.toISOString().slice(0, 10));
            } else if (period === "90d") {
                const from = new Date(now); from.setDate(now.getDate() - 90);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to",   now.toISOString().slice(0, 10));
            } else if (period === "year") {
                const from = new Date(now.getFullYear(), 0, 1);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to",   now.toISOString().slice(0, 10));
            }
            const res  = await fetch(`/api/trade-journal/analytics?${params}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const s = data?.summary;

    const statCards = s ? [
        {
            label: "Net P&L",
            value: `₹${fmt(s.netPnL)}`,
            sub: `Gross Win ₹${fmt(s.grossWin)} · Loss ₹${fmt(s.grossLoss)}`,
            valueColor: pnlColor(s.netPnL, "#22c55e", "#ef4444"),
            icon: s.netPnL >= 0 ? <TrendingUp fontSize="inherit" /> : <TrendingDown fontSize="inherit" />,
        },
        {
            label: "Win Rate",
            value: `${s.winRate}%`,
            sub: `${s.wins}W  ${s.losses}L  ${s.breakeven}BE  (${s.total} total)`,
            valueColor: s.winRate >= 50 ? "#22c55e" : "#f59e0b",
            icon: <EmojiEvents fontSize="inherit" />,
        },
        {
            label: "Expectancy",
            value: `₹${fmt(s.expectancy)}`,
            sub: "Avg edge per trade",
            valueColor: pnlColor(s.expectancy, "#22c55e", "#ef4444"),
        },
        {
            label: "Profit Factor",
            value: s.profitFactor === 0 ? "—" : s.profitFactor.toFixed(2),
            sub: "Gross Win ÷ Gross Loss",
            valueColor: s.profitFactor >= 1.5 ? "#22c55e" : s.profitFactor >= 1 ? "#f59e0b" : "#ef4444",
        },
        {
            label: "Avg Win / Avg Loss",
            value: `${fmt(s.avgWin, 0)} / ${fmt(s.avgLoss, 0)}`,
            sub: `Ratio: ${s.avgLoss > 0 ? (s.avgWin / s.avgLoss).toFixed(2) : "—"}`,
            valueColor: palette.textPrimary,
        },
        {
            label: "Max Drawdown",
            value: `${s.maxDrawdownPct}%`,
            sub: "Peak-to-trough equity",
            valueColor: s.maxDrawdownPct < 20 ? "#f59e0b" : "#ef4444",
            icon: <TrendingDown fontSize="inherit" />,
        },
        {
            label: "Avg Actual RR",
            value: s.avgActualRR > 0 ? s.avgActualRR.toFixed(2) : "—",
            sub: "Realised risk-reward",
            valueColor: s.avgActualRR >= 1 ? "#22c55e" : "#f59e0b",
        },
        {
            label: "Max Consec. Losses",
            value: String(s.maxConsecLosses),
            sub: "Longest losing streak",
            valueColor: s.maxConsecLosses <= 5 ? "#f59e0b" : "#ef4444",
            icon: <Warning fontSize="inherit" />,
        },
        {
            label: "Plan Adherence",
            value: s.planAdherenceAvg > 0 ? `${s.planAdherenceAvg.toFixed(0)}%` : "—",
            sub: "Avg discipline score",
            valueColor: s.planAdherenceAvg >= 70 ? "#22c55e" : "#f59e0b",
        },
        {
            label: "Avg Holding",
            value: s.avgHoldingMinutes > 0
                ? s.avgHoldingMinutes >= 60
                    ? `${(s.avgHoldingMinutes / 60).toFixed(1)}h`
                    : `${s.avgHoldingMinutes}m`
                : "—",
            sub: "Avg trade duration",
            valueColor: palette.textPrimary,
        },
    ] : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 animate-spin"
                        style={{ borderColor: `${palette.accent}40`, borderTopColor: palette.accent }} />
                    <p className="text-sm" style={{ color: palette.textSecondary }}>Computing analytics…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/trade-journal">
                        <motion.button
                            className="p-2 rounded-xl"
                            style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        >
                            <ArrowBack fontSize="small" style={{ color: palette.textSecondary }} />
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Analytics</h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Trade your edge, not your emotions.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Period selector */}
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor }}>
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className="px-3 py-1.5 text-xs font-medium transition-colors"
                                style={{
                                    background: period === opt.value ? palette.accent : "transparent",
                                    color: period === opt.value ? "#fff" : palette.textSecondary,
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <motion.button
                        onClick={fetchAnalytics}
                        className="p-2 rounded-xl"
                        style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}
                        whileHover={{ scale: 1.05 }} whileTap={{ rotate: 180 }}
                        title="Refresh"
                    >
                        <Refresh fontSize="small" style={{ color: palette.textSecondary }} />
                    </motion.button>
                </div>
            </motion.div>

            {/* ── Edge Score Banner ─────────────────────────────────────────── */}
            {s && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                    className="p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4"
                    style={{
                        background: isApple
                            ? isDark ? "rgba(88,86,214,0.18)" : "rgba(88,86,214,0.10)"
                            : `${palette.accent}14`,
                        border: `1.5px solid ${palette.accent}40`,
                    }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl" style={{ background: `${palette.accent}20` }}>
                            <BarChart style={{ color: palette.accent, fontSize: 22 }} />
                        </div>
                        <div>
                            <p className="font-bold" style={{ color: palette.textPrimary }}>
                                Edge Score: {s.edgeScore} / {s.edgeScoreMax}
                            </p>
                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                {s.edgeScore >= 6 ? "Strong edge — consider live trading." :
                                 s.edgeScore >= 4 ? "Developing edge — keep improving." :
                                 "No proven edge — stay in simulation."}
                            </p>
                        </div>
                    </div>
                    {/* Score pill bar */}
                    <div className="flex gap-1.5">
                        {Array.from({ length: s.edgeScoreMax }).map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-lg transition-colors duration-500"
                                style={{ background: i < s.edgeScore ? palette.accent : `${palette.accent}25` }} />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ── Summary Cards ─────────────────────────────────────────────── */}
            {s && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {statCards.map((c, i) => (
                        <StatCard key={i} {...c} surfaceBg={surfaceBg} borderColor={borderColor}
                            textPrimary={palette.textPrimary} textSecondary={palette.textSecondary} />
                    ))}
                </motion.div>
            )}

            {/* ── Equity Curve ──────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                <p className="font-bold mb-3 text-sm" style={{ color: palette.textPrimary }}>Equity Curve</p>
                <EquityCurve
                    data={data?.equityCurve ?? []}
                    accentColor={palette.accent}
                    isDark={isDark}
                />
            </motion.div>

            {/* ── Monthly P&L + By Instrument ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                    <p className="font-bold mb-3 text-sm" style={{ color: palette.textPrimary }}>Monthly P&L</p>
                    {data && data.monthlyPnL.length > 0 ? (() => {
                        const max = Math.max(...data.monthlyPnL.map(r => Math.abs(r.pnl)));
                        return data.monthlyPnL.map((r, i) => (
                            <BarRow key={i} label={r.month} value={r.pnl} maxValue={max} pnl={r.pnl} isDark={isDark} />
                        ));
                    })() : (
                        <p className="text-xs text-center py-6" style={{ color: palette.textTertiary }}>No data yet.</p>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                    <p className="font-bold mb-3 text-sm" style={{ color: palette.textPrimary }}>By Instrument</p>
                    {data && data.byInstrument.length > 0 ? (() => {
                        const max = Math.max(...data.byInstrument.map(r => Math.abs(r.pnl)));
                        return data.byInstrument.slice(0, 10).map((r, i) => (
                            <BarRow key={i} label={r.instrument} value={r.pnl} maxValue={max} pnl={r.pnl} winRate={r.winRate} isDark={isDark} />
                        ));
                    })() : (
                        <p className="text-xs text-center py-6" style={{ color: palette.textTertiary }}>No data yet.</p>
                    )}
                </motion.div>
            </div>

            {/* ── By Setup + By Emotion ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                    className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                    <p className="font-bold mb-3 text-sm" style={{ color: palette.textPrimary }}>By Setup Type</p>
                    {data && data.bySetup.length > 0 ? (() => {
                        const max = Math.max(...data.bySetup.map(r => Math.abs(r.pnl)));
                        return data.bySetup.map((r, i) => (
                            <BarRow key={i} label={r.setup} value={r.pnl} maxValue={max} pnl={r.pnl} winRate={r.winRate} isDark={isDark} />
                        ));
                    })() : (
                        <p className="text-xs text-center py-6" style={{ color: palette.textTertiary }}>No setup data.</p>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                    className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Psychology fontSize="small" style={{ color: palette.accent }} />
                        <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>Emotional State vs P&L</p>
                    </div>
                    {data && data.byEmotion.length > 0 ? (() => {
                        const max = Math.max(...data.byEmotion.map(r => Math.abs(r.pnl)));
                        return data.byEmotion.map((r, i) => (
                            <BarRow key={i} label={r.emotion} value={r.pnl} maxValue={max} pnl={r.pnl} winRate={r.winRate} isDark={isDark} />
                        ));
                    })() : (
                        <p className="text-xs text-center py-6" style={{ color: palette.textTertiary }}>No emotion data.</p>
                    )}
                </motion.div>
            </div>

            {/* ── Mistake Analysis ──────────────────────────────────────────── */}
            {data && data.byMistake.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
                    className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                    <p className="font-bold mb-3 text-sm" style={{ color: palette.textPrimary }}>Mistake Frequency</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {data.byMistake.map((m, i) => (
                            <div key={i} className="p-3 rounded-xl flex items-center justify-between"
                                style={{ background: isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
                                <span className="text-xs" style={{ color: palette.textSecondary }}>
                                    {m.mistake.replace(/_/g, " ")}
                                </span>
                                <span className="text-sm font-bold" style={{ color: "#ef4444" }}>{m.count}×</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ── Edge Validation Checklist ─────────────────────────────────── */}
            {data && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                    className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1.5px solid ${borderColorStrong}` }}>
                    <div className="flex items-center gap-2 mb-4">
                        <EmojiEvents style={{ color: palette.accent }} />
                        <p className="font-bold" style={{ color: palette.textPrimary }}>
                            Edge Validation Checklist
                        </p>
                        <span className="ml-auto text-sm font-semibold"
                            style={{ color: palette.accent }}>
                            {s?.edgeScore} / {s?.edgeScoreMax} rules passing
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {data.edgeChecklist.map((item, i) => (
                            <div key={i}
                                className="flex items-center gap-2.5 p-3 rounded-xl"
                                style={{
                                    background: item.pass
                                        ? isDark ? "rgba(34,197,94,0.08)"  : "rgba(34,197,94,0.06)"
                                        : isDark ? "rgba(239,68,68,0.08)"  : "rgba(239,68,68,0.05)",
                                    border: `1px solid ${item.pass ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.18)"}`,
                                }}>
                                {item.pass
                                    ? <CheckCircle fontSize="small" style={{ color: "#22c55e", flexShrink: 0 }} />
                                    : <Cancel fontSize="small"       style={{ color: "#ef4444", flexShrink: 0 }} />
                                }
                                <span className="text-xs font-medium" style={{ color: palette.textPrimary }}>
                                    {item.rule}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Bottom guidance */}
                    {s && s.edgeScore < 4 && (
                        <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                            <Warning fontSize="small" style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                            <p className="text-xs" style={{ color: palette.textSecondary }}>
                                Your data does not yet prove a statistical edge. Log more trades (target 100+), review your
                                mistakes, and focus on improving plan adherence before trading real capital.
                            </p>
                        </div>
                    )}
                    {s && s.edgeScore >= 6 && (
                        <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
                            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
                            <CheckCircle fontSize="small" style={{ color: "#22c55e", flexShrink: 0, marginTop: 1 }} />
                            <p className="text-xs" style={{ color: palette.textSecondary }}>
                                Strong edge detected across {s.total} trades. Maintain discipline, manage position sizing,
                                and keep journalling to preserve this edge.
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
