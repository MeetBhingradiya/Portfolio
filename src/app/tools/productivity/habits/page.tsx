/**
 * Habits — /tools/productivity/habits
 * Daily habit tracker with streak calendar, XP rewards, and AI suggestions.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Loop,
    Add,
    Delete,
    LocalFireDepartment,
    CheckCircle,
    RadioButtonUnchecked,
    Psychology,
    Star,
    Edit,
    Save,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompletionRecord {
    Date: string;
}

interface Habit {
    HabitID: string;
    Title: string;
    Description?: string;
    Category: string;
    Difficulty: "EASY" | "MEDIUM" | "HARD";
    Emoji: string;
    Color: string;
    Frequency: "DAILY" | "WEEKLY" | "MONTHLY";
    CurrentStreak: number;
    LongestStreak: number;
    TotalCompletions: number;
    CompletionHistory: CompletionRecord[];
    completedToday: boolean;
    IsActive: boolean;
}

const DIFFICULTY_COLORS = {
    EASY: "#34C759",
    MEDIUM: "#FF9500",
    HARD: "#FF3B30",
};

const DIFFICULTY_XP = {
    EASY: 5,
    MEDIUM: 10,
    HARD: 20,
};

// ─── Mini calendar (last 7 days) ──────────────────────────────────────────────

function MiniCalendar({ history, color }: { history: CompletionRecord[]; color: string }) {
    const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
    });

    const done = new Set(history.map((h) => h.Date));

    return (
        <div className="flex gap-1">
            {days.map((day) => (
                <div
                    key={day}
                    className="w-5 h-5 rounded-md"
                    style={{
                        background: done.has(day) ? color : "rgba(128,128,128,0.2)",
                        opacity: done.has(day) ? 1 : 0.4,
                    }}
                    title={day}
                />
            ))}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HabitsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // New habit form
    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formEmoji, setFormEmoji] = useState("✅");
    const [formColor, setFormColor] = useState("#34C759");
    const [formDifficulty, setFormDifficulty] = useState<Habit["Difficulty"]>("MEDIUM");
    const [formFrequency, setFormFrequency] = useState<Habit["Frequency"]>("DAILY");
    const [formSaving, setFormSaving] = useState(false);

    // AI mode
    const [aiMode, setAiMode] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    // XP toast
    const [xpToast, setXpToast] = useState<{ xp: number; streak: number } | null>(null);

    const showToast = (xp: number, streak: number) => {
        setXpToast({ xp, streak });
        setTimeout(() => setXpToast(null), 3000);
    };

    const fetchHabits = useCallback(async () => {
        try {
            const res = await fetch("/api/productivity/habits");
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            setIsAuthenticated(true);
            if (res.ok) {
                const json = await res.json();
                setHabits(json.data ?? []);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHabits();
    }, [fetchHabits]);

    // ── Complete habit ────────────────────────────────────────────────────────

    const toggleHabit = async (habit: Habit) => {
        if (!isAuthenticated) return;

        if (habit.completedToday) {
            // Un-complete
            setHabits((prev) =>
                prev.map((h) =>
                    h.HabitID === habit.HabitID
                        ? { ...h, completedToday: false, CurrentStreak: Math.max(0, h.CurrentStreak - 1) }
                        : h
                )
            );
            const today = new Date().toISOString().split("T")[0];
            await fetch(`/api/productivity/habits/${habit.HabitID}/complete?date=${today}`, {
                method: "DELETE",
            });
        } else {
            // Complete
            setHabits((prev) =>
                prev.map((h) =>
                    h.HabitID === habit.HabitID
                        ? { ...h, completedToday: true, CurrentStreak: h.CurrentStreak + 1 }
                        : h
                )
            );
            try {
                const res = await fetch(`/api/productivity/habits/${habit.HabitID}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                if (res.ok) {
                    const json = await res.json();
                    showToast(json.data?.xpAwarded ?? 0, json.data?.streak ?? 0);
                    // Refresh to get updated history
                    fetchHabits();
                }
            } catch { /* ignore */ }
        }
    };

    // ── Create habit ──────────────────────────────────────────────────────────

    const createHabit = async () => {
        if (!formTitle.trim() || !isAuthenticated) return;
        setFormSaving(true);
        try {
            const res = await fetch("/api/productivity/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Title: formTitle.trim(),
                    Emoji: formEmoji,
                    Color: formColor,
                    Difficulty: formDifficulty,
                    Frequency: formFrequency,
                }),
            });
            if (res.ok) {
                setFormTitle("");
                setFormEmoji("✅");
                setShowForm(false);
                fetchHabits();
            }
        } finally {
            setFormSaving(false);
        }
    };

    // ── AI create habit ────────────────────────────────────────────────────────

    const handleAICreate = async () => {
        if (!aiPrompt.trim() || !isAuthenticated) return;
        setAiLoading(true);
        try {
            const res = await fetch("/api/productivity/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create_habit", prompt: aiPrompt }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data?.Title) {
                    const createRes = await fetch("/api/productivity/habits", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...json.data, AIGenerated: true }),
                    });
                    if (createRes.ok) {
                        setAiPrompt("");
                        setAiMode(false);
                        fetchHabits();
                    }
                }
            }
        } finally {
            setAiLoading(false);
        }
    };

    // ── Delete habit ──────────────────────────────────────────────────────────

    const deleteHabit = async (id: string) => {
        setHabits((prev) => prev.filter((h) => h.HabitID !== id));
        try {
            await fetch(`/api/productivity/habits/${id}`, { method: "DELETE" });
        } catch { /* ignore */ }
    };

    return (
        <ToolPageWrapper
            title="Habits"
            description="Build streaks, track completion, earn XP"
            icon={<Loop sx={{ fontSize: 24 }} />}
            accentColor="#34C759"
        >
            {/* ── XP Toast ── */}
            <AnimatePresence>
                {xpToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-6 left-1/2 z-50 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #34C759, #5E97F6)" }}
                    >
                        <LocalFireDepartment sx={{ fontSize: 20, color: "#fff" }} />
                        <span className="text-white font-bold text-sm">
                            +{xpToast.xp} XP · {xpToast.streak} day streak 🔥
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto space-y-5">
                {/* ── Add habit button / form ── */}
                {isAuthenticated !== false && (
                    <div className="flex gap-2">
                        <motion.button
                            onClick={() => { setShowForm((v) => !v); setAiMode(false); }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold"
                            style={{ background: "#34C759", color: "#fff" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Add sx={{ fontSize: 18 }} />
                            New Habit
                        </motion.button>
                        <motion.button
                            onClick={() => { setAiMode((v) => !v); setShowForm(false); }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold"
                            style={{
                                background: aiMode
                                    ? "linear-gradient(135deg, #AF52DE, #5E97F6)"
                                    : isDark
                                        ? "rgba(255,255,255,0.08)"
                                        : "rgba(0,0,0,0.06)",
                                color: aiMode ? "#fff" : palette.textSecondary,
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Psychology sx={{ fontSize: 18 }} />
                            AI Suggest
                        </motion.button>
                    </div>
                )}

                {/* ── Manual form ── */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Card>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            value={formEmoji}
                                            onChange={(e) => setFormEmoji(e.target.value)}
                                            className="w-12 text-center text-2xl outline-none bg-transparent"
                                            maxLength={2}
                                        />
                                        <input
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && createHabit()}
                                            placeholder="Habit name…"
                                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                            }}
                                        />
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        {(["EASY", "MEDIUM", "HARD"] as Habit["Difficulty"][]).map((d) => (
                                            <motion.button
                                                key={d}
                                                onClick={() => setFormDifficulty(d)}
                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background:
                                                        formDifficulty === d
                                                            ? DIFFICULTY_COLORS[d]
                                                            : isDark
                                                                ? "rgba(255,255,255,0.07)"
                                                                : "rgba(0,0,0,0.05)",
                                                    color: formDifficulty === d ? "#fff" : palette.textSecondary,
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {d} (+{DIFFICULTY_XP[d]}XP)
                                            </motion.button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        {(["DAILY", "WEEKLY", "MONTHLY"] as Habit["Frequency"][]).map((f) => (
                                            <motion.button
                                                key={f}
                                                onClick={() => setFormFrequency(f)}
                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background:
                                                        formFrequency === f
                                                            ? "#34C759"
                                                            : isDark
                                                                ? "rgba(255,255,255,0.07)"
                                                                : "rgba(0,0,0,0.05)",
                                                    color: formFrequency === f ? "#fff" : palette.textSecondary,
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {f}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        {["#34C759", "#5E97F6", "#FF9500", "#AF52DE", "#FF3B30", "#5AC8FA"].map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setFormColor(c)}
                                                className="w-6 h-6 rounded-full"
                                                style={{
                                                    background: c,
                                                    outline: formColor === c ? `3px solid ${c}` : "none",
                                                    outlineOffset: "2px",
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <motion.button
                                        onClick={createHabit}
                                        disabled={formSaving || !formTitle.trim()}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold"
                                        style={{ background: "#34C759", color: "#fff" }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {formSaving ? "Saving…" : "Create Habit"}
                                    </motion.button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── AI form ── */}
                <AnimatePresence>
                    {aiMode && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Card>
                                <div className="space-y-3">
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Describe the habit you want to build… e.g. 'I want to meditate every morning for 10 minutes'"
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                            color: palette.textPrimary,
                                            border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                        }}
                                    />
                                    <motion.button
                                        onClick={handleAICreate}
                                        disabled={aiLoading || !aiPrompt.trim()}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold"
                                        style={{
                                            background: aiLoading
                                                ? palette.textTertiary
                                                : "linear-gradient(135deg, #AF52DE, #5E97F6)",
                                            color: "#fff",
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {aiLoading ? "Creating with AI…" : "✨ Create Habit with AI"}
                                    </motion.button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Habits list ── */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {!loading && habits.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16"
                                style={{ color: palette.textTertiary }}
                            >
                                <Loop sx={{ fontSize: 48, opacity: 0.3 }} />
                                <p className="mt-3 text-sm">No habits yet — build your first one above</p>
                            </motion.div>
                        )}

                        {habits.map((habit) => (
                            <motion.div
                                key={habit.HabitID}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -60 }}
                            >
                                <Card>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            {/* Complete button */}
                                            <motion.button
                                                onClick={() => toggleHabit(habit)}
                                                whileTap={{ scale: 0.85 }}
                                                className="flex-shrink-0"
                                            >
                                                {habit.completedToday ? (
                                                    <CheckCircle sx={{ fontSize: 28, color: habit.Color }} />
                                                ) : (
                                                    <RadioButtonUnchecked sx={{ fontSize: 28, color: habit.Color }} />
                                                )}
                                            </motion.button>

                                            {/* Emoji */}
                                            <span className="text-xl flex-shrink-0">{habit.Emoji}</span>

                                            {/* Title & streak */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm truncate" style={{ color: palette.textPrimary }}>
                                                        {habit.Title}
                                                    </span>
                                                    {habit.CurrentStreak > 0 && (
                                                        <span
                                                            className="flex items-center gap-0.5 text-xs font-bold flex-shrink-0"
                                                            style={{ color: "#FF9500" }}
                                                        >
                                                            <LocalFireDepartment sx={{ fontSize: 12 }} />
                                                            {habit.CurrentStreak}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span
                                                        className="text-xs font-bold"
                                                        style={{ color: DIFFICULTY_COLORS[habit.Difficulty] }}
                                                    >
                                                        {habit.Difficulty}
                                                    </span>
                                                    <span className="text-xs" style={{ color: palette.textTertiary }}>
                                                        {habit.TotalCompletions} completions
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Delete */}
                                            <motion.button
                                                onClick={() => deleteHabit(habit.HabitID)}
                                                whileTap={{ scale: 0.9 }}
                                                style={{ color: "#FF3B30" }}
                                            >
                                                <Delete sx={{ fontSize: 18 }} />
                                            </motion.button>
                                        </div>

                                        {/* 7-day calendar */}
                                        <div className="pl-11">
                                            <MiniCalendar history={habit.CompletionHistory} color={habit.Color} />
                                            <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>
                                                Best streak: {habit.LongestStreak} days
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* ── Not authenticated ── */}
                {isAuthenticated === false && (
                    <Card>
                        <div className="text-center py-8 space-y-2">
                            <p className="text-sm font-bold" style={{ color: palette.textPrimary }}>
                                Sign in to track habits
                            </p>
                            <a
                                href="/auth/login"
                                className="inline-block px-5 py-2 rounded-full text-sm font-bold"
                                style={{ background: "#34C759", color: "#fff" }}
                            >
                                Sign In
                            </a>
                        </div>
                    </Card>
                )}
            </div>
        </ToolPageWrapper>
    );
}
