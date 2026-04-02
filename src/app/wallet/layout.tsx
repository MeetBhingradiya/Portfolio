/**
 * Wallet Layout
 * Sidebar navigation + main content area.
 * Mirrors the Trade Journal layout pattern, adapted for themes.
 */

"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    Dashboard,
    AddCircleOutline,
    BarChart,
    ArrowBack,
    Menu,
    Close,
    AccountBalanceWallet,
    AccountBalance,
    Contacts
} from "@mui/icons-material";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/wallet", icon: <Dashboard /> },
    {
        label: "New Transaction",
        href: "/wallet/new",
        icon: <AddCircleOutline />
    },
    { label: "Assets", href: "/wallet/assets", icon: <AccountBalance /> },
    { label: "Analytics", href: "/wallet/analytics", icon: <BarChart /> },
    { label: "Contacts", href: "/wallet/contacts", icon: <Contacts /> }
];

export default function WalletLayout({ children }: { children: React.ReactNode }) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const pathname = usePathname();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const [mobileOpen, setMobileOpen] = useState(false);

    const surfaceBg = isApple ? (isDark ? "rgba(28, 28, 30, 0.92)" : "rgba(255, 255, 255, 0.88)") : palette.surface;

    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    function isActive(href: string) {
        if (href === "/wallet") return pathname === "/wallet";
        return pathname.startsWith(href);
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full p-4 gap-1">
            {/* Logo */}
            <div className="flex items-center gap-3 px-3 py-4 mb-2">
                <div
                    className="p-2 rounded-xl"
                    style={{ background: `${palette.accent}18` }}>
                    <AccountBalanceWallet style={{ color: palette.accent, fontSize: 22 }} />
                </div>
                <div>
                    <p
                        className="font-bold text-sm leading-tight"
                        style={{ color: palette.textPrimary }}>
                        Income Expense
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: palette.textSecondary }}>
                        Manager
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
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                                style={{
                                    background: active ? `${palette.accent}14` : "transparent",
                                    color: active ? palette.accent : palette.textSecondary,
                                    fontWeight: active ? 600 : 400
                                }}
                                whileHover={{
                                    scale: 1.02,
                                    background: `${palette.accent}10`
                                }}
                                whileTap={{ scale: 0.98 }}>
                                <span
                                    style={{
                                        color: active ? palette.accent : palette.textTertiary
                                    }}>
                                    {item.icon}
                                </span>
                                <span className="text-sm">{item.label}</span>
                                {active && (
                                    <motion.div
                                        layoutId="walletActiveIndicator"
                                        className="ml-auto w-1.5 h-1.5 rounded-full"
                                        style={{ background: palette.accent }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Back to settings */}
            <Link href="/settings">
                <motion.div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mt-2"
                    style={{ color: palette.textTertiary }}
                    whileHover={{ scale: 1.02, color: palette.textSecondary }}
                    whileTap={{ scale: 0.98 }}>
                    <ArrowBack fontSize="small" />
                    <span className="text-sm">Back to Settings</span>
                </motion.div>
            </Link>
        </div>
    );

    return (
        <div
            className="flex min-h-screen"
            style={{ background: palette.background }}>
            {/* Desktop sidebar */}
            <aside
                className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen"
                style={{
                    background: surfaceBg,
                    borderRight: `1px solid ${borderColor}`
                }}>
                <div className="flex flex-col h-full border-r border-[rgba(255,255,255,0.02)]">
                    <SidebarContent />
                </div>
            </aside>

            {/* Mobile top bar */}
            <div
                className="lg:hidden fixed left-0 right-0 z-[110] flex items-center justify-between px-4 py-3 backdrop-blur-md"
                style={{
                    top: "var(--global-header-offset, 64px)",
                    background: surfaceBg,
                    borderBottom: `1px solid ${borderColor}`
                }}>
                <div className="flex items-center gap-2">
                    <AccountBalanceWallet style={{ color: palette.accent, fontSize: 20 }} />
                    <span
                        className="font-bold text-sm"
                        style={{ color: palette.textPrimary }}>
                        Income Expense Manager
                    </span>
                </div>
                <button
                    onClick={() => setMobileOpen((v) => !v)}
                    style={{ color: palette.textPrimary }}>
                    {mobileOpen ? <Close /> : <Menu />}
                </button>
            </div>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            className="lg:hidden fixed left-0 right-0 bottom-0 z-[119]"
                            style={{
                                top: "var(--global-header-offset, 64px)",
                                background: "rgba(0,0,0,0.4)"
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            className="lg:hidden fixed left-0 bottom-0 w-60 z-[120] flex flex-col"
                            style={{
                                top: "var(--global-header-offset, 64px)",
                                background: surfaceBg,
                                borderRight: `1px solid ${borderColor}`
                            }}
                            initial={{ x: -240 }}
                            animate={{ x: 0 }}
                            exit={{ x: -240 }}
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
            <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">{children}</main>
        </div>
    );
}
