/**
 * Goals — /tools/productivity/goals
 * Group and manage tasks, habits, and reminders under goals.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    Add, MoreVert, Delete, Edit, Close, TrackChanges,
    CheckCircle, RadioButtonUnchecked, Loop, Notifications,
    CalendarToday, Psychology, EmojiEvents,
} from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Goal {
    GoalID: string; Title: string; Description?: string;
    Category: string; Emoji: string; Color: string; Status: string;
    StartDate?: string; TargetDate?: string; CompletedAt?: string;
    LinkedTaskIDs: string[]; LinkedHabitIDs: string[]; LinkedReminderIDs: string[];
    XPEarned: number; Tags: string[]; Archived: boolean; createdAt: string;
}

interface Task    { TaskID: string;    Title: string; Status: string; }
interface Habit   { HabitID: string;   Title: string; Emoji: string; }
interface Reminder{ ReminderID: string;Title: string; ScheduledAt: string; }

const ACCENT = "#AF52DE";
const STATUS_COLORS = { NOT_STARTED: "#6b7280", IN_PROGRESS: "#3b82f6", COMPLETED: "#22c55e", ABANDONED: "#ef4444" } as const;
const STATUS_LABELS = { NOT_STARTED: "Not Started", IN_PROGRESS: "In Progress", COMPLETED: "Completed", ABANDONED: "Abandoned" } as const;
const GOAL_CATEGORIES = ["CAREER","EDUCATION","HEALTH","FITNESS","FINANCE","RELATIONSHIPS","PERSONAL_GROWTH","CREATIVITY","TRAVEL","TECHNOLOGY","OTHER"];
const EMOJI_PRESETS   = ["🎯","🚀","💡","🏆","📈","🌱","💪","🎓","💰","❤️","🌍","🧘","⭐","🔑","🎸","📚"];
const COLORS          = ["#AF52DE","#22c55e","#3b82f6","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16","#a855f7","#fb923c"];

// ─── Countdown helper ──────────────────────────────────────────────────────────

function countdown(dateStr: string): string {
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
    if (diff < 0)  return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    if (diff < 30)  return `${diff} days left`;
    const m = Math.ceil(diff / 30);
    return `${m} month${m > 1 ? "s" : ""} left`;
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({
    goal, isDark, isApple, palette, border, cardBg,
    allTasks, allHabits, allReminders,
    onEdit, onDelete, onStatusChange, onLinkUpdate,
}: {
    goal: Goal; isDark: boolean; isApple: boolean; palette: any; border: string; cardBg: string;
    allTasks: Task[]; allHabits: Habit[]; allReminders: Reminder[];
    onEdit: (g: Goal) => void; onDelete: (id: string) => void;
    onStatusChange: (id: string, status: string) => void;
    onLinkUpdate: (id: string, linkedTaskIDs: string[], linkedHabitIDs: string[], linkedReminderIDs: string[]) => void;
}) {
    const [menuOpen,   setMenuOpen]   = useState(false);
    const [expanded,   setExpanded]   = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const statusColor = STATUS_COLORS[goal.Status as keyof typeof STATUS_COLORS] ?? "#6b7280";

    useEffect(() => {
        function h(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); }
        if (menuOpen) document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [menuOpen]);

    const linkedTasks     = allTasks.filter(t => goal.LinkedTaskIDs.includes(t.TaskID));
    const linkedHabits    = allHabits.filter(h => goal.LinkedHabitIDs.includes(h.HabitID));
    const linkedReminders = allReminders.filter(r => goal.LinkedReminderIDs.includes(r.ReminderID));

    const completedTasks  = linkedTasks.filter(t => t.Status === "COMPLETED").length;
    const totalItems      = linkedTasks.length + linkedHabits.length + linkedReminders.length;
    const progressPct     = totalItems > 0 ? (completedTasks / totalItems) * 100 : 0;

    function toggleTask(taskId: string) {
        const ids = goal.LinkedTaskIDs.includes(taskId)
            ? goal.LinkedTaskIDs.filter(id => id !== taskId)
            : [...goal.LinkedTaskIDs, taskId];
        onLinkUpdate(goal.GoalID, ids, goal.LinkedHabitIDs, goal.LinkedReminderIDs);
    }

    function toggleHabit(habitId: string) {
        const ids = goal.LinkedHabitIDs.includes(habitId)
            ? goal.LinkedHabitIDs.filter(id => id !== habitId)
            : [...goal.LinkedHabitIDs, habitId];
        onLinkUpdate(goal.GoalID, goal.LinkedTaskIDs, ids, goal.LinkedReminderIDs);
    }

    function toggleReminder(remId: string) {
        const ids = goal.LinkedReminderIDs.includes(remId)
            ? goal.LinkedReminderIDs.filter(id => id !== remId)
            : [...goal.LinkedReminderIDs, remId];
        onLinkUpdate(goal.GoalID, goal.LinkedTaskIDs, goal.LinkedHabitIDs, ids);
    }

    return (
        <motion.div className="rounded-2xl"
            style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: isApple ? "blur(16px)" : "none" }}
            layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>

            {/* Color top stripe */}
            <div className="h-1 w-full" style={{ background: goal.Color ?? ACCENT }} />

            <div className="p-4">
                {/* Header row */}
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${goal.Color ?? ACCENT}18` }}>
                        {goal.Emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate" style={{ color: palette.textPrimary }}>{goal.Title}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: `${statusColor}18`, color: statusColor }}>
                                {STATUS_LABELS[goal.Status as keyof typeof STATUS_LABELS] ?? goal.Status}
                            </span>
                        </div>
                        {goal.Description && (
                            <p className="text-xs mt-0.5 line-clamp-1 leading-relaxed" style={{ color: palette.textSecondary }}>{goal.Description}</p>
                        )}
                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs" style={{ color: palette.textTertiary }}>
                            <span className="flex items-center gap-1">
                                <CheckCircle style={{ fontSize: 11, color: "#22c55e" }} /> {linkedTasks.length}
                                <Loop style={{ fontSize: 11, color: "#3b82f6" }} /> {linkedHabits.length}
                                <Notifications style={{ fontSize: 11, color: "#f59e0b" }} /> {linkedReminders.length}
                            </span>
                            {goal.TargetDate && (
                                <span className="flex items-center gap-1">
                                    <CalendarToday style={{ fontSize: 11 }} />
                                    {countdown(goal.TargetDate)}
                                </span>
                            )}
                            <span>{goal.Category}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setMenuOpen(v => !v)} style={{ color: palette.textTertiary }}>
                                <MoreVert style={{ fontSize: 18 }} />
                            </button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                                        style={{ background: isDark ? "rgba(28,28,30,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${border}`, backdropFilter: "blur(16px)" }}
                                        initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -6 }}>
                                        <button onClick={() => { onEdit(goal); setMenuOpen(false); }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5" style={{ color: palette.textPrimary }}>
                                            <Edit style={{ fontSize: 15 }} /> Edit
                                        </button>
                                        {/* Status submenu */}
                                        {(["NOT_STARTED","IN_PROGRESS","COMPLETED","ABANDONED"] as const).map(s => s !== goal.Status && (
                                            <button key={s} onClick={() => { onStatusChange(goal.GoalID, s); setMenuOpen(false); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5" style={{ color: STATUS_COLORS[s] }}>
                                                → {STATUS_LABELS[s]}
                                            </button>
                                        ))}
                                        <div className="h-px mx-2 my-1" style={{ background: border }} />
                                        <button onClick={() => { onDelete(goal.GoalID); setMenuOpen(false); }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-500/10" style={{ color: "#ef4444" }}>
                                            <Delete style={{ fontSize: 15 }} /> Delete
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button onClick={() => setExpanded(v => !v)}
                            className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textTertiary }}>
                            {expanded ? "Less" : "Link"}
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                {totalItems > 0 && (
                    <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1" style={{ color: palette.textTertiary }}>
                            <span>{completedTasks}/{totalItems} task{totalItems !== 1 ? "s" : ""} done</span>
                            <span>{Math.round(progressPct)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                            <motion.div className="h-full rounded-full"
                                style={{ background: goal.Color ?? ACCENT }}
                                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }} />
                        </div>
                    </div>
                )}

                {/* XP earned on completion */}
                {goal.Status === "COMPLETED" && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <EmojiEvents style={{ color: "#f59e0b", fontSize: 14 }} />
                        <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>100 XP earned!</span>
                    </div>
                )}
            </div>

            {/* Link panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${border}` }}>
                        <p className="text-xs font-semibold uppercase tracking-wider pt-3" style={{ color: palette.textTertiary }}>Link Items</p>

                        {/* Tasks */}
                        {allTasks.length > 0 && (
                            <div>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: palette.textSecondary }}>
                                    <CheckCircle style={{ fontSize: 13, color: "#22c55e" }} /> Tasks
                                </p>
                                <div className="space-y-1 max-h-28 overflow-y-auto">
                                    {allTasks.map(t => (
                                        <label key={t.TaskID} className="flex items-center gap-2 cursor-pointer py-1">
                                            <input type="checkbox" checked={goal.LinkedTaskIDs.includes(t.TaskID)} onChange={() => toggleTask(t.TaskID)}
                                                className="rounded" style={{ accentColor: "#22c55e" }} />
                                            <span className="text-xs truncate flex-1" style={{ color: palette.textPrimary }}>{t.Title}</span>
                                            {t.Status === "COMPLETED" && <span className="text-xs" style={{ color: "#22c55e" }}>✓</span>}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Habits */}
                        {allHabits.length > 0 && (
                            <div>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: palette.textSecondary }}>
                                    <Loop style={{ fontSize: 13, color: "#3b82f6" }} /> Habits
                                </p>
                                <div className="space-y-1 max-h-28 overflow-y-auto">
                                    {allHabits.map(h => (
                                        <label key={h.HabitID} className="flex items-center gap-2 cursor-pointer py-1">
                                            <input type="checkbox" checked={goal.LinkedHabitIDs.includes(h.HabitID)} onChange={() => toggleHabit(h.HabitID)}
                                                className="rounded" style={{ accentColor: "#3b82f6" }} />
                                            <span className="mr-0.5">{h.Emoji}</span>
                                            <span className="text-xs truncate flex-1" style={{ color: palette.textPrimary }}>{h.Title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reminders */}
                        {allReminders.length > 0 && (
                            <div>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: palette.textSecondary }}>
                                    <Notifications style={{ fontSize: 13, color: "#f59e0b" }} /> Reminders
                                </p>
                                <div className="space-y-1 max-h-28 overflow-y-auto">
                                    {allReminders.map(r => (
                                        <label key={r.ReminderID} className="flex items-center gap-2 cursor-pointer py-1">
                                            <input type="checkbox" checked={goal.LinkedReminderIDs.includes(r.ReminderID)} onChange={() => toggleReminder(r.ReminderID)}
                                                className="rounded" style={{ accentColor: "#f59e0b" }} />
                                            <span className="text-xs truncate flex-1" style={{ color: palette.textPrimary }}>{r.Title}</span>
                                            <span className="text-xs shrink-0" style={{ color: palette.textTertiary }}>{new Date(r.ScheduledAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {allTasks.length === 0 && allHabits.length === 0 && allReminders.length === 0 && (
                            <p className="text-xs py-2" style={{ color: palette.textTertiary }}>No tasks, habits, or reminders to link. Create some first.</p>
                        )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Goal Modal ─────────────────────────────────────────────────────────────────

function GoalModal({ initial, isDark, isApple, palette, border, onSave, onClose }: {
    initial?: Partial<Goal>; isDark: boolean; isApple: boolean; palette: any; border: string;
    onSave: (data: Partial<Goal>) => void; onClose: () => void;
}) {
    const [title,     setTitle]     = useState(initial?.Title ?? "");
    const [desc,      setDesc]      = useState(initial?.Description ?? "");
    const [emoji,     setEmoji]     = useState(initial?.Emoji ?? "🎯");
    const [color,     setColor]     = useState(initial?.Color ?? ACCENT);
    const [cat,       setCat]       = useState(initial?.Category ?? "OTHER");
    const [target,    setTarget]    = useState(initial?.TargetDate ? initial.TargetDate.split("T")[0] : "");
    const [tags,      setTags]      = useState(initial?.Tags?.join(", ") ?? "");
    const [aiMode,    setAiMode]    = useState(false);
    const [aiPrompt,  setAiPrompt]  = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const modalBg = isApple ? isDark ? "rgba(28,28,30,0.97)" : "rgba(255,255,255,0.97)" : palette.surface;

    async function handleAI() {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const r = await fetch("/api/productivity/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_goal", prompt: aiPrompt }) });
            const j = await r.json();
            if (j.success && j.data) { setTitle(j.data.Title ?? ""); setDesc(j.data.Description ?? ""); setAiMode(false); }
        } finally { setAiLoading(false); }
    }

    return (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{ background: modalBg, border: `1px solid ${border}`, backdropFilter: isApple ? "blur(24px)" : "none" }}
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-lg" style={{ color: palette.textPrimary }}>{initial?.GoalID ? "Edit Goal" : "New Goal"}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setAiMode(v => !v)} className="p-1.5 rounded-lg"
                            style={{ color: aiMode ? ACCENT : palette.textTertiary, background: aiMode ? `${ACCENT}18` : "transparent" }}>
                            <Psychology style={{ fontSize: 20 }} />
                        </button>
                        <button onClick={onClose}><Close style={{ color: palette.textTertiary }} /></button>
                    </div>
                </div>

                {aiMode && (
                    <div className="mb-4 flex gap-2">
                        <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAI()}
                            placeholder="Describe your goal…" className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                        <button onClick={handleAI} disabled={aiLoading} className="px-3 py-2 rounded-xl text-sm font-semibold"
                            style={{ background: ACCENT, color: "#fff", opacity: aiLoading ? 0.6 : 1 }}>
                            {aiLoading ? "…" : "Go"}
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Emoji + Color */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Emoji</p>
                            <div className="flex flex-wrap gap-1">
                                {EMOJI_PRESETS.map(e => (
                                    <button key={e} onClick={() => setEmoji(e)}
                                        className="w-8 h-8 rounded-lg text-lg flex items-center justify-center"
                                        style={{ background: emoji === e ? `${color}20` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: emoji === e ? `1.5px solid ${color}` : "1.5px solid transparent" }}>
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Color</p>
                            <div className="flex flex-wrap gap-1.5">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full"
                                        style={{ background: c, border: color === c ? "2.5px solid #fff" : "2px solid transparent", outline: color === c ? `2px solid ${c}` : "none" }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title *"
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />

                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={2}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />

                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Category</p>
                        <CustomSelect
                            value={cat}
                            onChange={setCat}
                            options={GOAL_CATEGORIES.map(c => ({ value: c, label: c }))}
                        />
                    </div>

                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Target Date (optional)</p>
                        <input type="date" value={target} onChange={e => setTarget(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                    </div>

                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Tags (comma separated)</p>
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. career, 2025, priority"
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>Cancel</button>
                    <button onClick={() => {
                        if (!title.trim()) return;
                        onSave({ Title: title.trim(), Description: desc.trim() || undefined, Emoji: emoji, Color: color, Category: cat, TargetDate: target || undefined, Tags: tags.split(",").map(t => t.trim()).filter(Boolean) });
                    }} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: ACCENT, color: "#fff" }}>
                        {initial?.GoalID ? "Save Changes" : "Add Goal"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GoalsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const cardBg = isApple ? isDark ? "rgba(44,44,46,0.72)" : "rgba(255,255,255,0.75)" : palette.surface;
    const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";

    const [goals,      setGoals]      = useState<Goal[]>([]);
    const [allTasks,   setAllTasks]   = useState<Task[]>([]);
    const [allHabits,  setAllHabits]  = useState<Habit[]>([]);
    const [allReminders,setAllReminders] = useState<Reminder[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [tab,        setTab]        = useState<"ALL"|"NOT_STARTED"|"IN_PROGRESS"|"COMPLETED"|"ABANDONED">("ALL");
    const [showModal,  setShowModal]  = useState(false);
    const [editGoal,   setEditGoal]   = useState<Goal | undefined>();

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [gR, tR, hR, rR] = await Promise.all([
                fetch("/api/productivity/goals"),
                fetch("/api/productivity/tasks?limit=100"),
                fetch("/api/productivity/habits"),
                fetch("/api/productivity/reminders?status=ACTIVE"),
            ]);
            const [g, t, h, r] = await Promise.all([gR.json(), tR.json(), hR.json(), rR.json()]);
            if (g.success) setGoals(g.data ?? []);
            if (t.success) setAllTasks(t.data?.tasks ?? []);
            if (h.success) setAllHabits(h.data ?? []);
            if (r.success) setAllReminders(r.data ?? []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    async function saveGoal(data: Partial<Goal>) {
        if (editGoal?.GoalID) {
            await fetch(`/api/productivity/goals/${editGoal.GoalID}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        } else {
            await fetch("/api/productivity/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        }
        setShowModal(false); setEditGoal(undefined); loadAll();
    }

    async function deleteGoal(id: string) {
        if (!confirm("Delete this goal?")) return;
        await fetch(`/api/productivity/goals/${id}`, { method: "DELETE" });
        loadAll();
    }

    async function changeStatus(id: string, status: string) {
        await fetch(`/api/productivity/goals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ Status: status }) });
        loadAll();
    }

    async function updateLinks(id: string, taskIDs: string[], habitIDs: string[], reminderIDs: string[]) {
        await fetch(`/api/productivity/goals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ LinkedTaskIDs: taskIDs, LinkedHabitIDs: habitIDs, LinkedReminderIDs: reminderIDs }) });
        // Optimistic update
        setGoals(prev => prev.map(g => g.GoalID === id ? { ...g, LinkedTaskIDs: taskIDs, LinkedHabitIDs: habitIDs, LinkedReminderIDs: reminderIDs } : g));
    }

    const filtered = tab === "ALL" ? goals : goals.filter(g => g.Status === tab);

    const tabCounts = {
        ALL: goals.length,
        IN_PROGRESS: goals.filter(g => g.Status === "IN_PROGRESS").length,
        COMPLETED: goals.filter(g => g.Status === "COMPLETED").length,
        NOT_STARTED: goals.filter(g => g.Status === "NOT_STARTED").length,
        ABANDONED: goals.filter(g => g.Status === "ABANDONED").length,
    };

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Goals</h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        {tabCounts.IN_PROGRESS} in progress · {tabCounts.COMPLETED} completed
                    </p>
                </div>
                <motion.button onClick={() => { setEditGoal(undefined); setShowModal(true); }}
                    className="px-4 py-2 rounded-2xl font-semibold text-sm flex items-center gap-1.5" style={{ background: ACCENT, color: "#fff" }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Add style={{ fontSize: 18 }} /> New Goal
                </motion.button>
            </div>

            {/* Status tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
                {(["ALL","IN_PROGRESS","NOT_STARTED","COMPLETED","ABANDONED"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{ background: tab === t ? (t === "ALL" ? ACCENT : STATUS_COLORS[t as keyof typeof STATUS_COLORS] ?? ACCENT) : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tab === t ? "#fff" : palette.textTertiary }}>
                        {t === "ALL" ? "All" : STATUS_LABELS[t as keyof typeof STATUS_LABELS]}
                        <span className="opacity-70">{tabCounts[t]}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-7 h-7 rounded-full border-2" style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${ACCENT}14` }}>
                        <TrackChanges style={{ color: ACCENT, fontSize: 28 }} />
                    </div>
                    <p className="font-semibold" style={{ color: palette.textPrimary }}>No goals yet</p>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>Set meaningful goals and link your tasks, habits and reminders.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(g => (
                            <GoalCard key={g.GoalID} goal={g} isDark={isDark} isApple={isApple} palette={palette} border={border} cardBg={cardBg}
                                allTasks={allTasks} allHabits={allHabits} allReminders={allReminders}
                                onEdit={g => { setEditGoal(g); setShowModal(true); }}
                                onDelete={deleteGoal} onStatusChange={changeStatus} onLinkUpdate={updateLinks} />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <GoalModal initial={editGoal} isDark={isDark} isApple={isApple} palette={palette} border={border}
                        onSave={saveGoal} onClose={() => { setShowModal(false); setEditGoal(undefined); }} />
                )}
            </AnimatePresence>

            {/* Mobile FAB */}
            <motion.button onClick={() => { setEditGoal(undefined); setShowModal(true); }}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center lg:hidden z-40"
                style={{ background: ACCENT, color: "#fff", boxShadow: `0 8px 24px ${ACCENT}60` }}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
                <Add style={{ fontSize: 28 }} />
            </motion.button>
        </div>
    );
}
