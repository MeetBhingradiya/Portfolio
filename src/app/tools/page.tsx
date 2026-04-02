/**
 * Tools Dashboard — /tools
 * User-facing hub for all developer tools.
 * Adapts to Apple Liquid Glass ↔ Samsung One UI 7 design themes.
 */

"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolCard from "@Components/Organisms/Tools/ToolCard";
import { TOOLS, TOOL_CATEGORIES, type ToolCategory, type ToolDefinition } from "@/Static/ToolsDashboard";
import {
    Search,
    Cloud,
    CloudDone,
    CloudOff,
    AdminPanelSettings,
    Bolt,
    GridView,
    ViewList,
    Tune,
    PushPin,
    PushPinOutlined,
    ArrowForwardIos,
    Terminal,
    WavingHand,
    CheckCircle
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "grid" | "list";
type SyncStatus = "synced" | "syncing" | "offline";

interface UserToolPrefs {
    pinned: string[];
    disabled: string[];
    usageCount: Record<string, number>;
    lastUsed: Record<string, number>;
}

const DEFAULT_PREFS: UserToolPrefs = {
    pinned: [],
    disabled: [],
    usageCount: {},
    lastUsed: {}
};

// ─── Quick-stat card ──────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    accent: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent, delay = 0 }) => {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const inner = (
        <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}>
            <div
                className="flex items-center justify-center rounded-2xl"
                style={{
                    width: 44,
                    height: 44,
                    background: `${accent}20`,
                    color: accent,
                    border: `1.5px solid ${accent}30`,
                    borderRadius: isApple ? "14px" : "18px",
                    flexShrink: 0
                }}>
                {icon}
            </div>
            <div>
                <div
                    className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                    style={{ color: palette.textPrimary }}>
                    {value}
                </div>
                <div
                    className="text-xs font-medium"
                    style={{ color: palette.textSecondary }}>
                    {label}
                </div>
            </div>
        </motion.div>
    );

    if (isApple) {
        return (
            <LiquidGlassCard
                intensity="subtle"
                enableTilt={false}
                enableGlow={false}>
                {inner}
            </LiquidGlassCard>
        );
    }
    return <OneUICard interactive={false}>{inner}</OneUICard>;
};

// ─── Sync status indicator ────────────────────────────────────────────────────

const SyncIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
    const { palette } = useDesignTheme();

    const config = {
        synced: {
            icon: <CloudDone sx={{ fontSize: 16 }} />,
            label: "Synced",
            color: "#34C759"
        },
        syncing: {
            icon: <Cloud sx={{ fontSize: 16 }} />,
            label: "Syncing…",
            color: palette.accent
        },
        offline: {
            icon: <CloudOff sx={{ fontSize: 16 }} />,
            label: "Offline",
            color: "#FF9500"
        }
    }[status];

    return (
        <motion.div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
                background: `${config.color}15`,
                color: config.color,
                border: `1px solid ${config.color}30`
            }}
            animate={status === "syncing" ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}>
            {config.icon}
            {config.label}
        </motion.div>
    );
};

// ─── Category section header ──────────────────────────────────────────────────

