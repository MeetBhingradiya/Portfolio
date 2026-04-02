/**
 * Cart Page
 */
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ShoppingCart, Delete, Add, Remove, ArrowBack, ArrowForward, ShoppingBag } from "@mui/icons-material";

interface CartItem {
    productId: string;
    productName: string;
    thumbnail?: string;
    variantId: string;
    variantName: string;
    productType: string;
    price: number;
    currency: string;
    billingCycle?: string;
    quantity: number;
}

function formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0
    }).format(price / 100);
}

export default function CartPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const router = useRouter();

    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    const fetchCart = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/shop/cart");
            const json = await res.json();
            if (json.success) setItems(json.data?.items ?? []);
        } catch {
            /* silent */
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const updateQuantity = async (productId: string, variantId: string, quantity: number) => {
        const key = `${productId}-${variantId}`;
        setUpdating(key);
        await fetch("/api/shop/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, variantId, quantity })
        });
        await fetchCart();
        setUpdating(null);
    };

    const removeItem = async (productId: string, variantId: string) => {
        setUpdating(`${productId}-${variantId}`);
        await fetch("/api/shop/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, variantId })
        });
        await fetchCart();
        setUpdating(null);
    };

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const currency = items[0]?.currency ?? "USD";

    return (
        <div
            className="min-h-screen py-12 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/shop">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-xl"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"
                            }}>
                            <ArrowBack style={{ color: palette.textSecondary }} />
                        </motion.button>
                    </Link>
                    <h1
                        className={`${isApple ? "text-3xl font-semibold" : "text-4xl font-black"}`}
                        style={{ color: palette.textPrimary }}>
                        Cart
                    </h1>
                    <span
                        className="ml-2 px-3 py-1 rounded-full text-sm font-bold"
                        style={{
                            background: `${palette.accent}20`,
                            color: palette.accent
                        }}>
                        {items.length}
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
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
                ) : items.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24">
                        <ShoppingBag
                            style={{
                                fontSize: 72,
                                color: palette.textTertiary,
                                opacity: 0.3
                            }}
                        />
                        <p
                            className="mt-4 text-xl font-bold"
                            style={{ color: palette.textSecondary }}>
                            Your cart is empty
                        </p>
                        <Link href="/shop">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="mt-6 px-6 py-3 rounded-xl font-bold text-white"
                                style={{ background: palette.accent }}>
                                Browse Products
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <AnimatePresence>
                                {items.map((item) => {
                                    const key = `${item.productId}-${item.variantId}`;
                                    const isUpdating = updating === key;
                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="flex gap-4 p-4"
                                            style={{
                                                background: cardBg,
                                                border,
                                                borderRadius: br,
                                                backdropFilter: isApple ? "blur(20px)" : "none"
                                            }}>
                                            {/* Thumbnail */}
                                            <div
                                                className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
                                                style={{
                                                    background: `${palette.accent}15`
                                                }}>
                                                {item.thumbnail ? (
                                                    <img
                                                        src={item.thumbnail}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <ShoppingCart
                                                        style={{
                                                            color: palette.accent,
                                                            opacity: 0.5
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="font-bold text-sm"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {item.productName}
                                                </p>
                                                <p
                                                    className="text-xs mt-0.5"
                                                    style={{
                                                        color: palette.textSecondary
                                                    }}>
                                                    {item.variantName}
                                                </p>
                                                <p
                                                    className="text-xs capitalize mt-0.5"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    {item.productType}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <p
                                                    className="font-black"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {formatPrice(item.price * item.quantity, item.currency)}
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 0.9
                                                        }}
                                                        disabled={isUpdating}
                                                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)"
                                                        }}>
                                                        <Remove
                                                            style={{
                                                                fontSize: 14,
                                                                color: palette.textSecondary
                                                            }}
                                                        />
                                                    </motion.button>
                                                    <span
                                                        className="w-6 text-center text-sm font-bold"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {item.quantity}
                                                    </span>
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 0.9
                                                        }}
                                                        disabled={isUpdating}
                                                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)"
                                                        }}>
                                                        <Add
                                                            style={{
                                                                fontSize: 14,
                                                                color: palette.textSecondary
                                                            }}
                                                        />
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 0.9
                                                        }}
                                                        disabled={isUpdating}
                                                        onClick={() => removeItem(item.productId, item.variantId)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center ml-1"
                                                        style={{
                                                            background: "#FF3B3020",
                                                            color: "#FF3B30"
                                                        }}>
                                                        <Delete
                                                            style={{
                                                                fontSize: 14
                                                            }}
                                                        />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Summary */}
                        <div
                            className="h-fit p-6 space-y-4"
                            style={{
                                background: cardBg,
                                border,
                                borderRadius: br,
                                backdropFilter: isApple ? "blur(20px)" : "none"
                            }}>
                            <h2
                                className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                Order Summary
                            </h2>
                            <div className="space-y-2">
                                <div
                                    className="flex justify-between text-sm"
                                    style={{ color: palette.textSecondary }}>
                                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                    <span>{formatPrice(subtotal, currency)}</span>
                                </div>
                                <div
                                    className="flex justify-between text-sm"
                                    style={{ color: palette.textSecondary }}>
                                    <span>Tax</span>
                                    <span>Calculated at checkout</span>
                                </div>
                            </div>
                            <div
                                className="pt-4 border-t flex justify-between font-black text-lg"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                                    color: palette.textPrimary
                                }}>
                                <span>Total</span>
                                <span>{formatPrice(subtotal, currency)}</span>
                            </div>
                            <Link href="/shop/checkout">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{
                                        background: palette.accent,
                                        color: "#fff"
                                    }}>
                                    Proceed to Checkout <ArrowForward fontSize="small" />
                                </motion.button>
                            </Link>
                            <Link href="/shop">
                                <button
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                                    style={{ color: palette.textSecondary }}>
                                    Continue Shopping
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
