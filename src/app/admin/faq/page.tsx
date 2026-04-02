/**
 * Admin — FAQ / Help Center Management
 * Create, edit, reorder, and publish FAQ entries.
 * Admin view: shows all entries including drafts.
 */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { HelpOutline, Add, Delete, Edit, Save, Close, ToggleOn, ToggleOff, Search, FilterList } from "@mui/icons-material";
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

type FilterTab = "all" | "published" | "draft";

function emptyForm() {
    return {
        question: "",
        answer: "",
        category: "General",
        order: 0,
        isPublished: false
    };
}

export default function AdminFAQPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [list, setList] = useState<{
        faqs: FAQ[];
        loading: boolean;
        filter: FilterTab;
        search: string;
        categoryFilter: string;
    }>({
        faqs: [],
        loading: true,
        filter: "all",
        search: "",
        categoryFilter: ""
    });
    const patchList = useCallback((p: Partial<typeof list>) => setList((s) => ({ ...s, ...p })), []);

    const [panel, setPanel] = useState<{
        open: boolean;
        editId: string | null;
        form: ReturnType<typeof emptyForm>;
        saving: boolean;
    }>({ open: false, editId: null, form: emptyForm(), saving: false });
    const patchPanel = useCallback((p: Partial<typeof panel>) => setPanel((s) => ({ ...s, ...p })), []);

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;
    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
    };
    const inputClass = "w-full text-sm px-4 py-2.5 rounded-xl outline-none";

    // ── Fetch ALL faqs including drafts (admin endpoint) ──────────────────
    const fetchFAQs = useCallback(async () => {
        patchList({ loading: true });
        try {
            // No admin param needed — server determines visibility from session
            const res = await fetch("/api/faq");
            const json = await res.json();
            if (json.success) patchList({ faqs: json.data });
        } catch {
            /* ignore */
        }
        patchList({ loading: false });
    }, []);

    useEffect(() => {
        fetchFAQs();
    }, [fetchFAQs]);

    // ── Derived counts & filtered list ────────────────────────────────────
    const counts = useMemo(
        () => ({
            all: list.faqs.length,
            published: list.faqs.filter((f) => f.isPublished).length,
            draft: list.faqs.filter((f) => !f.isPublished).length
        }),
        [list.faqs]
    );

    const visible = useMemo(() => {
        let r = list.faqs;
        if (list.filter === "published") r = r.filter((f) => f.isPublished);
        if (list.filter === "draft") r = r.filter((f) => !f.isPublished);
        if (list.categoryFilter) r = r.filter((f) => f.category === list.categoryFilter);
        if (list.search.trim()) {
            const q = list.search.toLowerCase();
            r = r.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
        }
        return [...r].sort((a, b) => a.order - b.order);
    }, [list.faqs, list.filter, list.search, list.categoryFilter]);

    // ── Actions ───────────────────────────────────────────────────────────
    const openCreate = () => {
        patchPanel({ form: emptyForm(), editId: null, open: true });
    };
    const openEdit = (f: FAQ) => {
        patchPanel({
            form: {
                question: f.question,
                answer: f.answer,
                category: f.category,
                order: f.order,
                isPublished: f.isPublished
            },
            editId: f._id,
            open: true
        });
    };

    const save = async () => {
        patchPanel({ saving: true });
        const method = panel.editId ? "PATCH" : "POST";
        const url = panel.editId ? `/api/faq/${panel.editId}` : "/api/faq";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(panel.form)
        });
        patchPanel({ saving: false, open: false });
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
            body: JSON.stringify({ isPublished: !f.isPublished })
        });
        fetchFAQs();
    };

    const TABS: { key: FilterTab; label: string }[] = [
        { key: "all", label: "All" },
        { key: "published", label: "Published" },
        { key: "draft", label: "Drafts" }
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <HelpOutline style={{ color: palette.accent, fontSize: 32 }} />
                    <div>
                        <h1
                            className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`}
                            style={{ color: palette.textPrimary }}>
                            FAQ Management
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            {counts.all} entries · {counts.published} published ·{" "}
                            <span style={{ color: "#FF9500" }}>{counts.draft} drafts</span>
                        </p>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: palette.accent, color: "#fff" }}>
                    <Add fontSize="small" /> New FAQ
                </motion.button>
            </div>

            {/* ── Filter tabs + search ────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Tabs */}
                <div
                    className="flex gap-1 p-1 rounded-xl"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
                    }}>
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => patchList({ filter: t.key })}
                            className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5"
                            style={{
                                background: list.filter === t.key ? (isDark ? "rgba(255,255,255,0.12)" : "#fff") : "transparent",
                                color: list.filter === t.key ? palette.textPrimary : palette.textSecondary,
                                boxShadow: list.filter === t.key ? "0 1px 4px rgba(0,0,0,0.12)" : "none"
                            }}>
                            {t.label}
                            <span
                                className="text-xs px-1.5 py-0.5 rounded-full font-black"
                                style={{
                                    background: t.key === "draft" && counts.draft > 0 ? "rgba(255,149,0,0.15)" : "rgba(128,128,128,0.15)",
                                    color: t.key === "draft" && counts.draft > 0 ? "#FF9500" : palette.textTertiary
                                }}>
                                {counts[t.key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div
                    className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                        border
                    }}>
                    <Search
                        fontSize="small"
                        style={{ color: palette.textSecondary }}
                    />
                    <input
                        value={list.search}
                        onChange={(e) => patchList({ search: e.target.value })}
                        placeholder="Search questions…"
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: palette.textPrimary }}
                    />
                    {list.search && (
                        <button
                            onClick={() => patchList({ search: "" })}
                            style={{ color: palette.textTertiary }}>
                            <Close fontSize="small" />
                        </button>
                    )}
                </div>

                {/* Category filter */}
                <div style={{ minWidth: 140 }}>
                    <CustomSelect
                        value={list.categoryFilter}
                        onChange={(v) => patchList({ categoryFilter: v })}
                        options={[{ value: "", label: "All Categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                    />
                </div>
            </div>

            {/* ── Draft banner ────────────────────────────────────────── */}
            {list.filter !== "draft" && counts.draft > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm font-semibold cursor-pointer"
                    style={{
                        background: "rgba(255,149,0,0.1)",
                        border: "1px solid rgba(255,149,0,0.25)",
                        color: "#FF9500"
                    }}
                    onClick={() => patchList({ filter: "draft" })}>
                    <FilterList fontSize="small" />
                    {counts.draft} draft {counts.draft === 1 ? "entry" : "entries"} — click to view
                </motion.div>
            )}

            {/* ── FAQ List ────────────────────────────────────────────── */}
            {list.loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-16 rounded-2xl animate-pulse"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {visible.map((f) => (
                            <motion.div
                                key={f._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                                style={{
                                    background: cardBg,
                                    border: f.isPublished ? border : `1px solid rgba(255,149,0,0.2)`,
                                    borderRadius: br,
                                    backdropFilter: isApple ? "blur(16px)" : "none"
                                }}>
                                {/* Draft indicator bar */}
                                {!f.isPublished && (
                                    <div
                                        className="w-1 h-10 rounded-full shrink-0"
                                        style={{ background: "#FF9500" }}
                                    />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                                            style={{
                                                background: `${palette.accent}18`,
                                                color: palette.accent
                                            }}>
                                            {f.category}
                                        </span>
                                        {!f.isPublished ? (
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full font-black"
                                                style={{
                                                    background: "rgba(255,149,0,0.15)",
                                                    color: "#FF9500"
                                                }}>
                                                DRAFT
                                            </span>
                                        ) : (
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                style={{
                                                    background: "rgba(52,199,89,0.12)",
                                                    color: "#34C759"
                                                }}>
                                                Published
                                            </span>
                                        )}
                                        <span
                                            className="text-xs"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            #{f.order}
                                        </span>
                                    </div>
                                    <p
                                        className="font-bold text-sm truncate"
                                        style={{ color: palette.textPrimary }}>
                                        {f.question}
                                    </p>
                                    <p
                                        className="text-xs truncate mt-0.5"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        {f.answer}
                                    </p>
                                </div>

                                <div
                                    className="flex items-center gap-1 text-xs shrink-0"
                                    style={{ color: palette.textTertiary }}>
                                    <span>👍 {f.helpful}</span>
                                    <span className="mx-1">·</span>
                                    <span>👎 {f.notHelpful}</span>
                                </div>

                                <div className="flex gap-1 shrink-0">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => togglePublish(f)}
                                        className="p-1.5 rounded-lg"
                                        title={f.isPublished ? "Unpublish" : "Publish"}
                                        style={{
                                            color: f.isPublished ? "#34C759" : "#FF9500"
                                        }}>
                                        {f.isPublished ? <ToggleOn /> : <ToggleOff />}
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => openEdit(f)}
                                        className="p-1.5 rounded-lg"
                                        style={{ color: palette.accent }}>
                                        <Edit fontSize="small" />
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => deleteFAQ(f._id)}
                                        className="p-1.5 rounded-lg"
                                        style={{ color: "#FF3B30" }}>
                                        <Delete fontSize="small" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {visible.length === 0 && (
                        <div
                            className="text-center py-16"
                            style={{ color: palette.textSecondary }}>
                            {list.filter === "draft"
                                ? "No draft entries."
                                : list.filter === "published"
                                  ? "No published FAQ entries."
                                  : "No FAQ entries yet. Create one!"}
                        </div>
                    )}
                </div>
            )}

            {/* ── Form Panel ──────────────────────────────────────────── */}
            <AnimatePresence>
                {panel.open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-40"
                            onClick={() => patchPanel({ open: false })}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                                type: "spring",
                                damping: 28,
                                stiffness: 300
                            }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{
                                background: isDark ? "#1c1c20" : "#f5f5f8"
                            }}>
                            <div
                                className="flex items-center justify-between px-6 py-5 border-b"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
                                }}>
                                <div>
                                    <h2
                                        className="font-black text-lg"
                                        style={{ color: palette.textPrimary }}>
                                        {panel.editId ? "Edit FAQ" : "New FAQ"}
                                    </h2>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{
                                            color: panel.form.isPublished ? "#34C759" : "#FF9500"
                                        }}>
                                        {panel.form.isPublished ? "● Published" : "● Draft"}
                                    </p>
                                </div>
                                <button onClick={() => patchPanel({ open: false })}>
                                    <Close style={{ color: palette.textSecondary }} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <input
                                    className={inputClass}
                                    style={inputStyle}
                                    placeholder="Question"
                                    value={panel.form.question}
                                    onChange={(e) =>
                                        patchPanel({
                                            form: {
                                                ...panel.form,
                                                question: e.target.value
                                            }
                                        })
                                    }
                                />
                                <textarea
                                    className={`${inputClass} resize-none`}
                                    style={inputStyle}
                                    placeholder="Answer"
                                    rows={6}
                                    value={panel.form.answer}
                                    onChange={(e) =>
                                        patchPanel({
                                            form: {
                                                ...panel.form,
                                                answer: e.target.value
                                            }
                                        })
                                    }
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <CustomSelect
                                        value={panel.form.category}
                                        onChange={(v) =>
                                            patchPanel({
                                                form: {
                                                    ...panel.form,
                                                    category: v
                                                }
                                            })
                                        }
                                        options={CATEGORIES.map((c) => ({
                                            value: c,
                                            label: c
                                        }))}
                                    />
                                    <input
                                        type="number"
                                        className={inputClass}
                                        style={inputStyle}
                                        placeholder="Sort order (0 = first)"
                                        value={panel.form.order}
                                        onChange={(e) =>
                                            patchPanel({
                                                form: {
                                                    ...panel.form,
                                                    order: Number(e.target.value)
                                                }
                                            })
                                        }
                                    />
                                </div>

                                {/* Publish toggle */}
                                <div
                                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                                    style={{
                                        background: panel.form.isPublished ? "rgba(52,199,89,0.08)" : "rgba(255,149,0,0.08)",
                                        border: `1px solid ${panel.form.isPublished ? "rgba(52,199,89,0.25)" : "rgba(255,149,0,0.25)"}`
                                    }}>
                                    <div>
                                        <p
                                            className="text-sm font-bold"
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {panel.form.isPublished ? "Published" : "Draft"}
                                        </p>
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            {panel.form.isPublished ? "Visible to users" : "Hidden from public view"}
                                        </p>
                                    </div>
                                    <div
                                        className="w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                                        style={{
                                            background: panel.form.isPublished
                                                ? "#34C759"
                                                : isDark
                                                  ? "rgba(255,255,255,0.1)"
                                                  : "rgba(0,0,0,0.1)"
                                        }}
                                        onClick={() =>
                                            patchPanel({
                                                form: {
                                                    ...panel.form,
                                                    isPublished: !panel.form.isPublished
                                                }
                                            })
                                        }>
                                        <div
                                            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow"
                                            style={{
                                                transform: `translateX(${panel.form.isPublished ? 26 : 4}px)`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div
                                className="px-6 pb-6 pt-3 border-t"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
                                }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={save}
                                    disabled={panel.saving || !panel.form.question.trim()}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{
                                        background: palette.accent,
                                        color: "#fff",
                                        opacity: !panel.form.question.trim() ? 0.5 : 1
                                    }}>
                                    <Save fontSize="small" /> {panel.saving ? "Saving…" : "Save FAQ"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
