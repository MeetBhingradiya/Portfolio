/**
 * New Ticket Page
 */
"use client";

import React, { useState, Suspense } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ArrowBack, Send, ConfirmationNumber } from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

const CATEGORIES = [
    { value: "general", label: "General Inquiry" },
    { value: "billing", label: "Billing & Payments" },
    { value: "technical", label: "Technical Support" },
    { value: "order", label: "Order Issue" },
    { value: "refund", label: "Refund Request" },
    { value: "account", label: "Account & Access" },
    { value: "other", label: "Other" }
];

const PRIORITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" }
];

function NewTicketContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillOrderId = searchParams.get("orderId") || "";

    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        category: prefillOrderId ? "order" : "general",
        priority: "medium",
        description: prefillOrderId ? `I need help with my order: ${prefillOrderId}` : "",
        orderId: prefillOrderId
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;
    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: 12,
        padding: "10px 14px",
        width: "100%",
        outline: "none",
        fontSize: 14
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.description.trim()) {
            setError("Subject and description are required.");
            return;
        }
        if (!form.name.trim() || !form.email.trim()) {
            setError("Name and email are required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (json.success) {
                if (json.data?.accessSecret && typeof window !== "undefined") {
                    localStorage.setItem(`support-ticket-secret:${json.data.ticketId}`, json.data.accessSecret);
                }
                router.push(`/support/tickets/${json.data.ticketId}`);
            } else {
                setError(json.error || "Failed to create ticket");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div
            className="min-h-screen py-12 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/support/tickets">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-xl"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"
                            }}>
                            <ArrowBack style={{ color: palette.textSecondary }} />
                        </motion.button>
                    </Link>
                    <div>
                        <h1
                            className={`${isApple ? "text-3xl font-semibold" : "text-4xl font-black"}`}
                            style={{ color: palette.textPrimary }}>
                            Open a Ticket
                        </h1>
                        <p
                            className="text-sm mt-0.5"
                            style={{ color: palette.textSecondary }}>
                            We typically respond within 24 hours.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div
                        className="p-6 space-y-5"
                        style={{
                            background: cardBg,
                            border,
                            borderRadius: br,
                            backdropFilter: isApple ? "blur(20px)" : "none"
                        }}>
                        {/* Subject */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label
                                    className="text-sm font-bold mb-1.5 block"
                                    style={{ color: palette.textPrimary }}>
                                    Name *
                                </label>
                                <input
                                    style={inputStyle}
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            name: e.target.value
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    className="text-sm font-bold mb-1.5 block"
                                    style={{ color: palette.textPrimary }}>
                                    Email *
                                </label>
                                <input
                                    style={inputStyle}
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            email: e.target.value
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                className="text-sm font-bold mb-1.5 block"
                                style={{ color: palette.textPrimary }}>
                                Subject *
                            </label>
                            <input
                                style={inputStyle}
                                placeholder="Brief description of your issue"
                                value={form.subject}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        subject: e.target.value
                                    }))
                                }
                                maxLength={200}
                            />
                        </div>

                        {/* Category & Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label
                                    className="text-sm font-bold mb-1.5 block"
                                    style={{ color: palette.textPrimary }}>
                                    Category
                                </label>
                                <CustomSelect
                                    value={form.category}
                                    onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                                    options={CATEGORIES}
                                    placeholder="Select Category"
                                />
                            </div>
                            <div>
                                <label
                                    className="text-sm font-bold mb-1.5 block"
                                    style={{ color: palette.textPrimary }}>
                                    Priority
                                </label>
                                <div className="flex gap-2">
                                    {PRIORITIES.map((p) => (
                                        <motion.button
                                            key={p.value}
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    priority: p.value
                                                }))
                                            }
                                            className="flex-1 py-2.5 rounded-xl text-xs font-bold capitalize"
                                            style={{
                                                background:
                                                    form.priority === p.value
                                                        ? `${palette.accent}22`
                                                        : isDark
                                                          ? "rgba(255,255,255,0.05)"
                                                          : "rgba(0,0,0,0.04)",
                                                border: `1.5px solid ${form.priority === p.value ? palette.accent : "transparent"}`,
                                                color: form.priority === p.value ? palette.accent : palette.textSecondary
                                            }}>
                                            {p.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order ID (optional) */}
                        <div>
                            <label
                                className="text-sm font-bold mb-1.5 block"
                                style={{ color: palette.textPrimary }}>
                                Order ID{" "}
                                <span
                                    style={{
                                        color: palette.textTertiary,
                                        fontWeight: 400
                                    }}>
                                    (if related to an order)
                                </span>
                            </label>
                            <input
                                style={inputStyle}
                                placeholder="ORD-20250001"
                                value={form.orderId}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        orderId: e.target.value
                                    }))
                                }
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                className="text-sm font-bold mb-1.5 block"
                                style={{ color: palette.textPrimary }}>
                                Description *
                            </label>
                            <textarea
                                rows={6}
                                style={{ ...inputStyle, resize: "vertical" }}
                                placeholder="Describe your issue in detail. Include any error messages, steps you've tried, etc."
                                value={form.description}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        description: e.target.value
                                    }))
                                }
                            />
                        </div>

                        {error && (
                            <p
                                className="text-sm py-2.5 px-4 rounded-xl"
                                style={{
                                    background: "#FF3B3015",
                                    color: "#FF3B30"
                                }}>
                                {error}
                            </p>
                        )}

                        <motion.button
                            type="submit"
                            whileTap={{ scale: 0.97 }}
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                            style={{
                                background: palette.accent,
                                color: "#fff",
                                opacity: loading ? 0.7 : 1
                            }}>
                            {loading ? (
                                "Submitting…"
                            ) : (
                                <>
                                    <Send fontSize="small" /> Submit Ticket
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NewTicketPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <NewTicketContent />
        </Suspense>
    );
}
