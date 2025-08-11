"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Search,
    CalendarToday,
    Visibility,
    TrendingUp,
    Clear,
    FilterList,
    Article,
    AccessTime,
    Person,
    Tag,
    ChevronLeft,
    ChevronRight
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import GitHubStyleHeader from "@Components/HomePage/Header";
import { Axios } from "@Utils/Axios";

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

function BlogListPage() {
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
            limit: 12,
            total: 0,
            pages: 0
        },
        featuredBlogs: [],
        popularTags: []
    });

    useEffect(() => {
        loadBlogs();
        loadFeaturedBlogs();
        loadPopularTags();
    }, [blogState.filters, blogState.pagination.page]);

    // ...existing load functions...

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

                // Sort blogs based on sortBy filter
                if (blogState.filters.sortBy === "popular") {
                    blogs = blogs.sort((a: Blog, b: Blog) => b.Views - a.Views);
                } else if (blogState.filters.sortBy === "trending") {
                    blogs = blogs.sort((a: Blog, b: Blog) => b.Likes - a.Likes);
                } else {
                    blogs = blogs.sort(
                        (a: Blog, b: Blog) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    );
                }

                setBlogState((prev) => ({
                    ...prev,
                    blogs,
                    pagination: response.data.Data.pagination,
                    loading: false
                }));
            } else {
                setBlogState((prev) => ({
                    ...prev,
                    error: "Failed to load blogs",
                    loading: false
                }));
            }
        } catch (error: any) {
            setBlogState((prev) => ({
                ...prev,
                error: "Failed to load blogs",
                loading: false
            }));
        }
    };

    const loadFeaturedBlogs = async () => {
        try {
            const response = await Axios.get(
                "/api/blog?limit=3&status=published&visibility=public"
            );
            if (response.data.Status === 1) {
                // Get top 3 most viewed blogs as featured
                const featured = response.data.Data.blogs
                    .sort((a: Blog, b: Blog) => b.Views - a.Views)
                    .slice(0, 3);

                setBlogState((prev) => ({
                    ...prev,
                    featuredBlogs: featured
                }));
            }
        } catch (error) {
            console.warn("Failed to load featured blogs");
        }
    };

    const loadPopularTags = async () => {
        try {
            // This would ideally be a separate API endpoint for tag analytics
            const response = await Axios.get(
                "/api/blog?limit=100&status=published&visibility=public"
            );
            if (response.data.Status === 1) {
                const allTags: string[] = [];
                response.data.Data.blogs.forEach((blog: Blog) => {
                    allTags.push(...(blog.Tags || []));
                });

                // Count tag frequency and get top 10
                const tagCounts = allTags.reduce(
                    (acc, tag) => {
                        acc[tag] = (acc[tag] || 0) + 1;
                        return acc;
                    },
                    {} as Record<string, number>
                );

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
            console.warn("Failed to load popular tags");
        }
    };

    const handleFilterChange = (
        field: keyof typeof blogState.filters,
        value: string
    ) => {
        setBlogState((prev) => ({
            ...prev,
            filters: { ...prev.filters, [field]: value },
            pagination: { ...prev.pagination, page: 1 }
        }));

        // Update URL params
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(field === "sortBy" ? "sort" : field, value);
        } else {
            params.delete(field === "sortBy" ? "sort" : field);
        }
        params.set("page", "1");
        router.push(`/blog?${params.toString()}`);
    };

    const handlePageChange = (
        event: React.ChangeEvent<unknown>,
        page: number
    ) => {
        setBlogState((prev) => ({
            ...prev,
            pagination: { ...prev.pagination, page }
        }));

        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        router.push(`/blog?${params.toString()}`);
    };

    const clearFilters = () => {
        setBlogState((prev) => ({
            ...prev,
            filters: { search: "", tag: "", sortBy: "latest" },
            pagination: { ...prev.pagination, page: 1 }
        }));
        router.push("/blog");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    const formatViews = (views: number) => {
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}k`;
        }
        return views.toString();
    };
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Header */}
            <GitHubStyleHeader />
            {/* Hero Section */}
            <section className="pt-20 pb-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Technical{" "}
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Blog
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
                            Insights on software engineering, security,
                            automation, and the latest in tech. From a Staff
                            Engineer&apos;s perspective.
                        </p>

                        {/* Search and Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                {/* Search Input */}
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Search blogs..."
                                            value={blogState.filters.search}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    "search",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />{" "}
                                        {blogState.filters.search && (
                                            <button
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "search",
                                                        ""
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                <Clear sx={{ fontSize: 16 }} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tag Filter */}
                                <div>
                                    <select
                                        value={blogState.filters.tag}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "tag",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                        <option value="">All Tags</option>
                                        {blogState.popularTags.map((tag) => (
                                            <option
                                                key={tag}
                                                value={tag}>
                                                {tag}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort Filter */}
                                <div>
                                    <select
                                        value={blogState.filters.sortBy}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "sortBy",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                        <option value="latest">Latest</option>
                                        <option value="popular">
                                            Most Viewed
                                        </option>
                                        <option value="trending">
                                            Most Liked
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Active Filters */}
                            {(blogState.filters.search ||
                                blogState.filters.tag) && (
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Active filters:
                                    </span>{" "}
                                    {blogState.filters.search && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                            Search: &ldquo;
                                            {blogState.filters.search}&rdquo;
                                            <button
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "search",
                                                        ""
                                                    )
                                                }
                                                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100">
                                                <Clear sx={{ fontSize: 12 }} />
                                            </button>
                                        </span>
                                    )}
                                    {blogState.filters.tag && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                                            Tag: {blogState.filters.tag}{" "}
                                            <button
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "tag",
                                                        ""
                                                    )
                                                }
                                                className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100">
                                                <Clear sx={{ fontSize: 12 }} />
                                            </button>
                                        </span>
                                    )}
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline">
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </section>
            {/* Main Content */}
            <section className="py-16 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Featured Blogs */}
                    {blogState.featuredBlogs.length > 0 &&
                        !blogState.filters.search &&
                        !blogState.filters.tag && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="mb-16">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                                    Featured Posts
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {blogState.featuredBlogs.map(
                                        (blog, index) => (
                                            <motion.div
                                                key={blog.BlogID}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.6,
                                                    delay: index * 0.1
                                                }}
                                                whileHover={{
                                                    scale: 1.03,
                                                    y: -5
                                                }}
                                                onClick={() =>
                                                    router.push(
                                                        `/blogs/${blog.BlogID}`
                                                    )
                                                }
                                                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300">
                                                {blog.BannerImage && (
                                                    <div className="relative h-48 overflow-hidden">
                                                        <img
                                                            src={
                                                                blog.BannerImage
                                                            }
                                                            alt={blog.Title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                                            Featured
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                                        {blog.Title}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                                                        {blog.Description?.substring(
                                                            0,
                                                            120
                                                        )}
                                                        ...
                                                    </p>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {blog.Tags?.slice(
                                                            0,
                                                            3
                                                        ).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleFilterChange(
                                                                        "tag",
                                                                        tag
                                                                    );
                                                                }}
                                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors duration-200 cursor-pointer">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                        {" "}
                                                        <div className="flex items-center space-x-2">
                                                            <CalendarToday
                                                                sx={{
                                                                    fontSize: 16
                                                                }}
                                                            />
                                                            <span>
                                                                {formatDate(
                                                                    blog.createdAt
                                                                )}
                                                            </span>
                                                        </div>{" "}
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center space-x-1">
                                                                <Visibility
                                                                    sx={{
                                                                        fontSize: 16
                                                                    }}
                                                                />
                                                                <span>
                                                                    {formatViews(
                                                                        blog.Views
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <TrendingUp
                                                                    sx={{
                                                                        fontSize: 16
                                                                    }}
                                                                />
                                                                <span>
                                                                    {blog.Likes}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    )}
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 mt-12"></div>
                            </motion.div>
                        )}

                    {/* Error State */}
                    {blogState.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
                            {" "}
                            <div className="flex items-center">
                                <div className="text-red-500 mr-3">
                                    <Article sx={{ fontSize: 20 }} />
                                </div>
                                <p className="text-red-700 dark:text-red-300">
                                    {blogState.error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {blogState.loading && (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {/* Blog List */}
                    {!blogState.loading && (
                        <>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {blogState.filters.search ||
                                    blogState.filters.tag
                                        ? "Search Results"
                                        : "All Posts"}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {blogState.pagination.total} posts found
                                </p>
                            </div>

                            {blogState.blogs.length === 0 ? (
                                <div className="text-center py-16">
                                    <Article
                                        sx={{ fontSize: 60 }}
                                        className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
                                    />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        No blogs found
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {blogState.filters.search ||
                                        blogState.filters.tag
                                            ? "Try adjusting your search filters"
                                            : "Check back soon for new content!"}
                                    </p>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6 }}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {blogState.blogs.map((blog, index) => (
                                            <motion.div
                                                key={blog.BlogID}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.6,
                                                    delay: index * 0.1
                                                }}
                                                whileHover={{
                                                    scale: 1.03,
                                                    y: -5
                                                }}
                                                onClick={() =>
                                                    router.push(
                                                        `/blogs/${blog.BlogID}`
                                                    )
                                                }
                                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300">
                                                {blog.BannerImage && (
                                                    <div className="relative h-48 overflow-hidden">
                                                        <img
                                                            src={
                                                                blog.BannerImage
                                                            }
                                                            alt={blog.Title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                                        {blog.Title}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow line-clamp-3">
                                                        {blog.Description?.substring(
                                                            0,
                                                            120
                                                        )}
                                                        ...
                                                    </p>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {blog.Tags?.slice(
                                                            0,
                                                            3
                                                        ).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleFilterChange(
                                                                        "tag",
                                                                        tag
                                                                    );
                                                                }}
                                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors duration-200 cursor-pointer">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                                {blog.author?.name?.charAt(
                                                                    0
                                                                ) || "M"}
                                                            </div>
                                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                                {blog.author
                                                                    ?.name ||
                                                                    "Meet Bhingradiya"}
                                                            </span>
                                                        </div>{" "}
                                                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                            <div className="flex items-center space-x-1">
                                                                <Visibility
                                                                    sx={{
                                                                        fontSize: 16
                                                                    }}
                                                                />
                                                                <span>
                                                                    {formatViews(
                                                                        blog.Views
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <TrendingUp
                                                                    sx={{
                                                                        fontSize: 16
                                                                    }}
                                                                />
                                                                <span>
                                                                    {blog.Likes}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(
                                                            blog.createdAt
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {blogState.pagination.pages > 1 && (
                                        <div className="flex justify-center mt-12">
                                            <div className="flex items-center space-x-2">
                                                {Array.from(
                                                    {
                                                        length: blogState
                                                            .pagination.pages
                                                    },
                                                    (_, index) => index + 1
                                                ).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() =>
                                                            handlePageChange(
                                                                null as any,
                                                                page
                                                            )
                                                        }
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                            page ===
                                                            blogState.pagination
                                                                .page
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                        }`}>
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </section>{" "}
        </div>
    );
}

// Loading component for Suspense fallback
function BlogListLoading() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <GitHubStyleHeader />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        </div>
    );
}

export default function BlogPage() {
    return (
        <Suspense fallback={<BlogListLoading />}>
            <BlogListPage />
        </Suspense>
    );
}
