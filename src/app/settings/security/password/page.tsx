/**
 * Password Security Page
 * Supports both setting first password and changing existing password.
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks";
import { useAuth, listAccounts, setPassword, changePassword } from "@Library/auth-client";
import { ArrowBack, Warning, Lock, CheckCircle, Password } from "@mui/icons-material";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    const fallback = "Something went wrong. Please try again.";
    if (!error || typeof error !== "object") return fallback;
    const maybeError = error as {
        message?: string;
        error?: { message?: string };
    };
    return maybeError.error?.message || maybeError.message || fallback;
}

export default function SecurityPasswordPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { isAuthenticated } = useAuth();

    const [checkingAccounts, setCheckingAccounts] = useState(true);
    const [hasPassword, setHasPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    useEffect(() => {
        const run = async () => {
            if (!isAuthenticated) {
                setCheckingAccounts(false);
                return;
            }
            setCheckingAccounts(true);
            try {
                const result = await listAccounts();
                const accounts = (result as { data?: Array<{ providerId?: string }> })?.data || [];
                const credentialLinked = accounts.some((acc) => acc.providerId === "credential");
                setHasPassword(credentialLinked);
            } catch {
                setHasPassword(false);
            } finally {
                setCheckingAccounts(false);
            }
        };

        void run();
    }, [isAuthenticated]);

    const passwordMismatch = useMemo(() => confirmPassword.length > 0 && newPassword !== confirmPassword, [newPassword, confirmPassword]);

    const canSubmit =
        !checkingAccounts && !submitting && newPassword.length >= 8 && !passwordMismatch && (!hasPassword || currentPassword.length > 0);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setFeedback(null);

        try {
            if (hasPassword) {
                await changePassword({
                    currentPassword,
                    newPassword,
                    revokeOtherSessions: false
                });
                setFeedback({
                    type: "success",
                    message: "Password changed successfully."
                });
            } else {
                await setPassword({
                    newPassword
                });
                setHasPassword(true);
                setFeedback({
                    type: "success",
                    message: "Password set successfully."
                });
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setFeedback({ type: "error", message: getErrorMessage(error) });
        } finally {
            setSubmitting(false);
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
                        Please sign in to manage your password.
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
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
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
                            <Password
                                className="text-3xl"
                                style={{ color: palette.accent }}
                            />
                        </div>
                        <div>
                            <h1
                                className="text-3xl font-bold"
                                style={{ color: palette.textPrimary }}>
                                Password Settings
                            </h1>
                            <p style={{ color: palette.textSecondary }}>
                                {hasPassword ? "Change your current password" : "Set your first account password"}
                            </p>
                        </div>
                    </div>
                </div>

                <motion.div
                    className="p-6 rounded-2xl"
                    style={{
                        background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
                    }}>
                    {checkingAccounts ? (
                        <p style={{ color: palette.textSecondary }}>Checking password status...</p>
                    ) : (
                        <div className="space-y-4">
                            {hasPassword && (
                                <div>
                                    <label
                                        className="block text-sm font-semibold mb-2"
                                        style={{ color: palette.textPrimary }}>
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl"
                                        style={{
                                            background: palette.background,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                            color: palette.textPrimary
                                        }}
                                        placeholder="Enter current password"
                                    />
                                </div>
                            )}

                            <div>
                                <label
                                    className="block text-sm font-semibold mb-2"
                                    style={{ color: palette.textPrimary }}>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl"
                                    style={{
                                        background: palette.background,
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                        color: palette.textPrimary
                                    }}
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div>
                                <label
                                    className="block text-sm font-semibold mb-2"
                                    style={{ color: palette.textPrimary }}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl"
                                    style={{
                                        background: palette.background,
                                        border: `1px solid ${
                                            passwordMismatch ? "rgba(239,68,68,0.4)" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                                        }`,
                                        color: palette.textPrimary
                                    }}
                                    placeholder="Re-enter new password"
                                />
                                {passwordMismatch && (
                                    <p
                                        className="text-xs mt-1"
                                        style={{ color: "#ef4444" }}>
                                        Passwords do not match.
                                    </p>
                                )}
                            </div>

                            {feedback && (
                                <div
                                    className="p-3 rounded-xl flex items-start gap-2"
                                    style={{
                                        background: feedback.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                        border: `1px solid ${
                                            feedback.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"
                                        }`,
                                        color: feedback.type === "success" ? "#16a34a" : "#dc2626"
                                    }}>
                                    {feedback.type === "success" ? <CheckCircle /> : <Warning />}
                                    <p className="text-sm">{feedback.message}</p>
                                </div>
                            )}

                            <motion.button
                                className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                style={{
                                    background: canSubmit ? palette.accent : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                                    color: canSubmit ? "#ffffff" : palette.textTertiary,
                                    cursor: canSubmit ? "pointer" : "not-allowed"
                                }}
                                whileHover={canSubmit ? { scale: 1.01 } : {}}
                                whileTap={canSubmit ? { scale: 0.99 } : {}}
                                disabled={!canSubmit}
                                onClick={handleSubmit}>
                                <Lock />
                                {submitting ? "Saving..." : hasPassword ? "Change Password" : "Set Password"}
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
