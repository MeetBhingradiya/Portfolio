"use client";

import React, { useEffect, useState, Suspense, lazy } from "react";
import { motion } from "motion/react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useSession } from "@Library/auth-client";

const BlogRenderer = lazy(() => import("@/Components/Blogs/BlogRenderer"));

interface BlogData {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
    readTime?: number;
    views?: number;
    likes?: number;
    authorName?: string;
    authorEmail?: string;
    authorImage?: string;
    publishedAt?: string;
    metaTitle?: string;
    metaDescription?: string;
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const router = useRouter();
    const { data: session } = useSession();

    const [blog, setBlog] = useState<BlogData | null>(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(0);

    // Simple device fingerprinting
    const getFingerprint = () => {
        if (typeof window === "undefined") return "ssr";
        const parts = [
            navigator.userAgent,
            screen.width,
            screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset()
        ];
        const str = parts.join("||");
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    };

    useEffect(() => {
        const isObjectId = /^[a-f\d]{24}$/i.test(slug);
        const today = new Date().toISOString().split("T")[0];
        const fp = getFingerprint();
        const viewsKey = `blog_views_${slug}_${today}`;
        const viewsToday = parseInt(localStorage.getItem(viewsKey) || "0");
        
        let trackView = false;
        if (viewsToday < 3) {
            localStorage.setItem(viewsKey, (viewsToday + 1).toString());
            trackView = true;
        }

        const url = isObjectId ? `/api/blogs?id=${slug}${trackView ? '' : '&noview=true'}` : `/api/blogs?slug=${slug}${trackView ? '' : '&noview=true'}`;
        fetch(url)
            .then((r) => r.json())
            .then((data) => {
                const blog = data.data || data.blog;
                if (data.success && blog) {
                    setBlog(blog);
                    setLikes(blog.likes || 0);
                } else {
                    setBlog(null);
                }
            })
            .finally(() => setLoading(false));
    }, [slug]);

    const handleLike = async () => {
        if (liked || !blog) return;
        setLiked(true);
        setLikes((p) => p + 1);
        
        const fp = getFingerprint();
        await fetch(`/api/blogs?id=${blog._id}&action=like`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fingerprint: fp })
        });
    };

    const canEdit =
        session?.user?.email && (session.user.email === blog?.authorEmail || session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    if (!blog) return notFound();

    return (
        <div
            className="min-h-screen"
            style={{ background: palette.background }}>
            {/* Cover image */}
            {blog.featuredImage && (
                <div className="w-full h-64 md:h-80 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(to bottom, transparent 50%, " + palette.background + ")"
                        }}
                    />
                </div>
            )}

            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Back link */}
                <Link
                    href="/blogs"
                    className="inline-flex items-center gap-1.5 mb-6 text-sm"
                    style={{ color: palette.textSecondary }}>
                    <ArrowBackIcon style={{ fontSize: 16 }} /> All Posts
                </Link>

                {/* Category */}
                {blog.category && (
                    <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full mb-4 inline-block"
                        style={{
                            background: `${palette.accent}18`,
                            color: palette.accent
                        }}>
                        {blog.category}
                    </span>
                )}

                {/* Title */}
                <h1
                    className="text-3xl md:text-4xl font-bold leading-tight mb-4"
                    style={{ color: palette.textPrimary }}>
                    {blog.title}
                </h1>

                {/* Meta row */}
                <div
                    className="flex flex-wrap items-center gap-4 mb-8 pb-6"
                    style={{
                        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                    }}>
                    <div className="flex items-center gap-2">
                        {blog.authorImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={blog.authorImage}
                                alt={blog.authorName}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{
                                    background: palette.accent + "30",
                                    color: palette.accent
                                }}>
                                {blog.authorName?.charAt(0) || "?"}
                            </div>
                        )}
                        <span
                            className="text-sm font-medium"
                            style={{ color: palette.textPrimary }}>
                            {blog.authorName}
                        </span>
                    </div>
                    {blog.publishedAt && (
                        <span
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            })}
                        </span>
                    )}
                    {blog.readTime != null && (
                        <span
                            className="flex items-center gap-1 text-sm"
                            style={{ color: palette.textSecondary }}>
                            <AccessTimeIcon style={{ fontSize: 14 }} /> {blog.readTime} min read
                        </span>
                    )}
                    {blog.views != null && (
                        <span
                            className="flex items-center gap-1 text-sm"
                            style={{ color: palette.textSecondary }}>
                            <VisibilityIcon style={{ fontSize: 14 }} /> {blog.views} views
                        </span>
                    )}
                    {canEdit && (
                        <Link href={`/blogs/${blog.slug}/edit`}>
                            <motion.button
                                className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                    color: palette.textSecondary
                                }}
                                whileTap={{ scale: 0.95 }}>
                                <EditIcon style={{ fontSize: 13 }} /> Edit
                            </motion.button>
                        </Link>
                    )}
                </div>

                {/* Content */}
                <Suspense fallback={<div className="py-8 text-center opacity-40">Loading…</div>}>
                    <BlogRenderer content={blog.content} />
                </Suspense>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <div
                        className="flex flex-wrap gap-2 mt-10 pt-6"
                        style={{
                            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                        }}>
                        {blog.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 rounded-full text-xs"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: palette.textSecondary
                                }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Like button */}
                <div className="flex justify-center mt-12">
                    <motion.button
                        onClick={handleLike}
                        disabled={liked}
                        className="flex flex-col items-center gap-2 px-8 py-4 rounded-2xl"
                        style={{
                            background: liked ? "rgba(244,63,94,0.1)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                            border: `1px solid ${liked ? "rgba(244,63,94,0.3)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                        }}
                        whileTap={{ scale: 0.95 }}>
                        {liked ? (
                            <FavoriteIcon style={{ fontSize: 28, color: "#f43f5e" }} />
                        ) : (
                            <FavoriteBorderIcon
                                style={{
                                    fontSize: 28,
                                    color: palette.textSecondary
                                }}
                            />
                        )}
                        <span
                            className="text-sm font-medium"
                            style={{
                                color: liked ? "#f43f5e" : palette.textSecondary
                            }}>
                            {likes} {likes === 1 ? "like" : "likes"}
                        </span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
