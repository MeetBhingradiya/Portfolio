/**
 * Trade Journal — Daily Capital Log
 * Dedicated page for logging starting and ending portfolio value each day.
 * These entries power the Sharpe Ratio calculation in Analytics.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    ArrowBack,
    AddCircleOutline,
    ShowChart,
    Delete,
} from "@mui/icons-material";

interface DailyCapitalEntry {
    Date:             string;
    StartingCapital:  number;
    EndingCapital:    number;
    NetPnL:           number;
    DailyReturn:      number;
    Notes?:           string;
}

export default function DailyCapitalPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const surfaceBg   = isApple
        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: "8px 12px",
        color: palette.textPrimary,
        fontSize: 14,
        outline: "none",
        width: "100%",
    };

    const today = new Date().toISOString().slice(0, 10);
    const [dcDate,     setDcDate]     = useState(today);
    const [dcStart,    setDcStart]    = useState("");
    const [dcEnd,      setDcEnd]      = useState("");
    const [dcNotes,    setDcNotes]    = useState("");
    const [dcSaving,   setDcSaving]   = useState(false);
    const [dcSaved,    setDcSaved]    = useState(false);
    const [dcEntries,  setDcEntries]  = useState<DailyCapitalEntry[]>([]);
    const [dcDeleting, setDcDeleting] = useState<string | null>(null);
    const [loading,    setLoading]    = useState(true);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/trade-journal/daily-capital?limit=365").then(r => r.json());
            if (res.success) setDcEntries(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const handleLog = async () => {
        if (!dcDate || !dcStart || !dcEnd) return;
        setDcSaving(true);
        try {
            await fetch("/api/trade-journal/daily-capital", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Date: dcDate,
                    StartingCapital: parseFloat(dcStart),
                    EndingCapital:   parseFloat(dcEnd),
                    Notes: dcNotes,
                }),
            });
            setDcSaved(true);
            setDcStart(""); setDcEnd(""); setDcNotes("");
            setTimeout(() => setDcSaved(false), 2000);
            fetchEntries();
        } finally {
            setDcSaving(false);
        }
    };

    const handleDelete = async (date: string) => {
        setDcDeleting(date);
        await fetch(`/api/trade-journal/daily-capital?date=${date}`, { method: "DELETE" });
        setDcDeleting(null);
        fetchEntries();
    };

    const dailyReturn = dcStart && dcEnd && parseFloat(dcStart) > 0
        ? ((parseFloat(dcEnd) - parseFloat(dcStart)) / parseFloat(dcStart)) * 100
        : null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-28 px-4 sm:px-6">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3">
                <Link href="/trade-journal/analytics">
                    <motion.button
                        className="p-2 rounded-xl"
                        style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                        <ArrowBack fontSize="small" style={{ color: palette.textSecondary }} />
                    </motion.button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Daily Capital Log</h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Log your portfolio value each day to track Sharpe Ratio in Analytics.
                    </p>
                </div>
            </motion.div>

            {/* Sharpe formula note */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="p-4 rounded-2xl flex items-start gap-3"
                style={{ background: `${palette.accent}12`, border: `1px solid ${palette.accent}30` }}>
                <ShowChart style={{ color: palette.accent, fontSize: 22, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: palette.textSecondary }}>
                    <span className="font-semibold" style={{ color: palette.textPrimary }}>How it works: </span>
                    Sharpe = (avgDailyReturn − 6%/252) ÷ stdDev × √252
                    &nbsp;·&nbsp; requires ≥ 2 days of data.
                </p>
            </motion.div>

            {/* Entry form */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                <p className="font-bold mb-4 text-sm" style={{ color: palette.textPrimary }}>Add / Update Entry</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {([
                        { label: "Date",                  type: "date",   val: dcDate,   set: setDcDate   },
                        { label: "Starting Capital (₹)",  type: "number", val: dcStart,  set: setDcStart  },
                        { label: "Ending Capital (₹)",    type: "number", val: dcEnd,    set: setDcEnd    },
                        { label: "Notes (optional)",       type: "text",   val: dcNotes,  set: setDcNotes  },
                    ] as const).map(({ label, type, val, set }) => (
                        <div key={label} className="flex flex-col gap-1">
                            <label className="text-xs font-medium" style={{ color: palette.textSecondary }}>{label}</label>
                            <input
                                type={type}
                                value={val}
                                onChange={e => (set as (v: string) => void)(e.target.value)}
                                style={inputStyle}
                                step={type === "number" ? "0.01" : undefined}
                                placeholder={type === "number" ? "e.g. 200000" : ""}
                            />
                        </div>
                    ))}
                </div>

                {dailyReturn !== null && (
                    <p className="text-xs mb-4" style={{ color: palette.textSecondary }}>
                        Daily Return:&nbsp;
                        <span style={{ color: dailyReturn >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                            {dailyReturn >= 0 ? "+" : ""}{dailyReturn.toFixed(3)}%
                        </span>
                        &nbsp;· Net P&L: ₹{(parseFloat(dcEnd) - parseFloat(dcStart)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                )}

                <motion.button
                    onClick={handleLog}
                    disabled={dcSaving || !dcDate || !dcStart || !dcEnd}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                        background: dcSaved ? "#22c55e" : palette.accent,
                        color: "#fff",
                        opacity: (!dcDate || !dcStart || !dcEnd) ? 0.5 : 1,
                    }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                    <AddCircleOutline fontSize="small" />
                    {dcSaving ? "Saving…" : dcSaved ? "Saved ✓" : "Log Capital"}
                </motion.button>
            </motion.div>

            {/* History table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="p-5 rounded-2xl" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                <p className="font-bold mb-4 text-sm" style={{ color: palette.textPrimary }}>History</p>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 rounded-full border-2 animate-spin"
                            style={{ borderColor: `${palette.accent}40`, borderTopColor: palette.accent }} />
                    </div>
                ) : dcEntries.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: palette.textSecondary }}>
                        No entries yet. Log your first day above.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ color: palette.textTertiary, borderBottom: `1px solid ${borderColor}` }}>
                                    {["Date", "Start (₹)", "End (₹)", "Net P&L", "Return %", "Notes", ""].map(h => (
                                        <td key={h} className="pb-2 pr-3 font-semibold uppercase tracking-widest">{h}</td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dcEntries.map((e) => {
                                    const ret = (e.DailyReturn ?? 0) * 100;
                                    const pos  = ret >= 0;
                                    return (
                                        <tr key={e.Date} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                            <td className="py-2 pr-3 tabular-nums" style={{ color: palette.textPrimary }}>{e.Date}</td>
                                            <td className="py-2 pr-3 tabular-nums" style={{ color: palette.textSecondary }}>
                                                {e.StartingCapital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-2 pr-3 tabular-nums" style={{ color: palette.textSecondary }}>
                                                {e.EndingCapital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-2 pr-3 tabular-nums font-semibold" style={{ color: pos ? "#22c55e" : "#ef4444" }}>
                                                {pos ? "+" : ""}₹{Math.abs(e.NetPnL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-2 pr-3 tabular-nums font-semibold" style={{ color: pos ? "#22c55e" : "#ef4444" }}>
                                                {pos ? "+" : ""}{ret.toFixed(3)}%
                                            </td>
                                            <td className="py-2 pr-3 max-w-[120px] truncate" style={{ color: palette.textSecondary }}>
                                                {e.Notes || "—"}
                                            </td>
                                            <td className="py-2">
                                                <motion.button
                                                    onClick={() => handleDelete(e.Date)}
                                                    disabled={dcDeleting === e.Date}
                                                    style={{ color: "#ef4444", opacity: dcDeleting === e.Date ? 0.4 : 1 }}
                                                    whileHover={{ scale: 1.1 }}
                                                    title="Delete"
                                                >
                                                    <Delete fontSize="small" />
                                                </motion.button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
