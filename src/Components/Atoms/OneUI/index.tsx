"use client";

import React from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";

interface OneUICardProps {
    children: React.ReactNode;
    className?: string;
    elevated?: boolean;
    interactive?: boolean;
}

export const OneUICard: React.FC<OneUICardProps> = ({
    children,
    className = "",
    elevated = false,
    interactive = true
}) => {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    return (
        <motion.div
            className={`oneui-card ${className} relative overflow-hidden`}
            style={{
                background: elevated 
                    ? isDark
                        ? "linear-gradient(135deg, rgba(40, 40, 45, 0.95) 0%, rgba(30, 30, 35, 0.9) 100%)"
                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.9) 100%)"
                    : isDark
                        ? "linear-gradient(135deg, rgba(30, 30, 35, 0.9) 0%, rgba(25, 25, 30, 0.85) 100%)"
                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 248, 250, 0.85) 100%)",
                border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                borderRadius: "32px",
                padding: "28px",
                boxShadow: elevated 
                    ? isDark
                        ? "0 12px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                        : "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                    : isDark
                        ? "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)"
                        : "0 2px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
            }}
            whileHover={interactive ? { scale: 1.015, y: -6 } : {}}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Top edge highlight */}
            <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                    background: isDark
                        ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)"
                        : "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)"
                }}
            />
            {/* Content with depth */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

interface OneUIButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "outline" | "text";
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const OneUIButton: React.FC<OneUIButtonProps> = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    icon,
    fullWidth = false
}) => {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    const sizeStyles = {
        sm: "px-5 py-2.5 text-sm min-h-[44px]",
        md: "px-7 py-3.5 text-base min-h-[56px]",
        lg: "px-9 py-4.5 text-lg min-h-[64px]"
    };

    const variantStyles = React.useMemo(() => ({
        primary: {
            background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark || palette.accent} 100%)`,
            color: palette.textOnAccent,
            border: "none",
            boxShadow: isDark
                ? `0 8px 24px ${palette.accent}40, 0 2px 8px ${palette.accent}30, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                : `0 6px 20px ${palette.accent}35, 0 2px 6px ${palette.accent}25, inset 0 1px 0 rgba(255, 255, 255, 0.5)`
        },
        secondary: {
            background: isDark
                ? "linear-gradient(135deg, rgba(45, 45, 50, 0.9) 0%, rgba(35, 35, 40, 0.85) 100%)"
                : "linear-gradient(135deg, rgba(248, 248, 250, 0.95) 0%, rgba(240, 240, 245, 0.9) 100%)",
            color: palette.textPrimary,
            border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
            boxShadow: isDark
                ? "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                : "0 2px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)"
        },
        outline: {
            background: "transparent",
            color: palette.accent,
            border: `2px solid ${palette.accent}`,
            boxShadow: "none"
        },
        text: {
            background: "transparent",
            color: palette.accent,
            border: "none",
            boxShadow: "none"
        }
    }), [palette, isDark]);

    return (
        <motion.button
            className={`oneui-button ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className} rounded-full font-black inline-flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden`}
            style={variantStyles[variant]}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Top highlight for depth */}
            {(variant === "primary" || variant === "secondary") && (
                <div
                    className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                    style={{
                        background: isDark
                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)"
                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)",
                        borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                    }}
                />
            )}
            {icon && <span className="icon text-xl relative z-10">{icon}</span>}
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
};

