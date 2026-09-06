"use client";

/**
 * Admin Rate Limits Page
 *
 * Full management interface for the rate limiting system:
 *   • Dashboard: active counters, blocked identities, top offenders
 *   • Rules: create/edit/delete rate limit rules
 *   • Whitelist: manage bypassed IPs and fingerprints
 *   • Sync: view GitHub CDN sync status, force re-sync
 */

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import Shield from "@mui/icons-material/Shield";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import Save from "@mui/icons-material/Save";
import Block from "@mui/icons-material/Block";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ToggleOn from "@mui/icons-material/ToggleOn";
import ToggleOff from "@mui/icons-material/ToggleOff";
import Sync from "@mui/icons-material/Sync";
import Close from "@mui/icons-material/Close";
import Warning from "@mui/icons-material/Warning";
import Fingerprint from "@mui/icons-material/Fingerprint";
import Dns from "@mui/icons-material/Dns";
import Speed from "@mui/icons-material/Speed";
import type { RateLimitConfig, RateLimitRule } from "@Library/RateLimit/RateLimitConfig";

type Tab = "dashboard" | "rules" | "whitelist";

interface CounterStats {
    totalActive: number;
    totalBlocked: number;
    topOffenders: Array<{
        _id: { identity: string; identityType: string };
        totalRequests: number;
        blockedCount: number;
        lastSeen: string;
        endpoints: string[];
    }>;
}

interface StatusMsg {
    type: "success" | "error";
    msg: string;
}

const EMPTY_RULE: RateLimitRule = {
    id: "",
    name: "",
    enabled: true,
    endpoints: [],
    endpointPatterns: [],
    group: "",
    methods: [],
    windowMs: 60_000,
    maxRequests: 60,
    identityMode: "both",
    bypassForAdmins: true,
    customMessage: "",
    priority: 10
};

