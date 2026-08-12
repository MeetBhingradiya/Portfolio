/**
 * PortfolioShowcase — Client Component
 * Redesigned with Apple Liquid Glass & Samsung One UI 9 dual-theme support.
 * Uses react-bits components for premium interactivity.
 */

"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import SpotlightCard from "@Components/ReactBits/SpotlightCard/SpotlightCard";
import ShinyText from "@Components/ReactBits/ShinyText/ShinyText";
import GradientText from "@Components/ReactBits/GradientText/GradientText";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass/index";
import { OneUICard, OneUIBadge, OneUITabs } from "@Components/Atoms/OneUI/index";
import {
    Code,
    Work,
    School,
    OpenInNew,
    GitHub,
    ChevronRight,
    Rocket,
    TrendingUp,
    Terminal,
    ArrowForward
} from "@mui/icons-material";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface Project {
    ProjectID: string;
    Title: string;
    Slug?: string;
    Description?: string;
    Type?: string;
    TechStack?: string[];
    LiveURL?: string;
    GitHubURL?: string;
    Image?: string;
    Thumbnail?: string;
    Links?: {
        live?: string;
        github?: string;
        npm?: string;
        chromeWebstore?: string;
        playstore?: string;
        documentation?: string;
        demo?: string;
    };
    Featured?: boolean;
}

interface Skill {
    SkillID: string;
    Name: string;
    Category?: string;
    Level?: number;
    Proficiency?: number;
}

interface Experience {
    ExperienceID: string;
    Company: string;
    Role: string;
    StartDate?: string;
    EndDate?: string;
    Current?: boolean;
    CurrentlyWorking?: boolean;
    Description?: string;
}

interface PortfolioShowcaseProps {
    projects: Project[];
    skills: Skill[];
    experiences: Experience[];
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatPeriod(start?: string, end?: string, current?: boolean) {
    const fmt = (d?: string) =>
        d
            ? new Date(d).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric"
              })
            : "";
    return `${fmt(start)} – ${current ? "Present" : fmt(end)}`.replace(/^ – /, "");
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce(
        (acc, item) => {
            const k = String(item[key] ?? "Other");
            (acc[k] = acc[k] || []).push(item);
            return acc;
        },
        {} as Record<string, T[]>
    );
}

// --------------------------------------------------------------------------
// Animated Section Header
// --------------------------------------------------------------------------

