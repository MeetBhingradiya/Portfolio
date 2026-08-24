"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import HeadNavigation from "@Components/Common/HeadNavigation";
import { BookmarkBorder, Add, Edit, Delete, Link as LinkIcon, Close, OpenInNew, AutoAwesome, ViewList, GridView, Search, UploadFile } from "@mui/icons-material";
import { motion, AnimatePresence } from "motion/react";

interface Bookmark {
    _id: string;
    Title: string;
    Url: string;
    Description?: string;
    Icon?: string;
    Tags?: string[];
    createdAt: string;
}

export default function BookmarksPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Google Search State
    const [googleQuery, setGoogleQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // View & Filter State
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ Title: "", Url: "", Description: "", Icon: "", Tags: "" });
    const [submitting, setSubmitting] = useState(false);
    const [generatingTags, setGeneratingTags] = useState(false);

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        fetchBookmarks();

        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Google Suggestions
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

    const fetchBookmarks = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/bookmarks");
            const json = await res.json();
            if (json.success) {
                setBookmarks(json.data);
                setIsAdmin(json.isAdmin || false);
            } else if (res.status === 401) {
                setError("Please log in to view and manage your bookmarks.");
            } else {
                setError(json.error || "Failed to load bookmarks.");
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

    const handleOpenModal = (bookmark?: Bookmark) => {
        if (bookmark) {
            setEditingId(bookmark._id);
            setFormData({
                Title: bookmark.Title,
                Url: bookmark.Url,
                Description: bookmark.Description || "",
                Icon: bookmark.Icon || "",
                Tags: bookmark.Tags?.join(", ") || ""
            });
        } else {
            setEditingId(null);
            setFormData({ Title: "", Url: "", Description: "", Icon: "", Tags: "" });
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
        
        const payload = {
            ...formData,
            Tags: formData.Tags.split(",").map(t => t.trim()).filter(Boolean)
        };

        try {
            const url = editingId ? `/api/bookmarks/${editingId}` : "/api/bookmarks";
            const method = editingId ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            
            if (json.success) {
                await fetchBookmarks();
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
        if (!confirm("Are you sure you want to delete this bookmark?")) return;
        try {
            const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                setBookmarks(prev => prev.filter(b => b._id !== id));
            } else {
                alert(json.error || "Failed to delete.");
            }
        } catch (err) {
            alert("Network error.");
        }
    };

    const handleGenerateTags = async () => {
        if (!formData.Title && !formData.Url) {
            alert("Please provide at least a Title or URL to generate tags.");
            return;
        }
        setGeneratingTags(true);
        try {
            const prompt = `Title: ${formData.Title}\nURL: ${formData.Url}\nDescription: ${formData.Description}`;
            const res = await fetch("/api/productivity/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate_tags", prompt })
            });
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setFormData(prev => ({ ...prev, Tags: json.data.join(", ") }));
            } else {
                alert(json.error || "Failed to generate tags.");
            }
        } catch (err) {
            alert("Network error.");
        } finally {
            setGeneratingTags(false);
        }
    };

    // --- DRAG AND DROP HANDLERS ---
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        // 1. Try to get a File
        const file = e.dataTransfer.files?.[0];
        if (file) {
            await handleFileUpload(file);
            return;
        }

        // 2. Try to get a URL/Text
        const textData = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
        if (textData) {
            const isUrl = textData.startsWith("http://") || textData.startsWith("https://");
            handleOpenModal();
            setFormData(p => ({ ...p, Url: isUrl ? textData : "", Title: isUrl ? "Dropped Link" : textData }));
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploadingFile(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            
            const res = await fetch("/api/cdn/upload", {
                method: "POST",
                body: fd
            });
            const json = await res.json();
            if (json.cdnUrl) {
                // Auto-create a bookmark for this file
                const bkmkRes = await fetch("/api/bookmarks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        Title: json.filename || "Uploaded File",
                        Url: json.cdnUrl,
                        Description: `Uploaded via drag and drop. Size: ${(json.size / 1024).toFixed(1)} KB`,
                        Tags: [json.type, "upload"]
                    })
                });
                const bkmkJson = await bkmkRes.json();
                if (bkmkJson.success) {
                    await fetchBookmarks();
                } else {
                    alert(bkmkJson.error || "Failed to bookmark the uploaded file.");
                }
            } else {
                alert(json.error || "Failed to upload file to CDN.");
            }
        } catch (err) {
            alert("Upload failed.");
        } finally {
            setUploadingFile(false);
        }
    };

    const cardBg = isApple ? (isDark ? "rgba(35,35,40,0.85)" : "rgba(255,255,255,0.88)") : isDark ? "rgba(27,27,33,0.98)" : "#ffffff";
    const shellBg = isDark ? palette.background : palette.background;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)";
    const dropOverlayBg = isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)";

    const filteredBookmarks = bookmarks.filter(b => 
        b.Title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.Url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.Tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <main 
            className="min-h-screen relative" 
            style={{ background: shellBg }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <HeadNavigation />
            
            {/* Drag & Drop Overlay */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none"
                        style={{ background: dropOverlayBg }}
                    >
                        <UploadFile style={{ fontSize: 80, color: palette.accent }} className="mb-4 animate-bounce" />
                        <h2 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>Drop to Add</h2>
                        <p className="text-lg mt-2" style={{ color: palette.textSecondary }}>Drop files to upload to CDN, or drop a URL to bookmark it.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
                
                {/* Google Search Bar (New Tab Style) */}
                <div className="flex flex-col items-center mb-16 relative" ref={suggestionRef}>
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-extrabold mb-8 text-transparent bg-clip-text" 
                        style={{ backgroundImage: `linear-gradient(90deg, ${palette.accent}, ${palette.textPrimary})` }}
                    >
                        Bookmarks
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
                            placeholder="Filter bookmarks..."
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
                        {!error && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOpenModal()}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg shrink-0"
                                style={{ background: palette.accent, color: "#fff" }}
                            >
                                <Add />
                                New Bookmark
                            </motion.button>
                        )}
                    </div>
                </div>

                {loading || uploadingFile ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: `${palette.accent} transparent transparent transparent` }} />
                        {uploadingFile && <p style={{ color: palette.textSecondary }}>Uploading to GitHub CDN...</p>}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 rounded-[30px]" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <BookmarkBorder style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.5, marginBottom: 16 }} />
                        <h2 className="text-xl font-bold mb-2" style={{ color: palette.textPrimary }}>Authentication Required</h2>
                        <p style={{ color: palette.textSecondary }}>{error}</p>
                    </div>
                ) : filteredBookmarks.length === 0 ? (
                    <div className="text-center py-20 rounded-[30px]" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <BookmarkBorder style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.5, marginBottom: 16 }} />
                        <h2 className="text-xl font-bold mb-2" style={{ color: palette.textPrimary }}>No Bookmarks Found</h2>
                        <p style={{ color: palette.textSecondary }}>Start adding your favorite links.</p>
                    </div>
                ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                        <AnimatePresence>
                            {filteredBookmarks.map((bookmark, idx) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    key={bookmark._id} 
                                    className={`rounded-[30px] p-6 transition-all hover:scale-[1.02] flex group ${viewMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col'}`}
                                    style={{ 
                                        background: cardBg, 
                                        border: `1px solid ${borderColor}`,
                                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div className={`flex items-start gap-4 ${viewMode === 'grid' ? 'mb-4' : ''}`}>
                                        {bookmark.Icon ? (
                                            <img src={bookmark.Icon} alt={bookmark.Title} className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-white p-1" style={{ border: `1px solid ${borderColor}` }} />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${palette.accent}15`, color: palette.accent }}>
                                                <LinkIcon />
                                            </div>
                                        )}
                                        {viewMode === "grid" && (
                                            <div className="pt-1 flex-1 min-w-0 pr-8 relative">
                                                <h3 className="text-xl font-bold leading-tight mb-1 truncate" style={{ color: palette.textPrimary }}>{bookmark.Title}</h3>
                                                <p className="text-xs truncate opacity-70" style={{ color: palette.textSecondary }}>{bookmark.Url.replace(/^https?:\/\//, '')}</p>
                                                
                                                <div className="absolute top-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(bookmark)} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" style={{ color: palette.textSecondary }}>
                                                        <Edit fontSize="small" />
                                                    </button>
                                                    <button onClick={() => handleDelete(bookmark._id)} className="p-1.5 rounded-full hover:bg-red-500/10 transition-colors" style={{ color: "#ff3b30" }}>
                                                        <Delete fontSize="small" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {viewMode === "list" && (
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold truncate" style={{ color: palette.textPrimary }}>{bookmark.Title}</h3>
                                                <p className="text-xs truncate opacity-70" style={{ color: palette.textSecondary }}>{bookmark.Url.replace(/^https?:\/\//, '')}</p>
                                            </div>
                                            <p className="text-sm truncate opacity-80" style={{ color: palette.textSecondary }}>{bookmark.Description || "No description provided."}</p>
                                        </div>
                                    )}

                                    {viewMode === "grid" && (
                                        <p className="text-sm flex-1 mb-6 opacity-80" style={{ color: palette.textSecondary, lineHeight: 1.6 }}>
                                            {bookmark.Description || "No description provided."}
                                        </p>
                                    )}
                                    
                                    <div className={`${viewMode === 'grid' ? 'mt-auto pt-4 border-t' : ''} flex items-center justify-between shrink-0 gap-4`} style={{ borderColor: viewMode === 'grid' ? borderColor : 'transparent' }}>
                                        <div className="flex flex-wrap gap-2 overflow-hidden max-h-[24px]">
                                            {bookmark.Tags?.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider" style={{ background: inputBg, color: palette.textSecondary, border: `1px solid ${borderColor}` }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                            {(bookmark.Tags?.length || 0) > 3 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ color: palette.textSecondary }}>
                                                    +{(bookmark.Tags?.length || 0) - 3}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {viewMode === "list" && (
                                                <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(bookmark)} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" style={{ color: palette.textSecondary }}>
                                                        <Edit fontSize="small" />
                                                    </button>
                                                    <button onClick={() => handleDelete(bookmark._id)} className="p-1.5 rounded-full hover:bg-red-500/10 transition-colors" style={{ color: "#ff3b30" }}>
                                                        <Delete fontSize="small" />
                                                    </button>
                                                </div>
                                            )}
                                            <a href={bookmark.Url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                <button 
                                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 hover:bg-black/5 dark:hover:bg-white/5"
                                                    style={{ color: palette.accent }}
                                                >
                                                    <OpenInNew fontSize="small" />
                                                </button>
                                            </a>
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
                                    {editingId ? "Edit Bookmark" : "New Bookmark"}
                                </h2>
                                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: palette.textSecondary }}>
                                    <Close />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Title *</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.Title}
                                        onChange={e => setFormData(p => ({ ...p, Title: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="Awesome Website"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>URL *</label>
                                    <input 
                                        required
                                        type="url" 
                                        value={formData.Url}
                                        onChange={e => setFormData(p => ({ ...p, Url: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Description</label>
                                    <textarea 
                                        value={formData.Description}
                                        onChange={e => setFormData(p => ({ ...p, Description: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all min-h-[80px] resize-y"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="A brief description of this bookmark..."
                                    />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-1 ml-1">
                                        <label className="block text-sm font-bold" style={{ color: palette.textSecondary }}>Tags (comma separated)</label>
                                        {isAdmin && (
                                            <button 
                                                type="button" 
                                                onClick={handleGenerateTags}
                                                disabled={generatingTags}
                                                className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80"
                                                style={{ color: palette.accent }}
                                            >
                                                {generatingTags ? "Generating..." : <><AutoAwesome fontSize="small" /> Auto-Generate</>}
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={formData.Tags}
                                        onChange={e => setFormData(p => ({ ...p, Tags: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="react, tutorial, tech"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1 ml-1" style={{ color: palette.textSecondary }}>Custom Icon URL (optional)</label>
                                    <input 
                                        type="url" 
                                        value={formData.Icon}
                                        onChange={e => setFormData(p => ({ ...p, Icon: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}
                                        placeholder="Leave empty to auto-fetch favicon"
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full mt-4 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-70"
                                    style={{ background: palette.accent }}
                                >
                                    {submitting ? "Saving..." : "Save Bookmark"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
