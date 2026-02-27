/**
 * My Orders Page — user dashboard
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Inventory2,
    CheckCircle,
    Schedule,
    LocalShipping,
    Cancel,
    Refresh,
    ArrowForward,
    Search,
    MoneyOff,
} from "@mui/icons-material";

interface Order {
    _id: string;
    orderId: string;
    orderNumber: number;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    items: { productName: string; quantity: number }[];
    createdAt: string;
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", color: "#FF9500", icon: <Schedule fontSize="small" /> },
    payment_processing: { label: "Processing Payment", color: "#007AFF", icon: <Schedule fontSize="small" /> },
    confirmed: { label: "Confirmed", color: "#34C759", icon: <CheckCircle fontSize="small" /> },
    processing: { label: "Processing", color: "#007AFF", icon: <Refresh fontSize="small" /> },
    shipped: { label: "Shipped", color: "#5AC8FA", icon: <LocalShipping fontSize="small" /> },
    delivered: { label: "Delivered", color: "#34C759", icon: <CheckCircle fontSize="small" /> },
    completed: { label: "Completed", color: "#34C759", icon: <CheckCircle fontSize="small" /> },
    cancelled: { label: "Cancelled", color: "#FF3B30", icon: <Cancel fontSize="small" /> },
    refund_requested: { label: "Refund Requested", color: "#FF9500", icon: <MoneyOff fontSize="small" /> },
    refunded: { label: "Refunded", color: "#AF52DE", icon: <MoneyOff fontSize="small" /> },
    failed: { label: "Failed", color: "#FF3B30", icon: <Cancel fontSize="small" /> },
};

function formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(price / 100);
}

export default function MyOrdersPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                ...(statusFilter ? { status: statusFilter } : {}),
            });
            const res = await fetch(`/api/shop/orders?${params}`);
            const json = await res.json();
            if (json.success) {
                setOrders(json.data);
                setTotalPages(json.pagination?.pages ?? 1);
            }
        } catch { /* silent */ }
        setLoading(false);
    }, [page, statusFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const statuses = ["All", "pending", "confirmed", "shipped", "completed", "cancelled", "refunded"];

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className={`${isApple ? "text-3xl font-semibold" : "text-4xl font-black"} mb-1`} style={{ color: palette.textPrimary }}>
                        My Orders
                    </h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Track your purchases, download licenses, and manage refunds.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[180px]"
                        style={{ background: cardBg, border, borderRadius: 14 }}
                    >
                        <Search style={{ color: palette.textSecondary, fontSize: 18 }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search orders…"
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: palette.textPrimary }}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {statuses.map(s => (
                            <motion.button
                                key={s}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { setStatusFilter(s === "All" ? "" : s); setPage(1); }}
                                className="px-3 py-2 rounded-xl text-xs font-bold capitalize"
                                style={{
                                    background: (s === "All" && !statusFilter) || s === statusFilter
                                        ? palette.accent
                                        : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: (s === "All" && !statusFilter) || s === statusFilter
                                        ? "#fff"
                                        : palette.textSecondary,
                                }}
                            >
                                {s.replace("_", " ")}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Orders list */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 rounded-2xl animate-pulse"
                                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-24">
                        <Inventory2 style={{ fontSize: 64, color: palette.textTertiary, opacity: 0.3 }} />
                        <p className="mt-4 text-lg font-bold" style={{ color: palette.textSecondary }}>No orders yet</p>
                        <Link href="/shop">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="mt-6 px-6 py-3 rounded-xl font-bold text-white"
                                style={{ background: palette.accent }}
                            >
                                Browse Shop
                            </motion.button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.filter(o => !search || o.orderId.toLowerCase().includes(search.toLowerCase())).map((order, i) => {
                            const cfg = STATUS_CFG[order.status] ?? { label: order.status, color: "#888", icon: <Schedule fontSize="small" /> };
                            return (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="p-5"
                                    style={{ background: cardBg, border, borderRadius: br, backdropFilter: isApple ? "blur(20px)" : "none" }}
                                >
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black" style={{ color: palette.textPrimary }}>{order.orderId}</span>
                                                <span
                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                                                >
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                                {order.items.map(i => `${i.productName} ×${i.quantity}`).join(", ")}
                                            </p>
                                            <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>
                                                Placed {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-xl font-black" style={{ color: palette.textPrimary }}>
                                                {formatPrice(order.total, order.currency)}
                                            </span>
                                            <div className="flex gap-2">
                                                <Link href={`/shop/orders/${order.orderId}`}>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                                                        style={{ background: `${palette.accent}20`, color: palette.accent }}
                                                    >
                                                        View <ArrowForward style={{ fontSize: 14 }} />
                                                    </motion.button>
                                                </Link>
                                                {["confirmed", "processing", "shipped", "delivered", "completed"].includes(order.status) && (
                                                    <Link href={`/support/tickets/new?orderId=${order.orderId}`}>
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            className="px-3 py-1.5 rounded-xl text-xs font-bold"
                                                            style={{ background: "#FF950015", color: "#FF9500" }}
                                                        >
                                                            Refund
                                                        </motion.button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <motion.button
                                key={n}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPage(n)}
                                className="w-10 h-10 rounded-xl text-sm font-bold"
                                style={{
                                    background: n === page ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                                    color: n === page ? "#fff" : palette.textSecondary,
                                }}
                            >
                                {n}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
