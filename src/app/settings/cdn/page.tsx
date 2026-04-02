/**
 * CDN Access Settings
 * /settings/cdn
 *
 * Lets authenticated users view their CDN applications, check active API keys,
 * see live usage (rate-limit windows), and rotate their key.
 */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { useAuth } from "@Library/auth-client";
import {
    CloudUpload,
    CheckCircle,
    Schedule,
    Cancel,
    Block,
    VpnKey,
    Sync,
    ContentCopy,
    OpenInNew,
    Speed,
    ArrowBack,
    Warning,
    InfoOutlined,
    Storage,
    Api
} from "@mui/icons-material";

// ── Types ─────────────────────────────────────────────────────────────────────

type KeyStatus = "active" | "revoked" | "suspended" | "expired";
type AppStatus = "pending" | "approved" | "rejected" | "suspended";

interface CDNKey {
    keyId: string;
    keyPrefix: string;
    plan: string;
    status: KeyStatus;
    applicationId: string;
    appName: string;
    totalRequests: number;
    totalUploads: number;
    totalDownloads: number;
    lastUsedAt?: string;
    createdAt: string;
    rateLimit: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    liveUsage: { minute?: number; hour?: number; day?: number };
    application?: {
        status: AppStatus;
        requestedPlan: string;
        createdAt: string;
    } | null;
}

