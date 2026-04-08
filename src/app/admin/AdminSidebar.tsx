/**
 * Admin Sidebar — Client Component
 * Adaptive sidebar styled with the portfolio design system
 * (Apple Liquid Glass ↔ Samsung One UI 7)
 *
 * Features:
 *  • Drag-to-resize (desktop)
 *  • Icon-only collapse mode
 *  • Per-group collapsable sections
 *  • Mobile + tablet overlay drawer
 *  • Universal search across admin features
 *  • Drag-and-drop category ordering
 *  • Reduced state complexity via reducer
 */

"use client";

import React, { useReducer, useRef, useEffect, useCallback, useMemo } from "react";
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
    Description,
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
    SyncAlt,
    ExpandMore,
    Search,
    DragIndicator,
    Visibility,
    VisibilityOff,
    Menu as MenuIcon,
    Close,
    ArrowBack
} from "@mui/icons-material";

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_WIDTH = 68;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 260;
const ICON_THRESHOLD = 100; // below this → icon-only mode
const DB_SYNC_VISIBLE = process.env.NODE_ENV !== "production";
const DESKTOP_BREAKPOINT = "(min-width: 1280px)";

const STORAGE_KEYS = {
    width: "admin.sidebar.width",
    collapsedGroups: "admin.sidebar.collapsed-groups",
    groupOrder: "admin.sidebar.group-order",
    desktopHidden: "admin.sidebar.desktop-hidden"
} as const;

const groups = [
    { key: "core", label: "Core" },
    { key: "system", label: "System" },
    { key: "portfolio", label: "Portfolio" },
    { key: "shop", label: "Shop" },
    { key: "support", label: "Support" }
] as const;

type GroupKey = (typeof groups)[number]["key"];

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    exact?: boolean;
    group: GroupKey;
    permKey:
    | "dashboard"
    | "users"
    | "roles"
    | "tickets"
    | "faq"
    | "employee"
    | "products"
    | "orders"
    | "refunds"
    | "sitemap"
    | "projects"
    | "documents"
    | "skills"
    | "education"
    | "experience"
    | "certificates"
    | "test-scores"
    | "resume"
    | "blogs"
    | "features"
    | "tools"
    | "tool-settings"
    | "ai-providers"
    | "maintenance"
    | "immich-access"
    | "db-sync"
    | "cdn"
    | "cdn-applications"
    | "cdn-api-keys";
}

