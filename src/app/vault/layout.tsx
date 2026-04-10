/**
 * Vault Layout
 * Sidebar navigation + main content area.
 * Mirrors the Trade Journal and Wallet layout patterns.
 * Accent colour: indigo (#6366F1).
 */

"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    Dashboard,
    CloudUpload,
    ArrowBack,
    Menu,
    Close,
    Lock,
    FolderSpecial
} from "@mui/icons-material";

const ACCENT = "#6366F1";

const NAV_ITEMS = [
    { label: "My Files", href: "/vault", icon: <Dashboard /> },
    { label: "Upload", href: "/vault/upload", icon: <CloudUpload /> }
];

export default function VaultLayout({ children }: { children: React.ReactNode }) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const pathname = usePathname();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const [mobileOpen, setMobileOpen] = useState(false);

    const surfaceBg = isApple ? (isDark ? "rgba(28, 28, 30, 0.92)" : "rgba(255, 255, 255, 0.88)") : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    function isActive(href: string) {
        if (href === "/vault") return pathname === "/vault";
        return pathname.startsWith(href);
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full p-4 gap-1">
            {/* Logo */}
            <div className="flex items-center gap-3 px-3 py-4 mb-2">
                <div
                    className="p-2 rounded-xl"
                    style={{ background: `${ACCENT}20` }}>
                    <Lock style={{ color: ACCENT, fontSize: 22 }} />
                </div>
                <div>
                    <p
                        className="font-bold text-sm leading-tight"
                        style={{ color: palette.textPrimary }}>
                        Private Vault
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: palette.textSecondary }}>
                        Encrypted Storage
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
                                    background: active ? `${ACCENT}18` : "transparent",
                                    color: active ? ACCENT : palette.textSecondary,
                                    fontWeight: active ? 600 : 400
                                }}
                                whileHover={{ scale: 1.02, background: `${ACCENT}10` }}
                                whileTap={{ scale: 0.98 }}>
                                <span style={{ color: active ? ACCENT : palette.textTertiary }}>{item.icon}</span>
                                <span className="text-sm">{item.label}</span>
                                {active && (
                                    <motion.div
                                        layoutId="vaultActiveIndicator"
                                        className="ml-auto w-1.5 h-1.5 rounded-full"
                                        style={{ background: ACCENT }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Storage section label */}
            <div
                className="px-3 py-1 mb-1 mt-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: palette.textTertiary }}>
                Storage
            </div>
            <div
                className="mx-3 mb-3 p-3 rounded-xl text-xs"
                style={{ background: `${ACCENT}10`, color: palette.textSecondary }}>
                <div className="flex items-center gap-2 mb-2">
                    <FolderSpecial style={{ fontSize: 16, color: ACCENT }} />
                    <span style={{ color: palette.textPrimary, fontWeight: 600 }}>Vault Storage</span>
                </div>
                <StorageBar />
            </div>

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
                className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen"
                style={{ background: surfaceBg, borderRight: `1px solid ${borderColor}` }}>
                <SidebarContent />
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
                    <Lock style={{ color: ACCENT, fontSize: 20 }} />
                    <span
                        className="font-bold text-sm"
                        style={{ color: palette.textPrimary }}>
                        Private Vault
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
                            style={{ top: "var(--global-header-offset, 64px)", background: "rgba(0,0,0,0.4)" }}
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
                                borderRight: `1px solid ${borderColor}`
                            }}
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}>
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

// ── Storage bar (fetches usage from /api/vault/storage) ───────────────────────

function StorageBar() {
    const [data, setData] = React.useState<{ usedBytes: number; limitBytes: number } | null>(null);

    React.useEffect(() => {
        fetch("/api/vault/storage")
            .then((r) => r.json())
            .then((j) => {
                if (j.usedBytes !== undefined) setData({ usedBytes: j.usedBytes, limitBytes: j.limitBytes });
            })
            .catch(() => {});
    }, []);

    if (!data) return <div className="text-xs opacity-60">Loading…</div>;

    const pct = Math.min(100, (data.usedBytes / data.limitBytes) * 100);
    const color = pct > 90 ? "#EF4444" : pct > 70 ? "#F59E0B" : ACCENT;

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span>{formatBytes(data.usedBytes)} used</span>
                <span>{formatBytes(data.limitBytes)}</span>
            </div>
            <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(128,128,128,0.2)" }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}
