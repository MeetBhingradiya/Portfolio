/**
 * ProjectDetail — Client Component
 * Dispatches to one of 7 distinct full-page layouts based on project type.
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    ArrowBack, OpenInNew, GitHub, Terminal, Star, Download,
    Extension, Android, Web, Code, ContentCopy, Check,
    ChevronLeft, ChevronRight, Share, BookmarkBorder, Bookmark,
    DataObject, Storage, Cloud, Schedule, Public, Language
} from "@mui/icons-material";

// ─────────────────────────── Types ───────────────────────────

type ProjectType =
    | "website" | "webapp" | "chrome_extension"
    | "npm_package" | "playstore_app" | "github_repo" | "other";

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
        live?: string; github?: string; npm?: string;
        chromeWebstore?: string; playstore?: string;
        documentation?: string; demo?: string;
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

// ─────────────────────────── Shared Helpers ───────────────────────────

function fmt(n?: number) {
    if (n == null) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function useGlass(isDark: boolean, isApple: boolean): React.CSSProperties {
    return {
        background: isApple
            ? isDark
                ? "linear-gradient(180deg,rgba(58,58,60,0.6) 0%,rgba(44,44,46,0.55) 100%)"
                : "linear-gradient(180deg,rgba(255,255,255,0.65) 0%,rgba(250,250,250,0.6) 100%)"
            : isDark ? "rgba(26,26,30,0.95)" : "#fff",
        border: isApple
            ? isDark ? "0.5px solid rgba(255,255,255,0.12)" : "0.5px solid rgba(255,255,255,0.8)"
            : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: isApple ? "20px" : "24px",
        backdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        boxShadow: isApple
            ? isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.1)"
            : "none"
    };
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const { palette } = useDesignTheme();
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: copied ? "#30D15820" : `${isDark(palette) ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`, color: copied ? "#30D158" : palette.textTertiary }}>
            {copied ? <Check style={{ fontSize: 14 }} /> : <ContentCopy style={{ fontSize: 14 }} />}
            {copied ? "Copied!" : label}
        </button>
    );
}

// quick helper used inside CopyButton before palette is fully available
function isDark(palette: any) { return palette?.bg?.includes?.("28,28") || false; }

function BackButton({ palette }: { palette: any }) {
    return (
        <button onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-semibold mb-8 hover:opacity-70 transition-opacity"
            style={{ color: palette.textTertiary }}>
            <ArrowBack fontSize="small" /> Back to projects
        </button>
    );
}

function TechStack({ stack, color, palette }: { stack: string[]; color: string; palette: any }) {
    if (!stack.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {stack.map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: `${color}15`, color, border: `0.5px solid ${color}30` }}>
                    {t}
                </span>
            ))}
        </div>
    );
}

function Tags({ tags, palette }: { tags: string[]; palette: any }) {
    if (!tags.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded text-xs"
                    style={{ background: isDark(palette) ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textTertiary }}>
                    #{t}
                </span>
            ))}
        </div>
    );
}

function ScreenshotsGallery({ screenshots, palette, isDarkMode, isApple }: {
    screenshots: string[]; palette: any; isDarkMode: boolean; isApple: boolean;
}) {
    const [idx, setIdx] = useState(0);
    if (!screenshots.length) return null;
    const glass = useGlass(isDarkMode, isApple);
    return (
        <div>
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden mb-3"
                style={{ border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshots[idx]} alt={`Screenshot ${idx + 1}`}
                    className="w-full object-cover max-h-[480px]" />
                {screenshots.length > 1 && (
                    <>
                        <button onClick={() => setIdx(i => (i - 1 + screenshots.length) % screenshots.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: isDarkMode ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.8)" }}>
                            <ChevronLeft style={{ color: palette.textPrimary }} />
                        </button>
                        <button onClick={() => setIdx(i => (i + 1) % screenshots.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: isDarkMode ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.8)" }}>
                            <ChevronRight style={{ color: palette.textPrimary }} />
                        </button>
                        <span className="absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}>
                            {idx + 1} / {screenshots.length}
                        </span>
                    </>
                )}
            </div>
            {/* Thumbnails */}
            {screenshots.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {screenshots.map((s, i) => (
                        <button key={i} onClick={() => setIdx(i)}
                            className="shrink-0 rounded-xl overflow-hidden border-2 transition-all"
                            style={{
                                borderColor: i === idx ? palette.accent : "transparent",
                                opacity: i === idx ? 1 : 0.5
                            }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s} alt="" className="w-16 h-12 object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

interface LayoutProps {
    project: Project;
    palette: any;
    isDarkMode: boolean;
    isApple: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Layout 1 — WEBSITE  (browser-frame hero)
// ═══════════════════════════════════════════════════════════════════
function WebsiteLayout({ project, palette, isDarkMode, isApple }: LayoutProps) {
    const glass = useGlass(isDarkMode, isApple);
    const primaryUrl = project.Links.live;

    return (
        <div>
            <BackButton palette={palette} />

            {/* Browser mockup */}
            <motion.div style={glass} className="overflow-hidden mb-8"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Chrome bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b"
                    style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                        style={{ background: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: palette.textTertiary }}>
                        <Public style={{ fontSize: 12 }} />
                        <span className="truncate flex-1">{primaryUrl?.replace(/^https?:\/\//, "") ?? project.Slug}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {primaryUrl && (
                            <a href={primaryUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{ background: "#0A84FF", color: "#fff" }}>
                                <OpenInNew style={{ fontSize: 13 }} /> Visit
                            </a>
                        )}
                    </div>
                </div>
                {/* Screenshot hero inside browser */}
                {project.Thumbnail || project.Screenshots[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.Thumbnail ?? project.Screenshots[0]} alt={project.Title}
                        className="w-full object-cover max-h-[460px]"
                        style={{ background: isDarkMode ? "#1c1c1e" : "#f5f5f7" }} />
                ) : (
                    <div className="w-full h-56 flex items-center justify-center"
                        style={{ background: isDarkMode ? "#1c1c1e" : "#f5f5f7" }}>
                        <Web style={{ fontSize: 64, color: "#0A84FF", opacity: 0.3 }} />
                    </div>
                )}
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main content */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
                        <StatusBadge status={project.Status} featured={project.Featured} />
                        <h1 className={isApple ? "text-3xl font-bold mt-2 mb-3" : "text-4xl font-black mt-2 mb-3"}
                            style={{ color: palette.textPrimary }}>{project.Title}</h1>
                        <p className="text-lg leading-relaxed" style={{ color: palette.textSecondary }}>{project.Description}</p>
                        {project.LongDescription && (
                            <p className="mt-4 text-base leading-relaxed whitespace-pre-line" style={{ color: palette.textSecondary }}>
                                {project.LongDescription}
                            </p>
                        )}
                    </motion.div>

                    {project.Screenshots.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <SectionLabel label="Screenshots" palette={palette} isApple={isApple} />
                            <ScreenshotsGallery screenshots={project.Screenshots} palette={palette} isDarkMode={isDarkMode} isApple={isApple} />
                        </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}>
                        <SectionLabel label="Tech Stack" palette={palette} isApple={isApple} />
                        <TechStack stack={project.TechStack} color="#0A84FF" palette={palette} />
                    </motion.div>

                    <Tags tags={project.Tags} palette={palette} />
                </div>

                {/* Sidebar */}
                <Sidebar project={project} palette={palette} isDarkMode={isDarkMode} isApple={isApple} color="#0A84FF" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Layout 2 — WEB APP  (SaaS / dashboard style)
// ═══════════════════════════════════════════════════════════════════
function WebAppLayout({ project, palette, isDarkMode, isApple }: LayoutProps) {
    const glass = useGlass(isDarkMode, isApple);

    return (
        <div>
            <BackButton palette={palette} />

            {/* Hero banner */}
            <motion.div className="relative rounded-2xl overflow-hidden mb-10 p-8 md:p-12"
                style={{
                    background: "linear-gradient(135deg,#0A84FF18 0%,#30D15812 100%)",
                    border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                    borderRadius: isApple ? "20px" : "28px"
                }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Top stripe */}
                <div className="absolute inset-x-0 top-0 h-1.5"
                    style={{ background: "linear-gradient(90deg,#30D158,#0A84FF)" }} />
                <StatusBadge status={project.Status} featured={project.Featured} />
                <h1 className={isApple ? "text-4xl font-bold mt-3 mb-4" : "text-5xl font-black mt-3 mb-4"}
                    style={{ color: palette.textPrimary }}>{project.Title}</h1>
                <p className="text-xl leading-relaxed max-w-2xl" style={{ color: palette.textSecondary }}>
                    {project.Description}
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                    {project.Links.live && (
                        <a href={project.Links.live} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold"
                            style={{ background: "#30D158", color: "#fff" }}>
                            <OpenInNew fontSize="small" /> Open App
                        </a>
                    )}
                    {project.Links.demo && (
                        <a href={project.Links.demo} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold"
                            style={{ background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", color: palette.textPrimary }}>
                            <Public fontSize="small" /> Live Demo
                        </a>
                    )}
                    {project.Links.github && (
                        <a href={project.Links.github} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold"
                            style={{ background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", color: palette.textPrimary }}>
                            <GitHub fontSize="small" /> Source
                        </a>
                    )}
                </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-7">
                    {project.LongDescription && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, delay: 0.15 }}>
                            <SectionLabel label="About" palette={palette} isApple={isApple} />
                            <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: palette.textSecondary }}>
                                {project.LongDescription}
                            </p>
                        </motion.div>
                    )}
                    {project.Screenshots.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <SectionLabel label="Screenshots" palette={palette} isApple={isApple} />
                            <ScreenshotsGallery screenshots={project.Screenshots} palette={palette} isDarkMode={isDarkMode} isApple={isApple} />
                        </motion.div>
                    )}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}>
                        <SectionLabel label="Tech Stack" palette={palette} isApple={isApple} />
                        <TechStack stack={project.TechStack} color="#30D158" palette={palette} />
                    </motion.div>
                    <Tags tags={project.Tags} palette={palette} />
                </div>
                <Sidebar project={project} palette={palette} isDarkMode={isDarkMode} isApple={isApple} color="#30D158" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Layout 3 — CHROME EXTENSION  (Chrome Web Store style)
// ═══════════════════════════════════════════════════════════════════
function ChromeExtensionLayout({ project, palette, isDarkMode, isApple }: LayoutProps) {
    const glass = useGlass(isDarkMode, isApple);

    return (
        <div>
            <BackButton palette={palette} />

            {/* Store-style header */}
            <motion.div style={glass} className="p-6 md:p-8 mb-8 grid md:grid-cols-[auto_1fr] gap-6 items-start"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Extension icon */}
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg,#BF5AF2,#7C3AED)" }}>
                    {project.Thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={project.Thumbnail} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                        <Extension style={{ fontSize: 48, color: "#fff" }} />
                    )}
                </div>

                <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#BF5AF2" }}>Chrome Extension</p>
                    <h1 className={isApple ? "text-3xl font-bold mb-2" : "text-4xl font-black mb-2"}
                        style={{ color: palette.textPrimary }}>{project.Title}</h1>
                    <p className="text-base mb-4" style={{ color: palette.textSecondary }}>{project.Description}</p>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-5 mb-5">
                        {project.Stats.chromeInstalls != null && (
                            <div>
                                <p className="text-xl font-bold" style={{ color: "#BF5AF2" }}>{fmt(project.Stats.chromeInstalls)}</p>
                                <p className="text-xs" style={{ color: palette.textTertiary }}>Users</p>
                            </div>
                        )}
                        <StatusStat status={project.Status} />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {project.Links.chromeWebstore && (
                            <a href={project.Links.chromeWebstore} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold"
                                style={{ background: "#BF5AF2", color: "#fff" }}>
                                <Extension fontSize="small" /> Add to Chrome
                            </a>
                        )}
                        {project.Links.github && (
                            <a href={project.Links.github} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold"
                                style={{ background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", color: palette.textPrimary }}>
                                <GitHub fontSize="small" /> Source
                            </a>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-7">
                    {project.Screenshots.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                            <SectionLabel label="Preview" palette={palette} isApple={isApple} />
                            <ScreenshotsGallery screenshots={project.Screenshots} palette={palette} isDarkMode={isDarkMode} isApple={isApple} />
                        </motion.div>
                    )}
                    {project.LongDescription && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, delay: 0.15 }}>
                            <SectionLabel label="Overview" palette={palette} isApple={isApple} />
                            <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: palette.textSecondary }}>
                                {project.LongDescription}
                            </p>
                        </motion.div>
                    )}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <SectionLabel label="Tech Stack" palette={palette} isApple={isApple} />
                        <TechStack stack={project.TechStack} color="#BF5AF2" palette={palette} />
                    </motion.div>
                    <Tags tags={project.Tags} palette={palette} />
                </div>
                <Sidebar project={project} palette={palette} isDarkMode={isDarkMode} isApple={isApple} color="#BF5AF2" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Layout 4 — NPM PACKAGE  (npm registry page style)
// ═══════════════════════════════════════════════════════════════════
function NpmLayout({ project, palette, isDarkMode, isApple }: LayoutProps) {
    const glass = useGlass(isDarkMode, isApple);
    const installCmd  = `npm install ${project.Slug}`;
    const installBun  = `bun add ${project.Slug}`;
    const installPnpm = `pnpm add ${project.Slug}`;
    const [pkgMgr, setPkgMgr] = useState<"npm" | "bun" | "pnpm">("bun");

    const cmds = { npm: installCmd, bun: installBun, pnpm: installPnpm };

    return (
        <div>
            <BackButton palette={palette} />

            {/* npm-style header */}
            <motion.div style={glass} className="overflow-hidden mb-8"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Red npm header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b"
                    style={{ background: isDarkMode ? "rgba(203,56,55,0.18)" : "rgba(203,56,55,0.1)", borderColor: isDarkMode ? "rgba(203,56,55,0.3)" : "rgba(203,56,55,0.2)" }}>
                    <Terminal style={{ color: "#CB3837", fontSize: 28 }} />
                    <div>
                        <p className="font-black text-xs uppercase tracking-widest" style={{ color: "#CB3837" }}>npm</p>
                        <p className={isApple ? "text-xl font-bold" : "text-2xl font-black"} style={{ color: palette.textPrimary }}>
                            {project.Slug}
                        </p>
                    </div>
                    {project.Stats.npmDownloads != null && (
                        <div className="ml-auto text-right">
                            <p className="text-2xl font-black" style={{ color: "#CB3837" }}>{fmt(project.Stats.npmDownloads)}</p>
                            <p className="text-xs" style={{ color: palette.textTertiary }}>total downloads</p>
                        </div>
                    )}
                </div>

                {/* Install commands */}
                <div className="p-6">
                    {/* Package manager tabs */}
                    <div className="flex gap-2 mb-3">
                        {(["bun", "npm", "pnpm"] as const).map(pm => (
                            <button key={pm} onClick={() => setPkgMgr(pm)}
                                className="px-3 py-1 rounded text-xs font-bold transition-all"
                                style={{
                                    background: pkgMgr === pm ? "#CB3837" : "transparent",
                                    color: pkgMgr === pm ? "#fff" : palette.textTertiary,
                                    border: `1px solid ${pkgMgr === pm ? "#CB3837" : isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                }}>
                                {pm}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm"
                        style={{
                            background: isDarkMode ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.04)",
                            border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                            color: "#30D158"
                        }}>
                        <span style={{ color: palette.textTertiary }}>$</span>
                        <span className="flex-1">{cmds[pkgMgr]}</span>
                        <CopyButton text={cmds[pkgMgr]} />
                    </div>
                </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-7">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                        <SectionLabel label="Description" palette={palette} isApple={isApple} />
                        <p className="text-base leading-relaxed" style={{ color: palette.textSecondary }}>
                            {project.Description}
                        </p>
                        {project.LongDescription && (
                            <p className="mt-4 text-base leading-relaxed whitespace-pre-line" style={{ color: palette.textSecondary }}>
                                {project.LongDescription}
                            </p>
                        )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                        <SectionLabel label="Tech Stack" palette={palette} isApple={isApple} />
                        <TechStack stack={project.TechStack} color="#CB3837" palette={palette} />
                    </motion.div>
                    <Tags tags={project.Tags} palette={palette} />
                </div>
                <Sidebar project={project} palette={palette} isDarkMode={isDarkMode} isApple={isApple} color="#CB3837" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Layout 5 — PLAY STORE APP  (Google Play style)
// ═══════════════════════════════════════════════════════════════════
function PlayStoreLayout({ project, palette, isDarkMode, isApple }: LayoutProps) {
    const glass = useGlass(isDarkMode, isApple);
    const rating = project.Stats.playstoreRating;

    return (
        <div>
            <BackButton palette={palette} />

            {/* Google Play style header */}
            <motion.div style={glass} className="p-6 md:p-8 mb-8"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex gap-5 items-start">
                    {/* App icon */}
                    <div className="w-24 h-24 rounded-2xl shrink-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#3DDC84,#00BFA5)" }}>
                        {project.Thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.Thumbnail} alt="" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <Android style={{ fontSize: 48, color: "#fff" }} />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#3DDC84" }}>Play Store</p>
                        <h1 className={isApple ? "text-2xl font-bold mb-1" : "text-3xl font-black mb-1"}
                            style={{ color: palette.textPrimary }}>{project.Title}</h1>
                        {project.Category && (
                            <p className="text-sm mb-3" style={{ color: "#3DDC84" }}>{project.Category}</p>
                        )}

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-6 mb-4">
                            {rating != null && (
                                <div className="text-center">
                                    <div className="flex items-center gap-1">
                                        <span className={isApple ? "text-2xl font-bold" : "text-3xl font-black"} style={{ color: palette.textPrimary }}>
                                            {rating.toFixed(1)}
                                        </span>
                                        <Star style={{ color: "#FF9F0A", fontSize: 20 }} />
                                    </div>
                                    <p className="text-xs" style={{ color: palette.textTertiary }}>Rating</p>
                                </div>
                            )}
                            {project.Stats.playstoreInstalls != null && (
                                <div className="text-center">
                                    <p className={isApple ? "text-2xl font-bold" : "text-3xl font-black"} style={{ color: palette.textPrimary }}>
                                        {fmt(project.Stats.playstoreInstalls)}+
                                    </p>
                                    <p className="text-xs" style={{ color: palette.textTertiary }}>Downloads</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {project.Links.playstore && (
                                <a href={project.Links.playstore} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold"
                                    style={{ background: "#3DDC84", color: "#000" }}>
                                    <Android fontSize="small" /> Get it on Play Store
                                </a>
                            )}
                            {project.Links.github && (
                                <a href={project.Links.github} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold"
                                    style={{ background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", color: palette.textPrimary }}>
                                    <GitHub fontSize="small" /> Source
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Screenshots horizontal scroll */}
            {project.Screenshots.length > 0 && (
                <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <SectionLabel label="Screenshots" palette={palette} isApple={isApple} />
                    <div className="flex gap-4 overflow-x-auto pb-3">
                        {project.Screenshots.map((s, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={s} alt={`Screenshot ${i + 1}`}
                                className="shrink-0 h-[360px] w-auto rounded-2xl object-cover border"
                                style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                        ))}
                    </div>
                </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-7">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
                        <SectionLabel label="About this app" palette={palette} isApple={isApple} />
                        <p className="text-base leading-relaxed" style={{ color: palette.textSecondary }}>
                            {project.Description}
                        </p>
                        {project.LongDescription && (
                            <p className="mt-4 text-base leading-relaxed whitespace-pre-line" style={{ color: palette.textSecondary }}>
                                {project.LongDescription}
                            </p>
                        )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                        <SectionLabel label="Tech Stack" palette={palette} isApple={isApple} />
                        <TechStack stack={project.TechStack} color="#3DDC84" palette={palette} />
                    </motion.div>
                    <Tags tags={project.Tags} palette={palette} />
                </div>
                <Sidebar project={project} palette={palette} isDarkMode={isDarkMode} isApple={isApple} color="#3DDC84" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Layout 6 — GITHUB REPO  (GitHub repository page style)
// ═══════════════════════════════════════════════════════════════════
function GitHubRepoLayout({ project, palette, isDarkMode, isApple }: LayoutProps) {
    const glass = useGlass(isDarkMode, isApple);

    // Build a rough "language" breakdown from TechStack
    const langs = project.TechStack.slice(0, 6);
    const langColors = ["#0A84FF", "#30D158", "#FF9F0A", "#BF5AF2", "#FF375F", "#5AC8FA"];

    return (
        <div>
            <BackButton palette={palette} />

            {/* GitHub-style repo header */}
            <motion.div style={glass} className="p-5 md:p-6 mb-8"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm mb-3" style={{ color: palette.textTertiary }}>
                    <GitHub style={{ fontSize: 18 }} />
                    <span>MeetBhingradiya</span>
                    <span>/</span>
                    <span className="font-bold" style={{ color: "#0A84FF" }}>{project.Slug}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs border" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", color: palette.textTertiary }}>
                        Public
                    </span>
                </div>

                {/* Stats badges */}
                <div className="flex flex-wrap gap-3 mb-4">
                    {project.Stats.githubStars != null && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                            style={{ background: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textSecondary, border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
                            <Star style={{ fontSize: 16, color: "#FF9F0A" }} />
                            Stars <strong>{fmt(project.Stats.githubStars)}</strong>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                        style={{ background: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textSecondary, border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
                        <Schedule style={{ fontSize: 16 }} />
                        {project.Status === "active" ? "Active" : project.Status === "wip" ? "In Progress" : "Archived"}
                    </div>
                </div>

                <p className="text-base mb-5" style={{ color: palette.textSecondary }}>{project.Description}</p>

                {/* Topics (tags) */}
                {project.Tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {project.Tags.map(t => (
                            <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: "#0A84FF18", color: "#0A84FF", border: "0.5px solid #0A84FF30" }}>
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    {project.Links.github && (
                        <a href={project.Links.github} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold border"
                            style={{ color: palette.textPrimary, border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}` }}>
                            <GitHub fontSize="small" /> View on GitHub
                        </a>
                    )}
                    {project.Links.live && (
                        <a href={project.Links.live} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold"
                            style={{ background: "#0A84FF", color: "#fff" }}>
                            <OpenInNew fontSize="small" /> Live
                        </a>
                    )}
                    {project.Links.documentation && (
                        <a href={project.Links.documentation} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold border"
                            style={{ color: palette.textPrimary, border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}` }}>
                            <Language fontSize="small" /> Docs
                        </a>
                    )}
                </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-7">
                    {project.LongDescription && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                            <SectionLabel label="README" palette={palette} isApple={isApple} />
                            <div style={glass} className="p-6">
                                <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: palette.textSecondary }}>
                                    {project.LongDescription}
                                </p>
                            </div>
                        </motion.div>
                    )}
                    {project.Screenshots.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
                            <SectionLabel label="Screenshots" palette={palette} isApple={isApple} />
                            <ScreenshotsGallery screenshots={project.Screenshots} palette={palette} isDarkMode={isDarkMode} isApple={isApple} />
                        </motion.div>
                    )}

                    {/* Language bar */}
                    {langs.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                            <SectionLabel label="Languages & Stack" palette={palette} isApple={isApple} />
                            <div className="h-2.5 rounded-full overflow-hidden flex mb-3">
                                {langs.map((_, i) => (
                                    <div key={i} className="flex-1 first:rounded-l-full last:rounded-r-full"
                                        style={{ background: langColors[i % langColors.length] }} />
                                ))}
                            </div>
                            <TechStack stack={project.TechStack} color="#0A84FF" palette={palette} />
                        </motion.div>
                    )}
                </div>
                <Sidebar project={project} palette={palette} isDarkMode={isDarkMode} isApple={isApple} color="#E8EAF6" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Layout 7 — OTHER  (minimal article style)
// ═══════════════════════════════════════════════════════════════════
function OtherLayout({ project, palette, isDarkMode, isApple }: LayoutProps) {
    return (
        <div>
            <BackButton palette={palette} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <StatusBadge status={project.Status} featured={project.Featured} />
                <h1 className={isApple ? "text-3xl md:text-4xl font-bold mt-3 mb-4" : "text-4xl md:text-5xl font-black mt-3 mb-4"}
                    style={{ color: palette.textPrimary }}>{project.Title}</h1>
            </motion.div>

            {(project.Thumbnail ?? project.Screenshots[0]) && (
                <motion.div className="mb-8 rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={project.Thumbnail ?? project.Screenshots[0]} alt={project.Title}
                        className="w-full max-h-[480px] object-cover" />
                </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-7">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
                        <p className="text-lg leading-relaxed" style={{ color: palette.textSecondary }}>{project.Description}</p>
                        {project.LongDescription && (
                            <p className="mt-4 text-base leading-relaxed whitespace-pre-line" style={{ color: palette.textSecondary }}>
                                {project.LongDescription}
                            </p>
                        )}
                    </motion.div>
                    {project.Screenshots.length > 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <SectionLabel label="Gallery" palette={palette} isApple={isApple} />
                            <ScreenshotsGallery screenshots={project.Screenshots.slice(1)} palette={palette} isDarkMode={isDarkMode} isApple={isApple} />
                        </motion.div>
                    )}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.25 }}>
                        <SectionLabel label="Tech Stack" palette={palette} isApple={isApple} />
                        <TechStack stack={project.TechStack} color="#FF9500" palette={palette} />
                    </motion.div>
                    <Tags tags={project.Tags} palette={palette} />
                </div>
                <Sidebar project={project} palette={palette} isDarkMode={isDarkMode} isApple={isApple} color="#FF9500" />
            </div>
        </div>
    );
}

// ─────────────────────────── All Project Links ───────────────────────────

const LINK_META: { key: keyof Project["Links"]; label: string; icon: React.ReactNode }[] = [
    { key: "live",           label: "Live Site",         icon: <OpenInNew fontSize="small" /> },
    { key: "demo",           label: "Live Demo",         icon: <Public fontSize="small" /> },
    { key: "github",         label: "GitHub",            icon: <GitHub fontSize="small" /> },
    { key: "npm",            label: "npm",               icon: <Terminal fontSize="small" /> },
    { key: "chromeWebstore", label: "Chrome Web Store",  icon: <Extension fontSize="small" /> },
    { key: "playstore",      label: "Play Store",        icon: <Android fontSize="small" /> },
    { key: "documentation",  label: "Documentation",     icon: <Language fontSize="small" /> },
];

function buildProjectLinks(project: Project) {
    return LINK_META
        .filter(e => !!project.Links[e.key])
        .map(e => ({ href: project.Links[e.key]!, label: e.label, icon: e.icon }));
}

// ─────────────────────────── Shared Sidebar ───────────────────────────

function Sidebar({ project, palette, isDarkMode, isApple, color }: LayoutProps & { color: string }) {
    const glass = useGlass(isDarkMode, isApple);
    const links = buildProjectLinks(project);

    return (
        <div className="flex flex-col gap-4">
            {/* Links card */}
            {links.length > 0 && (
                <div style={glass} className="p-5">
                    <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: palette.textTertiary }}>Links</p>
                    <div className="flex flex-col gap-2.5">
                        {links.map((l, i) => (
                            <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                                style={{ background: i === 0 ? color : "transparent", color: i === 0 ? "#fff" : palette.textSecondary, border: i !== 0 ? `1px solid ${isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}` : "none" }}>
                                {l.icon}{l.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Project info card */}
            <div style={glass} className="p-5">
                <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: palette.textTertiary }}>Details</p>
                <div className="flex flex-col gap-3">
                    <InfoRow label="Status" palette={palette}>
                        <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-full"
                            style={{ background: project.Status === "active" ? "#30D15820" : project.Status === "wip" ? "#FF9F0A20" : "#8E8E9320", color: project.Status === "active" ? "#30D158" : project.Status === "wip" ? "#FF9F0A" : "#8E8E93" }}>
                            {project.Status === "wip" ? "In Progress" : project.Status}
                        </span>
                    </InfoRow>
                    {project.Category && <InfoRow label="Category" value={project.Category} palette={palette} />}
                    {project.StartDate && <InfoRow label="Started" value={new Date(project.StartDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} palette={palette} />}
                    {project.EndDate && !project.Status.includes("active") && (
                        <InfoRow label="Finished" value={new Date(project.EndDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} palette={palette} />
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, children, palette }: { label: string; value?: string; children?: React.ReactNode; palette: any }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs" style={{ color: palette.textTertiary }}>{label}</span>
            {children ?? <span className="text-xs font-semibold" style={{ color: palette.textSecondary }}>{value}</span>}
        </div>
    );
}

function SectionLabel({ label, palette, isApple }: { label: string; palette: any; isApple: boolean }) {
    return (
        <p className={`${isApple ? "text-sm font-semibold" : "text-sm font-black"} uppercase tracking-[0.12em] mb-4`}
            style={{ color: palette.textTertiary }}>
            {label}
        </p>
    );
}

function StatusBadge({ status, featured }: { status: string; featured: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {featured && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                    style={{ background: "#FF9F0A20", color: "#FF9F0A", border: "0.5px solid #FF9F0A40" }}>
                    ⭐ Featured
                </span>
            )}
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold capitalize"
                style={{ background: status === "active" ? "#30D15820" : status === "wip" ? "#FF9F0A20" : "#8E8E9320", color: status === "active" ? "#30D158" : status === "wip" ? "#FF9F0A" : "#8E8E93" }}>
                {status === "wip" ? "In Progress" : status}
            </span>
        </div>
    );
}

function StatusStat({ status }: { status: string }) {
    return (
        <div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                style={{ background: status === "active" ? "#30D15820" : "#FF9F0A20", color: status === "active" ? "#30D158" : "#FF9F0A" }}>
                {status === "active" ? "● Active" : status === "wip" ? "⚙ In Progress" : "Archived"}
            </span>
        </div>
    );
}

// ─────────────────────────── Main Dispatcher ───────────────────────────

export default function ProjectDetail({ project }: { project: Project }) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDarkMode = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const props: LayoutProps = { project, palette, isDarkMode, isApple };

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
                <AnimatePresence mode="wait">
                    {project.Type === "website"          && <WebsiteLayout key="website" {...props} />}
                    {project.Type === "webapp"           && <WebAppLayout key="webapp" {...props} />}
                    {project.Type === "chrome_extension" && <ChromeExtensionLayout key="chrome" {...props} />}
                    {project.Type === "npm_package"      && <NpmLayout key="npm" {...props} />}
                    {project.Type === "playstore_app"    && <PlayStoreLayout key="play" {...props} />}
                    {project.Type === "github_repo"      && <GitHubRepoLayout key="github" {...props} />}
                    {(project.Type === "other" || !project.Type) && <OtherLayout key="other" {...props} />}
                </AnimatePresence>
            </div>
        </div>
    );
}
