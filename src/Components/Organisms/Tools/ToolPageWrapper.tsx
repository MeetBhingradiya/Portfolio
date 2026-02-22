/**
 * ToolPageWrapper — shared chrome for every tool page
 * Provides consistent header, back-navigation, background decorations,
 * and adapts to Apple Liquid Glass / Samsung One UI 7 design themes.
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks";
import { ArrowBack } from "@mui/icons-material";

interface ToolPageWrapperProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    accentColor: string;
    children: React.ReactNode;
    /** Extra actions rendered to the right of title bar */
    actions?: React.ReactNode;
}

const ToolPageWrapper: React.FC<ToolPageWrapperProps> = ({
    title,
    description,
    icon,
    accentColor,
    children,
    actions
}) => {
    const { designTheme, palette, actualColorMode, accentColor: themeAccent } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    return (
        <div className="min-h-screen" style={{ background: palette.background }}>
            {/* ── Background decorations ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                {isApple ? (
                    <>
                        <motion.div
                            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
                                filter: "blur(60px)"
                            }}
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)`,
                                filter: "blur(80px)"
                            }}
                            animate={{ scale: [1.08, 1, 1.08] }}
                            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                        />
                    </>
                ) : (
                    <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                            backgroundImage: `linear-gradient(${isDark ? "#fff" : "#000"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "#fff" : "#000"} 1px, transparent 1px)`,
                            backgroundSize: "48px 48px"
                        }}
                    />
                )}
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-10">
                {/* ── Header ── */}
                <motion.div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex items-center gap-4">
                        <Link
                            href="/tools"
                            className="flex items-center justify-center rounded-full transition-all"
                            style={{
                                width: 40,
                                height: 40,
                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                color: palette.textSecondary,
                                borderRadius: isApple ? "12px" : "16px"
                            }}
                        >
                            <ArrowBack sx={{ fontSize: 20 }} />
                        </Link>

                        <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                                width: 48,
                                height: 48,
                                background: isApple
                                    ? `${accentColor}22`
                                    : `linear-gradient(135deg, ${accentColor}25, ${accentColor}12)`,
                                border: `1.5px solid ${accentColor}35`,
                                color: accentColor,
                                borderRadius: isApple ? "14px" : "18px"
                            }}
                        >
                            {icon}
                        </div>

                        <div>
                            <h1
                                className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} leading-none`}
                                style={{ color: palette.textPrimary }}
                            >
                                {title}
                            </h1>
                            <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                                {description}
                            </p>
                        </div>
                    </div>

                    {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
                </motion.div>

                {/* ── Tool body ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                >
                    {children}
                </motion.div>

                <div className="h-16" />
            </div>
        </div>
    );
};

export default ToolPageWrapper;