const allNavItems: NavItem[] = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: <Dashboard fontSize="small" />,
        exact: true,
        group: "core",
        permKey: "dashboard"
    },
    {
        href: "/admin/users",
        label: "Users",
        icon: <People fontSize="small" />,
        group: "core",
        permKey: "users"
    },
    {
        href: "/admin/roles",
        label: "Roles & Perms",
        icon: <ManageAccounts fontSize="small" />,
        group: "core",
        permKey: "roles"
    },
    {
        href: "/admin/tickets",
        label: "Tickets",
        icon: <ConfirmationNumber fontSize="small" />,
        group: "support",
        permKey: "tickets"
    },
    {
        href: "/admin/faq",
        label: "FAQ / Help",
        icon: <HelpOutline fontSize="small" />,
        group: "support",
        permKey: "faq"
    },
    {
        href: "/employee",
        label: "Employee Hub",
        icon: <SupportAgent fontSize="small" />,
        group: "support",
        permKey: "employee"
    },
    {
        href: "/admin/products",
        label: "Products",
        icon: <LocalOffer fontSize="small" />,
        group: "shop",
        permKey: "products"
    },
    {
        href: "/admin/orders",
        label: "Orders",
        icon: <ShoppingBag fontSize="small" />,
        group: "shop",
        permKey: "orders"
    },
    {
        href: "/admin/refunds",
        label: "Refunds",
        icon: <AssignmentReturn fontSize="small" />,
        group: "shop",
        permKey: "refunds"
    },
    {
        href: "/admin/sitemap",
        label: "Sitemap",
        icon: <MapOutlined fontSize="small" />,
        group: "portfolio",
        permKey: "sitemap"
    },
    {
        href: "/admin/projects",
        label: "Projects",
        icon: <Folder fontSize="small" />,
        group: "portfolio",
        permKey: "projects"
    },
    {
        href: "/admin/documents",
        label: "Documents",
        icon: <Description fontSize="small" />,
        group: "portfolio",
        permKey: "documents"
    },
    {
        href: "/admin/skills",
        label: "Skills",
        icon: <Code fontSize="small" />,
        group: "portfolio",
        permKey: "skills"
    },
    {
        href: "/admin/education",
        label: "Education",
        icon: <School fontSize="small" />,
        group: "portfolio",
        permKey: "education"
    },
    {
        href: "/admin/experience",
        label: "Experience",
        icon: <Work fontSize="small" />,
        group: "portfolio",
        permKey: "experience"
    },
    {
        href: "/admin/certificates",
        label: "Certificates",
        icon: <WorkspacePremium fontSize="small" />,
        group: "portfolio",
        permKey: "certificates"
    },
    {
        href: "/admin/test-scores",
        label: "Test Scores",
        icon: <EmojiEvents fontSize="small" />,
        group: "portfolio",
        permKey: "test-scores"
    },
    {
        href: "/admin/resume",
        label: "Resume Builder",
        icon: <PictureAsPdf fontSize="small" />,
        group: "portfolio",
        permKey: "resume"
    },
    {
        href: "/admin/blogs",
        label: "Blogs",
        icon: <Article fontSize="small" />,
        group: "portfolio",
        permKey: "blogs"
    },
    {
        href: "/admin/features",
        label: "Features",
        icon: <ToggleOn fontSize="small" />,
        group: "system",
        permKey: "features"
    },
    {
        href: "/admin/tool-settings",
        label: "Tool Settings",
        icon: <Build fontSize="small" />,
        group: "system",
        permKey: "tool-settings"
    },
    {
        href: "/admin/ai-providers",
        label: "AI Providers",
        icon: <Psychology fontSize="small" />,
        group: "system",
        permKey: "ai-providers"
    },
    {
        href: "/admin/maintenance",
        label: "Maintenance",
        icon: <Construction fontSize="small" />,
        group: "system",
        permKey: "maintenance"
    },
    {
        href: "/admin/immich-access",
        label: "Immich Access",
        icon: <PhotoCamera fontSize="small" />,
        group: "system",
        permKey: "immich-access"
    },
    {
        href: "/admin/db-sync",
        label: "DB Sync",
        icon: <SyncAlt fontSize="small" />,
        group: "system",
        permKey: "db-sync"
    },
    {
        href: "/admin/cdn",
        label: "CDN Assets",
        icon: <CloudUpload fontSize="small" />,
        exact: true,
        group: "system",
        permKey: "cdn"
    },
    {
        href: "/admin/cdn/applications",
        label: "CDN Requests",
        icon: <Apps fontSize="small" />,
        group: "system",
        permKey: "cdn-applications"
    },
    {
        href: "/admin/cdn/api-keys",
        label: "CDN API Keys",
        icon: <VpnKey fontSize="small" />,
        group: "system",
        permKey: "cdn-api-keys"
    }
];

type CollapsedGroupsState = Record<GroupKey, boolean>;

interface UIState {
    width: number;
    mobileOpen: boolean;
    desktopHidden: boolean;
    query: string;
    groupOrder: GroupKey[];
    collapsedGroups: CollapsedGroupsState;
    draggingGroup: GroupKey | null;
}

type UIAction =
    | { type: "SET_WIDTH"; payload: number }
    | { type: "SET_QUERY"; payload: string }
    | { type: "OPEN_MOBILE" }
    | { type: "CLOSE_MOBILE" }
    | { type: "TOGGLE_DESKTOP_HIDDEN" }
    | { type: "TOGGLE_GROUP"; payload: GroupKey }
    | { type: "SET_GROUP_ORDER"; payload: GroupKey[] }
    | { type: "SET_DRAGGING_GROUP"; payload: GroupKey | null }
    | {
        type: "HYDRATE";
        payload: Partial<Pick<UIState, "width" | "groupOrder" | "collapsedGroups" | "desktopHidden">>;
    };

const defaultCollapsedGroups = groups.reduce(
    (acc, group) => {
        acc[group.key] = true;
        return acc;
    },
    {} as CollapsedGroupsState
);

const defaultGroupOrder: GroupKey[] = groups.map((g) => g.key);

