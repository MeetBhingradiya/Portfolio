"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import HeadNavigation from "@Components/Common/HeadNavigation";
import { Language, Link as LinkIcon, GridView, ViewList, Search, Add, Edit, Delete, Close, AutoAwesome } from "@mui/icons-material";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

interface NetworkDomain {
    _id: string;
    name: string;
    domain: string;
    description?: string;
    icon?: string;
    enabled: boolean;
    type: "domain" | "subdomain";
}

export default function NetworkPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [domains, setDomains] = useState<NetworkDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Google Search State
    const [googleQuery, setGoogleQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", domain: "", description: "", icon: "", type: "domain", enabled: true });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDomains();

        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!googleQuery.trim()) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/google-suggest?q=${encodeURIComponent(googleQuery)}`);
                const data = await res.json();
                setSuggestions(Array.isArray(data) ? data : []);
            } catch (err) {
                setSuggestions([]);
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [googleQuery]);

    const fetchDomains = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/network");
            const json = await res.json();
            if (json.success) {
                setDomains(json.data);
                setIsAdmin(json.isAdmin || false);
            } else {
                setError(json.error || "Failed to load network domains.");
            }
        } catch (err) {
            setError("A network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSearch = (e: React.FormEvent | string) => {
        if (typeof e !== "string") e.preventDefault();
        const query = typeof e === "string" ? e : googleQuery;
        if (!query.trim()) return;
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    };

    const handleOpenModal = (domain?: NetworkDomain) => {
        if (domain) {
            setEditingId(domain._id);
            setFormData({
                name: domain.name,
                domain: domain.domain,
                description: domain.description || "",
                icon: domain.icon || "",
                type: domain.type,
                enabled: domain.enabled
            });
        } else {
            setEditingId(null);
            setFormData({ name: "", domain: "", description: "", icon: "", type: "domain", enabled: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const url = editingId ? `/api/network/${editingId}` : "/api/network";
            const method = editingId ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const json = await res.json();
            
            if (json.success) {
                await fetchDomains();
                handleCloseModal();
            } else {
                alert(json.error || "An error occurred.");
            }
        } catch (err) {
            alert("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this network domain?")) return;
        try {
            const res = await fetch(`/api/network/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                setDomains(prev => prev.filter(d => d._id !== id));
            } else {
                alert(json.error || "Failed to delete.");
            }
        } catch (err) {
            alert("Network error.");
        }
    };

    const cardBg = isApple ? (isDark ? "rgba(35,35,40,0.85)" : "rgba(255,255,255,0.88)") : isDark ? "rgba(27,27,33,0.98)" : "#ffffff";
    const shellBg = isDark ? palette.background : palette.background;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
    const badgeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
    const inputBg = isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)";

    const filteredDomains = domains.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <main className="min-h-screen" style={{ background: shellBg }}>
            <HeadNavigation />
            
            <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
                {/* Google Search Bar (New Tab Style) */}
                <div className="flex flex-col items-center mb-16 relative" ref={suggestionRef}>
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-extrabold mb-8 text-transparent bg-clip-text" 
                        style={{ backgroundImage: `linear-gradient(90deg, ${palette.accent}, ${palette.textPrimary})` }}
                    >
                        Network
                    </motion.h1>
                    
                    <form onSubmit={handleGoogleSearch} className="w-full max-w-2xl relative z-20">
                        <div className="relative flex items-center w-full shadow-2xl rounded-full" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                            <Search className="absolute left-6" style={{ color: palette.textSecondary }} />
                            <input 
                                type="text"
                                value={googleQuery}
                                onChange={(e) => { setGoogleQuery(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Search Google or type a URL..."
                                className="w-full bg-transparent outline-none py-4 pl-14 pr-6 text-lg rounded-full"
                                style={{ color: palette.textPrimary }}
                            />
                        </div>
                        
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 rounded-[20px] overflow-hidden shadow-2xl z-30"
                                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}
                                >
                                    {suggestions.map((sug, i) => (
                                        <div 
                                            key={i}
                                            onClick={() => { setGoogleQuery(sug); setShowSuggestions(false); handleGoogleSearch(sug); }}
                                            className="px-6 py-3 cursor-pointer flex items-center gap-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                        >
                                            <Search fontSize="small" style={{ color: palette.textSecondary }} />
                                            <span style={{ color: palette.textPrimary }}>{sug}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: palette.textSecondary }} />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter networks..."
                            className="w-full py-3 pl-12 pr-4 rounded-xl outline-none transition-all focus:ring-2"
                            style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}`, outlineColor: palette.accent }}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 shrink-0" style={{ border: `1px solid ${borderColor}` }}>
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "shadow-sm" : "opacity-50 hover:opacity-100"}`}
                                style={{ background: viewMode === "grid" ? cardBg : "transparent" }}
                            >
                                <GridView />
                            </button>
                            <button 
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "shadow-sm" : "opacity-50 hover:opacity-100"}`}
                                style={{ background: viewMode === "list" ? cardBg : "transparent" }}
                            >
                                <ViewList />
                            </button>
                        </div>
                        
                        {isAdmin && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOpenModal()}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg shrink-0"
                                style={{ background: palette.accent, color: "#fff" }}
                            >
                                <Add />
                                New Network
                            </motion.button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: `${palette.accent} transparent transparent transparent` }} />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 rounded-[30px]" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <Language style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.5, marginBottom: 16 }} />
                        <h2 className="text-xl font-bold mb-2" style={{ color: palette.textPrimary }}>Error</h2>
                        <p style={{ color: palette.textSecondary }}>{error}</p>
                    </div>
                ) : filteredDomains.length === 0 ? (
                    <div className="text-center py-20 rounded-[30px]" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <Language style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.5, marginBottom: 16 }} />
                        <h2 className="text-xl font-bold mb-2" style={{ color: palette.textPrimary }}>No Networks Found</h2>
                        <p style={{ color: palette.textSecondary }}>{searchQuery ? "Try adjusting your search criteria." : "No networks have been added yet."}</p>
                    </div>
                ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                        <AnimatePresence>
                            {filteredDomains.map((item) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    key={item._id} 
                                    className={`rounded-[30px] p-6 transition-all hover:scale-[1.02] flex group ${viewMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col'}`}
                                    style={{ 
                                        background: cardBg, 
                                        border: `1px solid ${borderColor}`,
                                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div className={`flex items-start gap-4 ${viewMode === 'grid' ? 'mb-4' : ''}`}>
                                        {item.icon ? (
                                            <img src={item.icon} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shrink-0 bg-white" style={{ border: `1px solid ${borderColor}` }} />
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${palette.accent}15`, color: palette.accent }}>
                                                <Language fontSize="large" />
                                            </div>
                                        )}
                                        {viewMode === "grid" && (
                                            <div className="pt-1 flex-1 relative pr-8">
                                                <h3 className="text-xl font-bold leading-tight mb-1" style={{ color: palette.textPrimary }}>{item.name}</h3>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: badgeBg, color: palette.textSecondary }}>
                                                    {item.type}
                                                </span>

                                                {isAdmin && (
                                                    <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" style={{ color: palette.textSecondary }}>
                                                            <Edit fontSize="small" />
                                                        </button>
                                                        <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-full hover:bg-red-500/10 transition-colors" style={{ color: "#ff3b30" }}>
                                                            <Delete fontSize="small" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {viewMode === "list" && (
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold truncate" style={{ color: palette.textPrimary }}>{item.name}</h3>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ background: badgeBg, color: palette.textSecondary }}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <p className="text-sm truncate opacity-80" style={{ color: palette.textSecondary }}>{item.description || "No description provided."}</p>
                                        </div>
                                    )}

                                    {viewMode === "grid" && (
                                        <p className="text-sm flex-1 mb-6 opacity-80" style={{ color: palette.textSecondary, lineHeight: 1.6 }}>
                                            {item.description || "No description provided."}
                                        </p>
                                    )}
                                    
                                    <div className={`${viewMode === 'grid' ? 'mt-auto pt-4 border-t' : ''} flex items-center justify-between gap-4 shrink-0`} style={{ borderColor: viewMode === 'grid' ? borderColor : 'transparent' }}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                                            {viewMode === "grid" && (
                                                <span className="text-xs font-semibold" style={{ color: palette.textSecondary }}>
                                                    {item.enabled ? "Active" : "Inactive"}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {viewMode === "list" && isAdmin && (
                                                <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" style={{ color: palette.textSecondary }}>
                                                        <Edit fontSize="small" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-full hover:bg-red-500/10 transition-colors" style={{ color: "#ff3b30" }}>
                                                        <Delete fontSize="small" />
                                                    </button>
                                                </div>
                                            )}
                                            <Link href={`https://${item.domain}`} target="_blank" rel="noopener noreferrer">
                                                <button 
                                                    className="px-4 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center gap-2"
                                                    style={{ background: palette.accent, color: "#fff" }}
                                                    disabled={!item.enabled}
                                                >
                                                    <LinkIcon fontSize="small" />
                                                    Visit
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg rounded-[30px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                            style={{ background: cardBg, border: `1px solid ${borderColor}` }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>
                                    {editingId ? "Edit Network" : "New Network"}
                                </h2>
                                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: palette.textSecondary }}>
                                    <Close />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Name *</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="Main Site"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Domain *</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.domain}
                                        onChange={e => setFormData(p => ({ ...p, domain: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="example.com"
                                    />
                                </div>
                                
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData(p => ({ ...p, type: e.target.value as "domain" | "subdomain" }))}
                                            className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                            style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        >
                                            <option value="domain">Domain</option>
                                            <option value="subdomain">Subdomain</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-end pb-3 pl-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.enabled}
                                                onChange={e => setFormData(p => ({ ...p, enabled: e.target.checked }))}
                                                className="w-5 h-5 rounded accent-blue-500"
                                            />
                                            <span className="font-bold text-sm" style={{ color: palette.textPrimary }}>Active</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Description</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all min-h-[80px] resize-y"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="What is this network for?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Custom Icon URL (optional)</label>
                                    <input 
                                        type="url" 
                                        value={formData.icon}
                                        onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="Leave empty for default icon"
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full mt-4 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-70"
                                    style={{ background: palette.accent }}
                                >
                                    {submitting ? "Saving..." : "Save Network"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
