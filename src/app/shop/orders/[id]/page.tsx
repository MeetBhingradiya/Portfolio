/**
 * Shop — Order Detail Page
 * Show full order details, status, tracking, items breakdown.
 * Also provides a "Request Refund" shortcut.
 */
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ArrowBack, LocalShipping, Receipt, AssignmentReturn, OpenInNew } from "@mui/icons-material";

interface OrderItem {
    productName: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Order {
    _id: string;
    orderId: string;
    status: string;
    paymentStatus: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shippingCost: number;
    total: number;
    shippingAddress?: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    trackingNumber?: string;
    trackingUrl?: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
}

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

const TIMELINE_STEPS = ["pending", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    useEffect(() => {
        const load = async () => {
            const res = await fetch(`/api/shop/orders/${id}`);
            const json = await res.json();
            if (json.success) setOrder(json.data);
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div
                    className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    if (!order) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center gap-4"
                style={{ background: palette.background }}>
                <p
                    className="text-xl font-bold"
                    style={{ color: palette.textPrimary }}>
                    Order not found
                </p>
                <Link href="/shop/orders">
                    <motion.button
                        className="px-5 py-2.5 rounded-xl font-bold"
                        style={{ background: palette.accent, color: "#fff" }}>
                        My Orders
                    </motion.button>
                </Link>
            </div>
        );
    }

    const currentStep = TIMELINE_STEPS.indexOf(order.status);

    return (
        <div
            className="min-h-screen py-12 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-3xl mx-auto">
                <Link href="/shop/orders">
                    <motion.button
                        whileHover={{ x: -3 }}
                        className="flex items-center gap-2 text-sm font-bold mb-8"
                        style={{ color: palette.accent }}>
                        <ArrowBack fontSize="small" /> My Orders
                    </motion.button>
                </Link>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className="text-xs font-black font-mono mb-1"
                                style={{ color: palette.accent }}>
                                {order.orderId}
                            </p>
                            <h1
                                className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                Order Details
                            </h1>
                        </div>
                        <span
                            className="px-3 py-1.5 rounded-full text-sm font-black capitalize"
                            style={{
                                background: `${STATUS_COLORS[order.status] ?? "#8E8E93"}18`,
                                color: STATUS_COLORS[order.status] ?? "#8E8E93"
                            }}>
                            {order.status.replace(/_/g, " ")}
                        </span>
                    </div>
                    <p
                        className="text-sm mt-1"
                        style={{ color: palette.textSecondary }}>
                        Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                </motion.div>

                {/* Timeline (only for physical flow) */}
                {TIMELINE_STEPS.includes(order.status) && (
                    <div className="flex items-center mb-8 px-2">
                        {TIMELINE_STEPS.map((step, i) => (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                                        style={{
                                            background:
                                                i <= currentStep ? palette.accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                            color: i <= currentStep ? "#fff" : palette.textTertiary
                                        }}>
                                        {i + 1}
                                    </div>
                                    <p
                                        className="text-xs mt-1.5 capitalize font-semibold text-center"
                                        style={{
                                            color: i <= currentStep ? palette.textPrimary : palette.textTertiary
                                        }}>
                                        {step}
                                    </p>
                                </div>
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <div
                                        className="flex-1 h-1 mx-2 rounded"
                                        style={{
                                            background:
                                                i < currentStep ? palette.accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Tracking */}
                {order.trackingNumber && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-4"
                        style={{
                            background: `${palette.accent}10`,
                            border: `1px solid ${palette.accent}30`
                        }}>
                        <LocalShipping style={{ color: palette.accent }} />
                        <div className="flex-1">
                            <p
                                className="font-bold text-sm"
                                style={{ color: palette.textPrimary }}>
                                Tracking Number
                            </p>
                            <p
                                className="text-sm font-mono"
                                style={{ color: palette.accent }}>
                                {order.trackingNumber}
                            </p>
                        </div>
                        {order.trackingUrl && (
                            <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noreferrer">
                                <OpenInNew style={{ color: palette.accent }} />
                            </a>
                        )}
                    </motion.div>
                )}

                <div className="space-y-4">
                    {/* Items */}
                    <div
                        className="p-6 rounded-3xl"
                        style={{
                            background: cardBg,
                            border,
                            backdropFilter: isApple ? "blur(20px)" : "none"
                        }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Receipt style={{ color: palette.accent }} />
                            <p
                                className="font-black"
                                style={{ color: palette.textPrimary }}>
                                Items
                            </p>
                        </div>
                        <div className="space-y-3">
                            {order.items.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between">
                                    <div>
                                        <p
                                            className="font-bold text-sm"
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {item.productName}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            {item.variantLabel} × {item.quantity}
                                        </p>
                                    </div>
                                    <p
                                        className="font-black text-sm"
                                        style={{ color: palette.textPrimary }}>
                                        ${(item.totalPrice / 100).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div
                            className="mt-4 pt-4 space-y-1.5 border-t"
                            style={{
                                borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
                            }}>
                            {[
                                ["Subtotal", order.subtotal],
                                ["Shipping", order.shippingCost],
                                ["Tax", order.tax],
                                ...(order.discount > 0 ? [["Discount", -order.discount]] : [])
                            ].map(([label, val]) => (
                                <div
                                    key={label as string}
                                    className="flex justify-between text-sm">
                                    <span
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        {label}
                                    </span>
                                    <span style={{ color: palette.textPrimary }}>${((val as number) / 100).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-black pt-2 text-base">
                                <span style={{ color: palette.textPrimary }}>Total</span>
                                <span style={{ color: palette.accent }}>${(order.total / 100).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                        <div
                            className="p-6 rounded-3xl"
                            style={{
                                background: cardBg,
                                border,
                                backdropFilter: isApple ? "blur(20px)" : "none"
                            }}>
                            <p
                                className="font-black mb-3"
                                style={{ color: palette.textPrimary }}>
                                Shipping Address
                            </p>
                            <div
                                className="text-sm space-y-0.5"
                                style={{ color: palette.textSecondary }}>
                                <p
                                    className="font-bold"
                                    style={{ color: palette.textPrimary }}>
                                    {order.shippingAddress.fullName}
                                </p>
                                <p>{order.shippingAddress.addressLine1}</p>
                                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                <p>
                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                </p>
                                <p>{order.shippingAddress.country}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {!["cancelled", "refunded", "refund_requested", "failed"].includes(order.status) && (
                        <Link href={`/shop/refunds/new?orderId=${order._id}`}>
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer"
                                style={{
                                    background: "rgba(255,59,48,0.08)",
                                    border: "1px solid rgba(255,59,48,0.15)"
                                }}>
                                <AssignmentReturn style={{ color: "#FF3B30" }} />
                                <div>
                                    <p
                                        className="font-bold text-sm"
                                        style={{ color: "#FF3B30" }}>
                                        Request a Refund
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Having trouble? We're here to help.
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