export default function AdminRateLimitsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [tab, setTab] = useState<Tab>("dashboard");
    const [config, setConfig] = useState<RateLimitConfig | null>(null);
    const [stats, setStats] = useState<CounterStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<StatusMsg | null>(null);
    const [syncInfo, setSyncInfo] = useState<{ lastSyncedAt: string | null; lastSyncedBy: string | null }>({
        lastSyncedAt: null,
        lastSyncedBy: null
    });

    // Rule editor state
    const [editingRule, setEditingRule] = useState<RateLimitRule | null>(null);
    const [isNewRule, setIsNewRule] = useState(false);

    // Whitelist input state
    const [newWhitelistIP, setNewWhitelistIP] = useState("");
    const [newWhitelistFP, setNewWhitelistFP] = useState("");

    // ── Fetch config ─────────────────────────────────────────────────────────
    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/rate-limits");
            const data = await res.json();
            if (data.Status === 1) {
                setConfig(data.Data.config);
                setSyncInfo(data.Data.syncInfo);
            } else {
                setStatus({ type: "error", msg: data.Message || "Failed to load config" });
            }
        } catch {
            setStatus({ type: "error", msg: "Network error loading config" });
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch counters ───────────────────────────────────────────────────────
    const fetchCounters = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/rate-limits/counters");
            const data = await res.json();
            if (data.Status === 1) {
                setStats(data.Data.stats);
            }
        } catch {
            // Non-critical — dashboard stats may not be available
        }
    }, []);

    useEffect(() => {
        fetchConfig();
        fetchCounters();
    }, [fetchConfig, fetchCounters]);

    // ── Save config ──────────────────────────────────────────────────────────
    const saveConfig = async (updatedConfig: RateLimitConfig) => {
        setSaving(true);
        setStatus(null);
        try {
            const res = await fetch("/api/admin/rate-limits", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config: updatedConfig })
            });
            const data = await res.json();
            if (data.Status === 1) {
                setConfig(updatedConfig);
                setStatus({ type: "success", msg: "Config saved & synced to GitHub CDN" });
                setSyncInfo({ lastSyncedAt: new Date().toISOString(), lastSyncedBy: "you" });
            } else {
                setStatus({ type: "error", msg: data.Message || "Failed to save" });
            }
        } catch {
            setStatus({ type: "error", msg: "Network error saving config" });
        } finally {
            setSaving(false);
        }
    };

    // ── Clear counters ───────────────────────────────────────────────────────
    const clearCounters = async (identity?: string) => {
        try {
            const res = await fetch("/api/admin/rate-limits/counters", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(identity ? { identity } : { clearAll: true })
            });
            const data = await res.json();
            if (data.Status === 1) {
                setStatus({ type: "success", msg: data.Message });
                fetchCounters();
            }
        } catch {
            setStatus({ type: "error", msg: "Failed to clear counters" });
        }
    };

    // ── Styles ───────────────────────────────────────────────────────────────
    const cardBg = isDark ? "rgba(30, 30, 40, 0.8)" : "rgba(255, 255, 255, 0.9)";
    const cardBorder = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)";
    const accentColor = palette?.primary || "#6366f1";
    const dangerColor = "#ef4444";
    const successColor = "#22c55e";
    const warningColor = "#f59e0b";

    const cardStyle: React.CSSProperties = {
        background: cardBg,
        border: cardBorder,
        borderRadius: isApple ? 20 : 16,
        padding: "24px",
        backdropFilter: "blur(20px)"
    };

    const btnBase: React.CSSProperties = {
        border: "none",
        borderRadius: isApple ? 12 : 8,
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s"
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 14px",
        background: inputBg,
        border: cardBorder,
        borderRadius: isApple ? 12 : 8,
        color: "inherit",
        fontSize: "0.875rem",
        outline: "none"
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: "center", opacity: 0.6 }}>
                <Speed style={{ fontSize: 40, marginBottom: 12 }} />
                <p>Loading rate limit configuration...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <Shield style={{ fontSize: 32, color: accentColor }} />
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
                        Rate Limits
                    </h1>
                    {config && (
                        <span
                            style={{
                                padding: "4px 12px",
                                borderRadius: 20,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background: config.globalEnabled
                                    ? `${successColor}20`
                                    : `${dangerColor}20`,
                                color: config.globalEnabled ? successColor : dangerColor
                            }}
                        >
                            {config.globalEnabled ? "ACTIVE" : "DISABLED"}
                        </span>
                    )}
                </div>
                <p style={{ opacity: 0.6, margin: 0, fontSize: "0.9rem" }}>
                    Manage rate limiting rules, whitelists, and monitor blocked requests.
                </p>
                {syncInfo.lastSyncedAt && (
                    <p style={{ opacity: 0.4, margin: "4px 0 0", fontSize: "0.8rem" }}>
                        Last synced: {new Date(syncInfo.lastSyncedAt).toLocaleString()}{" "}
                        {syncInfo.lastSyncedBy && `by ${syncInfo.lastSyncedBy}`}
                    </p>
                )}
            </motion.div>

            {/* Status message */}
            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            ...cardStyle,
                            marginBottom: 20,
                            padding: "14px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            background:
                                status.type === "success"
                                    ? `${successColor}15`
                                    : `${dangerColor}15`,
                            borderColor:
                                status.type === "success"
                                    ? `${successColor}40`
                                    : `${dangerColor}40`
                        }}
                    >
                        {status.type === "success" ? (
                            <CheckCircle style={{ color: successColor }} />
                        ) : (
                            <Warning style={{ color: dangerColor }} />
                        )}
                        <span style={{ flex: 1 }}>{status.msg}</span>
                        <button
                            onClick={() => setStatus(null)}
                            style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.6, color: "inherit" }}
                        >
                            <Close fontSize="small" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global toggle */}
            {config && (
                <div style={{ ...cardStyle, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <strong>Global Rate Limiting</strong>
                        <p style={{ opacity: 0.5, fontSize: "0.8rem", margin: "4px 0 0" }}>
                            Master switch for all rate limiting rules
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            const updated = { ...config, globalEnabled: !config.globalEnabled };
                            setConfig(updated);
                            saveConfig(updated);
                        }}
                        style={{
                            ...btnBase,
                            background: config.globalEnabled ? `${successColor}20` : `${dangerColor}20`,
                            color: config.globalEnabled ? successColor : dangerColor
                        }}
                    >
                        {config.globalEnabled ? <ToggleOn /> : <ToggleOff />}
                        {config.globalEnabled ? "Enabled" : "Disabled"}
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {(["dashboard", "rules", "whitelist"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            ...btnBase,
                            background: tab === t ? accentColor : "transparent",
                            color: tab === t ? "#fff" : "inherit",
                            opacity: tab === t ? 1 : 0.6
                        }}
                    >
                        {t === "dashboard" && <Speed fontSize="small" />}
                        {t === "rules" && <Shield fontSize="small" />}
                        {t === "whitelist" && <CheckCircle fontSize="small" />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
            {tab === "dashboard" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Stats cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                        <div style={{ ...cardStyle, textAlign: "center" }}>
                            <Speed style={{ fontSize: 28, color: accentColor, marginBottom: 8 }} />
                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                {stats?.totalActive ?? "—"}
                            </div>
                            <div style={{ opacity: 0.5, fontSize: "0.85rem" }}>Active Counters</div>
                        </div>
                        <div style={{ ...cardStyle, textAlign: "center" }}>
                            <Block style={{ fontSize: 28, color: dangerColor, marginBottom: 8 }} />
                            <div style={{ fontSize: "2rem", fontWeight: 700, color: (stats?.totalBlocked ?? 0) > 0 ? dangerColor : "inherit" }}>
                                {stats?.totalBlocked ?? "—"}
                            </div>
                            <div style={{ opacity: 0.5, fontSize: "0.85rem" }}>Blocked Identities</div>
                        </div>
                        <div style={{ ...cardStyle, textAlign: "center" }}>
                            <Shield style={{ fontSize: 28, color: successColor, marginBottom: 8 }} />
                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                {config?.rules.length ?? "—"}
                            </div>
                            <div style={{ opacity: 0.5, fontSize: "0.85rem" }}>Active Rules</div>
                        </div>
                    </div>

                    {/* Top offenders */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Top Offenders</h3>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => fetchCounters()} style={{ ...btnBase, padding: "6px 14px", background: `${accentColor}15`, color: accentColor }}>
                                    <Refresh fontSize="small" /> Refresh
                                </button>
                                <button onClick={() => clearCounters()} style={{ ...btnBase, padding: "6px 14px", background: `${dangerColor}15`, color: dangerColor }}>
                                    <Delete fontSize="small" /> Clear All
                                </button>
                            </div>
                        </div>

                        {!stats?.topOffenders?.length ? (
                            <p style={{ opacity: 0.5, textAlign: "center", padding: 20 }}>
                                No active rate limit data. Counters appear when requests are tracked.
                            </p>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                    <thead>
                                        <tr style={{ borderBottom: cardBorder, opacity: 0.6 }}>
                                            <th style={{ textAlign: "left", padding: "8px 12px" }}>Identity</th>
                                            <th style={{ textAlign: "left", padding: "8px 12px" }}>Type</th>
                                            <th style={{ textAlign: "right", padding: "8px 12px" }}>Requests</th>
                                            <th style={{ textAlign: "right", padding: "8px 12px" }}>Blocked</th>
                                            <th style={{ textAlign: "left", padding: "8px 12px" }}>Last Seen</th>
                                            <th style={{ textAlign: "center", padding: "8px 12px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.topOffenders.map((o, i) => (
                                            <tr key={i} style={{ borderBottom: cardBorder }}>
                                                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                    {o._id.identity.length > 24
                                                        ? o._id.identity.slice(0, 24) + "…"
                                                        : o._id.identity}
                                                </td>
                                                <td style={{ padding: "10px 12px" }}>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: 10,
                                                        fontSize: "0.75rem",
                                                        background: o._id.identityType === "ip" ? `${accentColor}20` : `${warningColor}20`,
                                                        color: o._id.identityType === "ip" ? accentColor : warningColor
                                                    }}>
                                                        {o._id.identityType === "ip" ? "IP" : "Fingerprint"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                                                    {o.totalRequests}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "right", color: o.blockedCount > 0 ? dangerColor : "inherit" }}>
                                                    {o.blockedCount}
                                                </td>
                                                <td style={{ padding: "10px 12px", opacity: 0.6 }}>
                                                    {new Date(o.lastSeen).toLocaleString()}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                                    <button
                                                        onClick={() => clearCounters(o._id.identity)}
                                                        style={{ ...btnBase, padding: "4px 10px", fontSize: "0.75rem", background: `${dangerColor}15`, color: dangerColor }}
                                                    >
                                                        Unblock
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── Rules Tab ─────────────────────────────────────────────────── */}
            {tab === "rules" && config && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Rate Limit Rules ({config.rules.length})</h3>
                        <button
                            onClick={() => {
                                setEditingRule({ ...EMPTY_RULE, id: `rule-${Date.now()}` });
                                setIsNewRule(true);
                            }}
                            style={{ ...btnBase, background: accentColor, color: "#fff" }}
                        >
                            <Add fontSize="small" /> Add Rule
                        </button>
                    </div>

                    {/* Default rule card */}
                    <div style={{ ...cardStyle, marginBottom: 16, borderLeft: `4px solid ${accentColor}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <strong>{config.defaultRule.name}</strong>
                                <span style={{
                                    marginLeft: 10,
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                    fontSize: "0.7rem",
                                    background: `${accentColor}20`,
                                    color: accentColor
                                }}>
                                    DEFAULT FALLBACK
                                </span>
                                <p style={{ opacity: 0.5, fontSize: "0.8rem", margin: "6px 0 0" }}>
                                    {config.defaultRule.maxRequests} req / {config.defaultRule.windowMs / 1000}s
                                    • Mode: {config.defaultRule.identityMode}
                                </p>
                            </div>
                            <button
                                onClick={() => { setEditingRule({ ...config.defaultRule }); setIsNewRule(false); }}
                                style={{ ...btnBase, padding: "6px 14px", background: `${accentColor}15`, color: accentColor }}
                            >
                                <Edit fontSize="small" /> Edit
                            </button>
                        </div>
                    </div>

                    {/* Rule list */}
                    {config.rules.map((rule) => (
                        <div
                            key={rule.id}
                            style={{
                                ...cardStyle,
                                marginBottom: 12,
                                opacity: rule.enabled ? 1 : 0.5,
                                borderLeft: `4px solid ${rule.enabled ? successColor : "transparent"}`
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <strong>{rule.name}</strong>
                                        {rule.group && (
                                            <span style={{
                                                padding: "2px 8px",
                                                borderRadius: 10,
                                                fontSize: "0.7rem",
                                                background: `${warningColor}20`,
                                                color: warningColor
                                            }}>
                                                {rule.group}
                                            </span>
                                        )}
                                        <span style={{
                                            padding: "2px 8px",
                                            borderRadius: 10,
                                            fontSize: "0.7rem",
                                            background: rule.enabled ? `${successColor}20` : `${dangerColor}20`,
                                            color: rule.enabled ? successColor : dangerColor
                                        }}>
                                            {rule.enabled ? "ON" : "OFF"}
                                        </span>
                                    </div>
                                    <p style={{ opacity: 0.5, fontSize: "0.8rem", margin: "6px 0 0" }}>
                                        {rule.maxRequests} req / {rule.windowMs >= 60000 ? `${rule.windowMs / 60000}m` : `${rule.windowMs / 1000}s`}
                                        • Identity: {rule.identityMode}
                                        • Priority: {rule.priority}
                                    </p>
                                    {rule.endpoints.length > 0 && (
                                        <p style={{ opacity: 0.4, fontSize: "0.75rem", margin: "4px 0 0", fontFamily: "monospace" }}>
                                            Endpoints: {rule.endpoints.join(", ")}
                                        </p>
                                    )}
                                    {rule.endpointPatterns.length > 0 && (
                                        <p style={{ opacity: 0.4, fontSize: "0.75rem", margin: "2px 0 0", fontFamily: "monospace" }}>
                                            Patterns: {rule.endpointPatterns.join(", ")}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button
                                        onClick={() => {
                                            const updated = {
                                                ...config,
                                                rules: config.rules.map((r) =>
                                                    r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                                                )
                                            };
                                            saveConfig(updated);
                                        }}
                                        style={{ ...btnBase, padding: "6px 10px", background: "transparent", opacity: 0.6 }}
                                        title={rule.enabled ? "Disable" : "Enable"}
                                    >
                                        {rule.enabled ? <ToggleOn /> : <ToggleOff />}
                                    </button>
                                    <button
                                        onClick={() => { setEditingRule({ ...rule }); setIsNewRule(false); }}
                                        style={{ ...btnBase, padding: "6px 10px", background: `${accentColor}15`, color: accentColor }}
                                    >
                                        <Edit fontSize="small" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!confirm(`Delete rule "${rule.name}"?`)) return;
                                            const updated = { ...config, rules: config.rules.filter((r) => r.id !== rule.id) };
                                            saveConfig(updated);
                                        }}
                                        style={{ ...btnBase, padding: "6px 10px", background: `${dangerColor}15`, color: dangerColor }}
                                    >
                                        <Delete fontSize="small" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {config.rules.length === 0 && (
                        <div style={{ ...cardStyle, textAlign: "center", padding: 40, opacity: 0.5 }}>
                            <Shield style={{ fontSize: 40, marginBottom: 8 }} />
                            <p>No custom rules yet. Click "Add Rule" to create one.</p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Whitelist Tab ──────────────────────────────────────────────── */}
            {tab === "whitelist" && config && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {/* IP Whitelist */}
                        <div style={cardStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                <Dns style={{ color: accentColor }} />
                                <h3 style={{ margin: 0 }}>Whitelisted IPs ({config.whitelistedIPs.length})</h3>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                <input
                                    value={newWhitelistIP}
                                    onChange={(e) => setNewWhitelistIP(e.target.value)}
                                    placeholder="e.g. 1.2.3.4"
                                    style={inputStyle}
                                />
                                <button
                                    onClick={() => {
                                        if (!newWhitelistIP.trim()) return;
                                        const updated = {
                                            ...config,
                                            whitelistedIPs: [...config.whitelistedIPs, newWhitelistIP.trim()]
                                        };
                                        saveConfig(updated);
                                        setNewWhitelistIP("");
                                    }}
                                    style={{ ...btnBase, background: accentColor, color: "#fff", whiteSpace: "nowrap" }}
                                >
                                    <Add fontSize="small" />
                                </button>
                            </div>
                            {config.whitelistedIPs.map((ip, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        borderBottom: cardBorder,
                                        fontFamily: "monospace",
                                        fontSize: "0.85rem"
                                    }}
                                >
                                    <span>{ip}</span>
                                    <button
                                        onClick={() => {
                                            const updated = {
                                                ...config,
                                                whitelistedIPs: config.whitelistedIPs.filter((_, j) => j !== i)
                                            };
                                            saveConfig(updated);
                                        }}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: dangerColor }}
                                    >
                                        <Close fontSize="small" />
                                    </button>
                                </div>
                            ))}
                            {config.whitelistedIPs.length === 0 && (
                                <p style={{ opacity: 0.5, textAlign: "center", padding: 16, fontSize: "0.85rem" }}>
                                    No whitelisted IPs
                                </p>
                            )}
                        </div>

                        {/* Fingerprint Whitelist */}
                        <div style={cardStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                <Fingerprint style={{ color: warningColor }} />
                                <h3 style={{ margin: 0 }}>Whitelisted Fingerprints ({config.whitelistedFingerprints.length})</h3>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                <input
                                    value={newWhitelistFP}
                                    onChange={(e) => setNewWhitelistFP(e.target.value)}
                                    placeholder="64-char hex hash"
                                    style={inputStyle}
                                />
                                <button
                                    onClick={() => {
                                        if (!newWhitelistFP.trim()) return;
                                        const updated = {
                                            ...config,
                                            whitelistedFingerprints: [...config.whitelistedFingerprints, newWhitelistFP.trim()]
                                        };
                                        saveConfig(updated);
                                        setNewWhitelistFP("");
                                    }}
                                    style={{ ...btnBase, background: warningColor, color: "#fff", whiteSpace: "nowrap" }}
                                >
                                    <Add fontSize="small" />
                                </button>
                            </div>
                            {config.whitelistedFingerprints.map((fp, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        borderBottom: cardBorder,
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem"
                                    }}
                                >
                                    <span>{fp.length > 20 ? fp.slice(0, 20) + "…" : fp}</span>
                                    <button
                                        onClick={() => {
                                            const updated = {
                                                ...config,
                                                whitelistedFingerprints: config.whitelistedFingerprints.filter((_, j) => j !== i)
                                            };
                                            saveConfig(updated);
                                        }}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: dangerColor }}
                                    >
                                        <Close fontSize="small" />
                                    </button>
                                </div>
                            ))}
                            {config.whitelistedFingerprints.length === 0 && (
                                <p style={{ opacity: 0.5, textAlign: "center", padding: 16, fontSize: "0.85rem" }}>
                                    No whitelisted fingerprints
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Rule Editor Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {editingRule && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(8px)",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 20
                        }}
                        onClick={() => { setEditingRule(null); setIsNewRule(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                ...cardStyle,
                                width: "100%",
                                maxWidth: 600,
                                maxHeight: "85vh",
                                overflowY: "auto"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h3 style={{ margin: 0 }}>
                                    {isNewRule ? "Create Rule" : "Edit Rule"}
                                </h3>
                                <button
                                    onClick={() => { setEditingRule(null); setIsNewRule(false); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                                >
                                    <Close />
                                </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {/* Name */}
                                <div>
                                    <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Rule Name</label>
                                    <input
                                        value={editingRule.name}
                                        onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                                        style={inputStyle}
                                        placeholder="e.g. Auth Login Limit"
                                    />
                                </div>

                                {/* Endpoints */}
                                <div>
                                    <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Exact Endpoints (comma-separated)</label>
                                    <input
                                        value={editingRule.endpoints.join(", ")}
                                        onChange={(e) => setEditingRule({
                                            ...editingRule,
                                            endpoints: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                        })}
                                        style={inputStyle}
                                        placeholder="/api/auth/sign-in, /api/auth/sign-up"
                                    />
                                </div>

                                {/* Endpoint Patterns */}
                                <div>
                                    <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Endpoint Patterns (comma-separated, supports /*)</label>
                                    <input
                                        value={editingRule.endpointPatterns.join(", ")}
                                        onChange={(e) => setEditingRule({
                                            ...editingRule,
                                            endpointPatterns: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                        })}
                                        style={inputStyle}
                                        placeholder="/api/admin/*, /api/tools/*"
                                    />
                                </div>

                                {/* Limits row */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Max Requests</label>
                                        <input
                                            type="number"
                                            value={editingRule.maxRequests}
                                            onChange={(e) => setEditingRule({ ...editingRule, maxRequests: parseInt(e.target.value) || 1 })}
                                            style={inputStyle}
                                            min={1}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Window (seconds)</label>
                                        <input
                                            type="number"
                                            value={editingRule.windowMs / 1000}
                                            onChange={(e) => setEditingRule({ ...editingRule, windowMs: (parseInt(e.target.value) || 60) * 1000 })}
                                            style={inputStyle}
                                            min={1}
                                        />
                                    </div>
                                </div>

                                {/* Identity mode & group row */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Identity Mode</label>
                                        <select
                                            value={editingRule.identityMode}
                                            onChange={(e) => setEditingRule({ ...editingRule, identityMode: e.target.value as any })}
                                            style={inputStyle}
                                        >
                                            <option value="both">Both (IP + Fingerprint)</option>
                                            <option value="ip">IP Only</option>
                                            <option value="fingerprint">Fingerprint Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Group</label>
                                        <input
                                            value={editingRule.group || ""}
                                            onChange={(e) => setEditingRule({ ...editingRule, group: e.target.value })}
                                            style={inputStyle}
                                            placeholder="e.g. auth, cdn, api"
                                        />
                                    </div>
                                </div>

                                {/* Methods & Priority */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>HTTP Methods (comma-sep, empty=all)</label>
                                        <input
                                            value={editingRule.methods?.join(", ") || ""}
                                            onChange={(e) => setEditingRule({
                                                ...editingRule,
                                                methods: e.target.value ? e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) : []
                                            })}
                                            style={inputStyle}
                                            placeholder="POST, PUT"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Priority (higher = first)</label>
                                        <input
                                            type="number"
                                            value={editingRule.priority}
                                            onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 0 })}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                {/* Custom message */}
                                <div>
                                    <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: 4 }}>Custom Rate Limit Message</label>
                                    <input
                                        value={editingRule.customMessage || ""}
                                        onChange={(e) => setEditingRule({ ...editingRule, customMessage: e.target.value })}
                                        style={inputStyle}
                                        placeholder="Too many requests. Please try again later."
                                    />
                                </div>

                                {/* Toggles */}
                                <div style={{ display: "flex", gap: 20 }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={editingRule.enabled}
                                            onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                                        />
                                        Enabled
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={editingRule.bypassForAdmins}
                                            onChange={(e) => setEditingRule({ ...editingRule, bypassForAdmins: e.target.checked })}
                                        />
                                        Bypass for Admins
                                    </label>
                                </div>

                                {/* Save */}
                                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                                    <button
                                        onClick={() => { setEditingRule(null); setIsNewRule(false); }}
                                        style={{ ...btnBase, background: "transparent", opacity: 0.6 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!config || !editingRule.name.trim()) return;

                                            let updated: RateLimitConfig;
                                            if (editingRule.id === "default") {
                                                updated = { ...config, defaultRule: editingRule };
                                            } else if (isNewRule) {
                                                updated = { ...config, rules: [...config.rules, editingRule] };
                                            } else {
                                                updated = {
                                                    ...config,
                                                    rules: config.rules.map((r) =>
                                                        r.id === editingRule.id ? editingRule : r
                                                    )
                                                };
                                            }

                                            saveConfig(updated);
                                            setEditingRule(null);
                                            setIsNewRule(false);
                                        }}
                                        disabled={saving}
                                        style={{ ...btnBase, background: accentColor, color: "#fff" }}
                                    >
                                        <Save fontSize="small" />
                                        {saving ? "Saving..." : "Save & Sync"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
