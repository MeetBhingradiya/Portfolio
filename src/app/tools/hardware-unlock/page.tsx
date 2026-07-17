/**
 * Hardware Unlock — /tools/hardware-unlock
 * Private tool gated by permission. Pairs a phone with a Windows client.
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    PhonelinkLock,
    QrCode2,
    PhoneAndroid,
    Computer,
    AdminPanelSettings,
    Security,
    ErrorOutline
} from "@mui/icons-material";

type AccessState = "loading" | "allowed" | "unauthorized" | "denied" | "error";

const REQUIRED_PERMISSION = "Tools.Private.HardwareUnlock.Access";

export default function HardwareUnlockToolPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [access, setAccess] = useState<AccessState>("loading");

    // Define cards before any conditional logic to follow React hooks rules
    const cards = useMemo(
        () => [
            {
                title: "Pairing",
                icon: <QrCode2 sx={{ fontSize: 18 }} />,
                items: [
                    "Generate a one-time pairing QR from the Windows client",
                    "Scan the QR in the mobile app to exchange public keys",
                    "Store the device binding in the server registry",
                    "Approve unlock requests with biometric confirmation"
                ]
            },
            {
                title: "Windows Client",
                icon: <Computer sx={{ fontSize: 18 }} />,
                items: [
                    "TypeScript service packaged as a Windows executable",
                    "Use Vercel pkg for fast TS to EXE prototypes",
                    "Runs in the tray and listens for unlock challenges",
                    "Validates signed responses before granting access"
                ]
            },
            {
                title: "Mobile App",
                icon: <PhoneAndroid sx={{ fontSize: 18 }} />,
                items: [
                    "React Native or native apps with secure key storage",
                    "AndroidManifest + iOS Info.plist declare permissions",
                    "Bluetooth, notifications, and biometric unlock support",
                    "Deep links for pairing and recovery flows"
                ]
            }
        ],
        []
    );

    useEffect(() => {
        let isActive = true;
        const checkAccess = async () => {
            try {
                const res = await fetch("/api/tools/hardware-unlock/access");
                if (!isActive) return;
                if (res.ok) {
                    setAccess("allowed");
                    return;
                }
                if (res.status === 401) {
                    setAccess("unauthorized");
                    return;
                }
                if (res.status === 403) {
                    setAccess("denied");
                    return;
                }
                setAccess("error");
            } catch {
                if (isActive) setAccess("error");
            }
        };
        checkAccess();
        return () => {
            isActive = false;
        };
    }, []);

    // Handle loading state
    if (access === "loading") {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div
                    className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    // Handle access denied states
    if (access !== "allowed") {
        const isUnauthorized = access === "unauthorized";
        const title = isUnauthorized ? "Sign in required" : "Access denied";
        const message = isUnauthorized
            ? "You must be signed in to use this tool."
            : `Permission required: ${REQUIRED_PERMISSION}`;

        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
                style={{ background: palette.background }}>
                <ErrorOutline style={{ fontSize: 56, color: "#FF3B30" }} />
                <h2
                    className={isApple ? "text-2xl font-bold" : "text-3xl font-black"}
                    style={{ color: palette.textPrimary }}>
                    {title}
                </h2>
                <p
                    className={isApple ? "text-sm" : "text-base font-medium"}
                    style={{ color: palette.textSecondary }}>
                    {message}
                </p>
                <div className="flex items-center gap-3">
                    {isUnauthorized ? (
                        <Link href="/auth/signin">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="px-5 py-2.5 rounded-xl font-bold"
                                style={{ background: palette.accent, color: "#fff" }}>
                                Sign In
                            </motion.button>
                        </Link>
                    ) : (
                        <Link href="/contact">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="px-5 py-2.5 rounded-xl font-bold"
                                style={{ background: palette.accent, color: "#fff" }}>
                                Request Access
                            </motion.button>
                        </Link>
                    )}
                    <Link href="/">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            className="px-5 py-2.5 rounded-xl font-bold"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                color: palette.textPrimary
                            }}>
                            Go Home
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <ToolPageWrapper
            title="Hardware Unlock"
            description="Private tool for phone-approved Windows unlocks"
            icon={<PhonelinkLock sx={{ fontSize: 24 }} />}
            accentColor="#0EA5E9">
            <div className="space-y-6">
                <Card>
                    <div className="flex items-start gap-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{
                                background: "rgba(14,165,233,0.18)",
                                color: "#0EA5E9",
                                border: "1px solid rgba(14,165,233,0.35)"
                            }}>
                            <Security sx={{ fontSize: 22 }} />
                        </div>
                        <div className="flex-1">
                            <h2
                                className={isApple ? "text-lg font-bold" : "text-xl font-black"}
                                style={{ color: palette.textPrimary }}>
                                Access policy
                            </h2>
                            <p
                                className="text-sm mt-1"
                                style={{ color: palette.textSecondary }}>
                                This tool is restricted to registered users with the permission key
                                <span style={{ color: palette.accent }}> {REQUIRED_PERMISSION}</span>.
                                Admins manage visibility and public access in
                                <Link
                                    href="/admin/tool-settings"
                                    className="underline ml-1"
                                    style={{ color: palette.accent }}>
                                    Tool Settings
                                </Link>.
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    className="px-4 py-2 rounded-full text-xs font-bold"
                                    style={{
                                        background: "rgba(14,165,233,0.18)",
                                        color: "#0EA5E9",
                                        border: "1px solid rgba(14,165,233,0.35)"
                                    }}>
                                    Private Tool
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    className="px-4 py-2 rounded-full text-xs font-bold"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                        color: palette.textSecondary,
                                        border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)"
                                    }}>
                                    Admin managed
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {cards.map((card) => (
                        <Card key={card.title}>
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                        color: palette.textPrimary
                                    }}>
                                    {card.icon}
                                </div>
                                <h3
                                    className={isApple ? "text-base font-bold" : "text-lg font-black"}
                                    style={{ color: palette.textPrimary }}>
                                    {card.title}
                                </h3>
                            </div>
                            <ul className="space-y-2 text-sm" style={{ color: palette.textSecondary }}>
                                {card.items.map((item) => (
                                    <li key={item}>• {item}</li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                    background: "rgba(52,199,89,0.18)",
                                    color: "#34C759",
                                    border: "1px solid rgba(52,199,89,0.35)"
                                }}>
                                <QrCode2 sx={{ fontSize: 18 }} />
                            </div>
                            <h3
                                className={isApple ? "text-base font-bold" : "text-lg font-black"}
                                style={{ color: palette.textPrimary }}>
                                Pairing workspace
                            </h3>
                        </div>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Pairing and approval workflows are coming soon. Use this workspace to
                            generate QR challenges, view paired devices, and revoke access.
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <button
                                disabled
                                className="px-4 py-2 rounded-xl text-sm font-bold"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                    color: palette.textTertiary,
                                    cursor: "not-allowed"
                                }}>
                                Generate Pairing QR
                            </button>
                            <span className="text-xs" style={{ color: palette.textTertiary }}>
                                Requires Windows client setup
                            </span>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                    background: "rgba(175,82,222,0.18)",
                                    color: "#AF52DE",
                                    border: "1px solid rgba(175,82,222,0.35)"
                                }}>
                                <AdminPanelSettings sx={{ fontSize: 18 }} />
                            </div>
                            <h3
                                className={isApple ? "text-base font-bold" : "text-lg font-black"}
                                style={{ color: palette.textPrimary }}>
                                Policy controls
                            </h3>
                        </div>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Admins can toggle visibility, featured status, and public access for this
                            tool in the Tool Settings page. Use per-user permissions to grant access
                            to specific accounts.
                        </p>
                        <div className="mt-4">
                            <Link href="/admin/tool-settings">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    className="px-4 py-2 rounded-xl text-sm font-bold"
                                    style={{ background: palette.accent, color: "#fff" }}>
                                    Open Tool Settings
                                </motion.button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolPageWrapper>
    );
}
