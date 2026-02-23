/**
 * TimelineView — Client Component
 * Merges Education, Experience, Certificates and TestScores into a
 * single vertical timeline sorted by date (newest first).
 * Supports category filter tabs.
 */

"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    School, Work, VerifiedUser, EmojiEvents,
    LocationOn, OpenInNew, Star
} from "@mui/icons-material";

// ─────────────────────────── Types ───────────────────────────

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

interface Certificate {
    CertificateID: string;
    Title: string;
    IssuingOrganization: string;
    IssuedDate: string;
    ExpiryDate?: string;
    NoExpiry: boolean;
    CredentialURL?: string;
    Description?: string;
    Skills: string[];
    Logo?: string;
}

interface TestScore {
    TestScoreID: string;
    ExamName: string;
    ExamType: string;
    Score: string;
    MaxScore?: string;
    Percentile?: number;
    Rank?: string;
    Year: number;
    Subject?: string;
    Description?: string;
    Proofs: string[];
    CertificateURL?: string;
}

type EventKind = "experience" | "education" | "certificate" | "testscore";

interface TimelineEvent {
    id: string;
    kind: EventKind;
    date: Date;
    endDate?: Date;
    current: boolean;
    data: Education | Experience | Certificate | TestScore;
}

// ─────────────────────────── Helpers ───────────────────────────

