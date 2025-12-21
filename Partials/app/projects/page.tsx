"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIHeader, OneUIBadge } from "../../Components/OneUI";
import { projects, type IProject } from "../../Data/Projects";
import {
    Star,
    ForkRight,
    GitHub,
    OpenInNew,
    FilterList,
    Search,
    ViewModule,
    ViewList,
    Code,
    Web,
    PhoneAndroid,
    DesktopMac,
    Api,
    LocalLibrary,
    Build
} from "@mui/icons-material";

const categories = [
    { value: "all", label: "All Projects", icon: <ViewModule /> },
    { value: "web", label: "Web", icon: <Web /> },
    { value: "mobile", label: "Mobile", icon: <PhoneAndroid /> },
    { value: "desktop", label: "Desktop", icon: <DesktopMac /> },
    { value: "api", label: "API", icon: <Api /> },
    { value: "library", label: "Library", icon: <LocalLibrary /> },
    { value: "tool", label: "Tool", icon: <Build /> },
];

const statuses = [
    { value: "all", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "in-progress", label: "In Progress" },
    { value: "maintained", label: "Maintained" },
    { value: "archived", label: "Archived" },
];

function ProjectsPageContent() {
    const router = useRouter();
    const { designTheme, palette, colorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = colorMode === "dark";

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    // Filter projects
    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.technologies.some((tech) =>
                tech.toLowerCase().includes(searchQuery.toLowerCase())
            );
        const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
        const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-green-500 bg-green-500/10 border-green-500/20";
            case "in-progress":
                return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "maintained":
                return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            case "archived":
                return "text-gray-500 bg-gray-500/10 border-gray-500/20";
            default:
                return "text-gray-500 bg-gray-500/10 border-gray-500/20";
        }
    };

    const ProjectCard = ({ project }: { project: IProject }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -8 }}
            onClick={() => router.push(`/projects/${project.slug}`)}
            className="cursor-pointer h-full"
        >
            <Card {...(isApple ? { intensity: "medium" } : {})} className="h-full flex flex-col group">
                {/* Thumbnail */}
                <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
                    {project.featured && (
                        <div className="absolute top-4 right-4 z-10">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500 text-white text-xs font-${isApple ? 'semibold' : 'bold'} shadow-lg`}>
                                <Star className="w-4 h-4" />
                                <span>Featured</span>
                            </div>
                        </div>
                    )}
                    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'} flex items-center justify-center`}>
                        <Code className={`w-16 h-16 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-4">
                    {/* Title & Status */}
                    <div className="space-y-2">
                        <h3 className={`font-${isApple ? 'bold' : 'black'} text-xl ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-accent-500 transition-colors line-clamp-1`}>
                            {project.title}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                            {project.shortDescription}
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-${isApple ? 'lg' : 'xl'} text-xs font-${isApple ? 'medium' : 'bold'} border ${getStatusColor(project.status)}`}>
                            {project.status.replace("-", " ")}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-${isApple ? 'lg' : 'xl'} text-xs font-${isApple ? 'medium' : 'bold'} ${
                            isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-300'
                        } border`}>
                            {project.category}
                        </span>
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 4).map((tech, index) => (
                            <span
                                key={index}
                                className={`text-xs px-2 py-0.5 rounded-${isApple ? 'md' : 'lg'} ${
                                    isDark ? 'bg-gray-800/60 text-gray-400' : 'bg-gray-100/60 text-gray-600'
                                }`}
                            >
                                {tech}
                            </span>
                        ))}
                        {project.technologies.length > 4 && (
                            <span className={`text-xs px-2 py-0.5 rounded-${isApple ? 'md' : 'lg'} ${
                                isDark ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                                +{project.technologies.length - 4}
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                        {project.stars !== undefined && (
                            <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Star className="w-4 h-4" />
                                <span>{project.stars}</span>
                            </div>
                        )}
                        {project.forks !== undefined && (
                            <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <ForkRight className="w-4 h-4" />
                                <span>{project.forks}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 pb-6 pt-0 flex items-center gap-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} mt-auto`}>
                    {project.githubUrl && (
                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`p-2 rounded-${isApple ? 'lg' : 'xl'} ${
                                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            } transition-colors`}
                        >
                            <GitHub className="w-5 h-5" />
                        </a>
                    )}
                    {project.liveUrl && (
                        <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`p-2 rounded-${isApple ? 'lg' : 'xl'} ${
                                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            } transition-colors`}
                        >
                            <OpenInNew className="w-5 h-5" />
                        </a>
                    )}
                    <div className="ml-auto">
                        <Button
                            onClick={() => router.push(`/projects/${project.slug}`)}
                            className="text-sm"
                            variant="secondary"
                        >
                            View Details →
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
            {/* Background Effects */}
            {isApple && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                </div>
            )}

            <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <div className="mb-12 text-center space-y-4">
                        <h1 className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Projects
                    </h1>
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
                        Explore my portfolio of projects spanning web development, mobile apps, security tools, and more.
                    </p>
                </div>

                {/* Filters */}
                <Card {...(isApple ? { intensity: "subtle" } : {})} className="mb-8 p-6">
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Search projects, technologies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                    isDark
                                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500`}
                            />
                        </div>

                        {/* Category Filters */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category.value}
                                    onClick={() => setSelectedCategory(category.value)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} font-${isApple ? 'medium' : 'bold'} text-sm transition-all ${
                                        selectedCategory === category.value
                                            ? 'bg-accent-500 text-white shadow-lg'
                                            : isDark
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {category.icon}
                                    <span>{category.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Status & View Mode */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex flex-wrap gap-2">
                                {statuses.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => setSelectedStatus(status.value)}
                                        className={`px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} text-sm font-${isApple ? 'medium' : 'bold'} transition-all ${
                                            selectedStatus === status.value
                                                ? 'bg-accent-500 text-white'
                                                : isDark
                                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-${isApple ? 'lg' : 'xl'} transition-all ${
                                        viewMode === "grid"
                                            ? 'bg-accent-500 text-white'
                                            : isDark
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <ViewModule />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-${isApple ? 'lg' : 'xl'} transition-all ${
                                        viewMode === "list"
                                            ? 'bg-accent-500 text-white'
                                            : isDark
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <ViewList />
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Results Count */}
                <div className="mb-6">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Found <span className="font-bold text-accent-500">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Projects Grid */}
                <AnimatePresence mode="wait">
                    {filteredProjects.length > 0 ? (
                        <motion.div
                            key="projects-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`grid gap-6 ${
                                viewMode === "grid"
                                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                    : "grid-cols-1"
                            }`}
                        >
                            {filteredProjects.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <ProjectCard project={project} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="no-results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20"
                        >
                            <div className={`text-6xl mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>🔍</div>
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                No projects found
                            </h3>
                            <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Try adjusting your filters or search query
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    return <ProjectsPageContent />;
}