interface OneUIHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export const OneUIHeader: React.FC<OneUIHeaderProps> = ({
    title,
    subtitle,
    className = ""
}) => {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    return (
        <div className={`oneui-header ${className} mb-10`}>
            <motion.h1
                className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight"
                style={{ 
                    color: palette.textPrimary,
                    textShadow: isDark 
                        ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                        : "0 1px 3px rgba(0, 0, 0, 0.08)"
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {title}
            </motion.h1>
            {subtitle && (
                <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed"
                    style={{ color: palette.textSecondary }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    );
};

interface OneUIBadgeProps {
    children: React.ReactNode;
    variant?: "accent" | "neutral" | "success" | "warning" | "info" | "error";
    className?: string;
}

export const OneUIBadge: React.FC<OneUIBadgeProps> = ({
    children,
    variant = "accent",
    className = ""
}) => {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    const variantColors = React.useMemo(() => ({
        accent: {
            bg: isDark
                ? `linear-gradient(135deg, ${palette.accent}20 0%, ${palette.accent}15 100%)`
                : `linear-gradient(135deg, ${palette.accent}15 0%, ${palette.accent}10 100%)`,
            text: palette.accent,
            border: `${palette.accent}40`,
            shadow: `0 2px 8px ${palette.accent}20`
        },
        neutral: {
            bg: isDark
                ? "linear-gradient(135deg, rgba(60, 60, 67, 0.4) 0%, rgba(48, 48, 54, 0.35) 100%)"
                : "linear-gradient(135deg, rgba(242, 242, 247, 0.9) 0%, rgba(235, 235, 240, 0.85) 100%)",
            text: palette.textSecondary,
            border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
            shadow: isDark ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 1px 4px rgba(0, 0, 0, 0.06)"
        },
        success: {
            bg: isDark
                ? "linear-gradient(135deg, rgba(52, 199, 89, 0.25) 0%, rgba(52, 199, 89, 0.2) 100%)"
                : "linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(52, 199, 89, 0.1) 100%)",
            text: "#34C759",
            border: "rgba(52, 199, 89, 0.4)",
            shadow: "0 2px 8px rgba(52, 199, 89, 0.2)"
        },
        warning: {
            bg: isDark
                ? "linear-gradient(135deg, rgba(255, 149, 0, 0.25) 0%, rgba(255, 149, 0, 0.2) 100%)"
                : "linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 149, 0, 0.1) 100%)",
            text: "#FF9500",
            border: "rgba(255, 149, 0, 0.4)",
            shadow: "0 2px 8px rgba(255, 149, 0, 0.2)"
        },
        info: {
            bg: isDark
                ? "linear-gradient(135deg, rgba(90, 200, 250, 0.25) 0%, rgba(90, 200, 250, 0.2) 100%)"
                : "linear-gradient(135deg, rgba(90, 200, 250, 0.15) 0%, rgba(90, 200, 250, 0.1) 100%)",
            text: "#5AC8FA",
            border: "rgba(90, 200, 250, 0.4)",
            shadow: "0 2px 8px rgba(90, 200, 250, 0.2)"
        },
        error: {
            bg: isDark
                ? "linear-gradient(135deg, rgba(255, 59, 48, 0.25) 0%, rgba(255, 59, 48, 0.2) 100%)"
                : "linear-gradient(135deg, rgba(255, 59, 48, 0.15) 0%, rgba(255, 59, 48, 0.1) 100%)",
            text: "#FF3B30",
            border: "rgba(255, 59, 48, 0.4)",
            shadow: "0 2px 8px rgba(255, 59, 48, 0.2)"
        }
    }), [palette, isDark]);

    return (
        <span
            className={`oneui-badge inline-flex items-center px-5 py-2.5 rounded-full text-sm font-black relative overflow-hidden ${className}`}
            style={{
                background: variantColors[variant].bg,
                color: variantColors[variant].text,
                border: `1.5px solid ${variantColors[variant].border}`,
                boxShadow: variantColors[variant].shadow
            }}
        >
            {/* Top highlight */}
            {/* <div
                className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                style={{
                    background: isDark
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)",
                    borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                }}
            /> */}
            <span className="relative z-10">{children}</span>
        </span>
    );
};

interface OneUIListItemProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    rightContent?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const OneUIListItem: React.FC<OneUIListItemProps> = ({
    title,
    subtitle,
    icon,
    rightContent,
    onClick,
    className = ""
}) => {
    const { palette } = useDesignTheme();

    return (
        <motion.div
            className={`oneui-list-item flex items-center gap-4 p-4 rounded-2xl cursor-pointer ${className}`}
            style={{
                background: palette.surface,
                border: `1px solid ${palette.borderSubtle}`
            }}
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            whileHover={{ backgroundColor: palette.surfaceElevated }}
            transition={{ duration: 0.2 }}
        >
            {icon && (
                <div
                    className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                        background: palette.accentSubtle,
                        color: palette.accent
                    }}
                >
                    {icon}
                </div>
            )}

            <div className="flex-1 min-w-0">
                <h3
                    className="text-lg font-bold truncate"
                    style={{ color: palette.textPrimary }}
                >
                    {title}
                </h3>
                {subtitle && (
                    <p
                        className="text-sm truncate mt-1"
                        style={{ color: palette.textSecondary }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>

            {rightContent && (
                <div className="flex-shrink-0">{rightContent}</div>
            )}
        </motion.div>
    );
};

interface OneUITabsProps {
    tabs: Array<{ label: string; value: string }>;
    activeTab: string;
    onChange: (value: string) => void;
    className?: string;
}

export const OneUITabs: React.FC<OneUITabsProps> = ({
    tabs,
    activeTab,
    onChange,
    className = ""
}) => {
    const { palette } = useDesignTheme();

    return (
        <div
            className={`oneui-tabs inline-flex gap-2 p-2 rounded-full ${className}`}
            style={{
                background: palette.backgroundSecondary
            }}
        >
            {tabs.map((tab) => (
                <motion.button
                    key={tab.value}
                    className="px-6 py-3 rounded-full font-bold text-sm transition-all duration-200"
                    style={{
                        background:
                            activeTab === tab.value
                                ? palette.accent
                                : "transparent",
                        color:
                            activeTab === tab.value
                                ? palette.textOnAccent
                                : palette.textSecondary
                    }}
                    onClick={() => onChange(tab.value)}
                    whileTap={{ scale: 0.95 }}
                >
                    {tab.label}
                </motion.button>
            ))}
        </div>
    );
};

interface OneUISection {
    children: React.ReactNode;
    className?: string;
    spacing?: "comfortable" | "relaxed" | "spacious";
}

export const OneUISection: React.FC<OneUISection> = ({
    children,
    className = "",
    spacing = "comfortable"
}) => {
    const { palette } = useDesignTheme();

    const spacingStyles = {
        comfortable: "py-12 md:py-16",
        relaxed: "py-16 md:py-24",
        spacious: "py-24 md:py-32"
    };

    return (
        <section
            className={`oneui-section ${spacingStyles[spacing]} ${className}`}
            style={{ background: palette.background }}
        >
            <div className="container mx-auto px-6 md:px-8 lg:px-12">
                {children}
            </div>
        </section>
    );
};

interface OneUIDividerProps {
    text?: string;
    className?: string;
}

export const OneUIDivider: React.FC<OneUIDividerProps> = ({
    text,
    className = ""
}) => {
    const { palette } = useDesignTheme();

    return (
        <div
            className={`oneui-divider flex items-center gap-4 my-8 ${className}`}
        >
            <div
                className="flex-1 h-[2px] rounded-full"
                style={{ background: palette.border }}
            />
            {text && (
                <>
                    <span
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: palette.textTertiary }}
                    >
                        {text}
                    </span>
                    <div
                        className="flex-1 h-[2px] rounded-full"
                        style={{ background: palette.border }}
                    />
                </>
            )}
        </div>
    );
};
