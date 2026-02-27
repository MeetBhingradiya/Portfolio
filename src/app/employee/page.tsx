/**
 * Employee Hub — Dashboard for support staff
 * Shows assigned/open tickets, pending refunds, and quick-action links.
 * Accessible to users with the "employee" or "admin" role.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    SupportAgent,
    ConfirmationNumber,
    AssignmentReturn,
    ShoppingBag,
    TrendingUp,
    OpenInNew,
    ErrorOutline,
} from "@mui/icons-material";

interface Stats {
    openTickets: number;
    pendingRefunds: number;
    pendingOrders: number;
    totalTickets: number;
}

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    status: string;
    priority: string;
    email: string;
    createdAt: string;
}

interface Refund {
    _id: string;
    refundId: string;
    orderId: string;
    reason: string;
    totalRefundAmount: number;
    status: string;
}

const PRIORITY_COLORS: Record<string, string> = {
    low: "#34C759",
    medium: "#FF9500",
    high: "#FF3B30",
    urgent: "#FF2D55",
};

export default function EmployeeDashboard() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [loading, setLoading] = useState(true);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;

    const fetchData = useCallback(async () => {
        // Check role
        const meRes = await fetch("/api/support/roles/me");
        const meJson = await meRes.json();
        if (!meJson.success || (!meJson.data.isEmployee && !meJson.data.isAdmin)) {
            setAuthorized(false);
            setLoading(false);
            return;
        }
        setAuthorized(true);

        // Fetch open tickets
        const tRes = await fetch("/api/support/tickets?status=open&limit=10");
        const tJson = await tRes.json();
        if (tJson.success) setTickets(tJson.data);

        // Fetch pending refunds
        const rRes = await fetch("/api/shop/refunds?status=pending&limit=10");
        const rJson = await rRes.json();
        if (rJson.success) setRefunds(rJson.data);

        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: palette.background }}>
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: palette.accent }} />
            </div>
        );
    }

    if (authorized === false) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: palette.background }}>
                <ErrorOutline style={{ fontSize: 56, color: "#FF3B30" }} />
                <h2 className="font-black text-2xl" style={{ color: palette.textPrimary }}>Access Denied</h2>
                <p style={{ color: palette.textSecondary }}>This area is for support staff only.</p>
                <Link href="/">
                    <motion.button whileTap={{ scale: 0.96 }} className="px-5 py-2.5 rounded-xl font-bold" style={{ background: palette.accent, color: "#fff" }}>
                        Go Home
                    </motion.button>
                </Link>
            </div>
        );
    }

    const statCards = [
        { icon: <ConfirmationNumber />, label: "Open Tickets", value: tickets.filter(t => t.status === "open").length, color: "#FF9500", href: "/admin/tickets" },
        { icon: <AssignmentReturn />, label: "Pending Refunds", value: refunds.filter(r => r.status === "pending").length, color: "#FF3B30", href: "/admin/refunds" },
        { icon: <ShoppingBag />, label: "All Tickets", value: tickets.length, color: "#007AFF", href: "/admin/tickets" },
    ];

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <SupportAgent style={{ color: palette.accent, fontSize: 36 }} />
                        <h1 className={`${isApple ? "text-3xl font-semibold" : "text-4xl font-black"}`} style={{ color: palette.textPrimary }}>
                            Employee Hub
                        </h1>
                    </div>
                    <p style={{ color: palette.textSecondary }}>Support staff overview and quick actions</p>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {statCards.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                        >
                            <Link href={s.href}>
                                <motion.div
                                    whileHover={{ y: -3 }}
                                    className="p-5 rounded-3xl cursor-pointer"
                                    style={{ background: cardBg, border, backdropFilter: isApple ? "blur(20px)" : "none" }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                        style={{ background: `${s.color}18` }}
                                    >
                                        <span style={{ color: s.color }}>{s.icon}</span>
                                    </div>
                                    <p className="text-3xl font-black" style={{ color: palette.textPrimary }}>{s.value}</p>
                                    <p className="text-sm" style={{ color: palette.textSecondary }}>{s.label}</p>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Open Tickets */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-black text-lg" style={{ color: palette.textPrimary }}>Open Tickets</h2>
                            <Link href="/admin/tickets" className="text-sm font-bold" style={{ color: palette.accent }}>
                                View all →
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {tickets.slice(0, 6).map(t => (
                                <Link key={t._id} href={`/support/tickets/${t._id}`}>
                                    <motion.div
                                        whileHover={{ x: 2 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
                                        style={{ background: cardBg, border, borderRadius: br }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ background: PRIORITY_COLORS[t.priority] ?? "#8E8E93" }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate" style={{ color: palette.textPrimary }}>{t.subject}</p>
                                            <p className="text-xs" style={{ color: palette.textSecondary }}>{t.email}</p>
                                        </div>
                                        <span className="text-xs font-black font-mono flex-shrink-0" style={{ color: palette.accent }}>{t.ticketId}</span>
                                    </motion.div>
                                </Link>
                            ))}
                            {tickets.length === 0 && (
                                <div className="text-center py-8" style={{ color: palette.textSecondary }}>
                                    No open tickets 🎉
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Refunds */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-black text-lg" style={{ color: palette.textPrimary }}>Pending Refunds</h2>
                            <Link href="/admin/refunds" className="text-sm font-bold" style={{ color: palette.accent }}>
                                View all →
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {refunds.slice(0, 6).map(r => (
                                <motion.div
                                    key={r._id}
                                    whileHover={{ x: 2 }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                    style={{ background: cardBg, border, borderRadius: br }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate capitalize" style={{ color: palette.textPrimary }}>
                                            {r.reason.replace("_", " ")}
                                        </p>
                                        <p className="text-xs font-mono" style={{ color: palette.textSecondary }}>{r.orderId}</p>
                                    </div>
                                    <p className="font-black text-sm flex-shrink-0" style={{ color: "#FF3B30" }}>
                                        ${(r.totalRefundAmount / 100).toFixed(2)}
                                    </p>
                                </motion.div>
                            ))}
                            {refunds.length === 0 && (
                                <div className="text-center py-8" style={{ color: palette.textSecondary }}>
                                    No pending refunds 🎉
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "All Tickets", href: "/admin/tickets", color: "#007AFF" },
                        { label: "All Orders", href: "/admin/orders", color: "#34C759" },
                        { label: "Refunds", href: "/admin/refunds", color: "#FF3B30" },
                        { label: "FAQ Editor", href: "/admin/faq", color: "#AF52DE" },
                    ].map(ql => (
                        <Link key={ql.href} href={ql.href}>
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="p-4 rounded-2xl text-center cursor-pointer"
                                style={{ background: `${ql.color}12`, border: `1px solid ${ql.color}25` }}
                            >
                                <p className="font-black text-sm" style={{ color: ql.color }}>{ql.label}</p>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