function fmtDate(d?: string | Date, fallback = "Present") {
    if (!d) return fallback;
    return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function fmtRange(start?: string | Date, end?: string | Date, current?: boolean) {
    return `${fmtDate(start)} – ${current ? "Present" : fmtDate(end)}`;
}

function employmentLabel(t: string) {
    return ({
        full_time: "Full-time", part_time: "Part-time", contract: "Contract",
        freelance: "Freelance", internship: "Internship", volunteer: "Volunteer",
        self_employed: "Self-employed"
    } as Record<string, string>)[t] ?? t;
}

const KIND_META: Record<EventKind, { label: string; icon: React.ReactNode; color: string }> = {
    experience:   { label: "Experience",    icon: <Work />,          color: "#0A84FF" },
    education:    { label: "Education",     icon: <School />,        color: "#30D158" },
    certificate:  { label: "Certificate",   icon: <VerifiedUser />,  color: "#BF5AF2" },
    testscore:    { label: "Test Score",    icon: <EmojiEvents />,   color: "#FF9F0A" }
};

// ─────────────────────────── Event Cards ───────────────────────────

interface EventCardProps {
    event: TimelineEvent;
    palette: any;
    isDark: boolean;
    isApple: boolean;
}

function ExperienceEventCard({ event, palette, isDark, isApple }: EventCardProps) {
    const exp = event.data as Experience;
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                    <h3 className={isApple ? "text-base font-semibold" : "text-lg font-bold"}
                        style={{ color: palette.textPrimary }}>
                        {exp.Role}
                    </h3>
                    <a href={exp.CompanyWebsite ?? "#"} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm font-medium hover:underline"
                        style={{ color: "#0A84FF" }}>
                        {exp.Company}
                        {exp.CompanyWebsite && <OpenInNew style={{ fontSize: 12 }} />}
                    </a>
                </div>
                <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#0A84FF20", color: "#0A84FF" }}>
                        {employmentLabel(exp.EmploymentType)}
                    </span>
                    {exp.Location && (
                        <div className="flex items-center gap-1 mt-1 justify-end" style={{ color: palette.textTertiary }}>
                            <LocationOn style={{ fontSize: 12 }} />
                            <span className="text-xs">{exp.Location} · {exp.LocationType}</span>
                        </div>
                    )}
                </div>
            </div>
            {exp.Description && (
                <p className="text-sm leading-relaxed" style={{ color: palette.textSecondary }}>{exp.Description}</p>
            )}
            {exp.TechStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {exp.TechStack.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: "#0A84FF15", color: "#0A84FF", border: "0.5px solid #0A84FF30" }}>
                            {t}
                        </span>
                    ))}
                </div>
            )}
            {(exp.Responsibilities.length > 0 || exp.Achievements.length > 0) && (
                <button onClick={() => setExpanded(v => !v)}
                    className="text-xs font-semibold text-left" style={{ color: palette.accent }}>
                    {expanded ? "Show less ▲" : "Show more ▼"}
                </button>
            )}
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        {exp.Responsibilities.length > 0 && (
                            <div className="mt-1">
                                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: palette.textTertiary }}>Responsibilities</p>
                                <ul className="space-y-1">
                                    {exp.Responsibilities.map((r, i) => (
                                        <li key={i} className="text-sm flex gap-2" style={{ color: palette.textSecondary }}>
                                            <span style={{ color: "#0A84FF" }}>•</span>{r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {exp.Achievements.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: palette.textTertiary }}>Achievements</p>
                                <ul className="space-y-1">
                                    {exp.Achievements.map((a, i) => (
                                        <li key={i} className="text-sm flex gap-2" style={{ color: palette.textSecondary }}>
                                            <Star style={{ fontSize: 14, color: "#FF9F0A" }} />{a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function EducationEventCard({ event, palette, isDark, isApple }: EventCardProps) {
    const edu = event.data as Education;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                    <h3 className={isApple ? "text-base font-semibold" : "text-lg font-bold"}
                        style={{ color: palette.textPrimary }}>
                        {edu.Degree} — {edu.FieldOfStudy}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: "#30D158" }}>{edu.Institution}</p>
                </div>
                {edu.Grade && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "#30D15820", color: "#30D158" }}>
                        {edu.Grade}{edu.MaxGrade ? ` / ${edu.MaxGrade}` : ""}
                    </span>
                )}
            </div>
            {edu.Location && (
                <div className="flex items-center gap-1" style={{ color: palette.textTertiary }}>
                    <LocationOn style={{ fontSize: 12 }} />
                    <span className="text-xs">{edu.Location}</span>
                </div>
            )}
            {edu.Description && (
                <p className="text-sm leading-relaxed" style={{ color: palette.textSecondary }}>{edu.Description}</p>
            )}
            {edu.Achievements.length > 0 && (
                <ul className="space-y-1">
                    {edu.Achievements.map((a, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: palette.textSecondary }}>
                            <Star style={{ fontSize: 12, color: "#FF9F0A" }} />{a}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function CertificateEventCard({ event, palette, isDark, isApple }: EventCardProps) {
    const cert = event.data as Certificate;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                    <h3 className={isApple ? "text-base font-semibold" : "text-lg font-bold"}
                        style={{ color: palette.textPrimary }}>
                        {cert.Title}
                    </h3>
                    <p className="text-sm" style={{ color: "#BF5AF2" }}>{cert.IssuingOrganization}</p>
                </div>
                {cert.CredentialURL && (
                    <a href={cert.CredentialURL} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                        style={{ background: "#BF5AF220", color: "#BF5AF2", border: "0.5px solid #BF5AF240" }}>
                        <OpenInNew style={{ fontSize: 12 }} /> Verify
                    </a>
                )}
            </div>
            {cert.Description && (
                <p className="text-sm leading-relaxed" style={{ color: palette.textSecondary }}>{cert.Description}</p>
            )}
            {cert.Skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {cert.Skills.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: "#BF5AF215", color: "#BF5AF2", border: "0.5px solid #BF5AF230" }}>
                            {s}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function TestScoreEventCard({ event, palette, isDark, isApple }: EventCardProps) {
    const ts = event.data as TestScore;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                    <h3 className={isApple ? "text-base font-semibold" : "text-lg font-bold"}
                        style={{ color: palette.textPrimary }}>
                        {ts.ExamName} {ts.Year}
                    </h3>
                    {ts.Subject && (
                        <p className="text-sm" style={{ color: palette.textSecondary }}>{ts.Subject}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xl font-black" style={{ color: "#FF9F0A" }}>
                        {ts.Score}{ts.MaxScore ? `/${ts.MaxScore}` : ""}
                    </p>
                    {ts.Percentile != null && (
                        <p className="text-xs" style={{ color: palette.textTertiary }}>{ts.Percentile}th percentile</p>
                    )}
                    {ts.Rank && (
                        <p className="text-xs" style={{ color: palette.textTertiary }}>Rank {ts.Rank}</p>
                    )}
                </div>
            </div>
            {ts.Description && (
                <p className="text-sm leading-relaxed" style={{ color: palette.textSecondary }}>{ts.Description}</p>
            )}
            {ts.CertificateURL && (
                <a href={ts.CertificateURL} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: "#FF9F0A" }}>
                    <OpenInNew style={{ fontSize: 12 }} /> View Certificate
                </a>
            )}
            {ts.Proofs.length > 0 && (
                <div className="mt-1">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>Proof Screenshots</p>
                    <div className="flex flex-wrap gap-2">
                        {ts.Proofs.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Proof ${i + 1}`}
                                    className="w-24 h-16 object-cover rounded-lg border"
                                    style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────── Timeline Item ───────────────────────────

function TimelineItem({ event, palette, isDark, isApple, index }: EventCardProps & { index: number }) {
    const meta = KIND_META[event.kind];

    const cardBg: React.CSSProperties = {
        background: isApple
            ? isDark ? "linear-gradient(180deg,rgba(58,58,60,0.6) 0%,rgba(44,44,46,0.55) 100%)"
                : "linear-gradient(180deg,rgba(255,255,255,0.65) 0%,rgba(250,250,250,0.6) 100%)"
            : isDark ? "rgba(26,26,30,0.95)" : "#fff",
        border: isApple
            ? isDark ? "0.5px solid rgba(255,255,255,0.12)" : "0.5px solid rgba(255,255,255,0.8)"
            : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: isApple ? "20px" : "24px",
        backdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
        boxShadow: isApple ? (isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)") : "none"
    };

    return (
        <motion.div
            className="flex gap-4 md:gap-6"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3) }}>

            {/* Stem column: icon + continuous line */}
            <div className="flex flex-col items-center flex-shrink-0 w-10">
                {/* Icon bubble */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0"
                    style={{ background: meta.color, color: "#fff", boxShadow: `0 0 0 5px ${meta.color}22` }}>
                    {meta.icon}
                </div>
                {/* Vertical line — full height: card + spacer */}
                <div className="flex-1 w-px mt-2"
                    style={{ background: `linear-gradient(to bottom, ${meta.color}50, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"})` }} />
            </div>

            {/* Card + inter-card spacer (line runs through both) */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Card */}
                <div style={cardBg}>
                    {/* Card header */}
                    <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>
                            {meta.label}
                        </span>
                        {event.current && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                style={{ background: "#30D15820", color: "#30D158" }}>
                                ● Current
                            </span>
                        )}
                        <span className="text-xs ml-auto" style={{ color: palette.textTertiary }}>
                            {fmtRange(event.date, event.endDate, event.current)}
                        </span>
                    </div>
                    {/* Card content */}
                    <div className="px-5 py-4">
                        {event.kind === "experience"  && <ExperienceEventCard event={event} palette={palette} isDark={isDark} isApple={isApple} />}
                        {event.kind === "education"   && <EducationEventCard event={event} palette={palette} isDark={isDark} isApple={isApple} />}
                        {event.kind === "certificate" && <CertificateEventCard event={event} palette={palette} isDark={isDark} isApple={isApple} />}
                        {event.kind === "testscore"   && <TestScoreEventCard event={event} palette={palette} isDark={isDark} isApple={isApple} />}
                    </div>
                </div>
                {/* Spacer below card — line runs through this in the stem column */}
                <div className="h-8" />
            </div>
        </motion.div>
    );
}

// ─────────────────────────── Main Component ───────────────────────────

interface Props {
    education: Education[];
    experience: Experience[];
    certificates: Certificate[];
    testScores: TestScore[];
}

const ALL_KINDS: EventKind[] = ["experience", "education", "certificate", "testscore"];

export default function TimelineView({ education, experience, certificates, testScores }: Props) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [activeKinds, setActiveKinds] = useState<Set<EventKind>>(new Set());

    const toggleKind = (k: EventKind) => setActiveKinds(prev => {
        const next = new Set(prev);
        next.has(k) ? next.delete(k) : next.add(k);
        return next;
    });

    const events: TimelineEvent[] = useMemo(() => {
        const all: TimelineEvent[] = [
            ...experience.map(e => ({
                id: e.ExperienceID,
                kind: "experience" as EventKind,
                date: new Date(e.StartDate),
                endDate: e.EndDate ? new Date(e.EndDate) : undefined,
                current: e.CurrentlyWorking,
                data: e
            })),
            ...education.map(e => ({
                id: e.EducationID,
                kind: "education" as EventKind,
                date: new Date(e.StartDate),
                endDate: e.EndDate ? new Date(e.EndDate) : undefined,
                current: e.CurrentlyStudying,
                data: e
            })),
            ...certificates.map(c => ({
                id: c.CertificateID,
                kind: "certificate" as EventKind,
                date: new Date(c.IssuedDate),
                endDate: c.ExpiryDate ? new Date(c.ExpiryDate) : undefined,
                current: false,
                data: c
            })),
            ...testScores.map(t => ({
                id: t.TestScoreID,
                kind: "testscore" as EventKind,
                date: new Date(t.Year, 0, 1),
                current: false,
                data: t
            }))
        ];
        return all.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [education, experience, certificates, testScores]);

    const visible = useMemo(() =>
        activeKinds.size === 0 ? events : events.filter(e => activeKinds.has(e.kind)),
        [events, activeKinds]
    );

    const cardBg: React.CSSProperties = {
        background: isApple
            ? isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)"
            : isDark ? "rgba(24,24,28,0.95)" : "rgba(255,255,255,0.95)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: isApple ? "20px" : "28px",
        backdropFilter: isApple ? "blur(30px) saturate(180%)" : "none",
        WebkitBackdropFilter: isApple ? "blur(30px) saturate(180%)" : "none"
    };

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 md:px-8">

                {/* Header */}
                <motion.div className="mb-12"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className={isApple ? "text-4xl md:text-5xl font-bold mb-3" : "text-5xl md:text-6xl font-black mb-3"}
                        style={{ color: palette.textPrimary }}>
                        Timeline
                    </h1>
                    <p className={isApple ? "text-lg" : "text-xl font-medium"} style={{ color: palette.textSecondary }}>
                        A chronological record of education, work, certifications and achievements.
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div className="flex flex-wrap gap-2 mb-10 p-3" style={cardBg}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
                    <button onClick={() => setActiveKinds(new Set())}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                            background: activeKinds.size === 0 ? palette.accent : "transparent",
                            color: activeKinds.size === 0 ? "#fff" : palette.textSecondary,
                            border: `1px solid ${activeKinds.size === 0 ? palette.accent : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                        }}>
                        All ({events.length})
                    </button>
                    {ALL_KINDS.filter(k => events.some(e => e.kind === k)).map(k => {
                        const meta = KIND_META[k];
                        const active = activeKinds.has(k);
                        const count = events.filter(e => e.kind === k).length;
                        return (
                            <button key={k} onClick={() => toggleKind(k)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style={{
                                    background: active ? meta.color : "transparent",
                                    color: active ? "#fff" : palette.textSecondary,
                                    border: `1px solid ${active ? meta.color : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                }}>
                                {meta.icon} {meta.label} ({count})
                            </button>
                        );
                    })}
                </motion.div>

                {/* Timeline */}
                {visible.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-5xl mb-4">📅</p>
                        <p style={{ color: palette.textSecondary }} className="text-lg">Nothing to show yet.</p>
                    </div>
                ) : (
                    <div>
                        {visible.map((event, i) => (
                            <TimelineItem key={event.id} event={event} index={i}
                                palette={palette} isDark={isDark} isApple={isApple} />
                        ))}
                        {/* End cap */}
                        <div className="flex justify-center pt-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: palette.textTertiary }}>
                                ★
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
