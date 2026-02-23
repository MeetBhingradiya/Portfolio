"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { BlogStatus } from "@/Types/Blog";

const CATEGORY_COLORS: Record<string, string> = {
    technology: "#6366f1",
    development: "#22c55e",
    design: "#f43f5e",
    career: "#f59e0b",
    tutorial: "#0ea5e9",
    news: "#8b5cf6",
    personal: "#ec4899",
    other: "#94a3b8"
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    [BlogStatus.Draft]: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", label: "Draft" },
    [BlogStatus.PendingReview]: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", label: "Pending" },
    [BlogStatus.Published]: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", label: "Published" },
    [BlogStatus.Unlisted]: { bg: "rgba(129,140,248,0.12)", text: "#818cf8", label: "Unlisted" },
    [BlogStatus.Private]: { bg: "rgba(107,114,128,0.12)", text: "#6b7280", label: "Private" },
    [BlogStatus.Rejected]: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", label: "Rejected" }
};

export interface BlogCardData {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
    readTime?: number;
    views?: number;
    likes?: number;
    status?: BlogStatus;
    authorName?: string;
    authorImage?: string;
    publishedAt?: string;
    createdAt?: string;
}

interface BlogCardProps {
    blog: BlogCardData;
    showStatus?: boolean;
}

export default function BlogCard({ blog, showStatus = false }: BlogCardProps) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const categoryColor = CATEGORY_COLORS[blog.category || "other"] || "#94a3b8";
    const statusInfo = blog.status ? STATUS_COLORS[blog.status] : null;

    const dateStr = blog.publishedAt || blog.createdAt;
    const formattedDate = dateStr
        ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null;

    return (
        <Link href={`/blogs/${blog.slug}`} tabIndex={-1}>
            <motion.article
                className="flex flex-col overflow-hidden cursor-pointer"
                style={{
                    background: isApple
                        ? isDark ? "rgba(28,28,32,0.65)" : "rgba(255,255,255,0.65)"
                        : isDark ? "rgba(20,20,28,0.95)" : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                    backdropFilter: isApple ? "blur(20px)" : "none",
                    borderRadius: isApple ? 18 : 18
                }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {/* Cover image */}
                {blog.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="w-full object-cover aspect-video"
                        style={{ borderRadius: `${isApple ? 18 : 18}px ${isApple ? 18 : 18}px 0 0` }}
                    />
                ) : (
                    <div
                        className="aspect-video w-full flex items-center justify-center text-4xl font-bold"
                        style={{
                            background: `linear-gradient(135deg, ${categoryColor}22, ${categoryColor}44)`,
                            borderRadius: `${isApple ? 18 : 18}px ${isApple ? 18 : 18}px 0 0`,
                            color: categoryColor
                        }}
                    >
                        {blog.title.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="flex flex-col gap-3 p-4">
                    {/* Category + Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {blog.category && (
                            <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                    background: `${categoryColor}18`,
                                    color: categoryColor,
                                    border: `1px solid ${categoryColor}35`
                                }}
                            >
                                {blog.category}
                            </span>
                        )}
                        {showStatus && statusInfo && (
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ background: statusInfo.bg, color: statusInfo.text }}
                            >
                                {statusInfo.label}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3
                        className="font-bold leading-snug line-clamp-2"
                        style={{ color: palette.textPrimary, fontSize: 16 }}
                    >
                        {blog.title}
                    </h3>

                    {/* Excerpt */}
                    {blog.excerpt && (
                        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: palette.textSecondary }}>
                            {blog.excerpt}
                        </p>
                    )}

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                            {blog.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                        color: palette.textSecondary
                                    }}
                                >
                                    #{tag}
                                </span>
                            ))}
                            {blog.tags.length > 3 && (
                                <span className="text-xs px-1" style={{ color: palette.textSecondary }}>
                                    +{blog.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer: author + stats */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            {blog.authorImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={blog.authorImage} alt={blog.authorName} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ background: palette.accent + "30", color: palette.accent }}
                                >
                                    {blog.authorName?.charAt(0) || "?"}
                                </div>
                            )}
                            <div>
                                <span className="text-xs font-medium" style={{ color: palette.textSecondary }}>
                                    {blog.authorName || "Unknown"}
                                </span>
                                {formattedDate && (
                                    <span className="text-xs ml-1" style={{ color: palette.textSecondary }}>
                                        · {formattedDate}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {blog.readTime != null && (
                                <span className="flex items-center gap-0.5 text-xs" style={{ color: palette.textSecondary }}>
                                    <AccessTimeIcon style={{ fontSize: 11 }} />{blog.readTime}m
                                </span>
                            )}
                            {blog.views != null && (
                                <span className="flex items-center gap-0.5 text-xs" style={{ color: palette.textSecondary }}>
                                    <VisibilityIcon style={{ fontSize: 11 }} />{blog.views}
                                </span>
                            )}
                            {blog.likes != null && (
                                <span className="flex items-center gap-0.5 text-xs" style={{ color: "#f43f5e" }}>
                                    <FavoriteIcon style={{ fontSize: 11 }} />{blog.likes}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
}
