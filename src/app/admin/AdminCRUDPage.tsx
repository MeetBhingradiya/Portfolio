/**
 * Generic Admin CRUD Page
 * Provides search, paginated table, create/edit modal, and delete for any
 * resource that follows the standard admin API pattern.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    Add,
    Search,
    Edit,
    Delete,
    Close,
    Save,
    ChevronLeft,
    ChevronRight,
    Refresh
} from "@mui/icons-material";

export interface FieldDef {
    key: string;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "select" | "multiline" | "url" | "boolean" | "tags";
    options?: string[];          // for select
    required?: boolean;
    placeholder?: string;
    colSpan?: 1 | 2;            // grid column span in form
    tableVisible?: boolean;     // show in table? default true
}

interface AdminCRUDPageProps {
    title: string;
    subtitle?: string;
    apiBase: string;             // e.g. "/api/admin/projects"
    idField: string;             // e.g. "ProjectID"
    fields: FieldDef[];
    defaultValues?: Record<string, any>;
}

const PAGE_SIZE = 15;

export default function AdminCRUDPage({
    title,
    subtitle,
    apiBase,
    idField,
    fields,
    defaultValues = {}
}: AdminCRUDPageProps) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [form, setForm] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), search });
            const res = await fetch(`${apiBase}?${params}`);
            const json = await res.json();
            if (json.success) {
                setItems(json.data ?? []);
                setTotal(json.pagination?.total ?? json.data?.length ?? 0);
            } else {
                setError(json.error || "Failed to load");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [apiBase, page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearchChange = (val: string) => {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
    };

    const openCreate = () => {
        setEditItem(null);
        setForm({ ...defaultValues });
        setModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditItem(item);
        const initial: Record<string, any> = {};
        fields.forEach(f => {
            initial[f.key] = item[f.key] ?? defaultValues[f.key] ?? "";
        });
        setForm(initial);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditItem(null);
        setForm({});
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let res: Response;
            if (editItem) {
                res = await fetch(`${apiBase}/${editItem[idField]}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                });
            } else {
                res = await fetch(apiBase, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                });
            }
            const json = await res.json();
            if (json.success) {
                closeModal();
                fetchData();
            } else {
                setError(json.error || "Save failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) fetchData();
            else setError(json.error || "Delete failed");
        } catch {
            setError("Network error");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const tableFields = fields.filter(f => f.tableVisible !== false);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Style helpers
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)"
        : isDark ? "rgba(24,24,28,0.95)" : "rgba(255,255,255,0.95)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const cardRadius = isApple ? "20px" : "28px";
    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: isApple ? "12px" : "16px",
        color: palette.textPrimary,
        padding: "10px 14px",
        outline: "none",
        width: "100%",
        fontSize: "14px"
    };

    const renderField = (field: FieldDef) => {
        const val = form[field.key];
        const update = (v: any) => setForm(prev => ({ ...prev, [field.key]: v }));

        if (field.type === "textarea") {
            return (
                <textarea
                    key={field.key}
                    placeholder={field.placeholder || field.label}
                    value={val || ""}
                    onChange={e => update(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                    required={field.required}
                />
            );
        }
        if (field.type === "boolean") {
            return (
                <div key={field.key} className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={field.key}
                        checked={!!val}
                        onChange={e => update(e.target.checked)}
                    />
                    <label htmlFor={field.key} style={{ color: palette.textSecondary, fontSize: 14 }}>
                        {field.label}
                    </label>
                </div>
            );
        }
        if (field.type === "select" && field.options) {
            return (
                <CustomSelect
                    key={field.key}
                    value={val || ""}
                    onChange={update}
                    options={[
                        { value: "", label: `Select ${field.label}` },
                        ...field.options.map(opt => ({ value: opt, label: opt }))
                    ]}
                    placeholder={`Select ${field.label}`}
                />
            );
        }
        if (field.type === "tags") {
            const tags: string[] = Array.isArray(val) ? val : [];
            return (
                <div key={field.key}>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                                style={{ background: `${palette.accent}20`, color: palette.accent }}
                            >
                                {tag}
                                <button type="button" onClick={() => update(tags.filter((_, j) => j !== i))}>
                                    <Close style={{ fontSize: 12 }} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        placeholder={`Type ${field.label} and press Enter`}
                        style={inputStyle}
                        onKeyDown={e => {
                            if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                const v = (e.target as HTMLInputElement).value.trim();
                                if (v && !tags.includes(v)) update([...tags, v]);
                                (e.target as HTMLInputElement).value = "";
                            }
                        }}
                    />
                </div>
            );
        }
        return (
            <input
                key={field.key}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
                placeholder={field.placeholder || field.label}
                value={field.type === "date" ? (val ? new Date(val).toISOString().split("T")[0] : "") : (val ?? "")}
                onChange={e => update(field.type === "number" ? Number(e.target.value) : e.target.value)}
                style={inputStyle}
                required={field.required}
            />
        );
    };

    const renderCellValue = (item: any, field: FieldDef) => {
        const val = item[field.key];
        if (val === undefined || val === null || val === "") return <span style={{ color: palette.textTertiary }}>—</span>;
        if (field.type === "boolean") return val ? "✓" : "✗";
        if (field.type === "tags" || Array.isArray(val)) {
            const arr = Array.isArray(val) ? val : [val];
            return (
                <div className="flex flex-wrap gap-1">
                    {arr.slice(0, 3).map((t: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: `${palette.accent}18`, color: palette.accent }}>
                            {t}
                        </span>
                    ))}
                    {arr.length > 3 && <span style={{ color: palette.textTertiary, fontSize: 12 }}>+{arr.length - 3}</span>}
                </div>
            );
        }
        if (field.type === "date") return val ? new Date(val).toLocaleDateString() : "—";
        if (field.type === "url") return (
            <a href={val} target="_blank" rel="noopener noreferrer"
                className="text-xs underline truncate max-w-[120px] block"
                style={{ color: palette.accent }}>
                {val}
            </a>
        );
        return <span className="truncate block max-w-[160px]">{String(val)}</span>;
    };

    return (
        <div className="p-6" style={{ minHeight: "100vh", background: palette.background }}>
            {/* Page header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: palette.textPrimary }}>{title}</h1>
                    {subtitle && <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>{subtitle}</p>}
                    <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>{total} records</p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={fetchData}
                    >
                        <Refresh fontSize="small" /> Refresh
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: palette.accent, color: "#fff" }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={openCreate}
                    >
                        <Add fontSize="small" /> Add New
                    </motion.button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: palette.textTertiary, fontSize: 18 }} />
                <input
                    placeholder={`Search ${title}...`}
                    style={{ ...inputStyle, paddingLeft: "38px" }}
                    onChange={e => handleSearchChange(e.target.value)}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232", border: "1px solid rgba(220,50,50,0.2)" }}>
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                {tableFields.map(f => (
                                    <th key={f.key} className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide"
                                        style={{ color: palette.textTertiary }}>
                                        {f.label}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wide"
                                    style={{ color: palette.textTertiary }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t" style={{ borderColor }}>
                                        {tableFields.map(f => (
                                            <td key={f.key} className="px-4 py-3">
                                                <div className="h-4 rounded animate-pulse"
                                                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", width: "70%" }} />
                                            </td>
                                        ))}
                                        <td className="px-4 py-3" />
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={tableFields.length + 1} className="px-4 py-12 text-center"
                                        style={{ color: palette.textTertiary }}>
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr
                                        key={item[idField] || item._id}
                                        className="border-t transition-colors"
                                        style={{ borderColor }}
                                    >
                                        {tableFields.map(f => (
                                            <td key={f.key} className="px-4 py-3" style={{ color: palette.textPrimary }}>
                                                {renderCellValue(item, f)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-1.5 rounded-lg"
                                                    style={{ background: `${palette.accent}15`, color: palette.accent }}
                                                    onClick={() => openEdit(item)}
                                                    title="Edit"
                                                >
                                                    <Edit style={{ fontSize: 16 }} />
                                                </motion.button>
                                                {deleteConfirm === (item[idField] || item._id) ? (
                                                    <div className="flex gap-1">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            className="px-2 py-1 rounded-lg text-xs font-bold"
                                                            style={{ background: "rgba(220,50,50,0.15)", color: "#DC3232" }}
                                                            onClick={() => handleDelete(item[idField] || item._id)}
                                                        >
                                                            Confirm
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            className="px-2 py-1 rounded-lg text-xs"
                                                            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                                            onClick={() => setDeleteConfirm(null)}
                                                        >
                                                            Cancel
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232" }}
                                                        onClick={() => setDeleteConfirm(item[idField] || item._id)}
                                                        title="Delete"
                                                    >
                                                        <Delete style={{ fontSize: 16 }} />
                                                    </motion.button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor }}>
                        <p className="text-xs" style={{ color: palette.textTertiary }}>
                            Page {page} of {pages} ({total} total)
                        </p>
                        <div className="flex gap-2">
                            <motion.button
                                disabled={page <= 1}
                                whileHover={{ scale: page > 1 ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: page <= 1 ? palette.textTertiary : palette.textSecondary
                                }}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft fontSize="small" />
                            </motion.button>
                            <motion.button
                                disabled={page >= pages}
                                whileHover={{ scale: page < pages ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: page >= pages ? palette.textTertiary : palette.textSecondary
                                }}
                                onClick={() => setPage(p => Math.min(pages, p + 1))}
                            >
                                <ChevronRight fontSize="small" />
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-50"
                            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                        />
                        <motion.div
                            className="fixed z-50 inset-0 flex items-center justify-center p-4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div
                                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                                style={{ background: cardBg, borderRadius: cardRadius, border: `1px solid ${borderColor}` }}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Modal header */}
                                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor }}>
                                    <h2 className="text-lg font-black" style={{ color: palette.textPrimary }}>
                                        {editItem ? `Edit ${title.replace(/s$/, "")}` : `Add ${title.replace(/s$/, "")}`}
                                    </h2>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-1.5 rounded-xl"
                                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                        onClick={closeModal}
                                    >
                                        <Close fontSize="small" />
                                    </motion.button>
                                </div>

                                {/* Form */}
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {fields.map(field => (
                                            <div
                                                key={field.key}
                                                className={field.colSpan === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}
                                            >
                                                {field.type !== "boolean" && (
                                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                                        style={{ color: palette.textTertiary }}>
                                                        {field.label} {field.required && <span style={{ color: "#DC3232" }}>*</span>}
                                                    </label>
                                                )}
                                                {renderField(field)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal footer */}
                                <div className="flex items-center justify-end gap-3 px-6 pb-6">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                        onClick={closeModal}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                                        style={{ background: palette.accent, color: "#fff", opacity: saving ? 0.7 : 1 }}
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        <Save fontSize="small" />
                                        {saving ? "Saving…" : "Save"}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
