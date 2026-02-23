"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import BlogCard, { BlogCardData } from "@/Components/Blogs/BlogCard";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import { BlogCategory } from "@/Types/Blog";

const CATEGORIES = ["All", ...Object.values(BlogCategory).map((c) => c.charAt(0).toUpperCase() + c.slice(1))];

export default function BlogsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [blogs, setBlogs] = useState<BlogCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const fetchBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/blogs");
            const data = await res.json();
            if (data.success) setBlogs(data.blogs || data.data || []);
        } catch {}
        setLoading(false);
    }, []);

    useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

    const filtered = blogs.filter((b) => {
        const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.excerpt?.toLowerCase().includes(search.toLowerCase());
        const matchCategory = category === "All" || b.category?.toLowerCase() === category.toLowerCase();
        return matchSearch && matchCategory;
    });

    const featured = filtered.slice(0, 2);
    const rest = filtered.slice(2);

    return (
        <div className="min-h-screen" style={{ background: palette.background }}>
            {/* Header */}
            <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2" style={{ color: palette.textPrimary }}>Blog</h1>
                        <p className="text-base" style={{ color: palette.textSecondary }}>
                            Thoughts on development, design, and everything in between.
                        </p>
                    </div>
                    <Link href="/blogs/new">
                        <motion.button
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
                            style={{ background: palette.accent, color: "#fff" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AddIcon style={{ fontSize: 18 }} /> Write
                        </motion.button>
                    </Link>
                </div>

                {/* Search */}
                <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-6"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                    }}
                >
                    <SearchIcon style={{ fontSize: 18, color: palette.textSecondary }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search posts…"
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        style={{ color: palette.textPrimary }}
                    />
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <motion.button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{
                                background: category === cat ? palette.accent : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                color: category === cat ? "#fff" : palette.textSecondary,
                                border: `1px solid ${category === cat ? "transparent" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pb-16">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-2xl animate-pulse aspect-[3/2]"
                                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <FilterListIcon style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.4 }} />
                        <p className="mt-4 text-lg" style={{ color: palette.textSecondary }}>No posts found</p>
                    </div>
                ) : (
                    <>
                        {/* Featured (top 2) */}
                        {featured.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {featured.map((blog) => (
                                    <BlogCard key={blog._id} blog={blog} />
                                ))}
                            </div>
                        )}
                        {/* Rest */}
                        {rest.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rest.map((blog) => (
                                    <BlogCard key={blog._id} blog={blog} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
