/**
 * Admin — All Support Tickets
 * View, assign, and update status for all tickets.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ConfirmationNumber, Search, FilterList } from "@mui/icons-material";

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    email: string;
    name: string;
    assignedEmail?: string;
    createdAt: string;
    messageCount?: number;
}

const STATUS_COLORS: Record<string, string> = {
    open: "#FF9500",
    in_progress: "#007AFF",
    waiting_customer: "#AF52DE",
    resolved: "#34C759",
    closed: "#8E8E93",
};

const PRIORITY_COLORS: Record<string, string> = {
    low: "#34C759",
    medium: "#FF9500",
    high: "#FF3B30",
    urgent: "#FF2D55",
};

export default function AdminTicketsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [table, setTable] = useState({ tickets: [] as Ticket[], loading: true, search: "", statusFilter: "all" });
    const patchTable = useCallback((p: Partial<typeof table>) => setTable(s => ({ ...s, ...p })), []);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;

    const fetchTickets = useCallback(async () => {
        patchTable({ loading: true });
        const params = new URLSearchParams({ page: "1", limit: "50" });
        if (table.statusFilter !== "all") params.set("status", table.statusFilter);
        if (table.search) params.set("q", table.search);
        const res = await fetch(`/api/support/tickets?${params}`);
        const json = await res.json();
        if (json.success) patchTable({ tickets: json.data });
        patchTable({ loading: false });
    }, [table.search, table.statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const STATUSES = ["all", "open", "in_progress", "waiting_customer", "resolved", "closed"];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <ConfirmationNumber style={{ color: palette.accent, fontSize: 32 }} />
                <div>
                    <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                        Support Tickets
                    </h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>All customer tickets</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-1 min-w-48"
                    style={{ background: cardBg, border }}
                >
                    <Search style={{ color: palette.textSecondary, fontSize: 18 }} />
                    <input
                        value={table.search}
                        onChange={e => patchTable({ search: e.target.value })}
                        placeholder="Search tickets…"
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: palette.textPrimary }}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {STATUSES.map(s => (
                        <motion.button
                            key={s}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => patchTable({ statusFilter: s })}
                            className="px-3 py-2 rounded-xl text-xs font-bold capitalize"
                            style={{
                                background: table.statusFilter === s ? `${palette.accent}22` : cardBg,
                                border: table.statusFilter === s ? `1px solid ${palette.accent}44` : border,
                                color: table.statusFilter === s ? palette.accent : palette.textSecondary,
                            }}
                        >
                            {s === "all" ? "All" : s.replace("_", " ")}
                        </motion.button>
                    ))}
                </div>
            </div>

            {table.loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {table.tickets.map(t => (
                        <Link key={t._id} href={`/support/tickets/${t._id}`}>
                            <motion.div
                                whileHover={{ y: -1 }}
                                className="flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer"
                                style={{ background: cardBg, border, borderRadius: br }}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black font-mono" style={{ color: palette.accent }}>
                                            {t.ticketId}
                                        </span>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                                            style={{ background: `${STATUS_COLORS[t.status] ?? "#8E8E93"}18`, color: STATUS_COLORS[t.status] ?? "#8E8E93" }}
                                        >
                                            {t.status.replace("_", " ")}
                                        </span>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                                            style={{ background: `${PRIORITY_COLORS[t.priority] ?? palette.accent}18`, color: PRIORITY_COLORS[t.priority] ?? palette.accent }}
                                        >
                                            {t.priority}
                                        </span>
                                    </div>
                                    <p className="font-bold text-sm truncate" style={{ color: palette.textPrimary }}>{t.subject}</p>
                                </div>
                                <div className="text-right text-xs" style={{ color: palette.textTertiary }}>
                                    <p className="font-semibold" style={{ color: palette.textSecondary }}>{t.name}</p>
                                    <p>{t.email}</p>
                                    <p>{new Date(t.createdAt).toLocaleDateString()}</p>
                                    {t.assignedEmail && <p className="mt-0.5 text-green-500">→ {t.assignedEmail}</p>}
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                    {table.tickets.length === 0 && (
                        <div className="text-center py-16" style={{ color: palette.textSecondary }}>
                            No tickets found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
