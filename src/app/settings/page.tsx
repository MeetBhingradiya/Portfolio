/**
 * Main Settings Page
 * Central hub for all user settings
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth } from "@Library/auth-client";
import { UserAvatar } from "@Components/Common/UserAvatar";
import Link from "next/link";
import {
    Settings,
    Security,
    AccountCircle,
    Notifications,
    Palette,
    Language,
    Link as LinkIcon,
    Warning,
    ChevronRight,
    Email,
    Password,
    AdminPanelSettings
} from "@mui/icons-material";

export default function SettingsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, isAuthenticated } = useAuth();
    const [isAdmin, setIsAdmin] = React.useState(false);

    React.useEffect(() => {
        fetch("/api/admin/is-admin")
            .then(r => r.json())
            .then(j => setIsAdmin(j.isAdmin === true))
            .catch(() => setIsAdmin(false));
    }, []);

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const settingsSections = [
        {
            id: "profile",
            title: "Profile Settings",
            description: "Manage your personal information and profile",
            icon: <AccountCircle />,
            href: "/settings/profile",
            badge: null
        },
        {
            id: "security",
            title: "Security & Privacy",
            description: "Password, 2FA, passkeys, and active sessions",
            icon: <Security />,
            href: "/settings/security",
            badge: "Important"
        },
        {
            id: "accounts",
            title: "Linked Accounts",
            description: "Connect and manage OAuth providers",
            icon: <LinkIcon />,
            href: "/settings/linked-accounts",
            badge: null
        },
        {
            id: "email",
            title: "Email Preferences",
            description: "Manage your email and communication settings",
            icon: <Email />,
            href: "/settings/email",
            badge: null
        },
        {
            id: "appearance",
            title: "Appearance",
            description: "Theme, colors, and display preferences",
            icon: <Palette />,
            href: "/settings/appearance",
            badge: null
        },
        {
            id: "notifications",
            title: "Notifications",
            description: "Configure notification preferences",
            icon: <Notifications />,
            href: "/settings/notifications",
            badge: null
        }
    ];

    // isAdmin is fetched server-side via /api/admin/is-admin

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <Warning className="text-6xl mb-4" style={{ color: palette.accent }} />
                    <h1 className="text-2xl font-bold mb-2" style={{ color: palette.textPrimary }}>
                        Authentication Required
                    </h1>
                    <p className="mb-6" style={{ color: palette.textSecondary }}>
                        Please sign in to access settings
                    </p>
                    <Link href="/auth/signin">
                        <motion.button
                            className="px-6 py-3 rounded-xl font-semibold"
                            style={{ background: palette.accent, color: "#ffffff" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Sign In
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: palette.background }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl" style={{ background: `${palette.accent}20` }}>
                            <Settings className="text-3xl" style={{ color: palette.accent }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>
                                Settings
                            </h1>
                            <p style={{ color: palette.textSecondary }}>
                                Manage your account preferences and settings
                            </p>
                        </div>
                    </div>
                </div>

                {/* User Info Card */}
                <motion.div
                    className="mb-6 p-6 rounded-2xl"
                    style={{
                        background: isApple
                            ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
                            : palette.surface,
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                    }}
                >
                    <div className="flex items-center gap-4">
                        <UserAvatar
                            userId={user?.id || ""}
                            name={user?.name}
                            email={user?.email}
                            image={user?.image}
                            size={64}
                        />
                        <div className="flex-1">
                            <h3 className="text-xl font-bold" style={{ color: palette.textPrimary }}>
                                {user?.name || "User"}
                            </h3>
                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Settings Sections */}
                <div className="space-y-4 flex flex-col gap-1">
                    {settingsSections.map((section) => (
                        <Link key={section.id} href={section.href}>
                            <motion.div
                                className="p-6 rounded-2xl cursor-pointer"
                                style={{
                                    background: isApple
                                        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
                                        : palette.surface,
                                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                                }}
                                whileHover={{
                                    scale: 1.01,
                                    backgroundColor: isApple
                                        ? isDark ? "rgba(44, 44, 48, 0.7)" : "rgba(255, 255, 255, 0.7)"
                                        : undefined
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div 
                                            className="p-3 rounded-xl" 
                                            style={{ background: `${palette.accent}15` }}
                                        >
                                            <div style={{ color: palette.accent }}>
                                                {section.icon}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                                                    {section.title}
                                                </h3>
                                                {section.badge && (
                                                    <span
                                                        className="px-2 py-0.5 text-xs font-semibold rounded-full"
                                                        style={{
                                                            background: `${palette.accent}20`,
                                                            color: palette.accent
                                                        }}
                                                    >
                                                        {section.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                                {section.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight style={{ color: palette.textTertiary }} />
                                </div>
                            </motion.div>
                        </Link>
                    ))}

                    {/* Admin Portal — only for ADMIN_EMAIL env var owner */}
                    {isAdmin && (
                        <>
                            <div className="pt-2 pb-1">
                                <p className="text-xs font-semibold uppercase tracking-widest"
                                    style={{ color: palette.textTertiary }}>
                                    Administration
                                </p>
                            </div>
                            <Link href="/admin">
                                <motion.div
                                    className="p-6 rounded-2xl cursor-pointer"
                                    style={{
                                        background: isApple
                                            ? isDark ? "rgba(220, 50, 50, 0.18)" : "rgba(220, 50, 50, 0.10)"
                                            : `${palette.accent}12`,
                                        border: `1.5px solid ${isDark ? "rgba(220,50,50,0.35)" : "rgba(220,50,50,0.25)"}`
                                    }}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4 flex-1">
                                            <div className="p-3 rounded-xl" style={{ background: "rgba(220,50,50,0.15)" }}>
                                                <AdminPanelSettings style={{ color: "#DC3232" }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                                                        Admin Portal
                                                    </h3>
                                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full"
                                                        style={{ background: "rgba(220,50,50,0.2)", color: "#DC3232" }}>
                                                        Owner Only
                                                    </span>
                                                </div>
                                                <p className="text-sm" style={{ color: palette.textSecondary }}>
                                                    Manage portfolio content, users, sitemap, and resume builder
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight style={{ color: "#DC3232" }} />
                                    </div>
                                </motion.div>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
