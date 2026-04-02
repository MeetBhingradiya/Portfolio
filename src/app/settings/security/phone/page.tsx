/**
 * Phone Number Security Page
 * Multi-phone management with OTP verification and primary selection.
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks";
import { useAuth } from "@Library/auth-client";
import { ArrowBack, Warning, PhoneIphone, CheckCircle, MarkEmailUnread, Sms, Star, DeleteOutline } from "@mui/icons-material";

interface PhoneItem {
    _id: string;
    phoneNumber: string;
    verified: boolean;
    isPrimary: boolean;
    createdAt: string;
}

interface Policies {
    maxPhonesPerAccount: number;
    maxAccountsPerPhone: number;
    otpExpiryMinutes: number;
    otpMaxAttempts: number;
}

function normalizePhone(value: string): string {
    return value.replace(/\s+/g, "");
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    if (!error || typeof error !== "object") return "Request failed. Please try again.";
    const maybeError = error as {
        message?: string;
        error?: { message?: string };
    };
    return maybeError.error?.message || maybeError.message || "Request failed. Please try again.";
}

export default function PhoneSecurityPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, isAuthenticated, sendVerificationEmail } = useAuth();

    const [loading, setLoading] = useState(true);
    const [phones, setPhones] = useState<PhoneItem[]>([]);
    const [policies, setPolicies] = useState<Policies>({
        maxPhonesPerAccount: 3,
        maxAccountsPerPhone: 3,
        otpExpiryMinutes: 5,
        otpMaxAttempts: 5
    });

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpTargetPhone, setOtpTargetPhone] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [busyPhoneId, setBusyPhoneId] = useState<string | null>(null);
    const [status, setStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
    const canSendOtp = /^\+[1-9]\d{7,14}$/.test(normalizedPhone) && !sendingOtp && phones.length < policies.maxPhonesPerAccount;
    const canVerify = otp.trim().length >= 4 && /^\+[1-9]\d{7,14}$/.test(otpTargetPhone) && !verifying;

    const loadPhones = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch("/api/security/phones", { method: "GET" });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Failed to load phone list.");
            }
            setPhones(json.data.phones || []);
            setPolicies(json.data.policies || policies);
        } catch (error) {
            setStatus({ type: "error", message: getErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !user?.emailVerified) {
            setLoading(false);
            return;
        }
        void loadPhones();
    }, [isAuthenticated, user?.emailVerified]);

    const handleSendOtp = async () => {
        if (!canSendOtp) return;
        setSendingOtp(true);
        setStatus(null);

        try {
            const res = await fetch("/api/security/phones/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: normalizedPhone })
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Failed to send OTP.");
            }
            setOtpTargetPhone(normalizedPhone);
            setOtp("");
            setStatus({
                type: "success",
                message: `OTP sent to ${normalizedPhone}`
            });
        } catch (error) {
            setStatus({ type: "error", message: getErrorMessage(error) });
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerify = async () => {
        if (!canVerify) return;
        setVerifying(true);
        setStatus(null);
        try {
            const res = await fetch("/api/security/phones/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: otpTargetPhone,
                    code: otp.trim(),
                    makePrimary: phones.length === 0
                })
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Failed to verify phone.");
            }
            setPhones(json.data.phones || []);
            setPhone("");
            setOtp("");
            setOtpTargetPhone("");
            setStatus({
                type: "success",
                message: "Phone number verified and added."
            });
            await loadPhones();
        } catch (error) {
            setStatus({ type: "error", message: getErrorMessage(error) });
        } finally {
            setVerifying(false);
        }
    };

    const handleSetPrimary = async (phoneId: string) => {
        setBusyPhoneId(phoneId);
        setStatus(null);
        try {
            const res = await fetch("/api/security/phones/primary", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneId })
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Failed to update primary phone.");
            }
            setPhones(json.data.phones || []);
            setStatus({ type: "success", message: "Primary phone updated." });
        } catch (error) {
            setStatus({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusyPhoneId(null);
        }
    };

    const handleDelete = async (phoneId: string) => {
        if (!confirm("Remove this phone number from your account?")) return;
        setBusyPhoneId(phoneId);
        setStatus(null);

        try {
            const res = await fetch(`/api/security/phones/${phoneId}`, {
                method: "DELETE"
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Failed to remove phone.");
            }
            setPhones(json.data.phones || []);
            setStatus({ type: "success", message: "Phone removed." });
        } catch (error) {
            setStatus({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusyPhoneId(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <Warning
                        className="text-6xl mb-4"
                        style={{ color: palette.accent }}
                    />
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: palette.textPrimary }}>
                        Authentication Required
                    </h1>
                    <p
                        className="mb-6"
                        style={{ color: palette.textSecondary }}>
                        Please sign in to manage phone numbers.
                    </p>
                    <Link href="/auth/signin">
                        <motion.button
                            className="px-6 py-3 rounded-xl font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#ffffff"
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            Sign In
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!user?.emailVerified) {
        return (
            <div
                className="min-h-screen"
                style={{ background: palette.background }}>
                <div className="max-w-3xl mx-auto px-4 py-8">
                    <Link href="/settings/security">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                color: palette.textPrimary
                            }}>
                            <ArrowBack />
                            <span>Back to Security</span>
                        </motion.button>
                    </Link>

                    <motion.div
                        className="p-6 rounded-2xl"
                        style={{
                            background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                            border: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.2)"}`
                        }}>
                        <div className="flex items-start gap-3">
                            <MarkEmailUnread style={{ color: "#f59e0b" }} />
                            <div>
                                <h2
                                    className="text-xl font-bold mb-2"
                                    style={{ color: "#f59e0b" }}>
                                    Verify Email First
                                </h2>
                                <p
                                    className="text-sm mb-3"
                                    style={{ color: palette.textSecondary }}>
                                    Phone numbers can be added only after your email is verified.
                                </p>
                                <motion.button
                                    className="px-4 py-2 rounded-xl text-sm font-semibold"
                                    style={{
                                        background: palette.accent,
                                        color: "#fff"
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={async () => {
                                        try {
                                            if (!user?.email) {
                                                throw new Error("Missing user email");
                                            }
                                            await sendVerificationEmail({
                                                email: user.email
                                            });
                                            alert("Verification email sent.");
                                        } catch {
                                            alert("Failed to send verification email.");
                                        }
                                    }}>
                                    Resend Verification Email
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen"
            style={{ background: palette.background }}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link href="/settings/security">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                color: palette.textPrimary
                            }}>
                            <ArrowBack />
                            <span>Back to Security</span>
                        </motion.button>
                    </Link>

                    <div className="flex items-center gap-4 mb-2">
                        <div
                            className="p-3 rounded-2xl"
                            style={{ background: `${palette.accent}20` }}>
                            <PhoneIphone
                                className="text-3xl"
                                style={{ color: palette.accent }}
                            />
                        </div>
                        <div>
                            <h1
                                className="text-3xl font-bold"
                                style={{ color: palette.textPrimary }}>
                                Phone Numbers
                            </h1>
                            <p style={{ color: palette.textSecondary }}>Manage multiple verified numbers and choose a primary contact.</p>
                        </div>
                    </div>
                </div>

                <motion.div
                    className="mb-4 p-4 rounded-2xl"
                    style={{
                        background: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)",
                        border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.15)"}`
                    }}>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        Account phones: <strong>{phones.length}</strong> / {policies.maxPhonesPerAccount} • Single phone can be linked to
                        max {policies.maxAccountsPerPhone} accounts.
                    </p>
                </motion.div>

                <motion.div
                    className="p-6 rounded-2xl mb-6"
                    style={{
                        background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
                    }}>
                    <div className="space-y-4">
                        <div>
                            <label
                                className="block text-sm font-semibold mb-2"
                                style={{ color: palette.textPrimary }}>
                                Add New Phone (E.164)
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+14155552671"
                                className="w-full px-4 py-3 rounded-xl"
                                style={{
                                    background: palette.background,
                                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                    color: palette.textPrimary
                                }}
                            />
                        </div>

                        <motion.button
                            className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                            style={{
                                background: canSendOtp ? palette.accent : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                                color: canSendOtp ? "#ffffff" : palette.textTertiary,
                                cursor: canSendOtp ? "pointer" : "not-allowed"
                            }}
                            whileHover={canSendOtp ? { scale: 1.01 } : {}}
                            whileTap={canSendOtp ? { scale: 0.99 } : {}}
                            disabled={!canSendOtp}
                            onClick={handleSendOtp}>
                            <Sms />
                            {sendingOtp ? "Sending OTP..." : "Send OTP"}
                        </motion.button>

                        {otpTargetPhone && (
                            <>
                                <p
                                    className="text-xs"
                                    style={{ color: palette.textSecondary }}>
                                    OTP sent to {otpTargetPhone}. Expires in {policies.otpExpiryMinutes} minutes.
                                </p>
                                <div>
                                    <label
                                        className="block text-sm font-semibold mb-2"
                                        style={{ color: palette.textPrimary }}>
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter verification code"
                                        className="w-full px-4 py-3 rounded-xl"
                                        style={{
                                            background: palette.background,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                            color: palette.textPrimary
                                        }}
                                    />
                                </div>
                                <motion.button
                                    className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                    style={{
                                        background: canVerify ? "#16a34a" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                                        color: canVerify ? "#ffffff" : palette.textTertiary,
                                        cursor: canVerify ? "pointer" : "not-allowed"
                                    }}
                                    whileHover={canVerify ? { scale: 1.01 } : {}}
                                    whileTap={canVerify ? { scale: 0.99 } : {}}
                                    disabled={!canVerify}
                                    onClick={handleVerify}>
                                    <CheckCircle />
                                    {verifying ? "Verifying..." : "Verify and Add Phone"}
                                </motion.button>
                            </>
                        )}
                    </div>
                </motion.div>

                <div className="space-y-3">
                    {loading ? (
                        <p style={{ color: palette.textSecondary }}>Loading phones...</p>
                    ) : phones.length === 0 ? (
                        <motion.div
                            className="p-6 rounded-2xl text-center"
                            style={{
                                background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
                            }}>
                            <p style={{ color: palette.textSecondary }}>No verified phone numbers yet.</p>
                        </motion.div>
                    ) : (
                        phones.map((item) => (
                            <motion.div
                                key={item._id}
                                className="p-4 rounded-2xl"
                                style={{
                                    background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
                                }}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p
                                                className="font-semibold"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {item.phoneNumber}
                                            </p>
                                            {item.isPrimary && (
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{
                                                        background: "#f59e0b20",
                                                        color: "#f59e0b"
                                                    }}>
                                                    Primary
                                                </span>
                                            )}
                                            {item.verified && (
                                                <CheckCircle
                                                    fontSize="small"
                                                    style={{ color: "#16a34a" }}
                                                />
                                            )}
                                        </div>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            Added {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!item.isPrimary && (
                                            <motion.button
                                                className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1"
                                                style={{
                                                    background: `${palette.accent}20`,
                                                    color: palette.accent
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={busyPhoneId === item._id}
                                                onClick={() => handleSetPrimary(item._id)}>
                                                <Star fontSize="small" />
                                                Set Primary
                                            </motion.button>
                                        )}
                                        <motion.button
                                            className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1"
                                            style={{
                                                background: "rgba(239,68,68,0.15)",
                                                color: "#ef4444"
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={busyPhoneId === item._id}
                                            onClick={() => handleDelete(item._id)}>
                                            <DeleteOutline fontSize="small" />
                                            Remove
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {status && (
                    <div
                        className="mt-4 p-3 rounded-xl"
                        style={{
                            background: status.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            border: `1px solid ${status.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                            color: status.type === "success" ? "#16a34a" : "#dc2626"
                        }}>
                        <p className="text-sm">{status.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
