"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    MapOutlined,
    Add,
    Edit,
    Delete,
    CheckCircle,
    Schedule,
    Save,
    Close,
    ArrowUpward,
    ArrowDownward
} from "@mui/icons-material";

interface RoadmapItem {
    _id: string;
    title: string;
    description: string;
    status: "planned" | "completed";
    completedAt?: string;
    order: number;
    isPublished: boolean;
}

export default function AdminRoadmapPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    
    const [items, setItems] = useState<RoadmapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.80)" : "rgba(255,255,255,0.80)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`
    };

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/roadmap");
            const json = await res.json();
            if (json.success) setItems(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSave = async (item: RoadmapItem) => {
        setSaving(true);
        try {
            const url = item._id ? `/api/admin/roadmap/${item._id}` : "/api/admin/roadmap";
            const method = item._id ? "PATCH" : "POST";
            
            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item)
            });
            await fetchItems();
            setEditingItem(null);
            setIsCreating(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        setSaving(true);
        try {
            await fetch(`/api/admin/roadmap/${id}`, { method: "DELETE" });
            await fetchItems();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const moveOrder = async (index: number, direction: -1 | 1) => {
        const plannedItems = items.filter(i => i.status === "planned").sort((a, b) => a.order - b.order);
        if (index + direction < 0 || index + direction >= plannedItems.length) return;

        const current = plannedItems[index];
        const swap = plannedItems[index + direction];

        // Swap orders
        await fetch(`/api/admin/roadmap/${current._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: swap.order })
        });
        await fetch(`/api/admin/roadmap/${swap._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: current.order })
        });
        
        fetchItems();
    };

    const plannedItems = items.filter(i => i.status === "planned").sort((a, b) => a.order - b.order);
    const completedItems = items.filter(i => i.status === "completed").sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

    const ItemEditor = ({ item, onCancel }: { item: RoadmapItem | Partial<RoadmapItem>, onCancel: () => void }) => {
        const [formData, setFormData] = useState({
            ...item,
            title: item.title || "",
            description: item.description || "",
            status: item.status || "planned",
            isPublished: item.isPublished ?? true
        });

        return (
            <div className="p-5 rounded-2xl mb-4" style={{ background: cardBg, border }}>
                <h3 className="font-bold mb-4" style={{ color: palette.textPrimary }}>
                    {item._id ? "Edit Item" : "New Item"}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold block mb-1.5" style={{ color: palette.textSecondary }}>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(s => ({ ...s, title: e.target.value }))}
                            className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold block mb-1.5" style={{ color: palette.textSecondary }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(s => ({ ...s, description: e.target.value }))}
                            className="w-full text-sm px-4 py-2.5 rounded-xl outline-none min-h-[80px]"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold block mb-1.5" style={{ color: palette.textSecondary }}>Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(s => ({ ...s, status: e.target.value as any }))}
                            className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
                            style={inputStyle}
                        >
                            <option value="planned">Planned (Soon™)</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="text-sm font-bold" style={{ color: palette.textPrimary }}>Publish to Roadmap</p>
                            <p className="text-xs mt-1" style={{ color: palette.textSecondary }}>Make this item visible on the public roadmap page.</p>
                        </div>
                        <button 
                            onClick={() => setFormData(s => ({ ...s, isPublished: !s.isPublished }))} 
                            className="w-12 h-6 rounded-full relative transition-colors flex-shrink-0" 
                            style={{ background: formData.isPublished ? palette.accent : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)") }}
                        >
                            <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm" style={{ transform: `translateX(${formData.isPublished ? '26px' : '4px'})` }} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={() => handleSave(formData as RoadmapItem)}
                            disabled={saving || !formData.title.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                            style={{ background: palette.accent, color: "#fff", opacity: saving || !formData.title.trim() ? 0.5 : 1 }}
                        >
                            <Save fontSize="small" /> Save
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                            style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${palette.accent}20`, color: palette.accent }}>
                        <MapOutlined />
                    </div>
                    <div>
                        <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                            Roadmap
                        </h1>
                        <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                            Manage planned features and the changelog timeline.
                        </p>
                    </div>
                </div>
                {!isCreating && !editingItem && (
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                        style={{ background: palette.accent, color: "#fff" }}
                    >
                        <Add fontSize="small" /> Add Item
                    </motion.button>
                )}
            </div>

            {isCreating && <ItemEditor item={{}} onCancel={() => setIsCreating(false)} />}
            {editingItem && <ItemEditor item={editingItem} onCancel={() => setEditingItem(null)} />}

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Planned */}
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: palette.textTertiary }}>
                            <Schedule fontSize="small" /> Planned
                        </h2>
                        <div className="space-y-3">
                            {plannedItems.length === 0 ? (
                                <p className="text-sm italic" style={{ color: palette.textSecondary }}>No planned items.</p>
                            ) : (
                                plannedItems.map((item, idx) => (
                                    <div key={item._id} className="p-4 rounded-2xl flex items-start justify-between" style={{ background: cardBg, border }}>
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm" style={{ color: palette.textPrimary }}>{item.title}</h3>
                                                {!item.isPublished && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textSecondary }}>Hidden</span>
                                                )}
                                            </div>
                                            <p className="text-xs mt-1 line-clamp-2" style={{ color: palette.textSecondary }}>{item.description}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end shrink-0">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => moveOrder(idx, -1)} disabled={idx === 0} className="p-1 rounded-lg disabled:opacity-30" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}><ArrowUpward style={{ fontSize: 14 }}/></button>
                                                <button onClick={() => moveOrder(idx, 1)} disabled={idx === plannedItems.length - 1} className="p-1 rounded-lg disabled:opacity-30" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}><ArrowDownward style={{ fontSize: 14 }}/></button>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <button onClick={() => setEditingItem(item)} className="p-1 rounded-lg" style={{ color: palette.textSecondary }}><Edit style={{ fontSize: 16 }}/></button>
                                                <button onClick={() => handleDelete(item._id)} className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"><Delete style={{ fontSize: 16 }}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Completed */}
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#34C759" }}>
                            <CheckCircle fontSize="small" /> Completed
                        </h2>
                        <div className="space-y-3">
                            {completedItems.length === 0 ? (
                                <p className="text-sm italic" style={{ color: palette.textSecondary }}>No completed items.</p>
                            ) : (
                                completedItems.map(item => (
                                    <div key={item._id} className="p-4 rounded-2xl flex items-start justify-between opacity-80" style={{ background: cardBg, border }}>
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm" style={{ color: palette.textPrimary }}>{item.title}</h3>
                                                {!item.isPublished && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textSecondary }}>Hidden</span>
                                                )}
                                            </div>
                                            <p className="text-xs mt-1 line-clamp-2" style={{ color: palette.textSecondary }}>{item.description}</p>
                                            <p className="text-[10px] uppercase font-bold mt-2" style={{ color: palette.textTertiary }}>
                                                {new Date(item.completedAt!).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => setEditingItem(item)} className="p-1 rounded-lg" style={{ color: palette.textSecondary }}><Edit style={{ fontSize: 16 }}/></button>
                                            <button onClick={() => handleDelete(item._id)} className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"><Delete style={{ fontSize: 16 }}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
