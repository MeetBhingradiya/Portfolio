/**
 * Image Tools — /tools/image
 * Client-side image compression and image-to-PDF conversion.
 * Compression uses Canvas API (no server needed).
 * PDF conversion uses jspdf.
 */

"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import { Image as ImageIcon, CloudUpload, Download, Delete, Compress, PictureAsPdf, Settings } from "@mui/icons-material";

interface ImageFile {
    id: string;
    file: File;
    preview: string;
    originalSize: number;
    compressedBlob?: Blob;
    compressedSize?: number;
}

type Mode = "compress" | "to-pdf";

export default function ImageToolsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [mode, setMode] = useState<Mode>("compress");
    const [images, setImages] = useState<ImageFile[]>([]);
    const [quality, setQuality] = useState(0.7);
    const [maxWidth, setMaxWidth] = useState(1920);
    const [outputFormat, setOutputFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
    const [processing, setProcessing] = useState(false);
    const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("portrait");
    const fileRef = useRef<HTMLInputElement>(null);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.image) return;
        defaultsApplied.current = true;
        const d = toolDefaults.image;
        if (d.mode) setMode(d.mode as Mode);
        if (d.quality != null) setQuality(d.quality);
        if (d.maxWidth != null) setMaxWidth(d.maxWidth);
        if (d.outputFormat) setOutputFormat(d.outputFormat as "jpeg" | "png" | "webp");
        if (d.pdfOrientation) setPdfOrientation(d.pdfOrientation as "portrait" | "landscape");
    }, [toolDefaults]);

    // ── Add images ──────────────────────────────────────────────────
    const onFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        const newImgs: ImageFile[] = [];
        Array.from(files).forEach((f) => {
            if (!f.type.startsWith("image/")) return;
            newImgs.push({
                id: crypto.randomUUID(),
                file: f,
                preview: URL.createObjectURL(f),
                originalSize: f.size
            });
        });
        setImages((p) => [...p, ...newImgs]);
    }, []);

    const removeImage = (id: string) => setImages((p) => p.filter((i) => i.id !== id));

    // ── Compress via Canvas ─────────────────────────────────────────
    const compressAll = async () => {
        setProcessing(true);
        const updated = await Promise.all(
            images.map(async (img) => {
                try {
                    const bitmap = await createImageBitmap(img.file);
                    let w = bitmap.width;
                    let h = bitmap.height;
                    if (w > maxWidth) {
                        h = Math.round((h * maxWidth) / w);
                        w = maxWidth;
                    }
                    const canvas = new OffscreenCanvas(w, h);
                    const ctx = canvas.getContext("2d")!;
                    ctx.drawImage(bitmap, 0, 0, w, h);
                    const mime = `image/${outputFormat}`;
                    const blob = await canvas.convertToBlob({
                        type: mime,
                        quality
                    });
                    return {
                        ...img,
                        compressedBlob: blob,
                        compressedSize: blob.size
                    };
                } catch {
                    return img;
                }
            })
        );
        setImages(updated);
        setProcessing(false);
    };

    // ── Download compressed image ──────────────────────────────────
    const downloadCompressed = (img: ImageFile) => {
        if (!img.compressedBlob) return;
        const url = URL.createObjectURL(img.compressedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compressed_${img.file.name.replace(/\.\w+$/, "")}.${outputFormat}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Images → PDF ──────────────────────────────────────────────
    const generatePDF = async () => {
        if (images.length === 0) return;
        setProcessing(true);
        try {
            const { default: jsPDF } = await import("jspdf");
            const pdf = new jsPDF({ orientation: pdfOrientation, unit: "px" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < images.length; i++) {
                if (i > 0) pdf.addPage();
                const dataUrl = await readFileAsDataURL(images[i].file);
                const bitmap = await createImageBitmap(images[i].file);
                const ratio = Math.min(pageW / bitmap.width, pageH / bitmap.height);
                const w = bitmap.width * ratio;
                const h = bitmap.height * ratio;
                const x = (pageW - w) / 2;
                const y = (pageH - h) / 2;
                pdf.addImage(dataUrl, "JPEG", x, y, w, h);
            }
            pdf.save("images.pdf");
        } catch (e) {
            console.error(e);
        }
        setProcessing(false);
    };

    const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
    const totalCompressed = images.reduce((s, i) => s + (i.compressedSize ?? i.originalSize), 0);
    const savings = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

    return (
        <ToolPageWrapper
            title="Image Tools"
            description="Compress images & convert to PDF — 100% client-side"
            icon={<ImageIcon sx={{ fontSize: 24 }} />}
            accentColor="#FF9500">
            <div className="space-y-6">
                {/* Mode toggle */}
                <div className="flex gap-1.5">
                    {[
                        {
                            key: "compress" as Mode,
                            icon: <Compress sx={{ fontSize: 14 }} />,
                            label: "Compress"
                        },
                        {
                            key: "to-pdf" as Mode,
                            icon: <PictureAsPdf sx={{ fontSize: 14 }} />,
                            label: "Images → PDF"
                        }
                    ].map((m) => (
                        <motion.button
                            key={m.key}
                            onClick={() => setMode(m.key)}
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

                {/* Upload area */}
                <Card>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
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
                            Drop images here or click to browse
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: palette.textTertiary }}>
                            PNG, JPEG, WebP, AVIF
                        </p>
                    </motion.div>
                </Card>

                {/* Settings */}
                {mode === "compress" && images.length > 0 && (
                    <Card>
                        <h3
                            className={`flex items-center gap-2 mb-4 ${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                            style={{ color: palette.textPrimary }}>
                            <Settings sx={{ fontSize: 16 }} /> Compression Settings
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    Quality ({Math.round(quality * 100)}%)
                                </label>
                                <input
                                    type="range"
                                    min={0.1}
                                    max={1}
                                    step={0.05}
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="w-full accent-current"
                                    style={
                                        {
                                            color: palette.accent
                                        } as React.CSSProperties
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    Max Width ({maxWidth}px)
                                </label>
                                <input
                                    type="range"
                                    min={320}
                                    max={3840}
                                    step={160}
                                    value={maxWidth}
                                    onChange={(e) => setMaxWidth(Number(e.target.value))}
                                    className="w-full accent-current"
                                    style={
                                        {
                                            color: palette.accent
                                        } as React.CSSProperties
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    Format
                                </label>
                                <div className="flex gap-1.5">
                                    {(["jpeg", "png", "webp"] as const).map((f) => (
                                        <motion.button
                                            key={f}
                                            onClick={() => setOutputFormat(f)}
                                            className="px-3 py-1.5 rounded-full text-xs font-bold uppercase"
                                            style={{
                                                background:
                                                    outputFormat === f
                                                        ? palette.accent
                                                        : isDark
                                                          ? "rgba(255,255,255,0.07)"
                                                          : "rgba(0,0,0,0.04)",
                                                color: outputFormat === f ? "#fff" : palette.textSecondary
                                            }}
                                            whileTap={{ scale: 0.95 }}>
                                            {f}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {mode === "to-pdf" && images.length > 0 && (
                    <Card>
                        <h3
                            className={`flex items-center gap-2 mb-4 ${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                            style={{ color: palette.textPrimary }}>
                            <Settings sx={{ fontSize: 16 }} /> PDF Settings
                        </h3>
                        <div className="flex gap-2">
                            {(["portrait", "landscape"] as const).map((o) => (
                                <motion.button
                                    key={o}
                                    onClick={() => setPdfOrientation(o)}
                                    className="px-4 py-2 rounded-full text-xs font-bold capitalize"
                                    style={{
                                        background:
                                            pdfOrientation === o ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                        color: pdfOrientation === o ? "#fff" : palette.textSecondary
                                    }}
                                    whileTap={{ scale: 0.95 }}>
                                    {o}
                                </motion.button>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Image list */}
                {images.length > 0 && (
                    <>
                        {mode === "compress" && (
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <OneUIBadge variant="neutral">
                                        {images.length} image
                                        {images.length !== 1 && "s"}
                                    </OneUIBadge>
                                    <OneUIBadge variant="info">{formatBytes(totalOriginal)}</OneUIBadge>
                                    {savings > 0 && (
                                        <OneUIBadge variant="success">
                                            -{savings}% ({formatBytes(totalOriginal - totalCompressed)} saved)
                                        </OneUIBadge>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <motion.button
                                        onClick={compressAll}
                                        disabled={processing}
                                        className="px-5 py-2 rounded-full text-xs font-bold"
                                        style={{
                                            background: palette.accent,
                                            color: "#fff",
                                            opacity: processing ? 0.6 : 1
                                        }}
                                        whileTap={{ scale: 0.95 }}>
                                        {processing ? "Processing…" : "Compress All"}
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {mode === "to-pdf" && (
                            <div className="flex items-center justify-between">
                                <OneUIBadge variant="neutral">
                                    {images.length} image
                                    {images.length !== 1 && "s"}
                                </OneUIBadge>
                                <motion.button
                                    onClick={generatePDF}
                                    disabled={processing}
                                    className="px-5 py-2 rounded-full text-xs font-bold"
                                    style={{
                                        background: palette.accent,
                                        color: "#fff",
                                        opacity: processing ? 0.6 : 1
                                    }}
                                    whileTap={{ scale: 0.95 }}>
                                    {processing ? "Generating…" : "Generate PDF"}
                                </motion.button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            <AnimatePresence mode="popLayout">
                                {images.map((img) => (
                                    <motion.div
                                        key={img.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}>
                                        <Card>
                                            <div className="space-y-2">
                                                <div
                                                    className="relative aspect-square rounded-xl overflow-hidden"
                                                    style={{
                                                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"
                                                    }}>
                                                    <img
                                                        src={img.preview}
                                                        alt={img.file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <p
                                                    className="text-xs font-semibold truncate"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {img.file.name}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-[10px]"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {formatBytes(img.originalSize)}
                                                    </span>
                                                    {img.compressedSize !== undefined && (
                                                        <OneUIBadge variant="success">{formatBytes(img.compressedSize)}</OneUIBadge>
                                                    )}
                                                </div>
                                                <div className="flex gap-1.5">
                                                    {img.compressedBlob && (
                                                        <motion.button
                                                            onClick={() => downloadCompressed(img)}
                                                            className="p-1.5 rounded-lg"
                                                            style={{
                                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                                                            }}
                                                            whileTap={{
                                                                scale: 0.9
                                                            }}>
                                                            <Download
                                                                sx={{
                                                                    fontSize: 14,
                                                                    color: palette.accent
                                                                }}
                                                            />
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        onClick={() => removeImage(img.id)}
                                                        className="p-1.5 rounded-lg"
                                                        style={{
                                                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                                                        }}
                                                        whileTap={{
                                                            scale: 0.9
                                                        }}>
                                                        <Delete
                                                            sx={{
                                                                fontSize: 14,
                                                                color: "#FF3B30"
                                                            }}
                                                        />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </ToolPageWrapper>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
