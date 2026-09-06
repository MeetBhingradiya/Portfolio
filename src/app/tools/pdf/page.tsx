/**
 * PDF Tools — /tools/pdf
 * Client-side PDF merge (via pdf-lib) and split (extract pages).
 * Drag-and-drop reorder for merge.
 */

"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import { PictureAsPdf, CloudUpload, Download, Delete, MergeType, CallSplit, DragIndicator } from "@mui/icons-material";

interface PDFFile {
    id: string;
    name: string;
    data: ArrayBuffer;
    pages: number;
}

type Mode = "merge" | "split";

export default function PDFToolsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [mode, setMode] = useState<Mode>("merge");
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [splitRange, setSplitRange] = useState("1-3");
    const fileRef = useRef<HTMLInputElement>(null);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.pdf) return;
        defaultsApplied.current = true;
        if (toolDefaults.pdf.mode) setMode(toolDefaults.pdf.mode as Mode);
    }, [toolDefaults]);

    // ── Load PDFs ──────────────────────────────────────────────────
    const onFiles = useCallback(async (fileList: FileList | null) => {
        if (!fileList) return;
        const { PDFDocument } = await import("pdf-lib");

        const newFiles: PDFFile[] = [];
        for (const f of Array.from(fileList)) {
            if (f.type !== "application/pdf") continue;
            try {
                const data = await f.arrayBuffer();
                const doc = await PDFDocument.load(data, {
                    ignoreEncryption: true
                });
                newFiles.push({
                    id: crypto.randomUUID(),
                    name: f.name,
                    data,
                    pages: doc.getPageCount()
                });
            } catch {
                /* skip invalid pdf */
            }
        }
        setFiles((p) => [...p, ...newFiles]);
    }, []);

    const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

    // ── Merge ──────────────────────────────────────────────────────
    const mergePDFs = async () => {
        if (files.length < 2) return;
        setProcessing(true);
        try {
            const { PDFDocument } = await import("pdf-lib");
            const merged = await PDFDocument.create();
            for (const f of files) {
                const src = await PDFDocument.load(f.data, {
                    ignoreEncryption: true
                });
                const pages = await merged.copyPages(src, src.getPageIndices());
                pages.forEach((p) => merged.addPage(p));
            }
            const bytes = await merged.save();
            downloadBlob(new Blob([bytes as any], { type: "application/pdf" }), "merged.pdf");
        } catch (e) {
            console.error("Merge failed:", e);
        }
        setProcessing(false);
    };

    // ── Split / extract ───────────────────────────────────────────
    const splitPDF = async () => {
        if (files.length === 0) return;
        setProcessing(true);
        try {
            const { PDFDocument } = await import("pdf-lib");
            const src = await PDFDocument.load(files[0].data, {
                ignoreEncryption: true
            });
            const pageIndices = parseRange(splitRange, src.getPageCount());

            const result = await PDFDocument.create();
            const pages = await result.copyPages(src, pageIndices);
            pages.forEach((p) => result.addPage(p));
            const bytes = await result.save();
            downloadBlob(new Blob([bytes as any], { type: "application/pdf" }), `extracted_${splitRange.replace(/,/g, "_")}.pdf`);
        } catch (e) {
            console.error("Split failed:", e);
        }
        setProcessing(false);
    };

    const totalPages = files.reduce((s, f) => s + f.pages, 0);

    return (
        <ToolPageWrapper
            title="PDF Tools"
            description="Merge, split and extract PDF pages client-side"
            icon={<PictureAsPdf sx={{ fontSize: 24 }} />}
            accentColor="#FF3B30">
            <div className="space-y-6">
                {/* Mode toggle */}
                <div className="flex gap-1.5">
                    {[
                        {
                            key: "merge" as Mode,
                            icon: <MergeType sx={{ fontSize: 14 }} />,
                            label: "Merge"
                        },
                        {
                            key: "split" as Mode,
                            icon: <CallSplit sx={{ fontSize: 14 }} />,
                            label: "Split / Extract"
                        }
                    ].map((m) => (
                        <motion.button
                            key={m.key}
                            onClick={() => {
                                setMode(m.key);
                                setFiles([]);
                            }}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold"
                            style={{
                                background: mode === m.key ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color: mode === m.key ? "#fff" : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.95 }}>
                            {m.icon} {m.label}
                        </motion.button>
                    ))}
                </div>

                {/* Upload */}
                <Card>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf"
                        multiple={mode === "merge"}
                        className="hidden"
                        onChange={(e) => onFiles(e.target.files)}
                    />
                    <motion.div
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            onFiles(e.dataTransfer.files);
                        }}
                        className="flex flex-col items-center justify-center gap-3 py-12 rounded-2xl cursor-pointer"
                        style={{
                            border: `2px dashed ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"}`,
                            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"
                        }}
                        whileHover={{ scale: 1.005 }}>
                        <CloudUpload sx={{ fontSize: 40, color: palette.textTertiary }} />
                        <p
                            className="text-sm font-semibold"
                            style={{ color: palette.textSecondary }}>
                            {mode === "merge" ? "Drop multiple PDFs here" : "Drop a PDF to split"}
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: palette.textTertiary }}>
                            .pdf files only
                        </p>
                    </motion.div>
                </Card>

                {/* ═══ MERGE ═══ */}
                {mode === "merge" && files.length > 0 && (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <OneUIBadge variant="neutral">{files.length} files</OneUIBadge>
                                <OneUIBadge variant="info">{totalPages} pages</OneUIBadge>
                            </div>
                            <motion.button
                                onClick={mergePDFs}
                                disabled={processing || files.length < 2}
                                className="px-5 py-2 rounded-full text-xs font-bold"
                                style={{
                                    background: palette.accent,
                                    color: "#fff",
                                    opacity: processing || files.length < 2 ? 0.5 : 1
                                }}
                                whileTap={{ scale: 0.95 }}>
                                {processing ? "Merging…" : "Merge All"}
                            </motion.button>
                        </div>

                        <Reorder.Group
                            axis="y"
                            values={files}
                            onReorder={setFiles}
                            className="space-y-2">
                            <AnimatePresence>
                                {files.map((f) => (
                                    <Reorder.Item
                                        key={f.id}
                                        value={f}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16 }}>
                                        <Card>
                                            <div className="flex items-center gap-3">
                                                <DragIndicator
                                                    sx={{
                                                        fontSize: 18,
                                                        color: palette.textTertiary,
                                                        cursor: "grab"
                                                    }}
                                                />
                                                <PictureAsPdf
                                                    sx={{
                                                        fontSize: 20,
                                                        color: "#FF3B30"
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="text-sm font-semibold truncate"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {f.name}
                                                    </p>
                                                    <p
                                                        className="text-[10px]"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {f.pages} page
                                                        {f.pages !== 1 && "s"}
                                                    </p>
                                                </div>
                                                <motion.button
                                                    onClick={() => removeFile(f.id)}
                                                    className="p-1.5 rounded-lg"
                                                    style={{
                                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                                                    }}
                                                    whileTap={{ scale: 0.9 }}>
                                                    <Delete
                                                        sx={{
                                                            fontSize: 14,
                                                            color: "#FF3B30"
                                                        }}
                                                    />
                                                </motion.button>
                                            </div>
                                        </Card>
                                    </Reorder.Item>
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>
                    </>
                )}

                {/* ═══ SPLIT ═══ */}
                {mode === "split" && files.length > 0 && (
                    <Card>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <PictureAsPdf sx={{ fontSize: 20, color: "#FF3B30" }} />
                                <div>
                                    <p
                                        className="text-sm font-semibold"
                                        style={{ color: palette.textPrimary }}>
                                        {files[0].name}
                                    </p>
                                    <p
                                        className="text-[10px]"
                                        style={{ color: palette.textTertiary }}>
                                        {files[0].pages} pages
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    Page range (e.g. 1-3, 5, 8-10)
                                </label>
                                <input
                                    value={splitRange}
                                    onChange={(e) => setSplitRange(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm font-mono outline-none"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                        color: palette.textPrimary,
                                        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
                                    }}
                                />
                            </div>

                            <motion.button
                                onClick={splitPDF}
                                disabled={processing}
                                className="px-5 py-2 rounded-full text-xs font-bold"
                                style={{
                                    background: palette.accent,
                                    color: "#fff",
                                    opacity: processing ? 0.5 : 1
                                }}
                                whileTap={{ scale: 0.95 }}>
                                {processing ? "Extracting…" : "Extract Pages"}
                            </motion.button>
                        </div>
                    </Card>
                )}
            </div>
        </ToolPageWrapper>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Parses "1-3, 5, 8-10" → 0-indexed page indices */
function parseRange(range: string, maxPages: number): number[] {
    const indices: number[] = [];
    const parts = range.split(",").map((s) => s.trim());
    for (const part of parts) {
        if (part.includes("-")) {
            const [a, b] = part.split("-").map(Number);
            for (let i = a; i <= b && i <= maxPages; i++) {
                if (i >= 1) indices.push(i - 1);
            }
        } else {
            const n = Number(part);
            if (n >= 1 && n <= maxPages) indices.push(n - 1);
        }
    }
    return [...new Set(indices)].sort((a, b) => a - b);
}
