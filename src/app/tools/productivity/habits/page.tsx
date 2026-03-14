/**
 * Habits — /tools/productivity/habits
 * Daily habit tracker: streaks, 7-day calendar, completion, XP rewards.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    Add, LocalFireDepartment, CheckCircle, MoreVert, Delete, Edit, Close,
    Loop, Psychology, Star, Refresh,
} from "@mui/icons-material";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Habit {
    HabitID: string; Title: string; Description?: string;
    Category: string; Difficulty: string; Emoji: string; Color: string;
    Frequency: string; FrequencyDays: number[];
    CurrentStreak: number; LongestStreak: number; TotalCompletions: number;
    TotalXPEarned: number; LastCompletedDate?: string;
    CompletionHistory: { Date: string }[];
    completedToday: boolean;
    IsActive: boolean; ReminderEnabled: boolean; ReminderTime?: string;
    createdAt: string;
}

interface XPToast { xp: number; streak: number; }

const ACCENT = "#AF52DE";
const XP_LABELS = { EASY: 5, MEDIUM: 10, HARD: 20 } as const;
const DIFF_COLORS = { EASY: "#22c55e", MEDIUM: "#f59e0b", HARD: "#ef4444" } as const;
const CATEGORIES = ["ALL", "HEALTH", "FITNESS", "MINDFULNESS", "LEARNING", "PRODUCTIVITY", "SOCIAL", "FINANCE", "CREATIVITY", "OTHER"];
const EMOJI_PRESETS = ["💪","🧘","📚","🏃","💤","🥗","💧","🧹","📝","🎯","🎸","🌱","⚡","🧠","❤️","🌞"];
const COLORS = ["#AF52DE","#22c55e","#3b82f6","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];

// ─── XP Toast ──────────────────────────────────────────────────────────────────

function XPToastBanner({ toast, onDone }: { toast: XPToast; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
    return (
        <motion.div
            className="fixed top-4 left-1/2 z-[100] px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-bold flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)`, translateX: "-50%" }}
            initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.9 }}>
            <Star style={{ fontSize: 18 }} />
            +{toast.xp} XP
            {toast.streak > 1 && <span className="flex items-center gap-0.5 font-normal text-xs"><LocalFireDepartment style={{ fontSize: 14 }} /> {toast.streak} day streak</span>}
        </motion.div>
    );
}

// ─── 7-Day Mini Calendar ────────────────────────────────────────────────────────

function MiniCalendar({ history, color, isDark }: { history: { Date: string }[]; color: string; isDark: boolean }) {
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const done    = history.some(h => h.Date === dateStr);
        const today   = i === 6;
        return { dateStr, done, today, label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1), day: d.getDate() };
    });
    return (
        <div className="flex gap-1">
            {days.map(d => (
                <div key={d.dateStr} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>{d.label}</span>
                    <div
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{
                            background: d.done ? color : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                            border: d.today ? `1.5px solid ${color}` : "1.5px solid transparent",
                        }}
                        title={d.dateStr}
                    >
                        {d.done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span className="text-[9px]" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>{d.day}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Habit Card ─────────────────────────────────────────────────────────────────

function HabitCard({
    habit, isDark, isApple, palette, border, cardBg,
    onComplete, onEdit, onDelete,
}: {
    habit: Habit; isDark: boolean; isApple: boolean; palette: any; border: string; cardBg: string;
    onComplete: (h: Habit) => void; onEdit: (h: Habit) => void; onDelete: (id: string) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef   = useRef<HTMLDivElement>(null);
    const diff      = DIFF_COLORS[habit.Difficulty as keyof typeof DIFF_COLORS] ?? "#6b7280";

    useEffect(() => {
        function handler(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); }
        if (menuOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    return (
        <motion.div className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: isApple ? "blur(16px)" : "none" }}
            layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>

            {/* Color accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: habit.Color ?? ACCENT }} />

            <div className="flex items-start gap-3">
                {/* Emoji */}
                <div className="text-2xl mt-0.5 select-none">{habit.Emoji}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate" style={{ color: palette.textPrimary }}>{habit.Title}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: `${diff}18`, color: diff }}>{habit.Difficulty}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: palette.textTertiary }}>{habit.Frequency}</span>
                    </div>
                    {habit.Description && <p className="text-xs mt-0.5 leading-relaxed line-clamp-1" style={{ color: palette.textSecondary }}>{habit.Description}</p>}

                    {/* Streak row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-center gap-1">
                            <LocalFireDepartment style={{ color: "#f59e0b", fontSize: 14 }} />
                            <span className="text-sm font-bold" style={{ color: palette.textPrimary }}>{habit.CurrentStreak}</span>
                            <span className="text-xs" style={{ color: palette.textTertiary }}>day streak</span>
                        </div>
                        {habit.LongestStreak > 0 && (
                            <span className="text-xs" style={{ color: palette.textTertiary }}>Best: {habit.LongestStreak}</span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${ACCENT}14`, color: ACCENT }}>
                            +{XP_LABELS[habit.Difficulty as keyof typeof XP_LABELS] ?? 10} XP
                        </span>
                    </div>

                    {/* 7-day calendar */}
                    <div className="mt-3">
                        <MiniCalendar history={habit.CompletionHistory ?? []} color={habit.Color ?? ACCENT} isDark={isDark} />
                    </div>

                    {/* Completions total */}
                    <p className="text-xs mt-2" style={{ color: palette.textTertiary }}>{habit.TotalCompletions} completions · {habit.TotalXPEarned} XP earned</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(v => !v)} style={{ color: palette.textTertiary }}>
                            <MoreVert style={{ fontSize: 18 }} />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                                    style={{ background: isDark ? "rgba(28,28,30,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${border}`, backdropFilter: "blur(16px)" }}
                                    initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -6 }}>
                                    <button onClick={() => { onEdit(habit); setMenuOpen(false); }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5" style={{ color: palette.textPrimary }}>
                                        <Edit style={{ fontSize: 15 }} /> Edit
                                    </button>
                                    <div className="h-px mx-2 my-1" style={{ background: border }} />
                                    <button onClick={() => { onDelete(habit.HabitID); setMenuOpen(false); }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-500/10" style={{ color: "#ef4444" }}>
                                        <Delete style={{ fontSize: 15 }} /> Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Complete button */}
                    <motion.button
                        onClick={() => onComplete(habit)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{
                            background: habit.completedToday ? "#22c55e20" : `${habit.Color ?? ACCENT}20`,
                            color: habit.completedToday ? "#22c55e" : habit.Color ?? ACCENT,
                            border: `1.5px solid ${habit.completedToday ? "#22c55e40" : `${habit.Color ?? ACCENT}40`}`,
                        }}
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        title={habit.completedToday ? "Mark incomplete" : "Complete habit"}>
                        {habit.completedToday ? <CheckCircle style={{ fontSize: 20 }} /> : <span style={{ fontSize: 18 }}>{habit.Emoji}</span>}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Add/Edit Modal ─────────────────────────────────────────────────────────────

function HabitModal({
    initial, isDark, isApple, palette, border, onSave, onClose,
}: {
    initial?: Partial<Habit>; isDark: boolean; isApple: boolean; palette: any; border: string;
    onSave: (data: Partial<Habit>) => void; onClose: () => void;
}) {
    const [title,     setTitle]     = useState(initial?.Title ?? "");
    const [desc,      setDesc]      = useState(initial?.Description ?? "");
    const [emoji,     setEmoji]     = useState(initial?.Emoji ?? "✅");
    const [color,     setColor]     = useState(initial?.Color ?? ACCENT);
    const [diff,      setDiff]      = useState(initial?.Difficulty ?? "MEDIUM");
    const [freq,      setFreq]      = useState(initial?.Frequency ?? "DAILY");
    const [days,      setDays]      = useState<number[]>(initial?.FrequencyDays ?? [0,1,2,3,4,5,6]);
    const [cat,       setCat]       = useState(initial?.Category ?? "OTHER");
    const [reminder,  setReminder]  = useState(initial?.ReminderEnabled ?? false);
    const [remTime,   setRemTime]   = useState(initial?.ReminderTime ?? "08:00");
    const [aiMode,    setAiMode]    = useState(false);
    const [aiPrompt,  setAiPrompt]  = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const modalBg = isApple ? isDark ? "rgba(28,28,30,0.97)" : "rgba(255,255,255,0.97)" : palette.surface;
    const day_names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    async function handleAI() {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const r = await fetch("/api/productivity/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_habit", prompt: aiPrompt }) });
            const j = await r.json();
            if (j.success && j.data) { setTitle(j.data.Title ?? ""); setDesc(j.data.Description ?? ""); setDiff(j.data.Difficulty ?? "MEDIUM"); setAiMode(false); }
        } finally { setAiLoading(false); }
    }

    function toggleDay(d: number) {
        setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    }

    return (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{ background: modalBg, border: `1px solid ${border}`, backdropFilter: isApple ? "blur(24px)" : "none" }}
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>

                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-lg" style={{ color: palette.textPrimary }}>{initial?.HabitID ? "Edit Habit" : "New Habit"}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setAiMode(v => !v)} className="p-1.5 rounded-lg" style={{ color: aiMode ? ACCENT : palette.textTertiary, background: aiMode ? `${ACCENT}18` : "transparent" }}>
                            <Psychology style={{ fontSize: 20 }} />
                        </button>
                        <button onClick={onClose}><Close style={{ color: palette.textTertiary }} /></button>
                    </div>
                </div>

                {aiMode && (
                    <div className="mb-4 flex gap-2">
                        <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAI()}
                            placeholder="Describe the habit…" className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                        <button onClick={handleAI} disabled={aiLoading} className="px-3 py-2 rounded-xl text-sm font-semibold shrink-0" style={{ background: ACCENT, color: "#fff", opacity: aiLoading ? 0.6 : 1 }}>
                            {aiLoading ? "…" : "Go"}
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Emoji + Color row */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Emoji</p>
                            <div className="flex flex-wrap gap-1.5">
                                {EMOJI_PRESETS.map(e => (
                                    <button key={e} onClick={() => setEmoji(e)}
                                        className="w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all"
                                        style={{ background: emoji === e ? `${color}20` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: emoji === e ? `1.5px solid ${color}` : "1.5px solid transparent" }}>
                                        {e}
                                    </button>
                                ))}
                                <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}
                                    className="w-12 h-8 rounded-lg text-center text-lg outline-none border"
                                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Color</p>
                            <div className="flex flex-wrap gap-1.5">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setColor(c)}
                                        className="w-6 h-6 rounded-full"
                                        style={{ background: c, border: color === c ? "2.5px solid #fff" : "2px solid transparent", outline: color === c ? `2px solid ${c}` : "none" }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Habit title *"
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />

                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={2}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />

                    {/* Difficulty */}
                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Difficulty</p>
                        <div className="flex gap-2">
                            {(["EASY","MEDIUM","HARD"] as const).map(d => (
                                <button key={d} onClick={() => setDiff(d)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: diff === d ? `${DIFF_COLORS[d]}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: diff === d ? DIFF_COLORS[d] : palette.textTertiary, border: `1px solid ${diff === d ? DIFF_COLORS[d] : border}` }}>
                                    {d} (+{XP_LABELS[d]} XP)
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Frequency</p>
                        <div className="flex gap-2">
                            {["DAILY","WEEKLY","MONTHLY","YEARLY"].map(f => (
                                <button key={f} onClick={() => setFreq(f)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: freq === f ? `${ACCENT}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: freq === f ? ACCENT : palette.textTertiary, border: `1px solid ${freq === f ? ACCENT : border}` }}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Days of week (for weekly) */}
                    {freq === "WEEKLY" && (
                        <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Days</p>
                            <div className="flex gap-1">
                                {day_names.map((n, i) => (
                                    <button key={i} onClick={() => toggleDay(i)}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                                        style={{ background: days.includes(i) ? `${ACCENT}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: days.includes(i) ? ACCENT : palette.textTertiary, border: `1px solid ${days.includes(i) ? ACCENT : border}` }}>
                                        {n[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Category</p>
                        <select value={cat} onChange={e => setCat(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }}>
                            {["HEALTH","FITNESS","MINDFULNESS","LEARNING","PRODUCTIVITY","SOCIAL","FINANCE","CREATIVITY","OTHER"].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Reminder */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: palette.textPrimary }}>Daily Reminder</span>
                        <button onClick={() => setReminder(v => !v)}
                            className="w-12 h-6 rounded-full transition-all relative flex items-center"
                            style={{ background: reminder ? ACCENT : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>
                            <motion.div className="w-5 h-5 rounded-full bg-white shadow absolute"
                                animate={{ left: reminder ? "auto" : 2, right: reminder ? 2 : "auto" }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
                        </button>
                    </div>
                    {reminder && (
                        <input type="time" value={remTime} onChange={e => setRemTime(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>Cancel</button>
                    <button onClick={() => {
                        if (!title.trim()) return;
                        onSave({ Title: title.trim(), Description: desc.trim() || undefined, Emoji: emoji, Color: color, Difficulty: diff, Frequency: freq, FrequencyDays: days, Category: cat, ReminderEnabled: reminder, ReminderTime: reminder ? remTime : undefined });
                    }} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: ACCENT, color: "#fff" }}>
                        {initial?.HabitID ? "Save Changes" : "Add Habit"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HabitsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const cardBg = isApple ? isDark ? "rgba(44,44,46,0.72)" : "rgba(255,255,255,0.75)" : palette.surface;
    const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";

    const [habits,     setHabits]     = useState<Habit[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [catFilter,  setCatFilter]  = useState("ALL");
    const [showModal,  setShowModal]  = useState(false);
    const [editHabit,  setEditHabit]  = useState<Habit | undefined>();
    const [toast,      setToast]      = useState<XPToast | null>(null);

    const fetchHabits = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (catFilter !== "ALL") params.set("category", catFilter);
            const r = await fetch(`/api/productivity/habits?${params}`);
            const j = await r.json();
            if (j.success) setHabits(j.data ?? []);
        } finally { setLoading(false); }
    }, [catFilter]);

    useEffect(() => { fetchHabits(); }, [fetchHabits]);

    async function completeHabit(habit: Habit) {
        const today = new Date().toISOString().split("T")[0];
        if (habit.completedToday) {
            await fetch(`/api/productivity/habits/${habit.HabitID}/complete?date=${today}`, { method: "DELETE" });
        } else {
            const r = await fetch(`/api/productivity/habits/${habit.HabitID}/complete`, { method: "POST" });
            const j = await r.json();
            if (j.success && j.xp) setToast({ xp: j.xp, streak: j.streak ?? 1 });
        }
        fetchHabits();
    }

    async function saveHabit(data: Partial<Habit>) {
        if (editHabit?.HabitID) {
            await fetch(`/api/productivity/habits/${editHabit.HabitID}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        } else {
            await fetch("/api/productivity/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        }
        setShowModal(false); setEditHabit(undefined); fetchHabits();
    }

    async function deleteHabit(id: string) {
        if (!confirm("Delete this habit? All streak data will be lost.")) return;
        await fetch(`/api/productivity/habits/${id}`, { method: "DELETE" });
        fetchHabits();
    }

    const todayHabits = habits.filter(h => !h.completedToday);
    const doneToday   = habits.filter(h => h.completedToday);

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 space-y-5">
            {/* XP Toast */}
            <AnimatePresence>
                {toast && <XPToastBanner toast={toast} onDone={() => setToast(null)} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Habits</h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        {doneToday.length}/{habits.length} done today
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button onClick={fetchHabits} className="p-2 rounded-xl"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.9, rotate: 180 }} transition={{ duration: 0.3 }}>
                        <Refresh style={{ color: palette.textSecondary, fontSize: 20 }} />
                    </motion.button>
                    <motion.button onClick={() => { setEditHabit(undefined); setShowModal(true); }}
                        className="px-4 py-2 rounded-2xl font-semibold text-sm flex items-center gap-1.5"
                        style={{ background: ACCENT, color: "#fff" }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Add style={{ fontSize: 18 }} /> New
                    </motion.button>
                </div>
            </div>

            {/* Today's progress bar */}
            {habits.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold" style={{ color: palette.textPrimary }}>Today's Progress</span>
                        <span className="font-bold" style={{ color: ACCENT }}>{doneToday.length}/{habits.length}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                        <motion.div className="h-full rounded-full transition-all"
                            style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, #22c55e 100%)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${habits.length ? (doneToday.length / habits.length) * 100 : 0}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }} />
                    </div>
                    {habits.length > 0 && doneToday.length === habits.length && (
                        <p className="text-xs mt-2 text-center font-semibold" style={{ color: "#22c55e" }}>🎉 All habits completed today!</p>
                    )}
                </div>
            )}

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
                {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{ background: catFilter === c ? ACCENT : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: catFilter === c ? "#fff" : palette.textTertiary }}>
                        {c === "ALL" ? "All" : c}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-7 h-7 rounded-full border-2" style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }} />
                </div>
            ) : habits.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${ACCENT}14` }}>
                        <Loop style={{ color: ACCENT, fontSize: 28 }} />
                    </div>
                    <p className="font-semibold" style={{ color: palette.textPrimary }}>No habits yet</p>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>Start building better habits to earn XP and streaks.</p>
                </div>
            ) : (
                <>
                    {/* Pending today */}
                    {todayHabits.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: palette.textTertiary }}>
                                To Do Today
                            </p>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {todayHabits.map(h => (
                                        <HabitCard key={h.HabitID} habit={h} isDark={isDark} isApple={isApple} palette={palette} border={border} cardBg={cardBg}
                                            onComplete={completeHabit} onEdit={h => { setEditHabit(h); setShowModal(true); }} onDelete={deleteHabit} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Done today */}
                    {doneToday.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#22c55e" }}>
                                ✓ Done Today
                            </p>
                            <div className="space-y-3 opacity-80">
                                <AnimatePresence mode="popLayout">
                                    {doneToday.map(h => (
                                        <HabitCard key={h.HabitID} habit={h} isDark={isDark} isApple={isApple} palette={palette} border={border} cardBg={cardBg}
                                            onComplete={completeHabit} onEdit={h => { setEditHabit(h); setShowModal(true); }} onDelete={deleteHabit} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <HabitModal initial={editHabit} isDark={isDark} isApple={isApple} palette={palette} border={border}
                        onSave={saveHabit} onClose={() => { setShowModal(false); setEditHabit(undefined); }} />
                )}
            </AnimatePresence>

            {/* Mobile FAB */}
            <motion.button
                onClick={() => { setEditHabit(undefined); setShowModal(true); }}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center lg:hidden z-40"
                style={{ background: ACCENT, color: "#fff", boxShadow: `0 8px 24px ${ACCENT}60` }}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
                <Add style={{ fontSize: 28 }} />
            </motion.button>
        </div>
    );
}
