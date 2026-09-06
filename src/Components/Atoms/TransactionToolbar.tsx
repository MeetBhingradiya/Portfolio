/**
 * TransactionToolbar
 * Modern, reusable toolbar for filtering, sorting, column visibility on transaction lists.
 * Supports LiquidGlass (Apple) and OneUI (Samsung) themes.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    Search,
    FilterList,
    Close,
    CalendarMonth,
    SwapVert,
    ViewColumn,
    ArrowUpward,
    ArrowDownward,
    KeyboardArrowDown
} from "@mui/icons-material";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToolbarFilters {
    search: string;
    type: string;
    category: string;
    from: string;
    to: string;
    showHidden?: boolean;
}

export interface ToolbarSort {
    sortBy: "date" | "amount" | "note";
    sortDir: "asc" | "desc";
}

export type ColumnKey = "date" | "note" | "amount" | "type" | "category" | "contact";

export interface ToolbarColumnVisibility {
    date: boolean;
    note: boolean;
    amount: boolean;
    type: boolean;
    category: boolean;
    contact: boolean;
}

interface TransactionToolbarProps {
    filters: ToolbarFilters;
    onFiltersChange: (filters: ToolbarFilters) => void;
    sort: ToolbarSort;
    onSortChange: (sort: ToolbarSort) => void;
    columnVisibility: ToolbarColumnVisibility;
    onColumnVisibilityChange: (cols: ToolbarColumnVisibility) => void;
    showHiddenToggle?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPES = ["ALL", "CREDIT", "DEBIT", "TRANSFER"];
const CATEGORIES = [
    "ALL", "FOOD", "TRANSPORT", "SHOPPING", "ENTERTAINMENT", "BILLS",
    "HEALTH", "EDUCATION", "RENT", "SALARY", "FREELANCE", "INVESTMENT",
    "GIFT", "RECHARGE", "SUBSCRIPTION", "TRAVEL", "GROCERIES", "DONATION",
    "LOAN", "REFUND", "OTHER"
];
const TYPE_OPTS = TYPES.map((v) => ({ value: v, label: v }));
const CATEGORY_OPTS = CATEGORIES.map((v) => ({
    value: v,
    label: v.replace(/_/g, " ")
}));

const SORT_BY_OPTS = [
    { value: "date", label: "Date" },
    { value: "amount", label: "Amount" },
    { value: "note", label: "Note" }
];

const COLUMN_LABELS: Record<ColumnKey, string> = {
    date: "Date",
    note: "Note",
    amount: "Amount",
    type: "Type",
    category: "Category",
    contact: "Contact"
};

// ─── Popover ─────────────────────────────────────────────────────────────────

function ToolbarPopover({
    anchorRef,
    isOpen,
    onClose,
    children,
    width = 260
}: {
    anchorRef: React.RefObject<HTMLElement | null>;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: number;
}) {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const popoverRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 8, left: Math.max(8, rect.left) });
    }, [isOpen, anchorRef]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!popoverRef.current?.contains(t) && !anchorRef.current?.contains(t)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen, onClose, anchorRef]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                style={{
                    position: "fixed",
                    top: pos.top,
                    left: pos.left,
                    width,
                    zIndex: 9998,
                    background: isDark ? "rgba(28,28,30,0.98)" : "rgba(255,255,255,0.98)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    borderRadius: 16,
                    boxShadow: "0 12px 48px rgba(0,0,0,0.28)",
                    padding: 16,
                    maxHeight: "70vh",
                    overflowY: "auto"
                }}>
                {children}
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

// ─── Active Filter Badge ─────────────────────────────────────────────────────

function FilterBadge({
    label,
    onClear
}: {
    label: string;
    onClear: () => void;
}) {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
            style={{
                background: `${palette.accent}18`,
                color: palette.accent,
                border: `1px solid ${palette.accent}30`
            }}>
            {label}
            <button
                onClick={onClear}
                className="p-0.5 rounded-full transition-colors hover:bg-white/20"
                style={{ lineHeight: 0 }}>
                <Close style={{ fontSize: 12 }} />
            </button>
        </motion.span>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const TransactionToolbar: React.FC<TransactionToolbarProps> = ({
    filters,
    onFiltersChange,
    sort,
    onSortChange,
    columnVisibility,
    onColumnVisibilityChange,
    showHiddenToggle = false
}) => {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [showDateRange, setShowDateRange] = useState(false);
    const [showSortPopover, setShowSortPopover] = useState(false);
    const [showColumnPopover, setShowColumnPopover] = useState(false);

    const dateRef = useRef<HTMLButtonElement | null>(null);
    const sortRef = useRef<HTMLButtonElement | null>(null);
    const colRef = useRef<HTMLButtonElement | null>(null);

    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
    const btnBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
    const btnHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    const updateFilter = useCallback(
        (key: keyof ToolbarFilters, value: string | boolean) => {
            onFiltersChange({ ...filters, [key]: value });
        },
        [filters, onFiltersChange]
    );

    // Count active filters (excluding search)
    const activeFilterCount = [
        filters.type !== "ALL",
        filters.category !== "ALL",
        !!filters.from,
        !!filters.to,
        !!filters.showHidden
    ].filter(Boolean).length;

    const activeBadges: { label: string; clear: () => void }[] = [];
    if (filters.type !== "ALL") {
        activeBadges.push({
            label: `Type: ${filters.type}`,
            clear: () => updateFilter("type", "ALL")
        });
    }
    if (filters.category !== "ALL") {
        activeBadges.push({
            label: `Cat: ${filters.category}`,
            clear: () => updateFilter("category", "ALL")
        });
    }
    if (filters.from) {
        activeBadges.push({
            label: `From: ${filters.from}`,
            clear: () => updateFilter("from", "")
        });
    }
    if (filters.to) {
        activeBadges.push({
            label: `To: ${filters.to}`,
            clear: () => updateFilter("to", "")
        });
    }

    const clearAllFilters = () => {
        onFiltersChange({
            search: filters.search,
            type: "ALL",
            category: "ALL",
            from: "",
            to: "",
            showHidden: false
        });
    };

    return (
        <div className="space-y-3">
            {/* Main row */}
            <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl flex-1 min-w-[200px] transition-all"
                    style={{
                        background: inputBg,
                        border: `1px solid ${borderColor}`
                    }}>
                    <Search
                        fontSize="small"
                        style={{ color: palette.textTertiary }}
                    />
                    <input
                        type="text"
                        placeholder="Search notes, tags..."
                        className="bg-transparent outline-none flex-1 text-sm font-medium"
                        style={{ color: palette.textPrimary }}
                        value={filters.search}
                        onChange={(e) => updateFilter("search", e.target.value)}
                    />
                    {filters.search && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => updateFilter("search", "")}
                            className="p-0.5 rounded-full"
                            style={{ color: palette.textTertiary }}>
                            <Close style={{ fontSize: 16 }} />
                        </motion.button>
                    )}
                </div>

                {/* Type filter */}
                <CustomSelect
                    value={filters.type}
                    onChange={(v) => updateFilter("type", v)}
                    options={TYPE_OPTS}
                    className="min-w-[130px]"
                />

                {/* Category filter */}
                <CustomSelect
                    value={filters.category}
                    onChange={(v) => updateFilter("category", v)}
                    options={CATEGORY_OPTS}
                    className="min-w-[150px]"
                />

                {/* Divider */}
                <div
                    className="hidden sm:block w-px h-8 mx-1"
                    style={{ background: borderColor }}
                />

                {/* Date range toggle */}
                <motion.button
                    ref={dateRef}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        setShowDateRange(!showDateRange);
                        setShowSortPopover(false);
                        setShowColumnPopover(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all"
                    style={{
                        background: (filters.from || filters.to) ? `${palette.accent}15` : btnBg,
                        border: `1px solid ${(filters.from || filters.to) ? palette.accent : borderColor}`,
                        color: (filters.from || filters.to) ? palette.accent : palette.textSecondary
                    }}>
                    <CalendarMonth style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Date</span>
                </motion.button>

                {/* Sort toggle */}
                <motion.button
                    ref={sortRef}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        setShowSortPopover(!showSortPopover);
                        setShowDateRange(false);
                        setShowColumnPopover(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all"
                    style={{
                        background: sort.sortBy !== "date" ? `${palette.accent}15` : btnBg,
                        border: `1px solid ${sort.sortBy !== "date" ? palette.accent : borderColor}`,
                        color: sort.sortBy !== "date" ? palette.accent : palette.textSecondary
                    }}>
                    <SwapVert style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Sort</span>
                </motion.button>

                {/* Column visibility toggle */}
                <motion.button
                    ref={colRef}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        setShowColumnPopover(!showColumnPopover);
                        setShowDateRange(false);
                        setShowSortPopover(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all"
                    style={{
                        background: btnBg,
                        border: `1px solid ${borderColor}`,
                        color: palette.textSecondary
                    }}>
                    <ViewColumn style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Fields</span>
                </motion.button>

                {/* Show Hidden toggle (for asset detail) */}
                {showHiddenToggle && (
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateFilter("showHidden", !filters.showHidden)}
                        className="px-3 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all"
                        style={{
                            background: filters.showHidden ? (palette.accent || "#06b6d4") : btnBg,
                            border: `1px solid ${filters.showHidden ? "transparent" : borderColor}`,
                            color: filters.showHidden ? "#fff" : palette.textSecondary
                        }}>
                        {filters.showHidden ? "Showing Hidden" : "Show Hidden"}
                    </motion.button>
                )}

                {/* Active filter count badge */}
                {activeFilterCount > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={clearAllFilters}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all"
                        style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.2)"
                        }}>
                        <Close style={{ fontSize: 14 }} />
                        Clear ({activeFilterCount})
                    </motion.button>
                )}
            </div>

            {/* Active filter badges */}
            <AnimatePresence>
                {activeBadges.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap items-center gap-2">
                        {activeBadges.map((b) => (
                            <FilterBadge
                                key={b.label}
                                label={b.label}
                                onClear={b.clear}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Date range popover */}
            <ToolbarPopover
                anchorRef={dateRef}
                isOpen={showDateRange}
                onClose={() => setShowDateRange(false)}
                width={300}>
                <div className="space-y-4">
                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: palette.textSecondary }}>
                        Date Range
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                className="text-[10px] font-bold uppercase tracking-wide block mb-1.5"
                                style={{ color: palette.textTertiary }}>
                                From
                            </label>
                            <input
                                type="date"
                                value={filters.from}
                                onChange={(e) => updateFilter("from", e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs outline-none font-medium"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                    border: `1px solid ${borderColor}`,
                                    color: palette.textPrimary
                                }}
                            />
                        </div>
                        <div>
                            <label
                                className="text-[10px] font-bold uppercase tracking-wide block mb-1.5"
                                style={{ color: palette.textTertiary }}>
                                To
                            </label>
                            <input
                                type="date"
                                value={filters.to}
                                onChange={(e) => updateFilter("to", e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs outline-none font-medium"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                    border: `1px solid ${borderColor}`,
                                    color: palette.textPrimary
                                }}
                            />
                        </div>
                    </div>
                    {(filters.from || filters.to) && (
                        <button
                            onClick={() => {
                                updateFilter("from", "");
                                updateFilter("to", "");
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                                color: "#ef4444",
                                background: "rgba(239,68,68,0.08)"
                            }}>
                            Clear Dates
                        </button>
                    )}
                </div>
            </ToolbarPopover>

            {/* Sort popover */}
            <ToolbarPopover
                anchorRef={sortRef}
                isOpen={showSortPopover}
                onClose={() => setShowSortPopover(false)}
                width={240}>
                <div className="space-y-3">
                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: palette.textSecondary }}>
                        Sort By
                    </p>
                    <div className="flex flex-col gap-1">
                        {SORT_BY_OPTS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() =>
                                    onSortChange({
                                        ...sort,
                                        sortBy: opt.value as ToolbarSort["sortBy"]
                                    })
                                }
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={{
                                    background: sort.sortBy === opt.value ? `${palette.accent}15` : "transparent",
                                    color: sort.sortBy === opt.value ? palette.accent : palette.textPrimary
                                }}>
                                {opt.label}
                                {sort.sortBy === opt.value && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: palette.accent }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div
                        className="h-px my-2"
                        style={{ background: borderColor }}
                    />

                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: palette.textSecondary }}>
                        Direction
                    </p>
                    <div className="flex gap-2">
                        {(["desc", "asc"] as const).map((dir) => (
                            <button
                                key={dir}
                                onClick={() => onSortChange({ ...sort, sortDir: dir })}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all"
                                style={{
                                    background: sort.sortDir === dir ? `${palette.accent}15` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                    border: `1px solid ${sort.sortDir === dir ? palette.accent : borderColor}`,
                                    color: sort.sortDir === dir ? palette.accent : palette.textSecondary
                                }}>
                                {dir === "desc" ? <ArrowDownward style={{ fontSize: 14 }} /> : <ArrowUpward style={{ fontSize: 14 }} />}
                                {dir === "desc" ? "Newest" : "Oldest"}
                            </button>
                        ))}
                    </div>
                </div>
            </ToolbarPopover>

            {/* Column visibility popover */}
            <ToolbarPopover
                anchorRef={colRef}
                isOpen={showColumnPopover}
                onClose={() => setShowColumnPopover(false)}
                width={220}>
                <div className="space-y-3">
                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: palette.textSecondary }}>
                        Visible Fields
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                            <label
                                key={key}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-medium"
                                style={{
                                    background: columnVisibility[key] ? `${palette.accent}08` : "transparent",
                                    color: columnVisibility[key] ? palette.textPrimary : palette.textTertiary
                                }}>
                                <input
                                    type="checkbox"
                                    checked={columnVisibility[key]}
                                    onChange={(e) =>
                                        onColumnVisibilityChange({
                                            ...columnVisibility,
                                            [key]: e.target.checked
                                        })
                                    }
                                    className="w-4 h-4 rounded"
                                    style={{ accentColor: palette.accent }}
                                />
                                {COLUMN_LABELS[key]}
                            </label>
                        ))}
                    </div>
                </div>
            </ToolbarPopover>
        </div>
    );
};
