/**
 * Productivity Hub — Dashboard
 * Analytics overview: XP/Level, activity chart, streaks, reminders, achievements.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import Link from "next/link";
import {
    EmojiEvents, LocalFireDepartment, CheckCircle, Loop, TrackChanges,
    Notifications, ArrowForward, Psychology, Star, ChecklistRtl, Refresh,
    DeleteForever, Warning, Close,
} from "@mui/icons-material";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LevelInfo { level: number; title: string; xpForCurrentLevel: number; xpForNextLevel: number; progress: number; }
interface Achievement { id: string; title: string; description: string; emoji: string; EarnedAt: string; }
interface Stats {
    TotalXP: number; Level: number; LevelTitle: string;
    TotalTasksCompleted: number; TotalHabitCompletions: number;
    BestHabitStreak: number; TotalGoalsCompleted: number;
    DailyStreak: number; levelInfo: LevelInfo;
    achievements: Achievement[];
}
interface Habit { HabitID: string; Title: string; Emoji: string; Color: string; CurrentStreak: number; LongestStreak: number; completedToday: boolean; }
interface Reminder { ReminderID: string; Title: string; ScheduledAt: string; Priority: string; Status: string; }
interface Task { TaskID: string; Status: string; CompletedAt?: string; }

// ─── 7-Day Activity Chart ──────────────────────────────────────────────────────

function ActivityChart({ days, isDark, accent }: { days: { label: string; tasks: number; habits: number }[]; isDark: boolean; accent: string }) {
    const maxVal = Math.max(...days.map(d => d.tasks + d.habits), 1);
    const W = 400; const H = 110; const PX = 8; const PY = 14;
    const innerH = H - PY * 2 - 14;
    const gap    = (W - PX * 2) / days.length;
    const barW   = gap * 0.55;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {days.map((d, i) => {
                const cx     = PX + i * gap + gap / 2;
                const totalH = ((d.tasks + d.habits) / maxVal) * innerH;
                const taskH  = (d.tasks / maxVal) * innerH;
                const habitH = totalH - taskH;
                const bx     = cx - barW / 2;
                return (
                    <g key={i}>
                        {habitH > 0 && <rect x={bx} y={PY + innerH - totalH} width={barW} height={habitH} rx={3} fill={`${accent}50`} />}
                        {taskH  > 0 && <rect x={bx} y={PY + innerH - taskH}  width={barW} height={taskH}  rx={3} fill={accent} />}
                        {totalH === 0 && <rect x={bx} y={PY + innerH - 3} width={barW} height={3} rx={1.5} fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} />}
                        <text x={cx} y={H - 2} textAnchor="middle" fontSize={9} fill={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"}>{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const ACCENT = "#AF52DE";

export default function ProductivityDashboard() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [stats,     setStats]     = useState<Stats | null>(null);
    const [habits,    setHabits]    = useState<Habit[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [tasks,     setTasks]     = useState<Task[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [resetHistory,     setResetHistory]     = useState<string[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetInput,       setResetInput]       = useState("");
    const [resetLoading,     setResetLoading]     = useState(false);

    const cardBg  = isApple ? isDark ? "rgba(44,44,46,0.72)" : "rgba(255,255,255,0.75)" : palette.surface;
    const border  = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
    const blur    = isApple ? "blur(16px)" : "none";

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [sR, hR, rR, tR, resetR] = await Promise.all([
                fetch("/api/productivity/stats"),
                fetch("/api/productivity/habits"),
                fetch("/api/productivity/reminders?status=ACTIVE"),
                fetch("/api/productivity/tasks?limit=60"),
                fetch("/api/productivity/reset"),
            ]);
            const [s, h, r, t, resetJ] = await Promise.all([sR.json(), hR.json(), rR.json(), tR.json(), resetR.json()]);
            if (s.success) setStats(s.data);
            if (h.success) setHabits((h.data ?? []).slice(0, 5));
            if (r.success) {
                const sorted = [...(r.data ?? [])].sort((a: Reminder, b: Reminder) =>
                    new Date(a.ScheduledAt).getTime() - new Date(b.ScheduledAt).getTime());
                setReminders(sorted.slice(0, 5));
            }
            if (t.success) setTasks(t.data?.tasks ?? []);
            if (resetJ.success) setResetHistory(resetJ.data ?? []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const sevenDayData = React.useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            return {
                label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
                date:  d.toISOString().split("T")[0],
                tasks: 0, habits: 0,
            };
        });
        for (const t of tasks) {
            if (t.Status === "COMPLETED" && t.CompletedAt) {
                const d = t.CompletedAt.split("T")[0];
                const e = days.find(x => x.date === d);
                if (e) e.tasks++;
            }
        }
        const todayStr = new Date().toISOString().split("T")[0];
        const todayE   = days.find(d => d.date === todayStr);
        if (todayE) todayE.habits = habits.filter(h => h.completedToday).length;
        return days;
    }, [tasks, habits]);

    if (loading) return (        <div className="flex items-center justify-center h-screen">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2"
                style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }} />
        </div>
    );

    if (!stats) return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
            <Psychology style={{ fontSize: 52, color: ACCENT }} />
            <p className="font-bold text-lg" style={{ color: palette.textPrimary }}>Sign in to start tracking</p>
            <p className="text-sm max-w-xs" style={{ color: palette.textSecondary }}>Gamified tasks, habits, goals and reminders all in one place.</p>
        </div>
    );

    const { levelInfo } = stats;
    const totalWeek     = sevenDayData.reduce((s, d) => s + d.tasks + d.habits, 0);

    async function handleReset() {
        if (resetInput !== "RESET") return;
        setResetLoading(true);
        try {
            const r = await fetch("/api/productivity/reset", { method: "POST" });
            const j = await r.json();
            if (j.success) {
                setShowResetConfirm(false);
                setResetInput("");
                load();
            }
        } finally { setResetLoading(false); }
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Dashboard</h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                </div>
                <motion.button onClick={load} className="p-2 rounded-xl"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                    whileTap={{ scale: 0.9, rotate: 180 }} transition={{ duration: 0.3 }}>
                    <Refresh style={{ color: palette.textSecondary, fontSize: 20 }} />
                </motion.button>
            </div>

            {/* XP / Level Card */}
            <motion.div className="rounded-2xl p-5 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${ACCENT}22 0%, ${ACCENT}0d 100%)`, border: `1.5px solid ${ACCENT}28`, backdropFilter: blur }}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${ACCENT}28 0%, transparent 70%)` }} />
                <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0"
                            style={{ background: ACCENT, color: "#fff" }}>{levelInfo.level}</div>
                        <div>
                            <p className="font-bold" style={{ color: palette.textPrimary }}>{stats.LevelTitle}</p>
                            <p className="text-xs" style={{ color: palette.textSecondary }}>{stats.TotalXP.toLocaleString()} XP</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                            <Star style={{ color: "#f59e0b", fontSize: 13 }} />
                            <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Lv {levelInfo.level + 1}</span>
                        </div>
                        <p className="text-xs" style={{ color: palette.textTertiary }}>{(levelInfo.xpForNextLevel - stats.TotalXP).toLocaleString()} XP to go</p>
                    </div>
                </div>
                <div className="relative mt-4">
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)" }}>
                        <motion.div className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, #FF6B9D 100%)` }}
                            initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1" style={{ color: palette.textTertiary }}>
                        <span>{levelInfo.xpForCurrentLevel.toLocaleString()}</span>
                        <span>{Math.round(levelInfo.progress)}%</span>
                        <span>{levelInfo.xpForNextLevel.toLocaleString()}</span>
                    </div>
                </div>
                {stats.DailyStreak > 0 && (
                    <div className="relative flex items-center gap-1.5 mt-2">
                        <LocalFireDepartment style={{ color: "#f59e0b", fontSize: 15 }} />
                        <span className="text-sm font-semibold" style={{ color: "#f59e0b" }}>{stats.DailyStreak} day streak</span>
                    </div>
                )}
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Daily Streak",      value: stats.DailyStreak,           icon: <LocalFireDepartment />, color: "#f59e0b" },
                    { label: "Tasks Done",         value: stats.TotalTasksCompleted,   icon: <CheckCircle />,         color: "#22c55e" },
                    { label: "Habit Completions",  value: stats.TotalHabitCompletions, icon: <Loop />,                color: "#3b82f6" },
                    { label: "Goals Achieved",     value: stats.TotalGoalsCompleted,   icon: <TrackChanges />,        color: ACCENT    },
                ].map((s, i) => (
                    <motion.div key={s.label} className="rounded-2xl p-4"
                        style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: blur }}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}16` }}>
                            <span style={{ color: s.color, fontSize: 18 }}>{s.icon}</span>
                        </div>
                        <p className="text-2xl font-black leading-none" style={{ color: palette.textPrimary }}>{s.value.toLocaleString()}</p>
                        <p className="text-xs mt-1" style={{ color: palette.textSecondary }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Chart + Habit Streaks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div className="rounded-2xl p-5"
                    style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: blur }}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-sm" style={{ color: palette.textPrimary }}>7-Day Activity</p>
                        <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: ACCENT }} /><span style={{ color: palette.textTertiary }}>Tasks</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: `${ACCENT}50` }} /><span style={{ color: palette.textTertiary }}>Habits</span></div>
                        </div>
                    </div>
                    <ActivityChart days={sevenDayData} isDark={isDark} accent={ACCENT} />
                    <p className="text-xs text-center mt-1.5" style={{ color: palette.textTertiary }}>{totalWeek} completions this week</p>
                </motion.div>

                <motion.div className="rounded-2xl p-5"
                    style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: blur }}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-sm" style={{ color: palette.textPrimary }}>Top Streaks</p>
                        <Link href="/tools/productivity/habits" className="text-xs flex items-center gap-0.5 font-medium" style={{ color: ACCENT }}>
                            All <ArrowForward style={{ fontSize: 12 }} />
                        </Link>
                    </div>
                    {habits.length === 0 ? (
                        <p className="text-sm py-6 text-center" style={{ color: palette.textTertiary }}>No habits yet — add one!</p>
                    ) : (
                        <div className="space-y-3.5">
                            {habits.slice(0, 4).map(h => (
                                <div key={h.HabitID} className="flex items-center gap-3">
                                    <span className="text-xl">{h.Emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: palette.textPrimary }}>{h.Title}</p>
                                        <div className="h-1.5 mt-1 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, (h.CurrentStreak / Math.max(h.LongestStreak, 1)) * 100)}%`, background: h.Color ?? ACCENT }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <LocalFireDepartment style={{ color: "#f59e0b", fontSize: 14 }} />
                                        <span className="text-sm font-bold" style={{ color: palette.textPrimary }}>{h.CurrentStreak}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Quick Links + Reminders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div className="rounded-2xl p-5"
                    style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: blur }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="font-semibold text-sm mb-4" style={{ color: palette.textPrimary }}>Quick Access</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Tasks",     href: "/tools/productivity/tasks",     icon: <ChecklistRtl />, badge: null },
                            { label: "Habits",    href: "/tools/productivity/habits",    icon: <Loop />,         badge: habits.filter(h => !h.completedToday).length || null },
                            { label: "Goals",     href: "/tools/productivity/goals",     icon: <TrackChanges />, badge: null },
                            { label: "Reminders", href: "/tools/productivity/reminders", icon: <Notifications />,badge: reminders.length || null },
                        ].map(link => (
                            <Link key={link.href} href={link.href}>
                                <motion.div className="flex items-center gap-2.5 px-3 py-3 rounded-xl"
                                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${border}` }}
                                    whileHover={{ scale: 1.02, background: `${ACCENT}10` }} whileTap={{ scale: 0.97 }}>
                                    <span style={{ color: ACCENT }}>{link.icon}</span>
                                    <span className="text-sm font-medium flex-1" style={{ color: palette.textPrimary }}>{link.label}</span>
                                    {link.badge !== null && (
                                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: ACCENT, color: "#fff" }}>{link.badge}</span>
                                    )}
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                <motion.div className="rounded-2xl p-5"
                    style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: blur }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-sm" style={{ color: palette.textPrimary }}>Upcoming Reminders</p>
                        <Link href="/tools/productivity/reminders" className="text-xs flex items-center gap-0.5 font-medium" style={{ color: ACCENT }}>
                            All <ArrowForward style={{ fontSize: 12 }} />
                        </Link>
                    </div>
                    {reminders.length === 0
                        ? <p className="text-sm py-6 text-center" style={{ color: palette.textTertiary }}>No active reminders</p>
                        : reminders.map(r => {
                            const at    = new Date(r.ScheduledAt);
                            const today = at.toDateString() === new Date().toDateString();
                            const col   = { LOW: "#6b7280", NORMAL: "#3b82f6", HIGH: "#f59e0b", CRITICAL: "#ef4444" }[r.Priority] ?? "#6b7280";
                            return (
                                <div key={r.ReminderID} className="flex items-center gap-3 py-2 border-b last:border-0"
                                    style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col }} />
                                    <span className="flex-1 text-sm truncate" style={{ color: palette.textPrimary }}>{r.Title}</span>
                                    <span className="text-xs shrink-0" style={{ color: today ? "#f59e0b" : palette.textTertiary }}>
                                        {today ? at.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : at.toLocaleDateString("en", { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                            );
                        })
                    }
                </motion.div>
            </div>

            {/* Achievements */}
            {(stats.achievements ?? []).length > 0 && (
                <motion.div className="rounded-2xl p-5"
                    style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: blur }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="flex items-center gap-2 mb-4">
                        <EmojiEvents style={{ color: "#f59e0b", fontSize: 20 }} />
                        <p className="font-semibold text-sm" style={{ color: palette.textPrimary }}>Achievements</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f59e0b18", color: "#f59e0b" }}>{stats.achievements.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.achievements.slice(0, 8).map(a => (
                            <motion.div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${border}`, color: palette.textPrimary }}
                                title={a.description} whileHover={{ scale: 1.05 }}>
                                <span>{a.emoji}</span><span>{a.title}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Danger Zone — Reset History (visible only after a reset has been done) */}
            {resetHistory.length > 0 && (
                <motion.div className="rounded-2xl p-5"
                    style={{ background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.25)" }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Warning style={{ color: "#ef4444", fontSize: 18 }} />
                        <p className="font-semibold text-sm" style={{ color: "#ef4444" }}>Reset History</p>
                    </div>
                    <div className="space-y-1.5">
                        {[...resetHistory].reverse().map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: palette.textSecondary }}>
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#ef444460" }} />
                                {new Date(d).toLocaleString("en", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Danger Zone — Reset button */}
            <motion.div className="rounded-2xl p-5"
                style={{ background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.20)" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
                        <DeleteForever style={{ color: "#ef4444", fontSize: 22 }} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: palette.textPrimary }}>Danger Zone</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: palette.textSecondary }}>
                            Permanently delete all your tasks, habits, goals and reminders. XP and level are reset to zero. This cannot be undone.
                        </p>
                    </div>
                    <motion.button
                        onClick={() => { setShowResetConfirm(true); setResetInput(""); }}
                        className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: "rgba(239,68,68,0.14)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.30)" }}
                        whileHover={{ background: "rgba(239,68,68,0.22)" }} whileTap={{ scale: 0.97 }}>
                        Reset All
                    </motion.button>
                </div>
            </motion.div>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={e => e.target === e.currentTarget && setShowResetConfirm(false)}>
                        <motion.div className="w-full max-w-sm rounded-2xl p-6"
                            style={{ background: isDark ? "rgba(28,28,30,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}
                            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Warning style={{ color: "#ef4444", fontSize: 20 }} />
                                    <p className="font-bold text-base" style={{ color: palette.textPrimary }}>Reset All Data?</p>
                                </div>
                                <button onClick={() => setShowResetConfirm(false)}>
                                    <Close style={{ color: palette.textTertiary, fontSize: 20 }} />
                                </button>
                            </div>
                            <p className="text-sm leading-relaxed mb-4" style={{ color: palette.textSecondary }}>
                                This will permanently delete <strong>all tasks, habits, goals and reminders</strong> and reset your XP and level to zero. The reset date will be recorded in your history.
                            </p>
                            <p className="text-xs font-semibold mb-2" style={{ color: palette.textPrimary }}>
                                Type <span style={{ color: "#ef4444" }}>RESET</span> to confirm:
                            </p>
                            <input
                                value={resetInput}
                                onChange={e => setResetInput(e.target.value)}
                                placeholder="RESET"
                                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border mb-4"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: resetInput === "RESET" ? "#ef4444" : border }}
                                onKeyDown={e => e.key === "Enter" && resetInput === "RESET" && handleReset()}
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>
                                    Cancel
                                </button>
                                <motion.button
                                    onClick={handleReset}
                                    disabled={resetInput !== "RESET" || resetLoading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
                                    style={{ background: resetInput === "RESET" ? "#ef4444" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: resetInput === "RESET" ? "#fff" : palette.textTertiary }}
                                    whileTap={resetInput === "RESET" ? { scale: 0.97 } : {}}>
                                    {resetLoading
                                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                                        : <><DeleteForever style={{ fontSize: 16 }} /> Reset Everything</>
                                    }
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}