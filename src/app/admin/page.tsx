/**
 * Admin Dashboard — overview of portfolio records
 * v2: single parallel fetch, one counts state object
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { useAdminSession } from "@Hooks/useAdminSession";
import Link from "next/link";
import {
    People,
    Folder,
    Description,
    Code,
    School,
    Work,
    WorkspacePremium,
    EmojiEvents,
    MapOutlined,
    PictureAsPdf,
    TrendingUp,
    Refresh,
    PhotoCamera
} from "@mui/icons-material";

interface StatCard {
    label: string;
    apiPath: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    requiredPermissions?: string[];
}

const statCards: StatCard[] = [
    {
        label: "Users",
        apiPath: "/api/admin/users",
        href: "/admin/users",
        icon: <People />,
        color: "#007AFF",
        requiredPermissions: ["admin.users.view", "admin.users.manage"]
    },
    {
        label: "Projects",
        apiPath: "/api/admin/projects",
        href: "/admin/projects",
        icon: <Folder />,
        color: "#AF52DE",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Documents",
        apiPath: "/api/admin/documents",
        href: "/admin/documents",
        icon: <Description />,
        color: "#4F46E5",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Skills",
        apiPath: "/api/admin/skills",
        href: "/admin/skills",
        icon: <Code />,
        color: "#34C759",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Education",
        apiPath: "/api/admin/education",
        href: "/admin/education",
        icon: <School />,
        color: "#FF9500",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Experience",
        apiPath: "/api/admin/experience",
        href: "/admin/experience",
        icon: <Work />,
        color: "#FF2D55",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Certificates",
        apiPath: "/api/admin/certificates",
        href: "/admin/certificates",
        icon: <WorkspacePremium />,
        color: "#FFCC00",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Test Scores",
        apiPath: "/api/admin/test-scores",
        href: "/admin/test-scores",
        icon: <EmojiEvents />,
        color: "#5AC8FA",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Sitemap Entries",
        apiPath: "/api/admin/sitemap",
        href: "/admin/sitemap",
        icon: <MapOutlined />,
        color: "#FF6B9D",
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Immich Access",
        apiPath: "/api/admin/immich-whitelist",
        href: "/admin/immich-access",
        icon: <PhotoCamera />,
        color: "#10B981",
        requiredPermissions: ["admin.site.settings"]
    }
];

interface QuickAction {
    label: string;
    href: string;
    icon: React.ReactNode;
    requiredPermissions?: string[];
}

const quickActions: QuickAction[] = [
    {
        label: "Build Resume PDF",
        href: "/admin/resume",
        icon: <PictureAsPdf fontSize="small" />,
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Immich Access",
        href: "/admin/immich-access",
        icon: <PhotoCamera fontSize="small" />,
        requiredPermissions: ["admin.site.settings"]
    },
    {
        label: "Manage Projects",
        href: "/admin/projects",
        icon: <Folder fontSize="small" />,
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "Edit Sitemap",
        href: "/admin/sitemap",
        icon: <MapOutlined fontSize="small" />,
        requiredPermissions: ["portfolio.manage"]
    },
    {
        label: "View Users",
        href: "/admin/users",
        icon: <People fontSize="small" />,
        requiredPermissions: ["admin.users.view", "admin.users.manage"]
    }
];

const dbSyncAction: QuickAction = {
    label: "DB Sync (Atlas -> Local)",
    href: "/admin/db-sync",
    icon: <Refresh fontSize="small" />,
    requiredPermissions: ["admin.site.settings"]
};

function StatTile({ card, count }: { card: StatCard; count: number | null }) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    return (
        <Link href={card.href}>
            <motion.div
                className="p-5 cursor-pointer relative overflow-hidden"
                style={{
                    borderRadius: isApple ? "22px" : "16px",
                    background: isApple
                        ? isDark
                            ? "rgba(28,28,32,0.65)"
                            : "rgba(255,255,255,0.72)"
                        : isDark
                          ? "rgba(24,24,28,0.95)"
                          : "#fff",
                    border: isApple
                        ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)"}`
                        : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
                    backdropFilter: isApple ? "blur(24px) saturate(190%)" : "none",
                    boxShadow: isApple
                        ? isDark
                            ? "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.12)"
                            : "0 8px 32px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.85)"
                        : "none"
                }}
                whileHover={{ scale: 1.03, y: -3 }}
                transition={{ duration: 0.2 }}>
                {/* subtle color glow */}
                <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                    style={{
                        background: `${card.color}15`,
                        filter: "blur(28px)",
                        transform: "translate(30%,-30%)"
                    }}
                />
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="p-2.5 rounded-xl"
                        style={{ background: `${card.color}20` }}>
                        <div style={{ color: card.color }}>{card.icon}</div>
                    </div>
                    <TrendingUp
                        style={{
                            color: card.color,
                            fontSize: 18,
                            opacity: 0.5
                        }}
                    />
                </div>
                {count === null ? (
                    <div
                        className="h-8 w-16 rounded-lg animate-pulse mb-1"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"
                        }}
                    />
                ) : (
                    <motion.p
                        className="text-3xl font-black mb-1"
                        style={{ color: palette.textPrimary }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}>
                        {count}
                    </motion.p>
                )}
                <p
                    className="text-sm font-semibold"
                    style={{ color: palette.textSecondary }}>
                    {card.label}
                </p>
            </motion.div>
        </Link>
    );
}

