/**
 * Shop — My Refund Requests
 * Lists all refund requests for the logged-in user.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { AssignmentReturn, Add, ArrowBack } from "@mui/icons-material";

interface Refund {
    _id: string;
    refundId: string;
    orderId: string;
    reason: string;
    status: string;
    totalRefundAmount: number;
    createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "#FF9500",
    under_review: "#007AFF",
    approved: "#34C759",
    rejected: "#FF3B30",
    processed: "#8E8E93",
};

export default function RefundsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [loading, setLoading] = useState(true);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;

    const fetchRefunds = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/shop/refunds");
        const json = await res.json();
        if (json.success) setRefunds(json.data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-3xl mx-auto">
                <Link href="/shop/orders">
                    <motion.button whileHover={{ x: -3 }} className="flex items-center gap-2 text-sm font-bold mb-8" style={{ color: palette.accent }}>
                        <ArrowBack fontSize="small" /> My Orders
                    </motion.button>
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <AssignmentReturn style={{ color: palette.accent, fontSize: 28 }} />
                        <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                            My Refund Requests
                        </h1>
                    </div>
                    <Link href="/shop/refunds/new">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                            style={{ background: palette.accent, color: "#fff" }}
                        >
                            <Add fontSize="small" /> New Request
                        </motion.button>
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />)}
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="text-center py-16">
                        <AssignmentReturn style={{ fontSize: 56, color: palette.textTertiary, opacity: 0.3 }} />
                        <p className="mt-4 font-bold" style={{ color: palette.textSecondary }}>No refund requests yet</p>
                        <Link href="/shop/orders">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm"
                                style={{ background: palette.accent, color: "#fff" }}
                            >
                                View My Orders
                            </motion.button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {refunds.map(r => (
                            <motion.div
                                key={r._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                                style={{ background: cardBg, border, borderRadius: br }}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black font-mono" style={{ color: palette.accent }}>{r.refundId}</span>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                                            style={{ background: `${STATUS_COLORS[r.status] ?? "#8E8E93"}18`, color: STATUS_COLORS[r.status] ?? "#8E8E93" }}
                                        >
                                            {r.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <p className="font-bold text-sm capitalize" style={{ color: palette.textPrimary }}>
                                        {r.reason.replace("_", " ")}
                                    </p>
                                    <p className="text-xs" style={{ color: palette.textSecondary }}>Order: {r.orderId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black" style={{ color: palette.textPrimary }}>
                                        ${(r.totalRefundAmount / 100).toFixed(2)}
                                    </p>
                                    <p className="text-xs" style={{ color: palette.textTertiary }}>
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
