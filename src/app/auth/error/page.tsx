/**
 * Authentication Error Page
 * Enhanced with dual-theme support
 */

"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import { Error as ErrorIcon, Warning, ArrowBack, Home } from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
        title: "Configuration Error",
        description: "There is a problem with the server configuration. Please contact support."
    },
    AccessDenied: {
        title: "Access Denied",
        description: "You do not have permission to access this resource."
    },
    Verification: {
        title: "Verification Failed",
        description: "The verification link is invalid or has expired."
    },
    Default: {
        title: "Authentication Error",
        description: "An unexpected error occurred during authentication. Please try again."
    }
};

function ErrorContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const searchParams = useSearchParams();

    const [errorType, setErrorType] = useState("Default");
    const [errorInfo, setErrorInfo] = useState(errorMessages.Default);
    const [reason, setReason] = useState("");

    useEffect(() => {
        const error = searchParams.get("error") || "Default";
        const message = searchParams.get("reason") || "";
        setErrorType(error);
        setErrorInfo(errorMessages[error] || errorMessages.Default);
        setReason(message);
    }, [searchParams]);

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-6"
            style={{
                background:
                    isApple && isDark
                        ? `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)`
                        : palette.background
            }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md">
                <Card
                    className={isApple ? "p-8" : "p-10"}
                    intensity={isApple ? "strong" : undefined}
                    elevated={!isApple}>
                    {/* Error Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            delay: 0.2,
                            type: "spring",
                            stiffness: 200
                        }}
                        className="flex justify-center mb-6">
                        <div
                            className={`${isApple ? "p-4 rounded-2xl" : "p-5 rounded-3xl"}`}
                            style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "2px solid rgba(239, 68, 68, 0.3)"
                            }}>
                            {errorType === "AccessDenied" ? (
                                <Warning
                                    style={{
                                        fontSize: 60,
                                        color: "rgb(234, 179, 8)"
                                    }}
                                />
                            ) : (
                                <ErrorIcon
                                    style={{
                                        fontSize: 60,
                                        color: "rgb(239, 68, 68)"
                                    }}
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Error Message */}
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-3`}
                            style={{ color: palette.textPrimary }}>
                            {errorInfo.title}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                            style={{ color: palette.textSecondary }}>
                            {errorInfo.description}
                        </motion.p>
                    </div>

                    {/* Error Code */}
                    {errorType !== "Default" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} mb-6`}
                            style={{
                                background: palette.surfaceSecondary,
                                border: `1px solid ${palette.border}`
                            }}>
                            <p
                                className={`${isApple ? "text-xs" : "text-sm"} font-mono text-center`}
                                style={{ color: palette.textTertiary }}>
                                Error Code: <strong style={{ color: palette.textPrimary }}>{errorType}</strong>
                            </p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-3">
                        <Link href="/auth/signin">
                            <button
                                className={`w-full flex items-center justify-center gap-2 ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl"} font-semibold transition-all hover:opacity-90`}
                                style={{
                                    background: palette.accent,
                                    color: palette.textOnAccent
                                }}>
                                <ArrowBack />
                                <span>Back to Sign In</span>
                            </button>
                        </Link>

                        <Link href="/">
                            <button
                                className={`w-full flex items-center justify-center gap-2 ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl"} font-semibold transition-all`}
                                style={{
                                    background: palette.surfaceSecondary,
                                    color: palette.textPrimary,
                                    border: `2px solid ${palette.border}`
                                }}>
                                <Home />
                                <span>Go to Home</span>
                            </button>
                        </Link>
                    </motion.div>

                    {/* Help Text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-6 text-center">
                        {!!reason && (
                            <p
                                className={`${isApple ? "text-xs" : "text-sm font-medium"} mb-3`}
                                style={{ color: palette.textSecondary }}>
                                {reason}
                            </p>
                        )}
                        <p
                            className={`${isApple ? "text-xs" : "text-sm font-medium"}`}
                            style={{ color: palette.textTertiary }}>
                            If this problem persists, please{" "}
                            <Link
                                href="/contact"
                                className="underline hover:opacity-70"
                                style={{ color: palette.accent }}>
                                contact support
                            </Link>
                        </p>
                    </motion.div>
                </Card>
            </motion.div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse text-white text-xl">Loading...</div>
                </div>
            }>
            <ErrorContent />
        </Suspense>
    );
}