export default function AdminDashboard() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { session, loading } = useAdminSession();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const hasAccess = useCallback(
        (requiredPermissions?: string[]) => {
            if (!requiredPermissions || requiredPermissions.length === 0) return true;
            if (!session) return false;
            if (session.isAdmin) return true;
            return requiredPermissions.some((perm) => session.permissions.includes(perm));
        },
        [session]
    );

    const visibleStatCards = useMemo(() => statCards.filter((card) => hasAccess(card.requiredPermissions)), [hasAccess]);

    const visibleQuickActions = useMemo(() => {
        const base = quickActions.filter((action) => hasAccess(action.requiredPermissions));
        if (process.env.NODE_ENV === "production") return base;
        return [...base, dbSyncAction].filter((action) => hasAccess(action.requiredPermissions));
    }, [hasAccess]);

    // Single counts state — null means loading
    const [counts, setCounts] = useState<Record<string, number | null>>(Object.fromEntries(visibleStatCards.map((c) => [c.label, null])));

    const fetchAll = useCallback(() => {
        if (loading) return;

        setCounts(Object.fromEntries(visibleStatCards.map((c) => [c.label, null])));
        visibleStatCards.forEach((card) => {
            fetch(`${card.apiPath}?limit=1`)
                .then((r) => r.json())
                .then((j) => {
                    if (j.success) {
                        const val = j.pagination?.total ?? j.data?.length ?? 0;
                        setCounts((prev) => ({ ...prev, [card.label]: val }));
                    } else {
                        // Avoid endless loading shimmer when endpoint is denied or fails.
                        setCounts((prev) => ({ ...prev, [card.label]: 0 }));
                    }
                })
                .catch(() => {
                    setCounts((prev) => ({ ...prev, [card.label]: 0 }));
                });
        });
    }, [visibleStatCards, loading]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return (
        <div
            className="p-6"
            style={{ minHeight: "100vh", background: palette.background }}>
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1
                        className="text-3xl font-black"
                        style={{ color: palette.textPrimary }}>
                        Admin Dashboard
                    </h1>
                    <p
                        className="mt-1 text-sm"
                        style={{ color: palette.textSecondary }}>
                        Task-based admin workspace with role-scoped access
                    </p>
                </div>
                <motion.button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold mt-1"
                    style={{
                        borderRadius: isApple ? "9999px" : "12px",
                        background: isApple
                            ? isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(255,255,255,0.65)"
                            : isDark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.06)",
                        border: isApple
                            ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)"}`
                            : "none",
                        backdropFilter: isApple ? "blur(16px) saturate(180%)" : "none",
                        boxShadow: isApple
                            ? isDark
                                ? "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)"
                                : "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.9)"
                            : "none",
                        color: palette.textSecondary
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={fetchAll}>
                    <Refresh fontSize="small" /> Refresh
                </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {visibleStatCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}>
                        <StatTile
                            card={card}
                            count={counts[card.label]}
                        />
                    </motion.div>
                ))}
            </div>

            {!loading && visibleStatCards.length === 0 && (
                <div
                    className="mb-8 p-4 rounded-xl"
                    style={{
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        color: palette.textSecondary
                    }}>
                    You have admin dashboard access, but no tiles are assigned to your current permissions.
                </div>
            )}

            {/* Quick actions */}
            <div className="mb-4">
                <h2
                    className="text-lg font-black mb-4"
                    style={{ color: palette.textPrimary }}>
                    Quick Actions
                </h2>
                <div className="flex flex-wrap gap-3">
                    {visibleQuickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}>
                            <motion.div
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
                                style={{
                                    borderRadius: isApple ? "9999px" : "12px",
                                    background: isApple
                                        ? isDark
                                            ? "rgba(255,255,255,0.06)"
                                            : "rgba(255,255,255,0.65)"
                                        : `${palette.accent}15`,
                                    color: palette.accent,
                                    border: isApple
                                        ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)"}`
                                        : `1px solid ${palette.accent}25`,
                                    backdropFilter: isApple ? "blur(16px) saturate(180%)" : "none",
                                    boxShadow: isApple
                                        ? isDark
                                            ? "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)"
                                            : "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)"
                                        : "none"
                                }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}>
                                {action.icon}
                                {action.label}
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