function SectionHeader({
    title,
    subtitle,
    icon,
    palette,
    isApple,
    accentColor
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    palette: any;
    isApple: boolean;
    accentColor: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            className="flex flex-col gap-3 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1] }}
        >
            <div className="flex items-center gap-3">
                <motion.div
                    className={`flex items-center justify-center ${isApple ? "w-10 h-10 rounded-xl" : "w-12 h-12 rounded-2xl"}`}
                    style={{
                        background: `${accentColor}18`,
                        color: accentColor,
                        border: isApple ? `0.5px solid ${accentColor}30` : `1.5px solid ${accentColor}25`
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    {icon}
                </motion.div>
                <h2
                    className={isApple ? "text-3xl md:text-4xl font-bold tracking-tight" : "text-4xl md:text-5xl font-black tracking-tight"}
                    style={{ color: palette.textPrimary }}
                >
                    {title}
                </h2>
            </div>
            {subtitle && (
                <p
                    className={`${isApple ? "text-base font-normal" : "text-lg font-medium"} max-w-xl`}
                    style={{ color: palette.textSecondary }}
                >
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
}

// --------------------------------------------------------------------------
// Project Card — Dual Theme
// --------------------------------------------------------------------------

function ProjectCard({
    project,
    index,
    palette,
    isDark,
    isApple,
    accentColor
}: {
    project: Project;
    index: number;
    palette: any;
    isDark: boolean;
    isApple: boolean;
    accentColor: string;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const cardContent = (
        <div className="flex flex-col h-full relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                    <motion.span
                        className={`inline-block text-xs uppercase tracking-[0.15em] mb-2 ${isApple ? "font-medium" : "font-black"}`}
                        style={{ color: accentColor }}
                    >
                        {project.Type ?? "Project"}
                    </motion.span>
                    <h3
                        className={isApple ? "text-lg font-semibold leading-snug" : "text-xl font-bold leading-snug"}
                        style={{ color: palette.textPrimary }}
                    >
                        {project.Title}
                    </h3>
                </div>
                <div className="flex gap-2 shrink-0 mt-1">
                    {(project.GitHubURL || project.Links?.github) && (
                        <motion.a
                            href={project.GitHubURL || project.Links?.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GitHub style={{ color: palette.textTertiary, fontSize: 20 }} />
                        </motion.a>
                    )}
                    {(project.LiveURL || project.Links?.live) && (
                        <motion.a
                            href={project.LiveURL || project.Links?.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.2, rotate: -10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <OpenInNew style={{ color: accentColor, fontSize: 20 }} />
                        </motion.a>
                    )}
                </div>
            </div>

            {/* Description */}
            {project.Description && (
                <p
                    className="text-sm leading-relaxed line-clamp-3 mb-4 flex-grow"
                    style={{ color: palette.textSecondary }}
                >
                    {project.Description}
                </p>
            )}

            {/* Tech Stack */}
            {!!project.TechStack?.length && (
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.TechStack.slice(0, 5).map((t) => (
                        <motion.span
                            key={t}
                            className={`px-2.5 py-1 text-xs ${isApple ? "rounded-lg" : "rounded-full"}`}
                            style={{
                                background: isApple
                                    ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                                    : `${accentColor}12`,
                                color: isApple ? palette.textSecondary : accentColor,
                                border: isApple
                                    ? isDark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.06)"
                                    : `1px solid ${accentColor}20`,
                                fontWeight: isApple ? 500 : 700
                            }}
                            whileHover={{ scale: 1.05 }}
                        >
                            {t}
                        </motion.span>
                    ))}
                    {(project.TechStack.length ?? 0) > 5 && (
                        <span className="text-xs font-medium px-1" style={{ color: palette.textTertiary }}>
                            +{project.TechStack.length - 5}
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{
                duration: 0.6,
                delay: index * 0.08,
                ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1]
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-full"
        >
            {isApple ? (
                <LiquidGlassCard
                    className="h-full cursor-pointer"
                    intensity={project.Featured ? "strong" : "medium"}
                    enableTilt={true}
                    enableGlow={true}
                >
                    {cardContent}
                </LiquidGlassCard>
            ) : (
                <SpotlightCard
                    spotlightColor={isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"}
                    className={`h-full cursor-pointer p-7 ${
                        isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-black/[0.02] hover:bg-black/[0.04]"
                    }`}
                    style={{
                        border: isDark ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(0,0,0,0.05)",
                        borderRadius: "32px",
                        boxShadow: isDark
                            ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
                            : "0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
                        transition: "all 0.3s ease"
                    }}
                >
                    {cardContent}
                </SpotlightCard>
            )}
        </motion.div>
    );
}

// --------------------------------------------------------------------------
// Projects Section
// --------------------------------------------------------------------------

function ProjectsSection({
    projects,
    palette,
    isDark,
    isApple,
    accentColor
}: {
    projects: Project[];
    palette: any;
    isDark: boolean;
    isApple: boolean;
    accentColor: string;
}) {
    const [filter, setFilter] = useState<string>("All");
    const types = ["All", ...Array.from(new Set(projects.map((p) => p.Type ?? "Other")))];
    const shown = filter === "All" ? projects : projects.filter((p) => (p.Type ?? "Other") === filter);

    if (!projects.length) return null;

    return (
        <section className={`${isApple ? "py-20 md:py-28" : "py-24 md:py-32"} px-4 md:px-8 max-w-7xl mx-auto`}>
            <SectionHeader
                title="Projects"
                subtitle="Shipped products that solve real problems"
                icon={<Rocket />}
                palette={palette}
                isApple={isApple}
                accentColor={accentColor}
            />

            {/* Filter pills */}
            {isApple ? (
                <div className="flex flex-wrap gap-2 mb-10">
                    {types.map((t) => (
                        <motion.button
                            key={t}
                            onClick={() => setFilter(t)}
                            className="px-5 py-2 text-sm font-medium transition-all"
                            style={{
                                background: filter === t
                                    ? accentColor
                                    : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                color: filter === t ? "#fff" : palette.textSecondary,
                                border: filter === t
                                    ? "none"
                                    : isDark ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(0,0,0,0.08)",
                                borderRadius: "14px",
                                backdropFilter: filter !== t ? "blur(10px)" : "none"
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t}
                        </motion.button>
                    ))}
                </div>
            ) : (
                <div className="mb-10">
                    <OneUITabs
                        tabs={types.map((t) => ({ label: t, value: t }))}
                        activeTab={filter}
                        onChange={setFilter}
                    />
                </div>
            )}

            {/* Project Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={filter}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {shown.map((project, i) => (
                        <ProjectCard
                            key={project.ProjectID}
                            project={project}
                            index={i}
                            palette={palette}
                            isDark={isDark}
                            isApple={isApple}
                            accentColor={accentColor}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

            <motion.div
                className="mt-12 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                <motion.a
                    href="/projects"
                    className={`inline-flex items-center gap-2 ${isApple ? "text-sm font-medium" : "text-sm font-black uppercase tracking-wider"}`}
                    style={{ color: accentColor }}
                    whileHover={{ x: 4 }}
                >
                    View all projects <ArrowForward fontSize="small" />
                </motion.a>
            </motion.div>
        </section>
    );
}

// --------------------------------------------------------------------------
// Skills Section — Redesigned
// --------------------------------------------------------------------------

function SkillsSection({
    skills,
    palette,
    isDark,
    isApple,
    accentColor
}: {
    skills: Skill[];
    palette: any;
    isDark: boolean;
    isApple: boolean;
    accentColor: string;
}) {
    if (!skills.length) return null;
    const grouped = groupBy(skills, "Category");

    return (
        <section
            className={`${isApple ? "py-20 md:py-28" : "py-24 md:py-32"} px-4 md:px-8`}
            style={{
                background: isApple
                    ? isDark ? "rgba(18,18,20,0.5)" : "rgba(245,245,247,0.5)"
                    : isDark ? "rgba(18,18,22,0.6)" : "rgba(248,248,252,0.6)"
            }}
        >
            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="Tech Stack"
                    subtitle="Technologies I use to bring ideas to life"
                    icon={<Terminal />}
                    palette={palette}
                    isApple={isApple}
                    accentColor={accentColor}
                />

                <div className="space-y-10">
                    {Object.entries(grouped).map(([cat, catSkills], ci) => (
                        <motion.div
                            key={cat}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.5,
                                delay: ci * 0.1,
                                ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1]
                            }}
                        >
                            <h3
                                className={`text-xs uppercase tracking-[0.2em] mb-5 ${isApple ? "font-medium" : "font-black"}`}
                                style={{ color: palette.textTertiary }}
                            >
                                {cat}
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {catSkills.map((skill, si) => (
                                    <motion.div
                                        key={skill.SkillID}
                                        className="flex items-center gap-2 px-4 py-2.5"
                                        style={{
                                            background: isApple
                                                ? isDark ? "rgba(58,58,60,0.5)" : "rgba(255,255,255,0.6)"
                                                : isDark ? "rgba(38,38,42,0.8)" : "#fff",
                                            border: isApple
                                                ? isDark ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(255,255,255,0.7)"
                                                : isDark ? `1.5px solid rgba(255,255,255,0.06)` : `1.5px solid rgba(0,0,0,0.05)`,
                                            backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                                            WebkitBackdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                                            borderRadius: isApple ? "12px" : "24px",
                                            boxShadow: isApple
                                                ? isDark ? "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)" : "0 1px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)"
                                                : isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)"
                                        }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.4,
                                            delay: ci * 0.08 + si * 0.03,
                                            ease: isApple ? "easeOut" : [0.34, 1.56, 0.64, 1]
                                        }}
                                        whileHover={{
                                            scale: 1.08,
                                            y: -2,
                                            boxShadow: isDark
                                                ? `0 8px 24px ${accentColor}20`
                                                : `0 4px 16px ${accentColor}15`
                                        }}
                                    >
                                        <span
                                            className={isApple ? "text-sm font-medium" : "text-sm font-bold"}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {skill.Name}
                                        </span>
                                        {typeof (skill.Level ?? skill.Proficiency) === "number" && (
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: accentColor }}
                                            >
                                                {skill.Level ?? skill.Proficiency}%
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --------------------------------------------------------------------------
// Experience Section — Redesigned
// --------------------------------------------------------------------------

function ExperienceSection({
    experiences,
    palette,
    isDark,
    isApple,
    accentColor
}: {
    experiences: Experience[];
    palette: any;
    isDark: boolean;
    isApple: boolean;
    accentColor: string;
}) {
    if (!experiences.length) return null;

    return (
        <section className={`${isApple ? "py-20 md:py-28" : "py-24 md:py-32"} px-4 md:px-8 max-w-7xl mx-auto`}>
            <SectionHeader
                title="Experience"
                subtitle="Where I've made an impact"
                icon={<TrendingUp />}
                palette={palette}
                isApple={isApple}
                accentColor={accentColor}
            />

            <div className="flex flex-col gap-5">
                {experiences.map((exp, i) => {
                    const isCurrent = exp.CurrentlyWorking ?? exp.Current;

                    const cardContent = (
                        <div className="flex items-start justify-between flex-wrap gap-3 relative z-10">
                            <div className="flex-1">
                                {/* Timeline dot */}
                                <div className="flex items-center gap-3 mb-2">
                                    <motion.div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: isCurrent ? accentColor : palette.textTertiary,
                                            boxShadow: isCurrent ? `0 0 12px ${accentColor}50` : "none"
                                        }}
                                        animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <h3
                                        className={isApple ? "text-lg font-semibold" : "text-xl font-bold"}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        {exp.Role}
                                    </h3>
                                </div>
                                <p
                                    className={`${isApple ? "text-base font-medium" : "text-base font-bold"} ml-6`}
                                    style={{ color: accentColor }}
                                >
                                    {exp.Company}
                                </p>
                            </div>
                            <div>
                                {isApple ? (
                                    <span
                                        className="text-sm font-medium px-4 py-1.5"
                                        style={{
                                            background: isCurrent ? `${accentColor}15` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                            color: isCurrent ? accentColor : palette.textTertiary,
                                            borderRadius: "10px",
                                            border: isDark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.06)"
                                        }}
                                    >
                                        {formatPeriod(exp.StartDate, exp.EndDate, isCurrent)}
                                    </span>
                                ) : (
                                    <OneUIBadge variant={isCurrent ? "accent" : "neutral"}>
                                        {formatPeriod(exp.StartDate, exp.EndDate, isCurrent)}
                                    </OneUIBadge>
                                )}
                            </div>
                        </div>
                    );

                    const description = exp.Description && (
                        <p
                            className="text-sm leading-relaxed mt-3 ml-6 line-clamp-2 relative z-10"
                            style={{ color: palette.textSecondary }}
                        >
                            {exp.Description}
                        </p>
                    );

                    return (
                        <motion.div
                            key={exp.ExperienceID}
                            initial={{ opacity: 0, y: 30, x: -10 }}
                            whileInView={{ opacity: 1, y: 0, x: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.1,
                                ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1]
                            }}
                        >
                            {isApple ? (
                                <LiquidGlassCard intensity="subtle" enableTilt={false} enableGlow={true}>
                                    {cardContent}
                                    {description}
                                </LiquidGlassCard>
                            ) : (
                                <SpotlightCard
                                    spotlightColor={isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"}
                                    className={`p-7 md:p-8 ${isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}`}
                                    style={{
                                        border: isDark ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(0,0,0,0.05)",
                                        borderRadius: "32px",
                                        boxShadow: isDark
                                            ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
                                            : "0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)"
                                    }}
                                >
                                    {cardContent}
                                    {description}
                                </SpotlightCard>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                className="mt-12 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                <motion.a
                    href="/timeline"
                    className={`inline-flex items-center gap-2 ${isApple ? "text-sm font-medium" : "text-sm font-black uppercase tracking-wider"}`}
                    style={{ color: accentColor }}
                    whileHover={{ x: 4 }}
                >
                    Full timeline <ArrowForward fontSize="small" />
                </motion.a>
            </motion.div>
        </section>
    );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function PortfolioShowcase({ projects, skills, experiences }: PortfolioShowcaseProps) {
    const { palette, actualColorMode, designTheme, accentColor } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    if (!projects.length && !skills.length && !experiences.length) return null;

    return (
        <>
            <ProjectsSection
                projects={projects}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                accentColor={accentColor}
            />
            <SkillsSection
                skills={skills}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                accentColor={accentColor}
            />
            <ExperienceSection
                experiences={experiences}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                accentColor={accentColor}
            />
        </>
    );
}
