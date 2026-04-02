/**
 * ProjectsGallery — Client Component
 * Interactive gallery with type-based filtering/searching and
 * dedicated card layouts per project type.
 */

"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Search,
    OpenInNew,
    GitHub,
    Terminal,
    Star,
    Download,
    Extension,
    Android,
    Web,
    Code,
    Storage,
    Launch,
    ContentCopy,
    Check,
    FilterList,
    Circle
} from "@mui/icons-material";

// ─────────────────────────── Types ───────────────────────────

type ProjectType = "website" | "webapp" | "chrome_extension" | "npm_package" | "playstore_app" | "github_repo" | "other";

interface Project {
    ProjectID: string;
    Title: string;
    Slug: string;
    Description: string;
    LongDescription?: string;
    Type: ProjectType;
    Status: "active" | "archived" | "wip";
    Featured: boolean;
    Links: {
        live?: string;
        github?: string;
        npm?: string;
        chromeWebstore?: string;
        playstore?: string;
        documentation?: string;
        demo?: string;
    };
    TechStack: string[];
    Category?: string;
    Tags: string[];
    Stats: {
        githubStars?: number;
        npmDownloads?: number;
        chromeInstalls?: number;
        playstoreInstalls?: number;
        playstoreRating?: number;
    };
    Thumbnail?: string;
    Screenshots: string[];
    StartDate?: string;
    EndDate?: string;
    Order: number;
}

// ─────────────────────────── Helpers ───────────────────────────

const TYPE_META: Record<ProjectType, { label: string; icon: React.ReactNode; color: string }> = {
    website: {
        label: "Website",
        icon: <Web fontSize="small" />,
        color: "#0A84FF"
    },
    webapp: {
        label: "Web App",
        icon: <Storage fontSize="small" />,
        color: "#30D158"
    },
    chrome_extension: {
        label: "Chrome Extension",
        icon: <Extension fontSize="small" />,
        color: "#BF5AF2"
    },
    npm_package: {
        label: "npm Package",
        icon: <Terminal fontSize="small" />,
        color: "#CB3837"
    },
    playstore_app: {
        label: "Play Store App",
        icon: <Android fontSize="small" />,
        color: "#3DDC84"
    },
    github_repo: {
        label: "GitHub Repo",
        icon: <Code fontSize="small" />,
        color: "#E8EAF6"
    },
    other: {
        label: "Other",
        icon: <Launch fontSize="small" />,
        color: "#FF9500"
    }
};

const STATUS_COLOR: Record<string, string> = {
    active: "#30D158",
    wip: "#FF9F0A",
    archived: "#8E8E93"
};

function fmt(n?: number) {
    if (!n) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const { palette } = useDesignTheme();
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (
        <button
            onClick={copy}
            title="Copy"
            style={{ color: palette.textTertiary }}>
            {copied ? <Check style={{ fontSize: 14, color: "#30D158" }} /> : <ContentCopy style={{ fontSize: 14 }} />}
        </button>
    );
}

// ─────────────────────────── Card Layouts ───────────────────────────

interface CardProps {
    project: Project;
    palette: any;
    isDark: boolean;
    isApple: boolean;
}

/* ── Website ─ browser-frame card ─────────────────────────────── */
function WebsiteCard({ project, palette, isDark, isApple }: CardProps) {
    const glass = useGlass(isDark, isApple);
    return (
        <div
            style={glass}
            className="overflow-hidden">
            {/* Browser chrome bar */}
            <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                }}>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <div
                    className="flex-1 mx-3 px-3 py-1 rounded text-xs truncate"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                        color: palette.textTertiary
                    }}>
                    {project.Links.live?.replace(/https?:\/\//, "") ?? project.Slug}
                </div>
                {project.Links.live && (
                    <a
                        href={project.Links.live}
                        target="_blank"
                        rel="noopener noreferrer">
                        <OpenInNew style={{ fontSize: 14, color: "#0A84FF" }} />
                    </a>
                )}
            </div>
            {/* Body */}
            <CardBody
                project={project}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                typeColor="#0A84FF"
                primaryAction={
                    project.Links.live
                        ? {
                              href: project.Links.live,
                              label: "Visit Site",
                              icon: <OpenInNew fontSize="small" />
                          }
                        : undefined
                }
                secondaryAction={
                    project.Links.github
                        ? {
                              href: project.Links.github,
                              label: "Code",
                              icon: <GitHub fontSize="small" />
                          }
                        : undefined
                }
            />
        </div>
    );
}

