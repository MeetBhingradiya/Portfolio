/**
 * Active Sessions Management Page
 * View and manage logged-in devices
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth, listSessions, revokeSession, revokeOtherSessions } from "@Library/auth-client";
import Link from "next/link";
import {
    Devices,
    ArrowBack,
    Warning,
    Laptop,
    PhoneIphone,
    Tablet,
    DesktopWindows,
    CheckCircle,
    DeleteOutline,
    Apple,
    Android,
    Language,
    Computer,
    PhoneAndroid,
    TabletMac,
    Watch,
    Tv,
    DeviceUnknown
} from "@mui/icons-material";

interface Session {
    id: string;
    device: string;
    browser: string;
    location?: string;
    ip: string;
    createdAt: string;
    lastActive: string;
    isCurrent: boolean;
    userAgent?: string;
    platform?: string;
    deviceModel?: string;
}

interface DeviceInfo {
    deviceType: "desktop" | "mobile" | "tablet" | "watch" | "tv" | "unknown";
    platform: "windows" | "macos" | "linux" | "ios" | "android" | "unknown";
    browser: "chrome" | "firefox" | "safari" | "edge" | "opera" | "brave" | "unknown";
    deviceIcon: React.ReactNode;
    platformIcon: React.ReactNode;
    browserIcon: React.ReactNode;
    deviceName: string;
    browserName: string;
    platformName: string;
}

export default function SessionsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, isAuthenticated } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    useEffect(() => {
        if (isAuthenticated) {
            loadSessions();
        }
    }, [isAuthenticated]);

    const parseUserAgent = (userAgent: string = "", device: string = "", browser: string = ""): DeviceInfo => {
        const ua = userAgent.toLowerCase();

        // Detect Platform
        let platform: DeviceInfo["platform"] = "unknown";
        let platformName = "Unknown OS";
        let platformIcon = <Computer />;

        if (ua.includes("windows") || ua.includes("win64") || ua.includes("win32")) {
            platform = "windows";
            platformName = "Windows";
            platformIcon = <Computer />;
        } else if (ua.includes("macintosh") || ua.includes("mac os x")) {
            platform = "macos";
            platformName = "macOS";
            platformIcon = <Apple />;
        } else if (ua.includes("linux") && !ua.includes("android")) {
            platform = "linux";
            platformName = "Linux";
            platformIcon = <Computer />;
        } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
            platform = "ios";
            if (ua.includes("ipad")) {
                platformName = "iPadOS";
            } else {
                platformName = "iOS";
            }
            platformIcon = <Apple />;
        } else if (ua.includes("android")) {
            platform = "android";
            platformName = "Android";
            platformIcon = <Android />;
        }

        // Detect Browser
        let browserType: DeviceInfo["browser"] = "unknown";
        let browserName = browser || "Unknown Browser";
        let browserIcon = <Language />;

        if (ua.includes("edg/") || ua.includes("edge")) {
            browserType = "edge";
            browserName = "Microsoft Edge";
            browserIcon = <Language />; // Edge icon
        } else if (ua.includes("chrome") && !ua.includes("edg")) {
            browserType = "chrome";
            browserName = "Google Chrome";
            browserIcon = <Language />; // Chrome icon
        } else if (ua.includes("firefox")) {
            browserType = "firefox";
            browserName = "Firefox";
            browserIcon = <Language />; // Firefox icon
        } else if (ua.includes("safari") && !ua.includes("chrome")) {
            browserType = "safari";
            browserName = "Safari";
            browserIcon = <Language />; // Safari icon
        } else if (ua.includes("opera") || ua.includes("opr/")) {
            browserType = "opera";
            browserName = "Opera";
            browserIcon = <Language />; // Opera icon
        } else if (ua.includes("brave")) {
            browserType = "brave";
            browserName = "Brave";
            browserIcon = <Language />; // Brave icon
        }

        // Detect Device Type
        let deviceType: DeviceInfo["deviceType"] = "unknown";
        let deviceName = device || "Unknown Device";
        let deviceIcon = <DeviceUnknown />;

        if (ua.includes("mobile") || (ua.includes("android") && !ua.includes("tablet"))) {
            deviceType = "mobile";
            if (ua.includes("iphone")) {
                deviceName = "iPhone";
                deviceIcon = <PhoneIphone />;
            } else if (ua.includes("android")) {
                // Try to extract device model
                const modelMatch = ua.match(/android.*;\s*([^)]+)\s*build/i);
                if (modelMatch && modelMatch[1]) {
                    deviceName = modelMatch[1].trim();
                } else {
                    deviceName = "Android Phone";
                }
                deviceIcon = <PhoneAndroid />;
            } else {
                deviceIcon = <PhoneIphone />;
            }
        } else if (ua.includes("tablet") || ua.includes("ipad")) {
            deviceType = "tablet";
            if (ua.includes("ipad")) {
                deviceName = "iPad";
                deviceIcon = <TabletMac />;
            } else {
                deviceName = "Android Tablet";
                deviceIcon = <Tablet />;
            }
        } else if (ua.includes("watch")) {
            deviceType = "watch";
            deviceName = "Smart Watch";
            deviceIcon = <Watch />;
        } else if (ua.includes("tv")) {
            deviceType = "tv";
            deviceName = "Smart TV";
            deviceIcon = <Tv />;
        } else {
            deviceType = "desktop";
            if (platform === "macos") {
                deviceName = "Mac";
                deviceIcon = <Laptop />;
            } else if (platform === "windows") {
                deviceName = "Windows PC";
                deviceIcon = <DesktopWindows />;
            } else if (platform === "linux") {
                deviceName = "Linux PC";
                deviceIcon = <Computer />;
            } else {
                deviceName = "Desktop Computer";
                deviceIcon = <DesktopWindows />;
            }
        }

        return {
            deviceType,
            platform,
            browser: browserType,
            deviceIcon,
            platformIcon,
            browserIcon,
            deviceName,
            browserName,
            platformName
        };
    };

    const loadSessions = async () => {
        setLoading(true);
        try {
            const result = await listSessions();
            if (result.data) {
                setSessions(result.data as any);
            }
        } catch (error) {
            console.error("Failed to load sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeSession = async (sessionToken: string) => {
        if (!confirm("Are you sure you want to sign out from this device?")) return;

        try {
            await revokeSession({ token: sessionToken });
            await loadSessions();
        } catch (error) {
            console.error("Failed to revoke session:", error);
            alert("Failed to revoke session. Please try again.");
        }
    };

    const handleRevokeAllOthers = async () => {
        if (!confirm("Sign out from all other devices? You'll remain signed in on this device.")) return;

        try {
            await revokeOtherSessions();
            await loadSessions();
        } catch (error) {
            console.error("Failed to revoke sessions:", error);
            alert("Failed to revoke sessions. Please try again.");
        }
    };

    const getDeviceIcon = (device: string) => {
        const lower = device.toLowerCase();
        if (lower.includes("phone") || lower.includes("mobile")) return <PhoneIphone />;
        if (lower.includes("tablet") || lower.includes("ipad")) return <Tablet />;
        if (lower.includes("mac")) return <Laptop />;
        return <DesktopWindows />;
    };

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
                        Authentication Required
                    </h1>
                    <p
                        className="mb-6"
                        style={{ color: palette.textSecondary }}>
                        Please sign in to manage your sessions
                    </p>
                    <Link href="/auth/signin">
                        <motion.button
                            className="px-6 py-3 rounded-xl font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#ffffff"
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            Sign In
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen"
            style={{ background: palette.background }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/settings/security">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                                color: palette.textPrimary
                            }}>
                            <ArrowBack />
                            <span>Back to Security</span>
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div
                            className="p-3 rounded-2xl"
                            style={{ background: `${palette.accent}20` }}>
                            <Devices
                                className="text-3xl"
                                style={{ color: palette.accent }}
                            />
                        </div>
                        <div>
                            <h1
                                className="text-3xl font-bold"
                                style={{ color: palette.textPrimary }}>
                                Active Sessions
                            </h1>
                            <p style={{ color: palette.textSecondary }}>Manage devices where you're signed in</p>
                        </div>
                    </div>
                </div>

                {/* Revoke All Button */}
                <motion.div className="mb-6">
                    <motion.button
                        className="px-4 py-3 rounded-xl font-semibold"
                        style={{
                            background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: `1px solid rgba(239, 68, 68, 0.3)`
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRevokeAllOthers}>
                        Sign Out All Other Devices
                    </motion.button>
                </motion.div>

                {/* Sessions List */}
                <div className="space-y-4">
                    {loading ? (
                        <div
                            className="text-center py-8"
                            style={{ color: palette.textSecondary }}>
                            Loading sessions...
                        </div>
                    ) : sessions.length === 0 ? (
                        <motion.div
                            className="p-8 rounded-2xl text-center"
                            style={{
                                background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                            }}>
                            <Devices
                                className="text-5xl mb-3"
                                style={{ color: palette.textTertiary }}
                            />
                            <p
                                className="font-semibold"
                                style={{ color: palette.textSecondary }}>
                                No active sessions
                            </p>
                        </motion.div>
                    ) : (
                        sessions.map((session) => {
                            const deviceInfo = parseUserAgent(session.userAgent || "", session.device, session.browser);

                            return (
                                <motion.div
                                    key={session.id}
                                    className="p-6 rounded-2xl"
                                    style={{
                                        background: isApple
                                            ? isDark
                                                ? "rgba(38, 38, 42, 0.6)"
                                                : "rgba(255, 255, 255, 0.6)"
                                            : palette.surface,
                                        border: session.isCurrent
                                            ? `2px solid ${palette.accent}`
                                            : `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                                    }}
                                    whileHover={{ scale: 1.01 }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 flex-1">
                                            <div
                                                className="p-3 rounded-xl"
                                                style={{
                                                    background: `${palette.accent}15`
                                                }}>
                                                <div
                                                    style={{
                                                        color: palette.accent
                                                    }}>
                                                    {deviceInfo.deviceIcon}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4
                                                        className="text-lg font-bold"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {deviceInfo.deviceName}
                                                    </h4>
                                                    {session.isCurrent && (
                                                        <>
                                                            <CheckCircle
                                                                className="text-sm"
                                                                style={{
                                                                    color: "#22c55e"
                                                                }}
                                                            />
                                                            <span
                                                                className="px-2 py-0.5 text-xs font-semibold rounded-full"
                                                                style={{
                                                                    background: "#22c55e20",
                                                                    color: "#22c55e"
                                                                }}>
                                                                Current Device
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Browser & Platform Info */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            style={{
                                                                color: palette.textSecondary,
                                                                fontSize: "1rem"
                                                            }}>
                                                            {deviceInfo.browserIcon}
                                                        </div>
                                                        <span
                                                            className="text-sm font-medium"
                                                            style={{
                                                                color: palette.textSecondary
                                                            }}>
                                                            {deviceInfo.browserName}
                                                        </span>
                                                    </div>
                                                    <span
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        •
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            style={{
                                                                color: palette.textSecondary,
                                                                fontSize: "1rem"
                                                            }}>
                                                            {deviceInfo.platformIcon}
                                                        </div>
                                                        <span
                                                            className="text-sm font-medium"
                                                            style={{
                                                                color: palette.textSecondary
                                                            }}>
                                                            {deviceInfo.platformName}
                                                        </span>
                                                    </div>
                                                </div>

                                                {session.location && (
                                                    <p
                                                        className="text-xs mt-1"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        📍 {session.location} • {session.ip}
                                                    </p>
                                                )}
                                                <p
                                                    className="text-xs mt-1"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    🕐 Last active: {new Date(session.lastActive).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {!session.isCurrent && (
                                            <motion.button
                                                className="p-2 rounded-xl"
                                                style={{
                                                    color: "#ef4444",
                                                    background: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)"
                                                }}
                                                whileHover={{
                                                    scale: 1.1,
                                                    background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.12)"
                                                }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleRevokeSession(session.id)}>
                                                <DeleteOutline />
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
