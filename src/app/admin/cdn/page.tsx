/**
 * Admin — CDN Asset Manager
 * /admin/cdn
 *
 * Manage all files stored in the private GitHub CDN repository.
 * - Upload new assets (drag-and-drop or browse)
 * - Browse / search / filter by type and status
 * - Copy CDN URLs
 * - Run integrity checks
 * - Delete assets
 * - View warnings for missing files
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    CloudUpload,
    Delete,
    ContentCopy,
    Refresh,
    Search,
    Warning,
    CheckCircle,
    Error as ErrorIcon,
    FilterList,
    Image as ImageIcon,
    VideoFile,
    InsertDriveFile,
    Close,
    Add,
    Storage,
    Verified,
    ErrorOutline,
    FolderSpecial,
    Lock,
    Info,
    Fingerprint,
    BugReport
} from "@mui/icons-material";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AssetType = "icon" | "avatar" | "banner" | "background" | "video" | "document" | "other";
type AssetStatus = "active" | "missing" | "deleted";

interface CDNAsset {
    _id: string;
    assetId: string;
    filename: string;
    githubRepo: string;
    githubPath: string;
    sha?: string;
    mimeType: string;
    size: number;
    type: AssetType;
    tags: string[];
    altText?: string;
    context?: string;
    uploadedBy: string;
    status: AssetStatus;
    checksumMd5?: string;
    checksumSha256?: string;
    checksumVerified?: boolean;
    lastChecked?: string;
    lastCheckOk?: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface Summary {
    activeCount: number;
    missingCount: number;
    totalSize: number;
}

interface RepoInfo {
    name: string;
    fullName: string;
    sizeKb: number;
    private: boolean;
    assetCount: number;
    assetBytes: number;
}

interface CommitItem {
    sha: string;
    shortSha: string;
    message: string;
    authorName: string;
    authorDate: string;
    htmlUrl: string;
}

const TYPE_OPTIONS: { value: AssetType | ""; label: string }[] = [
    { value: "", label: "All Types" },
    { value: "icon", label: "Icon" },
    { value: "avatar", label: "Avatar" },
    { value: "banner", label: "Banner" },
    { value: "background", label: "Background" },
    { value: "video", label: "Video" },
    { value: "document", label: "Document" },
    { value: "other", label: "Other" }
];

const STATUS_OPTIONS: { value: AssetStatus | ""; label: string }[] = [
    { value: "", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "missing", label: "Missing" },
    { value: "deleted", label: "Deleted" }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function assetIcon(mime: string) {
    if (mime.startsWith("image/")) return <ImageIcon fontSize="small" />;
    if (mime.startsWith("video/")) return <VideoFile fontSize="small" />;
    return <InsertDriveFile fontSize="small" />;
}

function statusColor(status: AssetStatus, palette: any) {
    if (status === "active") return "#22c55e";
    if (status === "missing") return "#f59e0b";
    return palette.textTertiary;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CDNAdminPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    /* ── List state ── */
    const [list, setList] = useState({
        assets: [] as CDNAsset[],
        summary: { activeCount: 0, missingCount: 0, totalSize: 0 } as Summary,
        loading: false,
        error: "",
        success: "",
        page: 1,
        totalCount: 0
    });
    const patchList = useCallback((p: Partial<typeof list>) => setList((s) => ({ ...s, ...p })), []);

    /* ── Filters state ── */
    const [filters, setFilters] = useState({
        search: "",
        type: "" as AssetType | "",
        status: "" as AssetStatus | "",
        repo: ""
    });
    const patchFilters = useCallback((p: Partial<typeof filters>) => setFilters((s) => ({ ...s, ...p })), []);

    /* ── Upload state ── */
    const [upload, setUpload] = useState({
        open: false,
        dragOver: false,
        file: null as File | null,
        type: "other" as AssetType,
        tags: "",
        alt: "",
        loading: false
    });
    const patchUpload = useCallback((p: Partial<typeof upload>) => setUpload((s) => ({ ...s, ...p })), []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── Integrity check state ── */
    const [integrity, setIntegrity] = useState({
        checking: false,
        deep: false,
        result: null as null | {
            checked: number;
            nowMissing: number;
            restored: number;
            checksumMismatch?: number;
            mismatchIds?: string[];
            deep?: boolean;
            chunkCount?: number;
            hasMore?: boolean;
            checkedAt: string;
        }
    });
    const patchIntegrity = useCallback((p: Partial<typeof integrity>) => setIntegrity((s) => ({ ...s, ...p })), []);

    /* ── Repo info state ── */
    const [repoInfo, setRepoInfo] = useState({
        items: [] as RepoInfo[],
        loading: false
    });
    const patchRepoInfo = useCallback((p: Partial<typeof repoInfo>) => setRepoInfo((s) => ({ ...s, ...p })), []);

    /* ── Detail drawer ── */
    const [detailAsset, setDetailAsset] = useState<CDNAsset | null>(null);

    // Pagination derived
    const PAGE_SIZE = 20;
    const totalPages = Math.max(1, Math.ceil(list.totalCount / PAGE_SIZE));

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchAssets = useCallback(
        async (pageOverride?: number) => {
            patchList({ loading: true, error: "" });
            const activePage = pageOverride ?? list.page;
            try {
                const params = new URLSearchParams({
                    search: filters.search,
                    limit: String(PAGE_SIZE),
                    page: String(activePage)
                });
                if (filters.type) params.set("type", filters.type);
                if (filters.status) params.set("status", filters.status);
                if (filters.repo) params.set("repo", filters.repo);

                const res = await fetch(`/api/admin/cdn?${params}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to load");
                patchList({
                    assets: data.assets ?? [],
                    summary: data.summary ?? {
                        activeCount: 0,
                        missingCount: 0,
                        totalSize: 0
                    },
                    totalCount: data.pagination?.total ?? data.total ?? data.assets?.length ?? 0
                });
            } catch (e: any) {
                patchList({ error: e.message });
            } finally {
                patchList({ loading: false });
            }
        },
        [filters.search, filters.type, filters.status, filters.repo, list.page]
    ); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset to page 1 whenever filters change
    useEffect(() => {
        patchList({ page: 1 });
    }, [filters.search, filters.type, filters.status, filters.repo]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const fetchRepos = useCallback(async (force = false) => {
        patchRepoInfo({ loading: true });
        try {
            const res = await fetch(`/api/admin/cdn/repos${force ? "?refresh=1" : ""}`);
            const data = await res.json();
            if (res.ok) patchRepoInfo({ items: data.repos ?? [] });
        } catch {
        } finally {
            patchRepoInfo({ loading: false });
        }
    }, []);

    useEffect(() => {
        fetchRepos();
    }, [fetchRepos]);

    // ── Upload ───────────────────────────────────────────────────────────────
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        patchUpload({ dragOver: false });
        const f = e.dataTransfer.files[0];
        if (f) {
            patchUpload({ file: f, open: true });
        }
    };

    const handleUpload = async () => {
        if (!upload.file) return;
        patchUpload({ loading: true });
        patchList({ error: "" });
        try {
            const fd = new FormData();
            fd.append("file", upload.file);
            fd.append("type", upload.type);
            fd.append("tags", upload.tags);
            fd.append("altText", upload.alt);
            const res = await fetch("/api/cdn/upload", {
                method: "POST",
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            patchList({ success: `Uploaded! CDN URL: ${data.cdnUrl}` });
            patchUpload({ open: false, file: null, tags: "", alt: "" });
            fetchAssets();
        } catch (e: any) {
            patchList({ error: e.message });
        } finally {
            patchUpload({ loading: false });
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (asset: CDNAsset) => {
        if (!confirm(`Delete "${asset.filename}"? This removes it from GitHub and the CDN.`)) return;
        try {
            const res = await fetch(`/api/admin/cdn/${asset._id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            patchList({ success: "Asset deleted." });
            fetchAssets();
        } catch (e: any) {
            patchList({ error: e.message });
        }
    };

    // ── Integrity check ──────────────────────────────────────────────────────
    const runCheck = async (deep = false) => {
        patchIntegrity({ checking: true, deep });
        patchList({ error: "" });
        try {
            const totals = {
                checked: 0,
                nowMissing: 0,
                restored: 0,
                checksumMismatch: 0,
                chunkCount: 0,
                hasMore: false
            };

            let cursor = "";
            for (let i = 0; i < 250; i++) {
                const q = new URLSearchParams();
                if (deep) q.set("deep", "1");
                if (cursor) q.set("cursor", cursor);
                q.set("limit", deep ? "10" : "60");
                q.set("budgetMs", "8000");

                const res = await fetch(`/api/admin/cdn/check?${q.toString()}`, { method: "POST" });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                totals.checked += data.checked ?? 0;
                totals.nowMissing += data.nowMissing ?? 0;
                totals.restored += data.restored ?? 0;
                totals.checksumMismatch += data.checksumMismatch ?? 0;
                totals.chunkCount += 1;
                totals.hasMore = !!data.hasMore;

                if (!data.hasMore || !data.nextCursor) break;
                cursor = String(data.nextCursor);
            }

            patchIntegrity({
                result: {
                    checked: totals.checked,
                    nowMissing: totals.nowMissing,
                    restored: totals.restored,
                    checksumMismatch: deep ? totals.checksumMismatch : undefined,
                    deep,
                    chunkCount: totals.chunkCount,
                    hasMore: totals.hasMore,
                    checkedAt: new Date().toISOString()
                }
            });
            fetchAssets();
        } catch (e: any) {
            patchList({ error: e.message });
        } finally {
            patchIntegrity({ checking: false });
        }
    };

    // ── Auto-dismiss success ─────────────────────────────────────────────────
    useEffect(() => {
        if (list.success) {
            const t = setTimeout(() => patchList({ success: "" }), 5000);
            return () => clearTimeout(t);
        }
    }, [list.success]);

    // ── Styles ───────────────────────────────────────────────────────────────
    const cardBg = isApple
        ? isDark
            ? "rgba(30,30,35,0.7)"
            : "rgba(255,255,255,0.7)"
        : isDark
          ? "rgba(28,28,32,0.95)"
          : "rgba(255,255,255,0.95)";
    const cardBlur = isApple ? "blur(20px) saturate(160%)" : "none";
    const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const radius = isApple ? 16 : 20;
    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

    const card = {
        background: cardBg,
        backdropFilter: cardBlur,
        WebkitBackdropFilter: cardBlur,
        borderRadius: radius,
        border: `1px solid ${border}`,
        padding: 20
    };

    return (
        <div
            style={{
                color: palette.textPrimary,
                minHeight: "100vh",
                padding: 24
            }}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1
                        className="text-2xl font-black"
                        style={{ color: palette.textPrimary }}>
                        CDN Asset Manager
                    </h1>
                    <p
                        className="text-sm mt-0.5"
                        style={{ color: palette.textSecondary }}>
                        Private GitHub repository storage — unlimited capacity
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => runCheck(true)}
                        disabled={integrity.checking}
                        title="Download each file and verify MD5 checksum (slow)"
                        style={{
                            background: isDark ? "rgba(138,43,226,0.15)" : "rgba(138,43,226,0.08)",
                            border: `1px solid rgba(138,43,226,0.35)`,
                            borderRadius: radius - 4,
                            padding: "8px 16px",
                            color: "#9b59b6",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: integrity.checking ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}>
                        <Fingerprint
                            fontSize="small"
                            style={{
                                animation: integrity.checking ? "spin 1s linear infinite" : "none"
                            }}
                        />
                        {integrity.checking ? "Verifying…" : "Deep Check"}
                    </button>
                    <button
                        onClick={() => runCheck(false)}
                        disabled={integrity.checking}
                        style={{
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            border: `1px solid ${border}`,
                            borderRadius: radius - 4,
                            padding: "8px 16px",
                            color: palette.textPrimary,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: integrity.checking ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}>
                        <Refresh
                            fontSize="small"
                            style={{
                                animation: integrity.checking ? "spin 1s linear infinite" : "none"
                            }}
                        />
                        {integrity.checking ? "Checking..." : "Integrity Check"}
                    </button>
                    <button
                        onClick={() => patchUpload({ open: true })}
                        style={{
                            background: palette.accent,
                            border: "none",
                            borderRadius: radius - 4,
                            padding: "8px 18px",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}>
                        <Add fontSize="small" /> Upload Asset
                    </button>
                </div>
            </div>

            {/* ── Missing-file warning banner ──────────────────────────── */}
            <AnimatePresence>
                {list.summary.missingCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            background: "rgba(245,158,11,0.12)",
                            border: "1px solid rgba(245,158,11,0.4)",
                            borderRadius: radius - 4,
                            padding: "14px 18px",
                            marginBottom: 20,
                            display: "flex",
                            alignItems: "center",
                            gap: 12
                        }}>
                        <Warning style={{ color: "#f59e0b", flexShrink: 0 }} />
                        <div>
                            <p
                                className="font-black text-sm"
                                style={{ color: "#f59e0b" }}>
                                {list.summary.missingCount} asset
                                {list.summary.missingCount !== 1 ? "s" : ""} missing from GitHub storage
                            </p>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: palette.textSecondary }}>
                                These files have been removed from the repository. Re-upload them or delete the records to resolve.
                            </p>
                        </div>
                        <button
                            onClick={() => patchFilters({ status: "missing" })}
                            style={{
                                marginLeft: "auto",
                                background: "rgba(245,158,11,0.2)",
                                border: "1px solid rgba(245,158,11,0.4)",
                                borderRadius: 8,
                                padding: "5px 12px",
                                color: "#f59e0b",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                flexShrink: 0
                            }}>
                            Show Missing
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Stats row ────────────────────────────────────────────── */}
            <div
                className="grid grid-cols-3 gap-4 mb-6"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {[
                    {
                        label: "Active Assets",
                        value: list.summary.activeCount,
                        icon: <CheckCircle style={{ color: "#22c55e" }} />,
                        color: "#22c55e"
                    },
                    {
                        label: "Missing",
                        value: list.summary.missingCount,
                        icon: <ErrorOutline style={{ color: "#f59e0b" }} />,
                        color: "#f59e0b"
                    },
                    {
                        label: "Total Size",
                        value: formatBytes(list.summary.totalSize),
                        icon: <Storage style={{ color: palette.accent }} />,
                        color: palette.accent
                    }
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={card}>
                        <div className="flex items-center gap-2 mb-1">
                            {stat.icon}
                            <span
                                className="text-xs font-bold"
                                style={{ color: palette.textSecondary }}>
                                {stat.label}
                            </span>
                        </div>
                        <p
                            className="text-2xl font-black"
                            style={{ color: stat.color }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Check result toast ───────────────────────────────────── */}
            <AnimatePresence>
                {integrity.result && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            ...card,
                            marginBottom: 20,
                            background: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: 12
                        }}>
                        <Verified style={{ color: "#22c55e" }} />
                        <div className="flex-1">
                            <p
                                className="text-sm font-black"
                                style={{ color: "#22c55e" }}>
                                Integrity check complete - {integrity.result.checked} files checked
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: palette.textSecondary }}>
                                {integrity.result.nowMissing} new missing - {integrity.result.restored} restored
                                {integrity.result.checksumMismatch !== undefined && (
                                    <>
                                        {" "}
                                        -{" "}
                                        <span
                                            style={{
                                                color: integrity.result.checksumMismatch > 0 ? "#f59e0b" : "#22c55e",
                                                fontWeight: 800
                                            }}>
                                            {integrity.result.checksumMismatch} checksum mismatch
                                            {integrity.result.checksumMismatch !== 1 ? "es" : ""}
                                        </span>
                                    </>
                                )}
                                {" - "}
                                {integrity.result.chunkCount ? `${integrity.result.chunkCount} chunk(s)` : ""}
                                {" - "}
                                {new Date(integrity.result.checkedAt).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={() => patchIntegrity({ result: null })}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: palette.textTertiary
                            }}>
                            <Close fontSize="small" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error/success strip ──────────────────────────────────── */}
            {list.error && (
                <div
                    style={{
                        background: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 16,
                        color: "#ef4444",
                        fontSize: 13
                    }}>
                    {list.error}
                </div>
            )}
            {list.success && (
                <div
                    style={{
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 16,
                        color: "#22c55e",
                        fontSize: 13,
                        wordBreak: "break-all"
                    }}>
                    {list.success}
                </div>
            )}

            {/* ── Filters ──────────────────────────────────────────────── */}
            <div
                style={{
                    ...card,
                    marginBottom: 20,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center"
                }}>
                <div
                    style={{
                        flex: 1,
                        minWidth: 180,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: inputBg,
                        borderRadius: 10,
                        padding: "8px 12px",
                        border: `1px solid ${border}`
                    }}>
                    <Search
                        fontSize="small"
                        style={{ color: palette.textTertiary }}
                    />
                    <input
                        value={filters.search}
                        onChange={(e) => patchFilters({ search: e.target.value })}
                        placeholder="Search filename, tags…"
                        style={{
                            background: "none",
                            border: "none",
                            outline: "none",
                            color: palette.textPrimary,
                            fontSize: 13,
                            flex: 1
                        }}
                    />
                </div>
                <div style={{ minWidth: 160 }}>
                    <CustomSelect
                        value={filters.type}
                        onChange={(v) => patchFilters({ type: v as any })}
                        options={TYPE_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label
                        }))}
                        placeholder="All Types"
                    />
                </div>
                <div style={{ minWidth: 160 }}>
                    <CustomSelect
                        value={filters.status}
                        onChange={(v) => patchFilters({ status: v as any })}
                        options={STATUS_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label
                        }))}
                        placeholder="All Statuses"
                    />
                </div>
                <button
                    onClick={fetchAssets}
                    style={{
                        background: inputBg,
                        border: `1px solid ${border}`,
                        borderRadius: 10,
                        padding: "8px 12px",
                        color: palette.textPrimary,
                        cursor: "pointer"
                    }}>
                    <Refresh fontSize="small" />
                </button>
            </div>

            {/* ── Asset list ───────────────────────────────────────────── */}
            <div style={card}>
                {list.loading ? (
                    <p
                        style={{
                            color: palette.textSecondary,
                            textAlign: "center",
                            padding: 40
                        }}>
                        Loading assets…
                    </p>
                ) : list.assets.length === 0 ? (
                    <p
                        style={{
                            color: palette.textSecondary,
                            textAlign: "center",
                            padding: 40
                        }}>
                        No assets found.
                    </p>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1
                        }}>
                        {list.assets.map((asset) => (
                            <AssetRow
                                key={asset._id}
                                asset={asset}
                                palette={palette}
                                isDark={isDark}
                                isApple={isApple}
                                border={border}
                                radius={radius}
                                onDelete={handleDelete}
                                onViewDetail={setDetailAsset}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {totalPages > 1 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 16,
                        gap: 12,
                        flexWrap: "wrap"
                    }}>
                    <p style={{ color: palette.textSecondary, fontSize: 13 }}>
                        Showing{" "}
                        <strong style={{ color: palette.textPrimary }}>
                            {Math.min((list.page - 1) * PAGE_SIZE + 1, list.totalCount)}–{Math.min(list.page * PAGE_SIZE, list.totalCount)}
                        </strong>{" "}
                        of <strong style={{ color: palette.textPrimary }}>{list.totalCount}</strong> assets
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap"
                        }}>
                        {/* Prev */}
                        <button
                            disabled={list.page === 1 || list.loading}
                            onClick={() => patchList({ page: Math.max(1, list.page - 1) })}
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                borderRadius: radius - 8,
                                padding: "6px 14px",
                                color: list.page === 1 ? palette.textTertiary : palette.textPrimary,
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: list.page === 1 ? "not-allowed" : "pointer",
                                opacity: list.page === 1 ? 0.5 : 1
                            }}>
                            ← Prev
                        </button>

                        {/* Page buttons */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - list.page) <= 2)
                            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === "…" ? (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        style={{
                                            color: palette.textTertiary,
                                            fontSize: 13,
                                            padding: "0 4px"
                                        }}>
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => patchList({ page: item as number })}
                                        disabled={list.loading}
                                        style={{
                                            background: item === list.page ? palette.accent : inputBg,
                                            border: `1px solid ${item === list.page ? palette.accent : border}`,
                                            borderRadius: radius - 8,
                                            padding: "6px 12px",
                                            color: item === list.page ? "#fff" : palette.textPrimary,
                                            fontSize: 13,
                                            fontWeight: item === list.page ? 900 : 600,
                                            cursor: "pointer",
                                            minWidth: 36
                                        }}>
                                        {item}
                                    </button>
                                )
                            )}

                        {/* Next */}
                        <button
                            disabled={list.page === totalPages || list.loading}
                            onClick={() =>
                                patchList({
                                    page: Math.min(totalPages, list.page + 1)
                                })
                            }
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                borderRadius: radius - 8,
                                padding: "6px 14px",
                                color: list.page === totalPages ? palette.textTertiary : palette.textPrimary,
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: list.page === totalPages ? "not-allowed" : "pointer",
                                opacity: list.page === totalPages ? 0.5 : 1
                            }}>
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* ── Upload modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {upload.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            zIndex: 50,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 20
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                patchUpload({ open: false, file: null });
                            }
                        }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                ...card,
                                width: "100%",
                                maxWidth: 520,
                                padding: 28
                            }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-5">
                                <h2
                                    className="text-lg font-black"
                                    style={{ color: palette.textPrimary }}>
                                    Upload Asset
                                </h2>
                                <button
                                    onClick={() => {
                                        patchUpload({
                                            open: false,
                                            file: null
                                        });
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: palette.textTertiary
                                    }}>
                                    <Close />
                                </button>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    patchUpload({ dragOver: true });
                                }}
                                onDragLeave={() => patchUpload({ dragOver: false })}
                                onDrop={handleFileDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${upload.dragOver ? palette.accent : border}`,
                                    borderRadius: radius - 4,
                                    padding: 32,
                                    textAlign: "center",
                                    cursor: "pointer",
                                    background: upload.dragOver ? `${palette.accent}10` : inputBg,
                                    transition: "all 0.2s",
                                    marginBottom: 16
                                }}>
                                <CloudUpload
                                    style={{
                                        fontSize: 40,
                                        color: upload.dragOver ? palette.accent : palette.textTertiary,
                                        marginBottom: 8
                                    }}
                                />
                                {upload.file ? (
                                    <div>
                                        <p
                                            className="font-black text-sm"
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {upload.file.name}
                                        </p>
                                        <p
                                            className="text-xs mt-1"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            {formatBytes(upload.file.size)} · {upload.file.type || "unknown"}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p
                                            className="font-bold text-sm"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Drag & drop or click to browse
                                        </p>
                                        <p
                                            className="text-xs mt-1"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            Images, videos, documents, icons — max 49 MB
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    style={{ display: "none" }}
                                    onChange={(e) => e.target.files?.[0] && patchUpload({ file: e.target.files[0] })}
                                />
                            </div>

                            {/* Form fields */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12
                                }}>
                                <div>
                                    <label
                                        className="text-xs font-bold mb-1 block"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Asset Type
                                    </label>
                                    <CustomSelect
                                        value={upload.type}
                                        onChange={(v) =>
                                            patchUpload({
                                                type: v as AssetType
                                            })
                                        }
                                        options={TYPE_OPTIONS.filter((o) => o.value).map((o) => ({
                                            value: o.value,
                                            label: o.label
                                        }))}
                                        placeholder="Select type"
                                    />
                                </div>
                                <div>
                                    <label
                                        className="text-xs font-bold mb-1 block"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        value={upload.tags}
                                        onChange={(e) =>
                                            patchUpload({
                                                tags: e.target.value
                                            })
                                        }
                                        placeholder="e.g. hero, homepage, dark"
                                        style={{
                                            width: "100%",
                                            background: inputBg,
                                            border: `1px solid ${border}`,
                                            borderRadius: 10,
                                            padding: "9px 12px",
                                            color: palette.textPrimary,
                                            fontSize: 13,
                                            outline: "none"
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="text-xs font-bold mb-1 block"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Alt Text / Description
                                    </label>
                                    <input
                                        value={upload.alt}
                                        onChange={(e) => patchUpload({ alt: e.target.value })}
                                        placeholder="Short description for accessibility"
                                        style={{
                                            width: "100%",
                                            background: inputBg,
                                            border: `1px solid ${border}`,
                                            borderRadius: 10,
                                            padding: "9px 12px",
                                            color: palette.textPrimary,
                                            fontSize: 13,
                                            outline: "none"
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={upload.loading || !upload.file}
                                style={{
                                    marginTop: 20,
                                    width: "100%",
                                    background: upload.loading || !upload.file ? palette.textTertiary : palette.accent,
                                    border: "none",
                                    borderRadius: radius - 4,
                                    padding: "12px 0",
                                    color: "#fff",
                                    fontSize: 14,
                                    fontWeight: 900,
                                    cursor: upload.loading || !upload.file ? "not-allowed" : "pointer"
                                }}>
                                {upload.loading ? "Uploading to GitHub…" : "Upload Asset"}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Detail drawer ─────────────────────────────────────── */}
            <AnimatePresence>
                {detailAsset && (
                    <DetailDrawer
                        asset={detailAsset}
                        palette={palette}
                        isDark={isDark}
                        isApple={isApple}
                        border={border}
                        radius={radius}
                        onClose={() => setDetailAsset(null)}
                        onRefresh={fetchAssets}
                    />
                )}
            </AnimatePresence>

            {/* Spin keyframe */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Asset Row
// ---------------------------------------------------------------------------

function DetailDrawer({
    asset,
    palette,
    isDark,
    isApple,
    border,
    radius,
    onClose,
    onRefresh
}: {
    asset: CDNAsset;
    palette: any;
    isDark: boolean;
    isApple: boolean;
    border: string;
    radius: number;
    onClose: () => void;
    onRefresh: () => void;
}) {
    const cardBg = isApple
        ? isDark
            ? "rgba(30,30,35,0.97)"
            : "rgba(255,255,255,0.97)"
        : isDark
          ? "rgba(18,18,24,0.98)"
          : "rgba(255,255,255,0.98)";

    const cdnUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/cdn/${asset.assetId}`;
    const [history, setHistory] = useState<CommitItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [restoreSha, setRestoreSha] = useState("");
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [restoreMessage, setRestoreMessage] = useState("");

    const copyField = (text: string) => navigator.clipboard.writeText(text);

    const loadHistory = async () => {
        setHistoryLoading(true);
        setHistoryError("");
        setRestoreMessage("");
        try {
            const res = await fetch(`/api/admin/cdn/${asset._id}/history`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load commit history");
            setHistory(Array.isArray(data.commits) ? data.commits : []);
        } catch (err: any) {
            setHistoryError(err?.message || "Failed to load commit history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const restoreFromCommit = async () => {
        if (!restoreSha.trim()) {
            setHistoryError("Please enter a commit SHA.");
            return;
        }
        setRestoreLoading(true);
        setHistoryError("");
        setRestoreMessage("");
        try {
            const res = await fetch(`/api/admin/cdn/${asset._id}/restore`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commitSha: restoreSha.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Restore failed");
            setRestoreMessage("Asset restored successfully.");
            onRefresh();
        } catch (err: any) {
            setHistoryError(err?.message || "Restore failed");
        } finally {
            setRestoreLoading(false);
        }
    };

    const Row = ({
        label,
        value,
        mono = false,
        copiable = false
    }: {
        label: string;
        value?: string;
        mono?: boolean;
        copiable?: boolean;
    }) => {
        const [copied, setCopied] = useState(false);
        if (!value) return null;
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "9px 0",
                    borderBottom: `1px solid ${border}`
                }}>
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: palette.textTertiary,
                        minWidth: 120,
                        flexShrink: 0,
                        textTransform: "uppercase",
                        letterSpacing: 0.5
                    }}>
                    {label}
                </span>
                <span
                    style={{
                        fontSize: 12,
                        color: palette.textPrimary,
                        fontFamily: mono ? "monospace" : "inherit",
                        wordBreak: "break-all",
                        flex: 1,
                        textAlign: "right"
                    }}>
                    {value}
                </span>
                {copiable && (
                    <button
                        onClick={() => {
                            copyField(value);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: copied ? "#22c55e" : palette.textTertiary,
                            flexShrink: 0,
                            padding: 0
                        }}>
                        {copied ? <CheckCircle style={{ fontSize: 14 }} /> : <ContentCopy style={{ fontSize: 14 }} />}
                    </button>
                )}
            </div>
        );
    };

    const statusCol = statusColor(asset.status, palette);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                zIndex: 60,
                display: "flex",
                justifyContent: "flex-end"
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}>
            <motion.div
                initial={{ x: 420 }}
                animate={{ x: 0 }}
                exit={{ x: 420 }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                style={{
                    width: 420,
                    maxWidth: "100vw",
                    height: "100%",
                    background: cardBg,
                    borderLeft: `1px solid ${border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto"
                }}
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}

                {/* Header */}
                <div
                    style={{
                        padding: "20px 20px 14px",
                        borderBottom: `1px solid ${border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                            className="text-sm font-black truncate"
                            style={{ color: palette.textPrimary }}>
                            {asset.filename}
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: palette.textSecondary }}>
                            {asset.type} · {asset.mimeType}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: palette.textTertiary
                        }}>
                        <Close />
                    </button>
                </div>

                {/* Preview */}
                {asset.status !== "deleted" && asset.mimeType.startsWith("image/") && (
                    <div
                        style={{
                            padding: "16px 20px",
                            borderBottom: `1px solid ${border}`
                        }}>
                        <img
                            src={`/api/cdn/${asset.assetId}`}
                            alt={asset.altText || asset.filename}
                            style={{
                                width: "100%",
                                maxHeight: 220,
                                objectFit: "contain",
                                borderRadius: 10,
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                            }}
                        />
                    </div>
                )}

                {/* Status + Checksum verified pill */}
                <div
                    style={{
                        padding: "14px 20px",
                        borderBottom: `1px solid ${border}`,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap"
                    }}>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 800,
                            background: `${statusCol}20`,
                            color: statusCol,
                            borderRadius: 6,
                            padding: "3px 10px"
                        }}>
                        {asset.status.toUpperCase()}
                    </span>
                    {asset.checksumVerified === true && (
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 800,
                                background: "rgba(34,197,94,0.15)",
                                color: "#22c55e",
                                borderRadius: 6,
                                padding: "3px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                            }}>
                            <Verified style={{ fontSize: 12 }} /> Checksum OK
                        </span>
                    )}
                    {asset.checksumVerified === false && (
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 800,
                                background: "rgba(239,68,68,0.15)",
                                color: "#ef4444",
                                borderRadius: 6,
                                padding: "3px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                            }}>
                            <BugReport style={{ fontSize: 12 }} /> Checksum Mismatch
                        </span>
                    )}
                </div>

                {/* Compliance recovery */}
                <div
                    style={{
                        padding: "14px 20px",
                        borderBottom: `1px solid ${border}`
                    }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8
                        }}>
                        <Lock style={{ fontSize: 14, color: palette.textSecondary }} />
                        <p
                            className="text-xs font-black"
                            style={{ color: palette.textSecondary }}>
                            Compliance Recovery (Commit-based)
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 8
                        }}>
                        <button
                            onClick={loadHistory}
                            disabled={historyLoading}
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                border: `1px solid ${border}`,
                                borderRadius: 8,
                                padding: "7px 10px",
                                color: palette.textPrimary,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: historyLoading ? "not-allowed" : "pointer"
                            }}>
                            {historyLoading ? "Loading..." : "Load History"}
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            value={restoreSha}
                            onChange={(e) => setRestoreSha(e.target.value)}
                            placeholder="Enter commit SHA"
                            style={{
                                flex: 1,
                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                border: `1px solid ${border}`,
                                borderRadius: 8,
                                padding: "8px 10px",
                                color: palette.textPrimary,
                                fontFamily: "monospace",
                                fontSize: 12,
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={restoreFromCommit}
                            disabled={restoreLoading}
                            style={{
                                background: palette.accent,
                                border: "none",
                                borderRadius: 8,
                                padding: "8px 12px",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: restoreLoading ? "not-allowed" : "pointer"
                            }}>
                            {restoreLoading ? "Restoring..." : "Restore"}
                        </button>
                    </div>

                    {history.length > 0 && (
                        <div
                            style={{
                                marginTop: 10,
                                maxHeight: 180,
                                overflowY: "auto",
                                border: `1px solid ${border}`,
                                borderRadius: 8
                            }}>
                            {history.slice(0, 15).map((commit, idx) => (
                                <button
                                    key={`${commit.sha}-${idx}`}
                                    onClick={() => setRestoreSha(commit.sha)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        border: "none",
                                        background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                                        padding: "8px 10px",
                                        cursor: "pointer"
                                    }}>
                                    <div style={{ fontSize: 11, color: palette.textPrimary, fontFamily: "monospace", fontWeight: 700 }}>
                                        {commit.shortSha} - {new Date(commit.authorDate).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: 11, color: palette.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {commit.message}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {historyError && (
                        <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
                            {historyError}
                        </p>
                    )}
                    {restoreMessage && (
                        <p className="text-xs mt-2" style={{ color: "#22c55e" }}>
                            {restoreMessage}
                        </p>
                    )}
                </div>

                {/* Metadata rows */}
                <div style={{ padding: "0 20px", flex: 1 }}>
                    <Row
                        label="Asset ID"
                        value={asset.assetId}
                        mono
                        copiable
                    />
                    <Row
                        label="CDN URL"
                        value={`/api/cdn/${asset.assetId}`}
                        mono
                        copiable
                    />
                    <Row
                        label="GitHub Repo"
                        value={asset.githubRepo}
                        mono
                        copiable
                    />
                    <Row
                        label="GitHub Path"
                        value={asset.githubPath}
                        mono
                        copiable
                    />
                    {asset.sha && (
                        <Row
                            label="GitHub SHA"
                            value={asset.sha}
                            mono
                            copiable
                        />
                    )}
                    <Row
                        label="Context"
                        value={asset.context}
                        copiable
                    />
                    <Row
                        label="Alt Text"
                        value={asset.altText}
                    />
                    <Row
                        label="Size"
                        value={`${(asset.size / 1024).toFixed(1)} KB (${asset.size.toLocaleString()} bytes)`}
                    />
                    <Row
                        label="Tags"
                        value={asset.tags.join(", ")}
                    />
                    <Row
                        label="MD5"
                        value={asset.checksumMd5}
                        mono
                        copiable
                    />
                    <Row
                        label="SHA-256"
                        value={asset.checksumSha256}
                        mono
                        copiable
                    />
                    <Row
                        label="Uploaded By"
                        value={asset.uploadedBy}
                    />
                    <Row
                        label="Created"
                        value={asset.createdAt ? new Date(asset.createdAt).toLocaleString() : undefined}
                    />
                    {asset.lastChecked && (
                        <Row
                            label="Last Checked"
                            value={new Date(asset.lastChecked).toLocaleString()}
                        />
                    )}
                    {asset.lastCheckOk !== undefined && (
                        <Row
                            label="Last Check"
                            value={asset.lastCheckOk ? "✓ OK" : "✗ Failed"}
                        />
                    )}
                </div>

                {/* Copy full URL footer */}
                <div style={{ padding: 20, borderTop: `1px solid ${border}` }}>
                    <button
                        onClick={() => navigator.clipboard.writeText(cdnUrl)}
                        style={{
                            width: "100%",
                            background: palette.accent,
                            border: "none",
                            borderRadius: radius - 4,
                            padding: "11px 0",
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8
                        }}>
                        <ContentCopy fontSize="small" /> Copy Full CDN URL
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function AssetRow({
    asset,
    palette,
    isDark,
    isApple,
    border,
    radius,
    onDelete,
    onViewDetail
}: {
    asset: CDNAsset;
    palette: any;
    isDark: boolean;
    isApple: boolean;
    border: string;
    radius: number;
    onDelete: (a: CDNAsset) => void;
    onViewDetail: (a: CDNAsset) => void;
}) {
    const [copied, setCopied] = useState(false);

    const cdnUrl = `/api/cdn/${asset.assetId}`;

    const copy = () => {
        navigator.clipboard.writeText(window.location.origin + cdnUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusCol = statusColor(asset.status, palette);
    const rowBg = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: radius - 6,
                background: asset.status === "missing" ? "rgba(245,158,11,0.06)" : rowBg,
                border: `1px solid ${asset.status === "missing" ? "rgba(245,158,11,0.2)" : "transparent"}`,
                transition: "background 0.15s"
            }}>
            {/* Icon / Preview */}
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: palette.textTertiary,
                    overflow: "hidden",
                    position: "relative"
                }}>
                {asset.mimeType.startsWith("image/") ? (
                    <img
                        src={cdnUrl}
                        alt={asset.altText || asset.filename}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 10
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                ) : (
                    assetIcon(asset.mimeType)
                )}
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    className="text-sm font-bold truncate"
                    style={{ color: palette.textPrimary }}>
                    {asset.filename}
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginTop: 2
                    }}>
                    <span style={{ fontSize: 11, color: palette.textTertiary }}>{formatBytes(asset.size)}</span>
                    <span style={{ fontSize: 11, color: palette.textTertiary }}>·</span>
                    <span style={{ fontSize: 11, color: palette.textTertiary }}>{asset.type}</span>
                    {asset.tags.map((t) => (
                        <span
                            key={t}
                            style={{
                                fontSize: 10,
                                background: `${palette.accent}20`,
                                color: palette.accent,
                                borderRadius: 4,
                                padding: "1px 6px",
                                fontWeight: 700
                            }}>
                            {t}
                        </span>
                    ))}
                </div>
                <p
                    className="text-xs truncate mt-0.5"
                    style={{
                        color: palette.textTertiary,
                        fontFamily: "monospace"
                    }}>
                    <span
                        style={{
                            fontSize: 10,
                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                            borderRadius: 4,
                            padding: "1px 6px",
                            marginRight: 4,
                            fontWeight: 700,
                            color: palette.textSecondary
                        }}>
                        {asset.githubRepo}
                    </span>
                    {asset.githubPath}
                </p>
            </div>

            {/* Status badge */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: `${statusCol}18`,
                    borderRadius: 6,
                    padding: "3px 8px",
                    flexShrink: 0
                }}>
                {asset.status === "active" ? (
                    <CheckCircle style={{ fontSize: 12, color: statusCol }} />
                ) : asset.status === "missing" ? (
                    <Warning style={{ fontSize: 12, color: statusCol }} />
                ) : (
                    <ErrorIcon style={{ fontSize: 12, color: statusCol }} />
                )}
                <span style={{ fontSize: 11, fontWeight: 800, color: statusCol }}>{asset.status}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                    onClick={() => onViewDetail(asset)}
                    title="View details"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${border}`,
                        borderRadius: 8,
                        padding: "6px 9px",
                        cursor: "pointer",
                        color: palette.textSecondary
                    }}>
                    <Info fontSize="small" />
                </button>
                <button
                    onClick={copy}
                    title="Copy CDN URL"
                    style={{
                        background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${border}`,
                        borderRadius: 8,
                        padding: "6px 9px",
                        cursor: "pointer",
                        color: copied ? "#22c55e" : palette.textSecondary
                    }}>
                    {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                </button>
                <button
                    onClick={() => onDelete(asset)}
                    title="Delete asset"
                    style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 8,
                        padding: "6px 9px",
                        cursor: "pointer",
                        color: "#ef4444"
                    }}>
                    <Delete fontSize="small" />
                </button>
            </div>
        </div>
    );
}
