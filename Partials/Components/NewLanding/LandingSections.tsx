/**
 * Landing Page Sections
 * Projects, Skills, Experience, and more
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { LiquidGlassCard } from "../LiquidGlass";
import { OneUICard, OneUIHeader, OneUIListItem, OneUIBadge } from "../OneUI";
import {
    Code,
    Security,
    Cloud,
    Speed,
    Smartphone,
    Web,
    Storage,
    Settings,
    Star,
    Visibility,
    GitHub,
    OpenInNew,
    ArrowBackIos,
    ArrowForwardIos,
    Pause,
    PlayArrow
} from "@mui/icons-material";

const projects = [
    {
        title: "Portfolio Ecosystem",
        description: "Advanced portfolio with multi-theme support, authentication, and admin panel",
        tags: ["Next.js", "TypeScript", "MongoDB"],
        stars: 15,
        link: "https://github.com/MeetBhingradiya/Portfolio",
        featured: true
    },
    {
        title: "Security Suite",
        description: "Comprehensive security tools and DevOps automation scripts",
        tags: ["Python", "Bash", "Security"],
        stars: 8,
        link: "#",
        featured: true
    },
    {
        title: "Cloud Infrastructure",
        description: "Scalable cloud architecture with automated deployment pipelines",
        tags: ["AWS", "Docker", "Kubernetes"],
        stars: 12,
        link: "#",
        featured: false
    },
];

const skills = [
    { name: "React & Next.js", level: 95, icon: <Web />, category: "Frontend" },
    { name: "TypeScript", level: 90, icon: <Code />, category: "Languages" },
    { name: "Node.js & Python", level: 88, icon: <Settings />, category: "Backend" },
    { name: "DevOps & Cloud", level: 85, icon: <Cloud />, category: "Infrastructure" },
    { name: "Security", level: 82, icon: <Security />, category: "Specialized" },
    { name: "Mobile Development", level: 75, icon: <Smartphone />, category: "Mobile" }
];

const experiences = [
    {
        role: "Full Stack Developer",
        company: "Freelance",
        period: "2021 - Present",
        description: "Building scalable web applications and managing end-to-end project delivery",
        achievements: [
            "Delivered 5+ major projects with 100% client satisfaction",
            "Reduced deployment time by 60% through CI/CD automation",
            "Implemented security best practices across all projects"
        ]
    },
    {
        role: "Open Source Contributor",
        company: "Various Projects",
        period: "2020 - Present",
        description: "Contributing to open-source projects and maintaining personal projects",
        achievements: [
            "80k+ lines of code written and maintained",
            "Active contributions to community projects",
            "Mentoring junior developers"
        ]
    }
];

export function ProjectsSection() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const dragX = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % projects.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % projects.length);
        setIsAutoPlaying(false);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
        setIsAutoPlaying(false);
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    };

    return (
        <section
            className="py-20 overflow-hidden"
            style={{ background: palette.background }}
        >
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    {isApple ? (
                        <motion.h2
                            className="text-4xl md:text-5xl font-bold"
                            style={{ color: palette.textPrimary }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            Featured Projects
                        </motion.h2>
                    ) : (
                        <OneUIHeader
                            title="Featured Projects"
                            subtitle="Building impactful solutions"
                        />
                    )}
                </div>

                {/* Carousel Container */}
                <div className="relative" ref={containerRef}>
                    {/* Projects Carousel */}
                    <motion.div
                        className="overflow-hidden"
                        style={{
                            cursor: isDragging ? "grabbing" : "grab"
                        }}
                    >
                        <motion.div
                            className="flex gap-6"
                            animate={{
                                x: `-${currentIndex * 100}%`
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={(e, { offset, velocity }) => {
                                setIsDragging(false);
                                const swipe = Math.abs(offset.x) * velocity.x;

                                if (swipe < -10000) {
                                    handleNext();
                                } else if (swipe > 10000) {
                                    handlePrev();
                                }
                            }}
                        >
                            {projects.map((project, index) => (
                                <motion.div
                                    key={project.title}
                                    className="min-w-full md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)]"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card
                                        className="h-full p-6"
                                        intensity={isApple ? "medium" : undefined}
                                        elevated={!isApple}
                                    >
                                        <div className="flex flex-col h-full">
                                            {project.featured && (
                                                <div className="mb-3">
                                                    {isApple ? (
                                                        <span
                                                            className="text-xs font-semibold px-2 py-1 rounded"
                                                            style={{
                                                                background: palette.accentSubtle,
                                                                color: palette.accent
                                                            }}
                                                        >
                                                            Featured
                                                        </span>
                                                    ) : (
                                                        <OneUIBadge variant="accent">Featured</OneUIBadge>
                                                    )}
                                                </div>
                                            )}

                                            <h3
                                                className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-3`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                {project.title}
                                            </h3>

                                            <p
                                                className={`${isApple ? "text-sm" : "text-base font-medium"} mb-4 flex-grow`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                {project.description}
                                            </p>

                                            <div className="flex items-center gap-4 mb-4">
                                                <div
                                                    className="flex items-center gap-1"
                                                    style={{ color: palette.textTertiary }}
                                                >
                                                    <Star className="text-lg" style={{ color: "#FFD700" }} />
                                                    <span className={isApple ? "text-sm" : "text-base font-semibold"}>
                                                        {project.stars}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {project.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className={`${isApple ? "text-xs px-2 py-1 rounded" : "text-sm px-3 py-1.5 rounded-full font-bold"}`}
                                                        style={{
                                                            background: palette.backgroundSecondary,
                                                            color: palette.textSecondary
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <a
                                                href={project.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 mt-auto"
                                                style={{ color: palette.accent }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}>
                                                    View Project
                                                </span>
                                                <OpenInNew className="text-sm" />
                                            </a>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        {/* Previous Button */}
                        <motion.button
                            onClick={handlePrev}
                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"}`}
                            style={{
                                background: isApple ? palette.glassBg : palette.backgroundSecondary,
                                backdropFilter: isApple ? palette.glassBlur : "none",
                                border: `1px solid ${palette.border}`,
                                color: palette.textPrimary
                            }}
                            whileHover={{
                                scale: 1.1,
                                backgroundColor: palette.accentSubtle,
                                borderColor: palette.accent
                            }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ArrowBackIos className="text-sm" />
                        </motion.button>

                        {/* Dots Indicator */}
                        <div className="flex items-center gap-2">
                            {projects.map((_, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleDotClick(index)}
                                    className={`${isApple ? "w-2 h-2" : "w-3 h-3"} rounded-full transition-all`}
                                    style={{
                                        background: currentIndex === index ? palette.accent : palette.border,
                                        width: currentIndex === index ? (isApple ? "24px" : "32px") : (isApple ? "8px" : "12px")
                                    }}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.8 }}
                                />
                            ))}
                        </div>

                        {/* Next Button */}
                        <motion.button
                            onClick={handleNext}
                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"}`}
                            style={{
                                background: isApple ? palette.glassBg : palette.backgroundSecondary,
                                backdropFilter: isApple ? palette.glassBlur : "none",
                                border: `1px solid ${palette.border}`,
                                color: palette.textPrimary
                            }}
                            whileHover={{
                                scale: 1.1,
                                backgroundColor: palette.accentSubtle,
                                borderColor: palette.accent
                            }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ArrowForwardIos className="text-sm" />
                        </motion.button>

                        {/* Play/Pause Button */}
                        <motion.button
                            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"}`}
                            style={{
                                background: isAutoPlaying 
                                    ? palette.accent 
                                    : isApple ? palette.glassBg : palette.backgroundSecondary,
                                backdropFilter: isApple ? palette.glassBlur : "none",
                                border: `1px solid ${isAutoPlaying ? palette.accent : palette.border}`,
                                color: isAutoPlaying ? palette.textOnAccent : palette.textPrimary
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {isAutoPlaying ? (
                                <Pause className="text-sm" />
                            ) : (
                                <PlayArrow className="text-sm" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function SkillsSection() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    return (
        <section
            className="py-20"
            style={{ background: isApple ? palette.backgroundElevated : palette.background }}
        >
            <div className="max-w-7xl mx-auto px-6">
                {isApple ? (
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold mb-12"
                        style={{ color: palette.textPrimary }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Technical Skills
                    </motion.h2>
                ) : (
                    <OneUIHeader
                        title="Technical Skills"
                        subtitle="Expertise across the stack"
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {skills.map((skill, index) => (
                        <motion.div
                            key={skill.name}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card
                                className="p-6"
                                intensity={isApple ? "medium" : undefined}
                                elevated={!isApple}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div
                                        className={`${isApple ? "text-2xl" : "text-3xl p-3 rounded-2xl"}`}
                                        style={{
                                            color: palette.accent,
                                            background: !isApple ? palette.accentSubtle : undefined
                                        }}
                                    >
                                        {skill.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3
                                                className={`${isApple ? "text-lg font-bold" : "text-xl font-black"}`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                {skill.name}
                                            </h3>
                                            <span
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{ color: palette.accent }}
                                            >
                                                {skill.level}%
                                            </span>
                                        </div>
                                        <div
                                            className={`w-full ${isApple ? "h-2" : "h-3"} rounded-full overflow-hidden`}
                                            style={{ background: palette.backgroundSecondary }}
                                        >
                                            <motion.div
                                                className={`h-full ${isApple ? "rounded-full" : "rounded-full"}`}
                                                style={{ background: palette.accent }}
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${skill.level}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: index * 0.1 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function ExperienceSection() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    return (
        <section
            className="py-20"
            style={{ background: palette.background }}
        >
            <div className="max-w-7xl mx-auto px-6">
                {isApple ? (
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold mb-12"
                        style={{ color: palette.textPrimary }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Experience
                    </motion.h2>
                ) : (
                    <OneUIHeader
                        title="Experience"
                        subtitle="Professional journey"
                    />
                )}

                <div className="space-y-8">
                    {experiences.map((exp, index) => (
                        <motion.div
                            key={exp.role}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                        >
                            <Card
                                className={isApple ? "p-8" : "p-10"}
                                intensity={isApple ? "medium" : undefined}
                                elevated={!isApple}
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                                    <div>
                                        <h3
                                            className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-2`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {exp.role}
                                        </h3>
                                        <p
                                            className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"}`}
                                            style={{ color: palette.accent }}
                                        >
                                            {exp.company}
                                        </p>
                                    </div>
                                    <span
                                        className={`${isApple ? "text-sm" : "text-base font-semibold"} mt-2 md:mt-0`}
                                        style={{ color: palette.textTertiary }}
                                    >
                                        {exp.period}
                                    </span>
                                </div>

                                <p
                                    className={`${isApple ? "text-base" : "text-lg font-medium"} mb-6`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    {exp.description}
                                </p>

                                <div className="space-y-3">
                                    <h4
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} uppercase tracking-wider`}
                                        style={{ color: palette.textTertiary }}
                                    >
                                        Key Achievements
                                    </h4>
                                    {exp.achievements.map((achievement, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full mt-2"
                                                style={{ background: palette.accent }}
                                            />
                                            <span
                                                className={isApple ? "text-sm" : "text-base font-medium"}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                {achievement}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
