/**
 * Support Tickets List Page
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ConfirmationNumber, Add, Search, Circle, PriorityHigh, ArrowForward } from "@mui/icons-material";

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    lastRepliedAt: string;
    createdAt: string;
    userEmail: string;
    userName: string;
    assignedEmail?: string;
    messages?: any[];
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    open: { label: "Open", color: "#34C759" },
    in_progress: { label: "In Progress", color: "#007AFF" },
    waiting_customer: { label: "Awaiting Reply", color: "#FF9500" },
    resolved: { label: "Resolved", color: "#5AC8FA" },
    closed: { label: "Closed", color: "#8E8E93" }
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "#34C759" },
    medium: { label: "Medium", color: "#FF9500" },
    high: { label: "High", color: "#FF3B30" },
    urgent: { label: "Urgent", color: "#FF2D55" }
};

export default function SupportTicketsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "15",
                ...(search ? { search } : {}),
                ...(statusFilter ? { status: statusFilter } : {})
            });
            const res = await fetch(`/api/support/tickets?${params}`);
            const json = await res.json();
            if (json.success) {
                setTickets(json.data);
                setTotalPages(json.pagination?.pages ?? 1);
            }
        } catch {
            /* silent */
        }
        setLoading(false);
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const statuses = ["All", "open", "in_progress", "waiting_customer", "resolved", "closed"];

    return (
        <div
            className="min-h-screen py-12 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
                    <div>
                        <h1
                            className={`${isApple ? "text-3xl font-semibold" : "text-4xl font-black"} mb-1`}
                            style={{ color: palette.textPrimary }}>
                            Support Tickets
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            Track and manage your support requests.
                        </p>
                    </div>
                    <Link href="/support/tickets/new">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold"
                            style={{
                                background: palette.accent,
                                color: "#fff"
                            }}>
                            <Add /> New Ticket
                        </motion.button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[180px]"
                        style={{
                            background: cardBg,
                            border,
                            borderRadius: 14
                        }}>
                        <Search
                            style={{
                                color: palette.textSecondary,
                                fontSize: 18
                            }}
                        />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by subject, ID, or email…"
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: palette.textPrimary }}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {statuses.map((s) => {
                            const cfg = STATUS_CFG[s];
                            const active = (s === "All" && !statusFilter) || s === statusFilter;
                            return (
                                <motion.button
                                    key={s}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => {
                                        setStatusFilter(s === "All" ? "" : s);
                                        setPage(1);
                                    }}
                                    className="px-3 py-2 rounded-xl text-xs font-bold capitalize flex items-center gap-1.5"
                                    style={{
                                        background: active
                                            ? (cfg?.color ?? palette.accent) + "22"
                                            : isDark
                                              ? "rgba(255,255,255,0.07)"
                                              : "rgba(0,0,0,0.05)",
                                        color: active ? (cfg?.color ?? palette.accent) : palette.textSecondary,
                                        border: active ? `1.5px solid ${cfg?.color ?? palette.accent}` : "1.5px solid transparent"
                                    }}>
                                    {cfg && (
                                        <Circle
                                            style={{
                                                fontSize: 8,
                                                color: cfg.color
                                            }}
                                        />
                                    )}
                                    {s.replace("_", " ")}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Tickets */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="h-20 rounded-2xl animate-pulse"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                                }}
                            />
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-24">
                        <ConfirmationNumber
                            style={{
                                fontSize: 64,
                                color: palette.textTertiary,
                                opacity: 0.3
                            }}
                        />
                        <p
                            className="mt-4 text-lg font-bold"
                            style={{ color: palette.textSecondary }}>
                            No tickets found
                        </p>
                        <Link href="/support/tickets/new">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="mt-6 px-6 py-3 rounded-xl font-bold text-white"
                                style={{ background: palette.accent }}>
                                Open a New Ticket
                            </motion.button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tickets.map((ticket, i) => {
                            const statusCfg = STATUS_CFG[ticket.status] ?? {
                                label: ticket.status,
                                color: "#888"
                            };
                            const priCfg = PRIORITY_CFG[ticket.priority] ?? {
                                label: ticket.priority,
                                color: "#888"
                            };
                            return (
                                <motion.div
                                    key={ticket._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}>
                                    <Link href={`/support/tickets/${ticket.ticketId}`}>
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            className="flex items-center gap-4 p-4 cursor-pointer"
                                            style={{
                                                background: cardBg,
                                                border,
                                                borderRadius: br,
                                                backdropFilter: isApple ? "blur(20px)" : "none"
                                            }}>
                                            {/* Status dot */}
                                            <Circle
                                                style={{
                                                    fontSize: 12,
                                                    color: statusCfg.color,
                                                    flexShrink: 0
                                                }}
                                            />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className="font-black text-sm"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {ticket.subject}
                                                    </span>
                                                    <span
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {ticket.ticketId}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                                                        style={{
                                                            background: `${statusCfg.color}18`,
                                                            color: statusCfg.color
                                                        }}>
                                                        {statusCfg.label}
                                                    </span>
                                                    <span
                                                        className="flex items-center gap-0.5 text-xs font-semibold capitalize"
                                                        style={{
                                                            color: priCfg.color
                                                        }}>
                                                        {ticket.priority === "urgent" && (
                                                            <PriorityHigh
                                                                style={{
                                                                    fontSize: 12
                                                                }}
                                                            />
                                                        )}
                                                        {priCfg.label}
                                                    </span>
                                                    <span
                                                        className="text-xs capitalize"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {ticket.category}
                                                    </span>
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {new Date(ticket.lastRepliedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <ArrowForward
                                                style={{
                                                    color: palette.textTertiary,
                                                    fontSize: 18,
                                                    flexShrink: 0
                                                }}
                                            />
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <motion.button
                                key={n}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPage(n)}
                                className="w-10 h-10 rounded-xl text-sm font-bold"
                                style={{
                                    background: n === page ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                                    color: n === page ? "#fff" : palette.textSecondary
                                }}>
                                {n}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
