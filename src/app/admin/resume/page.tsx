/**
 * Admin Resume Builder
 * Select portfolio items → preview → generate PDF (jsPDF + html2canvas)
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Config } from "@Config/Client";
import {
    PictureAsPdf,
    Refresh,
    CheckBox,
    CheckBoxOutlineBlank,
    Preview,
    Code,
    School,
    Work,
    WorkspacePremium,
    EmojiEvents,
    Folder,
    ExpandMore,
    ExpandLess
} from "@mui/icons-material";

/* ───────── Types ───────── */
interface SelectionState {
    skills: Set<string>;
    education: Set<string>;
    experience: Set<string>;
    certificates: Set<string>;
    testScores: Set<string>;
    projects: Set<string>;
}

type Category = keyof SelectionState;

interface DataState {
    skills: any[];
    education: any[];
    experience: any[];
    certificates: any[];
    testScores: any[];
    projects: any[];
}

/* ───────── Section config ───────── */
const SECTIONS: { key: Category; label: string; api: string; idField: string; display: (item: any) => string; icon: React.ReactNode }[] = [
    { key: "projects",     label: "Projects",        api: "/api/admin/projects",     idField: "ProjectID",     display: i => i.Title,                   icon: <Folder fontSize="small" /> },
    { key: "skills",       label: "Skills",          api: "/api/admin/skills",       idField: "SkillID",       display: i => `${i.Name} (${i.Proficiency}%)`,icon: <Code fontSize="small" /> },
    { key: "education",    label: "Education",       api: "/api/admin/education",    idField: "EducationID",   display: i => `${i.Degree} — ${i.Institution}`,icon: <School fontSize="small" /> },
    { key: "experience",   label: "Experience",      api: "/api/admin/experience",   idField: "ExperienceID",  display: i => `${i.Role} @ ${i.Company}`,icon: <Work fontSize="small" /> },
    { key: "certificates", label: "Certificates",    api: "/api/admin/certificates", idField: "CertificateID", display: i => i.Title,                   icon: <WorkspacePremium fontSize="small" /> },
    { key: "testScores",   label: "Test Scores",     api: "/api/admin/test-scores",  idField: "TestScoreID",   display: i => `${i.ExamName} ${i.Year}`, icon: <EmojiEvents fontSize="small" /> },
];

/* ───────── Helper: toggle all ───────── */
function toggleAll(set: Set<string>, ids: string[]): Set<string> {
    if (ids.every(id => set.has(id))) {
        const next = new Set(set);
        ids.forEach(id => next.delete(id));
        return next;
    }
    return new Set([...set, ...ids]);
}

