/**
 * Vault — Upload Page
 * Supports large files by splitting them into 48 MB chunks before upload.
 * Each chunk is sent to POST /api/vault/upload sequentially.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    CloudUpload,
    InsertDriveFile,
    CheckCircle,
    Warning,
    Close,
    Lock
} from "@mui/icons-material";

const ACCENT = "#6366F1";
const CHUNK_SIZE = 48 * 1024 * 1024; // 48 MB per chunk (leave margin)

const ACCEPTED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/markdown",
    "image/*",
    "video/*"
].join(",");

interface UploadState {
    file: File | null;
    filename: string;
    tags: string;
    description: string;
    uploading: boolean;
    progress: number; // 0–100
    error: string;
    success: boolean;
    docId: string;
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}

export default function VaultUploadPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const router = useRouter();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const inputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const [state, setState] = useState<UploadState>({
        file: null,
        filename: "",
        tags: "",
        description: "",
        uploading: false,
        progress: 0,
        error: "",
        success: false,
        docId: ""
    });
    const [dragging, setDragging] = useState(false);

    const card = {
        background: isApple ? (isDark ? "rgba(38, 38, 42, 0.7)" : "rgba(255,255,255,0.7)") : palette.surface,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
    };

    function set(patch: Partial<UploadState>) {
        setState((prev) => ({ ...prev, ...patch }));
    }

    function selectFile(file: File) {
        set({ file, filename: file.name, error: "", success: false });
    }

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) selectFile(f);
    }, []);

    async function handleUpload() {
        if (!state.file) return;
        set({ uploading: true, progress: 0, error: "" });

        const file = state.file;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let docId = "";

        try {
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const fd = new FormData();
                fd.append("file", new File([chunk], file.name, { type: file.type }));
                fd.append("chunkIndex", String(i));
                fd.append("totalChunks", String(totalChunks));
                if (i === 0) {
                    fd.append("filename", state.filename || file.name);
                    fd.append("tags", state.tags);
                    fd.append("description", state.description);
                } else {
                    fd.append("docId", docId);
                }

                const r = await fetch("/api/vault/upload", { method: "POST", body: fd });
                const j = await r.json();

                if (!r.ok) {
                    set({ uploading: false, error: j.error || "Upload failed" });
                    return;
                }

                if (i === 0) docId = j.docId;
                set({ progress: Math.round(((i + 1) / totalChunks) * 100) });
            }

            set({ uploading: false, success: true, docId });
        } catch (err: any) {
            set({ uploading: false, error: err?.message || "Upload failed" });
        }
    }

    return (
        <div
            className="min-h-screen py-8 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div
                        className="p-2.5 rounded-xl"
                        style={{ background: `${ACCENT}18` }}>
                        <CloudUpload style={{ color: ACCENT, fontSize: 24 }} />
                    </div>
                    <div>
                        <h1
                            className="text-2xl font-bold"
                            style={{ color: palette.textPrimary }}>
                            Upload to Vault
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            Files are stored privately on GitHub CDN
                        </p>
                    </div>
                </div>

                {state.success ? (
                    <motion.div
                        className="p-8 rounded-2xl text-center"
                        style={card}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}>
                        <CheckCircle style={{ fontSize: 56, color: "#16a34a", marginBottom: 12 }} />
                        <h2
                            className="text-xl font-bold mb-2"
                            style={{ color: palette.textPrimary }}>
                            Upload Complete!
                        </h2>
                        <p
                            className="text-sm mb-6"
                            style={{ color: palette.textSecondary }}>
                            Your file has been stored securely in the Vault.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <motion.button
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: ACCENT, color: "#fff" }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => router.push("/vault")}>
                                View My Files
                            </motion.button>
                            <motion.button
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: `${ACCENT}18`, color: ACCENT }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => set({
                                    file: null, filename: "", tags: "", description: "",
                                    success: false, progress: 0, error: "", docId: ""
                                })}>
                                Upload Another
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {/* Drop zone */}
                        <motion.div
                            ref={dropRef}
                            className="p-8 rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center gap-3 transition-colors"
                            style={{
                                ...card,
                                borderColor: dragging ? ACCENT : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"),
                                background: dragging ? `${ACCENT}08` : card.background
                            }}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            onClick={() => inputRef.current?.click()}
                            whileHover={{ scale: 1.01 }}>
                            <input
                                ref={inputRef}
                                type="file"
                                accept={ACCEPTED_TYPES}
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
                            />
                            {state.file ? (
                                <>
                                    <InsertDriveFile style={{ fontSize: 48, color: ACCENT }} />
                                    <div className="text-center">
                                        <p
                                            className="font-semibold text-sm"
                                            style={{ color: palette.textPrimary }}>
                                            {state.file.name}
                                        </p>
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: palette.textTertiary }}>
                                            {formatBytes(state.file.size)}
                                            {state.file.size > CHUNK_SIZE && ` · Will be split into ${Math.ceil(state.file.size / CHUNK_SIZE)} chunks`}
                                        </p>
                                    </div>
                                    <motion.button
                                        className="p-1.5 rounded-lg"
                                        style={{ color: palette.textTertiary }}
                                        whileHover={{ scale: 1.1, color: "#EF4444" }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => { e.stopPropagation(); set({ file: null, filename: "" }); }}>
                                        <Close fontSize="small" />
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    <CloudUpload style={{ fontSize: 48, color: palette.textTertiary }} />
                                    <p
                                        className="text-sm font-semibold"
                                        style={{ color: palette.textPrimary }}>
                                        Drop a file or click to browse
                                    </p>
                                    <p
                                        className="text-xs text-center"
                                        style={{ color: palette.textTertiary }}>
                                        PDF, DOCX, PPTX, images, videos and more
                                        <br />
                                        Large files are automatically split into chunks
                                    </p>
                                </>
                            )}
                        </motion.div>

                        {/* Metadata fields */}
                        <AnimatePresence>
                            {state.file && (
                                <motion.div
                                    className="p-5 rounded-2xl flex flex-col gap-4"
                                    style={card}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}>
                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                            style={{ color: palette.textSecondary }}>
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={state.filename}
                                            onChange={(e) => set({ filename: e.target.value })}
                                            placeholder="File display name"
                                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                            style={{ color: palette.textSecondary }}>
                                            Tags (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={state.tags}
                                            onChange={(e) => set({ tags: e.target.value })}
                                            placeholder="e.g. work, invoice, Q1"
                                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                            style={{ color: palette.textSecondary }}>
                                            Description (optional)
                                        </label>
                                        <textarea
                                            value={state.description}
                                            onChange={(e) => set({ description: e.target.value })}
                                            placeholder="Short description of the file"
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Privacy notice */}
                        <div
                            className="flex items-start gap-3 px-4 py-3 rounded-xl text-xs"
                            style={{ background: `${ACCENT}10`, color: palette.textSecondary }}>
                            <Lock style={{ fontSize: 16, color: ACCENT, marginTop: 1, flexShrink: 0 }} />
                            <span>
                                Files are stored in a private GitHub repository and are only accessible to you unless you
                                explicitly share them. Large files are automatically chunked for reliable uploads.
                            </span>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {state.error && (
                                <motion.div
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                                    style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}>
                                    <Warning fontSize="small" />
                                    {state.error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Progress */}
                        <AnimatePresence>
                            {state.uploading && (
                                <motion.div
                                    className="p-4 rounded-2xl"
                                    style={card}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}>
                                    <div className="flex justify-between text-xs mb-2" style={{ color: palette.textSecondary }}>
                                        <span>Uploading… {state.progress}%</span>
                                        <span>
                                            {state.file && Math.ceil(state.file.size / CHUNK_SIZE) > 1
                                                ? `Chunk ${Math.round(state.progress / (100 / Math.ceil(state.file!.size / CHUNK_SIZE)))} of ${Math.ceil(state.file!.size / CHUNK_SIZE)}`
                                                : "Processing"}
                                        </span>
                                    </div>
                                    <div
                                        className="h-2 rounded-full overflow-hidden"
                                        style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: ACCENT }}
                                            animate={{ width: `${state.progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Upload button */}
                        <motion.button
                            className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                            style={{ background: ACCENT, color: "#fff" }}
                            disabled={!state.file || state.uploading}
                            whileHover={{ scale: state.file && !state.uploading ? 1.02 : 1 }}
                            whileTap={{ scale: state.file && !state.uploading ? 0.98 : 1 }}
                            onClick={handleUpload}>
                            {state.uploading ? `Uploading… ${state.progress}%` : "Upload to Vault"}
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
}
