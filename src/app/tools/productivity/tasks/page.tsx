/**
 * Tasks — /tools/productivity/tasks
 * Gamified todo list with priorities, due dates, subtasks, and AI creation.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    CheckCircleOutline,
    RadioButtonUnchecked,
    Delete,
    Add,
    Edit,
    Save,
    ChecklistRtl,
    Psychology,
    Star,
    FilterList,
    ExpandMore,
    ExpandLess,
    CalendarToday,
    EmojiEvents,
    CameraAlt,
    Close,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTask {
    id: string;
    text: string;
    completed: boolean;
}

interface Task {
    TaskID: string;
    Title: string;
    Description?: string;
    Priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    Status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE";
    Category: string;
    Tags: string[];
    DueDate?: string;
    SubTasks: SubTask[];
    XPReward: number;
    XPEarned: number;
    CompletedAt?: string;
    CompletedEarly?: boolean;
    createdAt: string;
}

type FilterState = "all" | "active" | "completed" | "overdue";

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "#34C759",
    MEDIUM: "#5E97F6",
    HIGH: "#FF9500",
    URGENT: "#FF3B30",
};

const PRIORITY_XP: Record<string, number> = {
    LOW: 5,
    MEDIUM: 10,
    HIGH: 20,
    URGENT: 35,
};

// ─── AI helper ────────────────────────────────────────────────────────────────

async function createTaskWithAI(prompt: string): Promise<Partial<Task> | null> {
    try {
        const res = await fetch("/api/productivity/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create_task", prompt }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

// ─── OCR helper ───────────────────────────────────────────────────────────────

async function extractTextFromImage(file: File): Promise<string> {
    // Tesseract.js is loaded dynamically to keep the bundle small
    const Tesseract = await import("tesseract.js");
    const result = await Tesseract.recognize(file, "eng");
    return result.data.text.trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TasksPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterState>("all");
    const [input, setInput] = useState("");
    const [priority, setPriority] = useState<Task["Priority"]>("MEDIUM");
    const [dueDate, setDueDate] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [aiMode, setAiMode] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [xpToast, setXpToast] = useState<{ xp: number; achievements: { id: string; emoji?: string; title?: string }[] } | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch("/api/productivity/tasks?limit=100");
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            setIsAuthenticated(true);
            if (res.ok) {
                const json = await res.json();
                setTasks(json.data?.tasks ?? []);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const showXpToast = (xp: number, achievements: { id: string; emoji?: string; title?: string }[]) => {
        setXpToast({ xp, achievements });
        setTimeout(() => setXpToast(null), 3500);
    };

    // ── Create task ──────────────────────────────────────────────────────────

    const addTask = useCallback(async () => {
        const text = input.trim();
        if (!text || !isAuthenticated) return;

        const xpReward = PRIORITY_XP[priority] ?? 10;
        const optimisticTask: Task = {
            TaskID: `temp-${Date.now()}`,
            Title: text,
            Priority: priority,
            Status: "PENDING",
            Category: "PERSONAL",
            Tags: [],
            DueDate: dueDate || undefined,
            SubTasks: [],
            XPReward: xpReward,
            XPEarned: 0,
            createdAt: new Date().toISOString(),
        };

        setTasks((prev) => [optimisticTask, ...prev]);
        setInput("");
        setDueDate("");

        try {
            const res = await fetch("/api/productivity/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Title: text,
                    Priority: priority,
                    DueDate: dueDate || undefined,
                }),
            });
            if (res.ok) {
                const json = await res.json();
                setTasks((prev) =>
                    prev.map((t) => (t.TaskID === optimisticTask.TaskID ? json.data : t))
                );
            }
        } catch { /* ignore */ }
    }, [input, priority, dueDate, isAuthenticated]);

    // ── AI create ────────────────────────────────────────────────────────────

    const handleAICreate = async () => {
        if (!aiPrompt.trim() || !isAuthenticated) return;
        setAiLoading(true);
        try {
            const aiTask = await createTaskWithAI(aiPrompt);
            if (aiTask?.Title) {
                const res = await fetch("/api/productivity/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...aiTask, AIGenerated: true, AIPrompt: aiPrompt }),
                });
                if (res.ok) {
                    const json = await res.json();
                    setTasks((prev) => [json.data, ...prev]);
                    setAiPrompt("");
                    setAiMode(false);
                }
            }
        } finally {
            setAiLoading(false);
        }
    };

    // ── OCR create ───────────────────────────────────────────────────────────

    const handleOCR = async (file: File) => {
        setOcrLoading(true);
        try {
            const text = await extractTextFromImage(file);
            if (text) setInput(text.split("\n")[0].slice(0, 200));
        } finally {
            setOcrLoading(false);
        }
    };

    // ── Complete task ─────────────────────────────────────────────────────────

    const toggleTask = async (task: Task) => {
        if (!isAuthenticated) return;

        const newStatus =
            task.Status === "COMPLETED" ? "PENDING" : "COMPLETED";

        setTasks((prev) =>
            prev.map((t) =>
                t.TaskID === task.TaskID ? { ...t, Status: newStatus } : t
            )
        );

        try {
            const res = await fetch(`/api/productivity/tasks/${task.TaskID}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Status: newStatus }),
            });
            if (res.ok) {
                const json = await res.json();
                setTasks((prev) =>
                    prev.map((t) => (t.TaskID === task.TaskID ? json.data : t))
                );
                if (newStatus === "COMPLETED" && json.xp) {
                    showXpToast(json.xp.xpAwarded, json.xp.newAchievements ?? []);
                }
            }
        } catch { /* ignore */ }
    };

    // ── Delete task ───────────────────────────────────────────────────────────

    const deleteTask = async (id: string) => {
        setTasks((prev) => prev.filter((t) => t.TaskID !== id));
        try {
            await fetch(`/api/productivity/tasks/${id}`, { method: "DELETE" });
        } catch { /* ignore */ }
    };

    // ── Save edit ─────────────────────────────────────────────────────────────

    const saveEdit = async () => {
        if (!editId || !editText.trim()) return;

        setTasks((prev) =>
            prev.map((t) => (t.TaskID === editId ? { ...t, Title: editText } : t))
        );

        try {
            await fetch(`/api/productivity/tasks/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Title: editText.trim() }),
            });
        } catch { /* ignore */ }
        setEditId(null);
        setEditText("");
    };

    // ── Filter ────────────────────────────────────────────────────────────────

    const filtered = tasks.filter((t) => {
        if (filter === "active") return t.Status !== "COMPLETED" && t.Status !== "CANCELLED";
        if (filter === "completed") return t.Status === "COMPLETED";
        if (filter === "overdue") {
            return (
                t.DueDate &&
                new Date(t.DueDate) < new Date() &&
                t.Status !== "COMPLETED" &&
                t.Status !== "CANCELLED"
            );
        }
        return t.Status !== "CANCELLED";
    });

    const active = tasks.filter((t) => t.Status !== "COMPLETED" && t.Status !== "CANCELLED").length;
    const done = tasks.filter((t) => t.Status === "COMPLETED").length;
    const overdue = tasks.filter(
        (t) =>
            t.DueDate &&
            new Date(t.DueDate) < new Date() &&
            t.Status !== "COMPLETED" &&
            t.Status !== "CANCELLED"
    ).length;

    const FILTERS: { value: FilterState; label: string }[] = [
        { value: "all", label: `All (${tasks.length})` },
        { value: "active", label: `Active (${active})` },
        { value: "completed", label: `Done (${done})` },
        { value: "overdue", label: `Overdue (${overdue})` },
    ];

    return (
        <ToolPageWrapper
            title="Tasks"
            description="Gamified todo list — earn XP for every completion"
            icon={<ChecklistRtl sx={{ fontSize: 24 }} />}
            accentColor="#5E97F6"
        >
            {/* ── XP Toast ── */}
            <AnimatePresence>
                {xpToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-6 left-1/2 z-50 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #AF52DE, #5E97F6)" }}
                    >
                        <Star sx={{ fontSize: 20, color: "#fff" }} />
                        <span className="text-white font-bold text-sm">
                            +{xpToast.xp} XP
                            {xpToast.achievements.length > 0 &&
                                ` 🏆 ${xpToast.achievements.map((a) => a.title ?? a.id).join(", ")}`}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto space-y-5">
                {/* ── Input card ── */}
                <Card>
                    <div className="space-y-3">
                        {/* AI Mode toggle */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setAiMode((v) => !v)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                                style={{
                                    background: aiMode
                                        ? "linear-gradient(135deg, #AF52DE, #5E97F6)"
                                        : isDark
                                            ? "rgba(255,255,255,0.08)"
                                            : "rgba(0,0,0,0.05)",
                                    color: aiMode ? "#fff" : palette.textSecondary,
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Psychology sx={{ fontSize: 14 }} />
                                AI Mode
                            </motion.button>

                            {/* OCR button */}
                            <motion.button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                    color: palette.textSecondary,
                                }}
                                whileTap={{ scale: 0.95 }}
                                disabled={ocrLoading}
                            >
                                <CameraAlt sx={{ fontSize: 14 }} />
                                {ocrLoading ? "Scanning…" : "OCR"}
                            </motion.button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleOCR(file);
                                    e.target.value = "";
                                }}
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            {aiMode ? (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                >
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Describe your task in natural language… e.g. 'Prepare a presentation for Monday's client meeting with slides on Q4 results'"
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
                                        {aiLoading ? "Creating with AI…" : "✨ Create Task with AI"}
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="manual"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-2"
                                >
                                    <div className="flex gap-2">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addTask()}
                                            placeholder="Add a task…"
                                            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                                borderRadius: isApple ? "12px" : "16px",
                                            }}
                                        />
                                        <motion.button
                                            onClick={addTask}
                                            disabled={!isAuthenticated}
                                            className="flex items-center justify-center px-4 rounded-full text-sm font-bold"
                                            style={{ background: "#5E97F6", color: "#fff", minWidth: 48 }}
                                            whileTap={{ scale: 0.93 }}
                                        >
                                            <Add sx={{ fontSize: 20 }} />
                                        </motion.button>
                                    </div>

                                    {/* Priority & due date */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {(["LOW", "MEDIUM", "HIGH", "URGENT"] as Task["Priority"][]).map((p) => (
                                            <motion.button
                                                key={p}
                                                onClick={() => setPriority(p)}
                                                className="px-2.5 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background:
                                                        priority === p
                                                            ? PRIORITY_COLORS[p]
                                                            : isDark
                                                                ? "rgba(255,255,255,0.07)"
                                                                : "rgba(0,0,0,0.05)",
                                                    color: priority === p ? "#fff" : palette.textSecondary,
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {p} (+{PRIORITY_XP[p]}XP)
                                            </motion.button>
                                        ))}
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="px-2 py-1 rounded-lg text-xs outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                color: palette.textSecondary,
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>

                {/* ── Filters ── */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {FILTERS.map((f) => (
                        <motion.button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{
                                background:
                                    filter === f.value
                                        ? "#5E97F6"
                                        : isDark
                                            ? "rgba(255,255,255,0.07)"
                                            : "rgba(0,0,0,0.05)",
                                color: filter === f.value ? "#fff" : palette.textSecondary,
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {f.label}
                        </motion.button>
                    ))}
                </div>

                {/* ── Task list ── */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {!loading && filtered.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-16"
                                style={{ color: palette.textTertiary }}
                            >
                                <ChecklistRtl sx={{ fontSize: 48, opacity: 0.3 }} />
                                <p className="mt-3 text-sm">
                                    {filter === "all" ? "No tasks yet — add one above" : `No ${filter} tasks`}
                                </p>
                            </motion.div>
                        )}

                        {filtered.map((task) => {
                            const isComplete = task.Status === "COMPLETED";
                            const isOverdue =
                                task.DueDate &&
                                new Date(task.DueDate) < new Date() &&
                                !isComplete;
                            const isExpanded = expandedId === task.TaskID;

                            return (
                                <motion.div
                                    key={task.TaskID}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -60 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                {/* Checkbox */}
                                                <motion.button
                                                    onClick={() => toggleTask(task)}
                                                    whileTap={{ scale: 0.85 }}
                                                    style={{ color: isComplete ? "#34C759" : palette.textTertiary }}
                                                >
                                                    {isComplete ? (
                                                        <CheckCircleOutline sx={{ fontSize: 24 }} />
                                                    ) : (
                                                        <RadioButtonUnchecked sx={{ fontSize: 24 }} />
                                                    )}
                                                </motion.button>

                                                {/* Priority dot */}
                                                <div
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{ background: PRIORITY_COLORS[task.Priority] ?? "#5E97F6" }}
                                                />

                                                {/* Title */}
                                                {editId === task.TaskID ? (
                                                    <input
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                                                        autoFocus
                                                        className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                                                        style={{
                                                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                            color: palette.textPrimary,
                                                            border: `1px solid #5E97F6`,
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        className={`flex-1 text-sm ${isComplete ? "line-through opacity-50" : ""}`}
                                                        style={{
                                                            color: isOverdue ? "#FF3B30" : palette.textPrimary,
                                                        }}
                                                    >
                                                        {task.Title}
                                                    </span>
                                                )}

                                                {/* XP badge */}
                                                {isComplete && task.XPEarned > 0 && (
                                                    <span
                                                        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                                        style={{ background: "rgba(175,82,222,0.15)", color: "#AF52DE" }}
                                                    >
                                                        +{task.XPEarned}XP
                                                    </span>
                                                )}

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <motion.button
                                                        onClick={() => setExpandedId(isExpanded ? null : task.TaskID)}
                                                        whileTap={{ scale: 0.9 }}
                                                        style={{ color: palette.textTertiary }}
                                                    >
                                                        {isExpanded ? (
                                                            <ExpandLess sx={{ fontSize: 18 }} />
                                                        ) : (
                                                            <ExpandMore sx={{ fontSize: 18 }} />
                                                        )}
                                                    </motion.button>

                                                    {editId === task.TaskID ? (
                                                        <motion.button onClick={saveEdit} whileTap={{ scale: 0.9 }} style={{ color: "#34C759" }}>
                                                            <Save sx={{ fontSize: 18 }} />
                                                        </motion.button>
                                                    ) : (
                                                        <motion.button
                                                            onClick={() => { setEditId(task.TaskID); setEditText(task.Title); }}
                                                            whileTap={{ scale: 0.9 }}
                                                            style={{ color: palette.textTertiary }}
                                                        >
                                                            <Edit sx={{ fontSize: 18 }} />
                                                        </motion.button>
                                                    )}

                                                    <motion.button
                                                        onClick={() => deleteTask(task.TaskID)}
                                                        whileTap={{ scale: 0.9 }}
                                                        style={{ color: "#FF3B30" }}
                                                    >
                                                        <Delete sx={{ fontSize: 18 }} />
                                                    </motion.button>
                                                </div>
                                            </div>

                                            {/* Expanded details */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden pl-10 space-y-2"
                                                    >
                                                        {task.Description && (
                                                            <p className="text-xs" style={{ color: palette.textSecondary }}>
                                                                {task.Description}
                                                            </p>
                                                        )}
                                                        {task.DueDate && (
                                                            <div className="flex items-center gap-1 text-xs" style={{ color: isOverdue ? "#FF3B30" : palette.textTertiary }}>
                                                                <CalendarToday sx={{ fontSize: 12 }} />
                                                                Due {new Date(task.DueDate).toLocaleDateString()}
                                                                {isOverdue && " (overdue)"}
                                                            </div>
                                                        )}
                                                        {task.SubTasks.length > 0 && (
                                                            <div className="space-y-1">
                                                                {task.SubTasks.map((st) => (
                                                                    <div key={st.id} className="flex items-center gap-2 text-xs" style={{ color: palette.textSecondary }}>
                                                                        <span>{st.completed ? "✅" : "⬜"}</span>
                                                                        <span className={st.completed ? "line-through opacity-50" : ""}>{st.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-1">
                                                            {task.Tags.map((tag) => (
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

                {/* ── Not authenticated ── */}
                {isAuthenticated === false && (
                    <Card>
                        <div className="text-center py-8 space-y-2">
                            <p className="text-sm font-bold" style={{ color: palette.textPrimary }}>
                                Sign in to save tasks to your account
                            </p>
                            <a
                                href="/auth/login"
                                className="inline-block px-5 py-2 rounded-full text-sm font-bold"
                                style={{ background: "#5E97F6", color: "#fff" }}
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
