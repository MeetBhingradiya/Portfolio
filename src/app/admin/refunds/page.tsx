/**
 * Admin — Refund Requests
 * Review and approve / reject customer refund requests.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { AssignmentReturn, Check, Close, Search } from "@mui/icons-material";

interface Refund {
    _id: string;
    refundId: string;
    orderId: string;
    email: string;
    reason: string;
    description: string;
    totalRefundAmount: number;
    status: string;
    createdAt: string;
    reviewNotes?: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "#FF9500",
    under_review: "#007AFF",
    approved: "#34C759",
    rejected: "#FF3B30",
    processed: "#8E8E93",
};

export default function AdminRefundsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [list, setList] = useState({ refunds: [] as Refund[], loading: true, search: "" });
    const patchList = useCallback((p: Partial<typeof list>) => setList(s => ({ ...s, ...p })), []);
    const [panel, setPanel] = useState<{ detail: Refund | null; notes: string; saving: boolean }>({ detail: null, notes: "", saving: false });
    const patchPanel = useCallback((p: Partial<typeof panel>) => setPanel(s => ({ ...s, ...p })), []);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;

    const fetchRefunds = useCallback(async () => {
        patchList({ loading: true });
        const res = await fetch("/api/shop/refunds?limit=100");
        const json = await res.json();
        if (json.success) patchList({ refunds: json.data });
        patchList({ loading: false });
    }, []);

    useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

    const filtered = list.refunds.filter(r =>
        r.refundId.toLowerCase().includes(list.search.toLowerCase()) ||
        r.email?.toLowerCase().includes(list.search.toLowerCase()) ||
        r.orderId.toLowerCase().includes(list.search.toLowerCase())
    );

    const review = async (status: "approved" | "rejected" | "under_review") => {
        if (!panel.detail) return;
        patchPanel({ saving: true });
        await fetch(`/api/shop/refunds/${panel.detail._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, reviewNotes: panel.notes }),
        });
        patchPanel({ saving: false, detail: null });
        fetchRefunds();
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <AssignmentReturn style={{ color: palette.accent, fontSize: 32 }} />
                <div>
                    <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>Refund Requests</h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>Review and process customer refund requests</p>
                </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-5" style={{ background: cardBg, border }}>
                <Search style={{ color: palette.textSecondary, fontSize: 18 }} />
                <input
                    value={list.search}
                    onChange={e => patchList({ search: e.target.value })}
                    placeholder="Search by refund ID, order, or email…"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: palette.textPrimary }}
                />
            </div>

            {list.loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(r => (
                        <motion.div
                            key={r._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer"
                            style={{ background: cardBg, border, borderRadius: br }}
                            onClick={() => patchPanel({ detail: r, notes: r.reviewNotes ?? "" })}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black font-mono" style={{ color: palette.accent }}>{r.refundId}</span>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                                        style={{ background: `${STATUS_COLORS[r.status] ?? "#8E8E93"}18`, color: STATUS_COLORS[r.status] ?? "#8E8E93" }}
                                    >
                                        {r.status.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-sm font-bold truncate" style={{ color: palette.textPrimary }}>{r.reason.replace("_", " ")} — Order {r.orderId}</p>
                                <p className="text-xs truncate" style={{ color: palette.textSecondary }}>{r.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-base" style={{ color: palette.textPrimary }}>
                                    ${(r.totalRefundAmount / 100).toFixed(2)}
                                </p>
                                <p className="text-xs" style={{ color: palette.textTertiary }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                        </motion.div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-16" style={{ color: palette.textSecondary }}>No refund requests found.</div>
                    )}
                </div>
            )}

            {/* Detail Panel */}
            <AnimatePresence>
                {panel.detail && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => patchPanel({ detail: null })} />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{ background: isDark ? "#1c1c20" : "#f5f5f8" }}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <div>
                                    <h2 className="font-black text-lg" style={{ color: palette.textPrimary }}>{panel.detail.refundId}</h2>
                                    <p className="text-sm" style={{ color: palette.textSecondary }}>Order: {panel.detail.orderId}</p>
                                </div>
                                <button onClick={() => patchPanel({ detail: null })}><Close style={{ color: palette.textSecondary }} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <div className="p-4 rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                    <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: palette.textTertiary }}>Reason</p>
                                    <p className="font-bold capitalize" style={{ color: palette.textPrimary }}>{panel.detail.reason.replace("_", " ")}</p>
                                    <p className="text-sm mt-2" style={{ color: palette.textSecondary }}>{panel.detail.description}</p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-bold" style={{ color: palette.textPrimary }}>Refund Amount</span>
                                    <span className="font-black text-lg" style={{ color: palette.accent }}>${(panel.detail.totalRefundAmount / 100).toFixed(2)}</span>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>Review Notes</p>
                                    <textarea
                                        value={panel.notes}
                                        onChange={e => patchPanel({ notes: e.target.value })}
                                        rows={3}
                                        placeholder="Internal notes about the review decision…"
                                        className="w-full text-sm px-4 py-3 rounded-xl resize-none outline-none"
                                        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: palette.textPrimary, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}
                                    />
                                </div>
                            </div>

                            <div className="px-6 pb-6 pt-3 border-t space-y-2" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                {panel.detail.status === "pending" && (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => review("under_review")}
                                        disabled={panel.saving}
                                        className="w-full py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}
                                    >
                                        Mark Under Review
                                    </motion.button>
                                )}
                                <div className="flex gap-2">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => review("rejected")}
                                        disabled={panel.saving}
                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                        style={{ background: "rgba(255,59,48,0.12)", color: "#FF3B30" }}
                                    >
                                        <Close fontSize="small" /> Reject
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => review("approved")}
                                        disabled={panel.saving}
                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                        style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}
                                    >
                                        <Check fontSize="small" /> Approve
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
