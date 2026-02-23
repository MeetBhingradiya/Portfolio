/**
 * ToolCard — Adaptive tool card for the Tools Dashboard
 * Renders Apple Liquid Glass or Samsung One UI 7 style based on active design theme.
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import {
    KeyboardArrowRight,
    AdminPanelSettings,
    Cloud,
    AutoAwesome,
    NewReleases,
    Science,
    ChevronRight,
    Bolt,
    QrCode2,
    Fingerprint,
    Password,
    DataObject,
    Key,
    Code,
    Image,
    PictureAsPdf,
    Security,
    Tag,
    DescriptionOutlined,
    Palette
} from "@mui/icons-material";
import type { ToolDefinition, ToolBadge } from "@/Static/ToolsDashboard";

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<
    ToolBadge,
    { label: string; icon: React.ReactNode; variant: "accent" | "neutral" | "success" | "warning" }
> = {
    "admin-managed": {
        label: "Admin",
        icon: <AdminPanelSettings sx={{ fontSize: 12 }} />,
        variant: "warning"
    },
    "db-sync": {
        label: "Sync",
        icon: <Cloud sx={{ fontSize: 12 }} />,
        variant: "neutral"
    },
    studio: {
        label: "Studio",
        icon: <AutoAwesome sx={{ fontSize: 12 }} />,
        variant: "accent"
    },
    featured: {
        label: "Featured",
        icon: <Bolt sx={{ fontSize: 12 }} />,
        variant: "success"
    },
    new: {
        label: "New",
        icon: <NewReleases sx={{ fontSize: 12 }} />,
        variant: "success"
    },
    beta: {
        label: "Beta",
        icon: <Science sx={{ fontSize: 12 }} />,
        variant: "warning"
    }
};

// ─── Internal badge pill ───────────────────────────────────────────────────────

interface BadgePillProps {
    badge: ToolBadge;
    palette: ReturnType<typeof useDesignTheme>["palette"];
    isDark: boolean;
}

const BadgePill: React.FC<BadgePillProps> = ({ badge, palette, isDark }) => {
    const cfg = BADGE_CONFIG[badge];

    const colorMap = {
        accent: { bg: `${palette.accent}20`, color: palette.accent, border: `${palette.accent}40` },
        neutral: {
            bg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            color: palette.textSecondary,
            border: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"
        },
        success: { bg: "rgba(52,199,89,.18)", color: "#34C759", border: "rgba(52,199,89,.35)" },
        warning: { bg: "rgba(255,149,0,.18)", color: "#FF9500", border: "rgba(255,149,0,.35)" }
    }[cfg.variant];

    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
                background: colorMap.bg,
                color: colorMap.color,
                border: `1px solid ${colorMap.border}`
            }}
        >
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

// ─── Icon map ────────────────────────────────────────────────────────────────

const TOOL_ICONS: Record<string, React.FC<{ style?: React.CSSProperties; className?: string }>> = {
    QrCode2,
    Fingerprint,
    Password,
    DataObject,
    Key,
    Code,
    Image,
    PictureAsPdf,
    Security,
    Tag,
    DescriptionOutlined,
    Palette
};

function ToolIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
    const Icon = TOOL_ICONS[name];
    return Icon ? <Icon style={style} /> : null;
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────

export interface ToolCardProps {
    tool: ToolDefinition;
    /** Optional user-specific usage count */
    usageCount?: number;
    /** Whether this tool is pinned by the user */
    isPinned?: boolean;
    /** Whether the tool is enabled (admin or user preference) */
    isEnabled?: boolean;
    onTogglePin?: (id: string) => void;
    index?: number;
}

