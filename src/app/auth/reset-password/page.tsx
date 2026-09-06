"use client";

import React, { Suspense, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Error as ErrorIcon, LockReset, ArrowBack } from "@mui/icons-material";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import { resetPassword } from "@Library/auth-client";

function ResetPasswordContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Missing reset token. Please use the link from your email again.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await resetPassword({
                token,
                newPassword
            });
            setSuccess(true);
            setTimeout(() => {
                router.push("/auth/signin");
            }, 2000);
        } catch (err: any) {
            setError(err?.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-6"
            style={{
                background: isDark ? `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)` : palette.background
            }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md">
                <Link href="/auth/signin">
                    <motion.button
                        className={`flex items-center gap-2 mb-6 ${isApple ? "text-sm" : "text-base font-semibold"}`}
                        style={{ color: palette.textSecondary }}
                        whileHover={{ x: -4, opacity: 0.7 }}
                        transition={{ duration: 0.2 }}>
                        <ArrowBack fontSize="small" />
                        <span>Back to Sign In</span>
                    </motion.button>
                </Link>

                <Card className={isApple ? "p-8" : "p-10"} intensity={isApple ? "strong" : undefined} elevated={!isApple}>
                    {!success ? (
                        <>
                            <div className="text-center mb-8">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.05 }}
                                    className="mb-4 inline-flex items-center justify-center rounded-2xl p-4"
                                    style={{ background: `${palette.accent}20` }}>
                                    <LockReset style={{ color: palette.accent, fontSize: 36 }} />
                                </motion.div>
                                <h1
                                    className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-2`}
                                    style={{ color: palette.textPrimary }}>
                                    Reset Password
                                </h1>
                                <p className={isApple ? "text-sm" : "text-base font-medium"} style={{ color: palette.textSecondary }}>
                                    Choose a new password to secure your account.
                                </p>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}>
                                        <div
                                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex items-center gap-3`}
                                            style={{
                                                background: "rgba(239, 68, 68, 0.1)",
                                                border: "1px solid rgba(239, 68, 68, 0.3)"
                                            }}>
                                            <ErrorIcon style={{ color: "rgb(239, 68, 68)" }} />
                                            <span className={isApple ? "text-sm" : "text-base font-semibold"} style={{ color: "rgb(239, 68, 68)" }}>
                                                {error}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`} style={{ color: palette.textSecondary }}>
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={loading}
                                        className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all focus:ring-2`}
                                        style={{
                                            background: palette.surfaceSecondary,
                                            color: palette.textPrimary,
                                            border: `2px solid ${palette.border}`
                                        }}
                                        placeholder="Enter a new password"
                                        autoComplete="new-password"
                                        minLength={8}
                                    />
                                </div>

                                <div>
                                    <label className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`} style={{ color: palette.textSecondary }}>
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                        className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all focus:ring-2`}
                                        style={{
                                            background: palette.surfaceSecondary,
                                            color: palette.textPrimary,
                                            border: `2px solid ${palette.border}`
                                        }}
                                        placeholder="Re-enter your new password"
                                        autoComplete="new-password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className={`w-full flex items-center justify-center gap-2 ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl"} font-semibold transition-all hover:opacity-90`}
                                    style={{
                                        background: loading || !token ? palette.textTertiary : palette.accent,
                                        color: palette.textOnAccent,
                                        cursor: loading || !token ? "not-allowed" : "pointer",
                                        opacity: loading || !token ? 0.6 : 1
                                    }}>
                                    {loading ? "Updating..." : "Update Password"}
                                </button>
                            </form>

                            {!token && (
                                <p className="mt-4 text-sm text-center" style={{ color: palette.textSecondary }}>
                                    No token was found in the URL. Open the reset link from your email again.
                                </p>
                            )}
                        </>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                            <div className="mb-6">
                                <CheckCircle style={{ fontSize: 80, color: "rgb(34, 197, 94)" }} />
                            </div>
                            <h2 className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-3`} style={{ color: palette.textPrimary }}>
                                Password Updated
                            </h2>
                            <p className={`${isApple ? "text-sm" : "text-base font-medium"} mb-6`} style={{ color: palette.textSecondary }}>
                                Your password was reset successfully. Redirecting you to sign in.
                            </p>
                            <Link href="/auth/signin">
                                <button
                                    className={`${isApple ? "px-6 py-3 rounded-xl text-sm" : "px-8 py-4 rounded-2xl text-base"} font-semibold transition-all hover:opacity-90`}
                                    style={{ background: palette.accent, color: palette.textOnAccent }}>
                                    Sign In
                                </button>
                            </Link>
                        </motion.div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordContent />
        </Suspense>
    );
}
