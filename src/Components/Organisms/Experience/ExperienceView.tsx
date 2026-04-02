/**
 * ExperienceView — Client Component
 * Full professional profile: Work Experience, Skills (by category with
 * proficiency bars), Education and Certificates - LinkedIn-style layout.
 */

"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Work,
    School,
    VerifiedUser,
    Code,
    OpenInNew,
    LocationOn,
    Star,
    KeyboardArrowDown,
    KeyboardArrowUp,
    Download
} from "@mui/icons-material";

// ─────────────────────────── Types ───────────────────────────

type SkillCategory = "languages" | "frameworks" | "databases" | "devops" | "cloud" | "tools" | "design" | "soft_skills" | "other";

interface Skill {
    SkillID: string;
    Name: string;
    Category: SkillCategory;
    Proficiency: number;
    YearsOfExperience?: number;
    Color?: string;
    Order: number;
}

interface Experience {
    ExperienceID: string;
    Company: string;
    Role: string;
    EmploymentType: string;
    StartDate: string;
    EndDate?: string;
    CurrentlyWorking: boolean;
    Location?: string;
    LocationType: string;
    Description?: string;
    Responsibilities: string[];
    Achievements: string[];
    TechStack: string[];
    CompanyLogo?: string;
    CompanyWebsite?: string;
}

interface Education {
    EducationID: string;
    Institution: string;
    Degree: string;
    FieldOfStudy: string;
    Grade?: string;
    MaxGrade?: string;
    GradeType: string;
    StartDate: string;
    EndDate?: string;
    CurrentlyStudying: boolean;
    Location?: string;
    Description?: string;
    Achievements: string[];
    Logo?: string;
}

interface Certificate {
    CertificateID: string;
    Title: string;
    IssuingOrganization: string;
    IssuedDate: string;
    ExpiryDate?: string;
    NoExpiry: boolean;
    CredentialID?: string;
    CredentialURL?: string;
    Description?: string;
    Skills: string[];
    Logo?: string;
}

// ─────────────────────────── Helpers ───────────────────────────

function fmtDate(d?: string, fallback = "Present") {
    if (!d) return fallback;
    return new Date(d).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric"
    });
}

function fmtRange(start?: string, end?: string, current?: boolean) {
    return `${fmtDate(start)} – ${current ? "Present" : fmtDate(end)}`;
}

function monthsDiff(start?: string, end?: string, current?: boolean) {
    const s = start ? new Date(start) : new Date();
    const e = current || !end ? new Date() : new Date(end);
    return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
}

function durationLabel(months: number) {
    if (months < 1) return "< 1 month";
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts: string[] = [];
    if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
    if (m) parts.push(`${m} mo${m > 1 ? "s" : ""}`);
    return parts.join(" ");
}

function employmentLabel(t: string) {
    return (
        (
            {
                full_time: "Full-time",
                part_time: "Part-time",
                contract: "Contract",
                freelance: "Freelance",
                internship: "Internship",
                volunteer: "Volunteer",
                self_employed: "Self-employed"
            } as Record<string, string>
        )[t] ?? t
    );
}

const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
    languages: "Languages",
    frameworks: "Frameworks & Libraries",
    databases: "Databases",
    devops: "DevOps & CI/CD",
    cloud: "Cloud & Infrastructure",
    tools: "Tools & Platforms",
    design: "Design",
    soft_skills: "Soft Skills",
    other: "Other"
};

const CATEGORY_COLORS: Record<SkillCategory, string> = {
    languages: "#0A84FF",
    frameworks: "#30D158",
    databases: "#FF9F0A",
    devops: "#FF375F",
    cloud: "#BF5AF2",
    tools: "#5AC8FA",
    design: "#FF2D55",
    soft_skills: "#64D2FF",
    other: "#8E8E93"
};

// ─────────────────────────── Section Heading ───────────────────────────

function SectionHeading({ icon, title, palette, isApple }: { icon: React.ReactNode; title: string; palette: any; isApple: boolean }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <span style={{ color: palette.accent }}>{icon}</span>
            <h2
                className={isApple ? "text-2xl font-bold" : "text-3xl font-black"}
                style={{ color: palette.textPrimary }}>
                {title}
            </h2>
        </div>
    );
}

