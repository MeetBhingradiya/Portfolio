/**
 * Admin Sidebar — Client Component
 * Adaptive sidebar styled with the portfolio design system
 * (Apple Liquid Glass ↔ Samsung One UI 7)
 *
 * Features:
 *  • Drag-to-resize (desktop)
 *  • Icon-only collapse mode
 *  • Per-group collapsable sections
 *  • Mobile overlay drawer
 *  • Tooltips in icon-only mode
 */

"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { useAdminSession } from "@Hooks/useAdminSession";
import { sidebarPermissions } from "./sidebarPermissions";
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
    PhotoCamera,
    CloudUpload,
    Construction,
    Article,
    ConfirmationNumber,
    ShoppingBag,
    AssignmentReturn,
    HelpOutline,
    ManageAccounts,
    SupportAgent,
    LocalOffer,
    ToggleOn,
    VpnKey,
    Apps,
    Psychology,
    ExpandMore,
    Menu as MenuIcon,
    Close,
    ArrowBack,
} from "@mui/icons-material";

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_WIDTH   = 64;
const MAX_WIDTH   = 320;
const DEFAULT_WIDTH = 220;
const ICON_THRESHOLD = 100; // below this → icon-only mode

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    exact?: boolean;
    group: string;
    permKey: "dashboard" | "users" | "roles" | "tickets" | "faq" | "employee" | "products" | "orders" | "refunds" | "sitemap" | "projects" | "skills" | "education" | "experience" | "certificates" | "test-scores" | "resume" | "blogs" | "features" | "tool-settings" | "ai-providers" | "maintenance" | "immich-access" | "cdn" | "cdn-applications" | "cdn-api-keys";
}

const allNavItems: NavItem[] = [
    { href: "/admin",                      label: "Dashboard",    icon: <Dashboard fontSize="small" />,       exact: true, group: "core", permKey: "dashboard" },
    { href: "/admin/users",                label: "Users",        icon: <People fontSize="small" />,          group: "core", permKey: "users" },
    { href: "/admin/roles",                label: "Roles & Perms",icon: <ManageAccounts fontSize="small" />,  group: "core", permKey: "roles" },
    { href: "/admin/tickets",              label: "Tickets",      icon: <ConfirmationNumber fontSize="small" />, group: "support", permKey: "tickets" },
    { href: "/admin/faq",                  label: "FAQ / Help",   icon: <HelpOutline fontSize="small" />,     group: "support", permKey: "faq" },
    { href: "/employee",                   label: "Employee Hub", icon: <SupportAgent fontSize="small" />,    group: "support", permKey: "employee" },
    { href: "/admin/products",             label: "Products",     icon: <LocalOffer fontSize="small" />,      group: "shop", permKey: "products" },
    { href: "/admin/orders",               label: "Orders",       icon: <ShoppingBag fontSize="small" />,     group: "shop", permKey: "orders" },
    { href: "/admin/refunds",              label: "Refunds",      icon: <AssignmentReturn fontSize="small" />,group: "shop", permKey: "refunds" },
    { href: "/admin/sitemap",              label: "Sitemap",      icon: <MapOutlined fontSize="small" />,     group: "portfolio", permKey: "sitemap" },
    { href: "/admin/projects",             label: "Projects",     icon: <Folder fontSize="small" />,          group: "portfolio", permKey: "projects" },
    { href: "/admin/skills",               label: "Skills",       icon: <Code fontSize="small" />,            group: "portfolio", permKey: "skills" },
    { href: "/admin/education",            label: "Education",    icon: <School fontSize="small" />,          group: "portfolio", permKey: "education" },
    { href: "/admin/experience",           label: "Experience",   icon: <Work fontSize="small" />,            group: "portfolio", permKey: "experience" },
    { href: "/admin/certificates",         label: "Certificates", icon: <WorkspacePremium fontSize="small" />,group: "portfolio", permKey: "certificates" },
    { href: "/admin/test-scores",          label: "Test Scores",  icon: <EmojiEvents fontSize="small" />,     group: "portfolio", permKey: "test-scores" },
    { href: "/admin/resume",               label: "Resume Builder",icon: <PictureAsPdf fontSize="small" />,   group: "portfolio", permKey: "resume" },
    { href: "/admin/blogs",                label: "Blogs",        icon: <Article fontSize="small" />,         group: "portfolio", permKey: "blogs" },
    { href: "/admin/features",             label: "Features",     icon: <ToggleOn fontSize="small" />,        group: "system", permKey: "features" },
    { href: "/admin/tool-settings",        label: "Tool Settings",icon: <Build fontSize="small" />,           group: "system", permKey: "tool-settings" },
    { href: "/admin/ai-providers",         label: "AI Providers", icon: <Psychology fontSize="small" />,      group: "system", permKey: "ai-providers" },
    { href: "/admin/maintenance",          label: "Maintenance",  icon: <Construction fontSize="small" />,    group: "system", permKey: "maintenance" },
    { href: "/admin/immich-access",        label: "Immich Access",icon: <PhotoCamera fontSize="small" />,     group: "system", permKey: "immich-access" },
    { href: "/admin/cdn",                  label: "CDN Assets",   icon: <CloudUpload fontSize="small" />,     exact: true, group: "system", permKey: "cdn" },
    { href: "/admin/cdn/applications",     label: "CDN Requests", icon: <Apps fontSize="small" />,            group: "system", permKey: "cdn-applications" },
    { href: "/admin/cdn/api-keys",         label: "CDN API Keys", icon: <VpnKey fontSize="small" />,          group: "system", permKey: "cdn-api-keys" },
];

