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

interface ResumePreset {
    key: string;
    label: string;
    title: string;
    summary: string;
    keywordsByCategory: Partial<Record<Category, string[]>>;
    includeAll?: Category[];
    iconKey: "code" | "preview" | "work" | "school" | "folder";
    pinnedIdsByCategory?: Partial<Record<Category, string[]>>;
}

/* ───────── Section config ───────── */
const SECTIONS: {
    key: Category;
    label: string;
    api: string;
    idField: string;
    display: (item: any) => string;
    icon: React.ReactNode;
}[] = [
    {
        key: "projects",
        label: "Projects",
        api: "/api/admin/projects",
        idField: "ProjectID",
        display: (i) => i.Title,
        icon: <Folder fontSize="small" />
    },
    {
        key: "skills",
        label: "Skills",
        api: "/api/admin/skills",
        idField: "SkillID",
        display: (i) => `${i.Name} (${i.Proficiency}%)`,
        icon: <Code fontSize="small" />
    },
    {
        key: "education",
        label: "Education",
        api: "/api/admin/education",
        idField: "EducationID",
        display: (i) => `${i.Degree} — ${i.Institution}`,
        icon: <School fontSize="small" />
    },
    {
        key: "experience",
        label: "Experience",
        api: "/api/admin/experience",
        idField: "ExperienceID",
        display: (i) => `${i.Role} @ ${i.Company}`,
        icon: <Work fontSize="small" />
    },
    {
        key: "certificates",
        label: "Certificates",
        api: "/api/admin/certificates",
        idField: "CertificateID",
        display: (i) => i.Title,
        icon: <WorkspacePremium fontSize="small" />
    },
    {
        key: "testScores",
        label: "Test Scores",
        api: "/api/admin/test-scores",
        idField: "TestScoreID",
        display: (i) => `${i.ExamName} ${i.Year}`,
        icon: <EmojiEvents fontSize="small" />
    }
];

const DEFAULT_ROLE_PRESETS: ResumePreset[] = [
    {
        key: "fullstack",
        label: "Full Stack",
        title: "Full Stack Developer",
        summary: "Full stack developer focused on scalable frontend and backend systems, API design, and production-ready delivery.",
        keywordsByCategory: {
            skills: ["react", "next", "node", "typescript", "mongodb", "api", "full stack"],
            projects: ["dashboard", "api", "full stack", "admin", "auth", "cms"],
            experience: ["full stack", "developer", "web", "backend", "frontend"],
            certificates: ["web", "javascript", "node", "react"],
            testScores: ["programming", "coding", "aptitude"]
        },
        includeAll: ["education"],
        iconKey: "code"
    },
    {
        key: "frontend",
        label: "Frontend",
        title: "Frontend Developer",
        summary: "Frontend engineer crafting responsive, accessible, and high-performance interfaces using modern React ecosystems.",
        keywordsByCategory: {
            skills: ["react", "next", "tailwind", "css", "ui", "frontend", "typescript"],
            projects: ["landing", "ui", "frontend", "design", "theme", "portfolio"],
            experience: ["frontend", "ui", "design system", "react"],
            certificates: ["frontend", "ui", "web"]
        },
        includeAll: ["education"],
        iconKey: "preview"
    },
    {
        key: "backend",
        label: "Backend",
        title: "Backend Developer",
        summary: "Backend developer experienced in secure APIs, role-based systems, integrations, and robust data workflows.",
        keywordsByCategory: {
            skills: ["node", "api", "mongodb", "database", "security", "backend"],
            projects: ["api", "backend", "auth", "db", "sync", "server"],
            experience: ["backend", "api", "server", "integration", "database"],
            certificates: ["backend", "database", "security"]
        },
        includeAll: ["education"],
        iconKey: "work"
    }
];

function getPresetIcon(iconKey: ResumePreset["iconKey"]): React.ReactNode {
    switch (iconKey) {
        case "code":
            return <Code fontSize="small" />;
        case "preview":
            return <Preview fontSize="small" />;
        case "school":
            return <School fontSize="small" />;
        case "folder":
            return <Folder fontSize="small" />;
        case "work":
        default:
            return <Work fontSize="small" />;
    }
}

