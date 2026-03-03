/**
 * Admin — CDN Applications Manager
 * /admin/cdn/applications
 *
 * Review, approve, reject, or suspend external CDN access applications.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    CheckCircle,
    Cancel,
    Schedule,
    Block,
    Search,
    Refresh,
    OpenInNew,
    Close,
    VpnKey,
    Info,
    ExpandMore,
} from "@mui/icons-material";

// ── Types ─────────────────────────────────────────────────────────────────────

type AppStatus = "pending" | "approved" | "rejected" | "suspended";
type Plan = "free" | "basic" | "pro" | "enterprise";

interface CDNApplication {
    _id: string;
    applicantName: string;
    applicantEmail: string;
    applicantUserId?: string;
    appName: string;
    appDescription: string;
    appWebsite?: string;
    appGithub?: string;
    appOrganisation?: string;
    requestedPlan: Plan;
    expectedMonthlyRequests?: number;
    useCaseDetails: string;
    status: AppStatus;
    adminNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AppStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending:   { label: "Pending",   color: "#f59e0b", icon: <Schedule fontSize="small" /> },
    approved:  { label: "Approved",  color: "#22c55e", icon: <CheckCircle fontSize="small" /> },
    rejected:  { label: "Rejected",  color: "#ef4444", icon: <Cancel fontSize="small" /> },
    suspended: { label: "Suspended", color: "#8b5cf6", icon: <Block fontSize="small" /> },
};

const PLAN_COLOR: Record<Plan, string> = {
    free: "#6b7280", basic: "#3b82f6", pro: "#8b5cf6", enterprise: "#f59e0b",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCDNApplicationsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border  = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br      = isApple ? 16 : 20;
    const blur    = isApple ? "blur(20px) saturate(160%)" : "none";

    // ── State ─────────────────────────────────────────────────────────────
    const [apps, setApps] = useState<CDNApplication[]>([]);
    const [total, setTotal] = useState(0);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<AppStatus | "">("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 25;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Selected application for detail panel
    const [selected, setSelected] = useState<CDNApplication | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchApps = useCallback(async (pg = 1) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE), search });
            if (filterStatus) params.set("status", filterStatus);
            const res = await fetch(`/api/admin/cdn/applications?${params}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            setApps(json.applications);
            setTotal(json.pagination.total);
            setStatusCounts(json.statusCounts || {});
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [search, filterStatus]);

    useEffect(() => { fetchApps(page); }, [fetchApps, page]);

    const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); };

    // ── Actions ───────────────────────────────────────────────────────────
    const doAction = async (id: string, action: "approve" | "reject" | "suspend" | "reopen") => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/cdn/applications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, adminNotes: adminNotes || undefined, rejectionReason: rejectionReason || undefined }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            showMsg(`Application ${action}d.`);
            setSelected(null);
            fetchApps(page);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ── Go-to-issue-key helper ────────────────────────────────────────────
    const goIssueKey = (appId: string) => {
        window.open(`/admin/cdn/api-keys?issue=${appId}`, "_blank");
    };

    // ── Shared styles ─────────────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        padding: "10px 14px", borderRadius: isApple ? 10 : 12, border,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary, fontSize: 14, outline: "none", fontFamily: "inherit",
    };

    return (
        <div className="p-6 md:p-8 space-y-6" style={{ color: palette.textPrimary }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>CDN Applications</h1>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>Review & approve external CDN access requests</p>
                </div>
                <button onClick={() => fetchApps(page)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: `${palette.accent}18`, color: palette.accent, border: "none", cursor: "pointer" }}>
                    <Refresh fontSize="small" /> Refresh
                </button>
            </div>

            {/* ── Status counters ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["pending", "approved", "rejected", "suspended"] as AppStatus[]).map((s) => {
                    const cfg = STATUS_CFG[s];
                    return (
                        <button
                            key={s}
                            onClick={() => { setFilterStatus(filterStatus === s ? "" : s); setPage(1); }}
                            className="p-4 rounded-xl text-left transition-all"
                            style={{
                                background: filterStatus === s ? `${cfg.color}18` : cardBg,
                                backdropFilter: blur, WebkitBackdropFilter: blur,
                                border: filterStatus === s ? `2px solid ${cfg.color}50` : border,
                                borderRadius: br, cursor: "pointer",
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1" style={{ color: cfg.color }}>{cfg.icon}<span className="text-xs font-semibold">{cfg.label}</span></div>
                            <div className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                                {statusCounts[s] ?? 0}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-52 flex items-center gap-2 px-4 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border, borderRadius: isApple ? 12 : 14 }}>
                    <Search fontSize="small" style={{ color: palette.textTertiary }} />
                    <input
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search name, email, app…"
                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: palette.textPrimary, fontSize: 14, padding: "10px 0", fontFamily: "inherit" }}
                    />
                </div>
                <div style={{ minWidth: 160 }}>
                    <CustomSelect
                        value={filterStatus}
                        onChange={(v) => { setFilterStatus(v as AppStatus | ""); setPage(1); }}
                        options={[{ value: "", label: "All Statuses" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }, { value: "suspended", label: "Suspended" }]}
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
                ) : apps.length === 0 ? (
                    <div className="p-12 text-center" style={{ color: palette.textSecondary }}>No applications found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: border }}>
                                    {["Applicant", "App", "Plan", "Status", "Submitted", ""].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: palette.textSecondary }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map((app, i) => {
                                    const cfg = STATUS_CFG[app.status];
                                    return (
                                        <motion.tr
                                            key={app._id}
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                            style={{ borderBottom: i < apps.length - 1 ? border : "none", cursor: "pointer" }}
                                            onClick={() => { setSelected(app); setAdminNotes(app.adminNotes || ""); setRejectionReason(app.rejectionReason || ""); }}
                                            className="hover:opacity-80 transition-opacity"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="font-semibold" style={{ color: palette.textPrimary }}>{app.applicantName}</div>
                                                <div className="text-xs" style={{ color: palette.textTertiary }}>{app.applicantEmail}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div style={{ color: palette.textPrimary }}>{app.appName}</div>
                                                {app.appOrganisation && <div className="text-xs" style={{ color: palette.textTertiary }}>{app.appOrganisation}</div>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${PLAN_COLOR[app.requestedPlan]}18`, color: PLAN_COLOR[app.requestedPlan] }}>
                                                    {app.requestedPlan}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-1 text-xs font-semibold w-fit px-2.5 py-1 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: palette.textTertiary }}>
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <ExpandMore fontSize="small" style={{ color: palette.textTertiary }} />
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

            {/* ── Detail drawer ─────────────────────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                            onClick={() => setSelected(null)}
                        />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 260 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 overflow-y-auto"
                            style={{ background: isDark ? "rgba(18,18,22,0.98)" : "#fff", backdropFilter: "blur(24px)", borderLeft: border, padding: 28 }}
                        >
                            {/* Drawer header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`} style={{ color: palette.textPrimary }}>{selected.appName}</h2>
                                    <p className="text-sm" style={{ color: palette.textSecondary }}>{selected.applicantName} · {selected.applicantEmail}</p>
                                </div>
                                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: palette.textTertiary }}>
                                    <Close />
                                </button>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2 mb-6">
                                {(() => { const cfg = STATUS_CFG[selected.status]; return (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                                        {cfg.icon} {cfg.label}
                                    </span>
                                ); })()}
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: `${PLAN_COLOR[selected.requestedPlan]}18`, color: PLAN_COLOR[selected.requestedPlan] }}>
                                    {selected.requestedPlan}
                                </span>
                            </div>

                            {/* Detail rows */}
                            {[
                                { label: "Organisation", value: selected.appOrganisation },
                                { label: "Website",      value: selected.appWebsite, link: true },
                                { label: "GitHub",       value: selected.appGithub,  link: true },
                                { label: "Est. Req/mo", value: selected.expectedMonthlyRequests?.toLocaleString() },
                                { label: "User ID",     value: selected.applicantUserId },
                                { label: "Reviewed by", value: selected.reviewedBy },
                                { label: "Reviewed at", value: selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString() : undefined },
                            ].filter(r => r.value).map(r => (
                                <div key={r.label} className="flex items-start justify-between gap-4 py-2 border-b text-sm" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                                    <span style={{ color: palette.textSecondary }}>{r.label}</span>
                                    {r.link ? (
                                        <a href={r.value} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: palette.accent, wordBreak: "break-all", textAlign: "right" }}>
                                            {r.value} <OpenInNew fontSize="inherit" />
                                        </a>
                                    ) : (
                                        <span style={{ color: palette.textPrimary, textAlign: "right" }}>{r.value}</span>
                                    )}
                                </div>
                            ))}

                            <div className="mt-4 space-y-3">
                                <div>
                                    <div className="text-xs font-semibold mb-1" style={{ color: palette.textSecondary }}>Description</div>
                                    <p className="text-sm p-3 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", color: palette.textPrimary }}>{selected.appDescription}</p>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold mb-1" style={{ color: palette.textSecondary }}>Use Case Details</div>
                                    <p className="text-sm p-3 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", color: palette.textPrimary }}>{selected.useCaseDetails}</p>
                                </div>
                            </div>

                            {/* Admin fields */}
                            <div className="mt-6 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>Admin Notes (internal)</label>
                                    <textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                                        placeholder="Internal notes — not shown to applicant"
                                        style={{ ...inputStyle, resize: "vertical", width: "100%" }}
                                    />
                                </div>
                                {(selected.status === "pending" || selected.status === "approved") && (
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: palette.textSecondary }}>Rejection Reason (shown to applicant)</label>
                                        <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                            placeholder="Required if rejecting"
                                            style={{ ...inputStyle, width: "100%" }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="mt-6 flex flex-col gap-2">
                                {selected.status === "pending" && (
                                    <>
                                        <button disabled={actionLoading} onClick={() => doAction(selected._id, "approve")}
                                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                            style={{ background: "#22c55e", color: "#fff", border: "none", cursor: "pointer" }}>
                                            <CheckCircle fontSize="small" /> Approve Application
                                        </button>
                                        <button disabled={actionLoading} onClick={() => doAction(selected._id, "reject")}
                                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                            style={{ background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>
                                            <Cancel fontSize="small" /> Reject Application
                                        </button>
                                    </>
                                )}
                                {selected.status === "approved" && (
                                    <>
                                        <button disabled={actionLoading} onClick={() => goIssueKey(selected._id)}
                                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                            style={{ background: palette.accent, color: "#fff", border: "none", cursor: "pointer" }}>
                                            <VpnKey fontSize="small" /> Issue API Key
                                        </button>
                                        <button disabled={actionLoading} onClick={() => doAction(selected._id, "suspend")}
                                            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                            style={{ background: "#8b5cf620", color: "#8b5cf6", border: "1px solid #8b5cf640", cursor: "pointer" }}>
                                            <Block fontSize="small" /> Suspend
                                        </button>
                                    </>
                                )}
                                {(selected.status === "rejected" || selected.status === "suspended") && (
                                    <button disabled={actionLoading} onClick={() => doAction(selected._id, "reopen")}
                                        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                        style={{ background: `${palette.accent}18`, color: palette.accent, border: `1px solid ${palette.accent}40`, cursor: "pointer" }}>
                                        <Refresh fontSize="small" /> Re-open as Pending
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
