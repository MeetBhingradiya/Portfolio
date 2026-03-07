/**
 * Goals — /tools/productivity/goals
 * Short & long-term goal tracker with milestones, progress bars, and AI breakdown.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    TrackChanges,
    Add,
    Delete,
    EmojiEvents,
    Psychology,
    ExpandMore,
    ExpandLess,
    CheckCircle,
    RadioButtonUnchecked,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Milestone {
    id: string;
    Title: string;
    Status: "PENDING" | "COMPLETED" | "SKIPPED";
    TargetDate?: string;
}

interface Goal {
    GoalID: string;
    Title: string;
    Description?: string;
    Category: string;
    Emoji: string;
    Color: string;
    Type: "SHORT_TERM" | "LONG_TERM" | "ONGOING";
    Status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "ABANDONED";
    ProgressCurrent: number;
    ProgressTarget: number;
    ProgressType: "PERCENTAGE" | "NUMERIC" | "BOOLEAN";
    ProgressUnit?: string;
    Milestones: Milestone[];
    TargetDate?: string;
    Motivation?: string;
    XPReward: number;
    Tags: string[];
}

const TYPE_COLORS = {
    SHORT_TERM: "#5E97F6",
    LONG_TERM: "#AF52DE",
    ONGOING: "#34C759",
};

const TYPE_LABELS = {
    SHORT_TERM: "Short-term",
    LONG_TERM: "Long-term",
    ONGOING: "Ongoing",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoalsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

    // Form
    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formEmoji, setFormEmoji] = useState("🎯");
    const [formType, setFormType] = useState<Goal["Type"]>("SHORT_TERM");
    const [formTargetDate, setFormTargetDate] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formSaving, setFormSaving] = useState(false);

    // AI
    const [aiMode, setAiMode] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    // XP toast
    const [xpToast, setXpToast] = useState<{ xp: number } | null>(null);

    const fetchGoals = useCallback(async () => {
        try {
            const res = await fetch("/api/productivity/goals");
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            setIsAuthenticated(true);
            if (res.ok) {
                const json = await res.json();
                setGoals(json.data ?? []);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const createGoal = async () => {
        if (!formTitle.trim() || !isAuthenticated) return;
        setFormSaving(true);
        try {
            const res = await fetch("/api/productivity/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Title: formTitle.trim(),
                    Emoji: formEmoji,
                    Type: formType,
                    TargetDate: formTargetDate || undefined,
                    Description: formDescription.trim() || undefined,
                }),
            });
            if (res.ok) {
                setFormTitle("");
                setFormEmoji("🎯");
                setFormDescription("");
                setFormTargetDate("");
                setShowForm(false);
                fetchGoals();
            }
        } finally {
            setFormSaving(false);
        }
    };

    const handleAICreate = async () => {
        if (!aiPrompt.trim() || !isAuthenticated) return;
        setAiLoading(true);
        try {
            const res = await fetch("/api/productivity/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create_goal", prompt: aiPrompt }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data?.Title) {
                    const createRes = await fetch("/api/productivity/goals", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...json.data, AIGenerated: true }),
                    });
                    if (createRes.ok) {
                        setAiPrompt("");
                        setAiMode(false);
                        fetchGoals();
                    }
                }
            }
        } finally {
            setAiLoading(false);
        }
    };

    const updateProgress = async (goal: Goal, newValue: number) => {
        const clamped = Math.min(Math.max(0, newValue), goal.ProgressTarget);
        setGoals((prev) =>
            prev.map((g) => (g.GoalID === goal.GoalID ? { ...g, ProgressCurrent: clamped } : g))
        );
        try {
            const res = await fetch(`/api/productivity/goals/${goal.GoalID}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ProgressCurrent: clamped }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data?.Status === "COMPLETED") {
                    setXpToast({ xp: goal.XPReward });
                    setTimeout(() => setXpToast(null), 3000);
                    fetchGoals();
                }
            }
        } catch { /* ignore */ }
    };

    const toggleMilestone = async (goal: Goal, milestoneId: string) => {
        const ms = goal.Milestones.find((m) => m.id === milestoneId);
        if (!ms) return;
        const newStatus = ms.Status === "COMPLETED" ? "PENDING" : "COMPLETED";

        setGoals((prev) =>
            prev.map((g) =>
                g.GoalID === goal.GoalID
                    ? {
                        ...g,
                        Milestones: g.Milestones.map((m) =>
                            m.id === milestoneId ? { ...m, Status: newStatus } : m
                        ),
                    }
                    : g
            )
        );

        try {
            await fetch(`/api/productivity/goals/${goal.GoalID}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ milestoneId, milestoneStatus: newStatus }),
            });
        } catch { /* ignore */ }
    };

    const deleteGoal = async (id: string) => {
        setGoals((prev) => prev.filter((g) => g.GoalID !== id));
        try {
            await fetch(`/api/productivity/goals/${id}`, { method: "DELETE" });
        } catch { /* ignore */ }
    };

    const filtered = goals.filter((g) => {
        if (filter === "active") return g.Status !== "COMPLETED" && g.Status !== "ABANDONED";
        if (filter === "completed") return g.Status === "COMPLETED";
        return true;
    });

    return (
        <ToolPageWrapper
            title="Goals"
            description="Set, track and achieve your short & long-term goals"
            icon={<TrackChanges sx={{ fontSize: 24 }} />}
            accentColor="#AF52DE"
        >
            {/* XP Toast */}
            <AnimatePresence>
                {xpToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-6 left-1/2 z-50 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #AF52DE, #5E97F6)" }}
                    >
                        <EmojiEvents sx={{ fontSize: 20, color: "#fff" }} />
                        <span className="text-white font-bold text-sm">
                            Goal achieved! +{xpToast.xp} XP 🎉
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto space-y-5">
                {/* Toolbar */}
                {isAuthenticated !== false && (
                    <div className="flex gap-2 flex-wrap">
                        <motion.button
                            onClick={() => { setShowForm((v) => !v); setAiMode(false); }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold"
                            style={{ background: "#AF52DE", color: "#fff" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Add sx={{ fontSize: 18 }} />
                            New Goal
                        </motion.button>
                        <motion.button
                            onClick={() => { setAiMode((v) => !v); setShowForm(false); }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold"
                            style={{
                                background: aiMode ? "linear-gradient(135deg, #AF52DE, #5E97F6)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                color: aiMode ? "#fff" : palette.textSecondary,
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Psychology sx={{ fontSize: 18 }} />
                            AI Breakdown
                        </motion.button>
                        {/* Filters */}
                        {(["all", "active", "completed"] as const).map((f) => (
                            <motion.button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
                                style={{
                                    background: filter === f ? "#AF52DE" : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: filter === f ? "#fff" : palette.textSecondary,
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {f}
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Manual form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
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
                                            onKeyDown={(e) => e.key === "Enter" && createGoal()}
                                            placeholder="Goal title…"
                                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                            }}
                                        />
                                    </div>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Why is this goal important to you? (optional)"
                                        rows={2}
                                        className="w-full px-4 py-2 rounded-xl text-sm outline-none resize-none"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                            color: palette.textPrimary,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                                        }}
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {(["SHORT_TERM", "LONG_TERM", "ONGOING"] as Goal["Type"][]).map((t) => (
                                            <motion.button
                                                key={t}
                                                onClick={() => setFormType(t)}
                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background: formType === t ? TYPE_COLORS[t] : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                                    color: formType === t ? "#fff" : palette.textSecondary,
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {TYPE_LABELS[t]}
                                            </motion.button>
                                        ))}
                                    </div>
                                    <input
                                        type="date"
                                        value={formTargetDate}
                                        onChange={(e) => setFormTargetDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                            color: palette.textSecondary,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                                        }}
                                    />
                                    <motion.button
                                        onClick={createGoal}
                                        disabled={formSaving || !formTitle.trim()}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold"
                                        style={{ background: "#AF52DE", color: "#fff" }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {formSaving ? "Saving…" : "Create Goal"}
                                    </motion.button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI form */}
                <AnimatePresence>
                    {aiMode && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <Card>
                                <div className="space-y-3">
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Describe your goal… e.g. 'I want to run a 5K in under 30 minutes in 3 months'"
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
                                            background: aiLoading ? palette.textTertiary : "linear-gradient(135deg, #AF52DE, #5E97F6)",
                                            color: "#fff",
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {aiLoading ? "Breaking down goal with AI…" : "✨ Create Goal with AI Milestones"}
                                    </motion.button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Goals list */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {!loading && filtered.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16" style={{ color: palette.textTertiary }}>
                                <TrackChanges sx={{ fontSize: 48, opacity: 0.3 }} />
                                <p className="mt-3 text-sm">No goals yet — set your first one above</p>
                            </motion.div>
                        )}

                        {filtered.map((goal) => {
                            const progressPct = Math.min(100, Math.floor((goal.ProgressCurrent / goal.ProgressTarget) * 100));
                            const isExpanded = expandedId === goal.GoalID;
                            const isComplete = goal.Status === "COMPLETED";

                            return (
                                <motion.div
                                    key={goal.GoalID}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -60 }}
                                >
                                    <Card>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl flex-shrink-0 mt-0.5">{goal.Emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <span className={`font-semibold text-sm ${isComplete ? "line-through opacity-60" : ""}`} style={{ color: palette.textPrimary }}>
                                                            {goal.Title}
                                                        </span>
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <motion.button
                                                                onClick={() => setExpandedId(isExpanded ? null : goal.GoalID)}
                                                                whileTap={{ scale: 0.9 }}
                                                                style={{ color: palette.textTertiary }}
                                                            >
                                                                {isExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={() => deleteGoal(goal.GoalID)}
                                                                whileTap={{ scale: 0.9 }}
                                                                style={{ color: "#FF3B30" }}
                                                            >
                                                                <Delete sx={{ fontSize: 18 }} />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span
                                                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                            style={{
                                                                background: `${TYPE_COLORS[goal.Type]}20`,
                                                                color: TYPE_COLORS[goal.Type],
                                                            }}
                                                        >
                                                            {TYPE_LABELS[goal.Type]}
                                                        </span>
                                                        {goal.TargetDate && (
                                                            <span className="text-xs" style={{ color: palette.textTertiary }}>
                                                                Due {new Date(goal.TargetDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs" style={{ color: palette.textTertiary }}>
                                                    <span>Progress</span>
                                                    <span>{progressPct}%</span>
                                                </div>
                                                <div
                                                    className="h-2.5 rounded-full overflow-hidden"
                                                    style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
                                                >
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ background: isComplete ? "#34C759" : goal.Color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progressPct}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                    />
                                                </div>
                                                {/* Drag progress slider (only when expanded and not complete) */}
                                                {isExpanded && !isComplete && (
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={goal.ProgressTarget}
                                                        value={goal.ProgressCurrent}
                                                        onChange={(e) => updateProgress(goal, parseInt(e.target.value))}
                                                        className="w-full mt-1"
                                                        style={{ accentColor: goal.Color }}
                                                    />
                                                )}
                                            </div>

                                            {/* Milestones (expanded) */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden space-y-2"
                                                    >
                                                        {goal.Description && (
                                                            <p className="text-xs" style={{ color: palette.textSecondary }}>
                                                                {goal.Description}
                                                            </p>
                                                        )}
                                                        {goal.Milestones.length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <p className="text-xs font-bold" style={{ color: palette.textTertiary }}>
                                                                    Milestones
                                                                </p>
                                                                {goal.Milestones.map((ms) => (
                                                                    <motion.button
                                                                        key={ms.id}
                                                                        onClick={() => toggleMilestone(goal, ms.id)}
                                                                        className="flex items-center gap-2 w-full text-left"
                                                                        whileTap={{ scale: 0.98 }}
                                                                    >
                                                                        {ms.Status === "COMPLETED" ? (
                                                                            <CheckCircle sx={{ fontSize: 16, color: "#34C759" }} />
                                                                        ) : (
                                                                            <RadioButtonUnchecked sx={{ fontSize: 16, color: palette.textTertiary }} />
                                                                        )}
                                                                        <span
                                                                            className={`text-xs ${ms.Status === "COMPLETED" ? "line-through opacity-50" : ""}`}
                                                                            style={{ color: palette.textPrimary }}
                                                                        >
                                                                            {ms.Title}
                                                                        </span>
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-1">
                                                            {goal.Tags.map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="px-2 py-0.5 rounded-full text-xs"
                                                                    style={{
                                                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                                        color: palette.textTertiary,
                                                                    }}
                                                                >
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {isAuthenticated === false && (
                    <Card>
                        <div className="text-center py-8 space-y-2">
                            <p className="text-sm font-bold" style={{ color: palette.textPrimary }}>Sign in to track goals</p>
                            <a href="/auth/login" className="inline-block px-5 py-2 rounded-full text-sm font-bold" style={{ background: "#AF52DE", color: "#fff" }}>Sign In</a>
                        </div>
                    </Card>
                )}
            </div>
        </ToolPageWrapper>
    );
}
