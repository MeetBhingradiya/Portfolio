/**
 * Admin — Products Management
 * Amazon/Flipkart-style rich product management with media, stock, and variants.
 */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Inventory2, Add, Delete, Edit, Save, Close, Search, GridView, ViewList,
    Image as ImageIcon, VideoLibrary, Visibility, VisibilityOff, Label, AddPhotoAlternate,
} from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Variant {
    variantId: string;
    label: string;
    price: number;
    currency: string;
    stock: number;
    billingCycle: string;
    sku: string;
}
interface Product {
    _id: string;
    productId: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    visibility: string;
    tagline: string;
    description: string;
    icon?: string;
    banner?: string;
    screenshots?: string[];
    videoUrl?: string;
    variants: Variant[];
}

/* ── Constants ─────────────────────────────────────────────────────────── */
const CURRENCIES = [
    { value: "USD", label: "USD ($)" }, { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" }, { value: "INR", label: "INR (₹)" },
    { value: "JPY", label: "JPY (¥)" }, { value: "CAD", label: "CAD (C$)" },
    { value: "AUD", label: "AUD (A$)" }, { value: "SGD", label: "SGD (S$)" },
    { value: "AED", label: "AED (د.إ)" },
];
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", CAD: "C$", AUD: "A$", SGD: "S$", AED: "د.إ" };
const TYPES = ["license", "subscription", "physical", "digital"];
const BILLING_CYCLES = [
    { value: "one_time", label: "One-time" }, { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" }, { value: "weekly", label: "Weekly" },
];
const TYPE_COLORS: Record<string, string> = { license: "#007AFF", subscription: "#AF52DE", physical: "#FF9500", digital: "#34C759" };

function fmtPrice(price: number, currency: string) {
    const sym = CURRENCY_SYMBOLS[currency] ?? currency;
    return `${sym}${(price / 100).toFixed(2)}`;
}

type FilterStatus = "all" | "active" | "draft" | "archived";
type ViewMode = "grid" | "list";
type PanelTab = "info" | "media" | "variants";

function emptyVariant(id = `v${Date.now()}`): Variant {
    return { variantId: id, label: "Standard", price: 0, currency: "USD", stock: 0, billingCycle: "one_time", sku: "" };
}
function emptyForm() {
    return {
        name: "", slug: "", type: "digital", status: "draft", visibility: "public",
        tagline: "", description: "",
        icon: "", banner: "", screenshots: [] as string[], videoUrl: "",
        variants: [emptyVariant("v1")],
    };
}

export default function AdminProductsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    /* ── State ──────────────────────────────────────────────────────────── */
    const [list, setList] = useState<{
        products: Product[]; loading: boolean;
        filter: FilterStatus; search: string; viewMode: ViewMode; typeFilter: string;
    }>({ products: [], loading: true, filter: "all", search: "", viewMode: "grid", typeFilter: "" });
    const patchList = useCallback((p: Partial<typeof list>) => setList(s => ({ ...s, ...p })), []);

    const [panel, setPanel] = useState<{
        open: boolean; editId: string | null; tab: PanelTab;
        form: ReturnType<typeof emptyForm>; saving: boolean;
    }>({ open: false, editId: null, tab: "info", form: emptyForm(), saving: false });
    const patchPanel = useCallback((p: Partial<typeof panel>) => setPanel(s => ({ ...s, ...p })), []);

    /* ── Style tokens ───────────────────────────────────────────────────── */
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.8)" : "rgba(255,255,255,0.8)"
        : isDark ? "rgba(20,20,24,0.98)" : "#fff";
    const surfaceBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;
    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    };
    const inputClass = "w-full text-sm px-4 py-2.5 rounded-xl outline-none";

    /* ── Data ───────────────────────────────────────────────────────────── */
    const fetchProducts = useCallback(async () => {
        patchList({ loading: true });
        try {
            const res = await fetch("/api/shop/products?limit=200&admin=true");
            const json = await res.json();
            if (json.success) patchList({ products: json.data ?? json.products ?? [] });
        } catch { /* ignore */ }
        patchList({ loading: false });
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    /* ── Derived ────────────────────────────────────────────────────────── */
    const counts = useMemo(() => ({
        all: list.products.length,
        active: list.products.filter(p => p.status === "active").length,
        draft: list.products.filter(p => p.status === "draft").length,
        archived: list.products.filter(p => p.status === "archived").length,
    }), [list.products]);

    const visible = useMemo(() => {
        let r = list.products;
        if (list.filter !== "all") r = r.filter(p => p.status === list.filter);
        if (list.typeFilter) r = r.filter(p => p.type === list.typeFilter);
        if (list.search.trim()) {
            const q = list.search.toLowerCase();
            r = r.filter(p => p.name.toLowerCase().includes(q) || p.tagline?.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
        }
        return r;
    }, [list.products, list.filter, list.typeFilter, list.search]);

    /* ── Actions ─────────────────────────────────────────────────────────── */
    const openCreate = () => patchPanel({ form: emptyForm(), editId: null, tab: "info", open: true });
    const openEdit = (p: Product) => patchPanel({
        form: {
            name: p.name, slug: p.slug, type: p.type, status: p.status,
            visibility: p.visibility ?? "public", tagline: p.tagline ?? "",
            description: p.description ?? "", icon: p.icon ?? "", banner: p.banner ?? "",
            screenshots: p.screenshots ?? [], videoUrl: p.videoUrl ?? "",
            variants: p.variants.length ? p.variants.map(v => ({
                variantId: v.variantId, label: v.label, price: v.price,
                currency: v.currency, stock: v.stock ?? 0, billingCycle: v.billingCycle ?? "one_time", sku: v.sku ?? "",
            })) : [emptyVariant()],
        },
        editId: p._id, tab: "info", open: true,
    });

    const save = async () => {
        patchPanel({ saving: true });
        const method = panel.editId ? "PATCH" : "POST";
        const url = panel.editId ? `/api/shop/products/${panel.editId}` : "/api/shop/products";
        await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(panel.form) });
        patchPanel({ saving: false, open: false });
        fetchProducts();
    };

    const deleteProduct = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        await fetch(`/api/shop/products/${id}`, { method: "DELETE" });
        fetchProducts();
    };

    const quickStatus = async (p: Product, status: string) => {
        await fetch(`/api/shop/products/${p._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        fetchProducts();
    };

    const addScreenshot = () => {
        const url = prompt("Screenshot URL:");
        if (url) patchPanel({ form: { ...panel.form, screenshots: [...panel.form.screenshots, url] } });
    };
    const removeScreenshot = (i: number) => patchPanel({ form: { ...panel.form, screenshots: panel.form.screenshots.filter((_, j) => j !== i) } });
    const addVariant = () => patchPanel({ form: { ...panel.form, variants: [...panel.form.variants, emptyVariant()] } });
    const removeVariant = (i: number) => patchPanel({ form: { ...panel.form, variants: panel.form.variants.filter((_, j) => j !== i) } });
    const patchVariant = (i: number, patch: Partial<Variant>) => {
        const variants = panel.form.variants.map((v, j) => j === i ? { ...v, ...patch } : v);
        patchPanel({ form: { ...panel.form, variants } });
    };

    const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    /* ── Status badge helper ─────────────────────────────────────────────── */
    const statusColor = (s: string) => s === "active" ? "#34C759" : s === "draft" ? "#FF9500" : "#8E8E93";
    const visibilityIcon = (v: string) => v === "private" ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />;

    /* ── Price range helper ──────────────────────────────────────────────── */
    const priceRange = (variants: Variant[]) => {
        if (!variants.length) return "—";
        const prices = variants.map(v => ({ p: v.price, c: v.currency }));
        if (prices.length === 1) return fmtPrice(prices[0].p, prices[0].c);
        const min = prices.reduce((a, b) => a.p <= b.p ? a : b);
        const max = prices.reduce((a, b) => a.p >= b.p ? a : b);
        if (min.p === max.p) return fmtPrice(min.p, min.c);
        return `${fmtPrice(min.p, min.c)} – ${fmtPrice(max.p, max.c)}`;
    };

    /* ── Total stock helper ──────────────────────────────────────────────── */
    const totalStock = (variants: Variant[]) => variants.reduce((s, v) => s + (v.stock ?? 0), 0);

    const FILTER_TABS: { key: FilterStatus; label: string }[] = [
        { key: "all", label: "All" }, { key: "active", label: "Active" },
        { key: "draft", label: "Draft" }, { key: "archived", label: "Archived" },
    ];

    /* ── Render ──────────────────────────────────────────────────────────── */
    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Inventory2 style={{ color: palette.accent, fontSize: 32 }} />
                    <div>
                        <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>Products</h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            {counts.all} total · <span style={{ color: "#34C759" }}>{counts.active} active</span> · <span style={{ color: "#FF9500" }}>{counts.draft} drafts</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Grid/List toggle */}
                    <div className="flex p-1 rounded-xl gap-1" style={{ background: surfaceBg }}>
                        {(["grid", "list"] as ViewMode[]).map(m => (
                            <button key={m} onClick={() => patchList({ viewMode: m })}
                                className="p-2 rounded-lg transition-all"
                                style={{ background: list.viewMode === m ? (isDark ? "rgba(255,255,255,0.12)" : "#fff") : "transparent", color: list.viewMode === m ? palette.textPrimary : palette.textSecondary }}>
                                {m === "grid" ? <GridView fontSize="small" /> : <ViewList fontSize="small" />}
                            </button>
                        ))}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                        style={{ background: palette.accent, color: "#fff" }}
                    >
                        <Add fontSize="small" /> New Product
                    </motion.button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Status tabs */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: surfaceBg }}>
                    {FILTER_TABS.map(t => (
                        <button key={t.key} onClick={() => patchList({ filter: t.key })}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5"
                            style={{
                                background: list.filter === t.key ? (isDark ? "rgba(255,255,255,0.12)" : "#fff") : "transparent",
                                color: list.filter === t.key ? palette.textPrimary : palette.textSecondary,
                                boxShadow: list.filter === t.key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                            }}>
                            {t.label}
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
                                style={{ background: "rgba(128,128,128,0.15)", color: palette.textTertiary }}>
                                {counts[t.key]}
                            </span>
                        </button>
                    ))}
                </div>
                {/* Search */}
                <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: surfaceBg, border }}>
                    <Search fontSize="small" style={{ color: palette.textSecondary }} />
                    <input value={list.search} onChange={e => patchList({ search: e.target.value })}
                        placeholder="Search products…" className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: palette.textPrimary }} />
                    {list.search && <button onClick={() => patchList({ search: "" })} style={{ color: palette.textTertiary }}><Close fontSize="small" /></button>}
                </div>
                {/* Type filter */}
                <div style={{ minWidth: 140 }}>
                    <CustomSelect value={list.typeFilter} onChange={v => patchList({ typeFilter: v })}
                        options={[{ value: "", label: "All Types" }, ...TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))]} />
                </div>
            </div>

            {/* Product Grid / List */}
            {list.loading ? (
                <div className={`grid gap-4 ${list.viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={`animate-pulse rounded-2xl ${list.viewMode === "grid" ? "h-72" : "h-20"}`} style={{ background: surfaceBg }} />)}
                </div>
            ) : visible.length === 0 ? (
                <div className="text-center py-20" style={{ color: palette.textSecondary }}>
                    {list.filter !== "all" ? `No ${list.filter} products.` : "No products yet. Create one!"}
                </div>
            ) : (
                <div className={`grid gap-4 ${list.viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                    <AnimatePresence>
                        {visible.map(p => list.viewMode === "grid" ? (
                            /* ── Grid Card ─────────────────────────────── */
                            <motion.div key={p._id}
                                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                                className="flex flex-col overflow-hidden"
                                style={{ background: cardBg, border, borderRadius: br, backdropFilter: isApple ? "blur(16px)" : "none" }}>
                                {/* Banner / placeholder */}
                                <div className="relative h-36 flex items-center justify-center overflow-hidden"
                                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
                                    {p.banner ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.banner} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon style={{ fontSize: 48, color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                                    )}
                                    {/* Icon overlay */}
                                    {p.icon && (
                                        <div className="absolute bottom-2 left-3 w-10 h-10 rounded-xl overflow-hidden shadow-lg" style={{ border }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={p.icon} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {/* Video indicator */}
                                    {p.videoUrl && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                                            style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                                            <VideoLibrary style={{ fontSize: 12 }} /> Video
                                        </div>
                                    )}
                                    {/* Screenshots count */}
                                    {(p.screenshots?.length ?? 0) > 0 && (
                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                                            style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                                            <AddPhotoAlternate style={{ fontSize: 12 }} /> {p.screenshots!.length}
                                        </div>
                                    )}
                                    {/* Status pill */}
                                    <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded-full text-xs font-black uppercase"
                                        style={{ background: `${statusColor(p.status)}20`, color: statusColor(p.status), border: `1px solid ${statusColor(p.status)}40` }}>
                                        {p.status}
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                    style={{ background: `${TYPE_COLORS[p.type] ?? palette.accent}15`, color: TYPE_COLORS[p.type] ?? palette.accent }}>
                                                    {p.type}
                                                </span>
                                                <span className="text-xs" style={{ color: palette.textTertiary }}>
                                                    {visibilityIcon(p.visibility ?? "public")}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-sm leading-tight" style={{ color: palette.textPrimary }}>{p.name}</h3>
                                            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: palette.textSecondary }}>{p.tagline}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-black text-base" style={{ color: palette.textPrimary }}>{priceRange(p.variants)}</div>
                                            <div className="text-xs mt-0.5" style={{ color: totalStock(p.variants) > 0 ? "#34C759" : "#FF3B30" }}>
                                                {totalStock(p.variants) > 0 ? `${totalStock(p.variants)} in stock` : "Out of stock"}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {p.status !== "active" && (
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => quickStatus(p, "active")}
                                                    className="text-xs px-2 py-1 rounded-lg font-bold"
                                                    style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}>
                                                    Publish
                                                </motion.button>
                                            )}
                                            {p.status !== "draft" && (
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => quickStatus(p, "draft")}
                                                    className="text-xs px-2 py-1 rounded-lg font-bold"
                                                    style={{ background: "rgba(255,149,0,0.12)", color: "#FF9500" }}>
                                                    Draft
                                                </motion.button>
                                            )}
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(p)} className="p-1.5 rounded-lg" style={{ color: palette.accent }}>
                                                <Edit fontSize="small" />
                                            </motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteProduct(p._id)} className="p-1.5 rounded-lg" style={{ color: "#FF3B30" }}>
                                                <Delete fontSize="small" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* ── List Row ───────────────────────────────── */
                            <motion.div key={p._id}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-4 px-5 py-3 rounded-2xl"
                                style={{ background: cardBg, border, borderRadius: br }}>
                                {/* Thumbnail */}
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                    style={{ background: surfaceBg }}>
                                    {p.icon ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.icon} alt="" className="w-full h-full object-cover" />
                                    ) : p.banner ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.banner} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Label style={{ color: TYPE_COLORS[p.type] ?? palette.accent }} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm" style={{ color: palette.textPrimary }}>{p.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                            style={{ background: `${TYPE_COLORS[p.type] ?? palette.accent}15`, color: TYPE_COLORS[p.type] ?? palette.accent }}>
                                            {p.type}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full font-black uppercase"
                                            style={{ background: `${statusColor(p.status)}15`, color: statusColor(p.status) }}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <p className="text-xs mt-0.5 truncate" style={{ color: palette.textSecondary }}>{p.tagline}</p>
                                </div>
                                <div className="hidden sm:block text-sm font-black shrink-0" style={{ color: palette.textPrimary }}>{priceRange(p.variants)}</div>
                                <div className="hidden md:block text-xs shrink-0" style={{ color: totalStock(p.variants) > 0 ? "#34C759" : "#FF3B30" }}>
                                    {totalStock(p.variants) > 0 ? `${totalStock(p.variants)} stock` : "Out"}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(p)} className="p-1.5 rounded-lg" style={{ color: palette.accent }}>
                                        <Edit fontSize="small" />
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteProduct(p._id)} className="p-1.5 rounded-lg" style={{ color: "#FF3B30" }}>
                                        <Delete fontSize="small" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Side Panel ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {panel.open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => patchPanel({ open: false })} />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl z-50 flex flex-col"
                            style={{ background: isDark ? "#1c1c20" : "#f5f5f8" }}
                        >
                            {/* Panel header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <div>
                                    <h2 className="font-black text-lg" style={{ color: palette.textPrimary }}>{panel.editId ? "Edit Product" : "New Product"}</h2>
                                    <p className="text-xs mt-0.5" style={{ color: statusColor(panel.form.status) }}>● {panel.form.status}</p>
                                </div>
                                <button onClick={() => patchPanel({ open: false })}><Close style={{ color: palette.textSecondary }} /></button>
                            </div>

                            {/* Tab bar */}
                            <div className="flex border-b shrink-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                {(["info", "media", "variants"] as PanelTab[]).map(t => (
                                    <button key={t} onClick={() => patchPanel({ tab: t })}
                                        className="flex-1 py-3 text-sm font-bold capitalize transition-colors relative"
                                        style={{ color: panel.tab === t ? palette.accent : palette.textSecondary }}>
                                        {t}
                                        {panel.tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: palette.accent }} />}
                                    </button>
                                ))}
                            </div>

                            {/* Panel body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <AnimatePresence mode="wait">
                                    {panel.tab === "info" && (
                                        <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                            <input className={inputClass} style={inputStyle} placeholder="Product name *"
                                                value={panel.form.name}
                                                onChange={e => patchPanel({ form: { ...panel.form, name: e.target.value, slug: panel.editId ? panel.form.slug : autoSlug(e.target.value) } })} />
                                            <input className={inputClass} style={inputStyle} placeholder="Slug (URL-friendly)"
                                                value={panel.form.slug}
                                                onChange={e => patchPanel({ form: { ...panel.form, slug: e.target.value } })} />
                                            <input className={inputClass} style={inputStyle} placeholder="Tagline (short description)"
                                                value={panel.form.tagline}
                                                onChange={e => patchPanel({ form: { ...panel.form, tagline: e.target.value } })} />
                                            <textarea className={`${inputClass} resize-none`} style={inputStyle} placeholder="Full description" rows={4}
                                                value={panel.form.description}
                                                onChange={e => patchPanel({ form: { ...panel.form, description: e.target.value } })} />
                                            <div className="grid grid-cols-3 gap-3">
                                                <CustomSelect value={panel.form.type} onChange={v => patchPanel({ form: { ...panel.form, type: v } })}
                                                    options={TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
                                                <CustomSelect value={panel.form.status} onChange={v => patchPanel({ form: { ...panel.form, status: v } })}
                                                    options={[
                                                        { value: "draft", label: "Draft" },
                                                        { value: "active", label: "Active" },
                                                        { value: "archived", label: "Archived" },
                                                    ]} />
                                                <CustomSelect value={panel.form.visibility} onChange={v => patchPanel({ form: { ...panel.form, visibility: v } })}
                                                    options={[
                                                        { value: "public", label: "Public" },
                                                        { value: "unlisted", label: "Unlisted" },
                                                        { value: "private", label: "Private" },
                                                    ]} />
                                            </div>
                                        </motion.div>
                                    )}

                                    {panel.tab === "media" && (
                                        <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                                            {/* Icon */}
                                            <div>
                                                <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: palette.textSecondary }}>App Icon</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: surfaceBg, border }}>
                                                        {panel.form.icon
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            ? <img src={panel.form.icon} alt="icon" className="w-full h-full object-cover" />
                                                            : <ImageIcon style={{ color: palette.textTertiary }} />}
                                                    </div>
                                                    <input className={`${inputClass} flex-1`} style={inputStyle} placeholder="Icon URL"
                                                        value={panel.form.icon}
                                                        onChange={e => patchPanel({ form: { ...panel.form, icon: e.target.value } })} />
                                                </div>
                                            </div>
                                            {/* Banner */}
                                            <div>
                                                <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Banner Image</p>
                                                {panel.form.banner && (
                                                    <div className="w-full h-28 rounded-xl overflow-hidden mb-2" style={{ border }}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={panel.form.banner} alt="banner" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <input className={inputClass} style={inputStyle} placeholder="Banner image URL"
                                                    value={panel.form.banner}
                                                    onChange={e => patchPanel({ form: { ...panel.form, banner: e.target.value } })} />
                                            </div>
                                            {/* Video */}
                                            <div>
                                                <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Product Video</p>
                                                <input className={inputClass} style={inputStyle} placeholder="Video URL (YouTube / direct)"
                                                    value={panel.form.videoUrl}
                                                    onChange={e => patchPanel({ form: { ...panel.form, videoUrl: e.target.value } })} />
                                            </div>
                                            {/* Screenshots */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: palette.textSecondary }}>Screenshots ({panel.form.screenshots.length})</p>
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={addScreenshot}
                                                        className="text-xs px-3 py-1 rounded-lg font-bold"
                                                        style={{ background: `${palette.accent}15`, color: palette.accent }}>
                                                        + Add
                                                    </motion.button>
                                                </div>
                                                <div className="space-y-2">
                                                    {panel.form.screenshots.map((url, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0" style={{ background: surfaceBg, border }}>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="flex-1 text-xs truncate" style={{ color: palette.textSecondary }}>{url}</span>
                                                            <button onClick={() => removeScreenshot(i)} style={{ color: "#FF3B30" }}><Close fontSize="small" /></button>
                                                        </div>
                                                    ))}
                                                    {panel.form.screenshots.length === 0 && (
                                                        <p className="text-xs py-4 text-center" style={{ color: palette.textTertiary }}>No screenshots yet — click Add</p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {panel.tab === "variants" && (
                                        <motion.div key="variants" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                            {panel.form.variants.map((v, i) => (
                                                <div key={v.variantId} className="p-4 rounded-2xl space-y-3" style={{ background: surfaceBg, border }}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black" style={{ color: palette.textPrimary }}>Variant {i + 1}</span>
                                                        {panel.form.variants.length > 1 && (
                                                            <button onClick={() => removeVariant(i)} style={{ color: "#FF3B30" }}><Delete fontSize="small" /></button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input className={inputClass} style={inputStyle} placeholder="Label (e.g. Pro, Monthly)"
                                                            value={v.label} onChange={e => patchVariant(i, { label: e.target.value })} />
                                                        <input className={inputClass} style={inputStyle} placeholder="SKU (optional)"
                                                            value={v.sku} onChange={e => patchVariant(i, { sku: e.target.value })} />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="col-span-2 flex gap-2">
                                                            <input type="number" className={inputClass} style={inputStyle} placeholder="Price (in cents)"
                                                                value={v.price} onChange={e => patchVariant(i, { price: Number(e.target.value) })} />
                                                            <div style={{ minWidth: 110 }}>
                                                                <CustomSelect value={v.currency} onChange={val => patchVariant(i, { currency: val })}
                                                                    options={CURRENCIES} />
                                                            </div>
                                                        </div>
                                                        <input type="number" className={inputClass} style={inputStyle} placeholder="Stock (units)"
                                                            value={v.stock} onChange={e => patchVariant(i, { stock: Number(e.target.value) })} />
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex-1">
                                                            <CustomSelect value={v.billingCycle} onChange={val => patchVariant(i, { billingCycle: val })}
                                                                options={BILLING_CYCLES} />
                                                        </div>
                                                        {v.price > 0 && (
                                                            <div className="text-base font-black shrink-0" style={{ color: palette.accent }}>
                                                                = {fmtPrice(v.price, v.currency)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <motion.button whileTap={{ scale: 0.97 }} onClick={addVariant}
                                                className="w-full py-2.5 rounded-xl font-bold text-sm border-dashed border-2 transition-colors"
                                                style={{ borderColor: `${palette.accent}40`, color: palette.accent }}>
                                                + Add Variant
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Save button */}
                            <div className="px-6 pb-6 pt-3 border-t shrink-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={save}
                                    disabled={panel.saving || !panel.form.name.trim()}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{ background: palette.accent, color: "#fff", opacity: !panel.form.name.trim() ? 0.5 : 1 }}
                                >
                                    <Save fontSize="small" /> {panel.saving ? "Saving…" : panel.editId ? "Save Changes" : "Create Product"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
