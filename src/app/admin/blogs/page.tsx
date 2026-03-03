"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import ArticleIcon from "@mui/icons-material/Article";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

type StatusFilter = "all" | "pending_review" | "published" | "unlisted" | "private" | "rejected" | "draft";

interface BlogItem {
    _id: string;
    title: string;
    slug: string;
    authorName?: string;
    authorEmail?: string;
    category?: string;
    status: string;
    submittedAt?: string;
    createdAt?: string;
    views?: number;
    likes?: number;
}

interface StatusCounts {
    all: number;
    draft: number;
    pending_review: number;
    published: number;
    unlisted: number;
    private: number;
    rejected: number;
}

const STATUS_TAB_LABELS: { key: StatusFilter; label: string; color?: string }[] = [
    { key: "all", label: "All" },
    { key: "pending_review", label: "Pending", color: "#f59e0b" },
    { key: "published", label: "Published", color: "#22c55e" },
    { key: "unlisted", label: "Unlisted", color: "#818cf8" },
    { key: "private", label: "Private", color: "#6b7280" },
    { key: "draft", label: "Drafts", color: "#94a3b8" },
    { key: "rejected", label: "Rejected", color: "#ef4444" }
];

export default function AdminBlogsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [table, setTable] = useState({
        blogs: [] as BlogItem[],
        counts: { all: 0, draft: 0, pending_review: 0, published: 0, unlisted: 0, private: 0, rejected: 0 } as StatusCounts,
        filter: "all" as StatusFilter,
        loading: true,
        saving: null as string | null,
    });
    const patchTable = useCallback((p: Partial<typeof table>) => setTable(s => ({ ...s, ...p })), []);

    const [modal, setModal] = useState({
        rejectTarget: null as BlogItem | null,
        rejectReason: "",
        approveTarget: null as BlogItem | null,
        approveStatus: "published" as "published" | "unlisted" | "private",
        msg: null as { type: "ok" | "err"; text: string } | null,
    });
    const patchModal = useCallback((p: Partial<typeof modal>) => setModal(s => ({ ...s, ...p })), []);

    const fetchBlogs = useCallback(async () => {
        patchTable({ loading: true });
        try {
            const params = table.filter !== "all" ? `?status=${table.filter}` : "";
            const res = await fetch(`/api/admin/blogs${params}`);
            const data = await res.json();
            if (data.success) {
                patchTable({ blogs: data.data || data.blogs || [] });
                if (data.counts) patchTable({ counts: data.counts });
            }
        } catch {}
        patchTable({ loading: false });
    }, [table.filter]);

    useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

    const showMsg = (type: "ok" | "err", text: string) => {
        patchModal({ msg: { type, text } });
        setTimeout(() => patchModal({ msg: null }), 3000);
    };

    const handleApprove = async () => {
        if (!modal.approveTarget) return;
        patchTable({ saving: modal.approveTarget._id });
        try {
            const res = await fetch(`/api/admin/blogs?id=${modal.approveTarget._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve", status: modal.approveStatus })
            });
            const data = await res.json();
            if (data.success) {
                showMsg("ok", `Blog approved as ${modal.approveStatus}`);
                fetchBlogs();
            } else {
                showMsg("err", data.error);
            }
        } catch {
            showMsg("err", "Approve failed");
        }
        patchTable({ saving: null });
        patchModal({ approveTarget: null });
    };

    const handleReject = async () => {
        if (!modal.rejectTarget) return;
        patchTable({ saving: modal.rejectTarget._id });
        try {
            const res = await fetch(`/api/admin/blogs?id=${modal.rejectTarget._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reject", rejectionReason: modal.rejectReason })
            });
            const data = await res.json();
            if (data.success) {
                showMsg("ok", "Blog rejected");
                fetchBlogs();
            } else {
                showMsg("err", data.error);
            }
        } catch {
            showMsg("err", "Reject failed");
        }
        patchTable({ saving: null });
        patchModal({ rejectTarget: null, rejectReason: "" });
    };

    const handleDelete = async (blog: BlogItem) => {
        if (!confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
        patchTable({ saving: blog._id });
        try {
            const res = await fetch(`/api/admin/blogs?id=${blog._id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showMsg("ok", "Blog deleted");
                fetchBlogs();
            } else {
                showMsg("err", data.error);
            }
        } catch {}
        patchTable({ saving: null });
    };

    const cardStyle = {
        background: isApple
            ? isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)"
            : isDark ? "rgba(20,20,28,0.95)" : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        backdropFilter: isApple ? "blur(20px)" : "none"
    };

    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        color: palette.textPrimary,
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 14,
        outline: "none",
        width: "100%"
    };

    return (
        <div className="min-h-screen p-6" style={{ background: palette.background }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ArticleIcon style={{ color: palette.accent }} />
                    <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Blog Management</h1>
                </div>
                <motion.button onClick={fetchBlogs} whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl" style={{ ...cardStyle, borderRadius: 12 }}>
                    <RefreshIcon style={{ color: palette.textSecondary }} />
                </motion.button>
            </div>

            {/* Feedback */}
            <AnimatePresence>
                {modal.msg && (
                    <motion.div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium"
                        style={{
                            background: modal.msg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: modal.msg.type === "ok" ? "#22c55e" : "#ef4444",
                            border: `1px solid ${modal.msg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`
                        }}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {modal.msg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status tabs */}
            <div className="flex gap-1.5 flex-wrap mb-6">
                {STATUS_TAB_LABELS.map((t) => {
                    const count = table.counts[t.key];
                    return (
                        <motion.button key={t.key} onClick={() => patchTable({ filter: t.key })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{
                                background: table.filter === t.key ? (t.color || palette.accent) : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                color: table.filter === t.key ? "#fff" : t.color || palette.textSecondary,
                                border: `1px solid ${table.filter === t.key ? "transparent" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                            }}
                            whileTap={{ scale: 0.95 }}>
                            {t.label}
                            {count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                                    style={{ background: table.filter === t.key ? "rgba(255,255,255,0.25)" : t.color ? t.color + "20" : "rgba(0,0,0,0.1)", color: table.filter === t.key ? "#fff" : t.color }}>
                                    {count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                {table.loading ? (
                    <div className="py-12 text-center" style={{ color: palette.textSecondary }}>Loading…</div>
                ) : table.blogs.length === 0 ? (
                    <div className="py-12 text-center" style={{ color: palette.textSecondary }}>No blogs found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                                    {["Title", "Author", "Category", "Status", "Date", "Actions"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                                            style={{ color: palette.textSecondary }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table.blogs.map((blog, i) => {
                                    const isLast = i === table.blogs.length - 1;
                                    const STATUS_COLOR: Record<string, string> = {
                                        draft: "#94a3b8", pending_review: "#f59e0b",
                                        published: "#22c55e", unlisted: "#818cf8",
                                        private: "#6b7280", rejected: "#ef4444"
                                    };
                                    const color = STATUS_COLOR[blog.status] || "#94a3b8";
                                    const dateStr = blog.submittedAt || blog.createdAt;

                                    return (
                                        <tr key={blog._id}
                                            style={{ borderBottom: isLast ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-sm line-clamp-1 max-w-xs block"
                                                    style={{ color: palette.textPrimary }}>{blog.title}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm" style={{ color: palette.textSecondary }}>
                                                    {blog.authorName || blog.authorEmail || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs capitalize" style={{ color: palette.textSecondary }}>
                                                    {blog.category || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                    style={{ background: color + "18", color }}>
                                                    {blog.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs" style={{ color: palette.textSecondary }}>
                                                    {dateStr ? new Date(dateStr).toLocaleDateString() : "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {/* View */}
                                                    <Link href={`/blogs/${blog.slug || blog._id}`} target="_blank">
                                                        <motion.button whileTap={{ scale: 0.9 }} className="p-1.5 rounded-lg"
                                                            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                                                            <OpenInNewIcon style={{ fontSize: 14, color: palette.textSecondary }} />
                                                        </motion.button>
                                                    </Link>
                                                    {/* Edit */}
                                                    <Link href={`/blogs/${blog.slug || blog._id}/edit`}>
                                                        <motion.button whileTap={{ scale: 0.9 }} className="p-1.5 rounded-lg"
                                                            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                                                            <EditIcon style={{ fontSize: 14, color: palette.textSecondary }} />
                                                        </motion.button>
                                                    </Link>
                                                    {/* Approve */}
                                                    {blog.status === "pending_review" && (
                                                        <motion.button whileTap={{ scale: 0.9 }}
                                                            onClick={() => patchModal({ approveTarget: blog, approveStatus: "published" })}
                                                            className="p-1.5 rounded-lg"
                                                            style={{ background: "rgba(34,197,94,0.12)" }}>
                                                            <CheckCircleIcon style={{ fontSize: 14, color: "#22c55e" }} />
                                                        </motion.button>
                                                    )}
                                                    {/* Reject */}
                                                    {(blog.status === "pending_review" || blog.status === "published") && (
                                                        <motion.button whileTap={{ scale: 0.9 }}
                                                            onClick={() => patchModal({ rejectTarget: blog, rejectReason: "" })}
                                                            className="p-1.5 rounded-lg"
                                                            style={{ background: "rgba(239,68,68,0.1)" }}>
                                                            <CancelIcon style={{ fontSize: 14, color: "#ef4444" }} />
                                                        </motion.button>
                                                    )}
                                                    {/* Delete */}
                                                    <motion.button whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(blog)}
                                                        disabled={table.saving === blog._id}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ background: "rgba(239,68,68,0.08)" }}>
                                                        <DeleteIcon style={{ fontSize: 14, color: "#ef4444" }} />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            <AnimatePresence>
                {modal.approveTarget && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) patchModal({ approveTarget: null }); }}>
                        <motion.div className="w-full max-w-md rounded-2xl p-6"
                            style={cardStyle}
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <h3 className="text-lg font-bold mb-1" style={{ color: palette.textPrimary }}>Approve Blog</h3>
                            <p className="text-sm mb-5" style={{ color: palette.textSecondary }}>
                                Set visibility for: <span className="font-medium" style={{ color: palette.textPrimary }}>{modal.approveTarget.title}</span>
                            </p>
                            <div className="flex flex-col gap-2 mb-6">
                                {(["published", "unlisted", "private"] as const).map((s) => (
                                    <label key={s} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                                        style={{ background: modal.approveStatus === s ? `${palette.accent}15` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                        <input type="radio" value={s} checked={modal.approveStatus === s} onChange={() => patchModal({ approveStatus: s })} className="accent-blue-500" />
                                        <div>
                                            <div className="text-sm font-medium capitalize" style={{ color: palette.textPrimary }}>{s}</div>
                                            <div className="text-xs" style={{ color: palette.textSecondary }}>
                                                {s === "published" ? "Visible to everyone" : s === "unlisted" ? "Only via direct link" : "Only you"}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => patchModal({ approveTarget: null })} className="flex-1 py-2 rounded-xl text-sm font-medium"
                                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>
                                    Cancel
                                </button>
                                <motion.button onClick={handleApprove} whileTap={{ scale: 0.95 }}
                                    className="flex-1 py-2 rounded-xl text-sm font-semibold"
                                    style={{ background: "#22c55e", color: "#fff" }}>
                                    Approve
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reject Modal */}
            <AnimatePresence>
                {modal.rejectTarget && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) patchModal({ rejectTarget: null, rejectReason: "" }); }}>
                        <motion.div className="w-full max-w-md rounded-2xl p-6"
                            style={cardStyle}
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <h3 className="text-lg font-bold mb-1" style={{ color: palette.textPrimary }}>Reject Blog</h3>
                            <p className="text-sm mb-4" style={{ color: palette.textSecondary }}>
                                Rejecting: <span className="font-medium" style={{ color: palette.textPrimary }}>{modal.rejectTarget.title}</span>
                            </p>
                            <textarea
                                value={modal.rejectReason}
                                onChange={(e) => patchModal({ rejectReason: e.target.value })}
                                placeholder="Reason for rejection (visible to author)…"
                                rows={4}
                                className="resize-none mb-4"
                                style={inputStyle}
                            />
                            <div className="flex gap-3">
                                <button onClick={() => patchModal({ rejectTarget: null, rejectReason: "" })}
                                    className="flex-1 py-2 rounded-xl text-sm font-medium"
                                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>
                                    Cancel
                                </button>
                                <motion.button onClick={handleReject} whileTap={{ scale: 0.95 }}
                                    className="flex-1 py-2 rounded-xl text-sm font-semibold"
                                    style={{ background: "#ef4444", color: "#fff" }}>
                                    Reject
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