const ToolCard: React.FC<ToolCardProps> = ({
    tool,
    usageCount = 0,
    isPinned = false,
    isEnabled = true,
    onTogglePin,
    index = 0
}) => {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const [hovered, setHovered] = useState(false);
    const [showModes, setShowModes] = useState(false);

    const effectiveAccent = tool.accentColor ?? palette.accent;

    // ── Shared inner content ──────────────────────────────────────────────────
    const CardContent = (
        <div
            className="relative flex flex-col h-full gap-4"
            style={{ opacity: isEnabled ? 1 : 0.5 }}
        >
            {/* ── Top row : icon + badges ── */}
            <div className="flex items-start justify-between gap-2">
                {/* Icon bubble */}
                <motion.div
                    className={`flex items-center justify-center rounded-2xl flex-shrink-0`}
                    style={{
                        width: 52,
                        height: 52,
                        background: isApple
                            ? `${effectiveAccent}22`
                            : `linear-gradient(135deg, ${effectiveAccent}25, ${effectiveAccent}12)`,
                        border: `1.5px solid ${effectiveAccent}35`,
                        boxShadow: hovered
                            ? `0 0 20px ${effectiveAccent}40`
                            : `0 4px 12px ${effectiveAccent}20`,
                        color: effectiveAccent,
                        backdropFilter: isApple ? "blur(8px)" : undefined,
                        borderRadius: isApple ? "16px" : "20px"
                    }}
                    animate={{ rotate: hovered ? [0, -6, 6, 0] : 0 }}
                    transition={{ duration: 0.45 }}
                >
                    <ToolIcon name={tool.iconName} style={{ fontSize: 26 }} />
                </motion.div>

                {/* Usage count chip */}
                {usageCount > 0 && (
                    <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                            color: palette.textTertiary
                        }}
                    >
                        {usageCount}×
                    </span>
                )}
            </div>

            {/* ── Name + description ── */}
            <div className="flex-1">
                <h3
                    className={`${isApple ? "text-base font-semibold" : "text-lg font-black"} leading-tight mb-1`}
                    style={{ color: palette.textPrimary }}
                >
                    {tool.name}
                </h3>
                <p
                    className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: palette.textSecondary }}
                >
                    {tool.description}
                </p>
            </div>

            {/* ── Badges ── */}
            <div className="flex flex-wrap gap-1">
                {tool.badges.slice(0, 3).map((b) => (
                    <BadgePill key={b} badge={b} palette={palette} isDark={isDark} />
                ))}
            </div>

            {/* ── Modes pills (if multiple) ── */}
            {tool.modes && tool.modes.length > 0 && (
                <AnimatePresence>
                    {(hovered || showModes) && (
                        <motion.div
                            key="modes"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="flex flex-wrap gap-1.5"
                        >
                            {tool.modes.map((mode) => (
                                <Link
                                    key={mode.label}
                                    href={mode.route}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all"
                                    style={{
                                        background: `${effectiveAccent}18`,
                                        color: effectiveAccent,
                                        border: `1px solid ${effectiveAccent}30`
                                    }}
                                >
                                    {mode.label}
                                    <ChevronRight sx={{ fontSize: 12 }} />
                                </Link>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* ── CTA row ── */}
            <div className="flex items-center justify-between mt-auto pt-2">
                {/* Keyboard shortcut */}
                {tool.shortcut && (
                    <kbd
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                            color: palette.textTertiary,
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`
                        }}
                    >
                        {tool.shortcut}
                    </kbd>
                )}

                {/* Open button */}
                <motion.div
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold ml-auto`}
                    style={{
                        background: isEnabled
                            ? `linear-gradient(135deg, ${effectiveAccent}, ${effectiveAccent}cc)`
                            : isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                        color: isEnabled ? "#fff" : palette.textTertiary,
                        boxShadow: isEnabled && hovered
                            ? `0 4px 16px ${effectiveAccent}50`
                            : "none"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                >
                    {isEnabled ? (
                        <>
                            Open
                            <KeyboardArrowRight sx={{ fontSize: 14 }} />
                        </>
                    ) : (
                        "Disabled"
                    )}
                </motion.div>
            </div>
        </div>
    );

    // ── Apple wrapper ─────────────────────────────────────────────────────────
    if (isApple) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="cursor-pointer"
                onClick={() => isEnabled && (window.location.href = tool.route)}
            >
                <LiquidGlassCard intensity="medium" enableGlow={hovered}>
                    {CardContent}
                </LiquidGlassCard>
            </motion.div>
        );
    }

    // ── Samsung wrapper ──────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="cursor-pointer"
            onClick={() => isEnabled && (window.location.href = tool.route)}
        >
            <OneUICard elevated={isPinned} interactive={isEnabled}>
                {CardContent}
            </OneUICard>
        </motion.div>
    );
};

export default ToolCard;
