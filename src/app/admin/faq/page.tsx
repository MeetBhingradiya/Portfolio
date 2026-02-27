/**
 * Admin — FAQ / Help Center Management
 * Create, edit, reorder, and publish FAQ entries.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { HelpOutline, Add, Delete, Edit, Save, Close, ToggleOn, ToggleOff } from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

interface FAQ {
    _id: string;
    faqId: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    isPublished: boolean;
    helpful: number;
    notHelpful: number;
}

const CATEGORIES = ["General", "Billing", "Technical", "Orders", "Returns", "Account", "Other"];

function emptyForm() {
    return { question: "", answer: "", category: "General", order: 0, isPublished: false };
}

export default function AdminFAQPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [faqs, setFaqs] = useState<FAQ[]>([]);
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

    const fetchFAQs = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/faq");
        const json = await res.json();
        if (json.success) setFaqs(json.data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchFAQs(); }, [fetchFAQs]);

    const openCreate = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
    const openEdit = (f: FAQ) => {
        setForm({ question: f.question, answer: f.answer, category: f.category, order: f.order, isPublished: f.isPublished });
        setEditId(f._id);
        setShowForm(true);
    };

    const save = async () => {
        setSaving(true);
        const method = editId ? "PATCH" : "POST";
        const url = editId ? `/api/faq/${editId}` : "/api/faq";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setSaving(false);
        setShowForm(false);
        fetchFAQs();
    };

    const deleteFAQ = async (id: string) => {
        if (!confirm("Delete this FAQ?")) return;
        await fetch(`/api/faq/${id}`, { method: "DELETE" });
        fetchFAQs();
    };

    const togglePublish = async (f: FAQ) => {
        await fetch(`/api/faq/${f._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublished: !f.isPublished }),
        });
        fetchFAQs();
    };

    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    };
    const inputClass = "w-full text-sm px-4 py-2.5 rounded-xl outline-none";

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <HelpOutline style={{ color: palette.accent, fontSize: 32 }} />
                    <div>
                        <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>FAQ Management</h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>Help center content editor</p>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: palette.accent, color: "#fff" }}
                >
                    <Add fontSize="small" /> New FAQ
                </motion.button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {faqs.map(f => (
                        <motion.div
                            key={f._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                            style={{ background: cardBg, border, borderRadius: br, opacity: f.isPublished ? 1 : 0.6 }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: `${palette.accent}18`, color: palette.accent }}
                                    >
                                        {f.category}
                                    </span>
                                    {!f.isPublished && (
                                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(142,142,147,0.15)", color: "#8E8E93" }}>
                                            Draft
                                        </span>
                                    )}
                                </div>
                                <p className="font-bold text-sm truncate" style={{ color: palette.textPrimary }}>{f.question}</p>
                                <p className="text-xs truncate" style={{ color: palette.textSecondary }}>{f.answer}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs" style={{ color: palette.textTertiary }}>
                                <span>👍 {f.helpful}</span>
                                <span className="mx-1">·</span>
                                <span>👎 {f.notHelpful}</span>
                            </div>
                            <div className="flex gap-1">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => togglePublish(f)} className="p-1.5 rounded-lg" style={{ color: f.isPublished ? "#34C759" : "#8E8E93" }}>
                                    {f.isPublished ? <ToggleOn /> : <ToggleOff />}
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(f)} className="p-1.5 rounded-lg" style={{ color: palette.accent }}>
                                    <Edit fontSize="small" />
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteFAQ(f._id)} className="p-1.5 rounded-lg" style={{ color: "#FF3B30" }}>
                                    <Delete fontSize="small" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                    {faqs.length === 0 && (
                        <div className="text-center py-16" style={{ color: palette.textSecondary }}>No FAQ entries yet. Create one!</div>
                    )}
                </div>
            )}

            {/* Form Panel */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setShowForm(false)} />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{ background: isDark ? "#1c1c20" : "#f5f5f8" }}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <h2 className="font-black text-lg" style={{ color: palette.textPrimary }}>{editId ? "Edit FAQ" : "New FAQ"}</h2>
                                <button onClick={() => setShowForm(false)}><Close style={{ color: palette.textSecondary }} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <input
                                    className={inputClass}
                                    style={inputStyle}
                                    placeholder="Question"
                                    value={form.question}
                                    onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                                />
                                <textarea
                                    className={`${inputClass} resize-none`}
                                    style={inputStyle}
                                    placeholder="Answer"
                                    rows={6}
                                    value={form.answer}
                                    onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <CustomSelect
                                        value={form.category}
                                        onChange={v => setForm(f => ({ ...f, category: v }))}
                                        options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                    />
                                    <input
                                        type="number"
                                        className={inputClass}
                                        style={inputStyle}
                                        placeholder="Order (0 = first)"
                                        value={form.order}
                                        onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                                    />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        className="w-12 h-6 rounded-full transition-colors relative"
                                        style={{ background: form.isPublished ? palette.accent : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
                                        onClick={() => setForm(f => ({ ...f, isPublished: !f.isPublished }))}
                                    >
                                        <div
                                            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                                            style={{ transform: `translateX(${form.isPublished ? 26 : 4}px)` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: palette.textPrimary }}>
                                        {form.isPublished ? "Published" : "Draft"}
                                    </span>
                                </label>
                            </div>

                            <div className="px-6 pb-6 pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={save}
                                    disabled={saving}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{ background: palette.accent, color: "#fff" }}
                                >
                                    <Save fontSize="small" /> {saving ? "Saving…" : "Save FAQ"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
