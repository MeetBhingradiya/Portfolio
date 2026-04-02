/**
 * Apple Liquid Glass Components
 * Implements Apple's Liquid Glass design language with depth, fluidity, and dynamic lighting
 * NOT glassmorphism - this is the new liquid glass effect
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";

interface LiquidGlassCardProps {
    children: React.ReactNode;
    className?: string;
    intensity?: "subtle" | "medium" | "strong";
    enableTilt?: boolean;
    enableGlow?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
    children,
    className = "",
    intensity = "medium",
    enableTilt = true,
    enableGlow = true
}) => {
    const { palette, actualColorMode } = useDesignTheme();
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), {
        stiffness: 150,
        damping: 25
    });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), {
        stiffness: 150,
        damping: 25
    });

    const isDark = actualColorMode === "dark";

    const intensityConfig = React.useMemo(
        () => ({
            subtle: {
                blur: 40,
                saturation: 180,
                brightness: 1.05,
                opacity: isDark ? 0.65 : 0.6
            },
            medium: {
                blur: 50,
                saturation: 200,
                brightness: 1.1,
                opacity: isDark ? 0.72 : 0.68
            },
            strong: {
                blur: 60,
                saturation: 220,
                brightness: 1.15,
                opacity: isDark ? 0.8 : 0.75
            }
        }),
        [isDark]
    );

    const config = intensityConfig[intensity];

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = (e.clientX - centerX) / rect.width;
        const y = (e.clientY - centerY) / rect.height;

        setMousePos({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        });

        if (enableTilt) {
            mouseX.set(x);
            mouseY.set(y);
        }
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setMousePos({ x: 0.5, y: 0.5 });
    };

    return (
        <motion.div
            ref={cardRef}
            className={`liquid-glass-card relative ${className}`}
            style={{
                backdropFilter: `blur(${config.blur}px) saturate(${config.saturation}%) brightness(${config.brightness})`,
                WebkitBackdropFilter: `blur(${config.blur}px) saturate(${config.saturation}%) brightness(${config.brightness})`,
                background: isDark
                    ? `linear-gradient(180deg, rgba(44, 44, 46, ${config.opacity}) 0%, rgba(36, 36, 38, ${config.opacity - 0.05}) 50%, rgba(28, 28, 30, ${config.opacity}) 100%)`
                    : `linear-gradient(180deg, rgba(255, 255, 255, ${config.opacity}) 0%, rgba(252, 252, 252, ${config.opacity - 0.05}) 50%, rgba(250, 250, 250, ${config.opacity}) 100%)`,
                border: isDark ? "0.5px solid rgba(255, 255, 255, 0.18)" : "0.5px solid rgba(255, 255, 255, 0.8)",
                borderRadius: "20px",
                padding: "24px",
                overflow: "hidden",
                transformStyle: "preserve-3d",
                rotateX: enableTilt ? rotateX : 0,
                rotateY: enableTilt ? rotateY : 0,
                boxShadow: isDark
                    ? "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.12) inset, 0 -1px 2px 0 rgba(0, 0, 0, 0.3) inset"
                    : "0 10px 40px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(255, 255, 255, 1) inset, 0 2px 4px 0 rgba(255, 255, 255, 1) inset, 0 -1px 2px 0 rgba(0, 0, 0, 0.05) inset"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3, ease: "easeOut" }}>
            {/* Top glass reflection */}
            <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                    height: "35%",
                    background: isDark
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 100%)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.3) 40%, transparent 100%)",
                    borderRadius: "20px 20px 50% 50% / 20px 20px 10% 10%",
                    mixBlendMode: isDark ? "screen" : "overlay"
                }}
            />

            {/* Dynamic specular highlight */}
            {enableGlow && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: `${mousePos.y * 100}%`,
                        left: `${mousePos.x * 100}%`,
                        width: "200px",
                        height: "200px",
                        transform: "translate(-50%, -50%)",
                        background: isDark
                            ? `radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%)`
                            : `radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 30%, transparent 60%)`,
                        filter: "blur(20px)",
                        pointerEvents: "none"
                    }}
                />
            )}

            {/* Accent glow on hover */}
            {enableGlow && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.15 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${palette.accent} 0%, transparent 60%)`,
                        mixBlendMode: "screen"
                    }}
                />
            )}

            {/* Bottom depth shadow */}
            <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                    height: "25%",
                    background: isDark
                        ? "linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.05) 50%, transparent 100%)"
                        : "linear-gradient(0deg, rgba(0, 0, 0, 0.02) 0%, transparent 100%)",
                    borderRadius: "0 0 20px 20px"
                }}
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

interface LiquidGlassButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    icon
}) => {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    const sizeStyles = {
        sm: "px-5 py-2.5 text-sm",
        md: "px-7 py-3.5 text-base",
        lg: "px-9 py-4.5 text-lg"
    };

    const variantStyles = React.useMemo(
        () => ({
            primary: {
                background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark || palette.accent} 100%)`,
                color: "#FFFFFF",
                border: "none",
                backdropFilter: "none",
                boxShadow: isDark
                    ? `0 8px 24px ${palette.accent}40, 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 0.5px ${palette.accent}50 inset`
                    : `0 6px 20px ${palette.accent}35, 0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 0.5px ${palette.accent}40 inset`
            },
            secondary: {
                background: isDark
                    ? "linear-gradient(180deg, rgba(58, 58, 60, 0.7) 0%, rgba(44, 44, 46, 0.65) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 250, 0.65) 100%)",
                color: palette.textPrimary,
                border: isDark ? "0.5px solid rgba(255, 255, 255, 0.18)" : "0.5px solid rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(30px) saturate(200%)",
                WebkitBackdropFilter: "blur(30px) saturate(200%)",
                boxShadow: isDark
                    ? "0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset, 0 1px 0 rgba(255, 255, 255, 0.12) inset"
                    : "0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 1) inset, 0 1px 2px rgba(255, 255, 255, 1) inset"
            },
            ghost: {
                background: "transparent",
                color: palette.accent,
                border: `1px solid ${palette.accent}40`,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "none"
            }
        }),
        [palette, isDark]
    );

    return (
        <motion.button
            className={`liquid-glass-button relative overflow-hidden ${sizeStyles[size]} ${className} rounded-full font-semibold inline-flex items-center justify-center gap-2.5`}
            style={variantStyles[variant]}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}>
            {/* Glass reflection overlay */}
            {variant !== "ghost" && (
                <>
                    <div
                        className="absolute inset-x-0 top-0 pointer-events-none"
                        style={{
                            height: "50%",
                            background:
                                variant === "primary"
                                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)"
                                    : isDark
                                      ? "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 50%, transparent 100%)"
                                      : "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
                            mixBlendMode: variant === "primary" ? "overlay" : isDark ? "screen" : "overlay"
                        }}
                    />
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: "20%",
                            left: "30%",
                            width: "40%",
                            height: "30%",
                            background:
                                variant === "primary"
                                    ? "radial-gradient(ellipse, rgba(255, 255, 255, 0.3) 0%, transparent 70%)"
                                    : isDark
                                      ? "radial-gradient(ellipse, rgba(255, 255, 255, 0.1) 0%, transparent 70%)"
                                      : "radial-gradient(ellipse, rgba(255, 255, 255, 0.6) 0%, transparent 70%)",
                            filter: "blur(8px)",
                            borderRadius: "50%"
                        }}
                    />
                </>
            )}

            {/* Content */}
            <span className="relative z-10 inline-flex items-center gap-2.5">
                {icon && <span className="icon">{icon}</span>}
                {children}
            </span>
        </motion.button>
    );
};

