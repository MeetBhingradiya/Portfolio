"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
    CalendarToday,
    Visibility,
    ThumbUp,
    ThumbUpOutlined,
    Bookmark,
    BookmarkBorder,
    Share,
    ArrowBack,
    AccessTime,
    Twitter,
    LinkedIn,
    Facebook,
    Link as LinkIcon
} from "@mui/icons-material";
import { Axios } from "../../../Utils/Axios";
import { useRouter, useParams } from "next/navigation";
import GitHubStyleHeader from "../../../Components/HomePage/Header";
import dynamic from "next/dynamic";

// Dynamically import markdown preview to avoid SSR issues
const MarkdownPreview = dynamic(
    () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
    { ssr: false }
);

interface Blog {
    BlogID: string;
    Title: string;
    Description: string;
    Tags: string[];
    BannerImage?: string;
    Views: number;
    Likes: number;
    LikedBy: string[];
    content: string;
    author?: {
        userID: string;
        username: string;
        name: string;
        icon?: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface BlogState {
    blog: Blog | null;
    loading: boolean;
    error: string;
    isLiked: boolean;
    isBookmarked: boolean;
    relatedBlogs: Blog[];
    tableOfContents: Array<{
        id: string;
        text: string;
        level: number;
    }>;
}

export default function BlogPostPage() {
    const router = useRouter();
    const params = useParams();
    const blogId = params.id as string;

    const [blogState, setBlogState] = useState<BlogState>({
        blog: null,
        loading: true,
        error: "",
        isLiked: false,
        isBookmarked: false,
        relatedBlogs: [],
        tableOfContents: []
    });

    useEffect(() => {
        if (blogId) {
            loadBlog();
        }
    }, [blogId]);

    useEffect(() => {
        if (blogState.blog) {
            generateTableOfContents();
            loadRelatedBlogs();
        }
    }, [blogState.blog]);

    const loadBlog = async () => {
        setBlogState((prev) => ({ ...prev, loading: true, error: "" }));

        try {
            const response = await Axios.get(`/api/blog/${blogId}`);

            if (response.data.Status === 1) {
                const blog = response.data.Data.blog;
                setBlogState((prev) => ({
                    ...prev,
                    blog,
                    loading: false,
                    // Check if user has liked/bookmarked (would need user context)
                    isLiked: false, // TODO: Check user's liked blogs
                    isBookmarked: false // TODO: Check user's bookmarked blogs
                }));
            } else {
                setBlogState((prev) => ({
                    ...prev,
                    error: "Blog not found",
                    loading: false
                }));
            }
        } catch (error: any) {
            setBlogState((prev) => ({
                ...prev,
                error: "Failed to load blog",
                loading: false
            }));
        }
    };

    const loadRelatedBlogs = async () => {
        if (!blogState.blog?.Tags?.length) return;

        try {
            // Find blogs with similar tags
            const response = await Axios.get(
                `/api/blog?tags=${blogState.blog.Tags[0]}&limit=3`
            );

            if (response.data.Status === 1) {
                const related = response.data.Data.blogs
                    .filter((blog: Blog) => blog.BlogID !== blogId)
                    .slice(0, 3);

                setBlogState((prev) => ({
                    ...prev,
                    relatedBlogs: related
                }));
            }
        } catch (error) {
            console.warn("Failed to load related blogs");
        }
    };

    const generateTableOfContents = () => {
        if (!blogState.blog?.content) return;

        const headings: Array<{ id: string; text: string; level: number }> = [];
        const lines = blogState.blog.content.split("\n");

        lines.forEach((line, index) => {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const text = match[2];
                const id = `heading-${index}`;
                headings.push({ id, text, level });
            }
        });

        setBlogState((prev) => ({
            ...prev,
            tableOfContents: headings
        }));
    };

    const handleLike = async () => {
        // TODO: Implement like functionality with user authentication
        setBlogState((prev) => ({
            ...prev,
            isLiked: !prev.isLiked,
            blog: prev.blog
                ? {
                      ...prev.blog,
                      Likes: prev.isLiked
                          ? prev.blog.Likes - 1
                          : prev.blog.Likes + 1
                  }
                : null
        }));
    };

    const handleBookmark = async () => {
        // TODO: Implement bookmark functionality with user authentication
        setBlogState((prev) => ({
            ...prev,
            isBookmarked: !prev.isBookmarked
        }));
    };

    const handleShare = (platform: string) => {
        const url = window.location.href;
        const title = blogState.blog?.Title || "";

        let shareUrl = "";

        switch (platform) {
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case "linkedin":
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case "copy":
                navigator.clipboard.writeText(url);
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400");
        }
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

    const calculateReadTime = (content: string) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / wordsPerMinute);
        return readTime;
    };
    if (blogState.loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <GitHubStyleHeader />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex justify-center items-center min-h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (blogState.error || !blogState.blog) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <GitHubStyleHeader />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
                        <p className="text-red-700 dark:text-red-300">
                            {blogState.error}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/blogs")}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        <ArrowBack
                            className="mr-2"
                            sx={{ fontSize: 20 }}
                        />
                        Back to Blog
                    </button>
                </div>
            </div>
        );
    }
    const { blog } = blogState;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <GitHubStyleHeader />

            {/* Banner Image */}
            {blog.BannerImage && (
                <div
                    className="h-96 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${blog.BannerImage})` }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70"></div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}>
                    {/* Back Button */}
                    <button
                        onClick={() => router.push("/blogs")}
                        className="inline-flex items-center px-4 py-2 mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
                        <ArrowBack
                            className="mr-2"
                            sx={{ fontSize: 20 }}
                        />
                        Back to Blog
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                                {/* Article Header */}
                                <div className="mb-8">
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                        {blog.Title}
                                    </h1>

                                    {blog.Description && (
                                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                            {blog.Description}
                                        </p>
                                    )}

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {blog.Tags?.map((tag) => (
                                            <span
                                                key={tag}
                                                onClick={() =>
                                                    router.push(
                                                        `/blogs?tag=${tag}`
                                                    )
                                                }
                                                className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors duration-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Author & Meta Info */}
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                                                    {blog.author?.name?.charAt(
                                                        0
                                                    ) || "M"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {blog.author?.name ||
                                                            "Meet Bhingradiya"}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        @
                                                        {blog.author
                                                            ?.username ||
                                                            "MeetBhingradiya"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1">
                                                    <CalendarToday
                                                        sx={{ fontSize: 16 }}
                                                    />
                                                    <span>
                                                        {formatDate(
                                                            blog.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <AccessTime
                                                        sx={{ fontSize: 16 }}
                                                    />
                                                    <span>
                                                        {calculateReadTime(
                                                            blog.content
                                                        )}{" "}
                                                        min read
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Visibility
                                                        sx={{ fontSize: 16 }}
                                                    />
                                                    <span>
                                                        {formatViews(
                                                            blog.Views
                                                        )}{" "}
                                                        views
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 mb-8"></div>{" "}
                                {/* Article Content */}
                                <div
                                    className="prose prose-lg dark:prose-invert max-w-none
                                    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                                    prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                                    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                                    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-900 dark:prose-code:text-gray-100
                                    prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 dark:prose-pre:border-gray-600
                                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:p-4 prose-blockquote:italic
                                    prose-img:rounded-lg prose-img:shadow-lg
                                    prose-table:border-collapse prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-600
                                    prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-th:p-2
                                    prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:p-2
                                ">
                                    <div
                                        className="markdown-content"
                                        style={{
                                            backgroundColor: "transparent"
                                        }}>
                                        <MarkdownPreview
                                            source={blog.content}
                                            data-color-mode="light"
                                            style={{
                                                backgroundColor: "transparent",
                                                color: "inherit"
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Add custom CSS for markdown styling */}
                                <style
                                    dangerouslySetInnerHTML={{
                                        __html: `
                                        .markdown-content .w-md-editor-text-container,
                                        .markdown-content .w-md-editor-text,
                                        .markdown-content .wmde-markdown,
                                        .markdown-content .wmde-markdown * {
                                            background-color: transparent !important;
                                        }
                                        .markdown-content .wmde-markdown pre {
                                            background-color: rgb(17, 24, 39) !important;
                                        }
                                        .dark .markdown-content .wmde-markdown pre {
                                            background-color: rgb(31, 41, 55) !important;
                                        }
                                        .markdown-content .wmde-markdown code {
                                            background-color: rgb(243, 244, 246) !important;
                                            color: rgb(17, 24, 39) !important;
                                        }
                                        .dark .markdown-content .wmde-markdown code {
                                            background-color: rgb(31, 41, 55) !important;
                                            color: rgb(243, 244, 246) !important;
                                        }
                                        .markdown-content .wmde-markdown p,
                                        .markdown-content .wmde-markdown h1,
                                        .markdown-content .wmde-markdown h2,
                                        .markdown-content .wmde-markdown h3,
                                        .markdown-content .wmde-markdown h4,
                                        .markdown-content .wmde-markdown h5,
                                        .markdown-content .wmde-markdown h6,
                                        .markdown-content .wmde-markdown li,
                                        .markdown-content .wmde-markdown blockquote {
                                            color: rgb(55, 65, 81) !important;
                                        }
                                        .dark .markdown-content .wmde-markdown p,
                                        .dark .markdown-content .wmde-markdown h1,
                                        .dark .markdown-content .wmde-markdown h2,
                                        .dark .markdown-content .wmde-markdown h3,
                                        .dark .markdown-content .wmde-markdown h4,
                                        .dark .markdown-content .wmde-markdown h5,
                                        .dark .markdown-content .wmde-markdown h6,
                                        .dark .markdown-content .wmde-markdown li,
                                        .dark .markdown-content .wmde-markdown blockquote {
                                            color: rgb(209, 213, 219) !important;
                                        }
                                    `
                                    }}
                                />
                                <div className="border-t border-gray-200 dark:border-gray-600 my-8"></div>
                                {/* Article Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleLike}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                                                blogState.isLiked
                                                    ? "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            }`}>
                                            {blogState.isLiked ? (
                                                <ThumbUp
                                                    sx={{ fontSize: 20 }}
                                                />
                                            ) : (
                                                <ThumbUpOutlined
                                                    sx={{ fontSize: 20 }}
                                                />
                                            )}
                                            <span>{blog.Likes}</span>
                                        </button>

                                        <button
                                            onClick={handleBookmark}
                                            className={`p-2 rounded-lg transition-colors duration-200 ${
                                                blogState.isBookmarked
                                                    ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            }`}>
                                            {blogState.isBookmarked ? (
                                                <Bookmark
                                                    sx={{ fontSize: 20 }}
                                                />
                                            ) : (
                                                <BookmarkBorder
                                                    sx={{ fontSize: 20 }}
                                                />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                                            Share:
                                        </span>
                                        <button
                                            onClick={() =>
                                                handleShare("twitter")
                                            }
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                            <Twitter sx={{ fontSize: 20 }} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleShare("linkedin")
                                            }
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors duration-200">
                                            <LinkedIn sx={{ fontSize: 20 }} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleShare("facebook")
                                            }
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-700 transition-colors duration-200">
                                            <Facebook sx={{ fontSize: 20 }} />
                                        </button>
                                        <button
                                            onClick={() => handleShare("copy")}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
                                            <LinkIcon sx={{ fontSize: 20 }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 space-y-6">
                                {/* Table of Contents */}
                                {blogState.tableOfContents.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                            Table of Contents
                                        </h3>
                                        <nav className="space-y-2">
                                            {blogState.tableOfContents.map(
                                                (heading) => (
                                                    <button
                                                        key={heading.id}
                                                        className={`block w-full text-left p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                            heading.level <= 2
                                                                ? "font-semibold text-sm"
                                                                : "text-xs"
                                                        }`}
                                                        style={{
                                                            paddingLeft: `${heading.level * 8 + 8}px`
                                                        }}
                                                        onClick={() => {
                                                            const element =
                                                                document.getElementById(
                                                                    heading.id
                                                                );
                                                            element?.scrollIntoView(
                                                                {
                                                                    behavior:
                                                                        "smooth"
                                                                }
                                                            );
                                                        }}>
                                                        <span className="text-gray-700 dark:text-gray-300">
                                                            {heading.text}
                                                        </span>
                                                    </button>
                                                )
                                            )}
                                        </nav>
                                    </div>
                                )}

                                {/* Related Blogs */}
                                {blogState.relatedBlogs.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                            Related Posts
                                        </h3>
                                        <div className="space-y-4">
                                            {blogState.relatedBlogs.map(
                                                (relatedBlog) => (
                                                    <div
                                                        key={relatedBlog.BlogID}
                                                        onClick={() =>
                                                            router.push(
                                                                `/blogs/${relatedBlog.BlogID}`
                                                            )
                                                        }
                                                        className="block p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                                                            {relatedBlog.Title}
                                                        </h4>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {formatDate(
                                                                relatedBlog.createdAt
                                                            )}{" "}
                                                            •{" "}
                                                            {formatViews(
                                                                relatedBlog.Views
                                                            )}{" "}
                                                            views
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
