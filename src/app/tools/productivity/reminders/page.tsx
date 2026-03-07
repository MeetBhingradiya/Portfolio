/**
 * Reminders — /tools/productivity/reminders
 * Scheduled reminders with browser notifications and repeat options.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Notifications,
    Add,
    Delete,
    AlarmOn,
    Snooze,
    CheckCircle,
    NotificationsOff,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reminder {
    ReminderID: string;
    Title: string;
    Description?: string;
    Emoji: string;
    Color: string;
    ScheduledAt: string;
    Repeat: string;
    Status: "ACTIVE" | "SNOOZED" | "DISMISSED" | "COMPLETED";
    Priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
    NextFireAt?: string;
    FireCount: number;
}

const REPEAT_OPTIONS = [
    { value: "NONE", label: "Once" },
    { value: "DAILY", label: "Daily" },
    { value: "WEEKDAYS", label: "Weekdays" },
    { value: "WEEKENDS", label: "Weekends" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
];

const PRIORITY_COLORS = {
    LOW: "#34C759",
    NORMAL: "#5E97F6",
    HIGH: "#FF9500",
    CRITICAL: "#FF3B30",
};

// ─── Browser notification helper ─────────────────────────────────────────────

async function requestNotificationPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const perm = await Notification.requestPermission();
    return perm === "granted";
}

function fireNotification(title: string, body?: string, icon?: string) {
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, icon: icon ?? "/favicon.ico" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RemindersPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

    // Form
    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formEmoji, setFormEmoji] = useState("🔔");
    const [formScheduledAt, setFormScheduledAt] = useState("");
    const [formRepeat, setFormRepeat] = useState("NONE");
    const [formPriority, setFormPriority] = useState<Reminder["Priority"]>("NORMAL");
    const [formSaving, setFormSaving] = useState(false);

    // Polling interval ref
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if ("Notification" in window) {
            setNotifPermission(Notification.permission);
        } else {
            setNotifPermission("unsupported");
        }
    }, []);

    const fetchReminders = useCallback(async () => {
        try {
            const res = await fetch("/api/productivity/reminders");
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            setIsAuthenticated(true);
            if (res.ok) {
                const json = await res.json();
                setReminders(json.data ?? []);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReminders();
        // Poll every minute to fire due reminders
        pollRef.current = setInterval(() => {
            checkDueReminders();
        }, 60_000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchReminders]);

    const checkDueReminders = useCallback(() => {
        const now = new Date();
        setReminders((prev) => {
            prev.forEach((r) => {
                if (
                    r.Status === "ACTIVE" &&
                    r.NextFireAt &&
                    new Date(r.NextFireAt) <= now
                ) {
                    fireNotification(r.Title, r.Description, undefined);
                    // Mark as fired
                    fetch(`/api/productivity/reminders/${r.ReminderID}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "fired" }),
                    });
                }
            });
            return prev;
        });
    }, []);

    const createReminder = async () => {
        if (!formTitle.trim() || !formScheduledAt || !isAuthenticated) return;
        setFormSaving(true);
        try {
            const res = await fetch("/api/productivity/reminders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Title: formTitle.trim(),
                    Emoji: formEmoji,
                    ScheduledAt: new Date(formScheduledAt).toISOString(),
                    Repeat: formRepeat,
                    Priority: formPriority,
                }),
            });
            if (res.ok) {
                setFormTitle("");
                setFormEmoji("🔔");
                setFormScheduledAt("");
                setFormRepeat("NONE");
                setShowForm(false);
                fetchReminders();

                // Request notification permission on first reminder
                if (notifPermission !== "granted") {
                    const granted = await requestNotificationPermission();
                    setNotifPermission(granted ? "granted" : "denied");
                }
            }
        } finally {
            setFormSaving(false);
        }
    };

    const snoozeReminder = async (id: string) => {
        try {
            await fetch(`/api/productivity/reminders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "snooze", snoozeMinutes: 10 }),
            });
            setReminders((prev) =>
                prev.map((r) => (r.ReminderID === id ? { ...r, Status: "SNOOZED" } : r))
            );
        } catch { /* ignore */ }
    };

    const dismissReminder = async (id: string) => {
        try {
            await fetch(`/api/productivity/reminders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "dismiss" }),
            });
            setReminders((prev) =>
                prev.map((r) => (r.ReminderID === id ? { ...r, Status: "DISMISSED" } : r))
            );
        } catch { /* ignore */ }
    };

    const deleteReminder = async (id: string) => {
        setReminders((prev) => prev.filter((r) => r.ReminderID !== id));
        try {
            await fetch(`/api/productivity/reminders/${id}`, { method: "DELETE" });
        } catch { /* ignore */ }
    };

    const activeReminders = reminders.filter((r) => r.Status === "ACTIVE" || r.Status === "SNOOZED");
    const pastReminders = reminders.filter((r) => r.Status === "DISMISSED" || r.Status === "COMPLETED");

    return (
        <ToolPageWrapper
            title="Reminders"
            description="Schedule alerts with browser notifications and repeats"
            icon={<Notifications sx={{ fontSize: 24 }} />}
            accentColor="#FF9500"
        >
            <div className="max-w-2xl mx-auto space-y-5">
                {/* Notification permission banner */}
                {notifPermission === "default" && (
                    <Card>
                        <div className="flex items-center gap-3">
                            <Notifications sx={{ fontSize: 24, color: "#FF9500" }} />
                            <div className="flex-1">
                                <p className="text-sm font-bold" style={{ color: palette.textPrimary }}>
                                    Enable browser notifications
                                </p>
                                <p className="text-xs" style={{ color: palette.textSecondary }}>
                                    Allow notifications to get alerts when reminders fire
                                </p>
                            </div>
                            <motion.button
                                onClick={async () => {
                                    const granted = await requestNotificationPermission();
                                    setNotifPermission(granted ? "granted" : "denied");
                                }}
                                className="px-4 py-2 rounded-full text-xs font-bold flex-shrink-0"
                                style={{ background: "#FF9500", color: "#fff" }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Allow
                            </motion.button>
                        </div>
                    </Card>
                )}

                {notifPermission === "denied" && (
                    <div
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
                        style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}
                    >
                        <NotificationsOff sx={{ fontSize: 16 }} />
                        Browser notifications are blocked. Enable them in your browser settings.
                    </div>
                )}

                {/* Toolbar */}
                {isAuthenticated !== false && (
                    <motion.button
                        onClick={() => setShowForm((v) => !v)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold"
                        style={{ background: "#FF9500", color: "#fff" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Add sx={{ fontSize: 18 }} />
                        New Reminder
                    </motion.button>
                )}

                {/* Form */}
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
                                            placeholder="Reminder title…"
                                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                            }}
                                        />
                                    </div>

                                    <input
                                        type="datetime-local"
                                        value={formScheduledAt}
                                        onChange={(e) => setFormScheduledAt(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                            color: palette.textSecondary,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                                        }}
                                    />

                                    <div className="flex flex-wrap gap-2">
                                        {REPEAT_OPTIONS.map((r) => (
                                            <motion.button
                                                key={r.value}
                                                onClick={() => setFormRepeat(r.value)}
                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background: formRepeat === r.value ? "#FF9500" : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                                    color: formRepeat === r.value ? "#fff" : palette.textSecondary,
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {r.label}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {(["LOW", "NORMAL", "HIGH", "CRITICAL"] as Reminder["Priority"][]).map((p) => (
                                            <motion.button
                                                key={p}
                                                onClick={() => setFormPriority(p)}
                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background: formPriority === p ? PRIORITY_COLORS[p] : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                                    color: formPriority === p ? "#fff" : palette.textSecondary,
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {p}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <motion.button
                                        onClick={createReminder}
                                        disabled={formSaving || !formTitle.trim() || !formScheduledAt}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold"
                                        style={{ background: "#FF9500", color: "#fff" }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {formSaving ? "Saving…" : "Set Reminder"}
                                    </motion.button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active reminders */}
                {activeReminders.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: palette.textTertiary }}>
                            Upcoming ({activeReminders.length})
                        </h3>
                        <AnimatePresence mode="popLayout">
                            {activeReminders.map((r) => (
                                <motion.div
                                    key={r.ReminderID}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -60 }}
                                >
                                    <Card>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl flex-shrink-0">{r.Emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: palette.textPrimary }}>
                                                    {r.Title}
                                                </p>
                                                <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                                                    {r.NextFireAt
                                                        ? new Date(r.NextFireAt).toLocaleString()
                                                        : new Date(r.ScheduledAt).toLocaleString()}
                                                    {r.Repeat !== "NONE" && ` · ${r.Repeat}`}
                                                </p>
                                            </div>
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ background: PRIORITY_COLORS[r.Priority] }}
                                            />
                                            {r.Status === "SNOOZED" && (
                                                <span className="text-xs font-bold flex-shrink-0" style={{ color: "#FF9500" }}>
                                                    Snoozed
                                                </span>
                                            )}
                                            <div className="flex gap-1 flex-shrink-0">
                                                <motion.button
                                                    onClick={() => snoozeReminder(r.ReminderID)}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Snooze 10 min"
                                                    style={{ color: palette.textTertiary }}
                                                >
                                                    <Snooze sx={{ fontSize: 16 }} />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => dismissReminder(r.ReminderID)}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Dismiss"
                                                    style={{ color: "#34C759" }}
                                                >
                                                    <CheckCircle sx={{ fontSize: 16 }} />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => deleteReminder(r.ReminderID)}
                                                    whileTap={{ scale: 0.9 }}
                                                    style={{ color: "#FF3B30" }}
                                                >
                                                    <Delete sx={{ fontSize: 16 }} />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Past reminders */}
                {pastReminders.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: palette.textTertiary }}>
                            Past ({pastReminders.length})
                        </h3>
                        {pastReminders.slice(0, 5).map((r) => (
                            <Card key={r.ReminderID}>
                                <div className="flex items-center gap-3 opacity-50">
                                    <span className="text-lg flex-shrink-0">{r.Emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate line-through" style={{ color: palette.textPrimary }}>{r.Title}</p>
                                        <p className="text-xs" style={{ color: palette.textTertiary }}>{r.Status}</p>
                                    </div>
                                    <motion.button onClick={() => deleteReminder(r.ReminderID)} whileTap={{ scale: 0.9 }} style={{ color: "#FF3B30" }}>
                                        <Delete sx={{ fontSize: 16 }} />
                                    </motion.button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && reminders.length === 0 && isAuthenticated === true && (
                    <div className="text-center py-16" style={{ color: palette.textTertiary }}>
                        <AlarmOn sx={{ fontSize: 48, opacity: 0.3 }} />
                        <p className="mt-3 text-sm">No reminders yet — create your first one above</p>
                    </div>
                )}

                {isAuthenticated === false && (
                    <Card>
                        <div className="text-center py-8 space-y-2">
                            <p className="text-sm font-bold" style={{ color: palette.textPrimary }}>Sign in to set reminders</p>
                            <a href="/auth/login" className="inline-block px-5 py-2 rounded-full text-sm font-bold" style={{ background: "#FF9500", color: "#fff" }}>Sign In</a>
                        </div>
                    </Card>
                )}
            </div>
        </ToolPageWrapper>
    );
}
