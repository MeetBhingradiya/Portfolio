"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    ChevronLeft,
    ChevronRight,
    Launch,
    GitHub,
    Star,
    Visibility,
    Security,
    Build,
    Public,
    Speed,
    // Award,
    School,
    EmojiEvents
} from "@mui/icons-material";
import Link from "next/link";

interface ShowcaseItem {
    id: string;
    title: string;
    description: string;
    type: "project" | "certificate" | "achievement" | "featured";
    image: string;
    technologies: string[];
    links?: {
        live?: string;
        github?: string;
        demo?: string;
    };
    metrics?: {
        stars?: number;
        views?: number;
        downloads?: number;
    };
    featured?: boolean;
    category: string;
}

const showcaseItems: ShowcaseItem[] = [
    {
        id: "portfolio-security",
        title: "Enterprise Security Platform",
        description:
            "Production-grade security platform with threat intelligence, bot detection, and advanced analytics. Built with Next.js, MongoDB, and custom security middleware.",
        type: "featured",
        image: "/projects/security-platform.jpg",
        technologies: [
            "Next.js",
            "TypeScript",
            "MongoDB",
            "Security",
            "Analytics"
        ],
        links: {
            live: "https://meetbhingradiya.vercel.app",
            github: "https://github.com/MeetBhingradiya/Portfolio"
        },
        metrics: { stars: 15, views: 2500 },
        featured: true,
        category: "Full Stack"
    },
    // {
    //     id: "automation-bot",
    //     title: "MS Rewards Automation",
    //     description:
    //         "Commercial automation software with multi-threading, session management, and anti-detection systems. Features licensing and monitoring.",
    //     type: "project",
    //     image: "/projects/automation-bot.jpg",
    //     technologies: ["Python", "Selenium", "Multi-threading", "Automation"],
    //     links: {
    //         github: "https://github.com/MeetBhingradiya/BingRewardsBots"
    //     },
    //     metrics: { stars: 8, views: 1200 },
    //     category: "Automation"
    // },
    {
        id: "express-router-plugin",
        title: "Express Router Plugin",
        description:
            "NPM package for Express.js with integrated rate limiting, middleware management, and TypeScript support. Published and actively maintained.",
        type: "project",
        image: "/projects/npm-package.jpg",
        technologies: ["TypeScript", "Express.js", "NPM", "Framework"],
        links: {
            github: "https://github.com/MeetBhingradiya/express-router-plugin",
            live: "https://npmjs.com/package/express-router-plugin"
        },
        metrics: { downloads: 500 },
        category: "Framework"
    },
    {
        id: "ai-certification",
        title: "GitHub Copilot Certification",
        description:
            "Advanced certification in AI-assisted development with GitHub Copilot, covering enterprise workflows and best practices.",
        type: "certificate",
        image: "/certificates/github-copilot.jpg",
        technologies: ["AI", "GitHub Copilot", "Development"],
        category: "AI & Tools"
    },
    // {
    //     id: "security-achievement",
    //     title: "Security Expert Recognition",
    //     description:
    //         "Recognition for building enterprise-grade security systems with threat intelligence and advanced protection mechanisms.",
    //     type: "achievement",
    //     image: "/achievements/security-expert.jpg",
    //     technologies: ["Security", "Threat Intelligence", "Protection"],
    //     category: "Security"
    // }
];

const categories = [
    "All",
    "Full Stack",
    // "Automation",
    "Framework",
    "AI & Tools",
    // "Security"
];

