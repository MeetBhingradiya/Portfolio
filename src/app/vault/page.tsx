/**
 * Vault — Dashboard / File List Page
 * Shows storage summary + filterable file grid.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    CloudUpload,
    Search,
    Delete,
    Share,
    PictureAsPdf,
    Image,
    VideoFile,
    Description,
    Slideshow,
    InsertDriveFile,
    Lock,
    LinkOutlined,
    Warning,
    CheckCircle,
    NavigateBefore,
    NavigateNext,
    Visibility,
    ContentCopy,
    Add
} from "@mui/icons-material";

const ACCENT = "#6366F1";

type FileType = "ALL" | "pdf" | "document" | "presentation" | "image" | "video" | "other";

const TYPE_OPTS: { value: FileType; label: string }[] = [
    { value: "ALL", label: "All Types" },
    { value: "pdf", label: "PDF" },
    { value: "document", label: "Document" },
    { value: "presentation", label: "Presentation" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "other", label: "Other" }
];

interface VaultDoc {
    _id: string;
    docId: string;
    filename: string;
    mimeType: string;
    size: number;
    type: string;
    isShared: boolean;
    activeShareCount?: number;
    expiredShareCount?: number;
    inactiveShareCount?: number;
    tags: string[];
    createdAt: string;
}

interface ShareLink {
    linkId: string;
    token: string;
    status: "active" | "revoked" | "deleted";
    expiresAt?: string;
    createdAt: string;
    lastUsedAt?: string;
    url: string;
    expired?: boolean;
}

interface StorageInfo {
    usedBytes: number;
    limitBytes: number;
    fileCount: number;
}

function FileIcon({ type, style }: { type: string; style?: React.CSSProperties }) {
    const props = { style: { fontSize: 24, ...style } };
    switch (type) {
        case "pdf":
            return <PictureAsPdf {...props} />;
        case "image":
            return <Image {...props} />;
        case "video":
            return <VideoFile {...props} />;
        case "document":
            return <Description {...props} />;
        case "presentation":
            return <Slideshow {...props} />;
        default:
            return <InsertDriveFile {...props} />;
    }
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function VaultPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [docs, setDocs] = useState<VaultDoc[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<FileType>("ALL");
    const [storage, setStorage] = useState<StorageInfo | null>(null);
    const [noAccess, setNoAccess] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [shareTarget, setShareTarget] = useState<VaultDoc | null>(null);
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
    const [shareExpiresAt, setShareExpiresAt] = useState("");
    const [shareLoading, setShareLoading] = useState(false);
    const [shareFilter, setShareFilter] = useState<"" | "active" | "revoked_deleted" | "expired">("");
    const [previewTarget, setPreviewTarget] = useState<any | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const card = {
        background: isApple ? (isDark ? "rgba(38, 38, 42, 0.7)" : "rgba(255,255,255,0.7)") : palette.surface,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
    };
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchStorage = useCallback(async () => {
        const r = await fetch("/api/vault/storage");
        if (r.status === 403) { setNoAccess(true); return; }
        const j = await r.json();
        if (j.usedBytes !== undefined) setStorage({ usedBytes: j.usedBytes, limitBytes: j.limitBytes, fileCount: j.fileCount });
    }, []);

    const fetchDocs = useCallback(async () => {
        setLoading(true);
        const sp = new URLSearchParams({ page: String(page) });
        if (typeFilter !== "ALL") sp.set("type", typeFilter);
        if (search) sp.set("search", search);
        if (shareFilter) sp.set("sharedFilter", shareFilter);
        const r = await fetch(`/api/vault/documents?${sp}`);
        if (r.status === 403) { setNoAccess(true); setLoading(false); return; }
        const j = await r.json();
        setDocs(j.docs ?? []);
        setTotal(j.total ?? 0);
        setPages(j.pages ?? 1);
        setLoading(false);
    }, [page, typeFilter, search, shareFilter]);

    useEffect(() => { fetchStorage(); }, [fetchStorage]);
    useEffect(() => { fetchDocs(); }, [fetchDocs]);

    async function handleDelete(docId: string) {
        const r = await fetch(`/api/vault/documents/${docId}`, { method: "DELETE" });
        if (r.ok) {
            showToast("File deleted");
            setDeleteTarget(null);
            fetchDocs();
            fetchStorage();
        } else {
            showToast("Failed to delete", false);
        }
    }

    async function performShareAction(docId: string, shareAction: any, okMessage?: string) {
        setShareLoading(true);
        const r = await fetch(`/api/vault/documents/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shareAction })
        });
        const j = await r.json();
        setShareLoading(false);
        if (r.ok) {
            if (okMessage) showToast(okMessage);
            setShareLinks(j.shareLinks || []);
            fetchDocs();
        } else {
            showToast(j.error || "Failed to update sharing", false);
        }
    }

    async function openShareManager(doc: VaultDoc) {
        setShareTarget(doc);
        setShareLoading(true);
        const r = await fetch(`/api/vault/documents/${doc.docId}`);
        const j = await r.json();
        setShareLoading(false);
        const links = (j?.doc?.shareLinks || []).map((link: any) => ({
            ...link,
            url: `${window.location.origin}/vault/share/${link.token}`,
            expired: !!(link.expiresAt && new Date(link.expiresAt) <= new Date())
        }));
        setShareLinks(links);
    }

    async function copyLink(link: ShareLink) {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(link.url);
            } else {
                const ta = document.createElement("textarea");
                ta.value = link.url;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            showToast("Share link copied");
        } catch {
            showToast("Failed to copy link", false);
        }
    }

    async function openPreview(docId: string) {
        const r = await fetch(`/api/vault/documents/${docId}`);
        const j = await r.json();
        if (!r.ok || !j?.doc) {
            showToast("Failed to load preview", false);
            return;
        }
        const firstAssetId = j.doc?.chunks?.[0]?.assetId;
        if (!firstAssetId) {
            showToast("Preview unavailable", false);
            return;
        }
        setPreviewTarget({
            filename: j.doc.filename,
            mimeType: j.doc.mimeType,
            previewUrl: `/api/cdn/${firstAssetId}`,
            isChunked: j.doc.isChunked
        });
    }

    if (noAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                    <div
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: `${ACCENT}18` }}>
                        <Lock style={{ fontSize: 40, color: ACCENT }} />
                    </div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: palette.textPrimary }}>
                        Vault Access Required
                    </h1>
                    <p
                        className="text-sm mb-4"
                        style={{ color: palette.textSecondary }}>
                        The Private Vault is a whitelisted feature. Contact an administrator to request access.
                    </p>
                </div>
            </div>
        );
    }

    const pct = storage ? Math.min(100, (storage.usedBytes / storage.limitBytes) * 100) : 0;
    const barColor = pct > 90 ? "#EF4444" : pct > 70 ? "#F59E0B" : ACCENT;
    const minShareDatetime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    return (
        <div
            className="min-h-screen py-8 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1
                            className="text-3xl font-bold"
                            style={{ color: palette.textPrimary }}>
                            Private Vault
                        </h1>
                        <p
                            className="text-sm mt-1"
                            style={{ color: palette.textSecondary }}>
                            {total} file{total !== 1 ? "s" : ""} · {storage ? formatBytes(storage.usedBytes) : "…"} used
                        </p>
                    </div>
                    <Link href="/vault/upload">
                        <motion.button
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                            style={{ background: ACCENT, color: "#fff" }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}>
                            <CloudUpload fontSize="small" />
                            Upload File
                        </motion.button>
                    </Link>
                </div>

                {/* Storage Summary Card */}
                {storage && (
                    <motion.div
                        className="p-5 rounded-2xl mb-6"
                        style={card}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-between mb-3">
                            <span
                                className="text-sm font-semibold"
                                style={{ color: palette.textPrimary }}>
                                Storage Usage
                            </span>
                            <span
                                className="text-xs"
                                style={{ color: palette.textSecondary }}>
                                {formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}
                            </span>
                        </div>
                        <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: barColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs" style={{ color: palette.textTertiary }}>
                            <span>{pct.toFixed(1)}% used</span>
                            <span>{formatBytes(storage.limitBytes - storage.usedBytes)} free</span>
                        </div>
                    </motion.div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
                        style={card}>
                        <Search
                            fontSize="small"
                            style={{ color: palette.textTertiary }}
                        />
                        <input
                            type="text"
                            placeholder="Search files…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="flex-1 bg-transparent text-sm outline-none"
                            style={{ color: palette.textPrimary }}
                        />
                    </div>
                    <div className="w-44">
                        <CustomSelect
                            value={typeFilter}
                            onChange={(v) => { setTypeFilter(v as FileType); setPage(1); }}
                            options={TYPE_OPTS}
                        />
                    </div>
                    <div className="w-56">
                        <CustomSelect
                            value={shareFilter || "all"}
                            onChange={(v) => {
                                const next = v === "all" ? "" : (v as "active" | "revoked_deleted" | "expired");
                                setShareFilter(next);
                                setPage(1);
                            }}
                            options={[
                                { value: "all", label: "All Share States" },
                                { value: "active", label: "Shared by me (active)" },
                                { value: "revoked_deleted", label: "Revoked / Deleted links" },
                                { value: "expired", label: "Expired links" }
                            ]}
                        />
                    </div>
                </div>

                {/* File Grid */}
                {loading ? (
                    <div className="text-center py-16" style={{ color: palette.textTertiary }}>
                        Loading…
                    </div>
                ) : docs.length === 0 ? (
                    <div className="text-center py-20">
                        <InsertDriveFile style={{ fontSize: 56, color: palette.textTertiary, marginBottom: 12 }} />
                        <p
                            className="text-lg font-semibold"
                            style={{ color: palette.textPrimary }}>
                            No files yet
                        </p>
                        <p
                            className="text-sm mt-1 mb-6"
                            style={{ color: palette.textSecondary }}>
                            Upload your first file to get started
                        </p>
                        <Link href="/vault/upload">
                            <motion.button
                                className="px-6 py-2.5 rounded-xl font-semibold text-sm"
                                style={{ background: ACCENT, color: "#fff" }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}>
                                Upload File
                            </motion.button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map((doc) => (
                            <motion.div
                                key={doc.docId}
                                className="p-4 rounded-2xl flex flex-col gap-3"
                                style={card}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -2 }}>
                                {/* Icon + name */}
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: `${ACCENT}18` }}>
                                        <FileIcon
                                            type={doc.type}
                                            style={{ color: ACCENT }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-sm font-semibold truncate"
                                            style={{ color: palette.textPrimary }}
                                            title={doc.filename}>
                                            {doc.filename}
                                        </p>
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: palette.textTertiary }}>
                                            {formatBytes(doc.size)} · {formatDate(doc.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Tags */}
                                {doc.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {doc.tags.slice(0, 4).map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 text-xs rounded-full"
                                                style={{ background: `${ACCENT}14`, color: ACCENT }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-auto pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                                    {(doc.activeShareCount ?? 0) > 0 && (
                                        <span
                                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}>
                                            <LinkOutlined style={{ fontSize: 12 }} />
                                            Shared ({doc.activeShareCount})
                                        </span>
                                    )}
                                    <div className="ml-auto flex gap-1">
                                        <motion.button
                                            className="p-1.5 rounded-lg"
                                            style={{ color: palette.textTertiary }}
                                            whileHover={{ scale: 1.1, color: ACCENT }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Preview file"
                                            onClick={() => openPreview(doc.docId)}>
                                            <Visibility fontSize="small" />
                                        </motion.button>
                                        <motion.button
                                            className="p-1.5 rounded-lg"
                                            style={{ color: palette.textTertiary }}
                                            whileHover={{ scale: 1.1, color: ACCENT }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Manage share links"
                                            onClick={() => openShareManager(doc)}>
                                            <Share fontSize="small" />
                                        </motion.button>
                                        <motion.button
                                            className="p-1.5 rounded-lg"
                                            style={{ color: palette.textTertiary }}
                                            whileHover={{ scale: 1.1, color: "#EF4444" }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Delete file"
                                            onClick={() => setDeleteTarget(doc.docId)}>
                                            <Delete fontSize="small" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <motion.button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-xl disabled:opacity-30"
                            style={card}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <NavigateBefore style={{ color: palette.textSecondary }} />
                        </motion.button>
                        <span
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            {page} / {pages}
                        </span>
                        <motion.button
                            onClick={() => setPage((p) => Math.min(pages, p + 1))}
                            disabled={page >= pages}
                            className="p-2 rounded-xl disabled:opacity-30"
                            style={card}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <NavigateNext style={{ color: palette.textSecondary }} />
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDeleteTarget(null)}>
                        <motion.div
                            className="p-6 rounded-2xl max-w-sm w-full"
                            style={{ ...card, border: "1.5px solid rgba(239,68,68,0.3)" }}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <Warning style={{ color: "#EF4444" }} />
                                <h3
                                    className="font-bold"
                                    style={{ color: palette.textPrimary }}>
                                    Delete File?
                                </h3>
                            </div>
                            <p
                                className="text-sm mb-5"
                                style={{ color: palette.textSecondary }}>
                                This action is permanent and cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <motion.button
                                    className="flex-1 py-2 rounded-xl text-sm font-semibold"
                                    style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleDelete(deleteTarget)}>
                                    Delete
                                </motion.button>
                                <motion.button
                                    className="flex-1 py-2 rounded-xl text-sm font-semibold"
                                    style={{ background: palette.surface, color: palette.textSecondary }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setDeleteTarget(null)}>
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share dialog */}
            <AnimatePresence>
                {shareTarget && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShareTarget(null)}>
                        <motion.div
                            className="p-6 rounded-2xl max-w-sm w-full"
                            style={card}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}>
                            <h3
                                className="font-bold mb-1"
                                style={{ color: palette.textPrimary }}>
                                Manage Share Links
                            </h3>
                            <p
                                className="text-sm mb-4"
                                style={{ color: palette.textSecondary }}>
                                Create, revoke, re-enable, and delete links for this file.
                            </p>

                            <div className="flex items-end gap-2 mb-3">
                                <div className="flex-1">
                                    <label htmlFor="share-expiry" className="text-xs block mb-1" style={{ color: palette.textTertiary }}>
                                        Expiry (optional)
                                    </label>
                                    <input
                                        id="share-expiry"
                                        type="datetime-local"
                                        value={shareExpiresAt}
                                        min={minShareDatetime}
                                        onChange={(e) => setShareExpiresAt(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: palette.textPrimary }}
                                    />
                                </div>
                                <motion.button
                                    className="px-3 py-2 rounded-xl text-sm font-semibold"
                                    style={{ background: `${ACCENT}18`, color: ACCENT }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={shareLoading}
                                    onClick={() =>
                                        performShareAction(
                                            shareTarget.docId,
                                            { type: "create", expiresAt: shareExpiresAt || undefined },
                                            "Share link created"
                                        )
                                    }>
                                    <span className="flex items-center gap-1"><Add fontSize="small" />Create</span>
                                </motion.button>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
                                {shareLoading && shareLinks.length === 0 ? (
                                    <div className="text-sm" style={{ color: palette.textTertiary }}>Loading links…</div>
                                ) : shareLinks.length === 0 ? (
                                    <div className="text-sm" style={{ color: palette.textTertiary }}>No share links yet</div>
                                ) : (
                                    shareLinks
                                        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                                        .map((link) => (
                                            <div key={link.linkId} className="p-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs" style={{ color: palette.textSecondary }}>
                                                        {link.status.toUpperCase()}
                                                        {link.expired ? " · EXPIRED" : ""}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <button className="text-xs px-2 py-1 rounded-lg" style={{ background: `${ACCENT}15`, color: ACCENT }} onClick={() => copyLink(link)}>
                                                            <span className="flex items-center gap-1"><ContentCopy style={{ fontSize: 12 }} />Copy</span>
                                                        </button>
                                                        {link.status === "active" ? (
                                                            <button className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }} onClick={() => performShareAction(shareTarget.docId, { type: "revoke", linkId: link.linkId }, "Share link revoked")}>
                                                                Revoke
                                                            </button>
                                                        ) : link.status === "revoked" ? (
                                                            <button className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }} onClick={() => performShareAction(shareTarget.docId, { type: "reenable", linkId: link.linkId }, "Share link re-enabled")}>
                                                                Re-enable
                                                            </button>
                                                        ) : null}
                                                        {link.status !== "deleted" && (
                                                            <button className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(107,114,128,0.2)", color: palette.textSecondary }} onClick={() => performShareAction(shareTarget.docId, { type: "delete", linkId: link.linkId }, "Share link deleted")}>
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-[11px] truncate mt-1" style={{ color: palette.textTertiary }}>
                                                    {link.url}
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                            <motion.button
                                className="w-full py-2 rounded-xl text-sm"
                                style={{ color: palette.textTertiary }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShareTarget(null)}>
                                Close
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview dialog */}
            <AnimatePresence>
                {previewTarget && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.7)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewTarget(null)}>
                        <motion.div
                            className="p-4 rounded-2xl w-full max-w-5xl"
                            style={card}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold" style={{ color: palette.textPrimary }}>{previewTarget.filename}</h3>
                                <button onClick={() => setPreviewTarget(null)} style={{ color: palette.textTertiary }}>Close</button>
                            </div>
                            {previewTarget.isChunked ? (
                                <div className="text-sm p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                                    Preview is only available for single-chunk files. Please download the file to view all content.
                                </div>
                            ) : previewTarget.mimeType?.startsWith("image/") ? (
                                <img src={previewTarget.previewUrl} alt={previewTarget.filename} className="w-full max-h-[75vh] object-contain rounded-xl" />
                            ) : previewTarget.mimeType?.startsWith("video/") ? (
                                <video src={previewTarget.previewUrl} controls className="w-full max-h-[75vh] rounded-xl bg-black" />
                            ) : previewTarget.mimeType === "application/pdf" ? (
                                <iframe
                                    src={previewTarget.previewUrl}
                                    className="w-full h-[75vh] rounded-xl"
                                    title={previewTarget.filename}
                                    sandbox="allow-same-origin"
                                />
                            ) : (
                                <a href={previewTarget.previewUrl} target="_blank" rel="noreferrer" className="underline text-sm" style={{ color: ACCENT }}>
                                    Open preview in new tab
                                </a>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold"
                        style={{ background: toast.ok ? "#16a34a" : "#EF4444", color: "#fff" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}>
                        {toast.ok ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
