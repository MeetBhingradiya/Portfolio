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
import { CheckCircle, Cancel, Schedule, Block, Search, Refresh, OpenInNew, Close, VpnKey, Info, ExpandMore } from "@mui/icons-material";

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
    pending: {
        label: "Pending",
        color: "#f59e0b",
        icon: <Schedule fontSize="small" />
    },
    approved: {
        label: "Approved",
        color: "#22c55e",
        icon: <CheckCircle fontSize="small" />
    },
    rejected: {
        label: "Rejected",
        color: "#ef4444",
        icon: <Cancel fontSize="small" />
    },
    suspended: {
        label: "Suspended",
        color: "#8b5cf6",
        icon: <Block fontSize="small" />
    }
};

const PLAN_COLOR: Record<Plan, string> = {
    free: "#6b7280",
    basic: "#3b82f6",
    pro: "#8b5cf6",
    enterprise: "#f59e0b"
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCDNApplicationsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;
    const blur = isApple ? "blur(20px) saturate(160%)" : "none";

    // ── State ─────────────────────────────────────────────────────────────
    const [list, setList] = useState<{
        apps: CDNApplication[];
        total: number;
        statusCounts: Record<string, number>;
        loading: boolean;
        error: string;
        success: string;
        search: string;
        filterStatus: AppStatus | "";
        page: number;
    }>({
        apps: [],
        total: 0,
        statusCounts: {},
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

    // Selected application for detail panel
    const [detail, setDetail] = useState<{
        selected: CDNApplication | null;
        actionLoading: boolean;
        adminNotes: string;
        rejectionReason: string;
    }>({
        selected: null,
        actionLoading: false,
        adminNotes: "",
        rejectionReason: ""
    });
    const patchDetail = useCallback((p: Partial<typeof detail>) => setDetail((s) => ({ ...s, ...p })), []);

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchApps = useCallback(
        async (pg = 1) => {
            patchList({ loading: true, error: "" });
            try {
                const params = new URLSearchParams({
                    page: String(pg),
                    limit: String(PAGE_SIZE),
                    search: list.search
                });
                if (list.filterStatus) params.set("status", list.filterStatus);
                const res = await fetch(`/api/admin/cdn/applications?${params}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed");
                patchList({
                    apps: json.applications ?? [],
                    total: json.pagination?.total ?? 0,
                    statusCounts: json.statusCounts ?? {}
                });
            } catch (e: any) {
                patchList({ error: e.message, apps: [], total: 0 });
            } finally {
                patchList({ loading: false });
            }
        },
        [list.search, list.filterStatus]
    );

    useEffect(() => {
        fetchApps(list.page);
    }, [fetchApps, list.page]);

    const showMsg = (msg: string) => {
        patchList({ success: msg });
        setTimeout(() => patchList({ success: "" }), 4000);
    };

    // ── Actions ───────────────────────────────────────────────────────────
    const doAction = async (id: string, action: "approve" | "reject" | "suspend" | "reopen") => {
        patchDetail({ actionLoading: true });
        try {
            const res = await fetch(`/api/admin/cdn/applications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    adminNotes: detail.adminNotes || undefined,
                    rejectionReason: detail.rejectionReason || undefined
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            showMsg(`Application ${action}d.`);
            patchDetail({ selected: null });
            fetchApps(list.page);
        } catch (e: any) {
            patchList({ error: e.message });
        } finally {
            patchDetail({ actionLoading: false });
        }
    };

    // ── Go-to-issue-key helper ────────────────────────────────────────────
    const goIssueKey = (appId: string) => {
        window.open(`/admin/cdn/api-keys?issue=${appId}`, "_blank");
    };

    // ── Shared styles ─────────────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        padding: "10px 14px",
        borderRadius: isApple ? 10 : 12,
        border,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary,
        fontSize: 14,
        outline: "none",
        fontFamily: "inherit"
    };

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
                        CDN Applications
                    </h1>
                    <p
                        className="text-sm mt-1"
                        style={{ color: palette.textSecondary }}>
                        Review & approve external CDN access requests
                    </p>
                </div>
                <button
                    onClick={() => fetchApps(list.page)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                        background: `${palette.accent}18`,
                        color: palette.accent,
                        border: "none",
                        cursor: "pointer"
                    }}>
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
                            onClick={() =>
                                patchList({
                                    filterStatus: list.filterStatus === s ? "" : s,
                                    page: 1
                                })
                            }
                            className="p-4 rounded-xl text-left transition-all"
                            style={{
                                background: list.filterStatus === s ? `${cfg.color}18` : cardBg,
                                backdropFilter: blur,
                                WebkitBackdropFilter: blur,
                                border: list.filterStatus === s ? `2px solid ${cfg.color}50` : border,
                                borderRadius: br,
                                cursor: "pointer"
                            }}>
                            <div
                                className="flex items-center gap-2 mb-1"
                                style={{ color: cfg.color }}>
                                {cfg.icon}
                                <span className="text-xs font-semibold">{cfg.label}</span>
                            </div>
                            <div
                                className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                {list.statusCounts[s] ?? 0}
                            </div>
                        </button>
                    );
                })}
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
                        placeholder="Search name, email, app…"
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
                                filterStatus: v as AppStatus | "",
                                page: 1
                            })
                        }
                        options={[
                            { value: "", label: "All Statuses" },
                            { value: "pending", label: "Pending" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" },
                            { value: "suspended", label: "Suspended" }
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
                ) : list.apps.length === 0 ? (
                    <div
                        className="p-12 text-center"
                        style={{ color: palette.textSecondary }}>
                        No applications found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table
                            className="w-full text-sm"
                            style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: border }}>
                                    {["Applicant", "App", "Plan", "Status", "Submitted", ""].map((h) => (
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
                                {list.apps.map((app, i) => {
                                    const cfg = STATUS_CFG[app.status];
                                    return (
                                        <motion.tr
                                            key={app._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            style={{
                                                borderBottom: i < list.apps.length - 1 ? border : "none",
                                                cursor: "pointer"
                                            }}
                                            onClick={() =>
                                                patchDetail({
                                                    selected: app,
                                                    adminNotes: app.adminNotes || "",
                                                    rejectionReason: app.rejectionReason || ""
                                                })
                                            }
                                            className="hover:opacity-80 transition-opacity">
                                            <td className="px-5 py-3.5">
                                                <div
                                                    className="font-semibold"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {app.applicantName}
                                                </div>
                                                <div
                                                    className="text-xs"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    {app.applicantEmail}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {app.appName}
                                                </div>
                                                {app.appOrganisation && (
                                                    <div
                                                        className="text-xs"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {app.appOrganisation}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                    style={{
                                                        background: `${PLAN_COLOR[app.requestedPlan]}18`,
                                                        color: PLAN_COLOR[app.requestedPlan]
                                                    }}>
                                                    {app.requestedPlan}
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
                                                    color: palette.textTertiary
                                                }}>
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <ExpandMore
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

            {/* ── Detail drawer ─────────────────────────────────────────── */}
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
                            {/* Drawer header */}
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
                                        {detail.selected.applicantName} · {detail.selected.applicantEmail}
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

                            {/* Status */}
                            <div className="flex items-center gap-2 mb-6">
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
                                        background: `${PLAN_COLOR[detail.selected.requestedPlan]}18`,
                                        color: PLAN_COLOR[detail.selected.requestedPlan]
                                    }}>
                                    {detail.selected.requestedPlan}
                                </span>
                            </div>

                            {/* Detail rows */}
                            {[
                                {
                                    label: "Organisation",
                                    value: detail.selected.appOrganisation
                                },
                                {
                                    label: "Website",
                                    value: detail.selected.appWebsite,
                                    link: true
                                },
                                {
                                    label: "GitHub",
                                    value: detail.selected.appGithub,
                                    link: true
                                },
                                {
                                    label: "Est. Req/mo",
                                    value: detail.selected.expectedMonthlyRequests?.toLocaleString()
                                },
                                {
                                    label: "User ID",
                                    value: detail.selected.applicantUserId
                                },
                                {
                                    label: "Reviewed by",
                                    value: detail.selected.reviewedBy
                                },
                                {
                                    label: "Reviewed at",
                                    value: detail.selected.reviewedAt ? new Date(detail.selected.reviewedAt).toLocaleString() : undefined
                                }
                            ]
                                .filter((r) => r.value)
                                .map((r) => (
                                    <div
                                        key={r.label}
                                        className="flex items-start justify-between gap-4 py-2 border-b text-sm"
                                        style={{
                                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                                        }}>
                                        <span
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            {r.label}
                                        </span>
                                        {r.link ? (
                                            <a
                                                href={r.value}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1"
                                                style={{
                                                    color: palette.accent,
                                                    wordBreak: "break-all",
                                                    textAlign: "right"
                                                }}>
                                                {r.value} <OpenInNew fontSize="inherit" />
                                            </a>
                                        ) : (
                                            <span
                                                style={{
                                                    color: palette.textPrimary,
                                                    textAlign: "right"
                                                }}>
                                                {r.value}
                                            </span>
                                        )}
                                    </div>
                                ))}

                            <div className="mt-4 space-y-3">
                                <div>
                                    <div
                                        className="text-xs font-semibold mb-1"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Description
                                    </div>
                                    <p
                                        className="text-sm p-3 rounded-xl"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                            color: palette.textPrimary
                                        }}>
                                        {detail.selected.appDescription}
                                    </p>
                                </div>
                                <div>
                                    <div
                                        className="text-xs font-semibold mb-1"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Use Case Details
                                    </div>
                                    <p
                                        className="text-sm p-3 rounded-xl"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                            color: palette.textPrimary
                                        }}>
                                        {detail.selected.useCaseDetails}
                                    </p>
                                </div>
                            </div>

                            {/* Admin fields */}
                            <div className="mt-6 space-y-3">
                                <div>
                                    <label
                                        className="text-xs font-semibold mb-1 block"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Admin Notes (internal)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={detail.adminNotes}
                                        onChange={(e) =>
                                            patchDetail({
                                                adminNotes: e.target.value
                                            })
                                        }
                                        placeholder="Internal notes — not shown to applicant"
                                        style={{
                                            ...inputStyle,
                                            resize: "vertical",
                                            width: "100%"
                                        }}
                                    />
                                </div>
                                {(detail.selected.status === "pending" || detail.selected.status === "approved") && (
                                    <div>
                                        <label
                                            className="text-xs font-semibold mb-1 block"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Rejection Reason (shown to applicant)
                                        </label>
                                        <input
                                            value={detail.rejectionReason}
                                            onChange={(e) =>
                                                patchDetail({
                                                    rejectionReason: e.target.value
                                                })
                                            }
                                            placeholder="Required if rejecting"
                                            style={{
                                                ...inputStyle,
                                                width: "100%"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="mt-6 flex flex-col gap-2">
                                {detail.selected.status === "pending" && (
                                    <>
                                        <button
                                            disabled={detail.actionLoading}
                                            onClick={() => doAction(detail.selected!._id, "approve")}
                                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                            style={{
                                                background: "#22c55e",
                                                color: "#fff",
                                                border: "none",
                                                cursor: "pointer"
                                            }}>
                                            <CheckCircle fontSize="small" /> Approve Application
                                        </button>
                                        <button
                                            disabled={detail.actionLoading}
                                            onClick={() => doAction(detail.selected!._id, "reject")}
                                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                            style={{
                                                background: "#ef4444",
                                                color: "#fff",
                                                border: "none",
                                                cursor: "pointer"
                                            }}>
                                            <Cancel fontSize="small" /> Reject Application
                                        </button>
                                    </>
                                )}
                                {detail.selected.status === "approved" && (
                                    <>
                                        <button
                                            disabled={detail.actionLoading}
                                            onClick={() => goIssueKey(detail.selected!._id)}
                                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                            style={{
                                                background: palette.accent,
                                                color: "#fff",
                                                border: "none",
                                                cursor: "pointer"
                                            }}>
                                            <VpnKey fontSize="small" /> Issue API Key
                                        </button>
                                        <button
                                            disabled={detail.actionLoading}
                                            onClick={() => doAction(detail.selected!._id, "suspend")}
                                            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                            style={{
                                                background: "#8b5cf620",
                                                color: "#8b5cf6",
                                                border: "1px solid #8b5cf640",
                                                cursor: "pointer"
                                            }}>
                                            <Block fontSize="small" /> Suspend
                                        </button>
                                    </>
                                )}
                                {(detail.selected.status === "rejected" || detail.selected.status === "suspended") && (
                                    <button
                                        disabled={detail.actionLoading}
                                        onClick={() => doAction(detail.selected!._id, "reopen")}
                                        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                        style={{
                                            background: `${palette.accent}18`,
                                            color: palette.accent,
                                            border: `1px solid ${palette.accent}40`,
                                            cursor: "pointer"
                                        }}>
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
