/**
 * Wallet Analytics Dashboard
 * Spending by category, monthly breakdown, summary stats, asset overview.
 * Uses LiquidGlass/OneUI theme components.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import { TrendingUp, TrendingDown, Refresh, BarChart, AccountBalanceWallet, Receipt } from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
    totalCredit: number;
    totalDebit: number;
    totalTransfer: number;
    netFlow: number;
    count: number;
    avgTransaction: number;
    maxTransaction: number;
    totalBalance: number;
    assetCount: number;
}

interface CategoryRow {
    category: string;
    total: number;
    count: number;
}

interface MonthlyRow {
    month: string;
    income: number;
    expense: number;
    net: number;
}

interface AnalyticsData {
    summary: Summary;
    byCategory: CategoryRow[];
    monthly: MonthlyRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, dp = 2) =>
    n.toLocaleString("en-IN", {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp
    });

const CATEGORY_EMOJI: Record<string, string> = {
    FOOD: "🍽️",
    TRANSPORT: "🚗",
    SHOPPING: "🛍️",
    ENTERTAINMENT: "🎬",
    BILLS: "📄",
    HEALTH: "🏥",
    EDUCATION: "📚",
    RENT: "🏠",
    SALARY: "💰",
    FREELANCE: "💻",
    INVESTMENT: "📈",
    GIFT: "🎁",
    RECHARGE: "📱",
    SUBSCRIPTION: "📺",
    TRAVEL: "✈️",
    GROCERIES: "🛒",
    DONATION: "❤️",
    LOAN: "🏦",
    REFUND: "↩️",
    OTHER: "📌"
};

// ─── Bar Row Component ────────────────────────────────────────────────────────

function BarRow({
    label,
    value,
    maxValue,
    color,
    emoji,
    isDark
}: {
    label: string;
    value: number;
    maxValue: number;
    color: string;
    emoji?: string;
    isDark: boolean;
}) {
    const width = maxValue > 0 ? `${(Math.abs(value) / maxValue) * 100}%` : "0%";
    return (
        <div className="flex items-center gap-4 py-2 hover:bg-black/5 hover:dark:bg-white/5 px-2 rounded-xl transition-colors">
            <span
                className="text-sm font-semibold w-32 truncate shrink-0 flex items-center gap-2"
                style={{
                    color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"
                }}>
                {emoji && <span className="text-lg bg-black/5 dark:bg-white/5 p-1 rounded-md">{emoji}</span>}
                {label.replace(/_/g, " ")}
            </span>
            <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{
                    background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"
                }}>
                <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ background: color }}
                />
            </div>
            <span
                className="text-sm font-bold w-24 text-right tabular-nums tracking-wide"
                style={{ color }}>
                ₹{fmt(value)}
            </span>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    valueColor,
    icon,
    textPrimary,
    textSecondary,
    isApple
}: {
    label: string;
    value: string;
    sub?: string;
    valueColor?: string;
    icon?: React.ReactNode;
    textPrimary: string;
    textSecondary: string;
    isApple: boolean;
}) {
    const content = (
        <div className="flex flex-col gap-1 justify-center h-full p-1">
            <div className="flex items-center gap-2 mb-2">
                {icon && (
                    <div
                        className="p-1.5 rounded-full"
                        style={{
                            background: `${valueColor}15`,
                            color: valueColor
                        }}>
                        {icon}
                    </div>
                )}
                <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: textSecondary }}>
                    {label}
                </span>
            </div>
            <p
                className="text-3xl font-extrabold tabular-nums tracking-tight"
                style={{ color: valueColor ?? textPrimary }}>
                {value}
            </p>
            {sub && (
                <p
                    className="text-xs font-medium mt-1"
                    style={{ color: textSecondary }}>
                    {sub}
                </p>
            )}
        </div>
    );

    return isApple ? (
        <LiquidGlassCard
            intensity="subtle"
            className="p-5 h-[140px] transition-transform hover:-translate-y-1">
            {content}
        </LiquidGlassCard>
    ) : (
        <div
            style={{
                borderBottom: `3px solid ${valueColor || "transparent"}`
            }}>
            <OneUICard className="p-5 h-[140px] transition-transform hover:-translate-y-1">{content}</OneUICard>
        </div>
    );
}

// ─── Period Options ───────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
    { label: "All Time", value: "all" },
    { label: "This Month", value: "month" },
    { label: "Last 30d", value: "30d" },
    { label: "Last 90d", value: "90d" },
    { label: "This Year", value: "year" }
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WalletAnalyticsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("all");

    const surfaceBg = isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const now = new Date();
            if (period === "month") {
                const from = new Date(now.getFullYear(), now.getMonth(), 1);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            } else if (period === "30d") {
                const from = new Date(now);
                from.setDate(now.getDate() - 30);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            } else if (period === "90d") {
                const from = new Date(now);
                from.setDate(now.getDate() - 90);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            } else if (period === "year") {
                const from = new Date(now.getFullYear(), 0, 1);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            }
            const res = await fetch(`/api/wallet/analytics?${params}`).then((r) => r.json());
            if (res.success) setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const s = data?.summary;

    const statCards = s
        ? [
              {
                  label: "Net Worth",
                  value: `₹${fmt(s.totalBalance)}`,
                  sub: `${s.assetCount} Active Assets`,
                  valueColor: s.totalBalance >= 0 ? palette.accent : "#ef4444",
                  icon: <AccountBalanceWallet fontSize="small" />
              },
              {
                  label: "Income",
                  value: `₹${fmt(s.totalCredit)}`,
                  sub: `Cashflow: ${s.netFlow >= 0 ? "+" : ""}₹${fmt(s.netFlow)}`,
                  valueColor: "#22c55e",
                  icon: <TrendingUp fontSize="small" />
              },
              {
                  label: "Expenses",
                  value: `₹${fmt(s.totalDebit)}`,
                  sub: `${s.count} Total Transactions`,
                  valueColor: "#ef4444",
                  icon: <TrendingDown fontSize="small" />
              },
              {
                  label: "Avg Value",
                  value: `₹${fmt(s.avgTransaction)}`,
                  sub: `Max TXN: ₹${fmt(s.maxTransaction)}`,
                  valueColor: palette.textPrimary,
                  icon: <Receipt fontSize="small" />
              }
          ]
        : [];

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6 pb-28">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-3xl font-bold"
                        style={{ color: palette.textPrimary }}>
                        Analytics & Insights
                    </h1>
                    <p
                        className="text-sm mt-1"
                        style={{ color: palette.textSecondary }}>
                        Visualize your spending patterns and financial health.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div
                        className="flex rounded-xl overflow-hidden shadow-sm"
                        style={{
                            background: isApple ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)") : "transparent",
                            border: isApple ? "none" : `1px solid ${borderColor}`
                        }}>
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
                                style={{
                                    background: period === opt.value ? palette.accent : "transparent",
                                    color: period === opt.value ? palette.textOnAccent || "#fff" : palette.textSecondary,
                                    borderRight: isApple ? "none" : `1px solid ${borderColor}`
                                }}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <motion.button
                        onClick={fetchAnalytics}
                        className="p-2.5 rounded-xl shadow-sm"
                        style={{
                            background: palette.accent,
                            color: palette.textOnAccent || "#fff"
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ rotate: 180 }}>
                        <Refresh fontSize="small" />
                    </motion.button>
                </div>
            </motion.div>

            <AnimatePresence mode="popLayout">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                        <div
                            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                            style={{
                                borderColor: `${palette.accent}40`,
                                borderTopColor: palette.accent
                            }}
                        />
                        <p
                            className="text-sm font-semibold tracking-widest uppercase"
                            style={{ color: palette.textSecondary }}>
                            Analyzing Data...
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6">
                        {/* Summary Cards */}
                        {s && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {statCards.map((c, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}>
                                        <StatCard
                                            {...c}
                                            textPrimary={palette.textPrimary}
                                            textSecondary={palette.textSecondary}
                                            isApple={isApple}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Spending by Category */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}>
                                {isApple ? (
                                    <LiquidGlassCard
                                        className="p-6 h-full"
                                        intensity="subtle">
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div
                                                    className="p-2 rounded-xl"
                                                    style={{
                                                        background: `${palette.accent}15`,
                                                        color: palette.accent
                                                    }}>
                                                    <BarChart fontSize="small" />
                                                </div>
                                                <p
                                                    className="font-bold text-lg"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    Spending Trends
                                                </p>
                                            </div>
                                            <div className="space-y-1 pr-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {data && data.byCategory.length > 0 ? (
                                                    (() => {
                                                        const max = Math.max(...data.byCategory.map((r) => r.total));
                                                        return data.byCategory.map((r, i) => (
                                                            <BarRow
                                                                key={i}
                                                                label={r.category}
                                                                value={r.total}
                                                                maxValue={max}
                                                                color="#ef4444"
                                                                emoji={CATEGORY_EMOJI[r.category]}
                                                                isDark={isDark}
                                                            />
                                                        ));
                                                    })()
                                                ) : (
                                                    <p
                                                        className="text-sm text-center py-10 font-medium"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        No spending documented.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    </LiquidGlassCard>
                                ) : (
                                    <OneUICard className="p-6 h-full">
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div
                                                    className="p-2 rounded-xl"
                                                    style={{
                                                        background: `${palette.accent}15`,
                                                        color: palette.accent
                                                    }}>
                                                    <BarChart fontSize="small" />
                                                </div>
                                                <p
                                                    className="font-bold text-lg"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    Spending Trends
                                                </p>
                                            </div>
                                            <div className="space-y-1 pr-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {data && data.byCategory.length > 0 ? (
                                                    (() => {
                                                        const max = Math.max(...data.byCategory.map((r) => r.total));
                                                        return data.byCategory.map((r, i) => (
                                                            <BarRow
                                                                key={i}
                                                                label={r.category}
                                                                value={r.total}
                                                                maxValue={max}
                                                                color="#ef4444"
                                                                emoji={CATEGORY_EMOJI[r.category]}
                                                                isDark={isDark}
                                                            />
                                                        ));
                                                    })()
                                                ) : (
                                                    <p
                                                        className="text-sm text-center py-10 font-medium"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        No spending documented.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    </OneUICard>
                                )}
                            </motion.div>

                            {/* Monthly Breakdown */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}>
                                {isApple ? (
                                    <LiquidGlassCard
                                        className="p-6 h-full"
                                        intensity="subtle">
                                        <>
                                            <p
                                                className="font-bold mb-6 text-lg"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                Monthly Breakdown
                                            </p>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                                {data && data.monthly.length > 0 ? (
                                                    data.monthly.map((m, i) => (
                                                        <div
                                                            key={i}
                                                            className="p-4 rounded-2xl hover:bg-black/5 hover:dark:bg-white/5 transition-colors border"
                                                            style={{
                                                                borderColor
                                                            }}>
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span
                                                                    className="text-sm font-bold tracking-wide"
                                                                    style={{
                                                                        color: palette.textPrimary
                                                                    }}>
                                                                    {m.month}
                                                                </span>
                                                                <span
                                                                    className="text-sm font-extrabold px-2 py-1 rounded-lg"
                                                                    style={{
                                                                        color: m.net >= 0 ? "#22c55e" : "#ef4444",
                                                                        background:
                                                                            m.net >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"
                                                                    }}>
                                                                    {m.net >= 0 ? "+" : ""}₹{fmt(m.net)}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="flex justify-between text-xs font-bold tracking-wider uppercase mb-1.5"
                                                                style={{
                                                                    color: palette.textSecondary
                                                                }}>
                                                                <span className="text-green-500">In ₹{fmt(m.income, 0)}</span>
                                                                <span className="text-red-500">Out ₹{fmt(m.expense, 0)}</span>
                                                            </div>
                                                            {/* Visual bar */}
                                                            <div
                                                                className="flex mt-1 h-3 rounded-full overflow-hidden"
                                                                style={{
                                                                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                                                                }}>
                                                                {m.income > 0 && (
                                                                    <motion.div
                                                                        className="h-full"
                                                                        initial={{
                                                                            width: 0
                                                                        }}
                                                                        animate={{
                                                                            width: `${(m.income / (m.income + m.expense)) * 100}%`
                                                                        }}
                                                                        transition={{
                                                                            duration: 1,
                                                                            ease: "easeOut"
                                                                        }}
                                                                        style={{
                                                                            background: "#22c55e",
                                                                            borderRight: "2px solid rgba(0,0,0,0.2)"
                                                                        }}
                                                                    />
                                                                )}
                                                                {m.expense > 0 && (
                                                                    <motion.div
                                                                        className="h-full"
                                                                        initial={{
                                                                            width: 0
                                                                        }}
                                                                        animate={{
                                                                            width: `${(m.expense / (m.income + m.expense)) * 100}%`
                                                                        }}
                                                                        transition={{
                                                                            duration: 1,
                                                                            ease: "easeOut"
                                                                        }}
                                                                        style={{
                                                                            background: "#ef4444"
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p
                                                        className="text-sm text-center py-10 font-medium"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        No monthly data yet.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    </LiquidGlassCard>
                                ) : (
                                    <OneUICard className="p-6 h-full">
                                        <>
                                            <p
                                                className="font-bold mb-6 text-lg"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                Monthly Breakdown
                                            </p>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                                {data && data.monthly.length > 0 ? (
                                                    data.monthly.map((m, i) => (
                                                        <div
                                                            key={i}
                                                            className="p-4 rounded-2xl hover:bg-black/5 hover:dark:bg-white/5 transition-colors border"
                                                            style={{
                                                                borderColor
                                                            }}>
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span
                                                                    className="text-sm font-bold tracking-wide"
                                                                    style={{
                                                                        color: palette.textPrimary
                                                                    }}>
                                                                    {m.month}
                                                                </span>
                                                                <span
                                                                    className="text-sm font-extrabold px-2 py-1 rounded-lg"
                                                                    style={{
                                                                        color: m.net >= 0 ? "#22c55e" : "#ef4444",
                                                                        background:
                                                                            m.net >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"
                                                                    }}>
                                                                    {m.net >= 0 ? "+" : ""}₹{fmt(m.net)}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="flex justify-between text-xs font-bold tracking-wider uppercase mb-1.5"
                                                                style={{
                                                                    color: palette.textSecondary
                                                                }}>
                                                                <span className="text-green-500">In ₹{fmt(m.income, 0)}</span>
                                                                <span className="text-red-500">Out ₹{fmt(m.expense, 0)}</span>
                                                            </div>
                                                            {/* Visual bar */}
                                                            <div
                                                                className="flex mt-1 h-3 rounded-full overflow-hidden"
                                                                style={{
                                                                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                                                                }}>
                                                                {m.income > 0 && (
                                                                    <motion.div
                                                                        className="h-full"
                                                                        initial={{
                                                                            width: 0
                                                                        }}
                                                                        animate={{
                                                                            width: `${(m.income / (m.income + m.expense)) * 100}%`
                                                                        }}
                                                                        transition={{
                                                                            duration: 1,
                                                                            ease: "easeOut"
                                                                        }}
                                                                        style={{
                                                                            background: "#22c55e",
                                                                            borderRight: "2px solid rgba(0,0,0,0.2)"
                                                                        }}
                                                                    />
                                                                )}
                                                                {m.expense > 0 && (
                                                                    <motion.div
                                                                        className="h-full"
                                                                        initial={{
                                                                            width: 0
                                                                        }}
                                                                        animate={{
                                                                            width: `${(m.expense / (m.income + m.expense)) * 100}%`
                                                                        }}
                                                                        transition={{
                                                                            duration: 1,
                                                                            ease: "easeOut"
                                                                        }}
                                                                        style={{
                                                                            background: "#ef4444"
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p
                                                        className="text-sm text-center py-10 font-medium"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        No monthly data yet.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    </OneUICard>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
