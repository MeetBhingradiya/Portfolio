"use client";

import React, { useState, use } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useDesignTheme } from "../../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIHeader, OneUIBadge, OneUIListItem } from "../../../Components/OneUI";
import { projects, type IProject } from "../../../Data/Projects";
import {
    ArrowBack,
    Star,
    ForkRight,
    GitHub,
    OpenInNew,
    Description,
    PlayArrow,
    People,
    CalendarToday,
    CheckCircle,
    EmojiEvents,
    School,
    Close,
    Launch,
    Code
} from "@mui/icons-material";

function ProjectDetailPageContent({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const { designTheme, palette, colorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = colorMode === "dark";

    // Unwrap params using React.use()
    const { slug } = use(params);
    
    // Find project by slug
    const project = projects.find((p) => p.slug === slug);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "tech" | "packages">("overview");

    if (!project) {
        notFound();
    }

    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

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

    const getPackageIcon = (type: string) => {
        switch (type) {
            case "npm":
                return "📦";
            case "pip":
                return "🐍";
            case "gem":
                return "💎";
            case "composer":
                return "🎼";
            case "cargo":
                return "📦";
            case "go":
                return "🐹";
            default:
                return "📦";
        }
    };

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
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.back()}
                    className={`mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} font-${isApple ? 'medium' : 'bold'} transition-all ${
                        isDark
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    } shadow-lg hover:shadow-xl`}
                >
                    <ArrowBack />
                    <span>Back to Projects</span>
                </motion.button>

                {/* Hero Section */}
                <Card {...(isApple ? { intensity: "medium" } : {})} className="mb-8 overflow-hidden">
                    <div className="p-8 space-y-6">
                        {/* Title & Badges */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-start gap-4">
                                <div className="flex-1 min-w-0">
                                        <h1 className={`text-4xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {project.title}
                                    </h1>
                                </div>
                                {project.featured && (
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} bg-yellow-500 text-white font-${isApple ? 'semibold' : 'bold'} shadow-lg`}>
                                        <Star />
                                        <span>Featured</span>
                                    </div>
                                )}
                            </div>

                            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {project.shortDescription}
                            </p>

                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} text-sm font-${isApple ? 'medium' : 'bold'} border ${getStatusColor(project.status)}`}>
                                    {project.status.replace("-", " ")}
                                </span>
                                <span className={`inline-flex items-center px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} text-sm font-${isApple ? 'medium' : 'bold'} ${
                                    isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-300'
                                } border`}>
                                    {project.category}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-4">
                            {project.githubUrl && (
                                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                    <Button>
                                        <span className="flex items-center gap-2">
                                            <GitHub />
                                            <span>View on GitHub</span>
                                        </span>
                                    </Button>
                                </a>
                            )}
                            {project.liveUrl && (
                                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                                    <Button>
                                        <span className="flex items-center gap-2">
                                            <Launch />
                                            <span>Live Demo</span>
                                        </span>
                                    </Button>
                                </a>
                            )}
                            {project.demoUrl && (
                                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="secondary">
                                        <span className="flex items-center gap-2">
                                            <PlayArrow />
                                            <span>View Demo</span>
                                        </span>
                                    </Button>
                                </a>
                            )}
                            {project.documentationUrl && (
                                <a href={project.documentationUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="secondary">
                                        <span className="flex items-center gap-2">
                                            <Description />
                                            <span>Documentation</span>
                                        </span>
                                    </Button>
                                </a>
                            )}
                        </div>

                        {/* Stats */}
                        <div className={`flex flex-wrap items-center gap-6 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                            {project.stars !== undefined && (
                                <div className="flex items-center gap-2">
                                    <Star className="text-yellow-500" />
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {project.stars}
                                    </span>
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        stars
                                    </span>
                                </div>
                            )}
                            {project.forks !== undefined && (
                                <div className="flex items-center gap-2">
                                    <ForkRight className="text-blue-500" />
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {project.forks}
                                    </span>
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        forks
                                    </span>
                                </div>
                            )}
                            {project.contributors !== undefined && (
                                <div className="flex items-center gap-2">
                                    <People className="text-green-500" />
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {project.contributors}
                                    </span>
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        contributors
                                    </span>
                                </div>
                            )}
                            {project.teamSize !== undefined && (
                                <div className="flex items-center gap-2">
                                    <People className="text-purple-500" />
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {project.teamSize}
                                    </span>
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        team size
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <CalendarToday className="text-orange-500" />
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {project.startDate} {project.endDate ? `- ${project.endDate}` : '- Present'}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Screenshots Gallery */}
                {project.screenshots.length > 0 && (
                    <Card {...(isApple ? { intensity: "medium" } : {})} className="mb-8 p-8">
                        <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                            Screenshots
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {project.screenshots.map((screenshot, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => setSelectedImage(screenshot)}
                                    className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group"
                                >
                                    <div className={`absolute inset-0 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                                        <Code className={`w-12 h-12 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                        <OpenInNew className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Tabs */}
                <div className="mb-8">
                    <div className={`flex gap-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        {[
                            { value: "overview", label: "Overview" },
                            { value: "tech", label: "Tech Stack" },
                            { value: "packages", label: "Packages" },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value as any)}
                                className={`px-6 py-3 font-${isApple ? 'semibold' : 'bold'} transition-all relative ${
                                    activeTab === tab.value
                                        ? 'text-accent-500'
                                        : isDark
                                        ? 'text-gray-400 hover:text-gray-300'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                                {activeTab === tab.value && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Description */}
                            <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                                    About This Project
                                </h3>
                                <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {project.fullDescription}
                                </p>
                                {project.role && (
                                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <span className="font-bold">My Role:</span> {project.role}
                                        </p>
                                    </div>
                                )}
                            </Card>

                            {/* Features */}
                            <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                                    Key Features
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {project.features.map((feature, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-start gap-3 p-4 rounded-${isApple ? 'lg' : 'xl'} ${
                                                isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                                            }`}
                                        >
                                            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                {feature}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </Card>

                            {/* Challenges & Learnings */}
                            {(project.challenges || project.learnings) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {project.challenges && project.challenges.length > 0 && (
                                        <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                            <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                                                Challenges
                                            </h3>
                                            <div className="space-y-3">
                                                {project.challenges.map((challenge, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex items-start gap-3 p-3 rounded-${isApple ? 'lg' : 'xl'} ${
                                                            isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                                                        }`}
                                                    >
                                                        <EmojiEvents className="text-red-500 flex-shrink-0 mt-0.5" />
                                                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {challenge}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    )}

                                    {project.learnings && project.learnings.length > 0 && (
                                        <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                            <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                                                Key Learnings
                                            </h3>
                                            <div className="space-y-3">
                                                {project.learnings.map((learning, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex items-start gap-3 p-3 rounded-${isApple ? 'lg' : 'xl'} ${
                                                            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                                                        }`}
                                                    >
                                                        <School className="text-blue-500 flex-shrink-0 mt-0.5" />
                                                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {learning}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "tech" && (
                        <motion.div
                            key="tech"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Technologies */}
                            {project.technologies.length > 0 && (
                                <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                                        Technologies
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {project.technologies.map((tech, index) => (
                                            <motion.span
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} font-${isApple ? 'medium' : 'bold'} ${
                                                    isDark ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-300'
                                                } shadow-sm hover:shadow-md transition-all`}
                                            >
                                                {tech}
                                            </motion.span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Frameworks */}
                            {project.frameworks.length > 0 && (
                                <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                                        Frameworks & Libraries
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {project.frameworks.map((framework, index) => (
                                            <motion.span
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} font-${isApple ? 'medium' : 'bold'} bg-accent-500/10 ${isDark ? 'text-accent-400' : 'text-accent-600'} border border-accent-500/20 shadow-sm hover:shadow-md transition-all`}
                                            >
                                                {framework}
                                            </motion.span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Tools */}
                            {project.tools.length > 0 && (
                                <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                                        Tools & Platforms
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {project.tools.map((tool, index) => (
                                            <motion.span
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} font-${isApple ? 'medium' : 'bold'} ${
                                                    isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200'
                                                } border shadow-sm hover:shadow-md transition-all`}
                                            >
                                                {tool}
                                            </motion.span>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "packages" && (
                        <motion.div
                            key="packages"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Card {...(isApple ? { intensity: "medium" } : {})} className="p-8">
                                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                                    NPM & PIP Packages
                                </h3>
                                {project.packages.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {project.packages.map((pkg, index) => (
                                            <motion.a
                                                key={index}
                                                href={pkg.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                whileHover={{ scale: 1.02 }}
                                                className={`p-4 rounded-${isApple ? 'lg' : 'xl'} ${
                                                    isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                                                } border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all group`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{getPackageIcon(pkg.type)}</span>
                                                        <div>
                                                            <div className={`font-${isApple ? 'semibold' : 'bold'} ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-accent-500 transition-colors`}>
                                                                {pkg.name}
                                                            </div>
                                                            <div className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {pkg.type}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <OpenInNew className={`${isDark ? 'text-gray-400' : 'text-gray-600'} group-hover:text-accent-500 transition-colors`} />
                                                </div>
                                            </motion.a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        No packages listed for this project
                                    </p>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Image Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <Close className="text-white" />
                        </motion.button>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-6xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'} p-2`}>
                                <div className="aspect-video flex items-center justify-center">
                                    <Code className={`w-24 h-24 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    return <ProjectDetailPageContent params={params} />;
}
