/**
 * Forgot Password Page
 * Enhanced with dual-theme support
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import {
    Email,
    Send,
    CheckCircle,
    Error as ErrorIcon,
    ArrowBack
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Link from "next/link";

function ForgotPasswordContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            // TODO: Implement password reset logic
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-6"
            style={{ 
                background: isApple && isDark
                    ? `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)`
                    : palette.background
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* Back Button */}
                <Link href="/auth/signin">
                    <motion.button
                        className={`flex items-center gap-2 mb-6 ${isApple ? "text-sm" : "text-base font-semibold"}`}
                        style={{ color: palette.textSecondary }}
                        whileHover={{ x: -4, opacity: 0.7 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ArrowBack fontSize="small" />
                        <span>Back to Sign In</span>
                    </motion.button>
                </Link>

                <Card
                    className={isApple ? "p-8" : "p-10"}
                    intensity={isApple ? "strong" : undefined}
                    elevated={!isApple}
                >
                    {!success ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <motion.h1
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-2`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Reset Password
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Enter your email to receive a password reset link
                                </motion.p>
                            </div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    >
                                        <div
                                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex items-center gap-3`}
                                            style={{
                                                background: "rgba(239, 68, 68, 0.1)",
                                                border: "1px solid rgba(239, 68, 68, 0.3)"
                                            }}
                                        >
                                            <ErrorIcon style={{ color: "rgb(239, 68, 68)" }} />
                                            <span
                                                className={isApple ? "text-sm" : "text-base font-semibold"}
                                                style={{ color: "rgb(239, 68, 68)" }}
                                            >
                                                {error}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <label
                                        className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Email
                                            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                            style={{ color: palette.textTertiary }}
                                            fontSize="small"
                                        />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                            className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-xl" : "pl-14 pr-5 py-4 rounded-2xl"} outline-none transition-all focus:ring-2`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full flex items-center justify-center gap-2 ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl"} font-semibold transition-all hover:opacity-90`}
                                        style={{
                                            background: loading ? palette.textTertiary : palette.accent,
                                            color: palette.textOnAccent,
                                            cursor: loading ? "not-allowed" : "pointer",
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <div 
                                                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                                                    style={{ borderColor: "#ffffff" }}
                                                />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send />
                                                <span>Send Reset Link</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            </form>
                        </>
                    ) : (
                        /* Success Message */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="mb-6"
                            >
                                <CheckCircle 
                                    style={{ 
                                        fontSize: 80,
                                        color: "rgb(34, 197, 94)"
                                    }} 
                                />
                            </motion.div>
                            <h2
                                className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-3`}
                                style={{ color: palette.textPrimary }}
                            >
                                Check Your Email
                            </h2>
                            <p
                                className={`${isApple ? "text-sm" : "text-base font-medium"} mb-6`}
                                style={{ color: palette.textSecondary }}
                            >
                                We&apos;ve sent a password reset link to <strong>{email}</strong>
                            </p>
                            <Link href="/auth/signin">
                                <button
                                    className={`${isApple ? "px-6 py-3 rounded-xl text-sm" : "px-8 py-4 rounded-2xl text-base"} font-semibold transition-all hover:opacity-90`}
                                    style={{
                                        background: palette.accent,
                                        color: palette.textOnAccent
                                    }}
                                >
                                    Back to Sign In
                                </button>
                            </Link>
                        </motion.div>
                    )}

                    {/* Additional Help */}
                    {!success && (
                        <motion.div 
                            className="mt-6 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <p
                                className={isApple ? "text-sm" : "text-base font-medium"}
                                style={{ color: palette.textSecondary }}
                            >
                                Remember your password?{" "}
                                <Link
                                    href="/auth/signin"
                                    className="font-bold hover:underline transition-opacity hover:opacity-70"
                                    style={{ color: palette.accent }}
                                >
                                    Sign in
                                </Link>
                            </p>
                        </motion.div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordContent />;
}