interface CategoryHeaderProps {
    category: ToolCategory;
    count: number;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ category, count }) => {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const cat = TOOL_CATEGORIES[category];

    return (
        <div className="flex items-end justify-between mb-4">
            <div>
                <h2
                    className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} leading-tight`}
                    style={{ color: palette.textPrimary }}>
                    {cat.label}
                </h2>
                <p
                    className="text-sm mt-0.5"
                    style={{ color: palette.textSecondary }}>
                    {cat.description}
                </p>
            </div>
            <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                    background: palette.accentSubtle,
                    color: palette.accent
                }}>
                {count}
            </span>
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ToolsDashboardPage() {
    const { designTheme, palette, actualColorMode, accentColor } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const router = useRouter();

    // ── State ────────────────────────────────────────────────────────────────
    const [prefs, setPrefs] = useState<UserToolPrefs>(DEFAULT_PREFS);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [visibilityData, setVisibilityData] = useState<
        Array<{
            toolId: string;
            enabled: boolean;
            featured: boolean;
            publicAccess: boolean;
        }>
    >([]);
    const [showFilters, setShowFilters] = useState(false);

    // ── Helpers for admin visibility ─────────────────────────────────────────
    const getVis = useCallback(
        (toolId: string) => {
            const found = visibilityData.find((v) => v.toolId === toolId);
            // If no admin config yet, default to enabled + public, not featured
            return (
                found ?? {
                    toolId,
                    enabled: true,
                    featured: false,
                    publicAccess: true
                }
            );
        },
        [visibilityData]
    );

    const isToolEnabled = useCallback((id: string) => getVis(id).enabled, [getVis]);
    const isToolPublic = useCallback((id: string) => getVis(id).publicAccess, [getVis]);
    const isToolFeatured = useCallback((id: string) => getVis(id).featured, [getVis]);

    // ── Load prefs from localStorage (before DB sync) ────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem("tool_prefs");
            if (raw) setPrefs(JSON.parse(raw));
        } catch {
            /* ignore */
        }

        // Simulate DB sync
        setSyncStatus("syncing");
        const t = setTimeout(() => setSyncStatus("synced"), 2200);
        return () => clearTimeout(t);
    }, []);

    // ── Fetch admin visibility settings ──────────────────────────────────────
    useEffect(() => {
        fetch("/api/tools/visibility")
            .then((r) => r.json())
            .then((json) => {
                if (json.success && Array.isArray(json.visibility)) {
                    setVisibilityData(json.visibility);
                }
            })
            .catch(() => {
                /* graceful fallback — static defaults apply */
            });
    }, []);

    const savePrefs = useCallback((next: UserToolPrefs) => {
        setPrefs(next);
        localStorage.setItem("tool_prefs", JSON.stringify(next));
        setSyncStatus("syncing");
        // Simulate push to DB
        setTimeout(() => setSyncStatus("synced"), 900);
    }, []);

    // ── Toggle pin ───────────────────────────────────────────────────────────
    const togglePin = useCallback(
        (id: string) => {
            const next = { ...prefs };
            next.pinned = next.pinned.includes(id) ? next.pinned.filter((p) => p !== id) : [id, ...next.pinned];
            savePrefs(next);
        },
        [prefs, savePrefs]
    );

    // ── Filtered + ordered tools ─────────────────────────────────────────────
    const filteredTools = useMemo(() => {
        let list = TOOLS.filter((t) => isToolEnabled(t.id) && isToolPublic(t.id));

        // Category filter
        if (activeCategory !== "all") {
            list = list.filter((t) => t.category === activeCategory);
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    t.category.includes(q) ||
                    t.badges.some((b) => b.includes(q))
            );
        }

        // Pinned first
        list.sort((a, b) => {
            const ap = prefs.pinned.includes(a.id) ? -1 : 0;
            const bp = prefs.pinned.includes(b.id) ? -1 : 0;
            return ap - bp;
        });

        return list;
    }, [searchQuery, activeCategory, prefs.pinned, isToolEnabled, isToolPublic]);

    const featuredTools = useMemo(() => TOOLS.filter((t) => isToolFeatured(t.id) && isToolEnabled(t.id)), [isToolFeatured, isToolEnabled]);

    const toolsByCategory = useMemo(() => {
        const result: Partial<Record<ToolCategory, ToolDefinition[]>> = {};
        for (const tool of TOOLS) {
            if (!isToolEnabled(tool.id) || !isToolPublic(tool.id)) continue;
            if (!result[tool.category]) result[tool.category] = [];
            result[tool.category]!.push(tool);
        }
        return result;
    }, [isToolEnabled, isToolPublic]);

    const totalSynced = useMemo(() => TOOLS.filter((t) => t.syncToDb).length, []);

    const totalEnabled = useMemo(
        () => TOOLS.filter((t) => isToolEnabled(t.id) && isToolPublic(t.id)).length,
        [isToolEnabled, isToolPublic]
    );

    // ── Category tabs ────────────────────────────────────────────────────────
    const categoryTabs = [
        { label: "All", value: "all" },
        ...Object.entries(TOOL_CATEGORIES).map(([k, v]) => ({
            label: v.label,
            value: k
        }))
    ];

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            className="min-h-screen"
            style={{ background: palette.background }}>
            {/* ── Subtle background decoration ── */}
            <div
                className="fixed inset-0 pointer-events-none overflow-hidden"
                style={{ zIndex: 0 }}>
                {isApple ? (
                    <>
                        <motion.div
                            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
                                filter: "blur(60px)"
                            }}
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                        <motion.div
                            className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`,
                                filter: "blur(80px)"
                            }}
                            animate={{
                                scale: [1.1, 1, 1.1],
                                rotate: [15, 0, 15]
                            }}
                            transition={{
                                duration: 18,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    </>
                ) : (
                    <div
                        className="absolute inset-0 opacity-[0.025]"
                        style={{
                            backgroundImage: `linear-gradient(${isDark ? "#fff" : "#000"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "#fff" : "#000"} 1px, transparent 1px)`,
                            backgroundSize: "48px 48px"
                        }}
                    />
                )}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-10 space-y-10">
                {/* ══ PAGE HEADER ════════════════════════════════════════════ */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Terminal sx={{ fontSize: 18, color: palette.accent }} />
                            <span
                                className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: palette.accent }}>
                                Developer Toolkit
                            </span>
                        </div>
                        <h1
                            className={`${isApple ? "text-4xl font-bold" : "text-5xl font-black"} leading-none tracking-tight`}
                            style={{ color: palette.textPrimary }}>
                            Tools <span style={{ color: palette.accent }}>Dashboard</span>
                        </h1>
                        <p
                            className="mt-2 text-sm"
                            style={{ color: palette.textSecondary }}>
                            {TOOLS.length} tools · preferences sync to cloud
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <SyncIndicator status={syncStatus} />
                        <motion.button
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                            style={{
                                background: `${palette.accent}18`,
                                color: palette.accent,
                                border: `1px solid ${palette.accent}30`
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => router.push("/admin/tools")}>
                            <AdminPanelSettings sx={{ fontSize: 14 }} />
                            Admin Panel
                        </motion.button>
                    </div>
                </motion.div>

                {/* ══ QUICK STATS ════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Tools"
                        value={totalEnabled}
                        icon={<GridView sx={{ fontSize: 20 }} />}
                        accent={palette.accent}
                        delay={0}
                    />
                    <StatCard
                        label="Pinned"
                        value={prefs.pinned.length}
                        icon={<PushPin sx={{ fontSize: 20 }} />}
                        accent="#FF9500"
                        delay={0.05}
                    />
                    <StatCard
                        label="Cloud Sync"
                        value={totalSynced}
                        icon={<CloudDone sx={{ fontSize: 20 }} />}
                        accent="#34C759"
                        delay={0.1}
                    />
                    <StatCard
                        label="Admin Managed"
                        value={TOOLS.filter((t) => t.adminManaged).length}
                        icon={<AdminPanelSettings sx={{ fontSize: 20 }} />}
                        accent="#AF52DE"
                        delay={0.15}
                    />
                </div>

                {/* ══ FEATURED TOOLS ═════════════════════════════════════════ */}
                {featuredTools.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Bolt sx={{ fontSize: 18, color: "#34C759" }} />
                            <span
                                className={`${isApple ? "text-lg font-bold" : "text-xl font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                Featured by Admin
                            </span>
                            <OneUIBadge variant="success">{featuredTools.length} tools</OneUIBadge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {featuredTools.map((tool, i) => (
                                <ToolCard
                                    key={tool.id}
                                    tool={tool}
                                    isPinned={prefs.pinned.includes(tool.id)}
                                    usageCount={prefs.usageCount[tool.id] ?? 0}
                                    isEnabled={isToolEnabled(tool.id)}
                                    onTogglePin={togglePin}
                                    index={i}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* ══ SEARCH + FILTERS ══════════════════════════════════════ */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Search bar */}
                    <div
                        className="flex items-center gap-2 flex-1 px-4 py-3 rounded-2xl"
                        style={{
                            background: isApple
                                ? isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(255,255,255,0.6)"
                                : isDark
                                  ? "rgba(40,40,45,0.9)"
                                  : "rgba(248,248,250,0.9)",
                            border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)"}`,
                            backdropFilter: isApple ? "blur(16px)" : undefined,
                            borderRadius: isApple ? "14px" : "20px"
                        }}>
                        <Search sx={{ fontSize: 18, color: palette.textTertiary }} />
                        <input
                            type="text"
                            placeholder="Search tools…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{
                                color: palette.textPrimary,
                                caretColor: palette.accent
                            }}
                        />
                        {searchQuery && (
                            <motion.button
                                onClick={() => setSearchQuery("")}
                                className="text-xs"
                                style={{ color: palette.textTertiary }}
                                whileTap={{ scale: 0.9 }}>
                                ✕
                            </motion.button>
                        )}
                    </div>

                    {/* View mode toggle */}
                    <div
                        className="flex items-center gap-1 p-1.5 rounded-full"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"
                        }}>
                        {(["grid", "list"] as ViewMode[]).map((m) => (
                            <motion.button
                                key={m}
                                className="p-2 rounded-full"
                                style={{
                                    background: viewMode === m ? palette.accent : "transparent",
                                    color: viewMode === m ? "#fff" : palette.textTertiary
                                }}
                                onClick={() => setViewMode(m)}
                                whileTap={{ scale: 0.92 }}>
                                {m === "grid" ? <GridView sx={{ fontSize: 18 }} /> : <ViewList sx={{ fontSize: 18 }} />}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* ── Category tabs ── */}
                <div className="overflow-x-auto pb-2 -mx-1 px-1">
                    <div className="flex gap-2 w-max">
                        {categoryTabs.map((tab) => {
                            const isActive = activeCategory === tab.value;
                            return (
                                <motion.button
                                    key={tab.value}
                                    className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all"
                                    style={{
                                        background: isActive ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                        color: isActive ? "#fff" : palette.textSecondary,
                                        border: isActive
                                            ? `1.5px solid ${palette.accent}`
                                            : `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                                    }}
                                    onClick={() => setActiveCategory(tab.value as ToolCategory | "all")}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}>
                                    {tab.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ══ TOOLS GRID / LIST ══════════════════════════════════════ */}
                <AnimatePresence mode="wait">
                    {searchQuery || activeCategory !== "all" ? (
                        /* ── Flat filtered view ── */
                        <motion.div
                            key="filtered"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}>
                            {filteredTools.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center py-24 gap-3"
                                    style={{ color: palette.textSecondary }}>
                                    <Search sx={{ fontSize: 48, opacity: 0.3 }} />
                                    <p className="text-lg font-bold">No tools found</p>
                                    <p className="text-sm opacity-70">Try a different search term or category</p>
                                </div>
                            ) : (
                                <div
                                    className={
                                        viewMode === "grid"
                                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                            : "flex flex-col gap-3"
                                    }>
                                    {filteredTools.map((tool, i) => (
                                        <ToolCard
                                            key={tool.id}
                                            tool={tool}
                                            isPinned={prefs.pinned.includes(tool.id)}
                                            usageCount={prefs.usageCount[tool.id] ?? 0}
                                            isEnabled={isToolEnabled(tool.id)}
                                            onTogglePin={togglePin}
                                            index={i}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* ── Category-grouped view ── */
                        <motion.div
                            key="grouped"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-12">
                            {/* Pinned section */}
                            {prefs.pinned.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <PushPin
                                            sx={{
                                                fontSize: 16,
                                                color: "#FF9500"
                                            }}
                                        />
                                        <h2
                                            className={`${isApple ? "text-lg font-bold" : "text-xl font-black"}`}
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            Pinned
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {prefs.pinned
                                            .map((id) => TOOLS.find((t) => t.id === id))
                                            .filter(Boolean)
                                            .map((tool, i) => (
                                                <ToolCard
                                                    key={tool!.id}
                                                    tool={tool!}
                                                    isPinned={true}
                                                    usageCount={prefs.usageCount[tool!.id] ?? 0}
                                                    isEnabled={isToolEnabled(tool!.id)}
                                                    onTogglePin={togglePin}
                                                    index={i}
                                                />
                                            ))}
                                    </div>
                                </section>
                            )}

                            {/* All categories */}
                            {(Object.keys(TOOL_CATEGORIES) as ToolCategory[]).map((cat) => {
                                const tools = toolsByCategory[cat];
                                if (!tools || tools.length === 0) return null;

                                return (
                                    <motion.section
                                        key={cat}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{
                                            once: true,
                                            margin: "-80px"
                                        }}
                                        transition={{
                                            duration: 0.45,
                                            ease: [0.25, 0.46, 0.45, 0.94]
                                        }}>
                                        <CategoryHeader
                                            category={cat}
                                            count={tools.length}
                                        />
                                        <div
                                            className={
                                                viewMode === "grid"
                                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                                    : "flex flex-col gap-3"
                                            }>
                                            {tools.map((tool, i) => (
                                                <ToolCard
                                                    key={tool.id}
                                                    tool={tool}
                                                    isPinned={prefs.pinned.includes(tool.id)}
                                                    usageCount={prefs.usageCount[tool.id] ?? 0}
                                                    isEnabled={isToolEnabled(tool.id)}
                                                    onTogglePin={togglePin}
                                                    index={i}
                                                />
                                            ))}
                                        </div>
                                    </motion.section>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ ADMIN NOTICE BANNER ════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}>
                    {isApple ? (
                        <LiquidGlassCard
                            intensity="subtle"
                            enableTilt={false}
                            enableGlow={false}>
                            <AdminNoticeBanner
                                palette={palette}
                                accentColor={accentColor}
                            />
                        </LiquidGlassCard>
                    ) : (
                        <OneUICard interactive={false}>
                            <AdminNoticeBanner
                                palette={palette}
                                accentColor={accentColor}
                            />
                        </OneUICard>
                    )}
                </motion.div>

                {/* ── Footer spacer ── */}
                <div className="h-16" />
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────

interface AdminNoticeBannerProps {
    palette: ReturnType<typeof useDesignTheme>["palette"];
    accentColor: string;
}

function AdminNoticeBanner({ palette, accentColor }: AdminNoticeBannerProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div
                className="flex items-center justify-center rounded-2xl flex-shrink-0"
                style={{
                    width: 48,
                    height: 48,
                    background: `${accentColor}18`,
                    color: accentColor,
                    border: `1.5px solid ${accentColor}30`
                }}>
                <AdminPanelSettings sx={{ fontSize: 24 }} />
            </div>
            <div className="flex-1">
                <p
                    className="text-sm font-bold mb-0.5"
                    style={{ color: palette.textPrimary }}>
                    Admin-managed defaults
                </p>
                <p
                    className="text-xs leading-relaxed"
                    style={{ color: palette.textSecondary }}>
                    Tools marked <strong style={{ color: "#FF9500" }}>Admin</strong> have default settings controlled from the Admin Panel.
                    Your personal preferences override these defaults and sync securely to the cloud when you&apos;re signed in.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle sx={{ fontSize: 14, color: "#34C759" }} />
                <span
                    className="text-xs font-bold"
                    style={{ color: "#34C759" }}>
                    DB Sync Active
                </span>
            </div>
        </div>
    );
}
