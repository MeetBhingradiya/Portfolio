/**
 * Wallet Dashboard — Transaction List Page
 * Shows summary stats + paginated transaction list with modern toolbar controls.
 * Uses LiquidGlass (Apple) and OneUI (Samsung) components based on theme.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard, LiquidGlassButton } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIButton, OneUIBadge } from "@Components/Atoms/OneUI";
import {
    TransactionToolbar,
    type ToolbarFilters,
    type ToolbarSort,
    type ToolbarColumnVisibility
} from "@Components/Atoms/TransactionToolbar";
import {
    AddCircleOutline,
    TrendingUp,
    TrendingDown,
    FilterList,
    Delete,
    Edit,
    AccountBalanceWallet,
    SwapHoriz,
    ArrowDownward,
    ArrowUpward,
    NavigateBefore,
    NavigateNext,
    PersonOutline
} from "@mui/icons-material";

interface Transaction {
    TransactionID: string;
    Note: string;
    Amount: number;
    Currency: string;
    Type: string;
    Category: string;
    FromAssetID?: string;
    ToAssetID?: string;
    Date: string;
    IsHidden?: boolean;
    IsWalletTransfer?: boolean;
    ContactID?: string;
    ContactName?: string | null;
}

interface Summary {
    totalCredit: number;
    totalDebit: number;
    totalTransfer: number;
    netFlow: number;
    count: number;
}

const STORAGE_KEY_COLS = "wallet-dashboard-col-visibility";

function loadColumnVisibility(): ToolbarColumnVisibility {
    if (typeof window === "undefined") return defaultCols();
    try {
        const stored = localStorage.getItem(STORAGE_KEY_COLS);
        if (stored) return JSON.parse(stored);
    } catch {}
    return defaultCols();
}

function defaultCols(): ToolbarColumnVisibility {
    return { date: true, note: true, amount: true, type: true, category: true, contact: true };
}

export default function WalletDashboard() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalCredit: 0,
        totalDebit: 0,
        totalTransfer: 0,
        netFlow: 0,
        count: 0
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Toolbar state
    const [filters, setFilters] = useState<ToolbarFilters>({
        search: "",
        type: "ALL",
        category: "ALL",
        from: "",
        to: ""
    });
    const [sort, setSort] = useState<ToolbarSort>({ sortBy: "date", sortDir: "desc" });
    const [columnVisibility, setColumnVisibility] = useState<ToolbarColumnVisibility>(defaultCols());

    // Load persisted column visibility on mount
    useEffect(() => {
        setColumnVisibility(loadColumnVisibility());
    }, []);

    // Persist column visibility changes
    const handleColumnVisibilityChange = useCallback((cols: ToolbarColumnVisibility) => {
        setColumnVisibility(cols);
        try { localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(cols)); } catch {}
    }, []);

    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (filters.search) params.set("search", filters.search);
        if (filters.type !== "ALL") params.set("type", filters.type);
        if (filters.category !== "ALL") params.set("category", filters.category);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        params.set("sortBy", sort.sortBy);
        params.set("sortDir", sort.sortDir);
        params.set("t", Date.now().toString());
        const res = await fetch(`/api/wallet?${params}`, {
            cache: "no-store"
        }).then((r) => r.json());
        if (res.success) {
            setTransactions(res.data.transactions ?? []);
            const pg = res.data.pagination ?? {};
            const sm = res.data.summary ?? {};
            setTotalPages(pg.totalPages ?? 1);
            setSummary({
                totalCredit: sm.totalCredit ?? 0,
                totalDebit: sm.totalDebit ?? 0,
                totalTransfer: sm.totalTransfer ?? 0,
                netFlow: sm.netFlow ?? 0,
                count: sm.count ?? 0
            });
        }
        setLoading(false);
    }, [page, filters, sort]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);
    useEffect(() => {
        setPage(1);
    }, [filters, sort]);

    async function deleteTransaction(id: string) {
        if (!confirm("Delete this transaction? This cannot be undone.")) return;
        setDeletingId(id);
        await fetch(`/api/wallet/${id}`, { method: "DELETE" });
        setDeletingId(null);
        fetchTransactions();
    }

    const typeColor = (t: string) => {
        if (t === "CREDIT") return "#22c55e";
        if (t === "DEBIT") return "#ef4444";
        if (t === "TRANSFER") return "#3b82f6";
        return palette.textSecondary;
    };

    const typeIcon = (t: string) => {
        if (t === "CREDIT") return <ArrowDownward style={{ fontSize: 16 }} />;
        if (t === "DEBIT") return <ArrowUpward style={{ fontSize: 16 }} />;
        if (t === "TRANSFER") return <SwapHoriz style={{ fontSize: 16 }} />;
        return null;
    };

    const amtFmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

    const statCards = [
        {
            label: "Total TXNs",
            value: summary.count,
            icon: <FilterList />,
            color: palette.accent
        },
        {
            label: "Total Income",
            value: amtFmt(summary.totalCredit),
            icon: <TrendingUp />,
            color: "#22c55e"
        },
        {
            label: "Total Expenses",
            value: amtFmt(summary.totalDebit),
            icon: <TrendingDown />,
            color: "#ef4444"
        },
        {
            label: "Net Cash Flow",
            value: `${summary.netFlow >= 0 ? "+" : "−"}${amtFmt(summary.netFlow)}`,
            icon: summary.netFlow >= 0 ? <TrendingUp /> : <TrendingDown />,
            color: summary.netFlow >= 0 ? "#22c55e" : "#ef4444"
        }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-3xl font-bold"
                        style={{ color: palette.textPrimary }}>
                        Income Expense Manager
                    </h1>
                    <p
                        className="text-sm mt-1"
                        style={{ color: palette.textSecondary }}>
                        Track every rupee, master your finances with advanced analytics.
                    </p>
                </div>
                <Link href="/wallet/new">
                    {isApple ? (
                        <LiquidGlassButton className="flex items-center gap-2 px-5 py-2.5">
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}>
                                <AddCircleOutline fontSize="small" />
                                <span className="font-semibold text-sm tracking-wide">Add Transaction</span>
                            </span>
                        </LiquidGlassButton>
                    ) : (
                        <OneUIButton
                            variant="primary"
                            className="flex items-center gap-2 px-5 py-2.5">
                            <AddCircleOutline fontSize="small" />
                            <span className="font-semibold text-sm">Add Transaction</span>
                        </OneUIButton>
                    )}
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, idx) => {
                    const content = (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="p-1.5 rounded-full"
                                    style={{
                                        background: `${card.color}15`,
                                        color: card.color
                                    }}>
                                    {React.cloneElement(card.icon as React.ReactElement<any>, { fontSize: "small" })}
                                </div>
                                <span
                                    className="text-xs font-medium uppercase tracking-wider"
                                    style={{ color: palette.textSecondary }}>
                                    {card.label}
                                </span>
                            </div>
                            <h3
                                className="text-2xl font-bold"
                                style={{ color: palette.textPrimary }}>
                                {card.value}
                            </h3>
                        </div>
                    );

                    return (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}>
                            {isApple ? (
                                <LiquidGlassCard
                                    intensity="subtle"
                                    className="p-5 h-full">
                                    {content}
                                </LiquidGlassCard>
                            ) : (
                                <OneUICard className="p-5 h-full">{content}</OneUICard>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Modern Toolbar */}
            <TransactionToolbar
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={handleColumnVisibilityChange}
            />

            {/* Transaction List */}
            <AnimatePresence mode="popLayout">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center p-12 text-sm font-medium"
                        style={{ color: palette.textTertiary }}>
                        Loading transactions...
                    </motion.div>
                ) : transactions.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div
                            className="p-5 rounded-full"
                            style={{
                                background: `${palette.accent}15`,
                                color: palette.accent
                            }}>
                            <AccountBalanceWallet style={{ fontSize: 40 }} />
                        </div>
                        <h3
                            className="text-lg font-bold"
                            style={{ color: palette.textPrimary }}>
                            No transactions found
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            Adjust filters or create a new transaction.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        className="flex flex-col gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}>
                        {transactions.map((t, i) => {
                            const dateStr = new Date(t.Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

                            const innerContent = (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                                    <div className="flex items-center gap-4">
                                        {/* Icon based on type */}
                                        {columnVisibility.type && (
                                            <div
                                                className="p-3 rounded-xl flex-shrink-0"
                                                style={{
                                                    background: `${typeColor(t.Type)}15`,
                                                    color: typeColor(t.Type)
                                                }}>
                                                {typeIcon(t.Type)}
                                            </div>
                                        )}

                                        <div className="flex flex-col">
                                            {columnVisibility.note && (
                                                <span
                                                    className="text-base font-bold"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {t.Note}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                {columnVisibility.date && (
                                                    <span
                                                        className="text-xs font-semibold uppercase tracking-wider"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {dateStr}
                                                    </span>
                                                )}
                                                {columnVisibility.date && columnVisibility.category && (
                                                    <span
                                                        className="w-1 h-1 rounded-full"
                                                        style={{
                                                            background: palette.border
                                                        }}></span>
                                                )}
                                                {columnVisibility.category && (
                                                    isApple ? (
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                                            style={{
                                                                background: `${palette.accent}15`,
                                                                color: palette.accent
                                                            }}>
                                                            {t.Category}
                                                        </span>
                                                    ) : (
                                                        <OneUIBadge variant="accent">{t.Category}</OneUIBadge>
                                                    )
                                                )}
                                                {/* Contact chip */}
                                                {columnVisibility.contact && t.ContactName && (
                                                    <span
                                                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                                        style={{
                                                            background: isDark ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.08)",
                                                            color: "#8b5cf6"
                                                        }}>
                                                        <PersonOutline style={{ fontSize: 10 }} />
                                                        {t.ContactName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto">
                                        {columnVisibility.amount && (
                                            <div className="flex flex-col sm:items-end">
                                                <span
                                                    className="text-lg font-bold"
                                                    style={{
                                                        color: typeColor(t.Type)
                                                    }}>
                                                    {t.Type === "DEBIT" ? "−" : t.Type === "CREDIT" ? "+" : ""}
                                                    {amtFmt(t.Amount)}
                                                </span>
                                                {columnVisibility.type && (
                                                    <span
                                                        className="text-xs font-semibold uppercase"
                                                        style={{
                                                            color: typeColor(t.Type),
                                                            opacity: 0.7
                                                        }}>
                                                        {t.Type}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Link href={`/wallet/edit/${t.TransactionID}`}>
                                                <motion.button
                                                    className="p-2 rounded-xl transition-colors"
                                                    style={{
                                                        color: palette.textSecondary
                                                    }}
                                                    whileHover={{
                                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                                        color: palette.textPrimary
                                                    }}>
                                                    <Edit fontSize="small" />
                                                </motion.button>
                                            </Link>
                                            <motion.button
                                                className="p-2 rounded-xl transition-colors"
                                                style={{
                                                    color: "#ef4444",
                                                    opacity: deletingId === t.TransactionID ? 0.5 : 1
                                                }}
                                                whileHover={{
                                                    background: "rgba(239, 68, 68, 0.1)"
                                                }}
                                                onClick={() => deleteTransaction(t.TransactionID)}
                                                disabled={deletingId === t.TransactionID}>
                                                <Delete fontSize="small" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            );

                            return (
                                <motion.div
                                    key={t.TransactionID}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: Math.min(i * 0.05, 0.5)
                                    }}
                                    layout>
                                    {isApple ? (
                                        <LiquidGlassCard
                                            intensity="subtle"
                                            className="px-5 py-3 transition-all hover:scale-[1.01] cursor-default">
                                            {innerContent}
                                        </LiquidGlassCard>
                                    ) : (
                                        <div
                                            className="px-5 py-3 transition-all hover:scale-[1.01] cursor-default rounded-2xl"
                                            style={{
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"
                                            }}>
                                            {innerContent}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-4 pb-8">
                    {isApple ? (
                        <LiquidGlassCard
                            intensity="medium"
                            className="flex items-center justify-center gap-4 px-4 py-2 w-max mx-auto rounded-full">
                            <motion.button
                                className="p-1 rounded-full text-zinc-500 hover:text-cyan-500"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}>
                                <NavigateBefore />
                            </motion.button>
                            <span className="text-sm font-semibold text-zinc-400">
                                Page {page} of {totalPages}
                            </span>
                            <motion.button
                                className="p-1 rounded-full text-zinc-500 hover:text-cyan-500"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}>
                                <NavigateNext />
                            </motion.button>
                        </LiquidGlassCard>
                    ) : (
                        <div className="flex items-center gap-3">
                            <OneUIButton
                                variant="secondary"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-full min-w-0 px-2">
                                <NavigateBefore />
                            </OneUIButton>
                            <span
                                className="text-sm font-bold"
                                style={{ color: palette.textSecondary }}>
                                Page {page} of {totalPages}
                            </span>
                            <OneUIButton
                                variant="secondary"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-full min-w-0 px-2">
                                <NavigateNext />
                            </OneUIButton>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