function Showcase() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeCategory, setActiveCategory] = useState("All");
    const [filteredItems, setFilteredItems] = useState(showcaseItems);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    useEffect(() => {
        if (activeCategory === "All") {
            setFilteredItems(showcaseItems);
        } else {
            setFilteredItems(
                showcaseItems.filter((item) => item.category === activeCategory)
            );
        }
    }, [activeCategory]);

    const checkScrollButtons = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scrollTo = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            const newScrollLeft =
                direction === "left"
                    ? scrollRef.current.scrollLeft - scrollAmount
                    : scrollRef.current.scrollLeft + scrollAmount;

            scrollRef.current.scrollTo({
                left: newScrollLeft,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener("scroll", checkScrollButtons);
            checkScrollButtons();
            return () =>
                scrollElement.removeEventListener("scroll", checkScrollButtons);
        }
    }, [filteredItems]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "project":
                return <Build className="text-lg" />;
            case "certificate":
                return <School className="text-lg" />;
            case "achievement":
                return <EmojiEvents className="text-lg" />;
            case "featured":
                return <Star className="text-lg" />;
            default:
                return <Build className="text-lg" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "project":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "certificate":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "achievement":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            case "featured":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
        }
    };

    return (
        <section
            id="showcase"
            className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Featured{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Showcase
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Explore my portfolio of enterprise projects,
                        certifications, and achievements in security engineering
                        and full-stack development.
                    </p>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-2 mb-8">
                    {categories.map((category) => (
                        <motion.button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                activeCategory === category
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}>
                            {category}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Horizontal Scroll Container */}
                <div className="relative">
                    {/* Scroll Buttons */}
                    <AnimatePresence>
                        {canScrollLeft && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => scrollTo("left")}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}>
                                <ChevronLeft className="text-xl" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {canScrollRight && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => scrollTo("right")}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}>
                                <ChevronRight className="text-xl" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Scrollable Content */}
                    <div
                        ref={scrollRef}
                        className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none"
                        }}>
                        {" "}
                        <AnimatePresence>
                            {filteredItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.1
                                    }}
                                    className={`flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-xl transition-all duration-300 ${
                                        item.featured
                                            ? "ring-2 ring-blue-500 ring-opacity-50"
                                            : ""
                                    }`}
                                    style={{ width: "350px" }}
                                    whileHover={{ y: -5 }}>
                                    {/* Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                                        {/* Placeholder for now - replace with actual images */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                                            <div className="text-white text-6xl opacity-50">
                                                {getTypeIcon(item.type)}
                                            </div>
                                        </div>

                                        {/* Type Badge */}
                                        <div className="absolute top-3 left-3">
                                            <span
                                                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                                                {getTypeIcon(item.type)}
                                                <span className="capitalize">
                                                    {item.type}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Featured Badge */}
                                        {item.featured && (
                                            <div className="absolute top-3 right-3">
                                                <span className="inline-flex items-center space-x-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
                                                    <Star className="text-xs" />
                                                    <span>Featured</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                            {item.title}
                                        </h3>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                                            {item.description}
                                        </p>

                                        {/* Technologies */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {item.technologies
                                                .slice(0, 3)
                                                .map((tech) => (
                                                    <span
                                                        key={tech}
                                                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            {item.technologies.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded">
                                                    +
                                                    {item.technologies.length -
                                                        3}
                                                </span>
                                            )}
                                        </div>

                                        {/* Metrics */}
                                        {item.metrics && (
                                            <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                                                {item.metrics.stars && (
                                                    <div className="flex items-center space-x-1">
                                                        <Star className="text-xs" />
                                                        <span>
                                                            {item.metrics.stars}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.metrics.views && (
                                                    <div className="flex items-center space-x-1">
                                                        <Visibility className="text-xs" />
                                                        <span>
                                                            {item.metrics.views}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.metrics.downloads && (
                                                    <div className="flex items-center space-x-1">
                                                        <Speed className="text-xs" />
                                                        <span>
                                                            {
                                                                item.metrics
                                                                    .downloads
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Links */}
                                        {item.links && (
                                            <div className="flex space-x-3">
                                                {item.links.live && (
                                                    <Link
                                                        href={item.links.live}
                                                        target="_blank"
                                                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                                                        <Launch className="text-xs" />
                                                        <span>Live</span>
                                                    </Link>
                                                )}
                                                {item.links.github && (
                                                    <Link
                                                        href={item.links.github}
                                                        target="_blank"
                                                        className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium">
                                                        <GitHub className="text-xs" />
                                                        <span>Code</span>
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* View All Projects Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-center mt-12">
                    <Link
                        href="/projects"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium group">
                        <span>View All Projects</span>
                        <ChevronRight className="text-lg group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

export default Showcase;