/* ── Web App ── dashboard tile card ───────────────────────────── */
function WebAppCard({ project, palette, isDark, isApple }: CardProps) {
    const glass = useGlass(isDark, isApple);
    return (
        <div
            style={glass}
            className="overflow-hidden">
            {/* Top stripe */}
            <div
                className="h-1.5 w-full"
                style={{ background: "linear-gradient(90deg,#30D158,#0A84FF)" }}
            />
            <CardBody
                project={project}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                typeColor="#30D158"
                primaryAction={
                    project.Links.live
                        ? {
                              href: project.Links.live,
                              label: "Open App",
                              icon: <Launch fontSize="small" />
                          }
                        : undefined
                }
                secondaryAction={
                    project.Links.github
                        ? {
                              href: project.Links.github,
                              label: "Source",
                              icon: <GitHub fontSize="small" />
                          }
                        : undefined
                }
            />
        </div>
    );
}

/* ── Chrome Extension ─ purple themed card ────────────────────── */
function ChromeExtensionCard({ project, palette, isDark, isApple }: CardProps) {
    const glass = useGlass(isDark, isApple, "#BF5AF2");
    return (
        <div
            style={glass}
            className="overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center gap-3 p-4 border-b"
                style={{
                    borderColor: isDark ? "rgba(191,90,242,0.2)" : "rgba(191,90,242,0.15)"
                }}>
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg,#BF5AF2,#7C3AED)"
                    }}>
                    <Extension style={{ fontSize: 20, color: "#fff" }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "#BF5AF2" }}>
                        Chrome Extension
                    </p>
                    <p
                        className="font-semibold truncate text-sm"
                        style={{ color: palette.textPrimary }}>
                        {project.Title}
                    </p>
                </div>
                {project.Stats.chromeInstalls != null && (
                    <div className="text-right shrink-0">
                        <p
                            className="text-base font-bold"
                            style={{ color: "#BF5AF2" }}>
                            {fmt(project.Stats.chromeInstalls)}
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: palette.textTertiary }}>
                            installs
                        </p>
                    </div>
                )}
            </div>
            <CardBody
                project={project}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                typeColor="#BF5AF2"
                primaryAction={
                    project.Links.chromeWebstore
                        ? {
                              href: project.Links.chromeWebstore,
                              label: "Add to Chrome",
                              icon: <Extension fontSize="small" />
                          }
                        : undefined
                }
                secondaryAction={
                    project.Links.github
                        ? {
                              href: project.Links.github,
                              label: "Source",
                              icon: <GitHub fontSize="small" />
                          }
                        : undefined
                }
            />
        </div>
    );
}

/* ── npm Package ─ terminal-style card ───────────────────────── */
function NpmCard({ project, palette, isDark, isApple }: CardProps) {
    const glass = useGlass(isDark, isApple, "#CB3837");
    const installCmd = `npm install ${project.Slug}`;
    return (
        <div
            style={glass}
            className="overflow-hidden">
            {/* npm header */}
            <div
                className="flex items-center gap-2 px-4 py-3"
                style={{
                    background: isDark ? "rgba(203,56,55,0.15)" : "rgba(203,56,55,0.08)"
                }}>
                <Terminal style={{ fontSize: 18, color: "#CB3837" }} />
                <span
                    className="text-xs font-black uppercase tracking-widest"
                    style={{ color: "#CB3837" }}>
                    npm
                </span>
                {project.Stats.npmDownloads != null && (
                    <>
                        <span
                            className="ml-auto text-xs font-bold"
                            style={{ color: palette.textTertiary }}>
                            <Download style={{ fontSize: 12 }} /> {fmt(project.Stats.npmDownloads)}
                        </span>
                    </>
                )}
            </div>
            {/* Install command */}
            <div
                className="px-4 py-2.5 flex items-center gap-2 font-mono text-xs border-b"
                style={{
                    background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    color: "#30D158"
                }}>
                <span
                    className="select-none"
                    style={{ color: palette.textTertiary }}>
                    $
                </span>
                <span className="flex-1">{installCmd}</span>
                <CopyButton text={installCmd} />
            </div>
            <CardBody
                project={project}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                typeColor="#CB3837"
                primaryAction={
                    project.Links.npm
                        ? {
                              href: project.Links.npm,
                              label: "npm page",
                              icon: <OpenInNew fontSize="small" />
                          }
                        : undefined
                }
                secondaryAction={
                    project.Links.github
                        ? {
                              href: project.Links.github,
                              label: "Source",
                              icon: <GitHub fontSize="small" />
                          }
                        : undefined
                }
            />
        </div>
    );
}

