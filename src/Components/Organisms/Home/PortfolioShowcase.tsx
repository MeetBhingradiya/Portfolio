/**
 * PortfolioShowcase — Client Component
 * Receives pre-fetched, ISR-cached data from the server page.
 * Displays Projects, Skills and Experience sections.
 */

"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Code, Work, School, OpenInNew, GitHub, ChevronRight } from "@mui/icons-material";

// --------------------------------------------------------------------------
// Types (mirror Portfolio model shapes — only fields we select)
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
// Sub-components
// --------------------------------------------------------------------------

function SectionHeader({
    title,
    subtitle,
    icon,
    palette,
    isApple
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    palette: any;
    isApple: boolean;
}) {
    return (
        <motion.div
            className="flex flex-col gap-2 mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3">
                <span style={{ color: palette.accent }}>{icon}</span>
                <h2
                    className={isApple ? "text-3xl font-bold" : "text-4xl font-black"}
                    style={{ color: palette.textPrimary }}>
                    {title}
                </h2>
            </div>
            {subtitle && (
                <p
                    className={isApple ? "text-base" : "text-lg font-medium"}
                    style={{ color: palette.textSecondary }}>
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
}

// --------------------------------------------------------------------------
// Projects Section
// --------------------------------------------------------------------------

function ProjectsSection({ projects, palette, isDark, isApple }: { projects: Project[]; palette: any; isDark: boolean; isApple: boolean }) {
    const [filter, setFilter] = useState<string>("All");
    const types = ["All", ...Array.from(new Set(projects.map((p) => p.Type ?? "Other")))];
    const shown = filter === "All" ? projects : projects.filter((p) => (p.Type ?? "Other") === filter);

    const cardBase: React.CSSProperties = {
        background: isApple
            ? isDark
                ? "linear-gradient(180deg,rgba(58,58,60,0.6) 0%,rgba(44,44,46,0.55) 100%)"
                : "linear-gradient(180deg,rgba(255,255,255,0.65) 0%,rgba(250,250,250,0.6) 100%)"
            : isDark
              ? "rgba(28,28,32,0.95)"
              : "#fff",
        border: isApple
            ? isDark
                ? "0.5px solid rgba(255,255,255,0.12)"
                : "0.5px solid rgba(255,255,255,0.8)"
            : `1px solid ${palette.border}`,
        borderRadius: isApple ? "20px" : "24px",
        backdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        boxShadow: isApple ? (isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)") : "none",
        overflow: "hidden",
        position: "relative"
    };

    if (!projects.length) return null;

    return (
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <SectionHeader
                title="Projects"
                subtitle="A selection of things I've shipped"
                icon={<Code />}
                palette={palette}
                isApple={isApple}
            />

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mb-8">
                {types.map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                            background: filter === t ? palette.accent : "transparent",
                            color: filter === t ? "#fff" : palette.textSecondary,
                            border: `1px solid ${filter === t ? palette.accent : palette.border}`
                        }}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shown.map((project, i) => (
                    <motion.div
                        key={project.ProjectID}
                        style={cardBase}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: i * 0.06 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="flex flex-col p-6 gap-4">
                        {/* Apple glass sheen */}
                        {isApple && (
                            <div
                                className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
                                style={{
                                    background: isDark
                                        ? "linear-gradient(180deg,rgba(255,255,255,0.06) 0%,transparent 100%)"
                                        : "linear-gradient(180deg,rgba(255,255,255,0.7) 0%,transparent 100%)",
                                    borderRadius: "20px 20px 0 0"
                                }}
                            />
                        )}

                        <div className="flex items-start justify-between gap-2 relative z-10">
                            <div>
                                <span
                                    className="text-xs font-bold uppercase tracking-widest"
                                    style={{ color: palette.accent }}>
                                    {project.Type ?? "Project"}
                                </span>
                                <h3
                                    className={isApple ? "text-lg font-semibold mt-1" : "text-xl font-bold mt-1"}
                                    style={{ color: palette.textPrimary }}>
                                    {project.Title}
                                </h3>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                {(project.GitHubURL || project.Links?.github) && (
                                    <a
                                        href={project.GitHubURL || project.Links?.github}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        <GitHub
                                            style={{
                                                color: palette.textTertiary,
                                                fontSize: 20
                                            }}
                                        />
                                    </a>
                                )}
                                {(project.LiveURL || project.Links?.live) && (
                                    <a
                                        href={project.LiveURL || project.Links?.live}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        <OpenInNew
                                            style={{
                                                color: palette.accent,
                                                fontSize: 20
                                            }}
                                        />
                                    </a>
                                )}
                            </div>
                        </div>

                        {project.Description && (
                            <p
                                className="text-sm leading-relaxed line-clamp-3 relative z-10"
                                style={{ color: palette.textSecondary }}>
                                {project.Description}
                            </p>
                        )}

                        {!!project.TechStack?.length && (
                            <div className="flex flex-wrap gap-1.5 relative z-10 mt-auto">
                                {project.TechStack.slice(0, 5).map((t) => (
                                    <span
                                        key={t}
                                        className="px-2 py-0.5 rounded-full text-xs"
                                        style={{
                                            background: `${palette.accent}18`,
                                            color: palette.accent,
                                            border: `0.5px solid ${palette.accent}30`
                                        }}>
                                        {t}
                                    </span>
                                ))}
                                {(project.TechStack.length ?? 0) > 5 && (
                                    <span
                                        className="text-xs"
                                        style={{ color: palette.textTertiary }}>
                                        +{project.TechStack.length - 5}
                                    </span>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="mt-10 text-center">
                <a
                    href="/projects"
                    className="inline-flex items-center gap-1 text-sm font-semibold"
                    style={{ color: palette.accent }}>
                    View all projects <ChevronRight fontSize="small" />
                </a>
            </div>
        </section>
    );
}

// --------------------------------------------------------------------------
// Skills Section
// --------------------------------------------------------------------------

function SkillsSection({ skills, palette, isDark, isApple }: { skills: Skill[]; palette: any; isDark: boolean; isApple: boolean }) {
    if (!skills.length) return null;
    const grouped = groupBy(skills, "Category");

    return (
        <section
            className="py-20 px-4 md:px-8"
            style={{
                background: isApple
                    ? isDark
                        ? "rgba(18,18,20,0.5)"
                        : "rgba(245,245,247,0.5)"
                    : isDark
                      ? "rgba(18,18,22,0.6)"
                      : "rgba(248,248,252,0.6)"
            }}>
            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="Skills"
                    subtitle="Technologies I work with"
                    icon={<Code />}
                    palette={palette}
                    isApple={isApple}
                />

                <div className="space-y-8">
                    {Object.entries(grouped).map(([cat, catSkills], ci) => (
                        <motion.div
                            key={cat}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: ci * 0.08 }}>
                            <h3
                                className="text-xs font-black uppercase tracking-[0.15em] mb-4"
                                style={{ color: palette.textTertiary }}>
                                {cat}
                            </h3>
                            <div className="flex flex-wrap gap-2.5">
                                {catSkills.map((skill, si) => (
                                    <motion.div
                                        key={skill.SkillID}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                                        style={{
                                            background: isApple
                                                ? isDark
                                                    ? "rgba(58,58,60,0.55)"
                                                    : "rgba(255,255,255,0.65)"
                                                : isDark
                                                  ? "rgba(38,38,42,0.9)"
                                                  : "#fff",
                                            border: isApple
                                                ? isDark
                                                    ? "0.5px solid rgba(255,255,255,0.12)"
                                                    : "0.5px solid rgba(255,255,255,0.8)"
                                                : `1px solid ${palette.border}`,
                                            backdropFilter: isApple ? "blur(20px)" : "none",
                                            WebkitBackdropFilter: isApple ? "blur(20px)" : "none"
                                        }}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.3,
                                            delay: ci * 0.08 + si * 0.03
                                        }}
                                        whileHover={{ scale: 1.05 }}>
                                        <span
                                            className={isApple ? "text-sm font-medium" : "text-sm font-bold"}
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {skill.Name}
                                        </span>
                                        {typeof (skill.Level ?? skill.Proficiency) === "number" && (
                                            <span
                                                className="text-xs"
                                                style={{
                                                    color: palette.accent
                                                }}>
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
// Experience Section
// --------------------------------------------------------------------------

function ExperienceSection({
    experiences,
    palette,
    isDark,
    isApple
}: {
    experiences: Experience[];
    palette: any;
    isDark: boolean;
    isApple: boolean;
}) {
    if (!experiences.length) return null;

    const cardBase: React.CSSProperties = {
        background: isApple
            ? isDark
                ? "linear-gradient(180deg,rgba(58,58,60,0.6) 0%,rgba(44,44,46,0.55) 100%)"
                : "linear-gradient(180deg,rgba(255,255,255,0.65) 0%,rgba(250,250,250,0.6) 100%)"
            : isDark
              ? "rgba(28,28,32,0.95)"
              : "#fff",
        border: isApple
            ? isDark
                ? "0.5px solid rgba(255,255,255,0.12)"
                : "0.5px solid rgba(255,255,255,0.8)"
            : `1px solid ${palette.border}`,
        borderRadius: isApple ? "20px" : "24px",
        backdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        boxShadow: isApple ? (isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)") : "none",
        position: "relative",
        overflow: "hidden"
    };

    return (
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <SectionHeader
                title="Experience"
                subtitle="Where I've worked"
                icon={<Work />}
                palette={palette}
                isApple={isApple}
            />

            <div className="flex flex-col gap-5">
                {experiences.map((exp, i) => (
                    <motion.div
                        key={exp.ExperienceID}
                        style={cardBase}
                        className="p-6 md:p-8"
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}>
                        {isApple && (
                            <div
                                className="absolute inset-x-0 top-0 h-1/4 pointer-events-none"
                                style={{
                                    background: isDark
                                        ? "linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 100%)"
                                        : "linear-gradient(180deg,rgba(255,255,255,0.6) 0%,transparent 100%)"
                                }}
                            />
                        )}
                        <div className="flex items-start justify-between flex-wrap gap-3 relative z-10">
                            <div>
                                <h3
                                    className={isApple ? "text-lg font-semibold" : "text-xl font-bold"}
                                    style={{ color: palette.textPrimary }}>
                                    {exp.Role}
                                </h3>
                                <p
                                    className={isApple ? "text-base font-medium mt-0.5" : "text-base font-bold mt-0.5"}
                                    style={{ color: palette.accent }}>
                                    {exp.Company}
                                </p>
                            </div>
                            <span
                                className="text-sm font-semibold px-3 py-1 rounded-full"
                                style={{
                                    background: (exp.CurrentlyWorking ?? exp.Current) ? `${palette.accent}20` : `${palette.textTertiary}15`,
                                    color: (exp.CurrentlyWorking ?? exp.Current) ? palette.accent : palette.textTertiary
                                }}>
                                {formatPeriod(exp.StartDate, exp.EndDate, exp.CurrentlyWorking ?? exp.Current)}
                            </span>
                        </div>
                        {exp.Description && (
                            <p
                                className="text-sm leading-relaxed mt-3 line-clamp-2 relative z-10"
                                style={{ color: palette.textSecondary }}>
                                {exp.Description}
                            </p>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="mt-10 text-center">
                <a
                    href="/timeline"
                    className="inline-flex items-center gap-1 text-sm font-semibold"
                    style={{ color: palette.accent }}>
                    Full timeline <ChevronRight fontSize="small" />
                </a>
            </div>
        </section>
    );
}

// --------------------------------------------------------------------------
// Main exported component
// --------------------------------------------------------------------------

export default function PortfolioShowcase({ projects, skills, experiences }: PortfolioShowcaseProps) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    // If DB is empty (freshly deployed, no content yet) — gracefully skip
    if (!projects.length && !skills.length && !experiences.length) return null;

    return (
        <>
            <ProjectsSection
                projects={projects}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
            />
            <SkillsSection
                skills={skills}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
            />
            <ExperienceSection
                experiences={experiences}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
            />
        </>
    );
}