const groups: { key: string; label: string }[] = [
    { key: "core",      label: "Core" },
    { key: "support",   label: "Support" },
    { key: "shop",      label: "Shop" },
    { key: "portfolio", label: "Portfolio" },
    { key: "system",    label: "System" },
];

// ─── Tooltip wrapper (shown in icon-only mode) ────────────────────────────────
function Tooltip({ label, children, show }: { label: string; children: React.ReactNode; show: boolean }) {
    const [visible, setVisible] = useState(false);
    if (!show) return <>{children}</>;
    return (
        <div
            className="relative"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-full top-1/2 ml-2 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none z-[9999]"
                        style={{
                            transform: "translateY(-50%)",
                            background: "rgba(0,0,0,0.85)",
                            color: "#fff",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Sidebar content (shared between desktop & mobile) ───────────────────────
function SidebarContent({
    iconOnly,
    palette,
    isDark,
    isApple,
    borderColor,
    collapsedGroups,
    toggleGroup,
    isActive,
    onClose,
    navItems,
    hasAnyPermission,
}: {
    iconOnly: boolean;
    palette: any;
    isDark: boolean;
    isApple: boolean;
    borderColor: string;
    collapsedGroups: Record<string, boolean>;
    toggleGroup: (key: string) => void;
    isActive: (href: string, exact?: boolean) => boolean;
    onClose?: () => void;
    navItems: typeof allNavItems;
    hasAnyPermission: (perms: string[]) => boolean;
}) {
    return (
        <>
            {/* Header */}
            <div
                className="flex items-center gap-3 px-3 py-4 border-b flex-shrink-0"
                style={{ borderColor }}
            >
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${palette.accent}20` }}
                >
                    <AdminPanelSettings style={{ color: palette.accent, fontSize: 18 }} />
                </div>
                <AnimatePresence>
                    {!iconOnly && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 min-w-0 overflow-hidden"
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
                {/* Mobile close button */}
                {onClose && (
                    <motion.button
                        className="ml-auto flex-shrink-0 p-1 rounded-lg"
                        style={{ color: palette.textSecondary }}
                        whileHover={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                    >
                        <Close fontSize="small" />
                    </motion.button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 admin-sidebar-scroll">
                {groups.map(group => {
                    const items = navItems.filter(n => {
                        if (n.group !== group.key) return false;
                        // Check permissions
                        const requiredPerms = sidebarPermissions[n.permKey];
                        // No permissions required = accessible to all
                        if (requiredPerms.length === 0) return true;
                        // Check if user has any of the required permissions
                        return hasAnyPermission(requiredPerms);
                    });

                    if (items.length === 0) return null; // Hide empty groups

                    const isGroupCollapsed = collapsedGroups[group.key] ?? false;
                    const hasActive = items.some(i => isActive(i.href, i.exact));

                    return (
                        <div key={group.key}>
                            {/* Group header — hidden in icon-only mode */}
                            {!iconOnly && (
                                <motion.button
                                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg mb-0.5 select-none"
                                    style={{ color: hasActive ? palette.accent : palette.textTertiary }}
                                    whileHover={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                                    onClick={() => toggleGroup(group.key)}
                                >
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {group.label}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: isGroupCollapsed ? -90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ExpandMore style={{ fontSize: 16 }} />
                                    </motion.div>
                                </motion.button>
                            )}

                            {/* Items */}
                            <AnimatePresence initial={false}>
                                {(!isGroupCollapsed || iconOnly) && (
                                    <motion.div
                                        key="items"
                                        initial={iconOnly ? false : { height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <div className={`space-y-0.5 ${!iconOnly ? "pb-1" : ""}`}>
                                            {items.map(item => {
                                                const active = isActive(item.href, item.exact);
                                                return (
                                                    <Tooltip key={item.href} label={item.label} show={iconOnly}>
                                                        <Link href={item.href} onClick={onClose}>
                                                            <motion.div
                                                                className={`flex items-center gap-3 rounded-xl cursor-pointer select-none ${iconOnly ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2"}`}
                                                                style={{
                                                                    background: active
                                                                        ? `${palette.accent}${isApple ? "22" : "18"}`
                                                                        : "transparent",
                                                                    color: active ? palette.accent : palette.textSecondary,
                                                                    fontWeight: active ? 700 : 500,
                                                                }}
                                                                whileHover={{
                                                                    background: active
                                                                        ? `${palette.accent}28`
                                                                        : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                                    scale: 1.01,
                                                                }}
                                                                whileTap={{ scale: 0.97 }}
                                                            >
                                                                <div
                                                                    className="flex-shrink-0"
                                                                    style={{ color: active ? palette.accent : palette.textTertiary }}
                                                                >
                                                                    {item.icon}
                                                                </div>
                                                                {!iconOnly && (
                                                                    <span className="text-sm whitespace-nowrap truncate">
                                                                        {item.label}
                                                                    </span>
                                                                )}
                                                                {active && !iconOnly && (
                                                                    <div
                                                                        className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                                        style={{ background: palette.accent }}
                                                                    />
                                                                )}
                                                            </motion.div>
                                                        </Link>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Divider between groups */}
                            {!iconOnly && (
                                <div
                                    className="mx-3 my-1 h-px"
                                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                                />
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            {!iconOnly && (
                <div className="border-t px-3 py-3 flex-shrink-0" style={{ borderColor }}>
                    <Link href="/">
                        <motion.div
                            className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ color: palette.textTertiary }}
                            whileHover={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: palette.textSecondary }}
                        >
                            <ArrowBack style={{ fontSize: 16 }} />
                            <span className="text-xs font-semibold">Back to Site</span>
                        </motion.div>
                    </Link>
                </div>
            )}
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminSidebar() {
    const pathname = usePathname();
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { hasAnyPermission, loading } = useAdminSession();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    // Desktop width state (resizeable)
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    // Mobile drawer
    const [mobileOpen, setMobileOpen] = useState(false);
    // Collapsable groups — all open by default
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const isResizing = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(DEFAULT_WIDTH);

    const iconOnly = width < ICON_THRESHOLD;

    // Filter nav items based on permissions
    const accessibleNavItems = useMemo(() => {
        if (loading) return []; // Show nothing while loading
        return allNavItems.filter(item => {
            const requiredPerms = sidebarPermissions[item.permKey];
            // No permissions required = accessible to all
            if (requiredPerms.length === 0) return true;
            // Check if user has any of the required permissions
            return hasAnyPermission(requiredPerms);
        });
    }, [loading, hasAnyPermission]);

    const isActive = useCallback((href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    }, [pathname]);

    const toggleGroup = useCallback((key: string) => {
        setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // ── Drag-to-resize ──────────────────────────────────────────────────────
    const onResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        startX.current = e.clientX;
        startWidth.current = width;

        const onMove = (ev: MouseEvent) => {
            if (!isResizing.current) return;
            const delta = ev.clientX - startX.current;
            const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
            setWidth(next);
        };
        const onUp = () => {
            isResizing.current = false;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [width]);

    // Close mobile drawer on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const sidebarBg = isApple
        ? isDark ? "rgba(18,18,20,0.92)" : "rgba(245,245,250,0.92)"
        : isDark ? "rgba(20,20,24,0.97)" : "rgba(248,248,252,0.97)";

    const sidebarBlur = isApple ? "blur(24px) saturate(180%)" : "none";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const sharedProps = { palette, isDark, isApple, borderColor, collapsedGroups, toggleGroup, isActive, navItems: accessibleNavItems, hasAnyPermission };

    return (
        <>
            {/* ── Mobile hamburger trigger ───────────────────────────── */}
            <motion.button
                className="fixed top-4 left-4 z-[60] md:hidden flex items-center justify-center w-10 h-10 rounded-xl shadow-lg"
                style={{
                    background: sidebarBg,
                    backdropFilter: sidebarBlur,
                    border: `1px solid ${borderColor}`,
                    color: palette.textPrimary
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setMobileOpen(true)}
            >
                <MenuIcon fontSize="small" />
            </motion.button>

            {/* ── Mobile overlay drawer ──────────────────────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-[70] md:hidden"
                            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                        />
                        {/* Drawer */}
                        <motion.aside
                            className="fixed top-0 left-0 h-full z-[80] md:hidden flex flex-col"
                            style={{
                                width: 260,
                                background: sidebarBg,
                                backdropFilter: sidebarBlur,
                                WebkitBackdropFilter: sidebarBlur,
                                borderRight: `1px solid ${borderColor}`,
                            }}
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <SidebarContent
                                {...sharedProps}
                                iconOnly={false}
                                onClose={() => setMobileOpen(false)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Desktop sidebar (resizeable) ───────────────────────── */}
            <motion.aside
                className="hidden md:flex sticky top-0 h-screen flex-col z-40 select-none"
                animate={{ width }}
                transition={{ duration: isResizing.current ? 0 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                    background: sidebarBg,
                    backdropFilter: sidebarBlur,
                    WebkitBackdropFilter: sidebarBlur,
                    borderRight: `1px solid ${borderColor}`,
                    flexShrink: 0,
                    minWidth: MIN_WIDTH,
                    maxWidth: MAX_WIDTH,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <SidebarContent {...sharedProps} iconOnly={iconOnly} />

                {/* Collapse / Expand button at bottom */}
                <div className="border-t px-2 py-2 flex-shrink-0 flex items-center justify-center gap-2" style={{ borderColor }}>
                    <motion.button
                        className="flex items-center justify-center w-8 h-8 rounded-xl"
                        style={{ color: palette.textTertiary }}
                        whileHover={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.9 }}
                        title={iconOnly ? "Expand sidebar" : "Collapse sidebar"}
                        onClick={() => setWidth(iconOnly ? DEFAULT_WIDTH : MIN_WIDTH)}
                    >
                        {iconOnly ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
                    </motion.button>
                </div>

                {/* Drag handle */}
                <div
                    onMouseDown={onResizeStart}
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize group z-10"
                    title="Drag to resize"
                    style={{ userSelect: "none" }}
                >
                    <div
                        className="h-full w-full transition-colors duration-150 group-hover:opacity-100 opacity-0"
                        style={{ background: palette.accent, opacity: 0 }}
                    />
                    {/* Visible drag pill on hover */}
                    <div
                        className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-200"
                        style={{ background: palette.accent }}
                    />
                </div>
            </motion.aside>
        </>
    );
}
