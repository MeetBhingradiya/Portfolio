/**
 * Tasks — /tools/productivity/tasks
 * Full task management: create, complete, hide, duplicate, delete.
 * Supports attachments, priorities, categories, due dates and search.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    Add,
    CheckCircle,
    RadioButtonUnchecked,
    MoreVert,
    Delete,
    ContentCopy,
    VisibilityOff,
    Visibility,
    Edit,
    Close,
    AttachFile,
    CalendarToday,
    LocalOffer,
    FilterList,
    Search,
    Psychology,
    Star,
    ExpandMore,
    ExpandLess,
    Upload,
    InsertDriveFile,
    Image,
    PictureAsPdf,
    Restore,
    KeyboardReturn
} from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Attachment {
    AssetID: string;
    URL: string;
    FileName: string;
    FileType: string;
    FileSize: number;
}
interface Task {
    TaskID: string;
    Title: string;
    Description?: string;
    Category: string;
    Tags: string[];
    Status: string;
    Priority: string;
    DueDate?: string;
    XPReward: number;
    XPEarned: number;
    Attachments: Attachment[];
    CompletedAt?: string;
    createdAt: string;
}
interface XPToast {
    xp: number;
    achievements: string[];
}

const ACCENT = "#AF52DE";
const PRIORITY_COLORS = {
    LOW: "#6b7280",
    MEDIUM: "#3b82f6",
    HIGH: "#f59e0b",
    URGENT: "#ef4444"
} as const;
const CATEGORIES = ["ALL", "PERSONAL", "WORK", "HEALTH", "EDUCATION", "FINANCE", "SOCIAL", "HOBBY", "OTHER"];
const PRIORITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];
const XP_MAP = { LOW: 5, MEDIUM: 10, HIGH: 20, URGENT: 35 } as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    const then = new Date(d),
        now = new Date();
    const diff = Math.ceil((then.getTime() - now.getTime()) / 86_400_000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    if (Math.abs(diff) < 7) return `${Math.abs(diff)}d ${diff < 0 ? "ago" : ""}`;
    return then.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function fmtSize(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function attachIcon(type: string) {
    if (type.startsWith("image/")) return <Image style={{ fontSize: 16 }} />;
    if (type === "application/pdf") return <PictureAsPdf style={{ fontSize: 16 }} />;
    return <InsertDriveFile style={{ fontSize: 16 }} />;
}

// ─── XP Toast ──────────────────────────────────────────────────────────────────

function XPToastBanner({ toast, onDone }: { toast: XPToast; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 2800);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <motion.div
            className="fixed top-4 left-1/2 z-[100] px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-bold flex items-center gap-2"
            style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, #FF6B9D 100%)`,
                translateX: "-50%"
            }}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}>
            <Star style={{ fontSize: 18 }} />+{toast.xp} XP
            {toast.achievements.length > 0 && <span className="opacity-90 font-normal text-xs">· {toast.achievements[0]}</span>}
        </motion.div>
    );
}

// ─── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({
    task,
    isDark,
    isApple,
    palette,
    border,
    cardBg,
    onToggle,
    onHide,
    onRestore,
    onDuplicate,
    onDelete,
    onEdit,
    onUpload
}: {
    task: Task;
    isDark: boolean;
    isApple: boolean;
    palette: any;
    border: string;
    cardBg: string;
    onToggle: (t: Task) => void;
    onHide: (id: string) => void;
    onRestore: (id: string) => void;
    onDuplicate: (t: Task) => void;
    onDelete: (id: string) => void;
    onEdit: (t: Task) => void;
    onUpload: (id: string, files: FileList) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const done = task.Status === "COMPLETED";
    const hidden = task.Status === "HIDDEN";
    const dueDate = task.DueDate ? new Date(task.DueDate) : null;
    const overdue = dueDate && dueDate < new Date() && !done;
    const pColor = PRIORITY_COLORS[task.Priority as keyof typeof PRIORITY_COLORS] ?? "#6b7280";

    // Close menu on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        if (menuOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    return (
        <motion.div
            className="rounded-xl"
            style={{
                background: cardBg,
                border: `1px solid ${border}`,
                opacity: hidden ? 0.6 : 1
            }}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: hidden ? 0.6 : 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}>
            {/* Main row */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Checkbox */}
                <button
                    onClick={() => onToggle(task)}
                    className="shrink-0"
                    style={{
                        color: done ? "#22c55e" : isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"
                    }}>
                    {done ? <CheckCircle style={{ fontSize: 22 }} /> : <RadioButtonUnchecked style={{ fontSize: 22 }} />}
                </button>

                {/* Priority dot */}
                <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: pColor }}
                    title={task.Priority}
                />

                {/* Title */}
                <span
                    className="flex-1 text-sm font-medium truncate cursor-pointer select-none"
                    style={{
                        color: done || hidden ? palette.textTertiary : palette.textPrimary,
                        textDecoration: done ? "line-through" : "none"
                    }}
                    onClick={() => setExpanded((v) => !v)}>
                    {task.Title}
                </span>

                {/* Chips */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {dueDate && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                                background: overdue ? "#ef444418" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                color: overdue ? "#ef4444" : palette.textSecondary
                            }}>
                            {fmtDate(task.DueDate!)}
                        </span>
                    )}
                    {task.Attachments?.length > 0 && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color: palette.textTertiary
                            }}>
                            <AttachFile style={{ fontSize: 11 }} />
                            {task.Attachments.length}
                        </span>
                    )}
                    <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${ACCENT}16`, color: ACCENT }}>
                        +{XP_MAP[task.Priority as keyof typeof XP_MAP] ?? 10} XP
                    </span>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    style={{ color: palette.textTertiary }}>
                    {expanded ? <ExpandLess style={{ fontSize: 18 }} /> : <ExpandMore style={{ fontSize: 18 }} />}
                </button>

                {/* 3-dot menu */}
                <div
                    className="relative"
                    ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        style={{ color: palette.textTertiary }}>
                        <MoreVert style={{ fontSize: 18 }} />
                    </button>
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                                style={{
                                    background: isDark ? "rgba(30,30,32,0.98)" : "rgba(255,255,255,0.98)",
                                    border: `1px solid ${border}`,
                                    backdropFilter: "blur(16px)"
                                }}
                                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -6 }}>
                                {!hidden && (
                                    <button
                                        onClick={() => {
                                            onEdit(task);
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-white/5"
                                        style={{ color: palette.textPrimary }}>
                                        <Edit style={{ fontSize: 16 }} /> Edit
                                    </button>
                                )}
                                {done && (
                                    <button
                                        onClick={() => {
                                            onToggle(task);
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-white/5"
                                        style={{ color: palette.textPrimary }}>
                                        <Restore style={{ fontSize: 16 }} /> Mark Undone
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        onDuplicate(task);
                                        setMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-white/5"
                                    style={{ color: palette.textPrimary }}>
                                    <ContentCopy style={{ fontSize: 16 }} /> Duplicate
                                </button>
                                {hidden ? (
                                    <button
                                        onClick={() => {
                                            onRestore(task.TaskID);
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-white/5"
                                        style={{ color: "#22c55e" }}>
                                        <Visibility style={{ fontSize: 16 }} /> Restore
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            onHide(task.TaskID);
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-white/5"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        <VisibilityOff style={{ fontSize: 16 }} /> Hide
                                    </button>
                                )}
                                <div
                                    className="h-px mx-2 my-1"
                                    style={{ background: border }}
                                />
                                <button
                                    onClick={() => {
                                        onDelete(task.TaskID);
                                        setMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-red-500/10"
                                    style={{ color: "#ef4444" }}>
                                    <Delete style={{ fontSize: 16 }} /> Delete Permanently
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Expanded panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}>
                        <div
                            className="px-4 pb-4 space-y-3"
                            style={{ borderTop: `1px solid ${border}` }}>
                            {/* Mobile chips */}
                            <div className="flex flex-wrap gap-1.5 pt-3 sm:hidden">
                                {dueDate && (
                                    <span
                                        className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"
                                        style={{
                                            background: overdue ? "#ef444418" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                            color: overdue ? "#ef4444" : palette.textSecondary
                                        }}>
                                        <CalendarToday style={{ fontSize: 11 }} />
                                        {fmtDate(task.DueDate!)}
                                    </span>
                                )}
                                <span
                                    className="text-xs px-2 py-1 rounded-full font-semibold"
                                    style={{
                                        background: `${ACCENT}16`,
                                        color: ACCENT
                                    }}>
                                    +{XP_MAP[task.Priority as keyof typeof XP_MAP] ?? 10} XP
                                </span>
                            </div>

                            {/* Description */}
                            {task.Description && (
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ color: palette.textSecondary }}>
                                    {task.Description}
                                </p>
                            )}

                            {/* Tags */}
                            {task.Tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {task.Tags.map((t) => (
                                        <span
                                            key={t}
                                            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                                color: palette.textTertiary
                                            }}>
                                            <LocalOffer style={{ fontSize: 10 }} />
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Attachments */}
                            <div>
                                {task.Attachments?.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                        {task.Attachments.map((a) => (
                                            <a
                                                key={a.AssetID}
                                                href={a.URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 rounded-lg group"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                                    border: `1px solid ${border}`
                                                }}>
                                                {a.FileType.startsWith("image/") ? (
                                                    <img
                                                        src={a.URL}
                                                        alt={a.FileName}
                                                        className="w-6 h-6 rounded object-cover"
                                                    />
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: ACCENT
                                                        }}>
                                                        {attachIcon(a.FileType)}
                                                    </span>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className="text-xs truncate font-medium"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {a.FileName}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {fmtSize(a.FileSize)}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {!hidden && (
                                    <>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            className="hidden"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files?.length) {
                                                    onUpload(task.TaskID, e.target.files);
                                                    e.target.value = "";
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                color: palette.textSecondary,
                                                border: `1px dashed ${border}`
                                            }}>
                                            <Upload style={{ fontSize: 14 }} /> Add Attachment
                                        </button>
                                    </>
                                )}
                            </div>

                            <p
                                className="text-xs"
                                style={{ color: palette.textTertiary }}>
                                Created{" "}
                                {new Date(task.createdAt).toLocaleDateString("en", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                })}
                                {task.CompletedAt &&
                                    ` · Completed ${new Date(task.CompletedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}`}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────

function TaskModal({
    initial,
    isDark,
    isApple,
    palette,
    border,
    onSave,
    onClose
}: {
    initial?: Partial<Task>;
    isDark: boolean;
    isApple: boolean;
    palette: any;
    border: string;
    onSave: (data: Partial<Task>) => void;
    onClose: () => void;
}) {
    const [title, setTitle] = useState(initial?.Title ?? "");
    const [desc, setDesc] = useState(initial?.Description ?? "");
    const [priority, setPriority] = useState(initial?.Priority ?? "MEDIUM");
    const [category, setCategory] = useState(initial?.Category ?? "PERSONAL");
    const [dueDate, setDueDate] = useState(initial?.DueDate ? initial.DueDate.split("T")[0] : "");
    const [tags, setTags] = useState(initial?.Tags?.join(", ") ?? "");
    const [aiMode, setAiMode] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const modalBg = isApple ? (isDark ? "rgba(28,28,30,0.97)" : "rgba(255,255,255,0.97)") : palette.surface;

    async function handleAI() {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const r = await fetch("/api/productivity/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create_task",
                    prompt: aiPrompt
                })
            });
            const j = await r.json();
            if (j.success && j.data) {
                setTitle(j.data.Title ?? "");
                setDesc(j.data.Description ?? "");
                setPriority(j.data.Priority ?? "MEDIUM");
                setCategory(j.data.Category ?? "PERSONAL");
                setAiMode(false);
            }
        } finally {
            setAiLoading(false);
        }
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.div
                className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{
                    background: modalBg,
                    border: `1px solid ${border}`,
                    backdropFilter: isApple ? "blur(24px)" : "none"
                }}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                    <h2
                        className="font-bold text-lg"
                        style={{ color: palette.textPrimary }}>
                        {initial?.TaskID ? "Edit Task" : "New Task"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAiMode((v) => !v)}
                            className="p-1.5 rounded-lg"
                            style={{
                                color: aiMode ? ACCENT : palette.textTertiary,
                                background: aiMode ? `${ACCENT}18` : "transparent"
                            }}
                            title="AI Assist">
                            <Psychology style={{ fontSize: 20 }} />
                        </button>
                        <button onClick={onClose}>
                            <Close style={{ color: palette.textTertiary }} />
                        </button>
                    </div>
                </div>

                {aiMode && (
                    <div className="mb-4 flex gap-2">
                        <input
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAI()}
                            placeholder="Describe the task in plain language…"
                            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                color: palette.textPrimary,
                                borderColor: border
                            }}
                        />
                        <button
                            onClick={handleAI}
                            disabled={aiLoading}
                            className="px-3 py-2 rounded-xl text-sm font-semibold shrink-0"
                            style={{
                                background: ACCENT,
                                color: "#fff",
                                opacity: aiLoading ? 0.6 : 1
                            }}>
                            {aiLoading ? "…" : "Go"}
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title *"
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                            color: palette.textPrimary,
                            borderColor: border
                        }}
                    />
                    <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Description (optional)"
                        rows={3}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                            color: palette.textPrimary,
                            borderColor: border
                        }}
                    />

                    {/* Priority */}
                    <div>
                        <p
                            className="text-xs font-medium mb-1.5"
                            style={{ color: palette.textSecondary }}>
                            Priority
                        </p>
                        <div className="flex gap-2">
                            {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                                    style={{
                                        background:
                                            priority === p
                                                ? `${PRIORITY_COLORS[p]}20`
                                                : isDark
                                                  ? "rgba(255,255,255,0.05)"
                                                  : "rgba(0,0,0,0.04)",
                                        color: priority === p ? PRIORITY_COLORS[p] : palette.textTertiary,
                                        border: `1px solid ${priority === p ? PRIORITY_COLORS[p] : border}`
                                    }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <p
                            className="text-xs font-medium mb-1.5"
                            style={{ color: palette.textSecondary }}>
                            Category
                        </p>
                        <CustomSelect
                            value={category}
                            onChange={setCategory}
                            options={["PERSONAL", "WORK", "HEALTH", "EDUCATION", "FINANCE", "SOCIAL", "HOBBY", "OTHER"].map((c) => ({
                                value: c,
                                label: c
                            }))}
                        />
                    </div>

                    {/* Due date */}
                    <div>
                        <p
                            className="text-xs font-medium mb-1.5"
                            style={{ color: palette.textSecondary }}>
                            Due Date (optional)
                        </p>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                color: palette.textPrimary,
                                borderColor: border
                            }}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <p
                            className="text-xs font-medium mb-1.5"
                            style={{ color: palette.textSecondary }}>
                            Tags (comma separated)
                        </p>
                        <input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g. urgent, work, review"
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                color: palette.textPrimary,
                                borderColor: border
                            }}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: palette.textSecondary
                        }}>
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (!title.trim()) return;
                            onSave({
                                Title: title.trim(),
                                Description: desc.trim() || undefined,
                                Priority: priority,
                                Category: category,
                                DueDate: dueDate || undefined,
                                Tags: tags
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                            });
                        }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: ACCENT, color: "#fff" }}>
                        {initial?.TaskID ? "Save Changes" : "Add Task"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const cardBg = isApple ? (isDark ? "rgba(44,44,46,0.72)" : "rgba(255,255,255,0.75)") : palette.surface;
    const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
    const blur = isApple ? "blur(16px)" : "none";

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"ALL" | "PENDING" | "COMPLETED" | "HIDDEN">("ALL");
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("ALL");
    const [priFilter, setPriFilter] = useState("ALL");
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [quickTitle, setQuickTitle] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState<Task | undefined>();
    const [toast, setToast] = useState<XPToast | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);

    const fetchTasks = useCallback(
        async (reset = false) => {
            setLoading(true);
            const pg = reset ? 1 : page;
            const params = new URLSearchParams({
                page: String(pg),
                limit: "30"
            });
            if (tab !== "ALL") params.set("status", tab);
            if (catFilter !== "ALL") params.set("category", catFilter);
            if (priFilter !== "ALL") params.set("priority", priFilter);
            if (search.trim()) params.set("search", search.trim());
            try {
                const r = await fetch(`/api/productivity/tasks?${params}`);
                const j = await r.json();
                if (j.success) {
                    setTasks(j.data.tasks);
                    setTotalPages(j.data.pagination.totalPages);
                    if (reset) setPage(1);
                }
            } finally {
                setLoading(false);
            }
        },
        [tab, catFilter, priFilter, search, page]
    );

    useEffect(() => {
        fetchTasks(true);
    }, [tab, catFilter, priFilter]);
    useEffect(() => {
        if (search.length === 0 || search.length > 2) fetchTasks(true);
    }, [search]);
    useEffect(() => {
        fetchTasks();
    }, [page]);

    async function quickAdd() {
        if (!quickTitle.trim()) return;
        const r = await fetch("/api/productivity/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Title: quickTitle.trim() })
        });
        const j = await r.json();
        if (j.success) {
            setQuickTitle("");
            fetchTasks(true);
        }
    }

    async function saveTask(data: Partial<Task>) {
        if (editTask?.TaskID) {
            await fetch(`/api/productivity/tasks/${editTask.TaskID}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
        } else {
            await fetch("/api/productivity/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
        }
        setShowModal(false);
        setEditTask(undefined);
        fetchTasks(true);
    }

    async function toggleTask(task: Task) {
        const newStatus = task.Status === "COMPLETED" ? "PENDING" : "COMPLETED";
        const r = await fetch(`/api/productivity/tasks/${task.TaskID}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Status: newStatus })
        });
        const j = await r.json();
        if (j.success) {
            if (j.xp)
                setToast({
                    xp: j.xp.xpAwarded,
                    achievements: j.xp.newAchievements.map((a: any) => a.id)
                });
            fetchTasks(true);
        }
    }

    async function hideTask(id: string) {
        await fetch(`/api/productivity/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Status: "HIDDEN" })
        });
        fetchTasks(true);
    }

    async function restoreTask(id: string) {
        await fetch(`/api/productivity/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Status: "PENDING" })
        });
        fetchTasks(true);
    }

    async function deleteTask(id: string) {
        if (!confirm("Permanently delete this task? XP earned will be revoked.")) return;
        await fetch(`/api/productivity/tasks/${id}`, { method: "DELETE" });
        fetchTasks(true);
    }

    async function duplicateTask(task: Task) {
        await fetch("/api/productivity/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Title: `${task.Title} (copy)`,
                Description: task.Description,
                Priority: task.Priority,
                Category: task.Category,
                Tags: task.Tags,
                DueDate: task.DueDate
            })
        });
        fetchTasks(true);
    }

    async function uploadAttachment(taskId: string, files: FileList) {
        setUploading(taskId);
        try {
            const task = tasks.find((t) => t.TaskID === taskId);
            if (!task) return;

            const newAttachments = [...(task.Attachments ?? [])];
            for (const file of Array.from(files)) {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("type", file.type.startsWith("image/") ? "other" : "document");
                fd.append("context", "productivity-task");

                const r = await fetch("/api/cdn/upload", {
                    method: "POST",
                    body: fd
                });
                const j = await r.json();
                if (j.assetId) {
                    newAttachments.push({
                        AssetID: j.assetId,
                        URL: j.cdnUrl,
                        FileName: file.name,
                        FileType: file.type,
                        FileSize: file.size
                    });
                }
            }
            await fetch(`/api/productivity/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Attachments: newAttachments })
            });
            fetchTasks(true);
        } finally {
            setUploading(null);
        }
    }

    const pendingCount = tasks.filter((t) => t.Status === "PENDING").length;
    const completedCount = tasks.filter((t) => t.Status === "COMPLETED").length;

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 space-y-4">
            {/* XP Toast */}
            <AnimatePresence>
                {toast && (
                    <XPToastBanner
                        toast={toast}
                        onDone={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="pt-2">
                <h1
                    className="text-2xl font-bold"
                    style={{ color: palette.textPrimary }}>
                    Tasks
                </h1>
                <p
                    className="text-sm"
                    style={{ color: palette.textSecondary }}>
                    {pendingCount} pending · {completedCount} done
                </p>
            </div>

            {/* Quick Add */}
            <div className="flex gap-2">
                <div
                    className="flex-1 flex items-center gap-2 px-4 rounded-2xl"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                        backdropFilter: blur
                    }}>
                    <Add style={{ color: ACCENT, fontSize: 20 }} />
                    <input
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && quickAdd()}
                        placeholder="Add a task and press Enter…"
                        className="flex-1 text-sm py-3 outline-none bg-transparent"
                        style={{ color: palette.textPrimary }}
                    />
                    {quickTitle && (
                        <button onClick={quickAdd}>
                            <KeyboardReturn style={{ color: ACCENT, fontSize: 18 }} />
                        </button>
                    )}
                </div>
                <motion.button
                    onClick={() => {
                        setEditTask(undefined);
                        setShowModal(true);
                    }}
                    className="px-4 py-3 rounded-2xl font-semibold text-sm flex items-center gap-1.5"
                    style={{ background: ACCENT, color: "#fff" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}>
                    <Add style={{ fontSize: 18 }} />
                    <span className="hidden sm:inline">New</span>
                </motion.button>
            </div>

            {/* Filter Tabs */}
            <div
                className="flex gap-1 p-1 rounded-xl"
                style={{
                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
                }}>
                {(["ALL", "PENDING", "COMPLETED", "HIDDEN"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all"
                        style={{
                            background: tab === t ? ACCENT : "transparent",
                            color: tab === t ? "#fff" : palette.textTertiary
                        }}>
                        {t === "ALL" ? "All" : t === "PENDING" ? "Pending" : t === "COMPLETED" ? "Done" : "Hidden"}
                    </button>
                ))}
            </div>

            {/* Filters row */}
            <div className="flex gap-2 flex-wrap">
                <div
                    className="flex items-center gap-2 flex-1 min-w-36 px-3 rounded-xl"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                        backdropFilter: blur
                    }}>
                    <Search style={{ color: palette.textTertiary, fontSize: 16 }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="flex-1 text-sm py-2 outline-none bg-transparent"
                        style={{ color: palette.textPrimary }}
                    />
                    {search && (
                        <button onClick={() => setSearch("")}>
                            <Close
                                style={{
                                    fontSize: 14,
                                    color: palette.textTertiary
                                }}
                            />
                        </button>
                    )}
                </div>
                <select
                    value={priFilter}
                    onChange={(e) => setPriFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs outline-none border"
                    style={{
                        background: cardBg,
                        color: palette.textPrimary,
                        borderColor: border
                    }}>
                    {PRIORITIES.map((p) => (
                        <option
                            key={p}
                            value={p}>
                            {p === "ALL" ? "All Priority" : p}
                        </option>
                    ))}
                </select>
                <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs outline-none border"
                    style={{
                        background: cardBg,
                        color: palette.textPrimary,
                        borderColor: border
                    }}>
                    {CATEGORIES.map((c) => (
                        <option
                            key={c}
                            value={c}>
                            {c === "ALL" ? "All Category" : c}
                        </option>
                    ))}
                </select>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="w-7 h-7 rounded-full border-2"
                        style={{
                            borderColor: `${ACCENT}30`,
                            borderTopColor: ACCENT
                        }}
                    />
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                        style={{ background: `${ACCENT}14` }}>
                        <FilterList style={{ color: ACCENT, fontSize: 28 }} />
                    </div>
                    <p
                        className="font-semibold"
                        style={{ color: palette.textPrimary }}>
                        No tasks found
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        {tab === "HIDDEN" ? "No hidden tasks" : "Add your first task above"}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {tasks.map((task) => (
                            <TaskRow
                                key={task.TaskID}
                                task={task}
                                isDark={isDark}
                                isApple={isApple}
                                palette={palette}
                                border={border}
                                cardBg={cardBg}
                                onToggle={toggleTask}
                                onHide={hideTask}
                                onRestore={restoreTask}
                                onDuplicate={duplicateTask}
                                onDelete={deleteTask}
                                onEdit={(t) => {
                                    setEditTask(t);
                                    setShowModal(true);
                                }}
                                onUpload={uploadAttachment}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-xl text-sm"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                            color: page === 1 ? palette.textTertiary : palette.textPrimary
                        }}>
                        Prev
                    </button>
                    <span
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-xl text-sm"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                            color: page === totalPages ? palette.textTertiary : palette.textPrimary
                        }}>
                        Next
                    </button>
                </div>
            )}

            {/* Uploading indicator */}
            {uploading && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                    style={{
                        background: isDark ? "rgba(30,30,32,0.95)" : "rgba(255,255,255,0.95)",
                        border: `1px solid ${border}`,
                        color: palette.textPrimary,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.15)"
                    }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                            borderColor: `${ACCENT}30`,
                            borderTopColor: ACCENT
                        }}
                    />
                    Uploading…
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <TaskModal
                        initial={editTask}
                        isDark={isDark}
                        isApple={isApple}
                        palette={palette}
                        border={border}
                        onSave={saveTask}
                        onClose={() => {
                            setShowModal(false);
                            setEditTask(undefined);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Mobile FAB */}
            <motion.button
                onClick={() => {
                    setEditTask(undefined);
                    setShowModal(true);
                }}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center lg:hidden z-40"
                style={{
                    background: ACCENT,
                    color: "#fff",
                    boxShadow: `0 8px 24px ${ACCENT}60`
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}>
                <Add style={{ fontSize: 28 }} />
            </motion.button>
        </div>
    );
}
