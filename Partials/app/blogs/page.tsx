/**
 * Blog Page
 * Redesigned with dual-theme support
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIBadge } from "../../Components/OneUI";
import {
    Search,
    CalendarToday,
    Visibility,
    TrendingUp,
    Clear,
    FilterList,
    Article,
    AccessTime,
    ChevronLeft,
    ChevronRight
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import { Axios } from "../../Utils/Axios";
import Link from "next/link";

interface Blog {
    BlogID: string;
    Title: string;
    Description: string;
    Tags: string[];
    BannerImage?: string;
    Views: number;
    Likes: number;
    author?: {
        username: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface BlogState {
    blogs: Blog[];
    loading: boolean;
    error: string;
    filters: {
        search: string;
        tag: string;
        sortBy: "latest" | "popular" | "trending";
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    featuredBlogs: Blog[];
    popularTags: string[];
}

function BlogContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;
    
    const router = useRouter();
    const searchParams = useSearchParams();

    const [blogState, setBlogState] = useState<BlogState>({
        blogs: [],
        loading: true,
        error: "",
        filters: {
            search: searchParams.get("search") || "",
            tag: searchParams.get("tag") || "",
            sortBy: (searchParams.get("sort") as any) || "latest"
        },
        pagination: {
            page: parseInt(searchParams.get("page") || "1"),
            limit: 9,
            total: 0,
            pages: 0
        },
        featuredBlogs: [],
        popularTags: []
    });

    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadBlogs();
        loadFeaturedBlogs();
        loadPopularTags();
    }, [blogState.filters, blogState.pagination.page]);

    const loadBlogs = async () => {
        setBlogState((prev) => ({ ...prev, loading: true, error: "" }));

        try {
            const params = new URLSearchParams({
                page: blogState.pagination.page.toString(),
                limit: blogState.pagination.limit.toString(),
                status: "published",
                visibility: "public"
            });

            if (blogState.filters.search) {
                params.append("search", blogState.filters.search);
            }

            if (blogState.filters.tag) {
                params.append("tags", blogState.filters.tag);
            }

            const response = await Axios.get(`/api/blog?${params}`);

            if (response.data.Status === 1) {
                let blogs = response.data.Data.blogs;

                // Sort blogs
                if (blogState.filters.sortBy === "popular") {
                    blogs = blogs.sort((a: Blog, b: Blog) => b.Views - a.Views);
                } else if (blogState.filters.sortBy === "trending") {
                    blogs = blogs.sort((a: Blog, b: Blog) => b.Likes - a.Likes);
                } else {
                    blogs = blogs.sort(
                        (a: Blog, b: Blog) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                }

                setBlogState((prev) => ({
                    ...prev,
                    blogs,
                    pagination: response.data.Data.pagination,
                    loading: false
                }));
            }
        } catch (error) {
            setBlogState((prev) => ({
                ...prev,
                error: "Failed to load blogs",
                loading: false
            }));
        }
    };

    const loadFeaturedBlogs = async () => {
        try {
            const response = await Axios.get("/api/blog?limit=3&status=published&visibility=public");
            if (response.data.Status === 1) {
                const featured = response.data.Data.blogs
                    .sort((a: Blog, b: Blog) => b.Views - a.Views)
                    .slice(0, 3);
                setBlogState((prev) => ({
                    ...prev,
                    featuredBlogs: featured
                }));
            }
        } catch (error) {
            console.error("Failed to load featured blogs");
        }
    };

    const loadPopularTags = async () => {
        try {
            const response = await Axios.get("/api/blog?limit=100&status=published&visibility=public");
            if (response.data.Status === 1) {
                const allTags: string[] = [];
                response.data.Data.blogs.forEach((blog: Blog) => {
                    allTags.push(...(blog.Tags || []));
                });

                const tagCounts = allTags.reduce((acc, tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const popularTags = Object.entries(tagCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([tag]) => tag);

                setBlogState((prev) => ({
                    ...prev,
                    popularTags
                }));
            }
        } catch (error) {
            console.error("Failed to load tags");
        }
    };

    const handleSearch = (value: string) => {
        setBlogState((prev) => ({
            ...prev,
            filters: { ...prev.filters, search: value },
            pagination: { ...prev.pagination, page: 1 }
        }));
    };

    const handleFilterTag = (tag: string) => {
        setBlogState((prev) => ({
            ...prev,
            filters: { ...prev.filters, tag: prev.filters.tag === tag ? "" : tag },
            pagination: { ...prev.pagination, page: 1 }
        }));
    };

    const handleSortChange = (sortBy: "latest" | "popular" | "trending") => {
        setBlogState((prev) => ({
            ...prev,
            filters: { ...prev.filters, sortBy },
            pagination: { ...prev.pagination, page: 1 }
        }));
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const formatViews = (views: number) => {
        if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
        return views.toString();
    };

    return (
        <>
            <main
                className="min-h-screen py-24"
                style={{ background: palette.background }}
            >
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <h1
                            className={`${isApple ? "text-5xl md:text-6xl font-bold" : "text-6xl md:text-7xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}
                        >
                            Blog
                        </h1>
                        <p
                            className={`${isApple ? "text-lg" : "text-xl font-medium"} max-w-2xl`}
                            style={{ color: palette.textSecondary }}
                        >
                            Insights, tutorials, and thoughts on software development, technology, and beyond.
                        </p>
                    </motion.div>

                    {/* Search & Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8"
                    >
                        <Card
                            className={isApple ? "p-6" : "p-8"}
                            intensity={isApple ? "medium" : undefined}
                            elevated={!isApple}
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{ color: palette.textTertiary }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search articles..."
                                        value={blogState.filters.search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all`}
                                        style={{
                                            background: palette.surfaceSecondary,
                                            color: palette.textPrimary,
                                            border: `2px solid ${palette.border}`
                                        }}
                                    />
                                    {blogState.filters.search && (
                                        <button
                                            onClick={() => handleSearch("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                        >
                                            <Clear style={{ color: palette.textTertiary }} />
                                        </button>
                                    )}
                                </div>

                                {/* Sort */}
                                <select
                                    value={blogState.filters.sortBy}
                                    onChange={(e) => handleSortChange(e.target.value as any)}
                                    className={`${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl font-semibold"} outline-none cursor-pointer`}
                                    style={{
                                        background: palette.surfaceSecondary,
                                        color: palette.textPrimary,
                                        border: `2px solid ${palette.border}`
                                    }}
                                >
                                    <option value="latest">Latest</option>
                                    <option value="popular">Popular</option>
                                    <option value="trending">Trending</option>
                                </select>

                                {/* Filters Toggle */}
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    <FilterList />
                                    <span>Filters</span>
                                </Button>
                            </div>

                            {/* Filter Tags */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 pt-4"
                                        style={{ borderTop: `1px solid ${palette.border}` }}
                                    >
                                        <p
                                            className={`${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-3`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Popular Tags
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {blogState.popularTags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => handleFilterTag(tag)}
                                                    className={`${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-2.5 rounded-xl font-semibold"} transition-all`}
                                                    style={{
                                                        background:
                                                            blogState.filters.tag === tag
                                                                ? palette.accent
                                                                : palette.surfaceSecondary,
                                                        color:
                                                            blogState.filters.tag === tag
                                                                ? "#ffffff"
                                                                : palette.textSecondary,
                                                        border: `1px solid ${blogState.filters.tag === tag ? palette.accent : palette.border}`
                                                    }}
                                                >
                                                    #{tag}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </motion.div>

                    {/* Featured Blogs */}
                    {blogState.featuredBlogs.length > 0 && blogState.pagination.page === 1 && !blogState.filters.search && !blogState.filters.tag && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="mb-12"
                        >
                            <h2
                                className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-6`}
                                style={{ color: palette.textPrimary }}
                            >
                                Featured Articles
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {blogState.featuredBlogs.map((blog, index) => (
                                    <motion.div
                                        key={blog.BlogID}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                                    >
                                        <Link href={`/blogs/${blog.BlogID}`}>
                                            <Card
                                                className={`${isApple ? "p-0" : "p-0"} overflow-hidden cursor-pointer group`}
                                                intensity={isApple ? "strong" : undefined}
                                                elevated={!isApple}
                                            >
                                                {blog.BannerImage && (
                                                    <div className="aspect-video overflow-hidden">
                                                        <img
                                                            src={blog.BannerImage}
                                                            alt={blog.Title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                )}
                                                <div className={isApple ? "p-6" : "p-8"}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        {isApple ? (
                                                            <span
                                                                className="text-xs font-medium px-3 py-1 rounded-full"
                                                                style={{
                                                                    background: palette.accentSubtle,
                                                                    color: palette.accent
                                                                }}
                                                            >
                                                                Featured
                                                            </span>
                                                        ) : (
                                                            <OneUIBadge variant="accent">
                                                                Featured
                                                            </OneUIBadge>
                                                        )}
                                                    </div>
                                                    <h3
                                                        className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-3 line-clamp-2`}
                                                        style={{ color: palette.textPrimary }}
                                                    >
                                                        {blog.Title}
                                                    </h3>
                                                    <p
                                                        className={`${isApple ? "text-sm" : "text-base font-medium"} mb-4 line-clamp-2`}
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        {blog.Description}
                                                    </p>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div
                                                            className="flex items-center gap-4"
                                                            style={{ color: palette.textTertiary }}
                                                        >
                                                            <span className="flex items-center gap-1">
                                                                <Visibility fontSize="small" />
                                                                {formatViews(blog.Views)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <CalendarToday fontSize="small" />
                                                                {formatDate(blog.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Blog Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <h2
                            className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-6`}
                            style={{ color: palette.textPrimary }}
                        >
                            {blogState.filters.search || blogState.filters.tag ? "Search Results" : "All Articles"}
                        </h2>

                        {blogState.loading ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <Card
                                        key={i}
                                        className={isApple ? "p-6" : "p-8"}
                                        intensity={isApple ? "medium" : undefined}
                                    >
                                        <div
                                            className="h-48 rounded-lg mb-4 animate-pulse"
                                            style={{ background: palette.surfaceSecondary }}
                                        />
                                        <div
                                            className="h-6 rounded mb-3 animate-pulse"
                                            style={{ background: palette.surfaceSecondary }}
                                        />
                                        <div
                                            className="h-4 rounded mb-2 animate-pulse"
                                            style={{ background: palette.surfaceSecondary }}
                                        />
                                        <div
                                            className="h-4 rounded w-2/3 animate-pulse"
                                            style={{ background: palette.surfaceSecondary }}
                                        />
                                    </Card>
                                ))}
                            </div>
                        ) : blogState.error ? (
                            <Card
                                className={`${isApple ? "p-12" : "p-16"} text-center`}
                                intensity={isApple ? "medium" : undefined}
                            >
                                <Article
                                    style={{ fontSize: "4rem", color: palette.textTertiary }}
                                />
                                <p
                                    className={`${isApple ? "text-lg" : "text-xl font-medium"} mt-4`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    {blogState.error}
                                </p>
                            </Card>
                        ) : blogState.blogs.length === 0 ? (
                            <Card
                                className={`${isApple ? "p-12" : "p-16"} text-center`}
                                intensity={isApple ? "medium" : undefined}
                            >
                                <Search
                                    style={{ fontSize: "4rem", color: palette.textTertiary }}
                                />
                                <p
                                    className={`${isApple ? "text-lg" : "text-xl font-medium"} mt-4`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    No articles found matching your criteria
                                </p>
                            </Card>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-3 gap-6 mb-8">
                                    {blogState.blogs.map((blog, index) => (
                                        <motion.div
                                            key={blog.BlogID}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.05 }}
                                        >
                                            <Link href={`/blogs/${blog.BlogID}`}>
                                                <Card
                                                    className={`${isApple ? "p-0" : "p-0"} overflow-hidden cursor-pointer group h-full flex flex-col`}
                                                    intensity={isApple ? "medium" : undefined}
                                                    elevated={!isApple}
                                                >
                                                    {blog.BannerImage && (
                                                        <div className="aspect-video overflow-hidden">
                                                            <img
                                                                src={blog.BannerImage}
                                                                alt={blog.Title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className={`${isApple ? "p-6" : "p-8"} flex-1 flex flex-col`}>
                                                        {/* Tags */}
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {blog.Tags?.slice(0, 2).map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className={`${isApple ? "text-xs px-2 py-1 rounded-md" : "text-sm px-3 py-1.5 rounded-lg font-semibold"}`}
                                                                    style={{
                                                                        background: palette.surfaceSecondary,
                                                                        color: palette.accent
                                                                    }}
                                                                >
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <h3
                                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-3 line-clamp-2`}
                                                            style={{ color: palette.textPrimary }}
                                                        >
                                                            {blog.Title}
                                                        </h3>
                                                        
                                                        <p
                                                            className={`${isApple ? "text-sm" : "text-base font-medium"} mb-4 line-clamp-3 flex-1`}
                                                            style={{ color: palette.textSecondary }}
                                                        >
                                                            {blog.Description}
                                                        </p>

                                                        {/* Meta */}
                                                        <div
                                                            className={`flex items-center justify-between pt-4 ${isApple ? "text-xs" : "text-sm"}`}
                                                            style={{
                                                                borderTop: `1px solid ${palette.border}`,
                                                                color: palette.textTertiary
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex items-center gap-1">
                                                                    <Visibility fontSize="small" />
                                                                    {formatViews(blog.Views)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <AccessTime fontSize="small" />
                                                                    {formatDate(blog.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {blogState.pagination.pages > 1 && (
                                    <div className="flex justify-center items-center gap-4">
                                        <Button
                                            onClick={() =>
                                                setBlogState((prev) => ({
                                                    ...prev,
                                                    pagination: {
                                                        ...prev.pagination,
                                                        page: Math.max(1, prev.pagination.page - 1)
                                                    }
                                                }))
                                            }
                                            disabled={blogState.pagination.page === 1}
                                            variant="secondary"
                                        >
                                            <ChevronLeft />
                                            Previous
                                        </Button>

                                        <span
                                            className={`${isApple ? "text-sm" : "text-base font-semibold"}`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Page {blogState.pagination.page} of {blogState.pagination.pages}
                                        </span>

                                        <Button
                                            onClick={() =>
                                                setBlogState((prev) => ({
                                                    ...prev,
                                                    pagination: {
                                                        ...prev.pagination,
                                                        page: Math.min(
                                                            prev.pagination.pages,
                                                            prev.pagination.page + 1
                                                        )
                                                    }
                                                }))
                                            }
                                            disabled={blogState.pagination.page === blogState.pagination.pages}
                                            variant="secondary"
                                        >
                                            Next
                                            <ChevronRight />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </main>
        </>
    );
}

export default function BlogsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BlogContent />
        </Suspense>
    );
}
