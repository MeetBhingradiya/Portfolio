/**
 * Admin — Products Management
 * Create, edit, and toggle status of shop products.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    LocalOffer,
    Add,
    Delete,
    Edit,
    Save,
    Close,
    VisibilityOff,
    Visibility,
} from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

interface Product {
    _id: string;
    productId: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    tagline: string;
    variants: { variantId: string; label: string; price: number; currency: string; stock?: number }[];
}

const PRODUCT_TYPES = ["license", "subscription", "physical", "digital"];
const PRODUCT_STATUSES = ["draft", "active", "archived"];

function emptyForm() {
    return {
        name: "",
        slug: "",
        type: "license",
        status: "draft",
        tagline: "",
        description: "",
        variants: [{ variantId: "v1", label: "Standard", price: 0, currency: "USD", billingCycle: "one_time" }],
    };
}

export default function AdminProductsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/shop/products?limit=100");
        const json = await res.json();
        if (json.success) setProducts(json.data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const openCreate = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
    const openEdit = (p: Product) => {
        setForm({
            name: p.name,
            slug: p.slug,
            type: p.type,
            status: p.status,
            tagline: p.tagline,
            description: "",
            variants: p.variants.map(v => ({ ...v, billingCycle: "one_time" })),
        } as any);
        setEditId(p._id);
        setShowForm(true);
    };

    const save = async () => {
        setSaving(true);
        const method = editId ? "PATCH" : "POST";
        const url = editId ? `/api/shop/products/${editId}` : "/api/shop/products";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, variants: form.variants.map(v => ({ ...v, price: Math.round(Number(v.price) * 100) })) }),
        });
        setSaving(false);
        setShowForm(false);
        fetchProducts();
    };

    const deleteProduct = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        await fetch(`/api/shop/products/${id}`, { method: "DELETE" });
        fetchProducts();
    };

    const toggleStatus = async (p: Product) => {
        const next = p.status === "active" ? "archived" : "active";
        await fetch(`/api/shop/products/${p._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: next }),
        });
        fetchProducts();
    };

    const inputClass = "w-full bg-transparent outline-none text-sm px-4 py-2.5 rounded-xl";
    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    };

    const TYPE_COLORS: Record<string, string> = {
        license: "#007AFF", subscription: "#34C759", physical: "#FF9500", digital: "#AF52DE"
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <LocalOffer style={{ color: palette.accent, fontSize: 32 }} />
                    <div>
                        <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>Products</h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>Shop catalogue management</p>
                    </div>
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

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {products.map(p => (
                        <motion.div
                            key={p._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                            style={{ background: cardBg, border, borderRadius: br }}
                        >
                            <div
                                className="text-xs font-black px-2.5 py-1 rounded-lg"
                                style={{ background: `${TYPE_COLORS[p.type] ?? palette.accent}18`, color: TYPE_COLORS[p.type] ?? palette.accent }}
                            >
                                {p.type}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate" style={{ color: palette.textPrimary }}>{p.name}</p>
                                <p className="text-xs truncate" style={{ color: palette.textSecondary }}>{p.tagline}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                                    style={{
                                        background: p.status === "active" ? "rgba(52,199,89,0.12)" : "rgba(142,142,147,0.12)",
                                        color: p.status === "active" ? "#34C759" : "#8E8E93",
                                    }}
                                >
                                    {p.status}
                                </span>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleStatus(p)} className="p-1.5 rounded-lg" style={{ color: palette.textSecondary }}>
                                    {p.status === "active" ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(p)} className="p-1.5 rounded-lg" style={{ color: palette.accent }}>
                                    <Edit fontSize="small" />
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteProduct(p._id)} className="p-1.5 rounded-lg" style={{ color: "#FF3B30" }}>
                                    <Delete fontSize="small" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                    {products.length === 0 && (
                        <div className="text-center py-16" style={{ color: palette.textSecondary }}>No products yet. Create one!</div>
                    )}
                </div>
            )}

            {/* Side Form */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setShowForm(false)} />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{ background: isDark ? "#1c1c20" : "#f5f5f8" }}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <h2 className="font-black text-lg" style={{ color: palette.textPrimary }}>{editId ? "Edit Product" : "New Product"}</h2>
                                <button onClick={() => setShowForm(false)}><Close style={{ color: palette.textSecondary }} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <input className={inputClass} style={inputStyle} placeholder="Product name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))} />
                                <input className={inputClass} style={inputStyle} placeholder="slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                                <input className={inputClass} style={inputStyle} placeholder="Tagline (short description)" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />

                                <div className="grid grid-cols-2 gap-3">
                                    <CustomSelect
                                        value={form.type}
                                        onChange={v => setForm(f => ({ ...f, type: v }))}
                                        options={PRODUCT_TYPES.map(t => ({ value: t, label: t }))}
                                        placeholder="Type"
                                    />
                                    <CustomSelect
                                        value={form.status}
                                        onChange={v => setForm(f => ({ ...f, status: v }))}
                                        options={PRODUCT_STATUSES.map(s => ({ value: s, label: s }))}
                                        placeholder="Status"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>Variants (price in USD)</p>
                                    {form.variants.map((v, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <input
                                                className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                                                style={inputStyle}
                                                placeholder="Label"
                                                value={v.label}
                                                onChange={e => {
                                                    const vs = [...form.variants];
                                                    vs[idx] = { ...vs[idx], label: e.target.value };
                                                    setForm(f => ({ ...f, variants: vs }));
                                                }}
                                            />
                                            <input
                                                type="number"
                                                className="w-24 text-sm px-3 py-2 rounded-xl outline-none"
                                                style={inputStyle}
                                                placeholder="Price"
                                                value={v.price}
                                                onChange={e => {
                                                    const vs = [...form.variants];
                                                    vs[idx] = { ...vs[idx], price: Number(e.target.value) };
                                                    setForm(f => ({ ...f, variants: vs }));
                                                }}
                                            />
                                            {form.variants.length > 1 && (
                                                <button onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))} style={{ color: "#FF3B30" }}>
                                                    <Close fontSize="small" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { variantId: `v${f.variants.length + 1}`, label: "", price: 0, currency: "USD", billingCycle: "one_time" }] }))}
                                        className="text-sm font-bold flex items-center gap-1"
                                        style={{ color: palette.accent }}
                                    >
                                        <Add fontSize="small" /> Add Variant
                                    </motion.button>
                                </div>
                            </div>

                            <div className="px-6 pb-6 pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={save}
                                    disabled={saving}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{ background: palette.accent, color: "#fff" }}
                                >
                                    <Save fontSize="small" /> {saving ? "Saving…" : "Save Product"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
