/**
 * Admin — Orders Management
 * View all orders, update status, add tracking info.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ShoppingBag, Search, Close, Save, LocalShipping } from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

interface Order {
    _id: string;
    orderId: string;
    email: string;
    name: string;
    status: string;
    paymentStatus: string;
    total: number;
    items: { productName: string; variantLabel: string; quantity: number }[];
    createdAt: string;
    trackingNumber?: string;
    trackingUrl?: string;
}

const ORDER_STATUSES = [
    "pending",
    "payment_pending",
    "payment_confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refund_requested",
    "refunded",
    "failed",
    "on_hold"
];

const STATUS_COLORS: Record<string, string> = {
    pending: "#FF9500",
    payment_pending: "#FF9500",
    payment_confirmed: "#007AFF",
    processing: "#007AFF",
    shipped: "#AF52DE",
    delivered: "#34C759",
    cancelled: "#FF3B30",
    refund_requested: "#FF3B30",
    refunded: "#8E8E93",
    failed: "#FF3B30",
    on_hold: "#FF9500"
};

export default function AdminOrdersPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [list, setList] = useState({
        orders: [] as Order[],
        loading: true,
        search: ""
    });
    const patchList = useCallback((p: Partial<typeof list>) => setList((s) => ({ ...s, ...p })), []);
    const [edit, setEdit] = useState<{
        order: Order | null;
        status: string;
        tracking: string;
        trackingUrl: string;
        saving: boolean;
    }>({
        order: null,
        status: "",
        tracking: "",
        trackingUrl: "",
        saving: false
    });
    const patchEdit = useCallback((p: Partial<typeof edit>) => setEdit((s) => ({ ...s, ...p })), []);

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;

    const fetchOrders = useCallback(async () => {
        patchList({ loading: true });
        const res = await fetch("/api/shop/orders?limit=100");
        const json = await res.json();
        if (json.success) patchList({ orders: json.data });
        patchList({ loading: false });
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filtered = list.orders.filter(
        (o) =>
            o.orderId.toLowerCase().includes(list.search.toLowerCase()) ||
            o.email.toLowerCase().includes(list.search.toLowerCase()) ||
            o.name.toLowerCase().includes(list.search.toLowerCase())
    );

    const openEdit = (o: Order) => {
        patchEdit({
            order: o,
            status: o.status,
            tracking: o.trackingNumber ?? "",
            trackingUrl: o.trackingUrl ?? ""
        });
    };

    const save = async () => {
        if (!edit.order) return;
        patchEdit({ saving: true });
        await fetch(`/api/shop/orders/${edit.order._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: edit.status,
                trackingNumber: edit.tracking || undefined,
                trackingUrl: edit.trackingUrl || undefined
            })
        });
        patchEdit({ saving: false, order: null });
        fetchOrders();
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <ShoppingBag style={{ color: palette.accent, fontSize: 32 }} />
                <div>
                    <h1
                        className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`}
                        style={{ color: palette.textPrimary }}>
                        Orders
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        All customer orders
                    </p>
                </div>
            </div>

            <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-5"
                style={{ background: cardBg, border }}>
                <Search style={{ color: palette.textSecondary, fontSize: 18 }} />
                <input
                    value={list.search}
                    onChange={(e) => patchList({ search: e.target.value })}
                    placeholder="Search by order ID or customer…"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: palette.textPrimary }}
                />
            </div>

            {list.loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-24 rounded-2xl animate-pulse"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((o) => (
                        <motion.div
                            key={o._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer"
                            style={{
                                background: cardBg,
                                border,
                                borderRadius: br
                            }}
                            onClick={() => openEdit(o)}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="text-xs font-black font-mono"
                                        style={{ color: palette.accent }}>
                                        {o.orderId}
                                    </span>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                                        style={{
                                            background: `${STATUS_COLORS[o.status] ?? "#8E8E93"}18`,
                                            color: STATUS_COLORS[o.status] ?? "#8E8E93"
                                        }}>
                                        {o.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <p
                                    className="text-sm font-bold truncate"
                                    style={{ color: palette.textPrimary }}>
                                    {o.name} — {o.email}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: palette.textSecondary }}>
                                    {o.items.map((i) => `${i.productName} (${i.quantity}×)`).join(", ")}
                                </p>
                            </div>
                            <div className="text-right">
                                <p
                                    className="font-black text-base"
                                    style={{ color: palette.textPrimary }}>
                                    ${(o.total / 100).toFixed(2)}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: palette.textTertiary }}>
                                    {new Date(o.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                    {filtered.length === 0 && (
                        <div
                            className="text-center py-16"
                            style={{ color: palette.textSecondary }}>
                            No orders found.
                        </div>
                    )}
                </div>
            )}

            {/* Edit Panel */}
            <AnimatePresence>
                {edit.order && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-40"
                            onClick={() => patchEdit({ order: null })}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                                type: "spring",
                                damping: 28,
                                stiffness: 300
                            }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{
                                background: isDark ? "#1c1c20" : "#f5f5f8"
                            }}>
                            <div
                                className="flex items-center justify-between px-6 py-5 border-b"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
                                }}>
                                <div>
                                    <h2
                                        className="font-black text-lg"
                                        style={{ color: palette.textPrimary }}>
                                        {edit.order.orderId}
                                    </h2>
                                    <p
                                        className="text-sm"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        {edit.order.name} · {edit.order.email}
                                    </p>
                                </div>
                                <button onClick={() => patchEdit({ order: null })}>
                                    <Close style={{ color: palette.textSecondary }} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <div>
                                    <p
                                        className="text-xs font-black uppercase tracking-widest mb-2"
                                        style={{ color: palette.textTertiary }}>
                                        Items
                                    </p>
                                    {edit.order.items.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between text-sm py-1">
                                            <span
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {item.productName} — {item.variantLabel}
                                            </span>
                                            <span
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                ×{item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                    <div
                                        className="flex justify-between font-black text-base mt-2 pt-2 border-t"
                                        style={{
                                            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                                            color: palette.textPrimary
                                        }}>
                                        <span>Total</span>
                                        <span>${(edit.order.total / 100).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div>
                                    <p
                                        className="text-xs font-black uppercase tracking-widest mb-2"
                                        style={{ color: palette.textTertiary }}>
                                        Status
                                    </p>
                                    <CustomSelect
                                        value={edit.status}
                                        onChange={(v) => patchEdit({ status: v })}
                                        options={ORDER_STATUSES.map((s) => ({
                                            value: s,
                                            label: s.replace(/_/g, " ")
                                        }))}
                                        placeholder="Select status"
                                    />
                                </div>

                                <div>
                                    <p
                                        className="text-xs font-black uppercase tracking-widest mb-2"
                                        style={{ color: palette.textTertiary }}>
                                        Tracking
                                    </p>
                                    <input
                                        value={edit.tracking}
                                        onChange={(e) =>
                                            patchEdit({
                                                tracking: e.target.value
                                            })
                                        }
                                        placeholder="Tracking number"
                                        className="w-full text-sm px-4 py-2.5 rounded-xl outline-none mb-2"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                            color: palette.textPrimary,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                        }}
                                    />
                                    <input
                                        value={edit.trackingUrl}
                                        onChange={(e) =>
                                            patchEdit({
                                                trackingUrl: e.target.value
                                            })
                                        }
                                        placeholder="Tracking URL"
                                        className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                            color: palette.textPrimary,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                        }}
                                    />
                                </div>
                            </div>

                            <div
                                className="px-6 pb-6 pt-3 border-t"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
                                }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={save}
                                    disabled={edit.saving}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{
                                        background: palette.accent,
                                        color: "#fff"
                                    }}>
                                    <Save fontSize="small" /> {edit.saving ? "Saving…" : "Update Order"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
