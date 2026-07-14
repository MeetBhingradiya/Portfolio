/**
 * Admin — JSON → PDF Document Generator
 * Generate styled PDF documents from a structured JSON payload.
 *
 * Supported block types:
 *   title | description | step | code | source | footer
 *
 * Optional features:
 *   institution logo/header, draft watermark, page numbers (Page X of Y),
 *   PDF metadata, tamper-evident SHA-256 hash block.
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import {
    Download,
    ContentCopy,
    Check,
    Refresh,
    Code,
    Description,
    FormatListNumbered,
    Link as LinkIcon,
    Notes,
    Title,
    ExpandMore,
    ExpandLess,
    Security,
    Article
} from "@mui/icons-material";

// ─── JSON Schema Types ────────────────────────────────────────────────────────

interface DocMeta {
    /** Document title (also used as PDF title metadata) */
    title?: string;
    /** Author name */
    author?: string;
    /** Subject / topic */
    subject?: string;
    /** Comma-separated keyword list */
    keywords?: string;
    /** Institution or organisation name shown in header */
    institution?: string;
    /** Publicly accessible URL for an institution logo image (PNG/JPG) */
    logoUrl?: string;
    /** When true, a diagonal DRAFT watermark is stamped on every page */
    isDraft?: boolean;
    /** Human-readable document ID shown in the hash block */
    documentId?: string;
    /** Include "Page X of Y" footer numbers */
    showPageNumbers?: boolean;
}

interface TitleBlock   { type: "title";       content: string }
interface DescBlock    { type: "description"; content: string }
interface StepBlock    { type: "step";        title?: string; content: string }
interface CodeBlock    { type: "code";        language?: string; title?: string; content: string }
interface SourceBlock  { type: "source";      url: string; title?: string; description?: string }
interface FooterBlock  { type: "footer";      content: string }

type DocBlock = TitleBlock | DescBlock | StepBlock | CodeBlock | SourceBlock | FooterBlock;

interface DocPayload {
    metadata?: DocMeta;
    blocks?: DocBlock[];
}

// ─── Sample document ──────────────────────────────────────────────────────────

const SAMPLE: DocPayload = {
    metadata: {
        title: "Getting Started with TypeScript",
        author: "Meet Bhingradiya",
        subject: "TypeScript tutorial document",
        keywords: "typescript, javascript, tutorial",
        institution: "My Institution",
        logoUrl: "",
        isDraft: true,
        documentId: "DOC-2025-001",
        showPageNumbers: true
    },
    blocks: [
        { type: "title", content: "Getting Started with TypeScript" },
        {
            type: "description",
            content:
                "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale."
        },
        {
            type: "step",
            title: "Step 1 \u2014 Install TypeScript",
            content: "Run the following command to install TypeScript globally on your system."
        },
        {
            type: "code",
            language: "bash",
            title: "Installation",
            content: "npm install -g typescript\ntsc --version"
        },
        {
            type: "step",
            title: "Step 2 \u2014 Create a project",
            content: "Initialise a new TypeScript configuration file in your project directory."
        },
        {
            type: "code",
            language: "bash",
            title: "Project Setup",
            content: "mkdir my-project && cd my-project\nnpm init -y\nnpx tsc --init"
        },
        {
            type: "code",
            language: "typescript",
            title: "Hello World",
            content: 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));'
        },
        {
            type: "source",
            title: "Official TypeScript Documentation",
            url: "https://www.typescriptlang.org/docs/",
            description: "Comprehensive reference for the TypeScript language."
        },
        {
            type: "footer",
            content: "\u00a9 2025 My Institution \u2014 Generated with DocGen"
        }
    ]
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