const initialState: UIState = {
    width: DEFAULT_WIDTH,
    mobileOpen: false,
    desktopHidden: false,
    query: "",
    groupOrder: defaultGroupOrder,
    collapsedGroups: defaultCollapsedGroups,
    draggingGroup: null
};

function normalizeGroupOrder(order: string[]): GroupKey[] {
    const validKeys = new Set(groups.map((g) => g.key));
    const normalized = order.filter((key): key is GroupKey => validKeys.has(key as GroupKey));
    for (const group of groups) {
        if (!normalized.includes(group.key)) normalized.push(group.key);
    }
    return normalized;
}

function reorderGroups(list: GroupKey[], source: GroupKey, target: GroupKey): GroupKey[] {
    if (source === target) return list;
    const sourceIndex = list.indexOf(source);
    const targetIndex = list.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0) return list;

    const next = [...list];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    return next;
}

function reducer(state: UIState, action: UIAction): UIState {
    switch (action.type) {
        case "SET_WIDTH":
            return { ...state, width: action.payload };
        case "SET_QUERY":
            return { ...state, query: action.payload };
        case "OPEN_MOBILE":
            return { ...state, mobileOpen: true };
        case "CLOSE_MOBILE":
            return { ...state, mobileOpen: false };
        case "TOGGLE_DESKTOP_HIDDEN":
            return { ...state, desktopHidden: !state.desktopHidden };
        case "TOGGLE_GROUP":
            // Keep accordion behavior: only one group can be open at a time.
            // `true` means collapsed, `false` means expanded.
            const isCurrentlyCollapsed = state.collapsedGroups[action.payload];
            const nextGroups = { ...state.collapsedGroups };
            for (const group of groups) {
                nextGroups[group.key] = true;
            }
            nextGroups[action.payload] = !isCurrentlyCollapsed;
            return {
                ...state,
                collapsedGroups: nextGroups
            };
        case "SET_GROUP_ORDER":
            return {
                ...state,
                groupOrder: action.payload
            };
        case "SET_DRAGGING_GROUP":
            return {
                ...state,
                draggingGroup: action.payload
            };
        case "HYDRATE":
            return {
                ...state,
                ...action.payload,
                collapsedGroups: action.payload.collapsedGroups ?? state.collapsedGroups,
                groupOrder: action.payload.groupOrder ?? state.groupOrder
            };
        default:
            return state;
    }
}