interface LiquidGlassNavProps {
    children: React.ReactNode;
    className?: string;
    sticky?: boolean;
}

export const LiquidGlassNav: React.FC<LiquidGlassNavProps> = ({ children, className = "", sticky = true }) => {
    const { palette, actualColorMode } = useDesignTheme();
    const [scrolled, setScrolled] = useState(false);
    const isDark = actualColorMode === "dark";

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navStyles = React.useMemo(
        () => ({
            backdropFilter: scrolled ? "blur(60px) saturate(200%) brightness(1.05)" : "blur(30px) saturate(180%)",
            WebkitBackdropFilter: scrolled ? "blur(60px) saturate(200%) brightness(1.05)" : "blur(30px) saturate(180%)",
            background: scrolled
                ? isDark
                    ? "linear-gradient(180deg, rgba(28, 28, 30, 0.85) 0%, rgba(20, 20, 22, 0.8) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(250, 250, 250, 0.8) 100%)"
                : isDark
                  ? "linear-gradient(180deg, rgba(28, 28, 30, 0.65) 0%, rgba(20, 20, 22, 0.6) 100%)"
                  : "linear-gradient(180deg, rgba(255, 255, 255, 0.65) 0%, rgba(250, 250, 250, 0.6) 100%)",
            borderBottom: scrolled
                ? isDark
                    ? "0.5px solid rgba(255, 255, 255, 0.15)"
                    : "0.5px solid rgba(0, 0, 0, 0.08)"
                : "0.5px solid transparent",
            boxShadow: scrolled
                ? isDark
                    ? "0 8px 32px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.08) inset"
                    : "0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.9) inset"
                : "none"
        }),
        [scrolled, isDark]
    );

    return (
        <motion.nav
            className={`liquid-glass-nav relative ${sticky ? "sticky top-0" : ""} ${className} z-50`}
            style={navStyles}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}>
            {/* Top glass reflection */}
            <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                    height: scrolled ? "60%" : "40%",
                    background: isDark
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)",
                    transition: "height 0.3s ease",
                    mixBlendMode: isDark ? "screen" : "overlay"
                }}
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>

            {/* Bottom edge highlight */}
            {scrolled && (
                <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none"
                    style={{
                        height: "1px",
                        background: isDark
                            ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)"
                            : "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)"
                    }}
                />
            )}
        </motion.nav>
    );
};

