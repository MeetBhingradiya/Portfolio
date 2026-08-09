"use client";

import React, { useState, Suspense, useEffect } from "react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ConfirmationNumber, ArrowBack, Send, VpnKey, LockClock } from "@mui/icons-material";
import Link from "next/link";

function LookupContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    
    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    const [step, setStep] = useState<"creds" | "otp">("creds");
    const [ticketId, setTicketId] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const tId = searchParams.get("ticketId");
        if (tId) setTicketId(tId);
    }, [searchParams]);

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: 12,
        padding: "12px 16px",
        width: "100%",
        outline: "none",
        fontSize: 14
    };

    const handleCredsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!ticketId || !secretCode) {
            setError("Ticket ID and Secret Code are required.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/support/tickets/access/${encodeURIComponent(ticketId)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secretCode })
            });
            const json = await res.json();
            if (json.success) {
                setStep("otp");
            } else {
                setError(json.error || "Failed to initiate access.");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!otp) {
            setError("OTP is required.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/support/tickets/access/${encodeURIComponent(ticketId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secretCode, otp })
            });
            const json = await res.json();
            if (json.success) {
                // Store secret and access token for guest viewing
                if (typeof window !== "undefined") {
                    localStorage.setItem(`support-ticket-secret:${json.data.ticketId}`, secretCode);
                    localStorage.setItem(`support-ticket-token:${json.data.ticketId}`, json.data.accessToken);
                }
                router.push(`/support/tickets/${json.data.ticketId}`);
            } else {
                setError(json.error || "Invalid OTP.");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/support/tickets">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-xl"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}>
                            <ArrowBack style={{ color: palette.textSecondary }} />
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                            Track Ticket
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>
                            Access your support ticket securely.
                        </p>
                    </div>
                </div>

                <div
                    className="p-6 md:p-8"
                    style={{
                        background: cardBg,
                        border,
                        borderRadius: br,
                        backdropFilter: isApple ? "blur(20px)" : "none"
                    }}>
                    
                    {error && (
                        <div className="mb-6 p-4 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}>
                            {error}
                        </div>
                    )}

                    {step === "creds" ? (
                        <form onSubmit={handleCredsSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-bold mb-1.5 block" style={{ color: palette.textPrimary }}>Ticket ID</label>
                                <input
                                    style={inputStyle}
                                    placeholder="e.g. TKT-00001"
                                    value={ticketId}
                                    onChange={(e) => setTicketId(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold mb-1.5 block" style={{ color: palette.textPrimary }}>Secret Code</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        placeholder="Enter the secret code from your email"
                                        value={secretCode}
                                        onChange={(e) => setSecretCode(e.target.value)}
                                    />
                                    <VpnKey className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30" style={{ color: palette.textPrimary }} />
                                </div>
                            </div>
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.96 }}
                                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
                                style={{ background: palette.accent, color: "#fff", opacity: loading ? 0.7 : 1 }}>
                                {loading ? "Verifying..." : "Continue"} <Send fontSize="small" />
                            </motion.button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpSubmit} className="space-y-5">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${palette.accent}22`, color: palette.accent }}>
                                    <LockClock />
                                </div>
                                <h3 className="text-lg font-bold" style={{ color: palette.textPrimary }}>Verify Access</h3>
                                <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>We've sent a 6-digit OTP to your email address.</p>
                            </div>
                            <div>
                                <label className="text-sm font-bold mb-1.5 block" style={{ color: palette.textPrimary }}>6-Digit OTP</label>
                                <input
                                    style={{ ...inputStyle, textAlign: "center", fontSize: "20px", letterSpacing: "4px" }}
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>
                            <motion.button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                whileTap={{ scale: 0.96 }}
                                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center mt-4"
                                style={{ background: palette.accent, color: "#fff", opacity: (loading || otp.length !== 6) ? 0.7 : 1 }}>
                                {loading ? "Opening..." : "Unlock Ticket"}
                            </motion.button>
                            <button
                                type="button"
                                onClick={() => setStep("creds")}
                                className="w-full mt-3 text-sm font-semibold"
                                style={{ color: palette.textSecondary }}>
                                Back
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TicketLookupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LookupContent />
        </Suspense>
    );
}