/* ───────── Main Component ───────── */
export default function ResumeBuilderPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const previewRef = useRef<HTMLDivElement>(null);

    const [data, setData] = useState<DataState>({
        skills: [], education: [], experience: [],
        certificates: [], testScores: [], projects: []
    });
    const [loadingData, setLoadingData] = useState(true);
    const [selection, setSelection] = useState<SelectionState>({
        skills: new Set(), education: new Set(), experience: new Set(),
        certificates: new Set(), testScores: new Set(), projects: new Set()
    });
    const [collapsed, setCollapsed] = useState<Partial<Record<Category, boolean>>>({});
    const [generating, setGenerating] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Meta fields for the resume header
    const [meta, setMeta] = useState({
        name: "Meet Bhingradiya",
        title: "Full Stack Developer",
        email: "",
        phone: "",
        location: "Surat, Gujarat, India",
        website: Config.Origin,
        github: "https://github.com/MeetBhingradiya",
        linkedin: "",
        summary: "Passionate full-stack developer with expertise in modern web technologies and a focus on building scalable, user-centric applications."
    });

    /* Fetch all data */
    const fetchAll = useCallback(async () => {
        setLoadingData(true);
        try {
            const results = await Promise.all(
                SECTIONS.map(async s => {
                    const res = await fetch(`${s.api}?limit=100`);
                    const json = await res.json();
                    return { key: s.key, data: json.success ? json.data ?? [] : [] };
                })
            );
            const newData: any = {};
            results.forEach(r => { newData[r.key] = r.data; });
            setData(newData);
            // default: select all
            const newSel: any = {};
            results.forEach(r => {
                const sec = SECTIONS.find(s => s.key === r.key)!;
                newSel[r.key] = new Set(r.data.map((item: any) => item[sec.idField]));
            });
            setSelection(newSel);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const toggle = (category: Category, id: string) => {
        setSelection(prev => {
            const next = new Set(prev[category]);
            next.has(id) ? next.delete(id) : next.add(id);
            return { ...prev, [category]: next };
        });
    };

    const toggleSection = (category: Category) => {
        const sec = SECTIONS.find(s => s.key === category)!;
        const ids = (data as any)[category].map((item: any) => item[sec.idField]) as string[];
        setSelection(prev => ({ ...prev, [category]: toggleAll(prev[category], ids) }));
    };

    /* PDF generation via html2canvas + jsPDF */
    const handleGeneratePDF = async () => {
        if (!previewRef.current) return;
        setGenerating(true);
        try {
            const [html2canvas, { jsPDF }] = await Promise.all([
                import("html2canvas").then(m => m.default),
                import("jspdf")
            ]);
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = pdfHeight;
            let position = 0;
            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            pdf.save(`${meta.name.replace(/\s+/g, "_")}_Resume.pdf`);
        } finally {
            setGenerating(false);
        }
    };

    // Style helpers
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.95)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        color: palette.textPrimary,
        padding: "8px 12px",
        outline: "none",
        width: "100%",
        fontSize: "13px"
    };

    /* Compute selected items for preview */
    const selectedData: DataState = {
        skills:       data.skills.filter(i => selection.skills.has(i.SkillID)),
        education:    data.education.filter(i => selection.education.has(i.EducationID)),
        experience:   data.experience.filter(i => selection.experience.has(i.ExperienceID)),
        certificates: data.certificates.filter(i => selection.certificates.has(i.CertificateID)),
        testScores:   data.testScores.filter(i => selection.testScores.has(i.TestScoreID)),
        projects:     data.projects.filter(i => selection.projects.has(i.ProjectID)),
    };

    return (
        <div className="p-6" style={{ minHeight: "100vh", background: palette.background }}>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: palette.textPrimary }}>Resume Builder</h1>
                    <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>
                        Select portfolio items → preview → download PDF
                    </p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                        whileHover={{ scale: 1.03 }}
                        onClick={fetchAll}
                    >
                        <Refresh fontSize="small" /> Reload Data
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{
                            background: previewMode ? `${palette.accent}20` : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: previewMode ? palette.accent : palette.textSecondary
                        }}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setPreviewMode(!previewMode)}
                    >
                        <Preview fontSize="small" /> Preview
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: palette.accent, color: "#fff", opacity: generating ? 0.7 : 1 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGeneratePDF}
                        disabled={generating}
                    >
                        <PictureAsPdf fontSize="small" />
                        {generating ? "Generating…" : "Download PDF"}
                    </motion.button>
                </div>
            </div>

            <div className={`flex gap-6 ${previewMode ? "flex-col xl:flex-row" : "flex-col"}`}>
                {/* Left: Controls */}
                <div className={previewMode ? "xl:w-96 flex-shrink-0" : "w-full"}>
                    {/* Meta info */}
                    <div className="rounded-2xl p-5 mb-4" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <h2 className="text-sm font-black uppercase tracking-wide mb-4" style={{ color: palette.textTertiary }}>
                            Resume Header
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.entries(meta) as [string, string][]).map(([k, v]) => (
                                k === "summary" ? (
                                    <div key={k} className="col-span-2">
                                        <label className="block text-xs font-semibold mb-1 capitalize" style={{ color: palette.textTertiary }}>{k}</label>
                                        <textarea
                                            value={v}
                                            rows={3}
                                            onChange={e => setMeta(prev => ({ ...prev, [k]: e.target.value }))}
                                            style={{ ...inputStyle, resize: "vertical" }}
                                        />
                                    </div>
                                ) : (
                                    <div key={k}>
                                        <label className="block text-xs font-semibold mb-1 capitalize" style={{ color: palette.textTertiary }}>{k}</label>
                                        <input
                                            value={v}
                                            onChange={e => setMeta(prev => ({ ...prev, [k]: e.target.value }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Section selectors */}
                    {loadingData ? (
                        <div className="text-center py-8" style={{ color: palette.textTertiary }}>Loading portfolio data…</div>
                    ) : (
                        SECTIONS.map(sec => {
                            const items: any[] = (data as any)[sec.key];
                            const allSelected = items.every(i => selection[sec.key].has(i[sec.idField]));
                            const isCollapsed = !!collapsed[sec.key];
                            return (
                                <div key={sec.key} className="rounded-2xl mb-3 overflow-hidden"
                                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer"
                                        onClick={() => setCollapsed(p => ({ ...p, [sec.key]: !p[sec.key] }))}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span style={{ color: palette.accent }}>{sec.icon}</span>
                                            <span className="text-sm font-bold" style={{ color: palette.textPrimary }}>{sec.label}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                                                style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                                {selection[sec.key].size}/{items.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                className="text-xs px-2 py-1 rounded-lg font-semibold"
                                                style={{
                                                    background: allSelected ? `${palette.accent}18` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                    color: allSelected ? palette.accent : palette.textTertiary
                                                }}
                                                onClick={e => { e.stopPropagation(); toggleSection(sec.key); }}
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                {allSelected ? "Deselect All" : "Select All"}
                                            </motion.button>
                                            {isCollapsed ? <ExpandMore fontSize="small" style={{ color: palette.textTertiary }} />
                                                : <ExpandLess fontSize="small" style={{ color: palette.textTertiary }} />}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                exit={{ height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t px-4 pb-3 pt-2 space-y-1" style={{ borderColor }}>
                                                    {items.length === 0 ? (
                                                        <p className="text-xs py-2" style={{ color: palette.textTertiary }}>
                                                            No {sec.label.toLowerCase()} added yet
                                                        </p>
                                                    ) : items.map(item => {
                                                        const id = item[sec.idField];
                                                        const checked = selection[sec.key].has(id);
                                                        return (
                                                            <motion.div
                                                                key={id}
                                                                className="flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer"
                                                                whileHover={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
                                                                onClick={() => toggle(sec.key, id)}
                                                            >
                                                                {checked
                                                                    ? <CheckBox style={{ color: palette.accent, fontSize: 18 }} />
                                                                    : <CheckBoxOutlineBlank style={{ color: palette.textTertiary, fontSize: 18 }} />
                                                                }
                                                                <span className="text-sm" style={{ color: checked ? palette.textPrimary : palette.textTertiary }}>
                                                                    {sec.display(item)}
                                                                </span>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right: Resume Preview */}
                {previewMode && (
                    <div className="flex-1 min-w-0">
                        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                            <ResumePreview ref={previewRef} meta={meta} data={selectedData} />
                        </div>
                    </div>
                )}
            </div>

            {/* Generate PDF button (also shown at bottom when preview is hidden) */}
            {!previewMode && (
                <div className="mt-6 flex justify-end">
                    <motion.button
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
                        style={{ background: palette.accent, color: "#fff", opacity: generating ? 0.7 : 1 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setPreviewMode(true); }}
                        disabled={generating}
                    >
                        <Preview /> Preview & Download PDF
                    </motion.button>
                </div>
            )}
        </div>
    );
}

/* ───────── Resume Preview Template ───────── */
interface ResumePreviewProps {
    meta: {
        name: string; title: string; email: string; phone: string;
        location: string; website: string; github: string; linkedin: string; summary: string;
    };
    data: DataState;
}

const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(
    function ResumePreview({ meta, data }, ref) {
        const fmtDate = (d?: string | Date) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "Present";

        return (
            <div
                ref={ref}
                style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    background: "#ffffff",
                    color: "#111111",
                    padding: "40px 48px",
                    minHeight: "297mm",
                    width: "100%"
                }}
            >
                {/* Header */}
                <div style={{ borderBottom: "2px solid #007AFF", paddingBottom: "20px", marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, color: "#111" }}>{meta.name}</h1>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#007AFF", marginTop: "4px" }}>{meta.title}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px", fontSize: "12px", color: "#555" }}>
                        {meta.email && <span>✉ {meta.email}</span>}
                        {meta.phone && <span>📞 {meta.phone}</span>}
                        {meta.location && <span>📍 {meta.location}</span>}
                        {meta.website && <span>🌐 {meta.website}</span>}
                        {meta.github && <span>⌥ {meta.github}</span>}
                        {meta.linkedin && <span>💼 {meta.linkedin}</span>}
                    </div>
                </div>

                {/* Summary */}
                {meta.summary && (
                    <Section title="Summary">
                        <p style={{ fontSize: "13px", color: "#333", lineHeight: 1.6 }}>{meta.summary}</p>
                    </Section>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <Section title="Experience">
                        {data.experience.map(e => (
                            <div key={e.ExperienceID} style={{ marginBottom: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: "14px" }}>{e.Role}</span>
                                        <span style={{ color: "#007AFF", fontSize: "13px" }}> — {e.Company}</span>
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#888" }}>
                                        {fmtDate(e.StartDate)} – {e.CurrentlyWorking ? "Present" : fmtDate(e.EndDate)}
                                    </span>
                                </div>
                                {e.Location && <p style={{ fontSize: "11px", color: "#888", margin: "2px 0 4px" }}>{e.Location} · {e.EmploymentType?.replace("_", " ")}</p>}
                                {e.Description && <p style={{ fontSize: "12px", color: "#444", lineHeight: 1.5 }}>{e.Description}</p>}
                                {e.Achievements?.length > 0 && (
                                    <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "#444" }}>
                                        {e.Achievements.map((a: string, i: number) => <li key={i}>{a}</li>)}
                                    </ul>
                                )}
                                {e.TechStack?.length > 0 && (
                                    <TagList tags={e.TechStack} />
                                )}
                            </div>
                        ))}
                    </Section>
                )}

                {/* Projects */}
                {data.projects.length > 0 && (
                    <Section title="Projects">
                        {data.projects.map(p => (
                            <div key={p.ProjectID} style={{ marginBottom: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <span style={{ fontWeight: 700, fontSize: "14px" }}>{p.Title}</span>
                                    <span style={{ fontSize: "11px", color: "#888" }}>{p.Type?.replace("_", " ")}</span>
                                </div>
                                <p style={{ fontSize: "12px", color: "#444", margin: "3px 0 4px", lineHeight: 1.5 }}>{p.Description}</p>
                                {p.TechStack?.length > 0 && <TagList tags={p.TechStack} />}
                                {p.Links?.github && <span style={{ fontSize: "11px", color: "#007AFF" }}>{p.Links.github}</span>}
                            </div>
                        ))}
                    </Section>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <Section title="Education">
                        {data.education.map(e => (
                            <div key={e.EducationID} style={{ marginBottom: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: "14px" }}>{e.Degree}</span>
                                        <span style={{ color: "#555", fontSize: "13px" }}> in {e.FieldOfStudy}</span>
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#888" }}>
                                        {fmtDate(e.StartDate)} – {e.CurrentlyStudying ? "Present" : fmtDate(e.EndDate)}
                                    </span>
                                </div>
                                <p style={{ fontSize: "12px", color: "#555", margin: "2px 0" }}>{e.Institution}</p>
                                {e.Grade && <p style={{ fontSize: "11px", color: "#888" }}>Grade: {e.Grade}{e.MaxGrade ? `/${e.MaxGrade}` : ""}</p>}
                            </div>
                        ))}
                    </Section>
                )}

                {/* Skills */}
                {data.skills.length > 0 && (
                    <Section title="Skills">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {data.skills.map(s => (
                                <span key={s.SkillID} style={{
                                    background: "#e8f0fe",
                                    color: "#1a73e8",
                                    padding: "3px 10px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: 600
                                }}>
                                    {s.Name} {s.Proficiency >= 80 ? "●" : s.Proficiency >= 60 ? "◕" : "◑"}
                                </span>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Certificates */}
                {data.certificates.length > 0 && (
                    <Section title="Certifications">
                        {data.certificates.map(c => (
                            <div key={c.CertificateID} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: "13px" }}>{c.Title}</span>
                                    <span style={{ color: "#555", fontSize: "12px" }}> · {c.IssuingOrganization}</span>
                                </div>
                                <span style={{ fontSize: "11px", color: "#888" }}>{fmtDate(c.IssuedDate)}</span>
                            </div>
                        ))}
                    </Section>
                )}

                {/* Test Scores */}
                {data.testScores.length > 0 && (
                    <Section title="Test Scores & Rankings">
                        {data.testScores.map(t => (
                            <div key={t.TestScoreID} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: "13px" }}>{t.ExamName} {t.Year}</span>
                                    {t.Subject && <span style={{ color: "#555", fontSize: "12px" }}> ({t.Subject})</span>}
                                </div>
                                <span style={{ fontSize: "12px", color: "#111", fontWeight: 600 }}>
                                    {t.Score}{t.MaxScore ? `/${t.MaxScore}` : ""}
                                    {t.Percentile ? ` · P${t.Percentile}` : ""}
                                    {t.Rank ? ` · Rank ${t.Rank}` : ""}
                                </span>
                            </div>
                        ))}
                    </Section>
                )}
            </div>
        );
    }
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "22px" }}>
            <h2 style={{
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                color: "#007AFF",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "4px",
                marginBottom: "10px"
            }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

function TagList({ tags }: { tags: string[] }) {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
            {tags.slice(0, 10).map((tag, i) => (
                <span key={i} style={{
                    background: "#f1f3f4",
                    color: "#444",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px"
                }}>
                    {tag}
                </span>
            ))}
        </div>
    );
}
