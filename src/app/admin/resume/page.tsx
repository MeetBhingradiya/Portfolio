/**
 * Admin Resume Builder
 * Select portfolio items, order the document, preview A4 pages, and export PDF.
 */

"use client";

import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Config } from "@Config/Client";
import {
    CheckBox,
    CheckBoxOutlineBlank,
    Code,
    DragIndicator,
    EmojiEvents,
    ExpandLess,
    ExpandMore,
    Folder,
    FormatSize,
    Padding,
    Palette,
    PictureAsPdf,
    Preview,
    Refresh,
    School,
    Work,
    WorkspacePremium,
    Delete as DeleteIcon,
    Edit as EditIcon,
    PictureAsPdfRounded as PDFIcon,
    AutoAwesome
} from "@mui/icons-material";

type Category = "skills" | "education" | "experience" | "certificates" | "testScores" | "projects";
type IconKey = "code" | "preview" | "work" | "school" | "folder";

interface SelectionState {
    skills: Set<string>;
    education: Set<string>;
    experience: Set<string>;
    certificates: Set<string>;
    testScores: Set<string>;
    projects: Set<string>;
}

interface DataState {
    skills: any[];
    education: any[];
    experience: any[];
    certificates: any[];
    testScores: any[];
    projects: any[];
}

interface ResumeMeta {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
    summary: string;
}

interface ResumeStyle {
    fontScale: number;
    pagePadding: number;
    accentColor: string;
}

interface ResumePreset {
    key: string;
    label: string;
    iconKey: IconKey;
    header: ResumeMeta;
    selectedIdsByCategory: Partial<Record<Category, string[]>>;
    sectionOrder: Category[];
    itemOrderByCategory: Partial<Record<Category, string[]>>;
    style: ResumeStyle;
    // Legacy fields are read only so existing records remain usable.
    title?: string;
    summary?: string;
    pinnedIdsByCategory?: Partial<Record<Category, string[]>>;
}

interface SectionConfig {
    key: Category;
    label: string;
    api: string;
    idField: string;
    display: (item: any) => string;
    icon: React.ReactNode;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const DEFAULT_ACCENT = "#23A8F2";

const DEFAULT_META: ResumeMeta = {
    name: "Meet Bhingradiya",
    title: "Full Stack Developer",
    email: "contact@meetbhingradiya.in",
    phone: "",
    location: "Surat, Gujarat, India",
    website: Config.Origin,
    github: "https://github.com/MeetBhingradiya",
    linkedin: "https://www.linkedin.com/in/meet-bhingradiya/",
    summary:
        "Passionate full-stack developer with expertise in modern web technologies and a focus on building scalable, user-centric applications."
};

const DEFAULT_STYLE: ResumeStyle = {
    fontScale: 1,
    pagePadding: 44,
    accentColor: DEFAULT_ACCENT
};

const SECTIONS: SectionConfig[] = [
    {
        key: "projects",
        label: "Projects",
        api: "/api/admin/projects",
        idField: "ProjectID",
        display: (item) => item.Title,
        icon: <Folder fontSize="small" />
    },
    {
        key: "skills",
        label: "Skills",
        api: "/api/admin/skills",
        idField: "SkillID",
        display: (item) => `${item.Name} (${item.Proficiency}%)`,
        icon: <Code fontSize="small" />
    },
    {
        key: "education",
        label: "Education",
        api: "/api/admin/education",
        idField: "EducationID",
        display: (item) => `${item.Degree} - ${item.Institution}`,
        icon: <School fontSize="small" />
    },
    {
        key: "experience",
        label: "Experience",
        api: "/api/admin/experience",
        idField: "ExperienceID",
        display: (item) => `${item.Role} @ ${item.Company}`,
        icon: <Work fontSize="small" />
    },
    {
        key: "certificates",
        label: "Certificates",
        api: "/api/admin/certificates",
        idField: "CertificateID",
        display: (item) => item.Title,
        icon: <WorkspacePremium fontSize="small" />
    },
    {
        key: "testScores",
        label: "Test Scores",
        api: "/api/admin/test-scores",
        idField: "TestScoreID",
        display: (item) => `${item.ExamName} ${item.Year}`,
        icon: <EmojiEvents fontSize="small" />
    }
];

const DEFAULT_SECTION_ORDER: Category[] = ["experience", "projects", "education", "skills", "certificates", "testScores"];

const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((section) => [section.key, section])) as Record<Category, SectionConfig>;

function getItemId(category: Category, item: any): string {
    return String(item?.[SECTION_BY_KEY[category].idField] ?? "");
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

function createEmptyItemOrder(): Record<Category, string[]> {
    return {
        skills: [],
        education: [],
        experience: [],
        certificates: [],
        testScores: [],
        projects: []
    };
}

function sanitizeSectionOrder(order?: Category[]): Category[] {
    const valid = new Set(DEFAULT_SECTION_ORDER);
    const next = (order ?? []).filter((category, index, values) => valid.has(category) && values.indexOf(category) === index);
    DEFAULT_SECTION_ORDER.forEach((category) => {
        if (!next.includes(category)) next.push(category);
    });
    return next;
}

function sanitizeItemOrder(category: Category, items: any[], order?: string[]): string[] {
    const available = items.map((item) => getItemId(category, item)).filter(Boolean);
    const availableSet = new Set(available);
    const next = (order ?? []).map(String).filter((id, index, values) => availableSet.has(id) && values.indexOf(id) === index);
    available.forEach((id) => {
        if (!next.includes(id)) next.push(id);
    });
    return next;
}

function selectedIdsFromState(selection: SelectionState): Partial<Record<Category, string[]>> {
    return Object.fromEntries(DEFAULT_SECTION_ORDER.map((category) => [category, Array.from(selection[category])])) as Partial<
        Record<Category, string[]>
    >;
}

function normalizeTags(value: unknown): string[] {
    const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    return Array.from(
        new Set(
            values
                .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
                .map((entry) => entry.trim())
                .filter(Boolean)
        )
    ).slice(0, 16);
}

function normalizeUrl(value: unknown): string {
    if (typeof value !== "string") return "";
    const url = value.trim();
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function toPdfText(value: unknown): string {
    return String(value ?? "")
        .replace(/[–—]/g, "-")
        .replace(/[•·]/g, "|")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function hexToRgb(hex: string): [number, number, number] {
    const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_ACCENT;
    return [
        Number.parseInt(normalized.slice(1, 3), 16),
        Number.parseInt(normalized.slice(3, 5), 16),
        Number.parseInt(normalized.slice(5, 7), 16)
    ];
}

/**
 * Renders an inline SVG as an <img> tag using a data URI.
 * html2canvas cannot reliably render MUI SVG components inside flexbox layouts,
 * but it handles <img> elements with explicit dimensions correctly.
 */
function PdfSafeIcon({ svgPath, size, color }: { svgPath: string; size: number; color: string }) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}">${svgPath}</svg>`;
    const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    return (
        <img
            src={dataUri}
            width={size}
            height={size}
            alt=""
            aria-hidden="true"
            style={{
                display: "inline-block",
                width: size,
                height: size,
                verticalAlign: "middle",
                flexShrink: 0
            }}
        />
    );
}

// Material Design icon SVG paths (24x24 viewBox)
const SVG_PATHS = {
    email: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>',
    phone: '<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>',
    location: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
    language: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>',
    github: '<path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2.16 2.16 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.1-2.76a3.55 3.55 0 010-2.77s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.55 3.55 0 010 2.77 4.08 4.08 0 011.1 2.76c0 4.32-2.58 5.23-5.04 5.5.45.37.82.92.82 2.02v3.03c0 .27.18.64.73.55A11 11 0 0012 1.27"/>',
    linkedin: '<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>',
    code: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>'
} as const;

function slugifyPresetKey(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

function getPresetIcon(iconKey: IconKey): React.ReactNode {
    switch (iconKey) {
        case "code":
            return <Code fontSize="small" />;
        case "preview":
            return <Preview fontSize="small" />;
        case "school":
            return <School fontSize="small" />;
        case "folder":
            return <Folder fontSize="small" />;
        default:
            return <Work fontSize="small" />;
    }
}

function toggleAll(set: Set<string>, ids: string[]): Set<string> {
    if (ids.every((id) => set.has(id))) {
        const next = new Set(set);
        ids.forEach((id) => next.delete(id));
        return next;
    }
    return new Set([...set, ...ids]);
}

const SortableSelectionItem = memo(function SortableSelectionItem({
    category,
    itemId,
    label,
    checked,
    accent,
    textPrimary,
    textTertiary,
    isDark,
    onToggle
}: {
    category: Category;
    itemId: string;
    label: string;
    checked: boolean;
    accent: string;
    textPrimary: string;
    textTertiary: string;
    isDark: boolean;
    onToggle: (category: Category, id: string) => void;
}) {
    const sortableId = `${category}:${itemId}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                position: "relative",
                zIndex: isDragging ? 20 : 0,
                opacity: isDragging ? 0.72 : 1
            }}>
            <motion.div
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
                animate={{
                    backgroundColor: isDragging ? (isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)") : "rgba(0,0,0,0)"
                }}>
                <button
                    type="button"
                    aria-label={`Reorder ${label}`}
                    className="cursor-grab touch-none p-0.5 rounded"
                    style={{ color: textTertiary }}
                    {...attributes}
                    {...listeners}>
                    <DragIndicator style={{ fontSize: 17 }} />
                </button>
                <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => onToggle(category, itemId)}>
                    {checked ? (
                        <CheckBox style={{ color: accent, fontSize: 18 }} />
                    ) : (
                        <CheckBoxOutlineBlank style={{ color: textTertiary, fontSize: 18 }} />
                    )}
                    <span
                        className="truncate text-sm"
                        style={{ color: checked ? textPrimary : textTertiary }}>
                        {label}
                    </span>
                </button>
            </motion.div>
        </div>
    );
});

function SortableSectionRow({
    category,
    selectedCount,
    textPrimary,
    textTertiary,
    accent
}: {
    category: Category;
    selectedCount: number;
    textPrimary: string;
    textTertiary: string;
    accent: string;
}) {
    const section = SECTION_BY_KEY[category];
    const sortableId = `section:${category}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                position: "relative",
                zIndex: isDragging ? 20 : 0
            }}>
            <motion.div
                className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
                animate={{ opacity: isDragging ? 0.68 : 1 }}
                style={{ borderColor: `${accent}28`, color: textPrimary }}>
                <button
                    type="button"
                    className="cursor-grab touch-none"
                    style={{ color: textTertiary }}
                    {...attributes}
                    {...listeners}>
                    <DragIndicator style={{ fontSize: 18 }} />
                </button>
                <span style={{ color: accent }}>{section.icon}</span>
                <span className="flex-1 text-xs font-bold">{section.label}</span>
                <span
                    className="rounded-full px-1.5 py-0.5 text-[10px]"
                    style={{ background: `${accent}18`, color: accent }}>
                    {selectedCount}
                </span>
            </motion.div>
        </div>
    );
}