const STATUS_CONFIG = {
    pending: {
        label: "Under Review",
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

const KEY_STATUS_COLORS: Record<KeyStatus, string> = {
    active: "#22c55e",
    revoked: "#ef4444",
    suspended: "#f59e0b",
    expired: "#8b5cf6"
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CDNSettingsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const { user, isAuthenticated } = useAuth();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;
    const blur = isApple ? "blur(20px) saturate(160%)" : "none";

    const [keys, setKeys] = useState<CDNKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Rotation state
    const [rotating, setRotating] = useState<string | null>(null);
    const [newKeyData, setNewKeyData] = useState<{
        keyId: string;
        rawKey: string;
        keyPrefix: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/cdn/my-keys");
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || "Failed to load.");
                return;
            }
            setKeys(json.keys);
        } catch {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchKeys();
    }, [isAuthenticated, fetchKeys]);

    const handleRotate = async (keyId: string) => {
        if (!confirm("Rotate this key? The current key will be revoked immediately and a new one issued. Make sure to update your app."))
            return;
        setRotating(keyId);
        try {
            const res = await fetch(`/api/cdn/my-keys/${keyId}/rotate`, {
                method: "POST"
            });
            const json = await res.json();
            if (!res.ok) {
                alert(json.error || "Rotation failed.");
                return;
            }
            setNewKeyData({
                keyId: json.newKeyId,
                rawKey: json.rawKey,
                keyPrefix: json.keyPrefix
            });
            await fetchKeys();
        } catch {
            alert("Network error during rotation.");
        } finally {
            setRotating(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // ── Not authenticated ─────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <Warning
                        className="text-6xl mb-4"
                        style={{ color: palette.accent }}
                    />
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: palette.textPrimary }}>
                        Sign in required
                    </h1>
                    <Link href="/auth/signin">
                        <button
                            className="mt-4 px-6 py-3 rounded-xl font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#fff",
                                cursor: "pointer",
                                border: "none"
                            }}>
                            Sign In
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const inputStyle: React.CSSProperties = {
        padding: "10px 14px",
        borderRadius: isApple ? 10 : 12,
        border,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary,
        fontSize: 14,
        outline: "none",
        fontFamily: "monospace"
    };

    return (
        <div
            className="min-h-screen py-10 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}>
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-1.5 text-sm mb-6"
                        style={{ color: palette.accent }}>
                        <ArrowBack fontSize="small" /> Back to Settings
                    </Link>
                    <div className="flex items-center gap-4">
                        <div
                            className="p-3 rounded-2xl"
                            style={{ background: `${palette.accent}18` }}>
                            <CloudUpload style={{ color: palette.accent, fontSize: 28 }} />
                        </div>
                        <div>
                            <h1
                                className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                CDN API Access
                            </h1>
                            <p
                                className="text-sm mt-0.5"
                                style={{ color: palette.textSecondary }}>
                                Manage your CDN applications and API keys
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* New key revealed banner */}
                <AnimatePresence>
                    {newKeyData && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-5 rounded-2xl"
                            style={{
                                background: "#16a34a18",
                                border: "1.5px solid #16a34a40"
                            }}>
                            <div
                                className="flex items-center gap-2 mb-3 font-semibold"
                                style={{ color: "#16a34a" }}>
                                <CheckCircle fontSize="small" /> New key issued — save it now, it won't be shown again
                            </div>
                            <div className="flex items-center gap-2">
                                <code
                                    className="flex-1 px-4 py-3 rounded-xl text-sm break-all"
                                    style={{
                                        background: isDark ? "#0d1117" : "#fff",
                                        color: palette.textPrimary,
                                        fontFamily: "monospace",
                                        border
                                    }}>
                                    {newKeyData.rawKey}
                                </code>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => copyToClipboard(newKeyData.rawKey)}
                                    className="p-3 rounded-xl flex-shrink-0"
                                    style={{
                                        background: copied ? "#16a34a20" : `${palette.accent}18`,
                                        border: "none",
                                        cursor: "pointer",
                                        color: copied ? "#16a34a" : palette.accent
                                    }}>
                                    <ContentCopy fontSize="small" />
                                </motion.button>
                            </div>
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={() => setNewKeyData(null)}
                                    className="text-xs px-3 py-1.5 rounded-lg"
                                    style={{
                                        background: "transparent",
                                        border: `1px solid #16a34a40`,
                                        color: "#16a34a",
                                        cursor: "pointer"
                                    }}>
                                    I've saved it — dismiss
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick actions */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-wrap gap-3">
                    <Link href="/developer/cdn">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#fff",
                                border: "none",
                                cursor: "pointer"
                            }}>
                            <Api fontSize="small" /> Request New Access
                        </motion.button>
                    </Link>
                    <Link
                        href="/docs/CDN_EXTERNAL_API.md"
                        target="_blank">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                            style={{
                                background: `${palette.accent}12`,
                                color: palette.accent,
                                border: `1px solid ${palette.accent}30`,
                                cursor: "pointer"
                            }}>
                            <OpenInNew fontSize="small" /> API Docs
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Keys list */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}>
                    <h2
                        className={`${isApple ? "text-lg font-semibold" : "text-xl font-black"} mb-4`}
                        style={{ color: palette.textPrimary }}>
                        Your API Keys
                    </h2>

                    {loading ? (
                        <div
                            className="py-16 text-center"
                            style={{ color: palette.textTertiary }}>
                            Loading…
                        </div>
                    ) : error ? (
                        <div
                            className="py-8 text-center text-sm"
                            style={{ color: "#ef4444" }}>
                            {error}
                        </div>
                    ) : keys.length === 0 ? (
                        <div
                            className="p-10 rounded-2xl flex flex-col items-center gap-3 text-center"
                            style={{
                                background: cardBg,
                                backdropFilter: blur,
                                WebkitBackdropFilter: blur,
                                border
                            }}>
                            <VpnKey
                                style={{
                                    fontSize: 40,
                                    color: palette.textTertiary
                                }}
                            />
                            <p
                                className="font-semibold"
                                style={{ color: palette.textPrimary }}>
                                No API keys yet
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: palette.textSecondary }}>
                                Submit an application and once approved your key will appear here automatically.
                            </p>
                            <Link href="/developer/cdn">
                                <button
                                    className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold"
                                    style={{
                                        background: palette.accent,
                                        color: "#fff",
                                        border: "none",
                                        cursor: "pointer"
                                    }}>
                                    Apply for Access
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {keys.map((key) => {
                                const keyColor = KEY_STATUS_COLORS[key.status] ?? palette.accent;
                                const appStatus = key.application?.status ?? "pending";
                                const appCfg = STATUS_CONFIG[appStatus as AppStatus];

                                return (
                                    <motion.div
                                        key={key.keyId}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl overflow-hidden"
                                        style={{
                                            background: cardBg,
                                            backdropFilter: blur,
                                            WebkitBackdropFilter: blur,
                                            border
                                        }}>
                                        {/* Key header */}
                                        <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="p-2 rounded-xl"
                                                    style={{
                                                        background: `${keyColor}18`
                                                    }}>
                                                    <VpnKey
                                                        style={{
                                                            color: keyColor,
                                                            fontSize: 20
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <div
                                                        className="font-bold"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {key.appName}
                                                    </div>
                                                    <div
                                                        className="text-xs mt-0.5 font-mono"
                                                        style={{
                                                            color: palette.textSecondary
                                                        }}>
                                                        {key.keyPrefix}…
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Key status */}
                                                <span
                                                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                                                    style={{
                                                        background: `${keyColor}18`,
                                                        color: keyColor
                                                    }}>
                                                    {key.status}
                                                </span>
                                                {/* Application status */}
                                                <span
                                                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{
                                                        background: `${appCfg?.color ?? "#888"}18`,
                                                        color: appCfg?.color ?? palette.textSecondary
                                                    }}>
                                                    {appCfg?.icon} {appCfg?.label ?? "Unknown"}
                                                </span>
                                                {/* Plan */}
                                                <span
                                                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase"
                                                    style={{
                                                        background: `${palette.accent}14`,
                                                        color: palette.accent
                                                    }}>
                                                    {key.plan}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div
                                            style={{
                                                height: 1,
                                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                                            }}
                                        />

                                        {/* Stats row */}
                                        <div
                                            className="grid grid-cols-2 sm:grid-cols-4 divide-x"
                                            style={{
                                                borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                                            }}>
                                            {[
                                                {
                                                    label: "Total Requests",
                                                    value: key.totalRequests.toLocaleString()
                                                },
                                                {
                                                    label: "Uploads",
                                                    value: key.totalUploads.toLocaleString()
                                                },
                                                {
                                                    label: "Downloads",
                                                    value: key.totalDownloads.toLocaleString()
                                                },
                                                {
                                                    label: "Last Used",
                                                    value: key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"
                                                }
                                            ].map((s, i) => (
                                                <div
                                                    key={i}
                                                    className="p-4 text-center">
                                                    <div
                                                        className="text-xs mb-1"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {s.label}
                                                    </div>
                                                    <div
                                                        className="font-bold text-sm"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {s.value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Live rate limit bars */}
                                        {key.status === "active" && (
                                            <>
                                                <div
                                                    style={{
                                                        height: 1,
                                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                                                    }}
                                                />
                                                <div className="p-5 space-y-3">
                                                    <div
                                                        className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                                                        style={{
                                                            color: palette.textSecondary
                                                        }}>
                                                        <Speed fontSize="inherit" /> Live Rate Usage
                                                    </div>
                                                    {[
                                                        {
                                                            label: "This minute",
                                                            used: key.liveUsage.minute ?? 0,
                                                            max: key.rateLimit.requestsPerMinute
                                                        },
                                                        {
                                                            label: "This hour",
                                                            used: key.liveUsage.hour ?? 0,
                                                            max: key.rateLimit.requestsPerHour
                                                        },
                                                        {
                                                            label: "Today",
                                                            used: key.liveUsage.day ?? 0,
                                                            max: key.rateLimit.requestsPerDay
                                                        }
                                                    ].map((r) => {
                                                        const pct = Math.min(100, (r.used / r.max) * 100);
                                                        const barColor = pct > 85 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#22c55e";
                                                        return (
                                                            <div key={r.label}>
                                                                <div
                                                                    className="flex justify-between text-xs mb-1"
                                                                    style={{
                                                                        color: palette.textSecondary
                                                                    }}>
                                                                    <span>{r.label}</span>
                                                                    <span
                                                                        style={{
                                                                            color: palette.textPrimary,
                                                                            fontFamily: "monospace"
                                                                        }}>
                                                                        {r.used} / {r.max}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className="h-1.5 rounded-full overflow-hidden"
                                                                    style={{
                                                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                                                                    }}>
                                                                    <motion.div
                                                                        initial={{
                                                                            width: 0
                                                                        }}
                                                                        animate={{
                                                                            width: `${pct}%`
                                                                        }}
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            background: barColor
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}

                                        {/* Actions */}
                                        <div
                                            style={{
                                                height: 1,
                                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                                            }}
                                        />
                                        <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
                                            {key.status === "active" && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    disabled={rotating === key.keyId}
                                                    onClick={() => handleRotate(key.keyId)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                                                    style={{
                                                        background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                                                        color: "#ef4444",
                                                        border: "1px solid rgba(239,68,68,0.25)",
                                                        cursor: rotating === key.keyId ? "wait" : "pointer",
                                                        opacity: rotating === key.keyId ? 0.7 : 1
                                                    }}>
                                                    <Sync
                                                        fontSize="small"
                                                        style={{
                                                            animation: rotating === key.keyId ? "spin 1s linear infinite" : "none"
                                                        }}
                                                    />
                                                    {rotating === key.keyId ? "Rotating…" : "Rotate Key"}
                                                </motion.button>
                                            )}
                                            <span
                                                className="text-xs ml-auto"
                                                style={{
                                                    color: palette.textTertiary
                                                }}>
                                                Issued {new Date(key.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Info box */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3 p-4 rounded-2xl text-sm"
                    style={{
                        background: `${palette.accent}0a`,
                        border: `1px solid ${palette.accent}20`
                    }}>
                    <InfoOutlined
                        style={{
                            color: palette.accent,
                            flexShrink: 0,
                            marginTop: 1
                        }}
                        fontSize="small"
                    />
                    <div style={{ color: palette.textSecondary }}>
                        When you rotate a key, the old key is <strong style={{ color: palette.textPrimary }}>immediately revoked</strong>.
                        Update your application before rotating to avoid downtime. New keys are also emailed to your account address.
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