// ─────────────────────────── Experience Section ───────────────────────────

function ExperienceSection({
    experience,
    palette,
    isDark,
    isApple
}: {
    experience: Experience[];
    palette: any;
    isDark: boolean;
    isApple: boolean;
}) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    function toggle(id: string) {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    const cardStyle: React.CSSProperties = {
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
        boxShadow: isApple ? (isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)") : "none",
        overflow: "hidden",
        position: "relative"
    };

    return (
        <section className="mb-16">
            <SectionHeading
                icon={<Work />}
                title="Work Experience"
                palette={palette}
                isApple={isApple}
            />
            <div className="flex flex-col gap-5">
                {experience.map((exp, i) => {
                    const months = monthsDiff(exp.StartDate, exp.EndDate, exp.CurrentlyWorking);
                    const isExp = !!expanded[exp.ExperienceID];
                    const hasDetails = exp.Responsibilities.length > 0 || exp.Achievements.length > 0;
                    return (
                        <motion.div
                            key={exp.ExperienceID}
                            style={cardStyle}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: i * 0.06 }}>
                            {/* Apple sheen */}
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
                            {/* Left accent bar */}
                            <div
                                className="absolute inset-y-0 left-0 w-1"
                                style={{
                                    background: exp.CurrentlyWorking ? "#30D158" : "#0A84FF"
                                }}
                            />

                            <div className="pl-5 pr-5 py-5 relative z-10">
                                {/* Top row */}
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                    <div className="flex items-start gap-3">
                                        {exp.CompanyLogo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={exp.CompanyLogo}
                                                alt={exp.Company}
                                                className="w-10 h-10 rounded-xl object-cover border"
                                                style={{
                                                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black"
                                                style={{
                                                    background: "#0A84FF20",
                                                    color: "#0A84FF"
                                                }}>
                                                {exp.Company[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h3
                                                className={isApple ? "text-base font-semibold" : "text-lg font-bold"}
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {exp.Role}
                                            </h3>
                                            <a
                                                href={exp.CompanyWebsite ?? "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium hover:underline flex items-center gap-1"
                                                style={{ color: "#0A84FF" }}>
                                                {exp.Company}
                                                {exp.CompanyWebsite && <OpenInNew style={{ fontSize: 11 }} />}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p
                                            className="text-xs font-semibold"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {fmtRange(exp.StartDate, exp.EndDate, exp.CurrentlyWorking)}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {durationLabel(months)}
                                        </p>
                                    </div>
                                </div>

                                {/* Tags row */}
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                        style={{
                                            background: "#0A84FF15",
                                            color: "#0A84FF",
                                            border: "0.5px solid #0A84FF30"
                                        }}>
                                        {employmentLabel(exp.EmploymentType)}
                                    </span>
                                    {exp.CurrentlyWorking && (
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse"
                                            style={{
                                                background: "#30D15820",
                                                color: "#30D158"
                                            }}>
                                            ● Current
                                        </span>
                                    )}
                                    {exp.Location && (
                                        <span
                                            className="flex items-center gap-1 text-xs"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            <LocationOn style={{ fontSize: 12 }} />
                                            {exp.Location} · {exp.LocationType}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {exp.Description && (
                                    <p
                                        className="mt-3 text-sm leading-relaxed"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        {exp.Description}
                                    </p>
                                )}

                                {/* Tech stack */}
                                {exp.TechStack.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {exp.TechStack.map((t) => (
                                            <span
                                                key={t}
                                                className="px-2 py-0.5 rounded-full text-xs"
                                                style={{
                                                    background: "#0A84FF14",
                                                    color: "#0A84FF",
                                                    border: "0.5px solid #0A84FF28"
                                                }}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Expand toggle */}
                                {hasDetails && (
                                    <button
                                        onClick={() => toggle(exp.ExperienceID)}
                                        className="flex items-center gap-1 text-xs font-semibold mt-4 hover:opacity-80"
                                        style={{ color: palette.accent }}>
                                        {isExp ? (
                                            <>
                                                <KeyboardArrowUp fontSize="small" /> Less details
                                            </>
                                        ) : (
                                            <>
                                                <KeyboardArrowDown fontSize="small" /> More details
                                            </>
                                        )}
                                    </button>
                                )}

                                <AnimatePresence>
                                    {isExp && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto"
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden">
                                            <div className="mt-4 grid md:grid-cols-2 gap-4">
                                                {exp.Responsibilities.length > 0 && (
                                                    <div>
                                                        <p
                                                            className="text-xs font-black uppercase tracking-widest mb-2"
                                                            style={{
                                                                color: palette.textTertiary
                                                            }}>
                                                            Responsibilities
                                                        </p>
                                                        <ul className="space-y-1.5">
                                                            {exp.Responsibilities.map((r, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="text-sm flex gap-2"
                                                                    style={{
                                                                        color: palette.textSecondary
                                                                    }}>
                                                                    <span
                                                                        style={
                                                                            {
                                                                                color: "#0A84FF",
                                                                                shrink: 0
                                                                            } as any
                                                                        }>
                                                                        ▸
                                                                    </span>
                                                                    {r}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {exp.Achievements.length > 0 && (
                                                    <div>
                                                        <p
                                                            className="text-xs font-black uppercase tracking-widest mb-2"
                                                            style={{
                                                                color: palette.textTertiary
                                                            }}>
                                                            Achievements
                                                        </p>
                                                        <ul className="space-y-1.5">
                                                            {exp.Achievements.map((a, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="text-sm flex gap-2"
                                                                    style={{
                                                                        color: palette.textSecondary
                                                                    }}>
                                                                    <Star
                                                                        style={{
                                                                            fontSize: 14,
                                                                            color: "#FF9F0A",
                                                                            flexShrink: 0
                                                                        }}
                                                                    />
                                                                    {a}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}

// ─────────────────────────── Skills Section ───────────────────────────

function SkillsSection({ skills, palette, isDark, isApple }: { skills: Skill[]; palette: any; isDark: boolean; isApple: boolean }) {
    const grouped = useMemo(() => {
        const g: Partial<Record<SkillCategory, Skill[]>> = {};
        for (const s of skills) {
            if (!g[s.Category]) g[s.Category] = [];
            g[s.Category]!.push(s);
        }
        return g;
    }, [skills]);

    const cardBg: React.CSSProperties = {
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
        boxShadow: isApple ? (isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)") : "none"
    };

    return (
        <section className="mb-16">
            <SectionHeading
                icon={<Code />}
                title="Skills"
                palette={palette}
                isApple={isApple}
            />
            <div className="grid md:grid-cols-2 gap-5">
                {(Object.entries(grouped) as [SkillCategory, Skill[]][]).map(([cat, catSkills], ci) => {
                    const color = CATEGORY_COLORS[cat] ?? palette.accent;
                    return (
                        <motion.div
                            key={cat}
                            style={cardBg}
                            className="p-5"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.4,
                                delay: ci * 0.06
                            }}>
                            <p
                                className="text-xs font-black uppercase tracking-widest mb-4"
                                style={{ color }}>
                                {SKILL_CATEGORY_LABELS[cat]}
                            </p>
                            <div className="flex flex-col gap-3">
                                {catSkills.map((skill) => (
                                    <div key={skill.SkillID}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span
                                                className="text-sm font-medium"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {skill.Name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {skill.YearsOfExperience != null && (
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {skill.YearsOfExperience}y
                                                    </span>
                                                )}
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color }}>
                                                    {skill.Proficiency}%
                                                </span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div
                                            className="h-1.5 rounded-full overflow-hidden"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                                            }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{
                                                    background: skill.Color ?? color
                                                }}
                                                initial={{ width: 0 }}
                                                whileInView={{
                                                    width: `${skill.Proficiency}%`
                                                }}
                                                viewport={{ once: true }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: 0.2,
                                                    ease: "easeOut"
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}

// ─────────────────────────── Education Section ───────────────────────────

function EducationSection({
    education,
    palette,
    isDark,
    isApple
}: {
    education: Education[];
    palette: any;
    isDark: boolean;
    isApple: boolean;
}) {
    const cardStyle: React.CSSProperties = {
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
        boxShadow: isApple ? (isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)") : "none",
        overflow: "hidden",
        position: "relative"
    };

    return (
        <section className="mb-16">
            <SectionHeading
                icon={<School />}
                title="Education"
                palette={palette}
                isApple={isApple}
            />
            <div className="flex flex-col gap-5">
                {education.map((edu, i) => (
                    <motion.div
                        key={edu.EducationID}
                        style={cardStyle}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: i * 0.07 }}>
                        <div
                            className="absolute inset-y-0 left-0 w-1"
                            style={{ background: "#30D158" }}
                        />
                        <div className="pl-5 pr-5 py-5">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div className="flex items-start gap-3">
                                    {edu.Logo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={edu.Logo}
                                            alt={edu.Institution}
                                            className="w-10 h-10 rounded-xl object-cover border"
                                            style={{
                                                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black"
                                            style={{
                                                background: "#30D15820",
                                                color: "#30D158"
                                            }}>
                                            {edu.Institution[0]}
                                        </div>
                                    )}
                                    <div>
                                        <h3
                                            className={isApple ? "text-base font-semibold" : "text-lg font-bold"}
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {edu.Degree} — {edu.FieldOfStudy}
                                        </h3>
                                        <p
                                            className="text-sm font-medium"
                                            style={{ color: "#30D158" }}>
                                            {edu.Institution}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p
                                        className="text-xs font-semibold"
                                        style={{ color: palette.textTertiary }}>
                                        {fmtRange(edu.StartDate, edu.EndDate, edu.CurrentlyStudying)}
                                    </p>
                                    {edu.Grade && (
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                                            style={{
                                                background: "#30D15820",
                                                color: "#30D158"
                                            }}>
                                            {edu.Grade}
                                            {edu.MaxGrade ? `/${edu.MaxGrade}` : ""}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {edu.Location && (
                                <div
                                    className="flex items-center gap-1 mt-2"
                                    style={{ color: palette.textTertiary }}>
                                    <LocationOn style={{ fontSize: 12 }} />
                                    <span className="text-xs">{edu.Location}</span>
                                </div>
                            )}
                            {edu.Description && (
                                <p
                                    className="mt-3 text-sm leading-relaxed"
                                    style={{ color: palette.textSecondary }}>
                                    {edu.Description}
                                </p>
                            )}
                            {edu.Achievements.length > 0 && (
                                <ul className="mt-3 space-y-1">
                                    {edu.Achievements.map((a, j) => (
                                        <li
                                            key={j}
                                            className="text-sm flex gap-2"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            <Star
                                                style={{
                                                    fontSize: 14,
                                                    color: "#FF9F0A",
                                                    flexShrink: 0
                                                }}
                                            />
                                            {a}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// ─────────────────────────── Certificates Section ───────────────────────────

function CertificatesSection({
    certificates,
    palette,
    isDark,
    isApple
}: {
    certificates: Certificate[];
    palette: any;
    isDark: boolean;
    isApple: boolean;
}) {
    const cardStyle: React.CSSProperties = {
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
        boxShadow: isApple ? (isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)") : "none",
        overflow: "hidden",
        position: "relative"
    };

    return (
        <section className="mb-16">
            <SectionHeading
                icon={<VerifiedUser />}
                title="Licences & Certifications"
                palette={palette}
                isApple={isApple}
            />
            <div className="grid md:grid-cols-2 gap-5">
                {certificates.map((cert, i) => (
                    <motion.div
                        key={cert.CertificateID}
                        style={cardStyle}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}>
                        <div
                            className="absolute inset-y-0 left-0 w-1"
                            style={{ background: "#BF5AF2" }}
                        />
                        <div className="pl-5 pr-5 py-5">
                            <div className="flex items-start gap-3">
                                {cert.Logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={cert.Logo}
                                        alt={cert.IssuingOrganization}
                                        className="w-10 h-10 rounded-xl object-cover border"
                                        style={{
                                            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
                                        style={{
                                            background: "#BF5AF220",
                                            color: "#BF5AF2"
                                        }}>
                                        {cert.IssuingOrganization[0]}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className={isApple ? "text-sm font-semibold leading-snug" : "text-base font-bold leading-snug"}
                                        style={{ color: palette.textPrimary }}>
                                        {cert.Title}
                                    </h3>
                                    <p
                                        className="text-xs font-medium mt-0.5"
                                        style={{ color: "#BF5AF2" }}>
                                        {cert.IssuingOrganization}
                                    </p>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: palette.textTertiary }}>
                                        Issued {fmtDate(cert.IssuedDate)}
                                        {!cert.NoExpiry && cert.ExpiryDate && ` · Exp ${fmtDate(cert.ExpiryDate)}`}
                                        {cert.NoExpiry && " · No Expiry"}
                                    </p>
                                </div>
                            </div>
                            {cert.Description && (
                                <p
                                    className="mt-3 text-xs leading-relaxed"
                                    style={{ color: palette.textSecondary }}>
                                    {cert.Description}
                                </p>
                            )}
                            {cert.Skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {cert.Skills.map((s) => (
                                        <span
                                            key={s}
                                            className="px-2 py-0.5 rounded-full text-xs"
                                            style={{
                                                background: "#BF5AF215",
                                                color: "#BF5AF2",
                                                border: "0.5px solid #BF5AF230"
                                            }}>
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {cert.CredentialURL && (
                                <a
                                    href={cert.CredentialURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold w-fit"
                                    style={{ color: "#BF5AF2" }}>
                                    <OpenInNew style={{ fontSize: 12 }} /> Show credential
                                </a>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// ─────────────────────────── Main Component ───────────────────────────

interface Props {
    experience: Experience[];
    skills: Skill[];
    education: Education[];
    certificates: Certificate[];
}

export default function ExperienceView({ experience, skills, education, certificates }: Props) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const totalYears = useMemo(() => {
        const months = experience.reduce((sum, e) => sum + monthsDiff(e.StartDate, e.EndDate, e.CurrentlyWorking), 0);
        return Math.round(months / 12);
    }, [experience]);

    const statCardBg: React.CSSProperties = {
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
        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none"
    };

    const stats = [
        {
            label: "Years of Experience",
            value: `${totalYears}+`,
            color: "#0A84FF"
        },
        { label: "Companies", value: experience.length, color: "#30D158" },
        { label: "Skills", value: skills.length, color: "#BF5AF2" },
        {
            label: "Certifications",
            value: certificates.length,
            color: "#FF9F0A"
        }
    ];

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                {/* Header */}
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}>
                    <h1
                        className={isApple ? "text-4xl md:text-5xl font-bold mb-3" : "text-5xl md:text-6xl font-black mb-3"}
                        style={{ color: palette.textPrimary }}>
                        Experience
                    </h1>
                    <p
                        className={isApple ? "text-lg" : "text-xl font-medium"}
                        style={{ color: palette.textSecondary }}>
                        Professional background, technical skills, education and certifications.
                    </p>

                    <div className="flex flex-wrap gap-3 mt-4">
                        <a
                            href="/timeline"
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#fff"
                            }}>
                            View Timeline
                        </a>
                        <a
                            href="/admin/resume"
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                            style={{
                                background: "transparent",
                                color: palette.textSecondary,
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`
                            }}>
                            <Download fontSize="small" /> Download Resume
                        </a>
                    </div>
                </motion.div>

                {/* Stats overview */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}>
                    {stats.map((s, i) => (
                        <div
                            key={s.label}
                            style={statCardBg}
                            className="p-5 text-center">
                            <p
                                className={isApple ? "text-3xl font-bold" : "text-4xl font-black"}
                                style={{ color: s.color }}>
                                {s.value}
                            </p>
                            <p
                                className="text-xs mt-1"
                                style={{ color: palette.textTertiary }}>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </motion.div>

                {experience.length > 0 && (
                    <ExperienceSection
                        experience={experience}
                        palette={palette}
                        isDark={isDark}
                        isApple={isApple}
                    />
                )}
                {skills.length > 0 && (
                    <SkillsSection
                        skills={skills}
                        palette={palette}
                        isDark={isDark}
                        isApple={isApple}
                    />
                )}
                {education.length > 0 && (
                    <EducationSection
                        education={education}
                        palette={palette}
                        isDark={isDark}
                        isApple={isApple}
                    />
                )}
                {certificates.length > 0 && (
                    <CertificatesSection
                        certificates={certificates}
                        palette={palette}
                        isDark={isDark}
                        isApple={isApple}
                    />
                )}
            </div>
        </div>
    );
}