/* ── Play Store App ─ Android-themed card ────────────────────── */
function PlayStoreCard({ project, palette, isDark, isApple }: CardProps) {
    const glass = useGlass(isDark, isApple, "#3DDC84");
    const rating = project.Stats.playstoreRating;
    return (
        <div
            style={glass}
            className="overflow-hidden">
            {/* Android header */}
            <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{
                    background: isDark ? "rgba(61,220,132,0.1)" : "rgba(61,220,132,0.07)",
                    borderColor: isDark ? "rgba(61,220,132,0.2)" : "rgba(61,220,132,0.12)"
                }}>
                <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg,#3DDC84,#00BFA5)"
                    }}>
                    <Android style={{ fontSize: 22, color: "#fff" }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "#3DDC84" }}>
                        Play Store
                    </p>
                    <p
                        className="text-sm font-semibold truncate"
                        style={{ color: palette.textPrimary }}>
                        {project.Title}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    {rating != null && (
                        <div className="flex items-center gap-0.5 justify-end">
                            <Star style={{ fontSize: 14, color: "#FF9F0A" }} />
                            <span
                                className="text-sm font-bold"
                                style={{ color: palette.textPrimary }}>
                                {rating.toFixed(1)}
                            </span>
                        </div>
                    )}
                    {project.Stats.playstoreInstalls != null && (
                        <p
                            className="text-xs"
                            style={{ color: palette.textTertiary }}>
                            {fmt(project.Stats.playstoreInstalls)}+ installs
                        </p>
                    )}
                </div>
            </div>
            <CardBody
                project={project}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                typeColor="#3DDC84"
                primaryAction={
                    project.Links.playstore
                        ? {
                              href: project.Links.playstore,
                              label: "Get it on Play Store",
                              icon: <Android fontSize="small" />
                          }
                        : undefined
                }
                secondaryAction={
                    project.Links.github
                        ? {
                              href: project.Links.github,
                              label: "Source",
                              icon: <GitHub fontSize="small" />
                          }
                        : undefined
                }
            />
        </div>
    );
}

