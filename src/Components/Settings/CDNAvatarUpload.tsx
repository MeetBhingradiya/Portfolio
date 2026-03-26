/**
 * CDN Avatar Upload with Crop & Rotate
 * Lets users upload a custom avatar with an in-browser crop/rotate tool.
 * The cropped result is uploaded to the private GitHub CDN and saved as the user's avatar.
 */
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useCDNUpload } from "@Hooks/useCDNUpload";
import {
    CloudUpload,
    RotateLeft,
    RotateRight,
    ZoomIn,
    ZoomOut,
    Check,
    Close,
    CropFree,
} from "@mui/icons-material";

interface Props {
    sessionUserId: string;
    onSuccess: (cdnUrl: string) => void;
    onCancel: () => void;
}

const CROP_SIZE = 320; // preview canvas size (square)
const OUTPUT_SIZE = 640; // final export canvas size

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function coverZoom(width: number, height: number, rotationDeg: number) {
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));

    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = width * sin + height * cos;

    return CROP_SIZE / Math.min(rotatedWidth, rotatedHeight);
}

export function CDNAvatarUpload({ sessionUserId, onSuccess, onCancel }: Props) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const { upload, uploading, progress, error: uploadError } = useCDNUpload();

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [rotation, setRotation] = useState(0);        // degrees
    const [zoom, setZoom] = useState(1);                // 1 – 4
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const minZoom = React.useMemo(() => {
        const img = imgRef.current;
        if (!img) return 0.5;
        return clamp(coverZoom(img.naturalWidth, img.naturalHeight, rotation), 0.5, 6);
    }, [rotation, imageSrc]);

    const maxZoom = 6;

    const clampPan = useCallback((nextPanX: number, nextPanY: number, candidateZoom = zoom) => {
        const img = imgRef.current;
        if (!img) return { panX: 0, panY: 0 };

        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));

        const rotatedWidth = img.naturalWidth * cos + img.naturalHeight * sin;
        const rotatedHeight = img.naturalWidth * sin + img.naturalHeight * cos;

        const halfW = (rotatedWidth * candidateZoom) / 2;
        const halfH = (rotatedHeight * candidateZoom) / 2;
        const boundX = Math.max(0, halfW - CROP_SIZE / 2);
        const boundY = Math.max(0, halfH - CROP_SIZE / 2);

        return {
            panX: clamp(nextPanX, -boundX, boundX),
            panY: clamp(nextPanY, -boundY, boundY),
        };
    }, [rotation, zoom]);

    // ── Draw preview ───────────────────────────────────────────────────────
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.save();
        ctx.translate(CROP_SIZE / 2 + panX, CROP_SIZE / 2 + panY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();
    }, [rotation, zoom, panX, panY]);

    useEffect(() => { draw(); }, [draw]);

    useEffect(() => {
        if (!imgRef.current) return;
        if (zoom < minZoom) {
            const clamped = clampPan(panX, panY, minZoom);
            setZoom(minZoom);
            setPanX(clamped.panX);
            setPanY(clamped.panY);
            return;
        }
        const clamped = clampPan(panX, panY, zoom);
        if (clamped.panX !== panX) setPanX(clamped.panX);
        if (clamped.panY !== panY) setPanY(clamped.panY);
    }, [minZoom, zoom, panX, panY, clampPan]);

    // ── Load file ──────────────────────────────────────────────────────────
    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setRotation(0); setZoom(1); setPanX(0); setPanY(0);

        const newImg = new Image();
        newImg.onload = () => {
            imgRef.current = newImg;
            // Auto-fit: scale so the shorter dimension fills CROP_SIZE
            const scale = clamp(coverZoom(newImg.naturalWidth, newImg.naturalHeight, 0), 0.5, 6);
            setZoom(scale);
            draw();
        };
        newImg.src = url;
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    // ── Drag to pan ────────────────────────────────────────────────────────
    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!imageSrc) return;
        setDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY, panX, panY });
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!dragging) return;
        const nextX = dragStart.panX + (e.clientX - dragStart.x);
        const nextY = dragStart.panY + (e.clientY - dragStart.y);
        const clamped = clampPan(nextX, nextY);
        setPanX(clamped.panX);
        setPanY(clamped.panY);
    };
    const onPointerUp = () => setDragging(false);

    // ── Export & upload ────────────────────────────────────────────────────
    const handleUpload = async () => {
        const img = imgRef.current;
        if (!img) return;
        setSaveError("");
        setSaving(true);

        try {
            // Render to output canvas
            const out = document.createElement("canvas");
            out.width = OUTPUT_SIZE;
            out.height = OUTPUT_SIZE;
            const ctx = out.getContext("2d")!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Circular clip
            ctx.beginPath();
            ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
            ctx.clip();

            // Scale pan from preview to output
            const scale = OUTPUT_SIZE / CROP_SIZE;
            ctx.save();
            ctx.translate(OUTPUT_SIZE / 2 + panX * scale, OUTPUT_SIZE / 2 + panY * scale);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(zoom * scale, zoom * scale);
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
            ctx.restore();

            // Get blob
            const blob = await new Promise<Blob>((res, rej) =>
                out.toBlob(b => b ? res(b) : rej(new Error("Canvas export failed")), "image/jpeg", 0.92)
            );
            const file = new File([blob], `avatar-${sessionUserId}.jpg`, { type: "image/jpeg" });

            // Upload to CDN
            const result = await upload(file, {
                type: "avatar",
                context: `user:${sessionUserId}`,
                tags: ["avatar", "profile", "custom"],
                altText: "Custom profile avatar",
            });

            // Save as user avatar
            const saveRes = await fetch("/api/auth/update-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarSource: "custom", customImageUrl: result.cdnUrl }),
            });
            if (!saveRes.ok) {
                const err = await saveRes.json();
                throw new Error(err.error || "Failed to save avatar");
            }

            onSuccess(result.cdnUrl);
        } catch (e: any) {
            setSaveError(e.message || "Upload failed");
        } finally {
            setSaving(false);
        }
    };

    const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
    const btnBase: React.CSSProperties = {
        background: "none", border: `1px solid ${border}`,
        borderRadius: 10, padding: "6px 10px", cursor: "pointer",
        color: palette.textSecondary, display: "flex", alignItems: "center", gap: 4,
        fontSize: 12, fontWeight: 700,
    };

    return (
        <div className="space-y-4">
            {/* File Pick Zone */}
            {!imageSrc ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${border}`,
                        borderRadius: 16,
                        padding: 36,
                        textAlign: "center",
                        cursor: "pointer",
                        background: bg,
                    }}
                >
                    <CloudUpload style={{ fontSize: 40, color: palette.textTertiary, marginBottom: 8 }} />
                    <p className="text-sm font-bold" style={{ color: palette.textSecondary }}>
                        Click or drag an image to start
                    </p>
                    <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>
                        JPG, PNG, WebP — up to 20 MB
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onFileChange}
                    />
                </div>
            ) : (
                <>
                    {/* Crop preview */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <p className="text-xs font-bold" style={{ color: palette.textTertiary }}>
                            DRAG TO REPOSITION · SCROLL TO ZOOM
                        </p>

                        <div style={{ position: "relative", borderRadius: "50%", overflow: "hidden", boxShadow: `0 0 0 3px ${palette.accent}`, cursor: dragging ? "grabbing" : "grab", flexShrink: 0 }}>
                            <canvas
                                ref={canvasRef}
                                width={CROP_SIZE}
                                height={CROP_SIZE}
                                style={{ display: "block", borderRadius: "50%" }}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerLeave={onPointerUp}
                                onWheel={(e) => {
                                    e.preventDefault();
                                    const candidate = clamp(zoom - e.deltaY * 0.003, minZoom, maxZoom);
                                    const clamped = clampPan(panX, panY, candidate);
                                    setZoom(candidate);
                                    setPanX(clamped.panX);
                                    setPanY(clamped.panY);
                                }}
                            />
                        </div>

                        {/* Controls */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                            {/* Rotate */}
                            <button style={btnBase} onClick={() => setRotation(r => r - 90)}>
                                <RotateLeft style={{ fontSize: 16 }} /> -90°
                            </button>
                            <button style={btnBase} onClick={() => setRotation(r => r + 90)}>
                                <RotateRight style={{ fontSize: 16 }} /> +90°
                            </button>
                            {/* Zoom */}
                            <button
                                style={btnBase}
                                onClick={() => {
                                    const candidate = clamp(zoom - 0.2, minZoom, maxZoom);
                                    const clamped = clampPan(panX, panY, candidate);
                                    setZoom(candidate);
                                    setPanX(clamped.panX);
                                    setPanY(clamped.panY);
                                }}
                            >
                                <ZoomOut style={{ fontSize: 16 }} />
                            </button>
                            <button
                                style={btnBase}
                                onClick={() => {
                                    const candidate = clamp(zoom + 0.2, minZoom, maxZoom);
                                    const clamped = clampPan(panX, panY, candidate);
                                    setZoom(candidate);
                                    setPanX(clamped.panX);
                                    setPanY(clamped.panY);
                                }}
                            >
                                <ZoomIn style={{ fontSize: 16 }} />
                            </button>
                            {/* Reset */}
                            <button
                                style={btnBase}
                                onClick={() => {
                                    setRotation(0);
                                    setPanX(0);
                                    setPanY(0);
                                    const img = imgRef.current;
                                    if (img) {
                                        setZoom(clamp(coverZoom(img.naturalWidth, img.naturalHeight, 0), 0.5, 6));
                                    }
                                }}
                            >
                                <CropFree style={{ fontSize: 16 }} /> Reset
                            </button>
                            {/* Change image */}
                            <button style={btnBase} onClick={() => { setImageSrc(null); imgRef.current = null; }}>
                                <Close style={{ fontSize: 14 }} /> Change
                            </button>
                        </div>

                        {/* Rotate slider */}
                        <div style={{ width: "100%", maxWidth: 300 }}>
                            <p className="text-xs mb-1 text-center" style={{ color: palette.textTertiary }}>
                                Rotate: {rotation}°
                            </p>
                            <input
                                type="range"
                                min={-180}
                                max={180}
                                value={rotation}
                                onChange={e => {
                                    const nextRotation = Number(e.target.value);
                                    setRotation(nextRotation);
                                }}
                                style={{ width: "100%", accentColor: palette.accent }}
                            />
                        </div>

                        <div style={{ width: "100%", maxWidth: 300 }}>
                            <p className="text-xs mb-1 text-center" style={{ color: palette.textTertiary }}>
                                Zoom: {zoom.toFixed(2)}x
                            </p>
                            <input
                                type="range"
                                min={minZoom}
                                max={maxZoom}
                                step={0.01}
                                value={zoom}
                                onChange={(e) => {
                                    const candidate = clamp(Number(e.target.value), minZoom, maxZoom);
                                    const clamped = clampPan(panX, panY, candidate);
                                    setZoom(candidate);
                                    setPanX(clamped.panX);
                                    setPanY(clamped.panY);
                                }}
                                style={{ width: "100%", accentColor: palette.accent }}
                            />
                        </div>
                    </div>

                    {/* Errors */}
                    <AnimatePresence>
                        {(saveError || uploadError) && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13 }}>
                                {saveError || uploadError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Upload progress */}
                    {(uploading || saving) && (
                        <div style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: 10, overflow: "hidden", height: 6 }}>
                            <div style={{ height: "100%", width: `${progress}%`, background: palette.accent, transition: "width 0.3s ease", borderRadius: 10 }} />
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <motion.button
                            onClick={onCancel}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            style={{
                                flex: 1, padding: "11px 0", borderRadius: isApple ? 12 : 16,
                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                border: "none", cursor: "pointer", color: palette.textSecondary,
                                fontWeight: 700, fontSize: 14,
                            }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            onClick={handleUpload}
                            disabled={saving || uploading}
                            whileHover={{ scale: saving || uploading ? 1 : 1.02 }}
                            whileTap={{ scale: saving || uploading ? 1 : 0.98 }}
                            style={{
                                flex: 2, padding: "11px 0", borderRadius: isApple ? 12 : 16,
                                background: saving || uploading ? palette.textTertiary : palette.accent,
                                border: "none", cursor: saving || uploading ? "not-allowed" : "pointer",
                                color: "#fff", fontWeight: 800, fontSize: 14,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            }}
                        >
                            <Check fontSize="small" />
                            {saving || uploading ? `Uploading… ${progress}%` : "Crop & Upload Avatar"}
                        </motion.button>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
                </>
            )}
        </div>
    );
}
