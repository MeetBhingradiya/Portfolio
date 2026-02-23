/**
 * Admin Sidebar — Client Component
 * Adaptive sidebar styled with the portfolio design system
 * (Apple Liquid Glass ↔ Samsung One UI 7)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Dashboard,
    People,
    MapOutlined,
    Work,
    School,
    WorkspacePremium,
    Code,
    EmojiEvents,
    PictureAsPdf,
    ChevronLeft,
    ChevronRight,
    AdminPanelSettings,
    Folder,
    Build,
    PhotoCamera
} from "@mui/icons-material";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: <Dashboard fontSize="small" />, exact: true },
    { href: "/admin/users", label: "Users", icon: <People fontSize="small" /> },
    { href: "/admin/sitemap", label: "Sitemap", icon: <MapOutlined fontSize="small" /> },
    { href: "/admin/projects", label: "Projects", icon: <Folder fontSize="small" /> },
    { href: "/admin/skills", label: "Skills", icon: <Code fontSize="small" /> },
    { href: "/admin/education", label: "Education", icon: <School fontSize="small" /> },
    { href: "/admin/experience", label: "Experience", icon: <Work fontSize="small" /> },
    { href: "/admin/certificates", label: "Certificates", icon: <WorkspacePremium fontSize="small" /> },
    { href: "/admin/test-scores", label: "Test Scores", icon: <EmojiEvents fontSize="small" /> },
    { href: "/admin/resume", label: "Resume Builder", icon: <PictureAsPdf fontSize="small" /> },
    { href: "/admin/tool-settings", label: "Tool Settings", icon: <Build fontSize="small" /> },
    { href: "/admin/immich-access", label: "Immich Access", icon: <PhotoCamera fontSize="small" /> },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    const sidebarBg = isApple
        ? isDark
            ? "rgba(18, 18, 20, 0.88)"
            : "rgba(245, 245, 250, 0.88)"
        : isDark
            ? "rgba(20, 20, 24, 0.95)"
            : "rgba(248, 248, 252, 0.95)";

    const sidebarBlur = isApple ? "blur(24px) saturate(180%)" : "none";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    return (
        <motion.aside
            animate={{ width: collapsed ? 64 : 220 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="sticky top-0 h-screen flex flex-col z-40 overflow-hidden"
            style={{
                background: sidebarBg,
                backdropFilter: sidebarBlur,
                WebkitBackdropFilter: sidebarBlur,
                borderRight: `1px solid ${borderColor}`,
                flexShrink: 0
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor }}>
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${palette.accent}20` }}
                >
                    <AdminPanelSettings style={{ color: palette.accent, fontSize: 18 }} />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex-1 min-w-0"
                        >
                            <p className="text-sm font-black truncate" style={{ color: palette.textPrimary }}>
                                Admin Portal
                            </p>
                            <p className="text-xs truncate" style={{ color: palette.textTertiary }}>
                                Owner Access
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
                {navItems.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none"
                                style={{
                                    background: active
                                        ? isApple
                                            ? `${palette.accent}22`
                                            : `${palette.accent}18`
                                        : "transparent",
                                    color: active ? palette.accent : palette.textSecondary,
                                    fontWeight: active ? 700 : 500
                                }}
                                whileHover={{
                                    background: active
                                        ? `${palette.accent}22`
                                        : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                                }}
                            >
                                <div className="flex-shrink-0" style={{ color: active ? palette.accent : palette.textTertiary }}>
                                    {item.icon}
                                </div>
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-sm whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="border-t p-2" style={{ borderColor }}>
                <motion.button
                    className="w-full flex items-center justify-center py-2 rounded-xl"
                    style={{ color: palette.textTertiary }}
                    whileHover={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
                </motion.button>
                {!collapsed && (
                    <Link href="/settings">
                        <p className="text-center text-xs mt-1 pb-1" style={{ color: palette.textTertiary }}>
                            ← Back to Settings
                        </p>
                    </Link>
                )}
            </div>
        </motion.aside>
    );
}
