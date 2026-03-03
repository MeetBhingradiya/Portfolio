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
    Speed,
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
    active:    { label: "Active",    color: "#22c55e", icon: <CheckCircle fontSize="small" /> },
    revoked:   { label: "Revoked",   color: "#ef4444", icon: <Cancel fontSize="small" /> },
    suspended: { label: "Suspended", color: "#8b5cf6", icon: <Block fontSize="small" /> },
    expired:   { label: "Expired",   color: "#6b7280", icon: <AccessTime fontSize="small" /> },
};

const PLAN_COLOR: Record<Plan, string> = {
    free: "#6b7280", basic: "#3b82f6", pro: "#8b5cf6", enterprise: "#f59e0b",
};

const PLAN_DEFAULTS: Record<Plan, RateLimit> = {
    free:       { requestsPerMinute: 10,  requestsPerHour: 200,   requestsPerDay: 1000,   maxFileSizeBytes: 5242880,   allowUpload: true, allowDownload: true, allowedMimeTypes: [] },
    basic:      { requestsPerMinute: 30,  requestsPerHour: 1000,  requestsPerDay: 10000,  maxFileSizeBytes: 20971520,  allowUpload: true, allowDownload: true, allowedMimeTypes: [] },
    pro:        { requestsPerMinute: 120, requestsPerHour: 5000,  requestsPerDay: 50000,  maxFileSizeBytes: 51380224,  allowUpload: true, allowDownload: true, allowedMimeTypes: [] },
    enterprise: { requestsPerMinute: 600, requestsPerHour: 20000, requestsPerDay: 200000, maxFileSizeBytes: 51380224,  allowUpload: true, allowDownload: true, allowedMimeTypes: [] },
};