function slugifyPresetKey(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

function flattenToSearchText(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value.toLowerCase();
    if (typeof value === "number" || typeof value === "boolean") return String(value).toLowerCase();
    if (Array.isArray(value)) return value.map((v) => flattenToSearchText(v)).join(" ");
    if (typeof value === "object") return Object.values(value).map((v) => flattenToSearchText(v)).join(" ");
    return "";
}

function createEmptySelection(): SelectionState {
    return {
        skills: new Set(),
        education: new Set(),
        experience: new Set(),
        certificates: new Set(),
        testScores: new Set(),
        projects: new Set()
    };
}

function createSelectionFromPreset(data: DataState, preset: ResumePreset): SelectionState {
    const next = createEmptySelection();

    SECTIONS.forEach((section) => {
        const items = (data as any)[section.key] as any[];
        const pinned = preset.pinnedIdsByCategory?.[section.key] ?? [];
        const itemIds = new Set(items.map((item) => item[section.idField]));
        if (pinned.length > 0) {
            pinned.forEach((id) => {
                if (itemIds.has(id)) (next[section.key] as Set<string>).add(id);
            });
        }

        const keywords = preset.keywordsByCategory[section.key] ?? [];
        const includeAll = preset.includeAll?.includes(section.key) ?? false;

        items.forEach((item) => {
            const itemId = item[section.idField];
            if (itemId == null) return;
            if (includeAll) {
                (next[section.key] as Set<string>).add(itemId);
                return;
            }

            const searchable = flattenToSearchText(item);
            if (keywords.some((k) => searchable.includes(k.toLowerCase()))) {
                (next[section.key] as Set<string>).add(itemId);
            }
        });
    });

    // Keep output usable even when keyword matching is too strict.
    if (next.experience.size === 0) {
        data.experience.slice(0, 2).forEach((i) => next.experience.add(i.ExperienceID));
    }
    if (next.projects.size === 0) {
        data.projects.slice(0, 3).forEach((i) => next.projects.add(i.ProjectID));
    }
    if (next.skills.size === 0) {
        data.skills.slice(0, 8).forEach((i) => next.skills.add(i.SkillID));
    }
    if (next.education.size === 0) {
        data.education.slice(0, 2).forEach((i) => next.education.add(i.EducationID));
    }

    return next;
}

/* ───────── Helper: toggle all ───────── */
function toggleAll(set: Set<string>, ids: string[]): Set<string> {
    if (ids.every((id) => set.has(id))) {
        const next = new Set(set);
        ids.forEach((id) => next.delete(id));
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

    const [ds, setDs] = useState<{ data: DataState; loading: boolean }>({
        data: {
            skills: [],
            education: [],
            experience: [],
            certificates: [],
            testScores: [],
            projects: []
        },
        loading: true
    });
    const patchDs = useCallback((p: Partial<{ data: DataState; loading: boolean }>) => setDs((s) => ({ ...s, ...p })), []);
    const [selection, setSelection] = useState<SelectionState>({
        skills: new Set(),
        education: new Set(),
        experience: new Set(),
        certificates: new Set(),
        testScores: new Set(),
        projects: new Set()
    });
    const [collapsed, setCollapsed] = useState<Partial<Record<Category, boolean>>>({});
    const [ui, setUi] = useState({ generating: false, previewMode: false });
    const patchUi = useCallback((p: Partial<{ generating: boolean; previewMode: boolean }>) => setUi((s) => ({ ...s, ...p })), []);
    const [activePresetKey, setActivePresetKey] = useState<string>("");
    const [pendingPresetPdfName, setPendingPresetPdfName] = useState<string | null>(null);
    const [presets, setPresets] = useState<ResumePreset[]>(DEFAULT_ROLE_PRESETS);
    const [presetState, setPresetState] = useState({ loading: false, saving: false, error: "" });
    const patchPresetState = useCallback(
        (p: Partial<{ loading: boolean; saving: boolean; error: string }>) =>
            setPresetState((s) => ({ ...s, ...p })),
        []
    );
    const [presetEditorOpen, setPresetEditorOpen] = useState(false);
    const [editingPresetKey, setEditingPresetKey] = useState<string | null>(null);
    const [presetDraft, setPresetDraft] = useState<ResumePreset>({
        key: "",
        label: "",
        title: "",
        summary: "",
        keywordsByCategory: {},
        includeAll: [],
        iconKey: "code",
        pinnedIdsByCategory: {}
    });

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
        summary:
            "Passionate full-stack developer with expertise in modern web technologies and a focus on building scalable, user-centric applications."
    });

    const clonePreset = useCallback((p: ResumePreset): ResumePreset => {
        const clonedKeywords: Partial<Record<Category, string[]>> = {};
        const clonedPinned: Partial<Record<Category, string[]>> = {};
        SECTIONS.forEach((s) => {
            if (p.keywordsByCategory[s.key]) clonedKeywords[s.key] = [...(p.keywordsByCategory[s.key] ?? [])];
            if (p.pinnedIdsByCategory?.[s.key]) clonedPinned[s.key] = [...(p.pinnedIdsByCategory?.[s.key] ?? [])];
        });
        return {
            ...p,
            includeAll: [...(p.includeAll ?? [])],
            keywordsByCategory: clonedKeywords,
            pinnedIdsByCategory: clonedPinned
        };
    }, []);

    const fetchPresets = useCallback(async () => {
        patchPresetState({ loading: true, error: "" });
        try {
            const res = await fetch("/api/admin/resume-presets");
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || `Failed to load presets (${res.status})`);
            }

            const incoming = Array.isArray(json.data) ? json.data : [];
            const validated = incoming
                .filter((p: ResumePreset) => p && typeof p.key === "string" && typeof p.label === "string" && typeof p.title === "string")
                .map((p: ResumePreset) => ({
                    key: p.key,
                    label: p.label,
                    title: p.title,
                    summary: p.summary ?? "",
                    keywordsByCategory: p.keywordsByCategory ?? {},
                    includeAll: p.includeAll ?? [],
                    iconKey: p.iconKey ?? "code",
                    pinnedIdsByCategory: p.pinnedIdsByCategory ?? {}
                })) as ResumePreset[];

            setPresets(validated);
        } catch (err: any) {
            patchPresetState({ error: err?.message || "Failed to load presets" });
        } finally {
            patchPresetState({ loading: false });
        }
    }, [patchPresetState]);

    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    const openCreatePreset = useCallback(() => {
        setEditingPresetKey(null);
        setPresetDraft({
            key: "",
            label: "",
            title: meta.title,
            summary: meta.summary,
            keywordsByCategory: {},
            includeAll: [],
            iconKey: "code",
            pinnedIdsByCategory: {}
        });
        setPresetEditorOpen(true);
    }, [meta.title, meta.summary]);

    const openEditPreset = useCallback(
        (preset: ResumePreset) => {
            setEditingPresetKey(preset.key);
            setPresetDraft(clonePreset(preset));
            setPresetEditorOpen(true);
        },
        [clonePreset]
    );

    const savePresetDraft = useCallback(async () => {
        const baseKey = slugifyPresetKey(presetDraft.key || presetDraft.label || presetDraft.title);
        if (!baseKey || !presetDraft.label.trim() || !presetDraft.title.trim()) return;

        const cleaned: ResumePreset = {
            ...presetDraft,
            key: editingPresetKey || baseKey,
            label: presetDraft.label.trim(),
            title: presetDraft.title.trim(),
            summary: presetDraft.summary.trim(),
            includeAll: [...(presetDraft.includeAll ?? [])]
        };

        patchPresetState({ saving: true, error: "" });
        try {
            if (editingPresetKey) {
                const res = await fetch(`/api/admin/resume-presets/${encodeURIComponent(editingPresetKey)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        label: cleaned.label,
                        title: cleaned.title,
                        summary: cleaned.summary,
                        keywordsByCategory: cleaned.keywordsByCategory,
                        includeAll: cleaned.includeAll,
                        iconKey: cleaned.iconKey,
                        pinnedIdsByCategory: cleaned.pinnedIdsByCategory ?? {}
                    })
                });
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || `Failed to update preset (${res.status})`);
                setActivePresetKey(editingPresetKey);
            } else {
                const res = await fetch("/api/admin/resume-presets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cleaned)
                });
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || `Failed to create preset (${res.status})`);
                setActivePresetKey(json.data?.key || cleaned.key);
            }

            await fetchPresets();
            setPresetEditorOpen(false);
            setEditingPresetKey(null);
        } catch (err: any) {
            patchPresetState({ error: err?.message || "Failed to save preset" });
        } finally {
            patchPresetState({ saving: false });
        }
    }, [presetDraft, editingPresetKey, patchPresetState, fetchPresets]);

    const deletePreset = useCallback(
        async (key: string) => {
            if (!window.confirm("Delete this preset?")) return;
            patchPresetState({ saving: true, error: "" });
            try {
                const res = await fetch(`/api/admin/resume-presets/${encodeURIComponent(key)}`, { method: "DELETE" });
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || `Failed to delete preset (${res.status})`);

                await fetchPresets();
            } catch (err: any) {
                patchPresetState({ error: err?.message || "Failed to delete preset" });
            } finally {
                patchPresetState({ saving: false });
            }

            if (activePresetKey === key) setActivePresetKey("");
            if (editingPresetKey === key) {
                setPresetEditorOpen(false);
                setEditingPresetKey(null);
            }
        },
        [activePresetKey, editingPresetKey, patchPresetState, fetchPresets]
    );

    const captureCurrentSelectionToDraft = useCallback(() => {
        const pinned: Partial<Record<Category, string[]>> = {};
        SECTIONS.forEach((section) => {
            pinned[section.key] = Array.from(selection[section.key]);
        });
        setPresetDraft((prev) => ({ ...prev, pinnedIdsByCategory: pinned }));
    }, [selection]);

    /* Fetch all data */
    const fetchAll = useCallback(async () => {
        patchDs({ loading: true });
        try {
            const results = await Promise.all(
                SECTIONS.map(async (s) => {
                    const res = await fetch(`${s.api}?limit=100`);
                    const json = await res.json();
                    return {
                        key: s.key,
                        data: json.success ? (json.data ?? []) : []
                    };
                })
            );
            const newData: any = {};
            results.forEach((r) => {
                newData[r.key] = r.data;
            });
            patchDs({ data: newData });
            // default: select all
            const newSel: any = {};
            results.forEach((r) => {
                const sec = SECTIONS.find((s) => s.key === r.key)!;
                newSel[r.key] = new Set(r.data.map((item: any) => item[sec.idField]));
            });
            setSelection(newSel);
        } finally {
            patchDs({ loading: false });
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const toggle = (category: Category, id: string) => {
        setSelection((prev) => {
            const next = new Set(prev[category]);
            next.has(id) ? next.delete(id) : next.add(id);
            return { ...prev, [category]: next };
        });
    };

    const toggleSection = (category: Category) => {
        const sec = SECTIONS.find((s) => s.key === category)!;
        const ids = (ds.data as any)[category].map((item: any) => item[sec.idField]) as string[];
        setSelection((prev) => ({
            ...prev,
            [category]: toggleAll(prev[category], ids)
        }));
    };

    /* PDF generation via html2canvas + jsPDF */
    const handleGeneratePDF = useCallback(async (customFileName?: string) => {
        if (!previewRef.current) return;
        patchUi({ generating: true });
        try {
            const [html2canvas, { jsPDF }] = await Promise.all([import("html2canvas").then((m) => m.default), import("jspdf")]);
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });
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
            pdf.save(customFileName || `${meta.name.replace(/\s+/g, "_")}_Resume.pdf`);
        } finally {
            patchUi({ generating: false });
        }
    }, [meta.name, patchUi]);

    const applyPreset = useCallback(
        (preset: ResumePreset, directDownload = false) => {
            const presetSelection = createSelectionFromPreset(ds.data, preset);
            setSelection(presetSelection);
            setMeta((prev) => ({
                ...prev,
                title: preset.title,
                summary: preset.summary
            }));
            setActivePresetKey(preset.key);
            patchUi({ previewMode: true });

            if (directDownload) {
                const safeName = `${meta.name.replace(/\s+/g, "_")}_${preset.key}_Resume.pdf`;
                setPendingPresetPdfName(safeName);
            }
        },
        [ds.data, meta.name, patchUi]
    );

    const setDraftKeywords = useCallback((category: Category, rawValue: string) => {
        const tokens = rawValue
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);

        setPresetDraft((prev) => ({
            ...prev,
            keywordsByCategory: {
                ...prev.keywordsByCategory,
                [category]: tokens
            }
        }));
    }, []);

    const toggleDraftIncludeAll = useCallback((category: Category) => {
        setPresetDraft((prev) => {
            const current = new Set(prev.includeAll ?? []);
            if (current.has(category)) current.delete(category);
            else current.add(category);
            return {
                ...prev,
                includeAll: Array.from(current)
            };
        });
    }, []);

    useEffect(() => {
        if (!pendingPresetPdfName || ds.loading || ui.generating || !ui.previewMode) return;

        let cancelled = false;
        const attemptDownload = async () => {
            if (cancelled) return;
            if (!previewRef.current) {
                window.setTimeout(attemptDownload, 80);
                return;
            }
            await handleGeneratePDF(pendingPresetPdfName);
            if (!cancelled) setPendingPresetPdfName(null);
        };

        window.setTimeout(attemptDownload, 120);

        return () => {
            cancelled = true;
        };
    }, [pendingPresetPdfName, ds.loading, ui.generating, ui.previewMode, handleGeneratePDF]);

    // Style helpers
    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.95)" : "#fff";
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
        skills: ds.data.skills.filter((i) => selection.skills.has(i.SkillID)),
        education: ds.data.education.filter((i) => selection.education.has(i.EducationID)),
        experience: ds.data.experience.filter((i) => selection.experience.has(i.ExperienceID)),
        certificates: ds.data.certificates.filter((i) => selection.certificates.has(i.CertificateID)),
        testScores: ds.data.testScores.filter((i) => selection.testScores.has(i.TestScoreID)),
        projects: ds.data.projects.filter((i) => selection.projects.has(i.ProjectID))
    };

    return (
        <div
            className="p-6"
            style={{ minHeight: "100vh", background: palette.background }}>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1
                        className="text-2xl font-black"
                        style={{ color: palette.textPrimary }}>
                        Resume Builder
                    </h1>
                    <p
                        className="text-sm mt-0.5"
                        style={{ color: palette.textSecondary }}>
                        Select portfolio items → preview → download PDF
                    </p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: palette.textSecondary
                        }}
                        whileHover={{ scale: 1.03 }}
                        onClick={fetchAll}>
                        <Refresh fontSize="small" /> Reload Data
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{
                            background: ui.previewMode ? `${palette.accent}20` : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: ui.previewMode ? palette.accent : palette.textSecondary
                        }}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => patchUi({ previewMode: !ui.previewMode })}>
                        <Preview fontSize="small" /> Preview
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                        style={{
                            background: palette.accent,
                            color: "#fff",
                            opacity: ui.generating ? 0.7 : 1
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleGeneratePDF()}
                        disabled={ui.generating}>
                        <PictureAsPdf fontSize="small" />
                        {ui.generating ? "Generating…" : "Download PDF"}
                    </motion.button>
                </div>
            </div>

            <div className={`flex gap-6 ${ui.previewMode ? "flex-col xl:flex-row" : "flex-col"}`}>
                {/* Left: Controls */}
                <div className={ui.previewMode ? "xl:w-96 flex-shrink-0" : "w-full"}>
                    {/* Resume presets */}
                    <div
                        className="rounded-2xl p-5 mb-4"
                        style={{
                            background: cardBg,
                            border: `1px solid ${borderColor}`
                        }}>
                        <h2
                            className="text-sm font-black uppercase tracking-wide mb-1"
                            style={{ color: palette.textTertiary }}>
                            Resume Presets
                        </h2>
                        <p
                            className="text-xs mb-3"
                            style={{ color: palette.textSecondary }}>
                            Create and maintain editable role presets for one-click resume sharing.
                        </p>
                        <div className="mb-3 flex gap-2">
                            <motion.button
                                className="px-3 py-2 rounded-lg text-xs font-bold"
                                style={{
                                    background: palette.accent,
                                    color: "#fff",
                                    opacity: presetState.loading || presetState.saving ? 0.7 : 1
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={openCreatePreset}
                                disabled={presetState.loading || presetState.saving}>
                                New Preset
                            </motion.button>
                            <motion.button
                                className="px-3 py-2 rounded-lg text-xs font-semibold"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                    color: palette.textSecondary,
                                    opacity: presetState.loading || presetState.saving ? 0.7 : 1
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={captureCurrentSelectionToDraft}
                                disabled={presetState.loading || presetState.saving}>
                                Capture Current Selection
                            </motion.button>
                        </div>

                        {presetState.error && (
                            <div
                                className="mb-3 p-2 rounded-lg text-xs"
                                style={{
                                    background: "rgba(220,50,50,0.12)",
                                    color: "#DC3232",
                                    border: "1px solid rgba(220,50,50,0.2)"
                                }}>
                                {presetState.error}
                            </div>
                        )}

                        {presetEditorOpen && (
                            <div
                                className="mb-3 p-3 rounded-xl border"
                                style={{
                                    borderColor,
                                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                                }}>
                                <p
                                    className="text-xs font-black uppercase tracking-wide mb-2"
                                    style={{ color: palette.textTertiary }}>
                                    {editingPresetKey ? "Edit Preset" : "Create Preset"}
                                </p>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input
                                        value={presetDraft.label}
                                        onChange={(e) => setPresetDraft((prev) => ({ ...prev, label: e.target.value }))}
                                        placeholder="Preset label"
                                        className="px-2.5 py-2 text-xs rounded-lg outline-none"
                                        style={inputStyle}
                                    />
                                    <select
                                        value={presetDraft.iconKey}
                                        onChange={(e) =>
                                            setPresetDraft((prev) => ({
                                                ...prev,
                                                iconKey: e.target.value as ResumePreset["iconKey"]
                                            }))
                                        }
                                        className="px-2.5 py-2 text-xs rounded-lg outline-none"
                                        style={inputStyle}>
                                        <option value="code">Code</option>
                                        <option value="preview">Preview</option>
                                        <option value="work">Work</option>
                                        <option value="school">School</option>
                                        <option value="folder">Folder</option>
                                    </select>
                                </div>
                                <input
                                    value={presetDraft.title}
                                    onChange={(e) => setPresetDraft((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="Role title"
                                    className="w-full px-2.5 py-2 text-xs rounded-lg outline-none mb-2"
                                    style={inputStyle}
                                />
                                <textarea
                                    value={presetDraft.summary}
                                    onChange={(e) => setPresetDraft((prev) => ({ ...prev, summary: e.target.value }))}
                                    placeholder="Preset summary"
                                    rows={2}
                                    className="w-full px-2.5 py-2 text-xs rounded-lg outline-none mb-2"
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />

                                <div className="space-y-1.5 mb-2">
                                    {SECTIONS.map((section) => {
                                        const includeAll = (presetDraft.includeAll ?? []).includes(section.key);
                                        const keywords = (presetDraft.keywordsByCategory[section.key] ?? []).join(", ");
                                        return (
                                            <div key={section.key}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span
                                                        className="text-[11px] font-semibold"
                                                        style={{ color: palette.textSecondary }}>
                                                        {section.label}
                                                    </span>
                                                    <motion.button
                                                        className="px-2 py-1 rounded-md text-[10px] font-semibold"
                                                        style={{
                                                            background: includeAll
                                                                ? `${palette.accent}20`
                                                                : isDark
                                                                  ? "rgba(255,255,255,0.08)"
                                                                  : "rgba(0,0,0,0.06)",
                                                            color: includeAll ? palette.accent : palette.textSecondary
                                                        }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => toggleDraftIncludeAll(section.key)}>
                                                        Include All
                                                    </motion.button>
                                                </div>
                                                <input
                                                    value={keywords}
                                                    onChange={(e) => setDraftKeywords(section.key, e.target.value)}
                                                    placeholder="keywords, comma separated"
                                                    className="w-full px-2.5 py-2 text-[11px] rounded-lg outline-none"
                                                    style={inputStyle}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-2">
                                    <motion.button
                                        className="px-3 py-2 rounded-lg text-xs font-bold"
                                        style={{ background: palette.accent, color: "#fff", opacity: presetState.saving ? 0.7 : 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={savePresetDraft}
                                        disabled={presetState.saving}>
                                        {presetState.saving ? "Saving..." : "Save Preset"}
                                    </motion.button>
                                    <motion.button
                                        className="px-3 py-2 rounded-lg text-xs font-semibold"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                            color: palette.textSecondary
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setPresetEditorOpen(false);
                                            setEditingPresetKey(null);
                                        }}>
                                        Cancel
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {presets.map((preset) => {
                                const active = activePresetKey === preset.key;
                                return (
                                    <div
                                        key={preset.key}
                                        className="rounded-xl border p-3"
                                        style={{
                                            borderColor: active ? `${palette.accent}55` : borderColor,
                                            background: active
                                                ? `${palette.accent}12`
                                                : isDark
                                                  ? "rgba(255,255,255,0.02)"
                                                  : "rgba(0,0,0,0.015)"
                                        }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className="inline-flex items-center gap-2 text-sm font-bold"
                                                style={{ color: active ? palette.accent : palette.textPrimary }}>
                                                {getPresetIcon(preset.iconKey)}
                                                {preset.label}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <motion.button
                                                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: palette.textSecondary,
                                                    opacity: presetState.loading || presetState.saving ? 0.7 : 1
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => applyPreset(preset, false)}
                                                disabled={presetState.loading || presetState.saving}>
                                                Apply
                                            </motion.button>
                                            <motion.button
                                                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold"
                                                style={{
                                                    background: palette.accent,
                                                    color: "#fff",
                                                    opacity: ds.loading || ui.generating || presetState.loading || presetState.saving ? 0.7 : 1
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => applyPreset(preset, true)}
                                                disabled={ds.loading || ui.generating || presetState.loading || presetState.saving}>
                                                Direct PDF
                                            </motion.button>
                                            <motion.button
                                                className="px-2 py-2 rounded-lg text-xs font-semibold"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: palette.textSecondary
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => openEditPreset(preset)}
                                                disabled={presetState.loading || presetState.saving}>
                                                Edit
                                            </motion.button>
                                            <motion.button
                                                className="px-2 py-2 rounded-lg text-xs font-semibold"
                                                style={{
                                                    background: "rgba(220,50,50,0.12)",
                                                    color: "#DC3232"
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => deletePreset(preset.key)}
                                                disabled={presetState.loading || presetState.saving}>
                                                Delete
                                            </motion.button>
                                        </div>
                                    </div>
                                );
                            })}

                            {!presetState.loading && presets.length === 0 && (
                                <div
                                    className="rounded-xl border p-3 text-xs"
                                    style={{ borderColor, color: palette.textTertiary }}>
                                    No presets yet. Create one and keep updating it anytime.
                                </div>
                            )}
                            {presetState.loading && (
                                <div
                                    className="rounded-xl border p-3 text-xs"
                                    style={{ borderColor, color: palette.textTertiary }}>
                                    Loading presets...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta info */}
                    <div
                        className="rounded-2xl p-5 mb-4"
                        style={{
                            background: cardBg,
                            border: `1px solid ${borderColor}`
                        }}>
                        <h2
                            className="text-sm font-black uppercase tracking-wide mb-4"
                            style={{ color: palette.textTertiary }}>
                            Resume Header
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.entries(meta) as [string, string][]).map(([k, v]) =>
                                k === "summary" ? (
                                    <div
                                        key={k}
                                        className="col-span-2">
                                        <label
                                            className="block text-xs font-semibold mb-1 capitalize"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {k}
                                        </label>
                                        <textarea
                                            value={v}
                                            rows={3}
                                            onChange={(e) =>
                                                setMeta((prev) => ({
                                                    ...prev,
                                                    [k]: e.target.value
                                                }))
                                            }
                                            style={{
                                                ...inputStyle,
                                                resize: "vertical"
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div key={k}>
                                        <label
                                            className="block text-xs font-semibold mb-1 capitalize"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {k}
                                        </label>
                                        <input
                                            value={v}
                                            onChange={(e) =>
                                                setMeta((prev) => ({
                                                    ...prev,
                                                    [k]: e.target.value
                                                }))
                                            }
                                            style={inputStyle}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Section selectors */}
                    {ds.loading ? (
                        <div
                            className="text-center py-8"
                            style={{ color: palette.textTertiary }}>
                            Loading portfolio data…
                        </div>
                    ) : (
                        SECTIONS.map((sec) => {
                            const items: any[] = (ds.data as any)[sec.key];
                            const allSelected = items.every((i) => selection[sec.key].has(i[sec.idField]));
                            const isCollapsed = !!collapsed[sec.key];
                            return (
                                <div
                                    key={sec.key}
                                    className="rounded-2xl mb-3 overflow-hidden"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${borderColor}`
                                    }}>
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer"
                                        onClick={() =>
                                            setCollapsed((p) => ({
                                                ...p,
                                                [sec.key]: !p[sec.key]
                                            }))
                                        }>
                                        <div className="flex items-center gap-2">
                                            <span
                                                style={{
                                                    color: palette.accent
                                                }}>
                                                {sec.icon}
                                            </span>
                                            <span
                                                className="text-sm font-bold"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {sec.label}
                                            </span>
                                            <span
                                                className="text-xs px-1.5 py-0.5 rounded-full"
                                                style={{
                                                    background: `${palette.accent}18`,
                                                    color: palette.accent
                                                }}>
                                                {selection[sec.key].size}/{items.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                className="text-xs px-2 py-1 rounded-lg font-semibold"
                                                style={{
                                                    background: allSelected
                                                        ? `${palette.accent}18`
                                                        : isDark
                                                          ? "rgba(255,255,255,0.06)"
                                                          : "rgba(0,0,0,0.05)",
                                                    color: allSelected ? palette.accent : palette.textTertiary
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSection(sec.key);
                                                }}
                                                whileHover={{ scale: 1.05 }}>
                                                {allSelected ? "Deselect All" : "Select All"}
                                            </motion.button>
                                            {isCollapsed ? (
                                                <ExpandMore
                                                    fontSize="small"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}
                                                />
                                            ) : (
                                                <ExpandLess
                                                    fontSize="small"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                exit={{ height: 0 }}
                                                className="overflow-hidden">
                                                <div
                                                    className="border-t px-4 pb-3 pt-2 space-y-1"
                                                    style={{ borderColor }}>
                                                    {items.length === 0 ? (
                                                        <p
                                                            className="text-xs py-2"
                                                            style={{
                                                                color: palette.textTertiary
                                                            }}>
                                                            No {sec.label.toLowerCase()} added yet
                                                        </p>
                                                    ) : (
                                                        items.map((item) => {
                                                            const id = item[sec.idField];
                                                            const checked = selection[sec.key].has(id);
                                                            return (
                                                                <motion.div
                                                                    key={id}
                                                                    className="flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer"
                                                                    whileHover={{
                                                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
                                                                    }}
                                                                    onClick={() => toggle(sec.key, id)}>
                                                                    {checked ? (
                                                                        <CheckBox
                                                                            style={{
                                                                                color: palette.accent,
                                                                                fontSize: 18
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <CheckBoxOutlineBlank
                                                                            style={{
                                                                                color: palette.textTertiary,
                                                                                fontSize: 18
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <span
                                                                        className="text-sm"
                                                                        style={{
                                                                            color: checked ? palette.textPrimary : palette.textTertiary
                                                                        }}>
                                                                        {sec.display(item)}
                                                                    </span>
                                                                </motion.div>
                                                            );
                                                        })
                                                    )}
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
                {ui.previewMode && (
                    <div className="flex-1 min-w-0">
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{ border: `1px solid ${borderColor}` }}>
                            <ResumePreview
                                ref={previewRef}
                                meta={meta}
                                data={selectedData}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Generate PDF button (also shown at bottom when preview is hidden) */}
            {!ui.previewMode && (
                <div className="mt-6 flex justify-end">
                    <motion.button
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
                        style={{
                            background: palette.accent,
                            color: "#fff",
                            opacity: ui.generating ? 0.7 : 1
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            patchUi({ previewMode: true });
                        }}
                        disabled={ui.generating}>
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
        name: string;
        title: string;
        email: string;
        phone: string;
        location: string;
        website: string;
        github: string;
        linkedin: string;
        summary: string;
    };
    data: DataState;
}

const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(function ResumePreview({ meta, data }, ref) {
    const fmtDate = (d?: string | Date) =>
        d
            ? new Date(d).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short"
              })
            : "Present";

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
            }}>
            {/* Header */}
            <div
                style={{
                    borderBottom: "2px solid #007AFF",
                    paddingBottom: "20px",
                    marginBottom: "24px"
                }}>
                <h1
                    style={{
                        fontSize: "28px",
                        fontWeight: 900,
                        margin: 0,
                        color: "#111"
                    }}>
                    {meta.name}
                </h1>
                <p
                    style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#007AFF",
                        marginTop: "4px"
                    }}>
                    {meta.title}
                </p>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginTop: "10px",
                        fontSize: "12px",
                        color: "#555"
                    }}>
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
                    <p
                        style={{
                            fontSize: "13px",
                            color: "#333",
                            lineHeight: 1.6
                        }}>
                        {meta.summary}
                    </p>
                </Section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((e) => (
                        <div
                            key={e.ExperienceID}
                            style={{ marginBottom: "14px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline"
                                }}>
                                <div>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "14px"
                                        }}>
                                        {e.Role}
                                    </span>
                                    <span
                                        style={{
                                            color: "#007AFF",
                                            fontSize: "13px"
                                        }}>
                                        {" "}
                                        — {e.Company}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        color: "#888"
                                    }}>
                                    {fmtDate(e.StartDate)} – {e.CurrentlyWorking ? "Present" : fmtDate(e.EndDate)}
                                </span>
                            </div>
                            {e.Location && (
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: "#888",
                                        margin: "2px 0 4px"
                                    }}>
                                    {e.Location} · {e.EmploymentType?.replace("_", " ")}
                                </p>
                            )}
                            {e.Description && (
                                <p
                                    style={{
                                        fontSize: "12px",
                                        color: "#444",
                                        lineHeight: 1.5
                                    }}>
                                    {e.Description}
                                </p>
                            )}
                            {e.Achievements?.length > 0 && (
                                <ul
                                    style={{
                                        margin: "4px 0 0 16px",
                                        padding: 0,
                                        fontSize: "12px",
                                        color: "#444"
                                    }}>
                                    {e.Achievements.map((a: string, i: number) => (
                                        <li key={i}>{a}</li>
                                    ))}
                                </ul>
                            )}
                            {e.TechStack?.length > 0 && <TagList tags={e.TechStack} />}
                        </div>
                    ))}
                </Section>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((p) => (
                        <div
                            key={p.ProjectID}
                            style={{ marginBottom: "12px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline"
                                }}>
                                <span
                                    style={{
                                        fontWeight: 700,
                                        fontSize: "14px"
                                    }}>
                                    {p.Title}
                                </span>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        color: "#888"
                                    }}>
                                    {p.Type?.replace("_", " ")}
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#444",
                                    margin: "3px 0 4px",
                                    lineHeight: 1.5
                                }}>
                                {p.Description}
                            </p>
                            {p.TechStack?.length > 0 && <TagList tags={p.TechStack} />}
                            {p.Links?.github && (
                                <span
                                    style={{
                                        fontSize: "11px",
                                        color: "#007AFF"
                                    }}>
                                    {p.Links.github}
                                </span>
                            )}
                        </div>
                    ))}
                </Section>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((e) => (
                        <div
                            key={e.EducationID}
                            style={{ marginBottom: "12px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline"
                                }}>
                                <div>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "14px"
                                        }}>
                                        {e.Degree}
                                    </span>
                                    <span
                                        style={{
                                            color: "#555",
                                            fontSize: "13px"
                                        }}>
                                        {" "}
                                        in {e.FieldOfStudy}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        color: "#888"
                                    }}>
                                    {fmtDate(e.StartDate)} – {e.CurrentlyStudying ? "Present" : fmtDate(e.EndDate)}
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#555",
                                    margin: "2px 0"
                                }}>
                                {e.Institution}
                            </p>
                            {e.Grade && (
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: "#888"
                                    }}>
                                    Grade: {e.Grade}
                                    {e.MaxGrade ? `/${e.MaxGrade}` : ""}
                                </p>
                            )}
                        </div>
                    ))}
                </Section>
            )}

            {/* Skills */}
            {data.skills.length > 0 && (
                <Section title="Skills">
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px"
                        }}>
                        {data.skills.map((s) => (
                            <span
                                key={s.SkillID}
                                style={{
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
                    {data.certificates.map((c) => (
                        <div
                            key={c.CertificateID}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "6px"
                            }}>
                            <div>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "13px"
                                    }}>
                                    {c.Title}
                                </span>
                                <span
                                    style={{
                                        color: "#555",
                                        fontSize: "12px"
                                    }}>
                                    {" "}
                                    · {c.IssuingOrganization}
                                </span>
                            </div>
                            <span style={{ fontSize: "11px", color: "#888" }}>{fmtDate(c.IssuedDate)}</span>
                        </div>
                    ))}
                </Section>
            )}

            {/* Test Scores */}
            {data.testScores.length > 0 && (
                <Section title="Test Scores & Rankings">
                    {data.testScores.map((t) => (
                        <div
                            key={t.TestScoreID}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "6px"
                            }}>
                            <div>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "13px"
                                    }}>
                                    {t.ExamName} {t.Year}
                                </span>
                                {t.Subject && (
                                    <span
                                        style={{
                                            color: "#555",
                                            fontSize: "12px"
                                        }}>
                                        {" "}
                                        ({t.Subject})
                                    </span>
                                )}
                            </div>
                            <span
                                style={{
                                    fontSize: "12px",
                                    color: "#111",
                                    fontWeight: 600
                                }}>
                                {t.Score}
                                {t.MaxScore ? `/${t.MaxScore}` : ""}
                                {t.Percentile ? ` · P${t.Percentile}` : ""}
                                {t.Rank ? ` · Rank ${t.Rank}` : ""}
                            </span>
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "22px" }}>
            <h2
                style={{
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
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginTop: "4px"
            }}>
            {tags.slice(0, 10).map((tag, i) => (
                <span
                    key={i}
                    style={{
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
