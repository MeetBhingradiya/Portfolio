/**
 * Admin — CDN API Keys Manager
 * /admin/cdn/api-keys
 *
 * Issue, revoke, suspend, or update API keys for approved applications.
 * Supports issuing a key directly from a URL param: ?issue=<applicationId>
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    VpnKey,
    Block,
    CheckCircle,
    Cancel,
    Add,
    Refresh,
    Close,
    ContentCopy,
    Warning,
    Search,
    OpenInNew,
    AccessTime,
    Speed
} from "@mui/icons-material";

// ── Types ─────────────────────────────────────────────────────────────────────

type KeyStatus = "active" | "revoked" | "suspended" | "expired";
type Plan = "free" | "basic" | "pro" | "enterprise";

interface RateLimit {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    maxFileSizeBytes: number;
    allowUpload: boolean;
    allowDownload: boolean;
    allowedMimeTypes: string[];
}

interface CDNAPIKey {
    _id: string;
    keyId: string;
    keyPrefix: string;
    applicationId: string;
    appName: string;
    applicantEmail: string;
    plan: Plan;
    rateLimit: RateLimit;
    status: KeyStatus;
    expiresAt?: string;
    revokedAt?: string;
    revokedBy?: string;
    revokeReason?: string;
    issuedBy: string;
    notes?: string;
    totalRequests: number;
    totalUploads: number;
    totalDownloads: number;
    lastUsedAt?: string;
    createdAt: string;
}

interface CDNApplication {
    _id: string;
    appName: string;
    applicantEmail: string;
    requestedPlan: Plan;
    status: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<KeyStatus, { label: string; color: string; icon: React.ReactNode }> = {
    active: {
        label: "Active",
        color: "#22c55e",
        icon: <CheckCircle fontSize="small" />
    },
    revoked: {
        label: "Revoked",
        color: "#ef4444",
        icon: <Cancel fontSize="small" />
    },
    suspended: {
        label: "Suspended",
        color: "#8b5cf6",
        icon: <Block fontSize="small" />
    },
    expired: {
        label: "Expired",
        color: "#6b7280",
        icon: <AccessTime fontSize="small" />
    }
};

const PLAN_COLOR: Record<Plan, string> = {
    free: "#6b7280",
    basic: "#3b82f6",
    pro: "#8b5cf6",
    enterprise: "#f59e0b"
};

const PLAN_DEFAULTS: Record<Plan, RateLimit> = {
    free: {
        requestsPerMinute: 10,
        requestsPerHour: 200,
        requestsPerDay: 1000,
        maxFileSizeBytes: 5242880,
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    },
    basic: {
        requestsPerMinute: 30,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        maxFileSizeBytes: 20971520,
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    },
    pro: {
        requestsPerMinute: 120,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        maxFileSizeBytes: 51380224,
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    },
    enterprise: {
        requestsPerMinute: 600,
        requestsPerHour: 20000,
        requestsPerDay: 200000,
        maxFileSizeBytes: 51380224,
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    }
};

function fmtBytes(b: number) {
    if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1048576).toFixed(0)} MB`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCDNAPIKeysPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const searchParams = useSearchParams();

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;
    const blur = isApple ? "blur(20px) saturate(160%)" : "none";

    // ── State ─────────────────────────────────────────────────────────────
    // ── State ─────────────────────────────────────────────────────────────
    const [list, setList] = useState<{
        keys: CDNAPIKey[];
        total: number;
        loading: boolean;
        error: string;
        success: string;
        search: string;
        filterStatus: KeyStatus | "";
        page: number;
    }>({
        keys: [],
        total: 0,
        loading: false,
        error: "",
        success: "",
        search: "",
        filterStatus: "",
        page: 1
    });
    const patchList = useCallback((p: Partial<typeof list>) => setList((s) => ({ ...s, ...p })), []);

    const PAGE_SIZE = 25;
    const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));

    // Detail panel
    const [detail, setDetail] = useState<{
        selected: CDNAPIKey | null;
        actionLoading: boolean;
        revokeReason: string;
    }>({ selected: null, actionLoading: false, revokeReason: "" });
    const patchDetail = useCallback((p: Partial<typeof detail>) => setDetail((s) => ({ ...s, ...p })), []);

    // Issue key modal
    const [issue, setIssue] = useState<{
        showIssue: boolean;
        issuedKey: string | null;
        copied: boolean;
        loading: boolean;
        error: string;
        appQuery: string;
        foundApp: CDNApplication | null;
        appLookupError: string;
        notes: string;
        expiry: string;
        rl: RateLimit;
    }>({
        showIssue: false,
        issuedKey: null,
        copied: false,
        loading: false,
        error: "",
        appQuery: searchParams.get("issue") || "",
        foundApp: null,
        appLookupError: "",
        notes: "",
        expiry: "",
        rl: PLAN_DEFAULTS.free
    });
    const patchIssue = useCallback((p: Partial<typeof issue>) => setIssue((s) => ({ ...s, ...p })), []);

    // Pre-fill from ?issue= query param
    useEffect(() => {
        const id = searchParams.get("issue");
        if (id) {
            patchIssue({ showIssue: true });
            loadApp(id);
        }
    }, []);

    // ── Fetch keys ────────────────────────────────────────────────────────
    const fetchKeys = useCallback(
        async (pg = 1) => {
            patchList({ loading: true, error: "" });
            try {
                const params = new URLSearchParams({
                    page: String(pg),
                    limit: String(PAGE_SIZE),
                    search: list.search
                });
                if (list.filterStatus) params.set("status", list.filterStatus);
                const res = await fetch(`/api/admin/cdn/api-keys?${params}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed");
                patchList({ keys: json.keys, total: json.pagination.total });
            } catch (e: any) {
                patchList({ error: e.message });
            } finally {
                patchList({ loading: false });
            }
        },
        [list.search, list.filterStatus]
    );

    useEffect(() => {
        fetchKeys(list.page);
    }, [fetchKeys, list.page]);

    const showMsg = (msg: string) => {
        patchList({ success: msg });
        setTimeout(() => patchList({ success: "" }), 4000);
    };

    // ── Load application by ID (for issue form) ───────────────────────────
    const loadApp = async (id: string) => {
        patchIssue({ appLookupError: "", foundApp: null });
        if (!id.trim()) return;
        try {
            const res = await fetch(`/api/admin/cdn/applications/${id.trim()}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Application not found.");
            const app = json.application as CDNApplication;
            if (app.status !== "approved") {
                patchIssue({
                    appLookupError: `Application status is "${app.status}". Only approved applications can receive a key.`
                });
                return;
            }
            patchIssue({
                foundApp: app,
                rl: PLAN_DEFAULTS[app.requestedPlan] || PLAN_DEFAULTS.free
            });
        } catch (e: any) {
            patchIssue({ appLookupError: e.message });
        }
    };

    // ── Issue key ─────────────────────────────────────────────────────────
    const handleIssue = async () => {
        if (!issue.foundApp) return;
        patchIssue({ loading: true, error: "" });
        try {
            const res = await fetch("/api/admin/cdn/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: issue.foundApp._id,
                    notes: issue.notes || undefined,
                    expiresAt: issue.expiry || undefined,
                    rateLimitOverride: issue.rl
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            patchIssue({ issuedKey: json.key });
            fetchKeys(1);
        } catch (e: any) {
            patchIssue({ error: e.message });
        } finally {
            patchIssue({ loading: false });
        }
    };

    // ── Key actions ───────────────────────────────────────────────────────
    const doAction = async (keyId: string, action: "revoke" | "suspend" | "reinstate", reason?: string) => {
        patchDetail({ actionLoading: true });
        try {
            const res = await fetch(`/api/admin/cdn/api-keys/${keyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    revokeReason: reason || undefined
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            showMsg(`Key ${action}d.`);
            patchDetail({ selected: null });
            fetchKeys(list.page);
        } catch (e: any) {
            patchList({ error: e.message });
        } finally {
            patchDetail({ actionLoading: false });
        }
    };

    const copyKey = async (k: string) => {
        await navigator.clipboard.writeText(k);
        patchIssue({ copied: true });
        setTimeout(() => patchIssue({ copied: false }), 2000);
    };

    // ── Input style ───────────────────────────────────────────────────────
    const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
        padding: "10px 14px",
        borderRadius: isApple ? 10 : 12,
        border,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary,
        fontSize: 14,
        outline: "none",
        fontFamily: "inherit",
        ...extra
    });

    return (
        <div
            className="p-6 md:p-8 space-y-6"
            style={{ color: palette.textPrimary }}>
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1
                        className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`}
                        style={{ color: palette.textPrimary }}>
                        CDN API Keys
                    </h1>
                    <p
                        className="text-sm mt-1"
                        style={{ color: palette.textSecondary }}>
                        Issue and manage external application API keys
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchKeys(list.page)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                            color: palette.textPrimary,
                            border: "none",
                            cursor: "pointer"
                        }}>
                        <Refresh fontSize="small" />
                    </button>
                    <button
                        onClick={() =>
                            patchIssue({
                                showIssue: true,
                                issuedKey: null,
                                foundApp: null,
                                appQuery: "",
                                error: ""
                            })
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{
                            background: palette.accent,
                            color: "#fff",
                            border: "none",
                            cursor: "pointer"
                        }}>
                        <Add fontSize="small" /> Issue New Key
                    </button>
                </div>
            </div>

            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
                <div
                    className="flex-1 min-w-52 flex items-center gap-2 px-4 rounded-xl"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        border,
                        borderRadius: isApple ? 12 : 14
                    }}>
                    <Search
                        fontSize="small"
                        style={{ color: palette.textTertiary }}
                    />
                    <input
                        value={list.search}
                        onChange={(e) => patchList({ search: e.target.value, page: 1 })}
                        placeholder="Search app name, email, key prefix…"
                        style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            outline: "none",
                            color: palette.textPrimary,
                            fontSize: 14,
                            padding: "10px 0",
                            fontFamily: "inherit"
                        }}
                    />
                </div>
                <div style={{ minWidth: 160 }}>
                    <CustomSelect
                        value={list.filterStatus}
                        onChange={(v) =>
                            patchList({
                                filterStatus: v as KeyStatus | "",
                                page: 1
                            })
                        }
                        options={[
                            { value: "", label: "All Statuses" },
                            { value: "active", label: "Active" },
                            { value: "revoked", label: "Revoked" },
                            { value: "suspended", label: "Suspended" },
                            { value: "expired", label: "Expired" }
                        ]}
                    />
                </div>
            </div>

            {/* ── Toast ────────────────────────────────────────────────── */}
            <AnimatePresence>
                {(list.error || list.success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-4 py-3 rounded-xl text-sm flex items-center justify-between"
                        style={{
                            background: list.error ? "#ef444420" : "#22c55e20",
                            color: list.error ? "#ef4444" : "#22c55e",
                            border: `1px solid ${list.error ? "#ef444440" : "#22c55e40"}`
                        }}>
                        {list.error || list.success}
                        <button
                            onClick={() => patchList({ error: "", success: "" })}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "inherit"
                            }}>
                            <Close fontSize="small" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Table ────────────────────────────────────────────────── */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: cardBg,
                    backdropFilter: blur,
                    WebkitBackdropFilter: blur,
                    border
                }}>
                {list.loading ? (
                    <div
                        className="p-12 text-center"
                        style={{ color: palette.textSecondary }}>
                        Loading…
                    </div>
                ) : list.keys.length === 0 ? (
                    <div
                        className="p-12 text-center"
                        style={{ color: palette.textSecondary }}>
                        No API keys found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table
                            className="w-full text-sm"
                            style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: border }}>
                                    {["App / Email", "Key prefix", "Plan", "Status", "Usage", "Last used", ""].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-left text-xs font-semibold"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {list.keys.map((key, i) => {
                                    const cfg = STATUS_CFG[key.status];
                                    return (
                                        <motion.tr
                                            key={key._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            style={{
                                                borderBottom: i < list.keys.length - 1 ? border : "none",
                                                cursor: "pointer"
                                            }}
                                            onClick={() =>
                                                patchDetail({
                                                    selected: key,
                                                    revokeReason: ""
                                                })
                                            }
                                            className="hover:opacity-80 transition-opacity">
                                            <td className="px-5 py-3.5">
                                                <div
                                                    className="font-semibold"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {key.appName}
                                                </div>
                                                <div
                                                    className="text-xs"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    {key.applicantEmail}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <code
                                                    className="px-2 py-0.5 rounded text-xs"
                                                    style={{
                                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                                                        color: palette.textPrimary
                                                    }}>
                                                    {key.keyPrefix}…
                                                </code>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                    style={{
                                                        background: `${PLAN_COLOR[key.plan]}18`,
                                                        color: PLAN_COLOR[key.plan]
                                                    }}>
                                                    {key.plan}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className="flex items-center gap-1 text-xs font-semibold w-fit px-2.5 py-1 rounded-full"
                                                    style={{
                                                        background: `${cfg.color}18`,
                                                        color: cfg.color
                                                    }}>
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                            </td>
                                            <td
                                                className="px-5 py-3.5 text-xs"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {key.totalRequests.toLocaleString()} req
                                            </td>
                                            <td
                                                className="px-5 py-3.5 text-xs"
                                                style={{
                                                    color: palette.textTertiary
                                                }}>
                                                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <OpenInNew
                                                    fontSize="small"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}
                                                />
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .slice(Math.max(0, list.page - 3), list.page + 2)
                        .map((p) => (
                            <button
                                key={p}
                                onClick={() => patchList({ page: p })}
                                className="w-9 h-9 rounded-xl text-sm font-semibold"
                                style={{
                                    background: p === list.page ? palette.accent : `${palette.accent}12`,
                                    color: p === list.page ? "#fff" : palette.accent,
                                    border: "none",
                                    cursor: "pointer"
                                }}>
                                {p}
                            </button>
                        ))}
                </div>
            )}

            {/* ── Key detail drawer ─────────────────────────────────────── */}
            <AnimatePresence>
                {detail.selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            style={{
                                background: "rgba(0,0,0,0.5)",
                                backdropFilter: "blur(4px)"
                            }}
                            onClick={() => patchDetail({ selected: null })}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                                type: "spring",
                                damping: 26,
                                stiffness: 260
                            }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 overflow-y-auto"
                            style={{
                                background: isDark ? "rgba(18,18,22,0.98)" : "#fff",
                                backdropFilter: "blur(24px)",
                                borderLeft: border,
                                padding: 28
                            }}>
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2
                                        className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`}
                                        style={{ color: palette.textPrimary }}>
                                        {detail.selected.appName}
                                    </h2>
                                    <p
                                        className="text-sm"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        {detail.selected.applicantEmail}
                                    </p>
                                </div>
                                <button
                                    onClick={() => patchDetail({ selected: null })}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: palette.textTertiary
                                    }}>
                                    <Close />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-6 flex-wrap">
                                {(() => {
                                    const cfg = STATUS_CFG[detail.selected.status];
                                    return (
                                        <span
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
                                            style={{
                                                background: `${cfg.color}18`,
                                                color: cfg.color
                                            }}>
                                            {cfg.icon} {cfg.label}
                                        </span>
                                    );
                                })()}
                                <span
                                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                                    style={{
                                        background: `${PLAN_COLOR[detail.selected.plan]}18`,
                                        color: PLAN_COLOR[detail.selected.plan]
                                    }}>
                                    {detail.selected.plan}
                                </span>
                                <code
                                    className="px-2.5 py-1 rounded-lg text-xs"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                                        color: palette.textSecondary
                                    }}>
                                    {detail.selected.keyPrefix}…
                                </code>
                            </div>

                            {/* Rate limit cards */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[
                                    {
                                        label: "/ min",
                                        val: detail.selected.rateLimit.requestsPerMinute
                                    },
                                    {
                                        label: "/ hour",
                                        val: detail.selected.rateLimit.requestsPerHour
                                    },
                                    {
                                        label: "/ day",
                                        val: detail.selected.rateLimit.requestsPerDay
                                    }
                                ].map((r) => (
                                    <div
                                        key={r.label}
                                        className="p-3 rounded-xl text-center"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                            border
                                        }}>
                                        <div
                                            className="text-xs"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {r.label}
                                        </div>
                                        <div
                                            className="font-bold mt-0.5"
                                            style={{ color: palette.accent }}>
                                            {r.val.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Usage */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[
                                    {
                                        label: "Requests",
                                        val: detail.selected.totalRequests
                                    },
                                    {
                                        label: "Uploads",
                                        val: detail.selected.totalUploads
                                    },
                                    {
                                        label: "Downloads",
                                        val: detail.selected.totalDownloads
                                    }
                                ].map((r) => (
                                    <div
                                        key={r.label}
                                        className="p-3 rounded-xl text-center"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                            border
                                        }}>
                                        <div
                                            className="text-xs"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {r.label}
                                        </div>
                                        <div
                                            className="font-bold mt-0.5"
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {r.val.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Meta */}
                            {[
                                { label: "Key ID", val: detail.selected.keyId },
                                {
                                    label: "Issued by",
                                    val: detail.selected.issuedBy
                                },
                                {
                                    label: "Max file",
                                    val: fmtBytes(detail.selected.rateLimit.maxFileSizeBytes)
                                },
                                {
                                    label: "Upload",
                                    val: detail.selected.rateLimit.allowUpload ? "Allowed" : "Blocked"
                                },
                                {
                                    label: "Expires",
                                    val: detail.selected.expiresAt ? new Date(detail.selected.expiresAt).toLocaleDateString() : "Never"
                                },
                                { label: "Notes", val: detail.selected.notes },
                                {
                                    label: "Last used",
                                    val: detail.selected.lastUsedAt ? new Date(detail.selected.lastUsedAt).toLocaleString() : "—"
                                }
                            ]
                                .filter((r) => r.val)
                                .map((r) => (
                                    <div
                                        key={r.label}
                                        className="flex items-center justify-between py-2 border-b text-sm"
                                        style={{
                                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                                        }}>
                                        <span
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            {r.label}
                                        </span>
                                        <span
                                            style={{
                                                color: palette.textPrimary,
                                                textAlign: "right",
                                                wordBreak: "break-all",
                                                maxWidth: "60%"
                                            }}>
                                            {r.val}
                                        </span>
                                    </div>
                                ))}

                            {/* Revoke reason input */}
                            {detail.selected.status === "active" && (
                                <div className="mt-5">
                                    <label
                                        className="text-xs font-semibold mb-1 block"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Revoke reason (optional)
                                    </label>
                                    <input
                                        value={detail.revokeReason}
                                        onChange={(e) =>
                                            patchDetail({
                                                revokeReason: e.target.value
                                            })
                                        }
                                        placeholder="Reason for revocation"
                                        style={{ ...inp(), width: "100%" }}
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-6 flex flex-col gap-2">
                                {detail.selected.status === "active" && (
                                    <>
                                        <button
                                            disabled={detail.actionLoading}
                                            onClick={() => doAction(detail.selected!.keyId, "suspend")}
                                            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                            style={{
                                                background: "#8b5cf620",
                                                color: "#8b5cf6",
                                                border: "1px solid #8b5cf640",
                                                cursor: "pointer"
                                            }}>
                                            <Block fontSize="small" /> Suspend Key
                                        </button>
                                        <button
                                            disabled={detail.actionLoading}
                                            onClick={() => doAction(detail.selected!.keyId, "revoke", detail.revokeReason)}
                                            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                            style={{
                                                background: "#ef444420",
                                                color: "#ef4444",
                                                border: "1px solid #ef444440",
                                                cursor: "pointer"
                                            }}>
                                            <Cancel fontSize="small" /> Revoke Key (Permanent)
                                        </button>
                                    </>
                                )}
                                {detail.selected.status === "suspended" && (
                                    <button
                                        disabled={detail.actionLoading}
                                        onClick={() => doAction(detail.selected!.keyId, "reinstate")}
                                        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                        style={{
                                            background: "#22c55e20",
                                            color: "#22c55e",
                                            border: "1px solid #22c55e40",
                                            cursor: "pointer"
                                        }}>
                                        <CheckCircle fontSize="small" /> Reinstate Key
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Issue Key modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {issue.showIssue && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            style={{
                                background: "rgba(0,0,0,0.6)",
                                backdropFilter: "blur(6px)"
                            }}
                            onClick={() => {
                                if (!issue.issuedKey) patchIssue({ showIssue: false });
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            style={{
                                background: isDark ? "rgba(20,20,24,0.98)" : "#fff",
                                backdropFilter: "blur(24px)",
                                borderRadius: 24,
                                border,
                                padding: 28
                            }}>
                            <div className="flex items-center justify-between mb-6">
                                <h2
                                    className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`}
                                    style={{ color: palette.textPrimary }}>
                                    Issue API Key
                                </h2>
                                {!issue.issuedKey && (
                                    <button
                                        onClick={() => patchIssue({ showIssue: false })}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: palette.textTertiary
                                        }}>
                                        <Close />
                                    </button>
                                )}
                            </div>

                            {/* Issued key display */}
                            {issue.issuedKey ? (
                                <div className="space-y-4">
                                    <div
                                        className="flex items-center gap-2 p-4 rounded-xl"
                                        style={{
                                            background: "#22c55e18",
                                            border: "1px solid #22c55e40"
                                        }}>
                                        <CheckCircle style={{ color: "#22c55e" }} />
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: "#22c55e" }}>
                                            API key issued successfully!
                                        </span>
                                    </div>
                                    <div
                                        className="p-4 rounded-xl"
                                        style={{
                                            background: "#f59e0b12",
                                            border: "1px solid #f59e0b40"
                                        }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Warning
                                                fontSize="small"
                                                style={{ color: "#f59e0b" }}
                                            />
                                            <span
                                                className="text-sm font-bold"
                                                style={{ color: "#f59e0b" }}>
                                                Copy this key now — it will never be shown again.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <code
                                                className="flex-1 text-sm break-all p-3 rounded-xl"
                                                style={{
                                                    background: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.06)",
                                                    color: palette.textPrimary,
                                                    fontFamily: "monospace"
                                                }}>
                                                {issue.issuedKey}
                                            </code>
                                            <button
                                                onClick={() => copyKey(issue.issuedKey!)}
                                                className="p-2 rounded-xl flex-shrink-0"
                                                style={{
                                                    background: issue.copied ? "#22c55e18" : `${palette.accent}18`,
                                                    color: issue.copied ? "#22c55e" : palette.accent,
                                                    border: "none",
                                                    cursor: "pointer"
                                                }}>
                                                {issue.copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            patchIssue({
                                                showIssue: false,
                                                issuedKey: null
                                            })
                                        }
                                        className="w-full py-3 rounded-xl font-bold"
                                        style={{
                                            background: palette.accent,
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer"
                                        }}>
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Application lookup */}
                                    <div>
                                        <label
                                            className="text-xs font-semibold mb-1 block"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Application ID *
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                value={issue.appQuery}
                                                onChange={(e) =>
                                                    patchIssue({
                                                        appQuery: e.target.value
                                                    })
                                                }
                                                placeholder="Paste the application MongoDB _id"
                                                style={{ ...inp(), flex: 1 }}
                                            />
                                            <button
                                                onClick={() => loadApp(issue.appQuery)}
                                                className="px-4 rounded-xl text-sm font-semibold"
                                                style={{
                                                    background: `${palette.accent}18`,
                                                    color: palette.accent,
                                                    border: "none",
                                                    cursor: "pointer",
                                                    flexShrink: 0
                                                }}>
                                                Lookup
                                            </button>
                                        </div>
                                        {issue.appLookupError && (
                                            <p
                                                className="text-xs mt-1"
                                                style={{ color: "#ef4444" }}>
                                                {issue.appLookupError}
                                            </p>
                                        )}
                                    </div>

                                    {/* App info */}
                                    {issue.foundApp && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl"
                                            style={{
                                                background: "#22c55e10",
                                                border: "1px solid #22c55e30"
                                            }}>
                                            <div
                                                className="font-semibold text-sm"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {issue.foundApp.appName}
                                            </div>
                                            <div
                                                className="text-xs mt-0.5"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {issue.foundApp.applicantEmail} · Plan requested:{" "}
                                                <strong>{issue.foundApp.requestedPlan}</strong>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Rate limits */}
                                    {issue.foundApp && (
                                        <>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    {
                                                        label: "req / min",
                                                        key: "requestsPerMinute" as const
                                                    },
                                                    {
                                                        label: "req / hour",
                                                        key: "requestsPerHour" as const
                                                    },
                                                    {
                                                        label: "req / day",
                                                        key: "requestsPerDay" as const
                                                    }
                                                ].map((f) => (
                                                    <div key={f.key}>
                                                        <label
                                                            className="text-xs font-semibold mb-1 block"
                                                            style={{
                                                                color: palette.textSecondary
                                                            }}>
                                                            {f.label}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={issue.rl[f.key]}
                                                            onChange={(e) =>
                                                                patchIssue({
                                                                    rl: {
                                                                        ...issue.rl,
                                                                        [f.key]: Number(e.target.value)
                                                                    }
                                                                })
                                                            }
                                                            style={{
                                                                ...inp(),
                                                                width: "100%"
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label
                                                        className="text-xs font-semibold mb-1 block"
                                                        style={{
                                                            color: palette.textSecondary
                                                        }}>
                                                        Max file (bytes)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={issue.rl.maxFileSizeBytes}
                                                        onChange={(e) =>
                                                            patchIssue({
                                                                rl: {
                                                                    ...issue.rl,
                                                                    maxFileSizeBytes: Number(e.target.value)
                                                                }
                                                            })
                                                        }
                                                        style={{
                                                            ...inp(),
                                                            width: "100%"
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className="text-xs font-semibold mb-1 block"
                                                        style={{
                                                            color: palette.textSecondary
                                                        }}>
                                                        Expires (optional)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={issue.expiry}
                                                        onChange={(e) =>
                                                            patchIssue({
                                                                expiry: e.target.value
                                                            })
                                                        }
                                                        style={{
                                                            ...inp(),
                                                            width: "100%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label
                                                    className="text-xs font-semibold mb-1 block"
                                                    style={{
                                                        color: palette.textSecondary
                                                    }}>
                                                    Admin Notes
                                                </label>
                                                <input
                                                    value={issue.notes}
                                                    onChange={(e) =>
                                                        patchIssue({
                                                            notes: e.target.value
                                                        })
                                                    }
                                                    placeholder="Internal note (optional)"
                                                    style={{
                                                        ...inp(),
                                                        width: "100%"
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {issue.error && (
                                        <p
                                            className="text-sm px-4 py-2 rounded-xl"
                                            style={{
                                                background: "#ef444420",
                                                color: "#ef4444"
                                            }}>
                                            {issue.error}
                                        </p>
                                    )}

                                    <button
                                        disabled={!issue.foundApp || issue.loading}
                                        onClick={handleIssue}
                                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                        style={{
                                            background: palette.accent,
                                            color: "#fff",
                                            border: "none",
                                            cursor: issue.foundApp ? "pointer" : "not-allowed",
                                            opacity: issue.foundApp ? 1 : 0.5
                                        }}>
                                        <VpnKey fontSize="small" /> {issue.loading ? "Issuing…" : "Issue API Key"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
