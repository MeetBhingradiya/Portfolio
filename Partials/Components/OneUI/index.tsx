/**
 * Samsung One UI 7 Book Theme Components
 * Bold typography, generous spacing, clean aesthetics
 * Optimized for readability and thumb-friendly interactions
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";

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
    const { palette } = useDesignTheme();

    return (
        <motion.div
            className={`oneui-card ${className}`}
            style={{
                background: elevated ? palette.surfaceElevated : palette.surface,
                border: `1px solid ${palette.border}`,
                borderRadius: "28px",
                padding: "24px",
                boxShadow: elevated ? palette.shadowMd : palette.shadowSm
            }}
            whileHover={interactive ? { scale: 1.02, y: -4 } : {}}
            transition={{ duration: 0.2 }}
        >
            {children}
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
    const { palette } = useDesignTheme();

    const sizeStyles = {
        sm: "px-4 py-2 text-sm min-h-[40px]",
        md: "px-6 py-3 text-base min-h-[52px]",
        lg: "px-8 py-4 text-lg min-h-[60px]"
    };

    const variantStyles = {
        primary: {
            background: palette.accent,
            color: palette.textOnAccent,
            border: "none",
            boxShadow: `0 2px 8px ${palette.accentSubtle}`
        },
        secondary: {
            background: palette.backgroundSecondary,
            color: palette.textPrimary,
            border: "none"
        },
        outline: {
            background: "transparent",
            color: palette.accent,
            border: `2px solid ${palette.accent}`
        },
        text: {
            background: "transparent",
            color: palette.accent,
            border: "none"
        }
    };

    return (
        <motion.button
            className={`oneui-button ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className} rounded-full font-bold inline-flex items-center justify-center gap-3 transition-all duration-200`}
            style={variantStyles[variant]}
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.1 }}
        >
            {icon && <span className="icon text-xl">{icon}</span>}
            {children}
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
    const { palette } = useDesignTheme();

    return (
        <div className={`oneui-header ${className} mb-8`}>
            <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight"
                style={{ color: palette.textPrimary }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {title}
            </motion.h1>
            {subtitle && (
                <motion.p
                    className="text-xl md:text-2xl font-medium"
                    style={{ color: palette.textSecondary }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    );
};

interface OneUIBadgeProps {
    children: React.ReactNode;
    variant?: "accent" | "neutral" | "success" | "warning";
    className?: string;
}

export const OneUIBadge: React.FC<OneUIBadgeProps> = ({
    children,
    variant = "accent",
    className = ""
}) => {
    const { palette, colorMode } = useDesignTheme();

    const variantColors = {
        accent: {
            bg: palette.accentSubtle,
            text: palette.accent
        },
        neutral: {
            bg: palette.backgroundSecondary,
            text: palette.textSecondary
        },
        success: {
            bg: colorMode === "light" ? "rgba(52, 199, 89, 0.1)" : "rgba(52, 199, 89, 0.2)",
            text: "#34C759"
        },
        warning: {
            bg: colorMode === "light" ? "rgba(255, 149, 0, 0.1)" : "rgba(255, 149, 0, 0.2)",
            text: "#FF9500"
        }
    };

    return (
        <span
            className={`oneui-badge inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${className}`}
            style={{
                background: variantColors[variant].bg,
                color: variantColors[variant].text
            }}
        >
            {children}
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
