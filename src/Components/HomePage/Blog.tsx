"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Article,
    Schedule,
    Visibility,
    ThumbUp,
    Comment,
    Share,
    FilterList,
    Search,
    TrendingUp,
    Code,
    Security,
    Build,
    School
} from "@mui/icons-material";
import Link from "next/link";

interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    publishedAt: string;
    readTime: number;
    views: number;
    likes: number;
    comments: number;
    tags: string[];
    category: string;
    featured: boolean;
    image?: string;
    slug: string;
}

const blogPosts: BlogPost[] = [
    // {
    //     id: "location-bias-tech-hiring",
    //     title: "Location-Based Experience Bias in Tech Hiring",
    //     excerpt:
    //         "Exploring how geographical location creates artificial barriers for skilled developers, despite the tech industry's move toward remote work.",
    //     content:
    //         "A deep dive into the challenges skilled developers face when location bias overshadows demonstrable technical capabilities...",
    //     publishedAt: "2025-06-15",
    //     readTime: 8,
    //     views: 1247,
    //     likes: 89,
    //     comments: 23,
    //     tags: ["Career", "Remote Work", "Tech Industry", "Hiring"],
    //     category: "Career Insights",
    //     featured: true,
    //     slug: "location-bias-tech-hiring"
    // },
    {
        id: "ai-enhanced-development",
        title: "AI-Enhanced Development: Beyond GitHub Copilot",
        excerpt:
            "My journey through AI coding tools - from Tabnine to Cursor, Windsurf, and back to Copilot. What works and what doesn't.",
        content:
            "An in-depth comparison of AI development tools and how they've shaped my workflow over 3+ years...",
        publishedAt: "2025-06-10",
        readTime: 12,
        views: 2156,
        likes: 156,
        comments: 45,
        tags: ["AI", "Development Tools", "Productivity", "GitHub Copilot"],
        category: "Technology",
        featured: true,
        slug: "ai-enhanced-development"
    },
    {
        id: "enterprise-security-architecture",
        title: "Building Enterprise Security: From Threat Intelligence to Bot Detection",
        excerpt:
            "How I built a production-grade security platform with advanced threat detection, rate limiting, and monitoring systems.",
        content:
            "A technical deep-dive into building security systems that can handle enterprise-scale threats...",
        publishedAt: "2025-06-05",
        readTime: 15,
        views: 987,
        likes: 78,
        comments: 12,
        tags: ["Security", "Architecture", "Enterprise", "Node.js"],
        category: "Security",
        featured: false,
        slug: "enterprise-security-architecture"
    },
    // {
    //     id: "automation-systems-design",
    //     title: "Designing Scalable Automation: Multi-threading and Anti-Detection",
    //     excerpt:
    //         "Lessons learned from building commercial automation software with advanced session management and detection avoidance.",
    //     content:
    //         "Technical insights into building automation systems that can operate at scale...",
    //     publishedAt: "2025-05-28",
    //     readTime: 10,
    //     views: 1534,
    //     likes: 124,
    //     comments: 34,
    //     tags: ["Automation", "Python", "Scaling", "Architecture"],
    //     category: "Development",
    //     featured: false,
    //     slug: "automation-systems-design"
    // },
    {
        id: "npm-package-development",
        title: "Publishing Your First NPM Package: Express Router Plugin Journey",
        excerpt:
            "From idea to published package - how I built and published an Express.js enhancement library with TypeScript support.",
        content:
            "A complete guide to developing, testing, and publishing NPM packages...",
        publishedAt: "2025-05-20",
        readTime: 7,
        views: 892,
        likes: 67,
        comments: 18,
        tags: ["NPM", "Open Source", "TypeScript", "Express.js"],
        category: "Development",
        featured: false,
        slug: "npm-package-development"
    },
    {
        id: "self-taught-developer-journey",
        title: "From Zero to Staff Engineer: A Self-Taught Developer's Journey",
        excerpt:
            "How I went from manual coding to building enterprise systems in 3 years, reaching Staff Engineer level skills through focused learning.",
        content:
            "My complete journey from beginner to advanced developer, including challenges and breakthroughs...",
        publishedAt: "2025-05-15",
        readTime: 20,
        views: 3421,
        likes: 289,
        comments: 67,
        tags: ["Career", "Learning", "Self-Taught", "Journey"],
        category: "Career Insights",
        featured: true,
        slug: "self-taught-developer-journey"
    }
];

