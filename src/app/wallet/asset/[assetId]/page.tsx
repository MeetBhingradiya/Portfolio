/**
 * Asset Transactions Detail Page
 * Shows all transactions for a specific asset (including hidden ones)
 * with modern toolbar filtering, sorting, column visibility, and asset details summary.
 */

"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDesignTheme } from "@Hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowBack,
    ArrowDownward,
    ArrowUpward,
    SwapHoriz,
    Edit,
    Delete,
    NavigateBefore,
    NavigateNext,
    TrendingUp,
    TrendingDown,
    FilterList,
    Visibility,
    PersonOutline
} from "@mui/icons-material";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIButton } from "@Components/Atoms/OneUI";
import {
    TransactionToolbar,
    type ToolbarFilters,
    type ToolbarSort,
    type ToolbarColumnVisibility
} from "@Components/Atoms/TransactionToolbar";

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

interface Asset {
    AssetID: string;
    Name: string;
    Balance: number;
    InitialBalance: number;
    Type: string;
    Color: string;
    Icon?: string;
}

interface AssetSummary {
    totalIn: number;
    totalOut: number;
    transactionCount: number;
}

const STORAGE_KEY_COLS = "wallet-asset-col-visibility";

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

export default function AssetTransactionsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const params = useParams();
    const assetId = params.assetId as string;
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [asset, setAsset] = useState<Asset | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<AssetSummary>({
        totalIn: 0,
        totalOut: 0,
        transactionCount: 0
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
        to: "",
        showHidden: false
    });
    const [sort, setSort] = useState<ToolbarSort>({ sortBy: "date", sortDir: "desc" });
    const [columnVisibility, setColumnVisibility] = useState<ToolbarColumnVisibility>(defaultCols());

    useEffect(() => {
        setColumnVisibility(loadColumnVisibility());
    }, []);

    const handleColumnVisibilityChange = useCallback((cols: ToolbarColumnVisibility) => {
        setColumnVisibility(cols);
        try { localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(cols)); } catch {}
    }, []);

    const fetchAssetAndTransactions = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch asset details
            const assetRes = await fetch(`/api/wallet/assets?t=${Date.now()}`, {
                cache: "no-store"
            }).then((r) => r.json());

            if (assetRes.success) {
                const foundAsset = assetRes.data.assets?.find((a: any) => a.AssetID === assetId);
                if (foundAsset) {
                    setAsset(foundAsset);
                }
            }

            // Fetch transactions for this asset (with hidden option)
            const qParams = new URLSearchParams({
                page: String(page),
                limit: "20",
                assetId: assetId,
                showHidden: filters.showHidden ? "1" : "0"
            });
            if (filters.search) qParams.set("search", filters.search);
            if (filters.type !== "ALL") qParams.set("type", filters.type);
            if (filters.category !== "ALL") qParams.set("category", filters.category);
            if (filters.from) qParams.set("from", filters.from);
            if (filters.to) qParams.set("to", filters.to);
            qParams.set("sortBy", sort.sortBy);
            qParams.set("sortDir", sort.sortDir);
            qParams.set("t", Date.now().toString());

            const txnRes = await fetch(`/api/wallet?${qParams}`, {
                cache: "no-store"
            }).then((r) => r.json());

            if (txnRes.success) {
                setTransactions(txnRes.data.transactions ?? []);
                const pg = txnRes.data.pagination ?? {};
                setTotalPages(pg.totalPages ?? 1);

                // Calculate summary for this asset
                const txns = txnRes.data.transactions ?? [];
                let totalIn = 0,
                    totalOut = 0;
                txns.forEach((t: Transaction) => {
                    if (t.Type === "CREDIT") totalIn += t.Amount;
                    else if (t.Type === "DEBIT") totalOut += t.Amount;
                });

                setSummary({
                    totalIn,
                    totalOut,
                    transactionCount: txns.length
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [assetId, page, filters, sort]);

    useEffect(() => {
        fetchAssetAndTransactions();
    }, [fetchAssetAndTransactions]);

    useEffect(() => {
        setPage(1);
    }, [filters, sort]);

    async function deleteTransaction(id: string) {
        if (!confirm("Delete this transaction? This cannot be undone.")) return;
        setDeletingId(id);
        await fetch(`/api/wallet/${id}`, { method: "DELETE" });
        setDeletingId(null);
        fetchAssetAndTransactions();
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

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header with Back */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/wallet/assets">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: palette.textSecondary }}
                        onHoverStart={() => {}}
                        onHoverEnd={() => {}}>
                        <ArrowBack fontSize="small" />
                    </motion.button>
                </Link>
                <div>
                    <h1
                        className="text-3xl font-bold"
                        style={{ color: palette.textPrimary }}>
                        {asset?.Name || "Asset Transactions"}
                    </h1>
                    <p
                        className="text-sm mt-1"
                        style={{ color: palette.textSecondary }}>
                        View all transactions for this asset (including hidden)
                    </p>
                </div>
            </div>

            {/* Asset Summary Cards */}
            {asset && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0 }}>
                        {isApple ? (
                            <LiquidGlassCard intensity="subtle" className="p-5 h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="p-1.5 rounded-full"
                                        style={{
                                            background: `${asset.Color || palette.accent}15`,
                                            color: asset.Color || palette.accent
                                        }}>
                                        <FilterList fontSize="small" />
                                    </div>
                                    <span
                                        className="text-xs font-medium uppercase tracking-wider"
                                        style={{ color: palette.textSecondary }}>
                                        Current Balance
                                    </span>
                                </div>
                                <h3
                                    className="text-2xl font-bold"
                                    style={{ color: palette.textPrimary }}>
                                    {amtFmt(asset.Balance)}
                                </h3>
                            </LiquidGlassCard>
                        ) : (
                            <OneUICard className="p-5 h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="p-1.5 rounded-full"
                                        style={{
                                            background: `${asset.Color || palette.accent}15`,
                                            color: asset.Color || palette.accent
                                        }}>
                                        <FilterList fontSize="small" />
                                    </div>
                                    <span
                                        className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: palette.textSecondary }}>
                                        Current Balance
                                    </span>
                                </div>
                                <h3
                                    className="text-2xl font-bold"
                                    style={{ color: palette.textPrimary }}>
                                    {amtFmt(asset.Balance)}
                                </h3>
                            </OneUICard>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}>
                        {isApple ? (
                            <LiquidGlassCard intensity="subtle" className="p-5 h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="p-1.5 rounded-full"
                                        style={{
                                            background: "#22c55e15",
                                            color: "#22c55e"
                                        }}>
                                        <TrendingUp fontSize="small" />
                                    </div>
                                    <span
                                        className="text-xs font-medium uppercase tracking-wider"
                                        style={{ color: palette.textSecondary }}>
                                        Total Income
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold" style={{ color: "#22c55e" }}>
                                    {amtFmt(summary.totalIn)}
                                </h3>
                            </LiquidGlassCard>
                        ) : (
                            <OneUICard className="p-5 h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="p-1.5 rounded-full"
                                        style={{
                                            background: "#22c55e15",
                                            color: "#22c55e"
                                        }}>
                                        <TrendingUp fontSize="small" />
                                    </div>
                                    <span
                                        className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: palette.textSecondary }}>
                                        Total Income
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold" style={{ color: "#22c55e" }}>
                                    {amtFmt(summary.totalIn)}
                                </h3>
                            </OneUICard>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}>
                        {isApple ? (
                            <LiquidGlassCard intensity="subtle" className="p-5 h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="p-1.5 rounded-full"
                                        style={{
                                            background: "#ef444415",
                                            color: "#ef4444"
                                        }}>
                                        <TrendingDown fontSize="small" />
                                    </div>
                                    <span
                                        className="text-xs font-medium uppercase tracking-wider"
                                        style={{ color: palette.textSecondary }}>
                                        Total Expense
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                                    {amtFmt(summary.totalOut)}
                                </h3>
                            </LiquidGlassCard>
                        ) : (
                            <OneUICard className="p-5 h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="p-1.5 rounded-full"
                                        style={{
                                            background: "#ef444415",
                                            color: "#ef4444"
                                        }}>
                                        <TrendingDown fontSize="small" />
                                    </div>
                                    <span
                                        className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: palette.textSecondary }}>
                                        Total Expense
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                                    {amtFmt(summary.totalOut)}
                                </h3>
                            </OneUICard>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Modern Toolbar */}
            <TransactionToolbar
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                showHiddenToggle
            />

            {/* Transactions List */}
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
                            <Visibility style={{ fontSize: 40 }} />
                        </div>
                        <h3
                            className="text-lg font-bold"
                            style={{ color: palette.textPrimary }}>
                            No transactions found
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            Adjust filters or create a transaction for this asset.
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
                                                {columnVisibility.category && (
                                                    <span
                                                        className="text-xs font-semibold uppercase"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {t.Category || "OTHER"}
                                                    </span>
                                                )}
                                                {columnVisibility.date && (
                                                    <span
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        · {dateStr}
                                                    </span>
                                                )}
                                                {t.IsHidden && (
                                                    <span
                                                        className="text-xs font-bold px-2 py-0.5 rounded"
                                                        style={{
                                                            background: `${palette.accent}20`,
                                                            color: palette.accent
                                                        }}>
                                                        HIDDEN
                                                    </span>
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
                                                    color: palette.textSecondary
                                                }}
                                                onClick={() => deleteTransaction(t.TransactionID)}
                                                disabled={deletingId === t.TransactionID}
                                                whileHover={{
                                                    background: "rgba(239, 68, 68, 0.1)",
                                                    color: "#ef4444"
                                                }}>
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
