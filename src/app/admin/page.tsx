/**
 * Admin Dashboard — overview of portfolio records
 */

"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import Link from "next/link";
import {
    People, Folder, Code, School, Work,
    WorkspacePremium, EmojiEvents, MapOutlined,
    PictureAsPdf, TrendingUp
} from "@mui/icons-material";

interface StatCard {
    label: string;
    apiPath: string;
    href: string;
    icon: React.ReactNode;
    color: string;
}

const statCards: StatCard[] = [
    { label: "Users", apiPath: "/api/admin/users", href: "/admin/users", icon: <People />, color: "#007AFF" },
    { label: "Projects", apiPath: "/api/admin/projects", href: "/admin/projects", icon: <Folder />, color: "#AF52DE" },
    { label: "Skills", apiPath: "/api/admin/skills", href: "/admin/skills", icon: <Code />, color: "#34C759" },
    { label: "Education", apiPath: "/api/admin/education", href: "/admin/education", icon: <School />, color: "#FF9500" },
    { label: "Experience", apiPath: "/api/admin/experience", href: "/admin/experience", icon: <Work />, color: "#FF2D55" },
    { label: "Certificates", apiPath: "/api/admin/certificates", href: "/admin/certificates", icon: <WorkspacePremium />, color: "#FFCC00" },
    { label: "Test Scores", apiPath: "/api/admin/test-scores", href: "/admin/test-scores", icon: <EmojiEvents />, color: "#5AC8FA" },
    { label: "Sitemap Entries", apiPath: "/api/admin/sitemap", href: "/admin/sitemap", icon: <MapOutlined />, color: "#FF6B9D" },
];

function StatTile({ card }: { card: StatCard }) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        fetch(`${card.apiPath}?limit=1`).then(r => r.json()).then(j => {
            if (j.success) setCount(j.pagination?.total ?? j.data?.length ?? 0);
        }).catch(() => {});
    }, [card.apiPath]);

    return (
        <Link href={card.href}>
            <motion.div
                className="p-5 rounded-2xl cursor-pointer"
                style={{
                    background: isApple
                        ? isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)"
                        : isDark ? "rgba(24,24,28,0.95)" : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
                    backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none"
                }}
                whileHover={{ scale: 1.03, y: -3 }}
                transition={{ duration: 0.2 }}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl" style={{ background: `${card.color}20` }}>
                        <div style={{ color: card.color }}>{card.icon}</div>
                    </div>
                    <TrendingUp style={{ color: card.color, fontSize: 18, opacity: 0.5 }} />
                </div>
                <p className="text-3xl font-black mb-1" style={{ color: palette.textPrimary }}>
                    {count === null ? "…" : count}
                </p>
                <p className="text-sm font-semibold" style={{ color: palette.textSecondary }}>
                    {card.label}
                </p>
            </motion.div>
        </Link>
    );
}

export default function AdminDashboard() {
    const { palette } = useDesignTheme();

    return (
        <div className="p-6" style={{ minHeight: "100vh", background: palette.background }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black" style={{ color: palette.textPrimary }}>Admin Dashboard</h1>
                <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
                    Portfolio content overview — owner only
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {statCards.map(card => (
                    <StatTile key={card.label} card={card} />
                ))}
            </div>

            {/* Quick actions */}
            <div className="mb-4">
                <h2 className="text-lg font-black mb-4" style={{ color: palette.textPrimary }}>Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: "Build Resume PDF", href: "/admin/resume", icon: <PictureAsPdf fontSize="small" /> },
                        { label: "Manage Projects", href: "/admin/projects", icon: <Folder fontSize="small" /> },
                        { label: "Edit Sitemap", href: "/admin/sitemap", icon: <MapOutlined fontSize="small" /> },
                        { label: "View Users", href: "/admin/users", icon: <People fontSize="small" /> },
                    ].map(action => (
                        <Link key={action.label} href={action.href}>
                            <motion.div
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{
                                    background: `${palette.accent}15`,
                                    color: palette.accent,
                                    border: `1px solid ${palette.accent}25`
                                }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                            >
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
