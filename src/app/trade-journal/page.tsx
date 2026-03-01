/**
 * Trade Journal — Dashboard / List Page
 * Shows summary stats + paginated trade list with filter controls.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    AddCircleOutline,
    TrendingUp,
    TrendingDown,
    Remove,
    Search,
    FilterList,
    Delete,
    Visibility,
    NavigateBefore,
    NavigateNext,
} from "@mui/icons-material";

interface Trade {
    TradeID: string;
    Date: string;
    Instrument: string;
    Segment: string;
    Direction: string;
    EntryPrice: number;
    ExitPrice?: number;
    Quantity: number;
    NetPnL?: number;
    Result?: string;
    SetupType?: string;
    IsOpen: boolean;
}

interface Summary {
    total: number;
    wins: number;
    losses: number;
    netPnl: number;
    winRate: number;
}

const RESULTS = ["ALL", "WIN", "LOSS", "BREAKEVEN", "OPEN"];
const SEGMENTS = ["ALL", "EQUITY", "FUTURES", "OPTIONS", "CRYPTO", "FOREX", "COMMODITY"];

export default function TradeJournalPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [trades,  setTrades]  = useState<Trade[]>([]);
    const [summary, setSummary] = useState<Summary>({ total: 0, wins: 0, losses: 0, netPnl: 0, winRate: 0 });
    const [loading, setLoading] = useState(true);
    const [page,    setPage]    = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search,  setSearch]  = useState("");
    const [result,  setResult]  = useState("ALL");
    const [segment, setSegment] = useState("ALL");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const surfaceBg = isApple
        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const fetchTrades = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (search)           params.set("search", search);
        if (result  !== "ALL") params.set("result", result);
        if (segment !== "ALL") params.set("segment", segment);

        const res  = await fetch(`/api/trade-journal?${params}`).then(r => r.json());
        if (res.success) {
            setTrades(res.data);
            setTotalPages(res.totalPages ?? 1);
            setSummary({
                total:   res.total   ?? 0,
                wins:    res.wins    ?? 0,
                losses:  res.losses  ?? 0,
                netPnl:  res.netPnL  ?? 0,
                winRate: res.winRate ?? 0,
            });
        }
        setLoading(false);
    }, [page, search, result, segment]);

    useEffect(() => { fetchTrades(); }, [fetchTrades]);

    // Reset to page 1 on filter change
    useEffect(() => { setPage(1); }, [search, result, segment]);

    async function deleteTrade(id: string) {
        if (!confirm("Delete this trade? This cannot be undone.")) return;
        setDeletingId(id);
        await fetch(`/api/trade-journal/${id}`, { method: "DELETE" });
        setDeletingId(null);
        fetchTrades();
    }

    const resultColor = (r?: string) => {
        if (r === "WIN")  return "#22c55e";
        if (r === "LOSS") return "#ef4444";
        if (r === "BREAKEVEN") return palette.textSecondary;
        return palette.accent;
    };

    const pnlFmt = (n?: number) =>
        n == null ? "—" : `${n >= 0 ? "+" : ""}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

    const statCards = [
        { label: "Total Trades", value: summary.total,                         icon: <FilterList />, color: palette.accent },
        { label: "Win Rate",     value: `${summary.winRate.toFixed(1)}%`,       icon: <TrendingUp />, color: "#22c55e" },
        { label: "Net P&L",
          value: pnlFmt(summary.netPnl),
          icon: summary.netPnl >= 0 ? <TrendingUp /> : <TrendingDown />,
          color: summary.netPnl >= 0 ? "#22c55e" : "#ef4444" },
        { label: "W / L",        value: `${summary.wins} / ${summary.losses}`,  icon: <Remove />,     color: "#f59e0b" },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>
                        Trade Journal
                    </h1>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                        Track every trade, build your edge.
                    </p>
                </div>
                <Link href="/trade-journal/new">
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
                        style={{ background: palette.accent, color: "#fff" }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <AddCircleOutline fontSize="small" />
                        Log Trade
                    </motion.button>
                </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map(card => (
                    <motion.div
                        key={card.label}
                        className="p-4 rounded-2xl"
                        style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span style={{ color: card.color, fontSize: 18 }}>{card.icon}</span>
                            <p className="text-xs" style={{ color: palette.textSecondary }}>{card.label}</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: card.color }}>
                            {card.value}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[180px]"
                    style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                    <Search fontSize="small" style={{ color: palette.textTertiary }} />
                    <input
                        type="text"
                        placeholder="Search instrument…"
                        className="bg-transparent outline-none flex-1 text-sm"
                        style={{ color: palette.textPrimary }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: surfaceBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                    value={result}
                    onChange={e => setResult(e.target.value)}
                >
                    {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                    className="px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: surfaceBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                    value={segment}
                    onChange={e => setSegment(e.target.value)}
                >
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Trade list */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_80px_100px_80px_100px] px-4 py-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ background: `${palette.accent}10`, color: palette.textTertiary }}>
                    <span>Date</span>
                    <span>Instrument / Segment</span>
                    <span>Dir</span>
                    <span>Qty</span>
                    <span>Entry / Exit</span>
                    <span>Result</span>
                    <span className="text-right">Net P&L</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16" style={{ color: palette.textSecondary }}>
                        Loading trades…
                    </div>
                ) : trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <p style={{ color: palette.textSecondary }}>No trades found.</p>
                        <Link href="/trade-journal/new">
                            <motion.button
                                className="px-4 py-2 rounded-xl text-sm font-semibold"
                                style={{ background: palette.accent, color: "#fff" }}
                                whileHover={{ scale: 1.04 }}
                            >
                                Log Your First Trade
                            </motion.button>
                        </Link>
                    </div>
                ) : (
                    trades.map((t, idx) => (
                        <motion.div
                            key={t.TradeID}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_80px_100px_80px_100px] items-center px-4 py-3 gap-2"
                            style={{
                                background: idx % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)"),
                                borderTop: `1px solid ${borderColor}`,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <span className="text-sm font-medium" style={{ color: palette.textPrimary }}>{t.Date}</span>
                            <div>
                                <span className="font-semibold text-sm" style={{ color: palette.textPrimary }}>{t.Instrument}</span>
                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md" style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                    {t.Segment}
                                </span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: t.Direction === "LONG" ? "#22c55e" : "#ef4444" }}>
                                {t.Direction}
                            </span>
                            <span className="text-sm" style={{ color: palette.textSecondary }}>{t.Quantity}</span>
                            <div className="text-xs" style={{ color: palette.textSecondary }}>
                                <div>E: ₹{t.EntryPrice}</div>
                                {t.ExitPrice && <div>X: ₹{t.ExitPrice}</div>}
                            </div>
                            <span className="text-xs font-bold" style={{ color: resultColor(t.Result) }}>
                                {t.IsOpen ? "OPEN" : (t.Result ?? "—")}
                            </span>
                            <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                                <span className="text-sm font-bold" style={{ color: resultColor(t.Result) }}>
                                    {pnlFmt(t.NetPnL)}
                                </span>
                                <div className="flex gap-1">
                                    <Link href={`/trade-journal/${t.TradeID}`}>
                                        <motion.button
                                            className="p-1 rounded-lg"
                                            style={{ color: palette.accent }}
                                            whileHover={{ scale: 1.1 }}
                                            title="View / Edit"
                                        >
                                            <Visibility fontSize="small" />
                                        </motion.button>
                                    </Link>
                                    <motion.button
                                        className="p-1 rounded-lg"
                                        style={{ color: "#ef4444", opacity: deletingId === t.TradeID ? 0.5 : 1 }}
                                        whileHover={{ scale: 1.1 }}
                                        onClick={() => deleteTrade(t.TradeID)}
                                        disabled={deletingId === t.TradeID}
                                        title="Delete"
                                    >
                                        <Delete fontSize="small" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-5">
                    <motion.button
                        className="p-2 rounded-xl"
                        style={{ background: surfaceBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <NavigateBefore />
                    </motion.button>
                    <span className="text-sm" style={{ color: palette.textSecondary }}>
                        Page {page} of {totalPages}
                    </span>
                    <motion.button
                        className="p-2 rounded-xl"
                        style={{ background: surfaceBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <NavigateNext />
                    </motion.button>
                </div>
            )}
        </div>
    );
}