// ─── Tooltip wrapper (shown in icon-only mode) ────────────────────────────────
function Tooltip({ label, children, show }: { label: string; children: React.ReactNode; show: boolean }) {
    const [visible, setVisible] = React.useState(false);
    if (!show) return <>{children}</>;
    return (
        <div
            className="relative"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}>
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
                        }}>
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
    query,
    setQuery,
    groupOrder,
    groupedItems,
    collapsedGroups,
    toggleGroup,
    isActive,
    draggingGroup,
    startDrag,
    endDrag,
    onDropGroup,
    searchInputRef,
    clearSearch,
    onToggleCompact,
    onClose,
    showHideControl,
    toggleDesktopHidden
}: {
    iconOnly: boolean;
    palette: any;
    isDark: boolean;
    isApple: boolean;
    borderColor: string;
    query: string;
    setQuery: (value: string) => void;
    groupOrder: GroupKey[];
    groupedItems: Record<GroupKey, NavItem[]>;
    collapsedGroups: CollapsedGroupsState;
    toggleGroup: (key: GroupKey) => void;
    isActive: (href: string, exact?: boolean) => boolean;
    draggingGroup: GroupKey | null;
    startDrag: (key: GroupKey) => void;
    endDrag: () => void;
    onDropGroup: (target: GroupKey) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    clearSearch: () => void;
    onToggleCompact?: () => void;
    onClose?: () => void;
    showHideControl?: boolean;
    toggleDesktopHidden?: () => void;
}) {
    const hasQuery = query.trim().length > 0;

    return (
        <>
            {/* Top section: title + controls + search */}
            <div
                className="px-3 py-3 border-b flex-shrink-0"
                style={{ borderColor }}>
                <div className="flex items-center gap-3">
                    <div
                        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `${palette.accent}20` }}>
                        <AdminPanelSettings style={{ color: palette.accent, fontSize: 18 }} />
                    </div>
                    <AnimatePresence>
                        {!iconOnly && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex-1 min-w-0 overflow-hidden">
                                <p
                                    className="text-sm font-black truncate"
                                    style={{ color: palette.textPrimary }}>
                                    Admin Portal
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!onClose && onToggleCompact && (
                        <motion.button
                            className="flex-shrink-0 p-1 rounded-lg"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                            }}
                            whileTap={{ scale: 0.9 }}
                            title={iconOnly ? "Expand sidebar" : "Collapse sidebar"}
                            onClick={onToggleCompact}>
                            {iconOnly ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
                        </motion.button>
                    )}

                    {showHideControl && toggleDesktopHidden && !iconOnly && (
                        <motion.button
                            className="flex-shrink-0 p-1 rounded-lg"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                            }}
                            whileTap={{ scale: 0.9 }}
                            title="Hide sidebar"
                            onClick={toggleDesktopHidden}>
                            <VisibilityOff fontSize="small" />
                        </motion.button>
                    )}

                    {/* Mobile close button */}
                    {onClose && (
                        <motion.button
                            className="ml-auto flex-shrink-0 p-1 rounded-lg"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                            }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}>
                            <Close fontSize="small" />
                        </motion.button>
                    )}
                </div>

                {!iconOnly && (
                    <div className="mt-2">
                        <div
                            className="flex items-center gap-2 rounded-xl px-2.5 py-2 border"
                            style={{
                                borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
                            }}>
                            <Search
                                style={{
                                    fontSize: 18,
                                    color: palette.textTertiary,
                                    flexShrink: 0
                                }}
                            />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search admin features..."
                                className="w-full bg-transparent text-sm outline-none"
                                style={{ color: palette.textPrimary }}
                                aria-label="Search admin features"
                            />
                            {hasQuery && (
                                <motion.button
                                    className="p-1 rounded-md flex-shrink-0"
                                    style={{ color: palette.textTertiary }}
                                    whileHover={{
                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                                    }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={clearSearch}
                                    aria-label="Clear search">
                                    <Close style={{ fontSize: 16 }} />
                                </motion.button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto pt-2 pb-4 px-1.5 space-y-0.5 admin-sidebar-scroll">

                {groupOrder.map((groupKey) => {
                    const group = groups.find((g) => g.key === groupKey);
                    if (!group) return null;
                    const items = groupedItems[group.key] ?? [];

                    if (items.length === 0) return null; // Hide empty groups

                    const isGroupCollapsed = collapsedGroups[group.key] ?? false;
                    const hasActive = items.some((i) => isActive(i.href, i.exact));
                    const showItems = hasQuery || !isGroupCollapsed || iconOnly;
                    const isDragging = draggingGroup === group.key;

                    return (
                        <div key={group.key}>
                            {/* Group header — hidden in icon-only mode */}
                            {!iconOnly && (
                                <motion.button
                                    draggable
                                    onDragStart={() => startDrag(group.key)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => onDropGroup(group.key)}
                                    onDragEnd={endDrag}
                                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg mb-0.5 select-none"
                                    style={{
                                        color: hasActive ? palette.accent : palette.textTertiary,
                                        opacity: isDragging ? 0.6 : 1,
                                        border: isDragging
                                            ? `1px dashed ${palette.accent}`
                                            : "1px solid transparent"
                                    }}
                                    whileHover={{
                                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
                                    }}
                                    onClick={() => toggleGroup(group.key)}>
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        <DragIndicator style={{ fontSize: 15 }} />
                                        <span className="text-xs font-black uppercase tracking-widest truncate">{group.label}</span>
                                    </span>
                                    {!hasQuery && (
                                        <motion.div
                                            animate={{
                                                rotate: isGroupCollapsed ? -90 : 0
                                            }}
                                            transition={{ duration: 0.2 }}>
                                            <ExpandMore style={{ fontSize: 16 }} />
                                        </motion.div>
                                    )}
                                </motion.button>
                            )}

                            {/* Items */}
                            <AnimatePresence initial={false}>
                                {showItems && (
                                    <motion.div
                                        key="items"
                                        initial={iconOnly ? false : { height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            duration: 0.22,
                                            ease: [0.25, 0.46, 0.45, 0.94]
                                        }}
                                        style={{ overflow: "hidden" }}>
                                        <div className={`space-y-0.5 ${!iconOnly ? "pb-1" : ""}`}>
                                            {items.map((item) => {
                                                const active = isActive(item.href, item.exact);
                                                return (
                                                    <Tooltip
                                                        key={item.href}
                                                        label={item.label}
                                                        show={iconOnly}>
                                                        <Link
                                                            href={item.href}
                                                            onClick={onClose}>
                                                            <motion.div
                                                                className={`flex items-center gap-3 rounded-xl cursor-pointer select-none ${iconOnly ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2"}`}
                                                                style={{
                                                                    background: active
                                                                        ? `${palette.accent}${isApple ? "22" : "18"}`
                                                                        : "transparent",
                                                                    color: active ? palette.accent : palette.textSecondary,
                                                                    fontWeight: active ? 700 : 500
                                                                }}
                                                                whileHover={{
                                                                    background: active
                                                                        ? `${palette.accent}28`
                                                                        : isDark
                                                                            ? "rgba(255,255,255,0.06)"
                                                                            : "rgba(0,0,0,0.04)",
                                                                    scale: 1.01
                                                                }}
                                                                whileTap={{
                                                                    scale: 0.97
                                                                }}>
                                                                <div
                                                                    className="flex-shrink-0"
                                                                    style={{
                                                                        color: active ? palette.accent : palette.textTertiary
                                                                    }}>
                                                                    {item.icon}
                                                                </div>
                                                                {!iconOnly && (
                                                                    <span className="text-sm whitespace-nowrap truncate">{item.label}</span>
                                                                )}
                                                                {active && !iconOnly && (
                                                                    <div
                                                                        className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                                        style={{
                                                                            background: palette.accent
                                                                        }}
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
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                                    }}
                                />
                            )}
                        </div>
                    );
                })}

                {hasQuery &&
                    groupOrder.every((groupKey) => {
                        const items = groupedItems[groupKey] ?? [];
                        return items.length === 0;
                    }) && (
                        <div
                            className="px-3 py-3 text-xs rounded-lg mx-1"
                            style={{
                                color: palette.textTertiary,
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                            }}>
                            No matching admin features for "{query}".
                        </div>
                    )}
            </nav>
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

    const [ui, dispatch] = useReducer(reducer, initialState);

    const isResizing = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(DEFAULT_WIDTH);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const iconOnly = ui.width < ICON_THRESHOLD;

    // Hydrate persisted sidebar preferences
    useEffect(() => {
        try {
            const storedWidth = Number(localStorage.getItem(STORAGE_KEYS.width));
            const storedDesktopHidden = localStorage.getItem(STORAGE_KEYS.desktopHidden);
            const storedGroupOrder = localStorage.getItem(STORAGE_KEYS.groupOrder);
            const storedCollapsed = localStorage.getItem(STORAGE_KEYS.collapsedGroups);

            const hydrated: Partial<
                Pick<UIState, "width" | "desktopHidden" | "groupOrder" | "collapsedGroups">
            > = {};

            if (!Number.isNaN(storedWidth) && storedWidth >= MIN_WIDTH && storedWidth <= MAX_WIDTH) {
                hydrated.width = storedWidth;
            }

            if (storedDesktopHidden === "true" || storedDesktopHidden === "false") {
                hydrated.desktopHidden = storedDesktopHidden === "true";
            }

            if (storedGroupOrder) {
                const parsed = JSON.parse(storedGroupOrder) as string[];
                hydrated.groupOrder = normalizeGroupOrder(Array.isArray(parsed) ? parsed : []);
            }

            if (storedCollapsed) {
                const parsed = JSON.parse(storedCollapsed) as Partial<CollapsedGroupsState>;
                const nextCollapsed = { ...defaultCollapsedGroups };
                for (const group of groups) {
                    nextCollapsed[group.key] = Boolean(parsed[group.key]);
                }
                hydrated.collapsedGroups = nextCollapsed;
            }

            dispatch({ type: "HYDRATE", payload: hydrated });
        } catch {
            // Ignore invalid persisted state and continue with defaults.
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.width, String(ui.width));
    }, [ui.width]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.desktopHidden, String(ui.desktopHidden));
    }, [ui.desktopHidden]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.groupOrder, JSON.stringify(ui.groupOrder));
    }, [ui.groupOrder]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.collapsedGroups, JSON.stringify(ui.collapsedGroups));
    }, [ui.collapsedGroups]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
            if (!isSearchShortcut) return;

            event.preventDefault();

            const isDesktop = window.matchMedia(DESKTOP_BREAKPOINT).matches;
            if (!isDesktop) {
                dispatch({ type: "OPEN_MOBILE" });
            }

            requestAnimationFrame(() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            });
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const setQuery = useCallback((value: string) => {
        dispatch({ type: "SET_QUERY", payload: value });
    }, []);

    // Filter nav items based on permissions
    const accessibleNavItems = useMemo(() => {
        if (loading) return []; // Show nothing while loading
        return allNavItems.filter((item) => {
            if (item.permKey === "db-sync" && !DB_SYNC_VISIBLE) return false;

            const requiredPerms = sidebarPermissions[item.permKey];
            // No permissions required = accessible to all
            if (requiredPerms.length === 0) return true;
            // Check if user has any of the required permissions
            return hasAnyPermission(requiredPerms);
        });
    }, [loading, hasAnyPermission]);

    const queryNormalized = ui.query.trim().toLowerCase();

    const filteredNavItems = useMemo(() => {
        if (!queryNormalized) return accessibleNavItems;

        return accessibleNavItems.filter((item) => {
            const groupLabel = groups.find((group) => group.key === item.group)?.label ?? "";
            const searchable = `${item.label} ${item.href} ${groupLabel}`.toLowerCase();
            return searchable.includes(queryNormalized);
        });
    }, [accessibleNavItems, queryNormalized]);

    const groupedItems = useMemo(() => {
        const map = groups.reduce(
            (acc, group) => {
                acc[group.key] = [];
                return acc;
            },
            {} as Record<GroupKey, NavItem[]>
        );

        for (const item of filteredNavItems) {
            map[item.group].push(item);
        }

        return map;
    }, [filteredNavItems]);

    const isActive = useCallback(
        (href: string, exact?: boolean) => {
            if (exact) return pathname === href;
            return pathname.startsWith(href);
        },
        [pathname]
    );

    const toggleGroup = useCallback((key: GroupKey) => {
        dispatch({ type: "TOGGLE_GROUP", payload: key });
    }, []);

    const clearSearch = useCallback(() => {
        dispatch({ type: "SET_QUERY", payload: "" });
        searchInputRef.current?.focus();
    }, []);

    const startDrag = useCallback((key: GroupKey) => {
        dispatch({ type: "SET_DRAGGING_GROUP", payload: key });
    }, []);

    const endDrag = useCallback(() => {
        dispatch({ type: "SET_DRAGGING_GROUP", payload: null });
    }, []);

    const onDropGroup = useCallback(
        (target: GroupKey) => {
            if (!ui.draggingGroup) return;
            const nextOrder = reorderGroups(ui.groupOrder, ui.draggingGroup, target);
            dispatch({ type: "SET_GROUP_ORDER", payload: nextOrder });
            dispatch({ type: "SET_DRAGGING_GROUP", payload: null });
        },
        [ui.draggingGroup, ui.groupOrder]
    );

    // ── Drag-to-resize ──────────────────────────────────────────────────────
    const onResizeStart = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            isResizing.current = true;
            startX.current = e.clientX;
            startWidth.current = ui.width;

            const onMove = (ev: MouseEvent) => {
                if (!isResizing.current) return;
                const delta = ev.clientX - startX.current;
                const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
                dispatch({ type: "SET_WIDTH", payload: next });
            };
            const onUp = () => {
                isResizing.current = false;
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        },
        [ui.width]
    );

    // Close mobile drawer on route change
    useEffect(() => {
        dispatch({ type: "CLOSE_MOBILE" });
    }, [pathname]);

    const sidebarBg = isApple
        ? isDark
            ? "rgba(18,18,20,0.92)"
            : "rgba(245,245,250,0.92)"
        : isDark
            ? "rgba(20,20,24,0.97)"
            : "rgba(248,248,252,0.97)";

    const sidebarBlur = isApple ? "blur(24px) saturate(180%)" : "none";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const sharedProps = {
        palette,
        isDark,
        isApple,
        borderColor,
        query: ui.query,
        setQuery,
        groupOrder: ui.groupOrder,
        groupedItems,
        collapsedGroups: ui.collapsedGroups,
        toggleGroup,
        isActive,
        draggingGroup: ui.draggingGroup,
        startDrag,
        endDrag,
        onDropGroup,
        searchInputRef,
        clearSearch,
        onToggleCompact: () =>
            dispatch({
                type: "SET_WIDTH",
                payload: iconOnly ? DEFAULT_WIDTH : MIN_WIDTH
            })
    };

    return (
        <>
            {ui.desktopHidden && (
                <motion.button
                    className="hidden xl:flex fixed top-4 left-4 z-[60] items-center justify-center w-10 h-10 rounded-xl shadow-lg"
                    style={{
                        background: sidebarBg,
                        backdropFilter: sidebarBlur,
                        border: `1px solid ${borderColor}`,
                        color: palette.textPrimary
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    title="Show sidebar"
                    onClick={() => dispatch({ type: "TOGGLE_DESKTOP_HIDDEN" })}>
                    <Visibility fontSize="small" />
                </motion.button>
            )}

            {/* ── Mobile hamburger trigger ───────────────────────────── */}
            <motion.button
                className="fixed top-4 left-4 z-[60] xl:hidden flex items-center justify-center w-10 h-10 rounded-xl shadow-lg"
                style={{
                    background: sidebarBg,
                    backdropFilter: sidebarBlur,
                    border: `1px solid ${borderColor}`,
                    color: palette.textPrimary
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => dispatch({ type: "OPEN_MOBILE" })}>
                <MenuIcon fontSize="small" />
            </motion.button>

            {/* ── Mobile overlay drawer ──────────────────────────────── */}
            <AnimatePresence>
                {ui.mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-[70] xl:hidden"
                            style={{
                                background: "rgba(0,0,0,0.45)",
                                backdropFilter: "blur(4px)"
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => dispatch({ type: "CLOSE_MOBILE" })}
                        />
                        {/* Drawer */}
                        <motion.aside
                            className="fixed top-0 left-0 h-[100dvh] max-h-[100dvh] z-[80] xl:hidden flex flex-col"
                            style={{
                                width: "min(88vw, 330px)",
                                background: sidebarBg,
                                backdropFilter: sidebarBlur,
                                WebkitBackdropFilter: sidebarBlur,
                                borderRight: `1px solid ${borderColor}`
                            }}
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{
                                duration: 0.28,
                                ease: [0.25, 0.46, 0.45, 0.94]
                            }}>
                            <SidebarContent
                                {...sharedProps}
                                iconOnly={false}
                                onClose={() => dispatch({ type: "CLOSE_MOBILE" })}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Desktop sidebar (resizeable) ───────────────────────── */}
            {!ui.desktopHidden && (
                <motion.aside
                    className="hidden xl:flex sticky top-0 self-start h-[100dvh] max-h-[100dvh] flex-col z-40 select-none"
                    animate={{ width: ui.width }}
                    transition={{
                        duration: isResizing.current ? 0 : 0.25,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    style={{
                        height: "100dvh",
                        maxHeight: "100dvh",
                        background: sidebarBg,
                        backdropFilter: sidebarBlur,
                        WebkitBackdropFilter: sidebarBlur,
                        borderRight: `1px solid ${borderColor}`,
                        flexShrink: 0,
                        minWidth: MIN_WIDTH,
                        maxWidth: MAX_WIDTH,
                        position: "relative",
                        overflow: "hidden"
                    }}>
                    <SidebarContent
                        {...sharedProps}
                        iconOnly={iconOnly}
                        showHideControl
                        toggleDesktopHidden={() => dispatch({ type: "TOGGLE_DESKTOP_HIDDEN" })}
                    />

                    {/* Drag handle */}
                    <div
                        onMouseDown={onResizeStart}
                        className="absolute top-0 right-0 h-full w-1 cursor-col-resize group z-10"
                        title="Drag to resize"
                        style={{ userSelect: "none" }}>
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
            )}
        </>
    );
}
