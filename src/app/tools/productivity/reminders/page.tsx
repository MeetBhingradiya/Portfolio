/**
 * Reminders — /tools/productivity/reminders
 * Scheduled reminders with browser notifications, snooze & dismiss.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    Add, Delete, Edit, Close, Notifications, NotificationsOff,
    Alarm, Snooze, CheckCircle, MoreVert, Refresh, Loop,
    CalendarToday, ErrorOutline, Psychology,
} from "@mui/icons-material";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Reminder {
    ReminderID: string; Title: string; Description?: string;
    ScheduledAt: string; Repeat: string; RepeatDaysOfWeek: number[];
    Status: string; Priority: string; SnoozedUntil?: string;
    LinkedTaskID?: string; NotificationChannels: string[];
    Tags: string[]; Archived: boolean; createdAt: string;
}

const ACCENT         = "#AF52DE";
const PRIORITY_COLORS = { LOW: "#6b7280", NORMAL: "#3b82f6", HIGH: "#f59e0b", CRITICAL: "#ef4444" } as const;
const PRIORITY_LABELS = { LOW: "Low", NORMAL: "Normal", HIGH: "High", CRITICAL: "Critical" } as const;
const REPEAT_LABELS   = { NONE: "Once", DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" } as const;
const DAY_NAMES       = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const SNOOZE_OPTIONS  = [5,10,15,30,60];

// ─── Date formatting ───────────────────────────────────────────────────────────

function fmtDateTime(d: string) {
    const dt = new Date(d);
    const now = new Date();
    const today = dt.toDateString() === now.toDateString();
    const tomorrow = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return dt.toDateString() === t.toDateString(); })();
    const time = dt.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
    if (today)    return `Today ${time}`;
    if (tomorrow) return `Tomorrow ${time}`;
    return dt.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }) + ` ${time}`;
}

function isOverdue(d: string, status: string) {
    return new Date(d) < new Date() && status === "ACTIVE";
}

function isToday(d: string) {
    return new Date(d).toDateString() === new Date().toDateString();
}

// ─── Reminder Row ──────────────────────────────────────────────────────────────

function ReminderItem({
    reminder, isDark, isApple, palette, border, cardBg,
    onSnooze, onDismiss, onDelete, onEdit,
}: {
    reminder: Reminder; isDark: boolean; isApple: boolean; palette: any; border: string; cardBg: string;
    onSnooze: (id: string, min: number) => void;
    onDismiss: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (r: Reminder) => void;
}) {
    const [menuOpen,    setMenuOpen]    = useState(false);
    const [snoozeOpen,  setSnoozeOpen]  = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const overdue   = isOverdue(reminder.ScheduledAt, reminder.Status);
    const today     = isToday(reminder.ScheduledAt);
    const pColor    = PRIORITY_COLORS[reminder.Priority as keyof typeof PRIORITY_COLORS] ?? "#6b7280";
    const dismissed = reminder.Status === "DISMISSED";
    const snoozed   = reminder.Status === "SNOOZED";

    useEffect(() => {
        function h(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenuOpen(false); setSnoozeOpen(false); } }
        if (menuOpen || snoozeOpen) document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [menuOpen, snoozeOpen]);

    return (
        <motion.div
            className="rounded-xl p-4 relative"
            style={{
                background: cardBg,
                border: `1px solid ${overdue ? "#ef444430" : snoozed ? "#f59e0b30" : border}`,
                backdropFilter: isApple ? "blur(16px)" : "none",
                opacity: dismissed ? 0.55 : 1,
            }}
            layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: dismissed ? 0.55 : 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>

            {/* Priority stripe */}
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: pColor, borderRadius: 4 }} />

            <div className="flex items-start gap-3 pl-2">
                {/* Status icon */}
                <div className="shrink-0 mt-0.5">
                    {dismissed ? <CheckCircle style={{ color: "#22c55e", fontSize: 20 }} /> :
                     snoozed   ? <Snooze     style={{ color: "#f59e0b", fontSize: 20 }} /> :
                     overdue   ? <ErrorOutline style={{ color: "#ef4444", fontSize: 20 }} /> :
                     today     ? <Alarm       style={{ color: "#3b82f6", fontSize: 20 }} /> :
                                 <Notifications style={{ color: pColor, fontSize: 20 }} />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight" style={{ color: palette.textPrimary, textDecoration: dismissed ? "line-through" : "none" }}>
                        {reminder.Title}
                    </p>
                    {reminder.Description && (
                        <p className="text-xs line-clamp-1 mt-0.5 leading-relaxed" style={{ color: palette.textSecondary }}>{reminder.Description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-medium" style={{ color: overdue ? "#ef4444" : today ? "#3b82f6" : palette.textTertiary }}>
                            {fmtDateTime(reminder.ScheduledAt)}
                        </span>
                        {reminder.Repeat !== "NONE" && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textTertiary }}>
                                <Loop style={{ fontSize: 10 }} />{REPEAT_LABELS[reminder.Repeat as keyof typeof REPEAT_LABELS] ?? reminder.Repeat}
                            </span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${pColor}18`, color: pColor }}>
                            {PRIORITY_LABELS[reminder.Priority as keyof typeof PRIORITY_LABELS] ?? reminder.Priority}
                        </span>
                        {snoozed && reminder.SnoozedUntil && (
                            <span className="text-xs" style={{ color: "#f59e0b" }}>until {fmtDateTime(reminder.SnoozedUntil)}</span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {!dismissed && reminder.Status === "ACTIVE" && (
                        <>
                            {/* Snooze */}
                            <div className="relative">
                                <motion.button onClick={() => setSnoozeOpen(v => !v)}
                                    className="p-1.5 rounded-lg" style={{ color: "#f59e0b", background: "#f59e0b14" }}
                                    title="Snooze" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
                                    <Snooze style={{ fontSize: 17 }} />
                                </motion.button>
                                <AnimatePresence>
                                    {snoozeOpen && (
                                        <motion.div className="absolute right-0 top-full mt-1 rounded-xl shadow-xl z-50 overflow-hidden py-1 w-28"
                                            style={{ background: isDark ? "rgba(28,28,30,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${border}`, backdropFilter: "blur(16px)" }}
                                            initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -6 }}>
                                            {SNOOZE_OPTIONS.map(m => (
                                                <button key={m} onClick={() => { onSnooze(reminder.ReminderID, m); setSnoozeOpen(false); }}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-white/5" style={{ color: palette.textPrimary }}>
                                                    {m < 60 ? `${m} min` : "1 hour"}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {/* Dismiss */}
                            <motion.button onClick={() => onDismiss(reminder.ReminderID)}
                                className="p-1.5 rounded-lg" style={{ color: "#22c55e", background: "#22c55e14" }}
                                title="Dismiss" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
                                <CheckCircle style={{ fontSize: 17 }} />
                            </motion.button>
                        </>
                    )}

                    {/* 3-dot menu */}
                    <div className="relative ml-0.5" ref={menuRef}>
                        <button onClick={() => setMenuOpen(v => !v)} style={{ color: palette.textTertiary }}>
                            <MoreVert style={{ fontSize: 18 }} />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                                    style={{ background: isDark ? "rgba(28,28,30,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${border}`, backdropFilter: "blur(16px)" }}
                                    initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -6 }}>
                                    <button onClick={() => { onEdit(reminder); setMenuOpen(false); }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5" style={{ color: palette.textPrimary }}>
                                        <Edit style={{ fontSize: 15 }} /> Edit
                                    </button>
                                    <div className="h-px mx-2 my-1" style={{ background: border }} />
                                    <button onClick={() => { onDelete(reminder.ReminderID); setMenuOpen(false); }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-500/10" style={{ color: "#ef4444" }}>
                                        <Delete style={{ fontSize: 15 }} /> Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Add/Edit Modal ─────────────────────────────────────────────────────────────

function ReminderModal({ initial, isDark, isApple, palette, border, onSave, onClose }: {
    initial?: Partial<Reminder>; isDark: boolean; isApple: boolean; palette: any; border: string;
    onSave: (data: Partial<Reminder>) => void; onClose: () => void;
}) {
    const [title,    setTitle]    = useState(initial?.Title ?? "");
    const [desc,     setDesc]     = useState(initial?.Description ?? "");
    const [dtLocal,  setDtLocal]  = useState(() => {
        if (initial?.ScheduledAt) {
            const d = new Date(initial.ScheduledAt);
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
        const n = new Date(); n.setMinutes(n.getMinutes() + 30);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
    });
    const [repeat,   setRepeat]   = useState(initial?.Repeat ?? "NONE");
    const [days,     setDays]     = useState<number[]>(initial?.RepeatDaysOfWeek ?? []);
    const [priority, setPriority] = useState(initial?.Priority ?? "NORMAL");
    const [tags,     setTags]     = useState(initial?.Tags?.join(", ") ?? "");
    const [aiMode,   setAiMode]   = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading,setAiLoading]= useState(false);

    const modalBg = isApple ? isDark ? "rgba(28,28,30,0.97)" : "rgba(255,255,255,0.97)" : palette.surface;

    async function handleAI() {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const r = await fetch("/api/productivity/ai", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ action: "create_reminder", prompt: aiPrompt }) });
            const j = await r.json();
            if (j.success && j.data) { setTitle(j.data.Title ?? ""); setDesc(j.data.Description ?? ""); setAiMode(false); }
        } finally { setAiLoading(false); }
    }

    return (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{ background: modalBg, border: `1px solid ${border}`, backdropFilter: isApple ? "blur(24px)" : "none" }}
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-lg" style={{ color: palette.textPrimary }}>{initial?.ReminderID ? "Edit Reminder" : "New Reminder"}</h2>
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
                            placeholder="e.g. remind me to exercise tomorrow at 7am" className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                        <button onClick={handleAI} disabled={aiLoading} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: ACCENT, color: "#fff", opacity: aiLoading ? 0.6 : 1 }}>
                            {aiLoading ? "…" : "Go"}
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title *"
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />

                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={2}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />

                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Date & Time *</p>
                        <input type="datetime-local" value={dtLocal} onChange={e => setDtLocal(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                    </div>

                    {/* Priority */}
                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Priority</p>
                        <div className="flex gap-2">
                            {(["LOW","NORMAL","HIGH","CRITICAL"] as const).map(p => (
                                <button key={p} onClick={() => setPriority(p)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                                    style={{ background: priority === p ? `${PRIORITY_COLORS[p]}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: priority === p ? PRIORITY_COLORS[p] : palette.textTertiary, border: `1px solid ${priority === p ? PRIORITY_COLORS[p] : border}` }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Repeat */}
                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Repeat</p>
                        <div className="flex gap-2 flex-wrap">
                            {["NONE","DAILY","WEEKLY","MONTHLY","YEARLY"].map(r => (
                                <button key={r} onClick={() => setRepeat(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                    style={{ background: repeat === r ? `${ACCENT}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: repeat === r ? ACCENT : palette.textTertiary, border: `1px solid ${repeat === r ? ACCENT : border}` }}>
                                    {REPEAT_LABELS[r as keyof typeof REPEAT_LABELS] ?? r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {repeat === "WEEKLY" && (
                        <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Days of week</p>
                            <div className="flex gap-1">
                                {DAY_NAMES.map((n, i) => (
                                    <button key={i} onClick={() => setDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                                        style={{ background: days.includes(i) ? `${ACCENT}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: days.includes(i) ? ACCENT : palette.textTertiary, border: `1px solid ${days.includes(i) ? ACCENT : border}` }}>
                                        {n[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: palette.textSecondary }}>Tags (comma separated)</p>
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. work, personal"
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, borderColor: border }} />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>Cancel</button>
                    <button onClick={() => {
                        if (!title.trim() || !dtLocal) return;
                        onSave({ Title: title.trim(), Description: desc.trim() || undefined, ScheduledAt: new Date(dtLocal).toISOString(), Repeat: repeat, RepeatDaysOfWeek: days, Priority: priority, Tags: tags.split(",").map(t => t.trim()).filter(Boolean) });
                    }} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: ACCENT, color: "#fff" }}>
                        {initial?.ReminderID ? "Save Changes" : "Add Reminder"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RemindersPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const cardBg = isApple ? isDark ? "rgba(44,44,46,0.72)" : "rgba(255,255,255,0.75)" : palette.surface;
    const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";

    const [reminders,   setReminders]   = useState<Reminder[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [tab,         setTab]         = useState<"ACTIVE"|"SNOOZED"|"DISMISSED"|"ALL">("ACTIVE");
    const [showModal,   setShowModal]   = useState(false);
    const [editReminder,setEditReminder]= useState<Reminder | undefined>();
    const [notifPerm,   setNotifPerm]   = useState<NotificationPermission | null>(null);

    useEffect(() => {
        if ("Notification" in window) setNotifPerm(Notification.permission);
    }, []);

    const fetchReminders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (tab !== "ALL") params.set("status", tab);
            const r = await fetch(`/api/productivity/reminders?${params}`);
            const j = await r.json();
            if (j.success) {
                const sorted = [...(j.data ?? [])].sort((a: Reminder, b: Reminder) =>
                    new Date(a.ScheduledAt).getTime() - new Date(b.ScheduledAt).getTime());
                setReminders(sorted);
            }
        } finally { setLoading(false); }
    }, [tab]);

    useEffect(() => { fetchReminders(); }, [fetchReminders]);

    // Poll every 60s for browser notifications
    useEffect(() => {
        if (typeof window === "undefined") return;
        const interval = setInterval(async () => {
            if (Notification.permission !== "granted") return;
            const r = await fetch("/api/productivity/reminders?status=ACTIVE");
            const j = await r.json();
            if (!j.success) return;
            const now = new Date();
            for (const rem of (j.data ?? []) as Reminder[]) {
                const at = new Date(rem.ScheduledAt);
                if (at <= now && at > new Date(now.getTime() - 60_000)) {
                    new Notification(rem.Title, { body: rem.Description ?? fmtDateTime(rem.ScheduledAt), icon: "/favicon.ico" });
                }
            }
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    async function requestPermission() {
        if ("Notification" in window) {
            const p = await Notification.requestPermission();
            setNotifPerm(p);
        }
    }

    async function saveReminder(data: Partial<Reminder>) {
        if (editReminder?.ReminderID) {
            await fetch(`/api/productivity/reminders/${editReminder.ReminderID}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        } else {
            await fetch("/api/productivity/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        }
        setShowModal(false); setEditReminder(undefined); fetchReminders();
    }

    async function snoozeReminder(id: string, minutes: number) {
        await fetch(`/api/productivity/reminders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "snooze", snoozeMinutes: minutes }) });
        fetchReminders();
    }

    async function dismissReminder(id: string) {
        await fetch(`/api/productivity/reminders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "dismiss" }) });
        fetchReminders();
    }

    async function deleteReminder(id: string) {
        if (!confirm("Delete this reminder?")) return;
        await fetch(`/api/productivity/reminders/${id}`, { method: "DELETE" });
        fetchReminders();
    }

    // Group by date
    const today     = reminders.filter(r => isToday(r.ScheduledAt) && r.Status !== "DISMISSED");
    const upcoming  = reminders.filter(r => !isToday(r.ScheduledAt) && new Date(r.ScheduledAt) > new Date() && r.Status !== "DISMISSED");
    const overdue   = reminders.filter(r => isOverdue(r.ScheduledAt, r.Status));
    const dismissed = reminders.filter(r => r.Status === "DISMISSED");

    const allByDate = tab === "ALL" ? reminders : reminders;

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Reminders</h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        {today.length} today · {upcoming.length} upcoming
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button onClick={fetchReminders} className="p-2 rounded-xl"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.9, rotate: 180 }} transition={{ duration: 0.3 }}>
                        <Refresh style={{ color: palette.textSecondary, fontSize: 20 }} />
                    </motion.button>
                    <motion.button onClick={() => { setEditReminder(undefined); setShowModal(true); }}
                        className="px-4 py-2 rounded-2xl font-semibold text-sm flex items-center gap-1.5" style={{ background: ACCENT, color: "#fff" }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Add style={{ fontSize: 18 }} /> New
                    </motion.button>
                </div>
            </div>

            {/* Notification permission banner */}
            {notifPerm !== null && notifPerm !== "granted" && (
                <motion.div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: isDark ? "rgba(251,191,36,0.12)" : "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.30)" }}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="shrink-0 p-2 rounded-xl" style={{ background: "rgba(251,191,36,0.15)" }}>
                        {notifPerm === "denied" ? <NotificationsOff style={{ color: "#f59e0b" }} /> : <Notifications style={{ color: "#f59e0b" }} />}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: palette.textPrimary }}>
                            {notifPerm === "denied" ? "Notifications Blocked" : "Enable Notifications"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                            {notifPerm === "denied"
                                ? "Allow notifications in your browser settings to receive reminders."
                                : "Allow browser notifications to get reminded at the scheduled time."}
                        </p>
                    </div>
                    {notifPerm !== "denied" && (
                        <motion.button onClick={requestPermission}
                            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
                            style={{ background: "#f59e0b", color: "#fff" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            Allow
                        </motion.button>
                    )}
                </motion.div>
            )}

            {/* Status tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                {(["ACTIVE","SNOOZED","DISMISSED","ALL"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all"
                        style={{ background: tab === t ? ACCENT : "transparent", color: tab === t ? "#fff" : palette.textTertiary }}>
                        {t === "ALL" ? "All" : t === "ACTIVE" ? "Active" : t === "SNOOZED" ? "Snoozed" : "Dismissed"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-7 h-7 rounded-full border-2" style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }} />
                </div>
            ) : reminders.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${ACCENT}14` }}>
                        <Alarm style={{ color: ACCENT, fontSize: 28 }} />
                    </div>
                    <p className="font-semibold" style={{ color: palette.textPrimary }}>No reminders</p>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>Schedule reminders that notify you at the right time.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Overdue */}
                    {tab === "ACTIVE" && overdue.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#ef4444" }}>
                                <ErrorOutline style={{ fontSize: 13 }} /> Overdue ({overdue.length})
                            </p>
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {overdue.map(r => <ReminderItem key={r.ReminderID} reminder={r} isDark={isDark} isApple={isApple} palette={palette} border={border} cardBg={cardBg} onSnooze={snoozeReminder} onDismiss={dismissReminder} onDelete={deleteReminder} onEdit={r => { setEditReminder(r); setShowModal(true); }} />)}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Today */}
                    {tab === "ACTIVE" && today.filter(r => !isOverdue(r.ScheduledAt, r.Status)).length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#3b82f6" }}>
                                <CalendarToday style={{ fontSize: 13 }} /> Today
                            </p>
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {today.filter(r => !isOverdue(r.ScheduledAt, r.Status)).map(r => <ReminderItem key={r.ReminderID} reminder={r} isDark={isDark} isApple={isApple} palette={palette} border={border} cardBg={cardBg} onSnooze={snoozeReminder} onDismiss={dismissReminder} onDelete={deleteReminder} onEdit={r => { setEditReminder(r); setShowModal(true); }} />)}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Upcoming */}
                    {tab === "ACTIVE" && upcoming.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: palette.textTertiary }}>Upcoming</p>
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {upcoming.map(r => <ReminderItem key={r.ReminderID} reminder={r} isDark={isDark} isApple={isApple} palette={palette} border={border} cardBg={cardBg} onSnooze={snoozeReminder} onDismiss={dismissReminder} onDelete={deleteReminder} onEdit={r => { setEditReminder(r); setShowModal(true); }} />)}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* All / Snoozed / Dismissed tabs */}
                    {(tab === "SNOOZED" || tab === "DISMISSED" || tab === "ALL") && (
                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {reminders.map(r => <ReminderItem key={r.ReminderID} reminder={r} isDark={isDark} isApple={isApple} palette={palette} border={border} cardBg={cardBg} onSnooze={snoozeReminder} onDismiss={dismissReminder} onDelete={deleteReminder} onEdit={r => { setEditReminder(r); setShowModal(true); }} />)}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Empty active but other tabs have data */}
                    {tab === "ACTIVE" && overdue.length === 0 && today.length === 0 && upcoming.length === 0 && (
                        <p className="text-center py-8 text-sm" style={{ color: palette.textTertiary }}>No active reminders right now</p>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <ReminderModal initial={editReminder} isDark={isDark} isApple={isApple} palette={palette} border={border}
                        onSave={saveReminder} onClose={() => { setShowModal(false); setEditReminder(undefined); }} />
                )}
            </AnimatePresence>

            {/* Mobile FAB */}
            <motion.button onClick={() => { setEditReminder(undefined); setShowModal(true); }}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center lg:hidden z-40"
                style={{ background: ACCENT, color: "#fff", boxShadow: `0 8px 24px ${ACCENT}60` }}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
                <Add style={{ fontSize: 28 }} />
            </motion.button>
        </div>
    );
}
