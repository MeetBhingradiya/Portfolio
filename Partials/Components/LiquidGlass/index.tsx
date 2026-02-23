/**
 * Apple Liquid Glass Components
 * Implements Apple's Liquid Glass design language with depth, fluidity, and dynamic lighting
 * NOT glassmorphism - this is the new liquid glass effect
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";

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
    const { palette, colorMode } = useDesignTheme();
    const cardRef = useRef<HTMLDivElement>(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
        stiffness: 200,
        damping: 20
    });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
        stiffness: 200,
        damping: 20
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!enableTilt || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        mouseX.set((e.clientX - centerX) / rect.width);
        mouseY.set((e.clientY - centerY) / rect.height);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const intensityStyles = {
        subtle: {
            backdropFilter: "blur(10px) saturate(120%)",
            background: colorMode === "light"
                ? "rgba(255, 255, 255, 0.5)"
                : "rgba(28, 28, 30, 0.5)",
            border: `1px solid ${palette.borderSubtle}`
        },
        medium: {
            backdropFilter: "blur(20px) saturate(140%)",
            background: colorMode === "light"
                ? "rgba(255, 255, 255, 0.6)"
                : "rgba(28, 28, 30, 0.6)",
            border: `1px solid ${palette.border}`
        },
        strong: {
            backdropFilter: "blur(30px) saturate(160%)",
            background: colorMode === "light"
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(28, 28, 30, 0.7)",
            border: `1px solid ${palette.border}`
        }
    };

    return (
        <motion.div
            ref={cardRef}
            className={`liquid-glass-card ${className}`}
            style={{
                ...intensityStyles[intensity],
                rotateX: enableTilt ? rotateX : 0,
                rotateY: enableTilt ? rotateY : 0,
                transformStyle: "preserve-3d",
                borderRadius: "20px",
                overflow: "hidden",
                position: "relative",
                boxShadow: enableGlow
                    ? `0 8px 32px ${palette.liquidGlow}, 0 2px 8px ${palette.shadowMd}`
                    : palette.shadowMd
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
        >
            {/* Liquid gradient overlay */}
            {enableGlow && (
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${palette.accent} 0%, transparent 70%)`
                    }}
                />
            )}

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
    const { palette, colorMode } = useDesignTheme();

    const sizeStyles = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg"
    };

    const variantStyles = {
        primary: {
            background: palette.accent,
            color: palette.textOnAccent,
            border: "none",
            boxShadow: `0 4px 16px ${palette.liquidGlow}`
        },
        secondary: {
            background: palette.glassBg,
            color: palette.textPrimary,
            border: `1px solid ${palette.border}`,
            backdropFilter: "blur(20px)"
        },
        ghost: {
            background: "transparent",
            color: palette.accent,
            border: `1px solid ${palette.borderSubtle}`
        }
    };

    return (
        <motion.button
            className={`liquid-glass-button ${sizeStyles[size]} ${className} rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-all duration-300`}
            style={variantStyles[variant]}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            {icon && <span className="icon">{icon}</span>}
            {children}
        </motion.button>
    );
};

interface LiquidGlassNavProps {
    children: React.ReactNode;
    className?: string;
    sticky?: boolean;
}

export const LiquidGlassNav: React.FC<LiquidGlassNavProps> = ({
    children,
    className = "",
    sticky = true
}) => {
    const { palette, colorMode } = useDesignTheme();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            className={`liquid-glass-nav ${sticky ? "sticky top-0" : ""} ${className} z-50 transition-all duration-300`}
            style={{
                backdropFilter: scrolled ? "blur(30px) saturate(180%)" : "blur(10px)",
                background: scrolled
                    ? colorMode === "light"
                        ? "rgba(255, 255, 255, 0.8)"
                        : "rgba(0, 0, 0, 0.8)"
                    : colorMode === "light"
                    ? "rgba(255, 255, 255, 0.5)"
                    : "rgba(0, 0, 0, 0.5)",
                borderBottom: `1px solid ${scrolled ? palette.border : palette.borderSubtle}`,
                boxShadow: scrolled ? palette.shadowMd : "none"
            }}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {children}
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

export const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({
    children,
    isOpen,
    onClose,
    title,
    className = ""
}) => {
    const { palette, colorMode } = useDesignTheme();

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className={`liquid-glass-modal relative max-w-2xl w-full max-h-[90vh] overflow-auto ${className}`}
                style={{
                    backdropFilter: "blur(40px) saturate(180%)",
                    background: colorMode === "light"
                        ? "rgba(255, 255, 255, 0.9)"
                        : "rgba(28, 28, 30, 0.9)",
                    border: `1px solid ${palette.border}`,
                    borderRadius: "24px",
                    boxShadow: `0 24px 64px ${palette.shadowLg}`
                }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
            >
                {title && (
                    <div
                        className="px-6 py-4 border-b"
                        style={{ borderColor: palette.border }}
                    >
                        <h2
                            className="text-2xl font-bold"
                            style={{ color: palette.textPrimary }}
                        >
                            {title}
                        </h2>
                    </div>
                )}
                <div className="p-6">{children}</div>
            </motion.div>
        </motion.div>
    );
};

// Liquid Glass Section wrapper
export const LiquidGlassSection: React.FC<{
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}> = ({ children, className = "", gradient = false }) => {
    const { palette, colorMode } = useDesignTheme();

    return (
        <section
            className={`liquid-glass-section relative ${className}`}
            style={{
                background: gradient
                    ? `linear-gradient(135deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)`
                    : palette.background
            }}
        >
            {children}
        </section>
    );
};
