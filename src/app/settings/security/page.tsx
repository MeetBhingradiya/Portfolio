/**
 * Security Settings Page
 * Central hub for all security-related settings
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth } from "@Library/auth-client";
import Link from "next/link";
import {
    Security,
    Fingerprint,
    VpnKey,
    History,
    Devices,
    Warning,
    ChevronRight,
    CheckCircle,
    ArrowBack
} from "@mui/icons-material";

export default function SecuritySettingsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, isAuthenticated, revokeOtherSessions, changePassword } = useAuth();

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const handleSignOutAllDevices = async () => {
        if (!confirm("Sign out from all other devices? You'll remain signed in on this device.")) return;
        
        try {
            await revokeOtherSessions();
            alert("Successfully signed out from all other devices");
        } catch (error) {
            console.error("Failed to sign out from other devices:", error);
            alert("Failed to sign out. Please try again.");
        }
    };

    const handleChangePassword = async () => {
        // TODO: Implement password change flow
        alert("Password change feature coming soon");
    };

    const securityOptions = [
        {
            id: "two-factor",
            title: "Two-Factor Authentication",
            description: "Add an extra layer of security with 2FA",
            icon: <VpnKey />,
            href: "/settings/security/two-factor",
            enabled: false, // TODO: Get from user settings
            badge: "Recommended"
        },
        {
            id: "passkeys",
            title: "Passkeys",
            description: "Use biometrics for passwordless authentication",
            icon: <Fingerprint />,
            href: "/settings/security/passkeys",
            enabled: false, // TODO: Get from user settings
            badge: null
        },
        {
            id: "sessions",
            title: "Active Sessions",
            description: "Manage your logged-in devices",
            icon: <Devices />,
            href: "/settings/security/sessions",
            enabled: true,
            badge: null
        },
        {
            id: "activity",
            title: "Security Activity",
            description: "View your account security history",
            icon: <History />,
            href: "/settings/security/activity",
            enabled: true,
            badge: null
        }
    ];

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <Warning className="text-6xl mb-4" style={{ color: palette.accent }} />
                    <h1 className="text-2xl font-bold mb-2" style={{ color: palette.textPrimary }}>
                        Authentication Required
                    </h1>
                    <p className="mb-6" style={{ color: palette.textSecondary }}>
                        Please sign in to access security settings
                    </p>
                    <Link href="/auth/signin">
                        <motion.button
                            className="px-6 py-3 rounded-xl font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#ffffff"
                            }}
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
                    <Link href="/settings">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                                color: palette.textPrimary
                            }}
                        >
                            <ArrowBack />
                            <span>Back to Settings</span>
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl" style={{ background: `${palette.accent}20` }}>
                            <Security className="text-3xl" style={{ color: palette.accent }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>
                                Security Settings
                            </h1>
                            <p style={{ color: palette.textSecondary }}>
                                Manage your account security and privacy
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security Status Overview */}
                <motion.div
                    className="mb-6 p-6 rounded-2xl"
                    style={{
                        background: isDark 
                            ? "rgba(34, 197, 94, 0.1)" 
                            : "rgba(34, 197, 94, 0.08)",
                        border: `1px solid ${isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.15)"}`
                    }}
                >
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-2xl" style={{ color: "#22c55e" }} />
                        <div>
                            <h3 className="font-bold mb-1" style={{ color: "#22c55e" }}>
                                Security Score: Good
                            </h3>
                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                Your account has basic security measures enabled. Consider adding 2FA or passkeys for enhanced protection.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Security Options */}
                <div className="space-y-4 flex flex-col gap-1">
                    {securityOptions.map((option) => (
                        <Link key={option.id} href={option.href}>
                            <motion.div
                                className="p-6 rounded-2xl cursor-pointer"
                                style={{
                                    background: isApple
                                        ? isDark
                                            ? "rgba(38, 38, 42, 0.6)"
                                            : "rgba(255, 255, 255, 0.6)"
                                        : palette.surface,
                                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                                }}
                                whileHover={{
                                    scale: 1.01,
                                    backgroundColor: isApple
                                        ? isDark
                                            ? "rgba(44, 44, 48, 0.7)"
                                            : "rgba(255, 255, 255, 0.7)"
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
                                                {option.icon}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                                                    {option.title}
                                                </h3>
                                                {option.badge && (
                                                    <span
                                                        className="px-2 py-0.5 text-xs font-semibold rounded-full"
                                                        style={{
                                                            background: `${palette.accent}20`,
                                                            color: palette.accent
                                                        }}
                                                    >
                                                        {option.badge}
                                                    </span>
                                                )}
                                                {option.enabled && (
                                                    <CheckCircle 
                                                        className="text-sm" 
                                                        style={{ color: "#22c55e" }} 
                                                    />
                                                )}
                                            </div>
                                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight style={{ color: palette.textTertiary }} />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <motion.div
                    className="mt-8 p-6 rounded-2xl"
                    style={{
                        background: isApple
                            ? isDark
                                ? "rgba(38, 38, 42, 0.6)"
                                : "rgba(255, 255, 255, 0.6)"
                            : palette.surface,
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                    }}
                >
                    <h3 className="text-lg font-bold mb-4" style={{ color: palette.textPrimary }}>
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <motion.button
                            className="w-full px-4 py-3 rounded-xl text-left font-semibold"
                            style={{
                                background: palette.background,
                                color: palette.textPrimary,
                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleChangePassword}
                        >
                            Change Password
                        </motion.button>
                        <motion.button
                            className="w-full px-4 py-3 rounded-xl text-left font-semibold"
                            style={{
                                background: palette.background,
                                color: "#ef4444",
                                border: `1px solid rgba(239, 68, 68, 0.2)`
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleSignOutAllDevices}
                        >
                            Sign Out All Devices
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
