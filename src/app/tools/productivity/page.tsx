/**
 * Productivity Hub — /tools/productivity
 * Main dashboard showing stats, streaks, level, and quick access to sub-features.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Rocket,
    ChecklistRtl,
    Loop,
    TrackChanges,
    Notifications,
    Star,
    EmojiEvents,
    LocalFireDepartment,
    TrendingUp,
    Psychology,
    Lock,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LevelInfo {
    level: number;
    title: string;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progress: number;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    emoji: string;
    EarnedAt: string;
}

interface Stats {
    TotalXP: number;
    Level: number;
    LevelTitle: string;
    TotalTasksCompleted: number;
    TotalHabitCompletions: number;
    BestHabitStreak: number;
    TotalGoalsCompleted: number;
    DailyStreak: number;
    levelInfo: LevelInfo;
    achievements: Achievement[];
    allAchievements: Array<{ id: string; title: string; description: string; emoji: string }>;
}

// ─── Feature cards ────────────────────────────────────────────────────────────

const FEATURES = [
    {
        id: "tasks",
        title: "Tasks",
        description: "Gamified todos with XP rewards, subtasks & AI creation",
        icon: <ChecklistRtl sx={{ fontSize: 28 }} />,
        color: "#5E97F6",
        href: "/tools/productivity/tasks",
        emoji: "✅",
    },
    {
        id: "habits",
        title: "Habits",
        description: "Daily streaks, completion calendar & difficulty scaling",
        icon: <Loop sx={{ fontSize: 28 }} />,
        color: "#34C759",
        href: "/tools/productivity/habits",
        emoji: "🔄",
    },
    {
        id: "goals",
        title: "Goals",
        description: "Short & long-term goals with milestones & progress bars",
        icon: <TrackChanges sx={{ fontSize: 28 }} />,
        color: "#AF52DE",
        href: "/tools/productivity/goals",
        emoji: "🎯",
    },
    {
        id: "reminders",
        title: "Reminders",
        description: "Scheduled alerts with repeat options & browser notifications",
        icon: <Notifications sx={{ fontSize: 28 }} />,
        color: "#FF9500",
        href: "/tools/productivity/reminders",
        emoji: "🔔",
    },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductivityHubPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Ping daily streak
    const pingStreak = useCallback(async () => {
        try {
            await fetch("/api/productivity/stats", { method: "POST" });
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/productivity/stats");
                if (res.status === 401) {
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }
                setIsAuthenticated(true);
                if (res.ok) {
                    const json = await res.json();
                    setStats(json.data);
                    pingStreak();
                }
            } catch { /* ignore */ } finally {
                setLoading(false);
            }
        })();
    }, [pingStreak]);

    const xpProgress = stats?.levelInfo.progress ?? 0;
    const level = stats?.Level ?? 1;
    const levelTitle = stats?.LevelTitle ?? "Beginner";

    return (
        <ToolPageWrapper
            title="Productivity Hub"
            description="Gamified tasks, habits, goals & reminders"
            icon={<Rocket sx={{ fontSize: 24 }} />}
            accentColor="#AF52DE"
        >
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── Sign-in gate ── */}
                {isAuthenticated === false && (
                    <Card>
                        <div className="text-center py-12 space-y-4">
                            <Lock sx={{ fontSize: 48, color: palette.textTertiary }} />
                            <p className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                                Sign in to use Productivity Hub
                            </p>
                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                Your tasks, habits, and goals are synced to your account.
                            </p>
                            <Link href="/auth/login">
                                <motion.button
                                    className="px-6 py-2.5 rounded-full text-sm font-bold"
                                    style={{ background: "#AF52DE", color: "#fff" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Sign In
                                </motion.button>
                            </Link>
                        </div>
                    </Card>
                )}

                {/* ── Level & XP card ── */}
                {(isAuthenticated === true || loading) && (
                    <Card>
                        <div className="flex items-center gap-4">
                            {/* Level badge */}
                            <motion.div
                                className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl"
                                style={{ background: "linear-gradient(135deg, #AF52DE, #5E97F6)", color: "#fff" }}
                                animate={loading ? {} : { scale: [1, 1.04, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                {loading ? "…" : level}
                            </motion.div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-base" style={{ color: palette.textPrimary }}>
                                        {loading ? "Loading…" : `Level ${level} — ${levelTitle}`}
                                    </span>
                                    <span className="text-xs font-bold" style={{ color: palette.textSecondary }}>
                                        {loading ? "" : `${stats?.TotalXP?.toLocaleString() ?? 0} XP`}
                                    </span>
                                </div>

                                {/* XP progress bar */}
                                <div
                                    className="h-3 rounded-full overflow-hidden"
                                    style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
                                >
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{
                                            background: "linear-gradient(90deg, #AF52DE, #5E97F6)",
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-xs" style={{ color: palette.textTertiary }}>
                                        {loading ? "" : `${xpProgress}% to Level ${level + 1}`}
                                    </span>
                                    {stats?.DailyStreak ? (
                                        <span
                                            className="text-xs font-bold flex items-center gap-0.5"
                                            style={{ color: "#FF9500" }}
                                        >
                                            <LocalFireDepartment sx={{ fontSize: 14 }} />
                                            {stats.DailyStreak} day streak
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* ── Quick stats ── */}
                {isAuthenticated === true && stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            {
                                label: "Tasks Done",
                                value: stats.TotalTasksCompleted,
                                icon: <ChecklistRtl sx={{ fontSize: 20 }} />,
                                color: "#5E97F6",
                            },
                            {
                                label: "Habit Completions",
                                value: stats.TotalHabitCompletions,
                                icon: <Loop sx={{ fontSize: 20 }} />,
                                color: "#34C759",
                            },
                            {
                                label: "Best Streak",
                                value: `${stats.BestHabitStreak}d`,
                                icon: <LocalFireDepartment sx={{ fontSize: 20 }} />,
                                color: "#FF9500",
                            },
                            {
                                label: "Goals Achieved",
                                value: stats.TotalGoalsCompleted,
                                icon: <EmojiEvents sx={{ fontSize: 20 }} />,
                                color: "#AF52DE",
                            },
                        ].map((stat) => (
                            <Card key={stat.label}>
                                <div className="flex flex-col gap-1">
                                    <span style={{ color: stat.color }}>{stat.icon}</span>
                                    <span className="text-2xl font-black" style={{ color: palette.textPrimary }}>
                                        {stat.value}
                                    </span>
                                    <span className="text-xs" style={{ color: palette.textSecondary }}>
                                        {stat.label}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* ── Feature cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FEATURES.map((feature, i) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <Link href={feature.href}>
                                <Card>
                                    <div className="flex items-start gap-4 group cursor-pointer">
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${feature.color}20`, color: feature.color }}
                                        >
                                            {feature.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-base" style={{ color: palette.textPrimary }}>
                                                    {feature.emoji} {feature.title}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: palette.textSecondary }}>
                                                {feature.description}
                                            </p>
                                        </div>
                                        <TrendingUp
                                            sx={{ fontSize: 18, opacity: 0.4, flexShrink: 0 }}
                                            style={{ color: feature.color }}
                                        />
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* ── Recent achievements ── */}
                {isAuthenticated === true && stats?.achievements && stats.achievements.length > 0 && (
                    <div>
                        <h3
                            className="text-sm font-bold mb-3 flex items-center gap-2"
                            style={{ color: palette.textSecondary }}
                        >
                            <EmojiEvents sx={{ fontSize: 16 }} />
                            Recent Achievements
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {stats.achievements.slice(0, 8).map((ach) => (
                                <motion.div
                                    key={ach.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.08)"
                                            : "rgba(0,0,0,0.05)",
                                        color: palette.textPrimary,
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
                                    }}
                                    title={ach.description}
                                >
                                    <span>{ach.emoji}</span>
                                    <span>{ach.title}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── AI badge ── */}
                <Card>
                    <div className="flex items-center gap-3">
                        <Psychology sx={{ fontSize: 28, color: "#5E97F6" }} />
                        <div>
                            <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>
                                AI-Powered Creation
                            </p>
                            <p className="text-xs" style={{ color: palette.textSecondary }}>
                                Use GitHub Models, Google Gemini, or Perplexity to create tasks, suggest habits, and break down goals. Configure providers in the admin panel.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </ToolPageWrapper>
    );
}