interface LiquidGlassModalProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    className?: string;
}

export const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({ children, isOpen, onClose, title, className = "" }) => {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            {/* Enhanced Backdrop */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)"
                }}
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
                className={`liquid-glass-modal relative max-w-2xl w-full max-h-[90vh] overflow-hidden ${className}`}
                style={{
                    backdropFilter: "blur(70px) saturate(220%) brightness(1.1)",
                    WebkitBackdropFilter: "blur(70px) saturate(220%) brightness(1.1)",
                    background: isDark
                        ? "linear-gradient(180deg, rgba(44, 44, 46, 0.85) 0%, rgba(36, 36, 38, 0.8) 50%, rgba(28, 28, 30, 0.85) 100%)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(252, 252, 252, 0.8) 50%, rgba(250, 250, 250, 0.85) 100%)",
                    border: isDark ? "0.5px solid rgba(255, 255, 255, 0.2)" : "0.5px solid rgba(255, 255, 255, 0.9)",
                    borderRadius: "24px",
                    boxShadow: isDark
                        ? "0 32px 96px rgba(0, 0, 0, 0.7), 0 0 0 0.5px rgba(255, 255, 255, 0.1) inset, 0 2px 4px 0 rgba(255, 255, 255, 0.15) inset, 0 -2px 4px 0 rgba(0, 0, 0, 0.4) inset"
                        : "0 20px 64px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 1) inset, 0 3px 6px 0 rgba(255, 255, 255, 1) inset, 0 -2px 4px 0 rgba(0, 0, 0, 0.06) inset"
                }}
                initial={{ scale: 0.92, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 30, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>
                {/* Top glass reflection */}
                <div
                    className="absolute inset-x-0 top-0 pointer-events-none"
                    style={{
                        height: "30%",
                        background: isDark
                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 100%)"
                            : "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 100%)",
                        borderRadius: "24px 24px 0 0",
                        mixBlendMode: isDark ? "screen" : "overlay"
                    }}
                />

                {/* Specular highlight */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: "10%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "50%",
                        height: "20%",
                        background: isDark
                            ? "radial-gradient(ellipse, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 70%)"
                            : "radial-gradient(ellipse, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 40%, transparent 70%)",
                        filter: "blur(12px)",
                        borderRadius: "50%"
                    }}
                />

                {/* Content Container */}
                <div className="relative z-10 max-h-[90vh] overflow-y-auto">
                    {title && (
                        <div
                            className="px-6 py-5 sticky top-0 z-20"
                            style={{
                                background: isDark ? "rgba(44, 44, 46, 0.7)" : "rgba(255, 255, 255, 0.7)",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                borderBottom: isDark ? "0.5px solid rgba(255, 255, 255, 0.1)" : "0.5px solid rgba(0, 0, 0, 0.06)"
                            }}>
                            <div className="flex items-center justify-between">
                                <h2
                                    className="text-2xl font-bold"
                                    style={{ color: palette.textPrimary }}>
                                    {title}
                                </h2>
                                <motion.button
                                    onClick={onClose}
                                    className="p-2 rounded-full"
                                    style={{
                                        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                        color: palette.textSecondary
                                    }}
                                    whileHover={{
                                        scale: 1.1,
                                        background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)"
                                    }}
                                    whileTap={{ scale: 0.95 }}>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>
                    )}
                    <div className="p-6">{children}</div>
                </div>

                {/* Bottom subtle shadow */}
                <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none"
                    style={{
                        height: "20%",
                        background: isDark
                            ? "linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%)"
                            : "linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 50%, transparent 100%)",
                        borderRadius: "0 0 24px 24px"
                    }}
                />
            </motion.div>
        </motion.div>
    );
};

// Liquid Glass Section wrapper with ambient effects
export const LiquidGlassSection: React.FC<{
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
    ambient?: boolean;
}> = ({ children, className = "", gradient = false, ambient = false }) => {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    return (
        <section
            className={`liquid-glass-section relative overflow-hidden ${className}`}
            style={{
                background: gradient
                    ? isDark
                        ? `linear-gradient(135deg, ${palette.background} 0%, rgba(20, 20, 22, 1) 50%, ${palette.backgroundSecondary} 100%)`
                        : `linear-gradient(135deg, ${palette.background} 0%, rgba(248, 248, 250, 1) 50%, ${palette.backgroundSecondary} 100%)`
                    : palette.background
            }}>
            {/* Ambient glow effects */}
            {ambient && (
                <>
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: "10%",
                            left: "15%",
                            width: "400px",
                            height: "400px",
                            background: `radial-gradient(circle, ${palette.accent}20 0%, transparent 70%)`,
                            filter: "blur(80px)",
                            opacity: 0.6
                        }}
                    />
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            bottom: "20%",
                            right: "10%",
                            width: "500px",
                            height: "500px",
                            background: `radial-gradient(circle, ${palette.accentSubtle}30 0%, transparent 70%)`,
                            filter: "blur(100px)",
                            opacity: 0.5
                        }}
                    />
                </>
            )}

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </section>
    );
};
