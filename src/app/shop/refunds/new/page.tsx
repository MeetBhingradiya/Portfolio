/**
 * Shop — New Refund Request
 * Form to submit a refund request for a specific order.
 * Pre-fills orderId from ?orderId= query param.
 */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { AssignmentReturn, ArrowBack, Check } from "@mui/icons-material";

const REASONS = [
    { value: "not_received", label: "Item Not Received" },
    { value: "damaged", label: "Item Arrived Damaged" },
    { value: "wrong_item", label: "Wrong Item Sent" },
    { value: "not_as_described", label: "Not as Described" },
    { value: "changed_mind", label: "Changed My Mind" },
    { value: "other", label: "Other" },
];

function NewRefundContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preOrderId = searchParams.get("orderId") ?? "";
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [orderId, setOrderId] = useState(preOrderId);
    const [reason, setReason] = useState("not_received");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    };

    const submit = async () => {
        if (!orderId.trim() || !description.trim()) {
            setError("Please fill in all required fields.");
            return;
        }
        setSubmitting(true);
        setError("");
        const res = await fetch("/api/shop/refunds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, reason, description }),
        });
        const json = await res.json();
        if (json.success) {
            setSuccess(true);
        } else {
            setError(json.error ?? "Failed to submit refund request.");
        }
        setSubmitting(false);
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ background: palette.background }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(52,199,89,0.15)" }}
                >
                    <Check style={{ fontSize: 40, color: "#34C759" }} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h2 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"} mb-2`} style={{ color: palette.textPrimary }}>
                        Request Submitted
                    </h2>
                    <p style={{ color: palette.textSecondary }}>
                        We've received your refund request and will review it within 1–3 business days.
                    </p>
                </motion.div>
                <div className="flex gap-3">
                    <Link href="/shop/refunds">
                        <motion.button whileTap={{ scale: 0.96 }} className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: palette.accent, color: "#fff" }}>
                            My Refunds
                        </motion.button>
                    </Link>
                    <Link href="/shop/orders">
                        <motion.button whileTap={{ scale: 0.96 }} className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textPrimary }}>
                            My Orders
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-xl mx-auto">
                <Link href="/shop/orders">
                    <motion.button whileHover={{ x: -3 }} className="flex items-center gap-2 text-sm font-bold mb-8" style={{ color: palette.accent }}>
                        <ArrowBack fontSize="small" /> Back
                    </motion.button>
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <AssignmentReturn style={{ color: palette.accent, fontSize: 28 }} />
                    <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                        Request a Refund
                    </h1>
                </div>

                <div className="p-6 rounded-3xl space-y-5" style={{ background: cardBg, border, backdropFilter: isApple ? "blur(20px)" : "none" }}>
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: palette.textTertiary }}>
                            Order ID *
                        </label>
                        <input
                            value={orderId}
                            onChange={e => setOrderId(e.target.value)}
                            placeholder="ORD-20250001 or MongoDB ID"
                            className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: palette.textTertiary }}>
                            Reason *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {REASONS.map(r => (
                                <motion.button
                                    key={r.value}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setReason(r.value)}
                                    className="px-3 py-2.5 rounded-xl text-sm font-bold text-left"
                                    style={{
                                        background: reason === r.value ? `${palette.accent}18` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                        border: `1px solid ${reason === r.value ? palette.accent + "44" : "transparent"}`,
                                        color: reason === r.value ? palette.accent : palette.textSecondary,
                                    }}
                                >
                                    {r.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: palette.textTertiary }}>
                            Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={5}
                            placeholder="Please describe the issue in detail. Include any relevant photos or order information."
                            className="w-full text-sm px-4 py-3 rounded-xl resize-none outline-none"
                            style={inputStyle}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-center" style={{ color: "#FF3B30" }}>{error}</p>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={submit}
                        disabled={submitting}
                        className="w-full py-3.5 rounded-xl font-black text-base"
                        style={{ background: palette.accent, color: "#fff" }}
                    >
                        {submitting ? "Submitting…" : "Submit Refund Request"}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default function NewRefundPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <NewRefundContent />
        </Suspense>
    );
}