const categories = [
    "All",
    "Technology",
    "Security",
    "Development",
    "Career Insights"
];
const popularTags = [
    "AI",
    "Security",
    "Career",
    "Development Tools",
    "Architecture",
    "Remote Work"
];

function BlogsSection() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredPosts, setFilteredPosts] = useState(blogPosts);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        let filtered = blogPosts;

        // Filter by category
        if (activeCategory !== "All") {
            filtered = filtered.filter(
                (post) => post.category === activeCategory
            );
        }

        // Filter by tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter((post) =>
                selectedTags.some((tag) => post.tags.includes(tag))
            );
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(
                (post) =>
                    post.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    post.excerpt
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    post.tags.some((tag) =>
                        tag.toLowerCase().includes(searchQuery.toLowerCase())
                    )
            );
        }

        setFilteredPosts(filtered);
    }, [activeCategory, selectedTags, searchQuery]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Technology":
                return <Code className="text-sm" />;
            case "Security":
                return <Security className="text-sm" />;
            case "Development":
                return <Build className="text-sm" />;
            case "Career Insights":
                return <School className="text-sm" />;
            default:
                return <Article className="text-sm" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "k";
        }
        return num.toString();
    };

    return (
        <section
            id="blogs"
            className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Technical{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Blog
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Insights on software engineering, security, automation,
                        and the tech industry from a Staff Engineer perspective.
                    </p>
                </motion.div>
                {/* Filters and Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-12 space-y-6">
                    {/* Search and Filter Toggle */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <motion.button
                                onClick={() => setShowSearch(!showSearch)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
                                <Search className="text-lg" />
                                <span>Search</span>
                            </motion.button>

                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Article className="text-lg" />
                                <span>{filteredPosts.length} posts</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <FilterList className="text-lg text-gray-600 dark:text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedTags.length > 0
                                    ? `${selectedTags.length} tags selected`
                                    : "No filters"}
                            </span>
                        </div>
                    </div>

                    {/* Search Input */}
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden">
                                <input
                                    type="text"
                                    placeholder="Search posts, tags, or topics..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category Chips */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <motion.button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                    activeCategory === category
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                                }`}>
                                {getCategoryIcon(category)}
                                <span>{category}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Tag Chips */}
                    {/* <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                            Popular tags:
                        </span>
                        {popularTags.map((tag) => (
                            <motion.button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                    selectedTags.includes(tag)
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                                }`}>
                                #{tag}
                            </motion.button>
                        ))}
                    </div> */}
                </motion.div>{" "}
                {/* Blog Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredPosts.map((post, index) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{
                                    duration: 0.4,
                                    delay: index * 0.1
                                }}
                                className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-xl transition-all duration-300 ${
                                    post.featured
                                        ? "ring-2 ring-blue-500 ring-opacity-50"
                                        : ""
                                }`}
                                whileHover={{ y: -5 }}>

                                {/* Image Placeholder */}
                                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                                        <div className="text-white text-4xl opacity-50">
                                            {getCategoryIcon(post.category)}
                                        </div>
                                    </div>

                                    {/* Category Badge */}
                                    <div className="absolute bottom-4 left-4">
                                        <span className="inline-flex items-center space-x-1 bg-white/90 text-gray-900 px-2 py-1 rounded-full text-xs font-medium">
                                            {getCategoryIcon(post.category)}
                                            <span>{post.category}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        <div className="flex items-center space-x-1">
                                            <Schedule className="text-xs" />
                                            <span>
                                                {formatDate(post.publishedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span>
                                                {post.readTime} min read
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {post.tags.slice(0, 3).map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                        {post.tags.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded">
                                                +{post.tags.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    {/* Metrics */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center space-x-1">
                                                <Visibility className="text-xs" />
                                                <span>
                                                    {formatNumber(post.views)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <ThumbUp className="text-xs" />
                                                <span>
                                                    {formatNumber(post.likes)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Comment className="text-xs" />
                                                <span>{post.comments}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm group-hover:underline">
                                            Read More →
                                        </Link>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </div>
                {/* No Results */}
                {filteredPosts.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-12">
                        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
                            <Article />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No posts found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Try adjusting your filters or search terms.
                        </p>
                        <motion.button
                            onClick={() => {
                                setActiveCategory("All");
                                setSelectedTags([]);
                                setSearchQuery("");
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                            Clear Filters
                        </motion.button>
                    </motion.div>
                )}
                {/* View All Posts Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-center mt-12">
                    <Link
                        href="/blog"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium group">
                        <span>View All Posts</span>
                        <Share className="text-lg group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

export default BlogsSection;
