"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Link from "next/link";

export default function AdminMaintenancePage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [state, setState] = useState({
        mode: false,
        message: "",
        loading: true,
        saving: false,
        status: null as { type: "success" | "error"; msg: string } | null,
        lastUpdated: null as string | null,
    });
    const patch = useCallback((p: Partial<typeof state>) => setState(s => ({ ...s, ...p })), []);

    const fetchStatus = useCallback(async () => {
        patch({ loading: true });
        try {
            const res = await fetch("/api/admin/maintenance");
            const data = await res.json();
            if (data.success) {
                patch({
                    mode: data.maintenanceMode,
                    message: data.maintenanceMessage || "",
                    lastUpdated: data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null,
                });
            }
        } catch {
            patch({ status: { type: "error", msg: "Failed to load maintenance status." } });
        } finally {
            patch({ loading: false });
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleSave = async () => {
        patch({ saving: true, status: null });
        try {
            const res = await fetch("/api/admin/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maintenanceMode: state.mode, maintenanceMessage: state.message })
            });
            const data = await res.json();
            if (data.success) {
                patch({ status: { type: "success", msg: data.message }, lastUpdated: new Date().toLocaleString() });
            } else {
                patch({ status: { type: "error", msg: data.error || "Failed to save." } });
            }
        } catch {
            patch({ status: { type: "error", msg: "Network error. Please try again." } });
        } finally {
            patch({ saving: false });
        }
    };

    const cardStyle = {
        background: isApple
            ? isDark
                ? "rgba(28,28,32,0.7)"
                : "rgba(255,255,255,0.7)"
            : isDark
                ? "rgba(24,24,28,0.95)"
                : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
        backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none"
    };

    return (
        <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${palette.accent}20`, border: `1px solid ${palette.accent}40` }}
                >
                    <BuildIcon style={{ fontSize: 22, color: palette.accent }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: palette.textPrimary }}>
                        Maintenance Mode
                    </h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Control site availability for non-admin users
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <motion.button
                        onClick={fetchStatus}
                        disabled={state.loading}
                        className="p-2 rounded-xl"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                            color: palette.textSecondary
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RefreshIcon style={{ fontSize: 18 }} />
                    </motion.button>
                </div>
            </div>

            {/* Status badge */}
            {!state.loading && (
                <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                    style={{
                        background: state.mode
                            ? isDark ? "rgba(234,88,12,0.15)" : "rgba(234,88,12,0.1)"
                            : isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.1)",
                        border: `1px solid ${state.mode ? "rgba(234,88,12,0.35)" : "rgba(34,197,94,0.3)"}`
                    }}
                >
                    {state.mode ? (
                        <WarningAmberIcon style={{ fontSize: 18, color: isDark ? "#fb923c" : "#ea580c" }} />
                    ) : (
                        <CheckCircleIcon style={{ fontSize: 18, color: isDark ? "#86efac" : "#16a34a" }} />
                    )}
                    <span className="text-sm font-medium" style={{ color: state.mode ? (isDark ? "#fdba74" : "#9a3412") : (isDark ? "#86efac" : "#15803d") }}>
                        Site is currently <strong>{state.mode ? "UNDER MAINTENANCE" : "LIVE"}</strong>
                    </span>
                    {state.lastUpdated && (
                        <span className="ml-auto text-xs" style={{ color: palette.textSecondary }}>
                            Updated: {state.lastUpdated}
                        </span>
                    )}
                </div>
            )}

            {/* Controls card */}
            <motion.div
                className="rounded-2xl p-6 flex flex-col gap-5"
                style={cardStyle}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                {/* Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-sm" style={{ color: palette.textPrimary }}>
                            Enable Maintenance Mode
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                            Non-admin visitors will see the maintenance page
                        </div>
                    </div>
                    <motion.button
                        onClick={() => patch({ mode: !state.mode })}
                        className="relative w-12 h-6 rounded-full transition-colors duration-300"
                        style={{
                            background: state.mode
                                ? palette.accent
                                : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"
                        }}
                        whileTap={{ scale: 0.94 }}
                    >
                        <motion.span
                            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                            animate={{ x: state.mode ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    </motion.button>
                </div>

                <div className="h-px" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />

                {/* Message */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: palette.textPrimary }}>
                        Maintenance Message
                    </label>
                    <textarea
                        value={state.message}
                        onChange={(e) => patch({ message: e.target.value })}
                        placeholder="We're performing scheduled maintenance. We'll be back soon!"
                        rows={3}
                        className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                            color: palette.textPrimary,
                            caretColor: palette.accent
                        }}
                    />
                    <p className="text-xs" style={{ color: palette.textSecondary }}>
                        This message is shown on the maintenance page and in the header banner.
                    </p>
                </div>
            </motion.div>

            {/* Status message */}
            {state.status && (
                <motion.div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{
                        background: state.status.type === "success"
                            ? isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.1)"
                            : isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.1)",
                        border: `1px solid ${state.status.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                        color: state.status.type === "success" ? (isDark ? "#86efac" : "#15803d") : (isDark ? "#fca5a5" : "#dc2626")
                    }}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {state.status.type === "success" ? <CheckCircleIcon style={{ fontSize: 16 }} /> : <WarningAmberIcon style={{ fontSize: 16 }} />}
                    {state.status.msg}
                </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <motion.button
                    onClick={handleSave}
                    disabled={state.saving || state.loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{
                        background: state.saving || state.loading ? `${palette.accent}66` : palette.accent,
                        color: "#fff",
                        cursor: state.saving || state.loading ? "not-allowed" : "pointer"
                    }}
                    whileHover={!state.saving && !state.loading ? { scale: 1.03 } : {}}
                    whileTap={!state.saving && !state.loading ? { scale: 0.96 } : {}}
                >
                    <SaveIcon style={{ fontSize: 17 }} />
                    {state.saving ? "Saving…" : "Save Changes"}
                </motion.button>

                <Link
                    href="/maintenance"
                    target="_blank"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                        color: palette.textSecondary
                    }}
                >
                    <OpenInNewIcon style={{ fontSize: 15 }} />
                    Preview Page
                </Link>
            </div>

            {/* Info box */}
            <div
                className="rounded-xl p-4 text-sm"
                style={{
                    background: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)",
                    border: `1px solid rgba(59,130,246,0.2)`,
                    color: isDark ? "#93c5fd" : "#2563eb"
                }}
            >
                <strong>How it works:</strong> When enabled, all pages redirect non-admin visitors
                to <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(59,130,246,0.15)" }}>/maintenance</code> and
                all API routes return a 503 response. Admin users with a valid session bypass this automatically
                after visiting this page.
            </div>
        </div>
    );
}