/* ── GitHub Repo ─ GH-card style ─────────────────────────────── */
function GitHubRepoCard({ project, palette, isDark, isApple }: CardProps) {
    const glass = useGlass(isDark, isApple);
    return (
        <div
            style={glass}
            className="overflow-hidden">
            {/* Repo label row */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <GitHub style={{ fontSize: 18, color: palette.textTertiary }} />
                <span
                    className="text-xs font-medium truncate"
                    style={{ color: palette.textTertiary }}>
                    MeetBhingradiya / {project.Slug}
                </span>
            </div>
            <CardBody
                project={project}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                typeColor="#E8EAF6"
                showStars={project.Stats.githubStars}
                primaryAction={
                    project.Links.github
                        ? {
                              href: project.Links.github,
                              label: "View Repo",
                              icon: <GitHub fontSize="small" />
                          }
                        : undefined
                }
                secondaryAction={
                    project.Links.documentation
                        ? {
                              href: project.Links.documentation,
                              label: "Docs",
                              icon: <OpenInNew fontSize="small" />
                          }
                        : undefined
                }
            />
        </div>
    );
}

/* ── Other ─ default clean card ──────────────────────────────── */
function OtherCard({ project, palette, isDark, isApple }: CardProps) {
    const glass = useGlass(isDark, isApple);
    return (
        <div
            style={glass}
            className="overflow-hidden">
            <CardBody
                project={project}
                palette={palette}
                isDark={isDark}
                isApple={isApple}
                typeColor="#FF9500"
                primaryAction={
                    project.Links.live
                        ? {
                              href: project.Links.live,
                              label: "Open",
                              icon: <Launch fontSize="small" />
                          }
                        : undefined
                }
                secondaryAction={
                    project.Links.github
                        ? {
                              href: project.Links.github,
                              label: "Source",
                              icon: <GitHub fontSize="small" />
                          }
                        : undefined
                }
            />
        </div>
    );
}

// ─────────────────────────── Shared Card Body ───────────────────────────

interface CardBodyProps extends CardProps {
    typeColor: string;
    primaryAction?: { href: string; label: string; icon: React.ReactNode };
    secondaryAction?: { href: string; label: string; icon: React.ReactNode };
    showStars?: number;
}

function CardBody({ project, palette, isDark, isApple, typeColor, primaryAction, secondaryAction, showStars }: CardBodyProps) {
    return (
        <div className="p-4 flex flex-col gap-3 relative z-10">
            {/* Apple glass sheen */}
            {isApple && (
                <div
                    className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
                    style={{
                        background: isDark
                            ? "linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 100%)"
                            : "linear-gradient(180deg,rgba(255,255,255,0.6) 0%,transparent 100%)"
                    }}
                />
            )}

            {/* Status dot */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Circle
                        style={{
                            fontSize: 8,
                            color: STATUS_COLOR[project.Status] ?? "#8E8E93"
                        }}
                    />
                    <span
                        className="text-xs capitalize"
                        style={{ color: palette.textTertiary }}>
                        {project.Status === "wip" ? "In Progress" : project.Status}
                    </span>
                </div>
                {project.Featured && (
                    <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{
                            background: `${typeColor}20`,
                            color: typeColor,
                            border: `0.5px solid ${typeColor}40`
                        }}>
                        Featured
                    </span>
                )}
            </div>

            {/* Title */}
            <h3
                className={isApple ? "text-base font-semibold leading-snug" : "text-lg font-bold leading-snug"}
                style={{ color: palette.textPrimary }}>
                {project.Title}
            </h3>

            {/* Description */}
            <p
                className="text-sm leading-relaxed line-clamp-2"
                style={{ color: palette.textSecondary }}>
                {project.Description}
            </p>

            {/* Stars row (GitHub) */}
            {showStars != null && (
                <div
                    className="flex items-center gap-1"
                    style={{ color: palette.textTertiary }}>
                    <Star style={{ fontSize: 14, color: "#FF9F0A" }} />
                    <span className="text-xs">{fmt(showStars)} stars</span>
                </div>
            )}

            {/* Tech stack */}
            {project.TechStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {project.TechStack.slice(0, 4).map((t) => (
                        <span
                            key={t}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                                background: `${typeColor}14`,
                                color: typeColor,
                                border: `0.5px solid ${typeColor}28`
                            }}>
                            {t}
                        </span>
                    ))}
                    {project.TechStack.length > 4 && (
                        <span
                            className="text-xs px-1"
                            style={{ color: palette.textTertiary }}>
                            +{project.TechStack.length - 4}
                        </span>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-1 flex-wrap">
                {primaryAction && (
                    <a
                        href={primaryAction.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: typeColor, color: "#fff" }}>
                        {primaryAction.icon}
                        {primaryAction.label}
                    </a>
                )}
                {secondaryAction && (
                    <a
                        href={secondaryAction.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                        style={{
                            background: "transparent",
                            color: palette.textSecondary,
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"}`
                        }}>
                        {secondaryAction.icon}
                        {secondaryAction.label}
                    </a>
                )}
                <Link
                    href={`/projects/${project.Slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 ml-auto"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                        color: palette.textTertiary
                    }}>
                    Details →
                </Link>
            </div>
        </div>
    );
}

// ─────────────────────────── Glass style hook ───────────────────────────

function useGlass(isDark: boolean, isApple: boolean, _accentColor?: string): React.CSSProperties {
    return {
        background: isApple
            ? isDark
                ? "linear-gradient(180deg,rgba(58,58,60,0.6) 0%,rgba(44,44,46,0.55) 100%)"
                : "linear-gradient(180deg,rgba(255,255,255,0.65) 0%,rgba(250,250,250,0.6) 100%)"
            : isDark
              ? "rgba(26,26,30,0.95)"
              : "#fff",
        border: isApple
            ? isDark
                ? "0.5px solid rgba(255,255,255,0.12)"
                : "0.5px solid rgba(255,255,255,0.8)"
            : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: isApple ? "20px" : "24px",
        backdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        boxShadow: isApple ? (isDark ? "0 4px 24px rgba(0,0,0,0.35)" : "0 2px 20px rgba(0,0,0,0.09)") : "none",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
    };
}

// ─────────────────────────── Card Router ───────────────────────────

function ProjectCard({ project, palette, isDark, isApple }: CardProps) {
    const variants = {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0 }
    };
    return (
        <motion.div
            variants={variants}
            transition={{ duration: 0.4 }}
            whileHover={{
                y: isApple ? -5 : -3,
                transition: { duration: 0.2 }
            }}>
            {project.Type === "website" && (
                <WebsiteCard
                    project={project}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                />
            )}
            {project.Type === "webapp" && (
                <WebAppCard
                    project={project}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                />
            )}
            {project.Type === "chrome_extension" && (
                <ChromeExtensionCard
                    project={project}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                />
            )}
            {project.Type === "npm_package" && (
                <NpmCard
                    project={project}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                />
            )}
            {project.Type === "playstore_app" && (
                <PlayStoreCard
                    project={project}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                />
            )}
            {project.Type === "github_repo" && (
                <GitHubRepoCard
                    project={project}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                />
            )}
            {(project.Type === "other" || !project.Type) && (
                <OtherCard
                    project={project}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                />
            )}
        </motion.div>
    );
}

// ─────────────────────────── Main Component ───────────────────────────

const TYPE_FILTERS: ProjectType[] = ["website", "webapp", "chrome_extension", "npm_package", "playstore_app", "github_repo", "other"];

export default function ProjectsGallery({ projects }: { projects: Project[] }) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [search, setSearch] = useState("");
    const [activeTypes, setActiveTypes] = useState<Set<ProjectType>>(new Set());
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "wip" | "archived">("all");

    const availableTypes = useMemo(() => TYPE_FILTERS.filter((t) => projects.some((p) => p.Type === t)), [projects]);

    const toggleType = (t: ProjectType) => {
        setActiveTypes((prev) => {
            const next = new Set(prev);
            next.has(t) ? next.delete(t) : next.add(t);
            return next;
        });
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return projects.filter((p) => {
            if (activeTypes.size > 0 && !activeTypes.has(p.Type)) return false;
            if (statusFilter !== "all" && p.Status !== statusFilter) return false;
            if (q) {
                return (
                    p.Title.toLowerCase().includes(q) ||
                    p.Description.toLowerCase().includes(q) ||
                    (p.TechStack ?? []).some((t) => t.toLowerCase().includes(q)) ||
                    (p.Tags ?? []).some((t) => t.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [projects, search, activeTypes, statusFilter]);

    const featured = filtered.filter((p) => p.Featured);
    const regular = filtered.filter((p) => !p.Featured);

    const cardBg: React.CSSProperties = {
        background: isApple
            ? isDark
                ? "rgba(28,28,32,0.7)"
                : "rgba(255,255,255,0.7)"
            : isDark
              ? "rgba(24,24,28,0.95)"
              : "rgba(255,255,255,0.95)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: isApple ? "20px" : "28px",
        backdropFilter: isApple ? "blur(30px) saturate(180%)" : "none",
        WebkitBackdropFilter: isApple ? "blur(30px) saturate(180%)" : "none"
    };

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Page Header */}
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}>
                    <h1
                        className={isApple ? "text-4xl md:text-5xl font-bold mb-3" : "text-5xl md:text-6xl font-black mb-3"}
                        style={{ color: palette.textPrimary }}>
                        Projects
                    </h1>
                    <p
                        className={isApple ? "text-lg" : "text-xl font-medium"}
                        style={{ color: palette.textSecondary }}>
                        {projects.length} project
                        {projects.length !== 1 ? "s" : ""} spanning websites, apps, packages and extensions.
                    </p>
                </motion.div>

                {/* Controls */}
                <motion.div
                    className="mb-10 flex flex-col gap-4"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}>
                    {/* Search */}
                    <div
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ ...cardBg }}>
                        <Search style={{ color: palette.textTertiary }} />
                        <input
                            type="text"
                            placeholder="Search by title, tech stack, tags…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: palette.textPrimary }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                style={{
                                    color: palette.textTertiary,
                                    fontSize: 12
                                }}>
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Type filters */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <FilterList
                            style={{
                                color: palette.textTertiary,
                                fontSize: 18
                            }}
                        />
                        {availableTypes.map((t) => {
                            const meta = TYPE_META[t];
                            const active = activeTypes.has(t);
                            return (
                                <button
                                    key={t}
                                    onClick={() => toggleType(t)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                    style={{
                                        background: active ? meta.color : "transparent",
                                        color: active ? "#fff" : palette.textSecondary,
                                        border: `1px solid ${active ? meta.color : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`
                                    }}>
                                    {meta.icon}
                                    {meta.label}
                                </button>
                            );
                        })}

                        {/* Status filter */}
                        <div className="ml-auto flex items-center gap-2">
                            {(["all", "active", "wip", "archived"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
                                    style={{
                                        background: statusFilter === s ? palette.accent : "transparent",
                                        color: statusFilter === s ? "#fff" : palette.textTertiary,
                                        border: `1px solid ${statusFilter === s ? palette.accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
                                    }}>
                                    {s === "wip" ? "In Progress" : s}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Empty state */}
                <AnimatePresence mode="wait">
                    {filtered.length === 0 && (
                        <motion.div
                            key="empty"
                            className="text-center py-24"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}>
                            <p className="text-4xl mb-4">🔍</p>
                            <p
                                className="text-lg font-semibold"
                                style={{ color: palette.textSecondary }}>
                                No projects match your filters.
                            </p>
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setActiveTypes(new Set());
                                    setStatusFilter("all");
                                }}
                                className="mt-4 px-4 py-2 rounded-full text-sm font-semibold"
                                style={{
                                    background: palette.accent,
                                    color: "#fff"
                                }}>
                                Clear filters
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Featured */}
                {featured.length > 0 && (
                    <div className="mb-14">
                        <h2
                            className={`${isApple ? "text-lg font-semibold" : "text-xl font-black"} mb-5 flex items-center gap-2`}
                            style={{ color: palette.textTertiary }}>
                            <Star style={{ fontSize: 18, color: "#FF9F0A" }} /> Featured
                        </h2>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            variants={{
                                show: { transition: { staggerChildren: 0.07 } }
                            }}
                            initial="hidden"
                            animate="show">
                            {featured.map((p) => (
                                <ProjectCard
                                    key={p.ProjectID}
                                    project={p}
                                    palette={palette}
                                    isDark={isDark}
                                    isApple={isApple}
                                />
                            ))}
                        </motion.div>
                    </div>
                )}

                {/* All others */}
                {regular.length > 0 && (
                    <div>
                        {featured.length > 0 && (
                            <h2
                                className={`${isApple ? "text-lg font-semibold" : "text-xl font-black"} mb-5`}
                                style={{ color: palette.textTertiary }}>
                                All Projects
                            </h2>
                        )}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            variants={{
                                show: { transition: { staggerChildren: 0.06 } }
                            }}
                            initial="hidden"
                            animate="show">
                            {regular.map((p) => (
                                <ProjectCard
                                    key={p.ProjectID}
                                    project={p}
                                    palette={palette}
                                    isDark={isDark}
                                    isApple={isApple}
                                />
                            ))}
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