function fmtBytes(b: number) {
    if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1048576).toFixed(0)} MB`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCDNAPIKeysPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const searchParams = useSearchParams();

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border  = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br      = isApple ? 16 : 20;
    const blur    = isApple ? "blur(20px) saturate(160%)" : "none";

    // ── State ─────────────────────────────────────────────────────────────
    const [keys, setKeys]       = useState<CDNAPIKey[]>([]);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch]               = useState("");
    const [filterStatus, setFilterStatus]   = useState<KeyStatus | "">("");
    const [page, setPage]                   = useState(1);
    const PAGE_SIZE = 25;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Detail panel
    const [selected, setSelected] = useState<CDNAPIKey | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [revokeReason, setRevokeReason] = useState("");

    // Issue key modal
    const [showIssue, setShowIssue]     = useState(false);
    const [issuedKey, setIssuedKey]     = useState<string | null>(null);  // plaintext — show once
    const [copied, setCopied]           = useState(false);
    const [issueLoading, setIssueLoading] = useState(false);
    const [issueError, setIssueError]   = useState("");

    // Application lookup for issue modal
    const [appQuery, setAppQuery]           = useState(searchParams.get("issue") || "");
    const [foundApp, setFoundApp]           = useState<CDNApplication | null>(null);
    const [appLookupError, setAppLookupError] = useState("");
    const [issueNotes, setIssueNotes]       = useState("");
    const [issueExpiry, setIssueExpiry]     = useState("");
    const [rl, setRl]                       = useState<RateLimit>(PLAN_DEFAULTS.free);

    // Pre-fill from ?issue= query param
    useEffect(() => {
        const id = searchParams.get("issue");
        if (id) { setShowIssue(true); loadApp(id); }
    }, []);

    // ── Fetch keys ────────────────────────────────────────────────────────
    const fetchKeys = useCallback(async (pg = 1) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE), search });
            if (filterStatus) params.set("status", filterStatus);
            const res = await fetch(`/api/admin/cdn/api-keys?${params}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            setKeys(json.keys);
            setTotal(json.pagination.total);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }, [search, filterStatus]);

    useEffect(() => { fetchKeys(page); }, [fetchKeys, page]);

    const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); };

    // ── Load application by ID (for issue form) ───────────────────────────
    const loadApp = async (id: string) => {
        setAppLookupError("");
        setFoundApp(null);
        if (!id.trim()) return;
        try {
            const res = await fetch(`/api/admin/cdn/applications/${id.trim()}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Application not found.");
            const app = json.application as CDNApplication;
            if (app.status !== "approved") {
                setAppLookupError(`Application status is "${app.status}". Only approved applications can receive a key.`);
                return;
            }
            setFoundApp(app);
            setRl(PLAN_DEFAULTS[app.requestedPlan] || PLAN_DEFAULTS.free);
        } catch (e: any) { setAppLookupError(e.message); }
    };

    // ── Issue key ─────────────────────────────────────────────────────────
    const handleIssue = async () => {
        if (!foundApp) return;
        setIssueLoading(true);
        setIssueError("");
        try {
            const res = await fetch("/api/admin/cdn/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: foundApp._id,
                    notes: issueNotes || undefined,
                    expiresAt: issueExpiry || undefined,
                    rateLimitOverride: rl,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            setIssuedKey(json.key);
            fetchKeys(1);
        } catch (e: any) { setIssueError(e.message); }
        finally { setIssueLoading(false); }
    };

    // ── Key actions ───────────────────────────────────────────────────────
    const doAction = async (keyId: string, action: "revoke" | "suspend" | "reinstate", reason?: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/cdn/api-keys/${keyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, revokeReason: reason || undefined }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            showMsg(`Key ${action}d.`);
            setSelected(null);
            fetchKeys(page);
        } catch (e: any) { setError(e.message); }
        finally { setActionLoading(false); }
    };

    const copyKey = async (k: string) => { await navigator.clipboard.writeText(k); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    // ── Input style ───────────────────────────────────────────────────────
    const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
        padding: "10px 14px", borderRadius: isApple ? 10 : 12, border,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary, fontSize: 14, outline: "none", fontFamily: "inherit",
        ...extra,
    });

    return (
        <div className="p-6 md:p-8 space-y-6" style={{ color: palette.textPrimary }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>CDN API Keys</h1>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>Issue and manage external application API keys</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchKeys(page)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textPrimary, border: "none", cursor: "pointer" }}>
                        <Refresh fontSize="small" />
                    </button>
                    <button onClick={() => { setShowIssue(true); setIssuedKey(null); setFoundApp(null); setAppQuery(""); setIssueError(""); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: palette.accent, color: "#fff", border: "none", cursor: "pointer" }}>
                        <Add fontSize="small" /> Issue New Key
                    </button>
                </div>
            </div>

            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-52 flex items-center gap-2 px-4 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border, borderRadius: isApple ? 12 : 14 }}>
                    <Search fontSize="small" style={{ color: palette.textTertiary }} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search app name, email, key prefix…"
                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: palette.textPrimary, fontSize: 14, padding: "10px 0", fontFamily: "inherit" }} />
                </div>
                <div style={{ minWidth: 160 }}>
                    <CustomSelect
                        value={filterStatus}
                        onChange={v => { setFilterStatus(v as KeyStatus | ""); setPage(1); }}
                        options={[{ value: "", label: "All Statuses" }, { value: "active", label: "Active" }, { value: "revoked", label: "Revoked" }, { value: "suspended", label: "Suspended" }, { value: "expired", label: "Expired" }]}
                    />
                </div>
            </div>

            {/* ── Toast ────────────────────────────────────────────────── */}
            <AnimatePresence>
                {(error || success) && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="px-4 py-3 rounded-xl text-sm flex items-center justify-between"
                        style={{ background: error ? "#ef444420" : "#22c55e20", color: error ? "#ef4444" : "#22c55e", border: `1px solid ${error ? "#ef444440" : "#22c55e40"}` }}>
                        {error || success}
                        <button onClick={() => { setError(""); setSuccess(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><Close fontSize="small" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Table ────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, backdropFilter: blur, WebkitBackdropFilter: blur, border }}>
                {loading ? (
                    <div className="p-12 text-center" style={{ color: palette.textSecondary }}>Loading…</div>
                ) : keys.length === 0 ? (
                    <div className="p-12 text-center" style={{ color: palette.textSecondary }}>No API keys found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: border }}>
                                    {["App / Email", "Key prefix", "Plan", "Status", "Usage", "Last used", ""].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: palette.textSecondary }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {keys.map((key, i) => {
                                    const cfg = STATUS_CFG[key.status];
                                    return (
                                        <motion.tr key={key._id}
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                            style={{ borderBottom: i < keys.length - 1 ? border : "none", cursor: "pointer" }}
                                            onClick={() => { setSelected(key); setRevokeReason(""); }}
                                            className="hover:opacity-80 transition-opacity"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="font-semibold" style={{ color: palette.textPrimary }}>{key.appName}</div>
                                                <div className="text-xs" style={{ color: palette.textTertiary }}>{key.applicantEmail}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <code className="px-2 py-0.5 rounded text-xs" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: palette.textPrimary }}>{key.keyPrefix}…</code>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${PLAN_COLOR[key.plan]}18`, color: PLAN_COLOR[key.plan] }}>{key.plan}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-1 text-xs font-semibold w-fit px-2.5 py-1 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: palette.textSecondary }}>
                                                {key.totalRequests.toLocaleString()} req
                                            </td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: palette.textTertiary }}>
                                                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <OpenInNew fontSize="small" style={{ color: palette.textTertiary }} />
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            className="w-9 h-9 rounded-xl text-sm font-semibold"
                            style={{ background: p === page ? palette.accent : `${palette.accent}12`, color: p === page ? "#fff" : palette.accent, border: "none", cursor: "pointer" }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Key detail drawer ─────────────────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                            onClick={() => setSelected(null)} />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 260 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 overflow-y-auto"
                            style={{ background: isDark ? "rgba(18,18,22,0.98)" : "#fff", backdropFilter: "blur(24px)", borderLeft: border, padding: 28 }}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`} style={{ color: palette.textPrimary }}>{selected.appName}</h2>
                                    <p className="text-sm" style={{ color: palette.textSecondary }}>{selected.applicantEmail}</p>
                                </div>
                                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: palette.textTertiary }}><Close /></button>
                            </div>

                            <div className="flex items-center gap-2 mb-6 flex-wrap">
                                {(() => { const cfg = STATUS_CFG[selected.status]; return (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                                        {cfg.icon} {cfg.label}
                                    </span>
                                ); })()}
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: `${PLAN_COLOR[selected.plan]}18`, color: PLAN_COLOR[selected.plan] }}>{selected.plan}</span>
                                <code className="px-2.5 py-1 rounded-lg text-xs" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>{selected.keyPrefix}…</code>
                            </div>

                            {/* Rate limit cards */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[
                                    { label: "/ min",  val: selected.rateLimit.requestsPerMinute },
                                    { label: "/ hour", val: selected.rateLimit.requestsPerHour },
                                    { label: "/ day",  val: selected.rateLimit.requestsPerDay },
                                ].map(r => (
                                    <div key={r.label} className="p-3 rounded-xl text-center" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border }}>
                                        <div className="text-xs" style={{ color: palette.textTertiary }}>{r.label}</div>
                                        <div className="font-bold mt-0.5" style={{ color: palette.accent }}>{r.val.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Usage */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[
                                    { label: "Requests", val: selected.totalRequests },
                                    { label: "Uploads",  val: selected.totalUploads },
                                    { label: "Downloads",val: selected.totalDownloads },
                                ].map(r => (
                                    <div key={r.label} className="p-3 rounded-xl text-center" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border }}>
                                        <div className="text-xs" style={{ color: palette.textTertiary }}>{r.label}</div>
                                        <div className="font-bold mt-0.5" style={{ color: palette.textPrimary }}>{r.val.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Meta */}
                            {[
                                { label: "Key ID",     val: selected.keyId },
                                { label: "Issued by",  val: selected.issuedBy },
                                { label: "Max file",   val: fmtBytes(selected.rateLimit.maxFileSizeBytes) },
                                { label: "Upload",     val: selected.rateLimit.allowUpload ? "Allowed" : "Blocked" },
                                { label: "Expires",    val: selected.expiresAt ? new Date(selected.expiresAt).toLocaleDateString() : "Never" },
                                { label: "Notes",      val: selected.notes },
                                { label: "Last used",  val: selected.lastUsedAt ? new Date(selected.lastUsedAt).toLocaleString() : "—" },
                            ].filter(r => r.val).map(r => (
                                <div key={r.label} className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                                    <span style={{ color: palette.textSecondary }}>{r.label}</span>
                                    <span style={{ color: palette.textPrimary, textAlign: "right", wordBreak: "break-all", maxWidth: "60%" }}>{r.val}</span>
                                </div>
                            ))}

                            {/* Revoke reason input */}
                            {selected.status === "active" && (
                                <div className="mt-5">
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>Revoke reason (optional)</label>
                                    <input value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
                                        placeholder="Reason for revocation"
                                        style={{ ...inp(), width: "100%" }} />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-6 flex flex-col gap-2">
                                {selected.status === "active" && (
                                    <>
                                        <button disabled={actionLoading} onClick={() => doAction(selected.keyId, "suspend")}
                                            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                            style={{ background: "#8b5cf620", color: "#8b5cf6", border: "1px solid #8b5cf640", cursor: "pointer" }}>
                                            <Block fontSize="small" /> Suspend Key
                                        </button>
                                        <button disabled={actionLoading} onClick={() => doAction(selected.keyId, "revoke", revokeReason)}
                                            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                            style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", cursor: "pointer" }}>
                                            <Cancel fontSize="small" /> Revoke Key (Permanent)
                                        </button>
                                    </>
                                )}
                                {selected.status === "suspended" && (
                                    <button disabled={actionLoading} onClick={() => doAction(selected.keyId, "reinstate")}
                                        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                        style={{ background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40", cursor: "pointer" }}>
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
                {showIssue && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
                            onClick={() => { if (!issuedKey) setShowIssue(false); }} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            style={{ background: isDark ? "rgba(20,20,24,0.98)" : "#fff", backdropFilter: "blur(24px)", borderRadius: 24, border, padding: 28 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`} style={{ color: palette.textPrimary }}>Issue API Key</h2>
                                {!issuedKey && (
                                    <button onClick={() => setShowIssue(false)} style={{ background: "none", border: "none", cursor: "pointer", color: palette.textTertiary }}><Close /></button>
                                )}
                            </div>

                            {/* Issued key display */}
                            {issuedKey ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: "#22c55e18", border: "1px solid #22c55e40" }}>
                                        <CheckCircle style={{ color: "#22c55e" }} />
                                        <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>API key issued successfully!</span>
                                    </div>
                                    <div className="p-4 rounded-xl" style={{ background: "#f59e0b12", border: "1px solid #f59e0b40" }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Warning fontSize="small" style={{ color: "#f59e0b" }} />
                                            <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>Copy this key now — it will never be shown again.</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <code className="flex-1 text-sm break-all p-3 rounded-xl" style={{ background: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.06)", color: palette.textPrimary, fontFamily: "monospace" }}>
                                                {issuedKey}
                                            </code>
                                            <button onClick={() => copyKey(issuedKey)}
                                                className="p-2 rounded-xl flex-shrink-0"
                                                style={{ background: copied ? "#22c55e18" : `${palette.accent}18`, color: copied ? "#22c55e" : palette.accent, border: "none", cursor: "pointer" }}>
                                                {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowIssue(false); setIssuedKey(null); }}
                                        className="w-full py-3 rounded-xl font-bold"
                                        style={{ background: palette.accent, color: "#fff", border: "none", cursor: "pointer" }}>
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Application lookup */}
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>Application ID *</label>
                                        <div className="flex gap-2">
                                            <input value={appQuery} onChange={e => setAppQuery(e.target.value)}
                                                placeholder="Paste the application MongoDB _id"
                                                style={{ ...inp(), flex: 1 }} />
                                            <button onClick={() => loadApp(appQuery)}
                                                className="px-4 rounded-xl text-sm font-semibold"
                                                style={{ background: `${palette.accent}18`, color: palette.accent, border: "none", cursor: "pointer", flexShrink: 0 }}>
                                                Lookup
                                            </button>
                                        </div>
                                        {appLookupError && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{appLookupError}</p>}
                                    </div>

                                    {/* App info */}
                                    {foundApp && (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl"
                                            style={{ background: "#22c55e10", border: "1px solid #22c55e30" }}>
                                            <div className="font-semibold text-sm" style={{ color: palette.textPrimary }}>{foundApp.appName}</div>
                                            <div className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>{foundApp.applicantEmail} · Plan requested: <strong>{foundApp.requestedPlan}</strong></div>
                                        </motion.div>
                                    )}

                                    {/* Rate limits */}
                                    {foundApp && (
                                        <>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { label: "req / min", key: "requestsPerMinute" as const },
                                                    { label: "req / hour", key: "requestsPerHour" as const },
                                                    { label: "req / day", key: "requestsPerDay" as const },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>{f.label}</label>
                                                        <input type="number" min={1} value={rl[f.key]}
                                                            onChange={e => setRl(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                                                            style={{ ...inp(), width: "100%" }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>Max file (bytes)</label>
                                                    <input type="number" min={1} value={rl.maxFileSizeBytes}
                                                        onChange={e => setRl(p => ({ ...p, maxFileSizeBytes: Number(e.target.value) }))}
                                                        style={{ ...inp(), width: "100%" }} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>Expires (optional)</label>
                                                    <input type="date" value={issueExpiry} onChange={e => setIssueExpiry(e.target.value)}
                                                        style={{ ...inp(), width: "100%" }} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>Admin Notes</label>
                                                <input value={issueNotes} onChange={e => setIssueNotes(e.target.value)}
                                                    placeholder="Internal note (optional)"
                                                    style={{ ...inp(), width: "100%" }} />
                                            </div>
                                        </>
                                    )}

                                    {issueError && <p className="text-sm px-4 py-2 rounded-xl" style={{ background: "#ef444420", color: "#ef4444" }}>{issueError}</p>}

                                    <button disabled={!foundApp || issueLoading} onClick={handleIssue}
                                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                        style={{ background: palette.accent, color: "#fff", border: "none", cursor: foundApp ? "pointer" : "not-allowed", opacity: foundApp ? 1 : 0.5 }}>
                                        <VpnKey fontSize="small" /> {issueLoading ? "Issuing…" : "Issue API Key"}
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
