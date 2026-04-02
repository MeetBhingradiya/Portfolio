/**
 * Productivity Hub Layout
 * Sidebar navigation + main content — PWA installable, mobile-first.
 * Adapts to Apple (glassmorphism) and Samsung (One UI) design themes.
 */

"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { Dashboard, ChecklistRtl, Loop, TrackChanges, Notifications, ArrowBack, Menu, Close, Rocket, GetApp } from "@mui/icons-material";

const ACCENT = "#AF52DE";

const NAV_ITEMS = [
    {
        label: "Dashboard",
        href: "/tools/productivity",
        icon: <Dashboard fontSize="small" />
    },
    {
        label: "Tasks",
        href: "/tools/productivity/tasks",
        icon: <ChecklistRtl fontSize="small" />
    },
    {
        label: "Habits",
        href: "/tools/productivity/habits",
        icon: <Loop fontSize="small" />
    },
    {
        label: "Goals",
        href: "/tools/productivity/goals",
        icon: <TrackChanges fontSize="small" />
    },
    {
        label: "Reminders",
        href: "/tools/productivity/reminders",
        icon: <Notifications fontSize="small" />
    }
];

export default function ProductivityLayout({ children }: { children: React.ReactNode }) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const pathname = usePathname();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const [mobileOpen, setMobileOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Capture PWA install prompt
    typeof window !== "undefined" &&
        !installPrompt &&
        window.addEventListener(
            "beforeinstallprompt",
            (e: any) => {
                e.preventDefault();
                setInstallPrompt(e);
            },
            { once: true }
        );

    const surfaceBg = isApple ? (isDark ? "rgba(28, 28, 30, 0.95)" : "rgba(255, 255, 255, 0.92)") : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    function isActive(href: string) {
        if (href === "/tools/productivity") return pathname === "/tools/productivity";
        return pathname.startsWith(href);
    }

    async function handleInstall() {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") setInstallPrompt(null);
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full p-4 gap-1">
            {/* Brand */}
            <div className="flex items-center gap-3 px-3 py-4 mb-2">
                <div
                    className="p-2 rounded-xl shrink-0"
                    style={{ background: `${ACCENT}20` }}>
                    <Rocket style={{ color: ACCENT, fontSize: 22 }} />
                </div>
                <div className="min-w-0">
                    <p
                        className="font-bold text-sm leading-tight truncate"
                        style={{ color: palette.textPrimary }}>
                        Productivity Hub
                    </p>
                    <p
                        className="text-xs truncate"
                        style={{ color: palette.textSecondary }}>
                        Gamified · Personal
                    </p>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-1 flex-1">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}>
                            <motion.div
                                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer overflow-hidden"
                                style={{
                                    background: active ? `${ACCENT}16` : "transparent",
                                    color: active ? ACCENT : palette.textSecondary,
                                    fontWeight: active ? 600 : 400
                                }}
                                whileHover={{ background: `${ACCENT}10` }}
                                whileTap={{ scale: 0.98 }}>
                                <span
                                    style={{
                                        color: active ? ACCENT : palette.textTertiary
                                    }}>
                                    {item.icon}
                                </span>
                                <span className="text-sm flex-1">{item.label}</span>
                                {active && (
                                    <motion.div
                                        layoutId="prodActiveIndicator"
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ background: ACCENT }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Install PWA */}
            {installPrompt && (
                <motion.button
                    onClick={handleInstall}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl w-full text-left"
                    style={{ background: `${ACCENT}12`, color: ACCENT }}
                    whileHover={{ background: `${ACCENT}20` }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}>
                    <GetApp fontSize="small" />
                    <span className="text-sm font-medium">Install App</span>
                </motion.button>
            )}

            {/* Back */}
            <Link href="/settings">
                <motion.div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mt-1"
                    style={{ color: palette.textTertiary }}
                    whileHover={{
                        color: palette.textSecondary,
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
                    }}
                    whileTap={{ scale: 0.98 }}>
                    <ArrowBack fontSize="small" />
                    <span className="text-sm">Back to Settings</span>
                </motion.div>
            </Link>
        </div>
    );

    return (
        <>
            {/* PWA meta tags injected inline */}
            <link
                rel="manifest"
                href="/manifest.json"
            />
            <meta
                name="apple-mobile-web-app-capable"
                content="yes"
            />
            <meta
                name="apple-mobile-web-app-status-bar-style"
                content="black-translucent"
            />
            <meta
                name="apple-mobile-web-app-title"
                content="Productivity"
            />
            <meta
                name="theme-color"
                content="#AF52DE"
            />
            <meta
                name="mobile-web-app-capable"
                content="yes"
            />

            <div
                className="flex min-h-screen min-h-[100dvh]"
                style={{ background: palette.background }}>
                {/* Desktop sidebar */}
                <aside
                    className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen"
                    style={{
                        background: surfaceBg,
                        borderRight: `1px solid ${borderColor}`,
                        backdropFilter: isApple ? "blur(24px)" : "none"
                    }}>
                    <SidebarContent />
                </aside>

                {/* Mobile top bar */}
                <div
                    className="lg:hidden fixed left-0 right-0 z-[110] flex items-center justify-between px-4"
                    style={{
                        top: "var(--global-header-offset, 64px)",
                        background: surfaceBg,
                        borderBottom: `1px solid ${borderColor}`,
                        backdropFilter: isApple ? "blur(20px)" : "none",
                        height: 56,
                        paddingTop: "env(safe-area-inset-top)"
                    }}>
                    <div className="flex items-center gap-2">
                        <Rocket style={{ color: ACCENT, fontSize: 20 }} />
                        <span
                            className="font-bold text-sm"
                            style={{ color: palette.textPrimary }}>
                            Productivity Hub
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {installPrompt && (
                            <button
                                onClick={handleInstall}
                                className="p-1.5 rounded-lg"
                                style={{
                                    color: ACCENT,
                                    background: `${ACCENT}14`
                                }}>
                                <GetApp fontSize="small" />
                            </button>
                        )}
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="p-1.5 rounded-lg"
                            style={{ color: palette.textPrimary }}>
                            {mobileOpen ? <Close fontSize="small" /> : <Menu fontSize="small" />}
                        </button>
                    </div>
                </div>

                {/* Mobile drawer + backdrop */}
                <AnimatePresence>
                    {mobileOpen && (
                        <>
                            <motion.div
                                className="lg:hidden fixed left-0 right-0 bottom-0 z-[119]"
                                style={{
                                    top: "var(--global-header-offset, 64px)",
                                    background: "rgba(0,0,0,0.45)"
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileOpen(false)}
                            />
                            <motion.aside
                                className="lg:hidden fixed left-0 bottom-0 w-64 z-[120] flex flex-col"
                                style={{
                                    top: "var(--global-header-offset, 64px)",
                                    background: surfaceBg,
                                    borderRight: `1px solid ${borderColor}`,
                                    backdropFilter: isApple ? "blur(24px)" : "none",
                                    paddingTop: "env(safe-area-inset-top)"
                                }}
                                initial={{ x: -260 }}
                                animate={{ x: 0 }}
                                exit={{ x: -260 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 32
                                }}>
                                <SidebarContent />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main content */}
                <main
                    className="flex-1 overflow-y-auto"
                    style={{
                        paddingTop: "calc(var(--global-header-offset, 64px) + 56px + env(safe-area-inset-top))",
                        paddingBottom: "env(safe-area-inset-bottom)"
                    }}>
                    {/* On large screens remove mobile top-padding */}
                    <style>{`@media (min-width: 1024px) { main { padding-top: 0 !important; } }`}</style>
                    {children}
                </main>
            </div>
        </>
    );
}