async function generatePDF(payload: DocPayload, contentHash: string): Promise<Blob> {
    const { jsPDF } = await import("jspdf");

    const meta      = payload.metadata ?? {};
    const blocks    = payload.blocks   ?? [];
    const isDraft   = meta.isDraft         ?? false;
    const showPgNos = meta.showPageNumbers ?? true;

    // A4 portrait, mm units
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ── PDF Metadata ─────────────────────────────────────────────────────────
    const props: Parameters<typeof doc.setProperties>[0] = {};
    if (meta.title)    props.title    = meta.title;
    if (meta.author)   props.author   = meta.author;
    if (meta.subject)  props.subject  = meta.subject;
    if (meta.keywords) props.keywords = meta.keywords;
    if (meta.author)   props.creator  = meta.author;
    doc.setProperties(props);

    const PW = doc.internal.pageSize.getWidth();    // 210 mm
    const PH = doc.internal.pageSize.getHeight();   // 297 mm
    const ML = 18;  // left margin
    const MR = 18;  // right margin
    const MT = 16;  // top margin
    const MB = 14;  // bottom margin (page number area)
    const TW = PW - ML - MR;

    let y = MT;

    function newPage() {
        doc.addPage();
        y = MT;
    }

    function ensureSpace(needed: number) {
        if (y + needed > PH - MB - (showPgNos ? 8 : 0)) newPage();
    }

    // ── Institution Header (first page) ──────────────────────────────────────
    if (meta.institution || meta.logoUrl) {
        const headerH = 16;
        doc.setFillColor(24, 24, 36);
        doc.rect(0, 0, PW, headerH, "F");

        let logoEndX = ML;

        if (meta.logoUrl) {
            try {
                const resp = await fetch(meta.logoUrl);
                const ab   = await resp.arrayBuffer();
                const b64  = btoa(String.fromCharCode(...new Uint8Array(ab)));
                const ext  = meta.logoUrl.toLowerCase().endsWith(".png") ? "PNG" : "JPEG";
                doc.addImage(b64, ext, ML, 2, 12, 12);
                logoEndX = ML + 14;
            } catch {
                // skip logo if network/CORS error
            }
        }

        if (meta.institution) {
            doc.setFontSize(9);
            doc.setTextColor(220, 220, 230);
            doc.text(meta.institution, logoEndX, 10.5);
        }

        y = headerH + 6;
    }

    // ── Watermark helper ─────────────────────────────────────────────────────
    function stampWatermark(pageIndex: number) {
        doc.setPage(pageIndex);
        doc.saveGraphicsState();
        doc.setFontSize(52);
        doc.setTextColor(200, 60, 60);
        // @ts-ignore
        doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
        doc.text("DRAFT", PW / 2, PH / 2, {
            align: "center",
            angle: 45,
            baseline: "middle"
        });
        doc.restoreGraphicsState();
    }

    // ── Page-number helper ───────────────────────────────────────────────────
    function stampPageNumbers(total: number) {
        for (let i = 1; i <= total; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${total}`, PW - MR, PH - 6, { align: "right" });
        }
    }

    // ── Block rendering ───────────────────────────────────────────────────────

    for (const block of blocks) {
        switch (block.type) {

            // ── Title ─────────────────────────────────────────────────────
            case "title": {
                ensureSpace(20);
                doc.setFontSize(20);
                doc.setTextColor(30, 30, 45);
                const lines = doc.splitTextToSize(block.content, TW) as string[];
                doc.text(lines, ML, y);
                y += lines.length * 8 + 2;
                // Accent underline
                doc.setDrawColor(99, 102, 241);
                doc.setLineWidth(0.6);
                doc.line(ML, y, ML + Math.min(TW, 70), y);
                y += 6;
                break;
            }

            // ── Description ───────────────────────────────────────────────
            case "description": {
                ensureSpace(16);
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 80);
                const lines = doc.splitTextToSize(block.content, TW) as string[];
                doc.text(lines, ML, y);
                y += lines.length * 6 + 5;
                break;
            }

            // ── Step by Step ──────────────────────────────────────────────
            case "step": {
                ensureSpace(24);
                if (block.title) {
                    doc.setFontSize(12);
                    doc.setTextColor(99, 102, 241);
                    const tLines = doc.splitTextToSize(block.title, TW - 4) as string[];
                    doc.text(tLines, ML, y);
                    y += tLines.length * 6 + 1;
                }
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 70);
                const cLines = doc.splitTextToSize(block.content, TW - 4) as string[];
                doc.text(cLines, ML + 2, y);
                y += cLines.length * 5 + 6;
                break;
            }

            // ── Code (Practical / Source Code Rendering) ──────────────────
            case "code": {
                const padding = 3;
                const lineH   = 4.6;
                const codeLines = block.content.split("\n");
                const blockH    = codeLines.length * lineH + padding * 2 + (block.title ? 8 : 0);

                ensureSpace(blockH + 4);

                if (block.title) {
                    doc.setFontSize(9);
                    doc.setTextColor(120, 120, 140);
                    const badge = block.language
                        ? `${block.title}  [${block.language}]`
                        : block.title;
                    doc.text(badge, ML, y);
                    y += 6;
                }

                // Background
                doc.setFillColor(245, 245, 250);
                doc.setDrawColor(210, 210, 225);
                doc.setLineWidth(0.3);
                doc.roundedRect(ML, y, TW, codeLines.length * lineH + padding * 2, 2, 2, "FD");

                // Monospace text
                doc.setFontSize(8.5);
                doc.setTextColor(30, 30, 50);
                doc.setFont("courier", "normal");
                for (let i = 0; i < codeLines.length; i++) {
                    const cx = ML + padding + 1;
                    const cy = y + padding + i * lineH + lineH * 0.72;
                    doc.text(codeLines[i].substring(0, 120), cx, cy);
                }
                doc.setFont("helvetica", "normal");

                y += codeLines.length * lineH + padding * 2 + 5;
                break;
            }

            // ── Source / Reference ────────────────────────────────────────
            case "source": {
                const srcH = 14 + (block.description ? 5 : 0);
                ensureSpace(srcH + 4);

                doc.setFillColor(238, 242, 255);
                doc.setDrawColor(180, 190, 230);
                doc.setLineWidth(0.3);
                doc.roundedRect(ML, y, TW, srcH, 2, 2, "FD");

                let ry = y + 5;
                if (block.title) {
                    doc.setFontSize(9);
                    doc.setTextColor(60, 70, 150);
                    doc.text(block.title, ML + 3, ry);
                    ry += 5;
                }
                doc.setFontSize(8);
                doc.setTextColor(80, 100, 180);
                const urlLines = doc.splitTextToSize(block.url, TW - 6) as string[];
                doc.text(urlLines, ML + 3, ry);

                if (block.description) {
                    ry += urlLines.length * 4 + 1;
                    doc.setTextColor(100, 100, 120);
                    const dLines = doc.splitTextToSize(block.description, TW - 6) as string[];
                    doc.text(dLines, ML + 3, ry);
                }

                y += srcH + 4;
                break;
            }

            // ── Footer ────────────────────────────────────────────────────
            case "footer": {
                ensureSpace(14);
                doc.setDrawColor(200, 200, 215);
                doc.setLineWidth(0.3);
                doc.line(ML, y, PW - MR, y);
                y += 4;
                doc.setFontSize(8.5);
                doc.setTextColor(130, 130, 150);
                const fLines = doc.splitTextToSize(block.content, TW) as string[];
                doc.text(fLines, ML, y);
                y += fLines.length * 5 + 4;
                break;
            }
        }
    }

    // ── Tamper-Evident Hash Block ─────────────────────────────────────────────
    {
        ensureSpace(28);
        doc.setFillColor(245, 248, 255);
        doc.setDrawColor(180, 195, 240);
        doc.setLineWidth(0.4);
        doc.roundedRect(ML, y, TW, 24, 2, 2, "FD");

        doc.setFontSize(8);
        doc.setTextColor(80, 90, 160);
        doc.text("Document Integrity Hash (SHA-256)", ML + 3, y + 5.5);

        // Split hash visually for readability
        doc.setFontSize(7);
        doc.setFont("courier", "normal");
        doc.setTextColor(40, 50, 120);
        doc.text(contentHash.substring(0, 32), ML + 3, y + 11.5);
        doc.text(contentHash.substring(32),    ML + 3, y + 16);
        doc.setFont("helvetica", "normal");

        if (meta.documentId) {
            doc.setFontSize(7.5);
            doc.setTextColor(120, 130, 160);
            doc.text(`Document ID: ${meta.documentId}`, ML + 3, y + 21);
        }

        doc.setFontSize(7);
        doc.setTextColor(160, 165, 190);
        doc.text(`Generated: ${new Date().toISOString()}`, PW - MR - 3, y + 21, { align: "right" });

        y += 28;
    }

    // ── Post-process: watermark & page numbers ────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (doc.internal as any).getNumberOfPages() as number;

    if (isDraft) {
        for (let i = 1; i <= totalPages; i++) stampWatermark(i);
    }
    if (showPgNos) stampPageNumbers(totalPages);

    return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}

// ─── Block-type metadata for the UI ──────────────────────────────────────────

const BLOCK_TYPES = [
    { type: "title",       label: "Title",            color: "#6366F1" },
    { type: "description", label: "Description",      color: "#10B981" },
    { type: "step",        label: "Step by Step",     color: "#F59E0B" },
    { type: "code",        label: "Code / Practical", color: "#0EA5E9" },
    { type: "source",      label: "Source / Link",    color: "#8B5CF6" },
    { type: "footer",      label: "Footer",           color: "#6B7280" }
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocGenPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const Card    = isApple ? LiquidGlassCard : OneUICard;

    const [jsonInput,     setJsonInput]     = useState<string>(JSON.stringify(SAMPLE, null, 2));
    const [parseError,    setParseError]    = useState<string>("");
    const [generating,    setGenerating]    = useState(false);
    const [copied,        setCopied]        = useState(false);
    const [lastHash,      setLastHash]      = useState<string>("");
    const [showSchemaRef, setShowSchemaRef] = useState(false);

    const accentColor = "#6366F1";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const cardBg      = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
    const inputBg     = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";
    const codeBg      = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

    // Validate JSON on every keystroke
    const handleJsonChange = (val: string) => {
        setJsonInput(val);
        try {
            JSON.parse(val);
            setParseError("");
        } catch (e: unknown) {
            setParseError(e instanceof Error ? e.message : "Invalid JSON");
        }
    };

    // Generate the PDF
    const handleGenerate = async () => {
        if (parseError) return;
        setGenerating(true);
        try {
            const payload: DocPayload = JSON.parse(jsonInput);
            const hash   = await sha256Hex(jsonInput);
            setLastHash(hash);
            const blob   = await generatePDF(payload, hash);
            const slug   = (payload.metadata?.title ?? "document")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            downloadBlob(blob, `${slug}.pdf`);
        } catch (e: unknown) {
            setParseError(e instanceof Error ? e.message : "Generation failed");
        }
        setGenerating(false);
    };

    // Copy hash to clipboard
    const handleCopyHash = async () => {
        if (!lastHash) return;
        await navigator.clipboard.writeText(lastHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Reset to sample
    const handleReset = () => {
        setJsonInput(JSON.stringify(SAMPLE, null, 2));
        setParseError("");
        setLastHash("");
    };

    const bg = palette.background;

    return (
        <div
            className="min-h-screen p-4 sm:p-6 lg:p-8"
            style={{ background: bg }}>

            {/* ── Page Header ──────────────────────────────────────────── */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${accentColor}20`, color: accentColor }}>
                        <Article fontSize="small" />
                    </div>
                    <h1
                        className="text-xl font-black"
                        style={{ color: palette.text }}>
                        JSON → PDF Document Generator
                    </h1>
                </div>
                <p
                    className="text-sm ml-12"
                    style={{ color: palette.textSecondary }}>
                    Paste a structured JSON payload and generate a styled PDF document with
                    optional institution header, draft watermark, page numbers, metadata and a
                    tamper-evident hash block.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

                {/* ── Left: JSON editor ──────────────────────────────────── */}
                <div className="xl:col-span-3 flex flex-col gap-4">

                    {/* Editor card */}
                    <Card>
                        <div
                            className="rounded-2xl p-4"
                            style={{ background: cardBg, border: `1px solid ${borderColor}` }}>

                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-3">
                                <span
                                    className="text-xs font-black uppercase tracking-widest"
                                    style={{ color: palette.textTertiary }}>
                                    JSON Input
                                </span>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
                                    style={{
                                        color: palette.textSecondary,
                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                                    }}>
                                    <Refresh sx={{ fontSize: 14 }} />
                                    Reset to sample
                                </button>
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={jsonInput}
                                onChange={(e) => handleJsonChange(e.target.value)}
                                spellCheck={false}
                                className="w-full rounded-xl p-3 text-xs font-mono resize-none outline-none transition-colors"
                                rows={28}
                                style={{
                                    background:  codeBg,
                                    color:       palette.text,
                                    border:      parseError
                                        ? "1px solid #EF4444"
                                        : `1px solid ${borderColor}`,
                                    lineHeight:  "1.6"
                                }}
                            />

                            {/* Parse error */}
                            <AnimatePresence>
                                {parseError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1,  y: 0  }}
                                        exit={{   opacity: 0,  y: -4  }}
                                        className="mt-2 text-xs px-2"
                                        style={{ color: "#EF4444" }}>
                                        {parseError}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Generate button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleGenerate}
                                disabled={!!parseError || generating}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                style={{
                                    background: parseError || generating
                                        ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                                        : accentColor,
                                    color: parseError || generating
                                        ? palette.textTertiary
                                        : "#ffffff",
                                    cursor: parseError || generating ? "not-allowed" : "pointer"
                                }}>
                                <Download sx={{ fontSize: 18 }} />
                                {generating ? "Generating PDF…" : "Generate & Download PDF"}
                            </motion.button>
                        </div>
                    </Card>

                    {/* Schema reference (collapsible) */}
                    <Card>
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                            <button
                                onClick={() => setShowSchemaRef((v) => !v)}
                                className="w-full flex items-center justify-between p-4"
                                style={{ color: palette.text }}>
                                <span className="text-xs font-black uppercase tracking-widest"
                                    style={{ color: palette.textTertiary }}>
                                    JSON Schema Reference
                                </span>
                                {showSchemaRef
                                    ? <ExpandLess sx={{ fontSize: 18 }} />
                                    : <ExpandMore sx={{ fontSize: 18 }} />}
                            </button>
                            <AnimatePresence initial={false}>
                                {showSchemaRef && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: "hidden" }}>
                                        <div className="px-4 pb-4">
                                            <SchemaReference isDark={isDark} palette={palette} codeBg={codeBg} borderColor={borderColor} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>
                </div>

                {/* ── Right: Info panels ─────────────────────────────────── */}
                <div className="xl:col-span-2 flex flex-col gap-4">

                    {/* Block types legend */}
                    <Card>
                        <div
                            className="rounded-2xl p-4"
                            style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                            <p
                                className="text-xs font-black uppercase tracking-widest mb-3"
                                style={{ color: palette.textTertiary }}>
                                Supported Block Types
                            </p>
                            <div className="flex flex-col gap-2">
                                {BLOCK_TYPES.map((bt) => (
                                    <div
                                        key={bt.type}
                                        className="flex items-center gap-2 text-sm">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ background: bt.color }}
                                        />
                                        <code
                                            className="text-xs px-1.5 py-0.5 rounded"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                                color: bt.color,
                                                fontFamily: "monospace"
                                            }}>
                                            {bt.type}
                                        </code>
                                        <span
                                            className="text-xs"
                                            style={{ color: palette.textSecondary }}>
                                            {bt.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Optional features list */}
                    <Card>
                        <div
                            className="rounded-2xl p-4"
                            style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                            <p
                                className="text-xs font-black uppercase tracking-widest mb-3"
                                style={{ color: palette.textTertiary }}>
                                Optional Features
                            </p>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { flag: "institution + logoUrl", desc: "Header band with org name & logo" },
                                    { flag: "isDraft: true",         desc: "Diagonal DRAFT watermark on every page" },
                                    { flag: "showPageNumbers: true", desc: "Page X of Y at bottom-right" },
                                    { flag: "title / author / ...",  desc: "Embedded PDF metadata fields" },
                                    { flag: "Hash block",            desc: "Auto-appended tamper-evident SHA-256 hash" }
                                ].map((f) => (
                                    <div key={f.flag} className="flex flex-col gap-0.5">
                                        <code
                                            className="text-xs px-1.5 py-0.5 rounded w-fit"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                color: accentColor,
                                                fontFamily: "monospace"
                                            }}>
                                            {f.flag}
                                        </code>
                                        <span
                                            className="text-xs"
                                            style={{ color: palette.textSecondary }}>
                                            {f.desc}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Hash display */}
                    <AnimatePresence>
                        {lastHash && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{   opacity: 0, y: 8 }}>
                                <Card>
                                    <div
                                        className="rounded-2xl p-4"
                                        style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Security sx={{ fontSize: 16, color: accentColor }} />
                                                <span
                                                    className="text-xs font-black uppercase tracking-widest"
                                                    style={{ color: palette.textTertiary }}>
                                                    Document Hash (SHA-256)
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleCopyHash}
                                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                    color: palette.textSecondary
                                                }}>
                                                {copied
                                                    ? <Check sx={{ fontSize: 14, color: "#10B981" }} />
                                                    : <ContentCopy sx={{ fontSize: 14 }} />}
                                                {copied ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                        <p
                                            className="text-xs font-mono break-all leading-relaxed px-2 py-2 rounded-lg"
                                            style={{
                                                background: codeBg,
                                                color: accentColor,
                                                border: `1px solid ${borderColor}`
                                            }}>
                                            {lastHash}
                                        </p>
                                        <p
                                            className="mt-2 text-xs"
                                            style={{ color: palette.textTertiary }}>
                                            This hash is also embedded in the PDF. Any change to the
                                            JSON input produces a different hash, making tampering
                                            detectable.
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ─── Schema Reference sub-component ──────────────────────────────────────────

function SchemaReference({
    isDark,
    palette,
    codeBg,
    borderColor
}: {
    isDark: boolean;
    palette: ReturnType<typeof useDesignTheme>["palette"];
    codeBg: string;
    borderColor: string;
}) {
    const SCHEMA_SNIPPET = `{
  "metadata": {
    "title":          "string",
    "author":         "string",
    "subject":        "string",
    "keywords":       "string (comma-separated)",
    "institution":    "string",
    "logoUrl":        "string (public image URL)",
    "isDraft":        "boolean",
    "documentId":     "string",
    "showPageNumbers":"boolean"
  },
  "blocks": [
    { "type": "title",       "content": "string" },
    { "type": "description", "content": "string" },
    { "type": "step",        "title?": "string", "content": "string" },
    { "type": "code",        "language?": "string", "title?": "string",
                             "content": "string (newline-separated lines)" },
    { "type": "source",      "url": "string", "title?": "string",
                             "description?": "string" },
    { "type": "footer",      "content": "string" }
  ]
}`;

    return (
        <div>
            <p
                className="text-xs mb-2"
                style={{ color: palette.textSecondary }}>
                All fields are optional. A document can contain any combination of blocks, or none at all.
                The tamper-evident hash block is always appended automatically.
            </p>
            <pre
                className="text-xs rounded-xl p-3 overflow-x-auto"
                style={{
                    background: codeBg,
                    color: isDark ? "#a5b4fc" : "#4338ca",
                    border: `1px solid ${borderColor}`,
                    fontFamily: "monospace",
                    lineHeight: "1.6"
                }}>
                {SCHEMA_SNIPPET}
            </pre>
        </div>
    );
}