export default function ResumeBuilderPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const previewRef = useRef<HTMLDivElement>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [dataState, setDataState] = useState<{ data: DataState; loading: boolean }>({
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
    const [selection, setSelection] = useState<SelectionState>(createEmptySelection);
    const [itemOrder, setItemOrder] = useState<Record<Category, string[]>>(createEmptyItemOrder);
    const [sectionOrder, setSectionOrder] = useState<Category[]>(DEFAULT_SECTION_ORDER);
    const [collapsed, setCollapsed] = useState<Partial<Record<Category, boolean>>>({});
    const [ui, setUi] = useState({ generating: false, previewMode: true });
    const [meta, setMeta] = useState<ResumeMeta>(DEFAULT_META);
    const [resumeStyle, setResumeStyle] = useState<ResumeStyle>(DEFAULT_STYLE);
    const [activePresetKey, setActivePresetKey] = useState("");
    const [pendingPresetPdfName, setPendingPresetPdfName] = useState<string | null>(null);
    const [presets, setPresets] = useState<ResumePreset[]>([]);
    const [presetState, setPresetState] = useState({ loading: false, saving: false, error: "", message: "" });
    const [presetEditorOpen, setPresetEditorOpen] = useState(false);
    const [editingPresetKey, setEditingPresetKey] = useState<string | null>(null);
    const [presetDraft, setPresetDraft] = useState<ResumePreset | null>(null);

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.95)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        color: palette.textPrimary,
        padding: "8px 10px",
        outline: "none",
        width: "100%",
        fontSize: 13
    };

    const patchUi = useCallback((patch: Partial<typeof ui>) => {
        setUi((current) => ({ ...current, ...patch }));
    }, []);

    const patchPresetState = useCallback((patch: Partial<typeof presetState>) => {
        setPresetState((current) => ({ ...current, ...patch }));
    }, []);

    const createSnapshot = useCallback(
        (label = "", iconKey: IconKey = "code", key = ""): ResumePreset => ({
            key,
            label,
            iconKey,
            header: { ...meta },
            selectedIdsByCategory: selectedIdsFromState(selection),
            sectionOrder: [...sectionOrder],
            itemOrderByCategory: Object.fromEntries(
                DEFAULT_SECTION_ORDER.map((category) => [category, [...itemOrder[category]]])
            ) as Partial<Record<Category, string[]>>,
            style: { ...resumeStyle }
        }),
        [itemOrder, meta, resumeStyle, sectionOrder, selection]
    );

    const fetchPresets = useCallback(async () => {
        patchPresetState({ loading: true, error: "", message: "" });
        try {
            const response = await fetch("/api/admin/resume-presets");
            const json = await response.json();
            if (!response.ok || !json.success) {
                throw new Error(json.error || `Failed to load presets (${response.status})`);
            }

            const incoming = Array.isArray(json.data) ? json.data : [];
            const normalized = incoming
                .filter((preset: any) => preset && typeof preset.key === "string" && typeof preset.label === "string")
                .map((preset: any): ResumePreset => {
                    const legacyHeader = {
                        ...DEFAULT_META,
                        title: preset.title || DEFAULT_META.title,
                        summary: preset.summary || DEFAULT_META.summary
                    };
                    return {
                        key: preset.key,
                        label: preset.label,
                        iconKey: preset.iconKey || "code",
                        header: { ...legacyHeader, ...(preset.header || {}) },
                        selectedIdsByCategory: preset.selectedIdsByCategory || preset.pinnedIdsByCategory || {},
                        sectionOrder: sanitizeSectionOrder(preset.sectionOrder),
                        itemOrderByCategory: preset.itemOrderByCategory || {},
                        style: { ...DEFAULT_STYLE, ...(preset.style || {}) }
                    };
                });
            setPresets(normalized);
        } catch (error: any) {
            patchPresetState({ error: error?.message || "Failed to load presets" });
        } finally {
            patchPresetState({ loading: false });
        }
    }, [patchPresetState]);

    const fetchAll = useCallback(async () => {
        setDataState((current) => ({ ...current, loading: true }));
        try {
            const results = await Promise.all(
                SECTIONS.map(async (section) => {
                    const response = await fetch(`${section.api}?limit=100`);
                    const json = await response.json();
                    return {
                        category: section.key,
                        data: json.success && Array.isArray(json.data) ? json.data : []
                    };
                })
            );

            const nextData = {
                skills: [],
                education: [],
                experience: [],
                certificates: [],
                testScores: [],
                projects: []
            } as DataState;
            const nextSelection = createEmptySelection();
            const nextOrder = createEmptyItemOrder();

            results.forEach(({ category, data }) => {
                nextData[category] = data;
                nextOrder[category] = data.map((item: any) => getItemId(category, item)).filter(Boolean);
                nextSelection[category] = new Set(nextOrder[category]);
            });

            setDataState({ data: nextData, loading: false });
            setItemOrder(nextOrder);
            setSelection(nextSelection);
        } catch {
            setDataState((current) => ({ ...current, loading: false }));
        }
    }, []);

    useEffect(() => {
        fetchAll();
        fetchPresets();
    }, [fetchAll, fetchPresets]);

    const openCreatePreset = useCallback(() => {
        setEditingPresetKey(null);
        setPresetDraft(createSnapshot());
        setPresetEditorOpen(true);
        patchPresetState({ error: "", message: "Current header, selection, order, and styling captured." });
    }, [createSnapshot, patchPresetState]);

    const openEditPreset = useCallback(
        (preset: ResumePreset) => {
            setEditingPresetKey(preset.key);
            setPresetDraft({
                ...preset,
                header: { ...preset.header },
                selectedIdsByCategory: { ...preset.selectedIdsByCategory },
                sectionOrder: [...preset.sectionOrder],
                itemOrderByCategory: { ...preset.itemOrderByCategory },
                style: { ...preset.style }
            });
            setPresetEditorOpen(true);
            patchPresetState({ error: "", message: "" });
        },
        [patchPresetState]
    );

    const captureCurrentSelectionToDraft = useCallback(() => {
        setPresetDraft((current) => {
            const snapshot = createSnapshot(current?.label ?? "", current?.iconKey ?? "code", current?.key ?? "");
            return snapshot;
        });
        setPresetEditorOpen(true);
        patchPresetState({ message: "Current resume captured into the preset draft.", error: "" });
    }, [createSnapshot, patchPresetState]);

    const savePresetDraft = useCallback(async () => {
        if (!presetDraft) return;
        const key = editingPresetKey || slugifyPresetKey(presetDraft.key || presetDraft.label);
        if (!key || !presetDraft.label.trim()) {
            patchPresetState({ error: "Preset label is required.", message: "" });
            return;
        }

        const payload: ResumePreset = {
            ...presetDraft,
            key,
            label: presetDraft.label.trim()
        };

        patchPresetState({ saving: true, error: "", message: "" });
        try {
            const response = await fetch(
                editingPresetKey ? `/api/admin/resume-presets/${encodeURIComponent(editingPresetKey)}` : "/api/admin/resume-presets",
                {
                    method: editingPresetKey ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );
            const json = await response.json();
            if (!response.ok || !json.success) {
                throw new Error(json.error || `Failed to save preset (${response.status})`);
            }

            setActivePresetKey(json.data?.key || key);
            setPresetEditorOpen(false);
            setEditingPresetKey(null);
            setPresetDraft(null);
            await fetchPresets();
            patchPresetState({ message: "Preset saved." });
        } catch (error: any) {
            patchPresetState({ error: error?.message || "Failed to save preset" });
        } finally {
            patchPresetState({ saving: false });
        }
    }, [editingPresetKey, fetchPresets, patchPresetState, presetDraft]);

    const deletePreset = useCallback(
        async (key: string) => {
            if (!window.confirm("Delete this preset?")) return;
            patchPresetState({ saving: true, error: "", message: "" });
            try {
                const response = await fetch(`/api/admin/resume-presets/${encodeURIComponent(key)}`, {
                    method: "DELETE"
                });
                const json = await response.json();
                if (!response.ok || !json.success) {
                    throw new Error(json.error || `Failed to delete preset (${response.status})`);
                }
                if (activePresetKey === key) setActivePresetKey("");
                if (editingPresetKey === key) {
                    setEditingPresetKey(null);
                    setPresetEditorOpen(false);
                    setPresetDraft(null);
                }
                await fetchPresets();
                patchPresetState({ message: "Preset deleted." });
            } catch (error: any) {
                patchPresetState({ error: error?.message || "Failed to delete preset" });
            } finally {
                patchPresetState({ saving: false });
            }
        },
        [activePresetKey, editingPresetKey, fetchPresets, patchPresetState]
    );

    const applyPreset = useCallback(
        (preset: ResumePreset, directDownload = false) => {
            const nextSelection = createEmptySelection();
            const nextOrder = createEmptyItemOrder();

            DEFAULT_SECTION_ORDER.forEach((category) => {
                const validIds = new Set(dataState.data[category].map((item) => getItemId(category, item)));
                const savedIds = preset.selectedIdsByCategory[category] ?? [];
                nextSelection[category] = new Set(savedIds.map(String).filter((id) => validIds.has(id)));
                nextOrder[category] = sanitizeItemOrder(category, dataState.data[category], preset.itemOrderByCategory[category]);
            });

            setSelection(nextSelection);
            setItemOrder(nextOrder);
            setSectionOrder(sanitizeSectionOrder(preset.sectionOrder));
            setMeta({ ...DEFAULT_META, ...preset.header });
            setResumeStyle({ ...DEFAULT_STYLE, ...preset.style });
            setActivePresetKey(preset.key);
            patchUi({ previewMode: true });

            if (directDownload) {
                setPendingPresetPdfName(`${(preset.header.name || meta.name).replace(/\s+/g, "_")}_${preset.key}_Resume.pdf`);
            }
        },
        [dataState.data, meta.name, patchUi]
    );

    const toggleItem = useCallback((category: Category, id: string) => {
        setSelection((current) => {
            const nextCategory = new Set(current[category]);
            if (nextCategory.has(id)) nextCategory.delete(id);
            else nextCategory.add(id);
            return { ...current, [category]: nextCategory };
        });
    }, []);

    const toggleSection = useCallback(
        (category: Category) => {
            const ids = dataState.data[category].map((item) => getItemId(category, item));
            setSelection((current) => ({
                ...current,
                [category]: toggleAll(current[category], ids)
            }));
        },
        [dataState.data]
    );

    const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
        if (!event.over || event.active.id === event.over.id) return;
        const activeCategory = String(event.active.id).replace("section:", "") as Category;
        const overCategory = String(event.over.id).replace("section:", "") as Category;
        setSectionOrder((current) => {
            const oldIndex = current.indexOf(activeCategory);
            const newIndex = current.indexOf(overCategory);
            return oldIndex < 0 || newIndex < 0 ? current : arrayMove(current, oldIndex, newIndex);
        });
    }, []);

    const handleItemDragEnd = useCallback((category: Category, event: DragEndEvent) => {
        if (!event.over || event.active.id === event.over.id) return;
        const prefix = `${category}:`;
        const activeId = String(event.active.id).replace(prefix, "");
        const overId = String(event.over.id).replace(prefix, "");
        setItemOrder((current) => {
            const categoryOrder = current[category];
            const oldIndex = categoryOrder.indexOf(activeId);
            const newIndex = categoryOrder.indexOf(overId);
            if (oldIndex < 0 || newIndex < 0) return current;
            return { ...current, [category]: arrayMove(categoryOrder, oldIndex, newIndex) };
        });
    }, []);

    const selectedData = useMemo(() => {
        const result = {
            skills: [],
            education: [],
            experience: [],
            certificates: [],
            testScores: [],
            projects: []
        } as DataState;

        DEFAULT_SECTION_ORDER.forEach((category) => {
            const byId = new Map(dataState.data[category].map((item) => [getItemId(category, item), item] as const));
            result[category] = itemOrder[category]
                .filter((id) => selection[category].has(id))
                .map((id) => byId.get(id))
                .filter(Boolean);
        });
        return result;
    }, [dataState.data, itemOrder, selection]);

    const handleGeneratePDF = useCallback(async (customFileName?: string) => {
        patchUi({ generating: true });
        try {
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            // ── Layout constants ──────────────────────────────────────────
            const PW = 210;
            const PH = 297;
            const PX_TO_MM = PW / A4_WIDTH_PX;
            const M = resumeStyle.pagePadding * PX_TO_MM;
            const CW = PW - M * 2;
            const [aR, aG, aB] = hexToRgb(resumeStyle.accentColor);
            const sc = resumeStyle.fontScale;
            let y = M;

            // ── Typography helpers ────────────────────────────────────────
            const mm = (pt: number) => pt * 0.353;
            const lh = (pt: number) => mm(pt) * 1.4;
            const bl = (pt: number) => mm(pt) * 0.78;

            const pageBreak = (need: number) => {
                if (y + need > PH - M) { pdf.addPage(); y = M; }
            };

            const style = (
                weight: "normal" | "bold" | "italic" | "bolditalic",
                pt: number,
                r: number, g: number, b: number
            ) => {
                pdf.setFont("helvetica", weight);
                pdf.setFontSize(pt);
                pdf.setTextColor(r, g, b);
            };

            /** Draw inline text at current y (does NOT advance y). */
            const ink = (text: string, x: number, pt: number, align?: "left" | "right") => {
                pdf.text(toPdfText(text), x, y + bl(pt), { align });
            };

            /** Draw wrapped paragraph at x; advances y; returns consumed height. */
            const para = (text: string, x: number, pt: number, w: number = CW - (x - M)) => {
                const lines: string[] = pdf.splitTextToSize(toPdfText(text), w);
                const h = lh(pt);
                let total = 0;
                for (const line of lines) {
                    pageBreak(h);
                    pdf.text(line, x, y + bl(pt));
                    y += h;
                    total += h;
                }
                return total;
            };

            /** Draw accent-coloured section heading with underline; advances y. */
            const heading = (title: string) => {
                const pt = 10 * sc;
                pageBreak(lh(pt) + 3);
                style("bold", pt, aR, aG, aB);
                ink(title.toUpperCase(), M, pt);
                y += lh(pt) + 0.5;
                pdf.setDrawColor(224, 224, 224);
                pdf.setLineWidth(0.2);
                pdf.line(M, y, PW - M, y);
                y += 2.5;
            };

            /** Draw wrapped tag chips; advances y. */
            const drawChips = (tags: string[], pt: number = 8 * sc) => {
                if (!tags.length) return;
                const chipH = mm(pt) * 1.8;
                const padX = 2;
                const gap = 1.5;
                let cx = M;
                pageBreak(chipH + 1);

                for (const tag of tags) {
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(pt);
                    const t = toPdfText(tag);
                    const tw = pdf.getTextWidth(t);
                    const cw = tw + padX * 2;

                    if (cx + cw > PW - M && cx > M) {
                        cx = M;
                        y += chipH + gap * 0.5;
                        pageBreak(chipH + 1);
                    }

                    // Chip background + border
                    pdf.setFillColor(245, 247, 250);
                    pdf.setDrawColor(215, 219, 224);
                    pdf.setLineWidth(0.15);
                    pdf.roundedRect(cx, y, cw, chipH, 0.8, 0.8, "FD");

                    // Chip label
                    pdf.setTextColor(51, 51, 51);
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(pt);
                    pdf.text(t, cx + padX, y + chipH * 0.65);

                    cx += cw + gap;
                }
                y += chipH + 2;
            };

            const fmtDate = (d?: string | Date) =>
                d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "Present";

            // ══════════════════════════════════════════════════════════════
            //  HEADER
            // ══════════════════════════════════════════════════════════════

            // Name
            const namePt = 22 * sc;
            style("bold", namePt, 17, 17, 17);
            ink(meta.name, M, namePt);
            y += lh(namePt);

            // Professional title
            const titPt = 12 * sc;
            style("bold", titPt, aR, aG, aB);
            ink(meta.title, M, titPt);
            y += lh(titPt) + 1;

            // Contact info (text with separators + clickable links)
            const cPt = 8.5 * sc;
            const contacts: { t: string; url?: string }[] = [];
            if (meta.email) contacts.push({ t: meta.email, url: `mailto:${meta.email}` });
            if (meta.phone) contacts.push({ t: meta.phone, url: `tel:${meta.phone.replace(/\s+/g, "")}` });
            if (meta.location) contacts.push({ t: meta.location, url: `tel:${meta.phone.replace(/\s+/g, "")}` });
            if (meta.website) { const u = normalizeUrl(meta.website); contacts.push({ t: "Portfolio", url: u }); }
            if (meta.github) { const u = normalizeUrl(meta.github); contacts.push({ t: "Github", url: u }); }
            if (meta.linkedin) { const u = normalizeUrl(meta.linkedin); contacts.push({ t: "Linkedin", url: u }); }

            if (contacts.length) {
                style("normal", cPt, 85, 85, 85);
                const sep = "  |  ";
                const sw = pdf.getTextWidth(sep);
                let cx = M;

                for (let i = 0; i < contacts.length; i++) {
                    const c = contacts[i];
                    const t = toPdfText(c.t);
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(cPt);
                    const tw = pdf.getTextWidth(t);
                    const need = (i > 0 && cx > M ? sw : 0) + tw;

                    // Wrap to next line if overflow
                    if (cx + need > PW - M && cx > M) {
                        y += lh(cPt);
                        cx = M;
                    }

                    // Separator
                    if (i > 0 && cx > M) {
                        pdf.setTextColor(170, 170, 170);
                        pdf.text(sep, cx, y + bl(cPt));
                        cx += sw;
                    }

                    // Contact text + optional hyperlink
                    pdf.setTextColor(85, 85, 85);
                    pdf.text(t, cx, y + bl(cPt));
                    if (c.url) {
                        pdf.link(cx, y, tw, lh(cPt), { url: c.url });
                    }
                    cx += tw;
                }
                y += lh(cPt) + 1;
            }

            // Header accent rule
            y += 1;
            pdf.setDrawColor(aR, aG, aB);
            pdf.setLineWidth(0.5);
            pdf.line(M, y, PW - M, y);
            y += 5;

            // ══════════════════════════════════════════════════════════════
            //  SUMMARY
            // ══════════════════════════════════════════════════════════════

            if (meta.summary) {
                heading("Summary");
                const sPt = 9.5 * sc;
                style("normal", sPt, 51, 51, 51);
                para(meta.summary, M, sPt, CW);
                y += 3;
            }

            // ══════════════════════════════════════════════════════════════
            //  BODY SECTIONS (in user-defined order)
            // ══════════════════════════════════════════════════════════════

            for (const cat of sectionOrder) {
                const items = selectedData[cat];
                if (!items?.length) continue;

                const title =
                    cat === "certificates"
                        ? "Certifications"
                        : cat === "testScores"
                            ? "Test Scores & Rankings"
                            : SECTION_BY_KEY[cat].label;

                // ── Skills (rendered as chips) ──
                if (cat === "skills") {
                    heading(title);
                    drawChips(
                        items.map((s: any) =>
                            // s.Proficiency != null ? `${s.Name} (${s.Proficiency}%)` : s.Name
                            s.Name
                        )
                    );
                    continue;
                }

                // ── Items with individual entries ──
                items.forEach((item: any, idx: number) => {
                    if (idx === 0) heading(title);

                    // ── Experience ──
                    if (cat === "experience") {
                        const tPt = 11 * sc;
                        const bPt = 9.5 * sc;
                        const sPt2 = 8.5 * sc;
                        pageBreak(lh(tPt) + lh(sPt2) + 6);

                        // Role - Company … Date
                        style("bold", tPt, 17, 17, 17);
                        const role = toPdfText(item.Role);
                        ink(role, M, tPt);
                        const rw = pdf.getTextWidth(role);
                        style("normal", 10.5 * sc, aR, aG, aB);
                        pdf.text(` - ${toPdfText(item.Company)}`, M + rw, y + bl(tPt));
                        style("normal", sPt2, 119, 119, 119);
                        ink(
                            `${fmtDate(item.StartDate)} - ${item.CurrentlyWorking ? "Present" : fmtDate(item.EndDate)}`,
                            PW - M, sPt2, "right"
                        );
                        y += lh(tPt);

                        // Location | Employment type
                        if (item.Location) {
                            style("normal", sPt2, 119, 119, 119);
                            const loc = item.EmploymentType
                                ? `${item.Location} | ${String(item.EmploymentType).replaceAll("_", " ")}`
                                : item.Location;
                            ink(toPdfText(loc), M, sPt2);
                            y += lh(sPt2);
                        }

                        // Description
                        if (item.Description) {
                            style("normal", bPt, 68, 68, 68);
                            para(item.Description, M, bPt, CW);
                            y += 0.5;
                        }

                        // Bullet achievements
                        if (Array.isArray(item.Achievements) && item.Achievements.length) {
                            style("normal", bPt, 68, 68, 68);
                            for (const ach of item.Achievements) {
                                pageBreak(lh(bPt));
                                pdf.text("\u2022", M + 2, y + bl(bPt));
                                para(ach, M + 5, bPt, CW - 5);
                            }
                            y += 0.5;
                        }

                        // Tech stack chips
                        drawChips(normalizeTags(item.TechStack), 7.5 * sc);
                        y += 2;
                    }

                    // ── Projects ──
                    if (cat === "projects") {
                        const tPt = 11 * sc;
                        const bPt = 9.5 * sc;
                        const sPt2 = 8.5 * sc;
                        pageBreak(lh(tPt) + 8);

                        // Title … Date
                        style("bold", tPt, 17, 17, 17);
                        ink(toPdfText(item.Title), M, tPt);
                        style("normal", sPt2, 119, 119, 119);
                        ink(
                            `${fmtDate(item.StartDate)} - ${item.CurrentlyWorking ? "Present" : fmtDate(item.EndDate)}`,
                            PW - M, sPt2, "right"
                        );
                        y += lh(tPt);

                        // Links as clickable text labels
                        const linkDefs: [string, unknown][] = [
                            ["GitHub", item.Links?.github],
                            ["Live", item.Links?.live],
                            ["NPM", item.Links?.npm],
                            ["Docs", item.Links?.documentation],
                            ["Demo", item.Links?.demo],
                            ["Chrome Store", item.Links?.chromeWebstore],
                            ["Play Store", item.Links?.playstore]
                        ];
                        const validLinks = linkDefs
                            .filter(([, v]) => normalizeUrl(v))
                            .map(([label, v]) => ({ label, url: normalizeUrl(v) }));

                        if (validLinks.length) {
                            const lPt = 7.5 * sc;
                            let lx = M;
                            for (let li = 0; li < validLinks.length; li++) {
                                const lk = validLinks[li];
                                style("normal", lPt, aR, aG, aB);
                                const lt = toPdfText(lk.label);
                                const ltw = pdf.getTextWidth(lt);
                                const sepText = li < validLinks.length - 1 ? "  " : "";
                                if (lx + ltw > PW - M && lx > M) {
                                    y += lh(lPt); lx = M;
                                }
                                pdf.text(lt, lx, y + bl(lPt));
                                pdf.link(lx, y, ltw, lh(lPt), { url: lk.url });
                                lx += ltw + pdf.getTextWidth(sepText);
                            }
                            y += lh(lPt) + 0.5;
                        }

                        // Description
                        if (item.Description) {
                            style("normal", bPt, 68, 68, 68);
                            para(item.Description, M, bPt, CW);
                            y += 0.5;
                        }

                        // Tech stack chips
                        drawChips(normalizeTags(item.TechStack), 7.5 * sc);
                        y += 2;
                    }

                    // ── Education ──
                    if (cat === "education") {
                        const tPt = 11 * sc;
                        const bPt = 9.5 * sc;
                        const sPt2 = 8.5 * sc;
                        pageBreak(lh(tPt) + lh(bPt) + 4);

                        // Degree + field … Date
                        style("bold", tPt, 17, 17, 17);
                        const deg = toPdfText(item.Degree);
                        ink(deg, M, tPt);
                        if (item.FieldOfStudy) {
                            const dw = pdf.getTextWidth(deg);
                            style("normal", 10.5 * sc, 85, 85, 85);
                            pdf.text(` in ${toPdfText(item.FieldOfStudy)}`, M + dw, y + bl(tPt));
                        }
                        style("normal", sPt2, 119, 119, 119);
                        ink(
                            `${fmtDate(item.StartDate)} - ${item.CurrentlyStudying ? "Present" : fmtDate(item.EndDate)}`,
                            PW - M, sPt2, "right"
                        );
                        y += lh(tPt);

                        // Institution
                        style("normal", bPt, 85, 85, 85);
                        para(toPdfText(item.Institution), M, bPt);

                        // Grade
                        if (item.Grade) {
                            style("normal", sPt2, 119, 119, 119);
                            para(`Grade: ${item.Grade}${item.MaxGrade ? `/${item.MaxGrade}` : ""}`, M, sPt2);
                        }
                        y += 3;
                    }

                    // ── Certificates ──
                    if (cat === "certificates") {
                        const tPt = 10.5 * sc;
                        const sPt2 = 8.5 * sc;
                        pageBreak(lh(tPt) + 4);

                        style("bold", tPt, 17, 17, 17);
                        const ct = toPdfText(item.Title);
                        ink(ct, M, tPt);

                        if (item.IssuingOrganization) {
                            const tw2 = pdf.getTextWidth(ct);
                            style("normal", 9.5 * sc, 85, 85, 85);
                            pdf.text(` | ${toPdfText(item.IssuingOrganization)}`, M + tw2, y + bl(tPt));
                        }

                        style("normal", sPt2, 119, 119, 119);
                        ink(fmtDate(item.IssuedDate), PW - M, sPt2, "right");
                        y += lh(tPt) + 2;
                    }

                    // ── Test Scores ──
                    if (cat === "testScores") {
                        const tPt = 10.5 * sc;
                        pageBreak(lh(tPt) + 4);

                        style("bold", tPt, 17, 17, 17);
                        const exam = toPdfText(`${item.ExamName} ${item.Year}`);
                        ink(exam, M, tPt);

                        if (item.Subject) {
                            const ew = pdf.getTextWidth(exam);
                            style("normal", 9.5 * sc, 85, 85, 85);
                            pdf.text(` (${toPdfText(item.Subject)})`, M + ew, y + bl(tPt));
                        }

                        // Score right-aligned
                        let scoreText = String(item.Score || "");
                        if (item.MaxScore) scoreText += `/${item.MaxScore}`;
                        if (item.Percentile) scoreText += ` | P${item.Percentile}`;
                        if (item.Rank) scoreText += ` | Rank ${item.Rank}`;
                        style("bold", 9.5 * sc, 17, 17, 17);
                        ink(toPdfText(scoreText), PW - M, 9.5 * sc, "right");
                        y += lh(tPt) + 2;
                    }
                });
            }

            pdf.save(customFileName || `${meta.name.replace(/\s+/g, "_")}_Resume.pdf`);
        } finally {
            patchUi({ generating: false });
        }
    }, [meta, selectedData, sectionOrder, resumeStyle, patchUi]);

    useEffect(() => {
        if (!pendingPresetPdfName || dataState.loading || ui.generating || !ui.previewMode) return;
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            if (cancelled) return;
            await handleGeneratePDF(pendingPresetPdfName);
            if (!cancelled) setPendingPresetPdfName(null);
        }, 180);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [dataState.loading, handleGeneratePDF, pendingPresetPdfName, ui.generating, ui.previewMode]);

    return (
        <div
            className="p-6"
            style={{ minHeight: "100vh", background: palette.background }}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-2xl font-black"
                        style={{ color: palette.textPrimary }}>
                        Resume Builder
                    </h1>
                    <p
                        className="mt-0.5 text-sm"
                        style={{ color: palette.textSecondary }}>
                        Select, reorder, preview real A4 pages, and download PDF
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <motion.button
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: palette.textSecondary
                        }}
                        whileHover={{ scale: 1.03 }}
                        onClick={fetchAll}>
                        <Refresh fontSize="small" /> Reload Data
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{
                            background: ui.previewMode ? `${palette.accent}20` : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: ui.previewMode ? palette.accent : palette.textSecondary
                        }}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => patchUi({ previewMode: !ui.previewMode })}>
                        <Preview fontSize="small" /> Preview
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
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
                        {ui.generating ? "Generating..." : "Download PDF"}
                    </motion.button>
                </div>
            </div>

            <div className={`flex gap-6 ${ui.previewMode ? "flex-col xl:flex-row" : "flex-col"}`}>
                <div className={ui.previewMode ? "flex-shrink-0 xl:w-96" : "w-full"}>
                    <div
                        className="mb-4 rounded-2xl p-5"
                        style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <h2
                            className="mb-1 text-sm font-black uppercase tracking-wide"
                            style={{ color: palette.textTertiary }}>
                            Resume Presets
                        </h2>
                        <p
                            className="mb-3 text-xs"
                            style={{ color: palette.textSecondary }}>
                            Presets store item IDs, header values, ordering, and document styling.
                        </p>
                        <div className="mb-3 flex flex-wrap gap-2">
                            <motion.button
                                className="rounded-lg px-3 py-2 text-xs font-bold"
                                style={{ background: palette.accent, color: "#fff" }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={openCreatePreset}
                                disabled={presetState.saving}>
                                New Preset
                            </motion.button>
                            <motion.button
                                className="rounded-lg px-3 py-2 text-xs font-semibold"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                    color: palette.textSecondary
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={captureCurrentSelectionToDraft}
                                disabled={presetState.saving}>
                                Capture Current Resume
                            </motion.button>
                        </div>

                        {presetState.error && (
                            <div
                                className="mb-3 rounded-lg border p-2 text-xs"
                                style={{
                                    background: "rgba(220,50,50,0.12)",
                                    color: "#DC3232",
                                    borderColor: "rgba(220,50,50,0.2)"
                                }}>
                                {presetState.error}
                            </div>
                        )}
                        {presetState.message && (
                            <div
                                className="mb-3 rounded-lg border p-2 text-xs"
                                style={{
                                    background: `${palette.accent}12`,
                                    color: palette.accent,
                                    borderColor: `${palette.accent}28`
                                }}>
                                {presetState.message}
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {presetEditorOpen && presetDraft && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3 overflow-hidden">
                                    <div
                                        className="rounded-xl border p-3"
                                        style={{
                                            borderColor,
                                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                                        }}>
                                        <p
                                            className="mb-2 text-xs font-black uppercase tracking-wide"
                                            style={{ color: palette.textTertiary }}>
                                            {editingPresetKey ? "Edit Preset" : "Create Preset"}
                                        </p>
                                        <div className="mb-2 grid grid-cols-2 gap-2">
                                            <input
                                                value={presetDraft.label}
                                                onChange={(event) =>
                                                    setPresetDraft((current) =>
                                                        current ? { ...current, label: event.target.value } : current
                                                    )
                                                }
                                                placeholder="Preset label"
                                                style={inputStyle}
                                            />
                                            <select
                                                value={presetDraft.iconKey}
                                                onChange={(event) =>
                                                    setPresetDraft((current) =>
                                                        current
                                                            ? {
                                                                ...current,
                                                                iconKey: event.target.value as IconKey
                                                            }
                                                            : current
                                                    )
                                                }
                                                style={inputStyle}>
                                                <option value="code">Code</option>
                                                <option value="preview">Preview</option>
                                                <option value="work">Work</option>
                                                <option value="school">School</option>
                                                <option value="folder">Folder</option>
                                            </select>
                                        </div>
                                        <div
                                            className="mb-3 rounded-lg p-2 text-[11px]"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                                color: palette.textSecondary
                                            }}>
                                            Captured:{" "}
                                            {Object.values(presetDraft.selectedIdsByCategory).reduce(
                                                (total, ids) => total + (ids?.length ?? 0),
                                                0
                                            )}{" "}
                                            items, {presetDraft.header.title}, font {Math.round(presetDraft.style.fontScale * 100)}%,
                                            padding {presetDraft.style.pagePadding}px.
                                        </div>
                                        <div className="flex gap-2">
                                            <motion.button
                                                className="rounded-lg px-3 py-2 text-xs font-bold"
                                                style={{
                                                    background: palette.accent,
                                                    color: "#fff",
                                                    opacity: presetState.saving ? 0.7 : 1
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={savePresetDraft}
                                                disabled={presetState.saving}>
                                                {presetState.saving ? "Saving..." : "Save Preset"}
                                            </motion.button>
                                            <motion.button
                                                className="rounded-lg px-3 py-2 text-xs font-semibold"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: palette.textSecondary
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={() => {
                                                    setPresetEditorOpen(false);
                                                    setEditingPresetKey(null);
                                                    setPresetDraft(null);
                                                }}>
                                                Cancel
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            {presets.map((preset) => {
                                const active = preset.key === activePresetKey;
                                return (
                                    <motion.div
                                        layout
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
                                        <div className="mb-2 flex items-center gap-2">
                                            <span
                                                className="inline-flex items-center gap-2 text-sm font-bold"
                                                style={{
                                                    color: active ? palette.accent : palette.textPrimary
                                                }}>
                                                {getPresetIcon(preset.iconKey)}
                                                {preset.label}
                                            </span>
                                            <span
                                                className="ml-auto text-[10px]"
                                                style={{ color: palette.textTertiary }}>
                                                {Object.values(preset.selectedIdsByCategory).reduce(
                                                    (total, ids) => total + (ids?.length ?? 0),
                                                    0
                                                )}{" "}
                                                items
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                className="flex-1 rounded-lg px-2 py-2 text-xs font-semibold"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: palette.textSecondary
                                                }}
                                                onClick={() => applyPreset(preset)}>
                                                <AutoAwesome fontSize="small" />
                                            </button>
                                            <button
                                                className="flex-1 rounded-lg px-2 py-2 text-xs font-bold"
                                                style={{ background: palette.accent, color: "#fff" }}
                                                onClick={() => applyPreset(preset, true)}>
                                                <PDFIcon fontSize="small" />
                                            </button>
                                            <button
                                                className="rounded-lg px-2 py-2 text-xs font-semibold"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: palette.textSecondary
                                                }}
                                                onClick={() => openEditPreset(preset)}>
                                                <EditIcon fontSize="small" />
                                            </button>
                                            <button
                                                className="rounded-lg px-2 py-2 text-xs font-semibold"
                                                style={{
                                                    background: "rgba(220,50,50,0.12)",
                                                    color: "#DC3232"
                                                }}
                                                onClick={() => deletePreset(preset.key)}>
                                                <DeleteIcon fontSize="small" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {presetState.loading && (
                                <p
                                    className="rounded-xl border p-3 text-xs"
                                    style={{ borderColor, color: palette.textTertiary }}>
                                    Loading presets...
                                </p>
                            )}
                            {!presetState.loading && presets.length === 0 && (
                                <p
                                    className="rounded-xl border p-3 text-xs"
                                    style={{ borderColor, color: palette.textTertiary }}>
                                    No presets yet. Capture the current resume to create one.
                                </p>
                            )}
                        </div>
                    </div>

                    <div
                        className="mb-4 rounded-2xl p-5"
                        style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <h2
                            className="mb-4 text-sm font-black uppercase tracking-wide"
                            style={{ color: palette.textTertiary }}>
                            Document Style
                        </h2>
                        <div className="space-y-4">
                            <label className="block">
                                <span
                                    className="mb-1 flex items-center justify-between text-xs font-semibold"
                                    style={{ color: palette.textSecondary }}>
                                    <span className="flex items-center gap-1.5">
                                        <FormatSize style={{ fontSize: 17 }} /> Font size
                                    </span>
                                    {Math.round(resumeStyle.fontScale * 100)}%
                                </span>
                                <input
                                    type="range"
                                    min="0.8"
                                    max="1.25"
                                    step="0.05"
                                    value={resumeStyle.fontScale}
                                    onChange={(event) =>
                                        setResumeStyle((current) => ({
                                            ...current,
                                            fontScale: Number(event.target.value)
                                        }))
                                    }
                                    className="w-full"
                                    style={{ accentColor: palette.accent }}
                                />
                            </label>
                            <label className="block">
                                <span
                                    className="mb-1 flex items-center justify-between text-xs font-semibold"
                                    style={{ color: palette.textSecondary }}>
                                    <span className="flex items-center gap-1.5">
                                        <Padding style={{ fontSize: 17 }} /> Page padding
                                    </span>
                                    {resumeStyle.pagePadding}px
                                </span>
                                <input
                                    type="range"
                                    min="24"
                                    max="72"
                                    step="2"
                                    value={resumeStyle.pagePadding}
                                    onChange={(event) =>
                                        setResumeStyle((current) => ({
                                            ...current,
                                            pagePadding: Number(event.target.value)
                                        }))
                                    }
                                    className="w-full"
                                    style={{ accentColor: palette.accent }}
                                />
                            </label>
                            <label className="block">
                                <span
                                    className="mb-1 flex items-center gap-1.5 text-xs font-semibold"
                                    style={{ color: palette.textSecondary }}>
                                    <Palette style={{ fontSize: 17 }} /> Accent color
                                </span>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={/^#[0-9a-f]{6}$/i.test(resumeStyle.accentColor) ? resumeStyle.accentColor : DEFAULT_ACCENT}
                                        onChange={(event) =>
                                            setResumeStyle((current) => ({
                                                ...current,
                                                accentColor: event.target.value
                                            }))
                                        }
                                        className="h-9 w-12 cursor-pointer rounded-lg border bg-transparent p-1"
                                        style={{ borderColor }}
                                    />
                                    <input
                                        value={resumeStyle.accentColor}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setResumeStyle((current) => ({
                                                ...current,
                                                accentColor: value
                                            }));
                                        }}
                                        onBlur={() => {
                                            if (!/^#[0-9a-f]{6}$/i.test(resumeStyle.accentColor)) {
                                                setResumeStyle((current) => ({
                                                    ...current,
                                                    accentColor: DEFAULT_ACCENT
                                                }));
                                            }
                                        }}
                                        style={inputStyle}
                                    />
                                </div>
                            </label>
                        </div>

                        <h3
                            className="mb-2 mt-5 text-xs font-black uppercase tracking-wide"
                            style={{ color: palette.textTertiary }}>
                            Section Order
                        </h3>
                        <p
                            className="mb-2 text-[11px]"
                            style={{ color: palette.textTertiary }}>
                            Summary stays at the top. Drag every other section below.
                        </p>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleSectionDragEnd}>
                            <SortableContext
                                items={sectionOrder.map((category) => `section:${category}`)}
                                strategy={verticalListSortingStrategy}>
                                <div className="space-y-1.5">
                                    {sectionOrder.map((category) => (
                                        <SortableSectionRow
                                            key={category}
                                            category={category}
                                            selectedCount={selection[category].size}
                                            textPrimary={palette.textPrimary}
                                            textTertiary={palette.textTertiary}
                                            accent={palette.accent}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div
                        className="mb-4 rounded-2xl p-5"
                        style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <h2
                            className="mb-4 text-sm font-black uppercase tracking-wide"
                            style={{ color: palette.textTertiary }}>
                            Resume Header
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.entries(meta) as [keyof ResumeMeta, string][]).map(([key, value]) =>
                                key === "summary" ? (
                                    <div
                                        key={key}
                                        className="col-span-2">
                                        <label
                                            className="mb-1 block text-xs font-semibold capitalize"
                                            style={{ color: palette.textTertiary }}>
                                            {key}
                                        </label>
                                        <textarea
                                            value={value}
                                            rows={3}
                                            onChange={(event) =>
                                                setMeta((current) => ({
                                                    ...current,
                                                    [key]: event.target.value
                                                }))
                                            }
                                            style={{ ...inputStyle, resize: "vertical" }}
                                        />
                                    </div>
                                ) : (
                                    <div key={key}>
                                        <label
                                            className="mb-1 block text-xs font-semibold capitalize"
                                            style={{ color: palette.textTertiary }}>
                                            {key}
                                        </label>
                                        <input
                                            value={value}
                                            onChange={(event) =>
                                                setMeta((current) => ({
                                                    ...current,
                                                    [key]: event.target.value
                                                }))
                                            }
                                            style={inputStyle}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {dataState.loading ? (
                        <div
                            className="py-8 text-center"
                            style={{ color: palette.textTertiary }}>
                            Loading portfolio data...
                        </div>
                    ) : (
                        SECTIONS.map((section) => {
                            const byId = new Map(dataState.data[section.key].map((item) => [getItemId(section.key, item), item]));
                            const orderedItems = itemOrder[section.key].map((id) => byId.get(id)).filter(Boolean);
                            const ids = orderedItems.map((item) => getItemId(section.key, item));
                            const allSelected = ids.length > 0 && ids.every((id) => selection[section.key].has(id));
                            const isCollapsed = !!collapsed[section.key];

                            return (
                                <div
                                    key={section.key}
                                    className="mb-3 overflow-hidden rounded-2xl"
                                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                    <div
                                        className="flex cursor-pointer items-center justify-between px-4 py-3"
                                        onClick={() =>
                                            setCollapsed((current) => ({
                                                ...current,
                                                [section.key]: !current[section.key]
                                            }))
                                        }>
                                        <div className="flex items-center gap-2">
                                            <span style={{ color: palette.accent }}>{section.icon}</span>
                                            <span
                                                className="text-sm font-bold"
                                                style={{ color: palette.textPrimary }}>
                                                {section.label}
                                            </span>
                                            <span
                                                className="rounded-full px-1.5 py-0.5 text-xs"
                                                style={{
                                                    background: `${palette.accent}18`,
                                                    color: palette.accent
                                                }}>
                                                {selection[section.key].size}/{orderedItems.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                className="rounded-lg px-2 py-1 text-xs font-semibold"
                                                style={{
                                                    background: allSelected
                                                        ? `${palette.accent}18`
                                                        : isDark
                                                            ? "rgba(255,255,255,0.06)"
                                                            : "rgba(0,0,0,0.05)",
                                                    color: allSelected ? palette.accent : palette.textTertiary
                                                }}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    toggleSection(section.key);
                                                }}
                                                whileHover={{ scale: 1.05 }}>
                                                {allSelected ? "Deselect All" : "Select All"}
                                            </motion.button>
                                            {isCollapsed ? (
                                                <ExpandMore
                                                    fontSize="small"
                                                    style={{ color: palette.textTertiary }}
                                                />
                                            ) : (
                                                <ExpandLess
                                                    fontSize="small"
                                                    style={{ color: palette.textTertiary }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <AnimatePresence initial={false}>
                                        {!isCollapsed && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                exit={{ height: 0 }}
                                                className="overflow-hidden">
                                                <div
                                                    className="border-t px-4 pb-3 pt-2"
                                                    style={{ borderColor }}>
                                                    {orderedItems.length === 0 ? (
                                                        <p
                                                            className="py-2 text-xs"
                                                            style={{ color: palette.textTertiary }}>
                                                            No {section.label.toLowerCase()} added yet
                                                        </p>
                                                    ) : (
                                                        <DndContext
                                                            sensors={sensors}
                                                            collisionDetection={closestCenter}
                                                            onDragEnd={(event) => handleItemDragEnd(section.key, event)}>
                                                            <SortableContext
                                                                items={ids.map((id) => `${section.key}:${id}`)}
                                                                strategy={verticalListSortingStrategy}>
                                                                <div className="space-y-0.5">
                                                                    {orderedItems.map((item) => {
                                                                        const id = getItemId(section.key, item);
                                                                        return (
                                                                            <SortableSelectionItem
                                                                                key={id}
                                                                                category={section.key}
                                                                                itemId={id}
                                                                                label={section.display(item)}
                                                                                checked={selection[section.key].has(id)}
                                                                                accent={palette.accent}
                                                                                textPrimary={palette.textPrimary}
                                                                                textTertiary={palette.textTertiary}
                                                                                isDark={isDark}
                                                                                onToggle={toggleItem}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            </SortableContext>
                                                        </DndContext>
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

                {ui.previewMode && (
                    <div className="min-w-0 flex-1">
                        <div
                            className="rounded-2xl p-3"
                            style={{
                                border: `1px solid ${borderColor}`,
                                background: isDark ? "rgba(0,0,0,0.24)" : "rgba(0,0,0,0.035)",
                                overflowX: "auto"
                            }}>
                            <ResumePreview
                                ref={previewRef}
                                meta={meta}
                                data={selectedData}
                                sectionOrder={sectionOrder}
                                styleConfig={resumeStyle}
                            />
                        </div>
                    </div>
                )}
            </div>

            {!ui.previewMode && (
                <div className="mt-6 flex justify-end">
                    <motion.button
                        className="flex items-center gap-2 rounded-xl px-6 py-3 font-bold"
                        style={{ background: palette.accent, color: "#fff" }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => patchUi({ previewMode: true })}>
                        <Preview /> Preview A4 Pages
                    </motion.button>
                </div>
            )}
        </div>
    );
}

interface ResumePreviewProps {
    meta: ResumeMeta;
    data: DataState;
    sectionOrder: Category[];
    styleConfig: ResumeStyle;
}

interface ResumeBlock {
    key: string;
    node: React.ReactNode;
}

const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(function ResumePreview(
    { meta, data, sectionOrder, styleConfig },
    ref
) {
    const measureRef = useRef<HTMLDivElement>(null);
    const [pageKeys, setPageKeys] = useState<string[][]>([]);
    const accent = /^#[0-9a-f]{6}$/i.test(styleConfig.accentColor) ? styleConfig.accentColor : DEFAULT_ACCENT;
    const scale = styleConfig.fontScale;
    const px = useCallback((value: number) => Math.round(value * scale * 100) / 100, [scale]);

    const formatDate = useCallback(
        (date?: string | Date) =>
            date
                ? new Date(date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short"
                })
                : "Present",
        []
    );

    const sectionTitle = useCallback(
        (title: string) => (
            <h2
                style={{
                    fontSize: px(12),
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: px(1.2),
                    color: accent,
                    borderBottom: "1px solid #e0e0e0",
                    paddingBottom: px(4),
                    margin: `0 0 ${px(10)}px`
                }}>
                {title}
            </h2>
        ),
        [accent, px]
    );

    const blocks = useMemo(() => {
        const result: ResumeBlock[] = [];
        const withTitle = (title: string, node: React.ReactNode) => (
            <>
                {sectionTitle(title)}
                {node}
            </>
        );

        result.push({
            key: "header",
            node: (
                <div
                    style={{
                        borderBottom: `2px solid ${accent}`,
                        paddingBottom: px(18)
                    }}>
                    <h1
                        style={{
                            fontSize: px(28),
                            fontWeight: 900,
                            margin: 0,
                            color: "#111"
                        }}>
                        {meta.name}
                    </h1>
                    <p
                        style={{
                            fontSize: px(15),
                            fontWeight: 650,
                            color: accent,
                            margin: `${px(4)}px 0 0`
                        }}>
                        {meta.title}
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            marginTop: px(10),
                            fontSize: px(10.5),
                            lineHeight: 1.4,
                            color: "#555"
                        }}>
                        {[
                            {
                                label: "Email",
                                value: meta.email,
                                href: meta.email ? `mailto:${meta.email}` : "",
                                svgPath: SVG_PATHS.email
                            },
                            {
                                label: "Phone",
                                value: meta.phone,
                                href: meta.phone ? `tel:${meta.phone.replace(/\s+/g, "")}` : "",
                                svgPath: SVG_PATHS.phone
                            },
                            {
                                label: "Location",
                                value: meta.location,
                                href: "",
                                svgPath: SVG_PATHS.location
                            },
                            {
                                label: "Website",
                                value: normalizeUrl(meta.website),
                                href: normalizeUrl(meta.website),
                                svgPath: SVG_PATHS.language
                            },
                            {
                                label: "GitHub",
                                value: normalizeUrl(meta.github),
                                href: normalizeUrl(meta.github),
                                svgPath: SVG_PATHS.github
                            },
                            {
                                label: "LinkedIn",
                                value: normalizeUrl(meta.linkedin),
                                href: normalizeUrl(meta.linkedin),
                                svgPath: SVG_PATHS.linkedin
                            }
                        ]
                            .filter((contact) => contact.value)
                            .map((contact) => {
                                const content = (
                                    <>
                                        <PdfSafeIcon svgPath={contact.svgPath} size={Math.round(px(13))} color={accent} />
                                        <span style={{ verticalAlign: "middle" }}>{contact.value}</span>
                                    </>
                                );
                                const sharedStyle: React.CSSProperties = {
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: px(3),
                                    marginRight: px(12),
                                    marginBottom: px(4),
                                    color: "#555",
                                    textDecoration: "none",
                                    overflowWrap: "anywhere"
                                };

                                return contact.href ? (
                                    <a
                                        key={contact.label}
                                        href={contact.href}
                                        aria-label={`${contact.label}: ${contact.value}`}
                                        title={contact.label}
                                        style={sharedStyle}>
                                        {content}
                                    </a>
                                ) : (
                                    <span
                                        key={contact.label}
                                        aria-label={`${contact.label}: ${contact.value}`}
                                        title={contact.label}
                                        style={sharedStyle}>
                                        {content}
                                    </span>
                                );
                            })}
                    </div>
                </div>
            )
        });

        if (meta.summary) {
            result.push({
                key: "summary",
                node: withTitle(
                    "Summary",
                    <p
                        style={{
                            fontSize: px(12.5),
                            color: "#333",
                            lineHeight: 1.55,
                            margin: 0
                        }}>
                        {meta.summary}
                    </p>
                )
            });
        }

        sectionOrder.forEach((category) => {
            if (data[category].length === 0) return;
            const title =
                category === "certificates"
                    ? "Certifications"
                    : category === "testScores"
                        ? "Test Scores & Rankings"
                        : SECTION_BY_KEY[category].label;

            if (category === "skills") {
                result.push({
                    key: "skills",
                    node: withTitle(
                        title,
                        <KeywordLine
                            label=""
                            tags={data.skills.map((skill) =>
                                skill.Proficiency == null ? skill.Name : `${skill.Name} (${skill.Proficiency}%)`
                            )}
                            fontSize={px(10.5)}
                        />
                    )
                });
                return;
            }

            data[category].forEach((item, index) => {
                let content: React.ReactNode = null;

                if (category === "experience") {
                    content = (
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    gap: px(12)
                                }}>
                                <div style={{ minWidth: 0 }}>
                                    <span style={{ fontWeight: 700, fontSize: px(13.5) }}>{item.Role}</span>
                                    <span style={{ color: accent, fontSize: px(12.5) }}> - {item.Company}</span>
                                </div>
                                <span
                                    style={{
                                        flexShrink: 0,
                                        fontSize: px(10.5),
                                        color: "#777"
                                    }}>
                                    {formatDate(item.StartDate)} - {item.CurrentlyWorking ? "Present" : formatDate(item.EndDate)}
                                </span>
                            </div>
                            {item.Location && (
                                <p
                                    style={{
                                        fontSize: px(10.5),
                                        color: "#777",
                                        margin: `${px(2)}px 0 ${px(4)}px`
                                    }}>
                                    {item.Location}
                                    {item.EmploymentType ? ` | ${String(item.EmploymentType).replaceAll("_", " ")}` : ""}
                                </p>
                            )}
                            {item.Description && (
                                <p
                                    style={{
                                        fontSize: px(11.5),
                                        color: "#444",
                                        lineHeight: 1.48,
                                        margin: `${px(3)}px 0`
                                    }}>
                                    {item.Description}
                                </p>
                            )}
                            {Array.isArray(item.Achievements) && item.Achievements.length > 0 && (
                                <ul
                                    style={{
                                        margin: `${px(4)}px 0 0 ${px(16)}px`,
                                        padding: 0,
                                        fontSize: px(11.5),
                                        lineHeight: 1.45,
                                        color: "#444"
                                    }}>
                                    {item.Achievements.map((achievement: string, achievementIndex: number) => (
                                        <li key={`${achievement}-${achievementIndex}`}>{achievement}</li>
                                    ))}
                                </ul>
                            )}
                            <KeywordLine
                                label=""
                                tags={normalizeTags(item.TechStack)}
                                fontSize={px(10)}
                            />
                        </div>
                    );
                }

                if (category === "projects") {
                    const projectLinks = [
                        ["GitHub", item.Links?.github, SVG_PATHS.github],
                        ["Live", item.Links?.live, SVG_PATHS.language],
                        ["NPM", item.Links?.npm, SVG_PATHS.code],
                        ["Documentation", item.Links?.documentation, SVG_PATHS.language],
                        ["Demo", item.Links?.demo, SVG_PATHS.language],
                        ["Chrome Web Store", item.Links?.chromeWebstore, SVG_PATHS.language],
                        ["Play Store", item.Links?.playstore, SVG_PATHS.language]
                    ]
                        .filter(([, value]) => normalizeUrl(value))
                        .map(([label, value, svgPath]) => {
                            const url = normalizeUrl(value);
                            return { label: String(label), url, svgPath: String(svgPath) };
                        });

                    content = (
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: px(12)
                                }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <span style={{ fontWeight: 700, fontSize: px(13.5) }}>{item.Title}</span>
                                    {/* {item.Type && (
                                        <span
                                            style={{
                                                marginLeft: px(6),
                                                fontSize: px(10.5),
                                                color: "#777"
                                            }}>
                                            {String(item.Type).replaceAll("_", " ")}
                                        </span>
                                    )} */}
                                </div>
                                {projectLinks.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            justifyContent: "flex-end",
                                            gap: px(6),
                                            flexShrink: 0,
                                            maxWidth: "55%"
                                        }}>
                                        {projectLinks.map((link) => (
                                            <a
                                                key={`${item.Title}:${link.label}`}
                                                href={link.url}
                                                aria-label={`${link.label}: ${link.url}`}
                                                title={link.label}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: px(4),
                                                    padding: `${px(2)}px ${px(2)}px`,
                                                    borderRadius: 999,
                                                    textDecoration: "none",
                                                    fontSize: px(10),
                                                    lineHeight: 1.2,
                                                    whiteSpace: "nowrap"
                                                }}>
                                                <PdfSafeIcon svgPath={link.svgPath} size={Math.round(px(12))} color="#777" />
                                            </a>
                                        ))}
                                        <span
                                            style={{
                                                flexShrink: 0,
                                                fontSize: px(10.5),
                                                color: "#777"
                                            }}>
                                            {formatDate(item.StartDate)} - {item.CurrentlyWorking ? "Present" : formatDate(item.EndDate)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {item.Description && (
                                <p
                                    style={{
                                        fontSize: px(11.5),
                                        color: "#444",
                                        margin: `${px(3)}px 0 ${px(4)}px`,
                                        lineHeight: 1.48
                                    }}>
                                    {item.Description}
                                </p>
                            )}
                            <KeywordLine
                                label=""
                                tags={normalizeTags(item.TechStack)}
                                fontSize={px(10)}
                            />
                        </div>
                    );
                }

                if (category === "education") {
                    content = (
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    gap: px(12)
                                }}>
                                <div>
                                    <span style={{ fontWeight: 700, fontSize: px(13.5) }}>{item.Degree}</span>
                                    {item.FieldOfStudy && (
                                        <span style={{ color: "#555", fontSize: px(12.5) }}> in {item.FieldOfStudy}</span>
                                    )}
                                </div>
                                <span
                                    style={{
                                        flexShrink: 0,
                                        fontSize: px(10.5),
                                        color: "#777"
                                    }}>
                                    {formatDate(item.StartDate)} - {item.CurrentlyStudying ? "Present" : formatDate(item.EndDate)}
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: px(11.5),
                                    color: "#555",
                                    margin: `${px(2)}px 0`
                                }}>
                                {item.Institution}
                            </p>
                            {item.Grade && (
                                <p
                                    style={{
                                        fontSize: px(10.5),
                                        color: "#777",
                                        margin: 0
                                    }}>
                                    Grade: {item.Grade}
                                    {item.MaxGrade ? `/${item.MaxGrade}` : ""}
                                </p>
                            )}
                        </div>
                    );
                }

                if (category === "certificates") {
                    content = (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: px(12)
                            }}>
                            <div>
                                <span style={{ fontWeight: 650, fontSize: px(12.5) }}>{item.Title}</span>
                                {item.IssuingOrganization && (
                                    <span style={{ color: "#555", fontSize: px(11.5) }}> | {item.IssuingOrganization}</span>
                                )}
                            </div>
                            <span
                                style={{
                                    flexShrink: 0,
                                    fontSize: px(10.5),
                                    color: "#777"
                                }}>
                                {formatDate(item.IssuedDate)}
                            </span>
                        </div>
                    );
                }

                if (category === "testScores") {
                    content = (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: px(12)
                            }}>
                            <div>
                                <span style={{ fontWeight: 650, fontSize: px(12.5) }}>
                                    {item.ExamName} {item.Year}
                                </span>
                                {item.Subject && <span style={{ color: "#555", fontSize: px(11.5) }}> ({item.Subject})</span>}
                            </div>
                            <span
                                style={{
                                    flexShrink: 0,
                                    fontSize: px(11.5),
                                    color: "#111",
                                    fontWeight: 650
                                }}>
                                {item.Score}
                                {item.MaxScore ? `/${item.MaxScore}` : ""}
                                {item.Percentile ? ` | P${item.Percentile}` : ""}
                                {item.Rank ? ` | Rank ${item.Rank}` : ""}
                            </span>
                        </div>
                    );
                }

                result.push({
                    key: `${category}:${getItemId(category, item)}`,
                    node: index === 0 ? withTitle(title, content) : content
                });
            });
        });

        return result;
    }, [accent, data, formatDate, meta, px, sectionOrder, sectionTitle]);

    useLayoutEffect(() => {
        const measure = measureRef.current;
        if (!measure) return;

        const paginate = () => {
            const elements = Array.from(measure.querySelectorAll<HTMLElement>("[data-resume-block]"));
            const availableHeight = A4_HEIGHT_PX - styleConfig.pagePadding * 2;
            const nextPages: string[][] = [[]];
            let usedHeight = 0;

            elements.forEach((element) => {
                const key = element.dataset.resumeBlock;
                if (!key) return;
                const height = Math.ceil(element.getBoundingClientRect().height);
                const currentPage = nextPages[nextPages.length - 1];
                if (currentPage.length > 0 && usedHeight + height > availableHeight) {
                    nextPages.push([key]);
                    usedHeight = height;
                } else {
                    currentPage.push(key);
                    usedHeight += height;
                }
            });

            setPageKeys((current) => {
                const currentSignature = current.map((page) => page.join("|")).join("||");
                const nextSignature = nextPages.map((page) => page.join("|")).join("||");
                return currentSignature === nextSignature ? current : nextPages;
            });
        };

        paginate();
        const frame = requestAnimationFrame(paginate);
        void document.fonts?.ready.then(paginate);
        return () => cancelAnimationFrame(frame);
    }, [blocks, styleConfig.pagePadding]);

    const blockByKey = useMemo(() => new Map(blocks.map((block) => [block.key, block] as const)), [blocks]);
    const pages = pageKeys.length > 0 ? pageKeys : [blocks.map((block) => block.key)];
    const contentWidth = A4_WIDTH_PX - styleConfig.pagePadding * 2;

    const renderBlock = (block: ResumeBlock, measuring = false) => (
        <div
            key={block.key}
            data-resume-block={measuring ? block.key : undefined}
            style={{
                boxSizing: "border-box",
                paddingBottom: block.key === "header" ? px(20) : px(16),
                breakInside: "avoid"
            }}>
            {block.node}
        </div>
    );

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 24,
                width: A4_WIDTH_PX,
                minWidth: A4_WIDTH_PX,
                margin: "0 auto",
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif"
            }}>
            <div
                ref={measureRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    left: -10000,
                    top: 0,
                    width: contentWidth,
                    color: "#111"
                }}>
                {blocks.map((block) => renderBlock(block, true))}
            </div>

            {pages.map((page, pageIndex) => (
                <div
                    key={`${pageIndex}:${page.join("|")}`}
                    data-resume-page="true"
                    style={{
                        boxSizing: "border-box",
                        position: "relative",
                        width: A4_WIDTH_PX,
                        height: A4_HEIGHT_PX,
                        flexShrink: 0,
                        overflow: "hidden",
                        background: "#fff",
                        color: "#111",
                        padding: styleConfig.pagePadding,
                        boxShadow: "0 16px 40px rgba(0,0,0,0.16)"
                    }}>
                    {page.map((key) => {
                        const block = blockByKey.get(key);
                        return block ? renderBlock(block) : null;
                    })}
                    <div
                        style={{
                            position: "absolute",
                            width: 0,
                            height: 0,
                            overflow: "hidden"
                        }}>
                        Page {pageIndex + 1}
                    </div>
                </div>
            ))}
        </div>
    );
});

function KeywordLine({ label, tags, fontSize }: { label: string; tags: string[]; fontSize: number }) {
    if (tags.length === 0) return null;

    return (
        <div
            style={{
                margin: "4px 0 0",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 6,
                color: "#444",
                fontSize,
                lineHeight: 1.45
            }}>
            {label && (
                <span
                    style={{
                        display: "inline-block",
                        boxSizing: "border-box",
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#e0e0e0",
                        color: "#555",
                        fontWeight: 600,
                        lineHeight: 1.35,
                        whiteSpace: "nowrap",
                        overflow: "hidden"
                    }}>
                    {label}
                </span>
            )}
            {tags.map((tag) => (
                <span
                    key={tag}
                    style={{
                        display: "inline-block",
                        boxSizing: "border-box",
                        maxWidth: "100%",
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid #d7dbe0",
                        background: "#f5f7fa",
                        color: "#333",
                        fontWeight: 600,
                        lineHeight: 1.35,
                        whiteSpace: "nowrap",
                        overflow: "hidden"
                    }}>
                    {tag}
                </span>
            ))}
        </div>
    );
}
