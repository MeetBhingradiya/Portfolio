/**
 * Checkout Page
 */
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    ArrowBack,
    Lock,
    CheckCircle,
    LocalShipping,
    CreditCard,
} from "@mui/icons-material";

interface CartItem {
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    productType: string;
    price: number;
    currency: string;
    quantity: number;
}

function formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(price / 100);
}

export default function CheckoutPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const router = useRouter();

    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [hasPhysical, setHasPhysical] = useState(false);

    const [shipping, setShipping] = useState({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
    });
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [customerNote, setCustomerNote] = useState("");

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    useEffect(() => {
        fetch("/api/shop/cart")
            .then(r => r.json())
            .then(j => {
                if (j.success) {
                    const cartItems = j.data?.items ?? [];
                    setItems(cartItems);
                    setHasPhysical(cartItems.some((i: CartItem) => i.productType === "physical"));
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const currency = items[0]?.currency ?? "USD";

    const handlePlaceOrder = async () => {
        setPlacing(true);
        setError("");
        try {
            const body: any = {
                useCart: true,
                paymentMethod,
                customerNote,
            };
            if (hasPhysical) body.shippingAddress = shipping;

            const res = await fetch("/api/shop/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.success) {
                setSuccess(json.data.orderId);
                setTimeout(() => router.push(`/shop/orders/${json.data.orderId}`), 2500);
            } else {
                setError(json.error || "Failed to place order");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setPlacing(false);
    };

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: 12,
        padding: "10px 14px",
        width: "100%",
        outline: "none",
        fontSize: 14,
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: palette.background }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center p-10 rounded-3xl max-w-sm"
                    style={{ background: cardBg, border }}
                >
                    <CheckCircle style={{ fontSize: 72, color: "#34C759" }} />
                    <h2 className="text-2xl font-black mt-4 mb-2" style={{ color: palette.textPrimary }}>
                        Order Placed!
                    </h2>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Order ID: <span className="font-bold">{success}</span>
                    </p>
                    <p className="text-xs mt-2" style={{ color: palette.textTertiary }}>
                        Redirecting to your order…
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/shop/cart">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-xl"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                        >
                            <ArrowBack style={{ color: palette.textSecondary }} />
                        </motion.button>
                    </Link>
                    <h1 className={`${isApple ? "text-3xl font-semibold" : "text-4xl font-black"}`} style={{ color: palette.textPrimary }}>
                        Checkout
                    </h1>
                    <div className="flex items-center gap-1 ml-auto text-xs" style={{ color: palette.textSecondary }}>
                        <Lock style={{ fontSize: 14 }} /> Secure Checkout
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping (only for physical) */}
                        {hasPhysical && (
                            <div
                                className="p-6 space-y-4"
                                style={{ background: cardBg, border, borderRadius: br }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <LocalShipping style={{ color: palette.accent }} />
                                    <h2 className="font-bold" style={{ color: palette.textPrimary }}>Shipping Address</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { label: "Full Name *", key: "fullName" },
                                        { label: "Phone", key: "phone" },
                                        { label: "Address Line 1 *", key: "addressLine1" },
                                        { label: "Address Line 2", key: "addressLine2" },
                                        { label: "City *", key: "city" },
                                        { label: "State *", key: "state" },
                                        { label: "Postal Code *", key: "postalCode" },
                                        { label: "Country *", key: "country" },
                                    ].map(f => (
                                        <div key={f.key} className={f.key === "addressLine1" || f.key === "addressLine2" ? "sm:col-span-2" : ""}>
                                            <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>
                                                {f.label}
                                            </label>
                                            <input
                                                style={inputStyle}
                                                value={(shipping as any)[f.key]}
                                                onChange={e => setShipping(p => ({ ...p, [f.key]: e.target.value }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment */}
                        <div
                            className="p-6 space-y-4"
                            style={{ background: cardBg, border, borderRadius: br }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard style={{ color: palette.accent }} />
                                <h2 className="font-bold" style={{ color: palette.textPrimary }}>Payment Method</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {["card", "upi", "paypal", "crypto"].map(m => (
                                    <motion.button
                                        key={m}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => setPaymentMethod(m)}
                                        className="py-3 rounded-xl text-sm font-bold capitalize"
                                        style={{
                                            background: paymentMethod === m ? `${palette.accent}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                            border: `2px solid ${paymentMethod === m ? palette.accent : "transparent"}`,
                                            color: paymentMethod === m ? palette.accent : palette.textSecondary,
                                        }}
                                    >
                                        {m.toUpperCase()}
                                    </motion.button>
                                ))}
                            </div>
                            <p className="text-xs" style={{ color: palette.textTertiary }}>
                                Payment gateway integration will be wired here (Stripe / Razorpay / PayPal).
                            </p>
                        </div>

                        {/* Note */}
                        <div className="p-6" style={{ background: cardBg, border, borderRadius: br }}>
                            <label className="text-sm font-semibold mb-2 block" style={{ color: palette.textPrimary }}>
                                Order Note (optional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Any special instructions…"
                                style={{ ...inputStyle, resize: "vertical" }}
                                value={customerNote}
                                onChange={e => setCustomerNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div
                        className="h-fit p-6 space-y-4"
                        style={{ background: cardBg, border, borderRadius: br }}
                    >
                        <h2 className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`} style={{ color: palette.textPrimary }}>
                            Order Summary
                        </h2>
                        <div className="space-y-2">
                            {items.map(i => (
                                <div key={`${i.productId}-${i.variantId}`} className="flex justify-between text-sm" style={{ color: palette.textSecondary }}>
                                    <span>{i.productName} × {i.quantity}</span>
                                    <span>{formatPrice(i.price * i.quantity, i.currency)}</span>
                                </div>
                            ))}
                        </div>
                        <div
                            className="pt-4 border-t flex justify-between font-black text-lg"
                            style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: palette.textPrimary }}
                        >
                            <span>Total</span>
                            <span>{formatPrice(subtotal, currency)}</span>
                        </div>

                        {error && (
                            <p className="text-sm text-center py-2 rounded-xl" style={{ background: "#FF3B3015", color: "#FF3B30" }}>
                                {error}
                            </p>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handlePlaceOrder}
                            disabled={placing || loading || items.length === 0}
                            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                            style={{ background: palette.accent, color: "#fff", opacity: placing ? 0.7 : 1 }}
                        >
                            {placing ? "Placing Order…" : "Place Order"}
                        </motion.button>

                        <div className="flex items-center justify-center gap-1 text-xs" style={{ color: palette.textTertiary }}>
                            <Lock style={{ fontSize: 12 }} />
                            <span>256-bit SSL encrypted transaction</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
