"use client";

import React, { useRef, useState } from "react";
import { CloudUpload, Close, Image as ImageIcon, Delete } from "@mui/icons-material";

// ─── CDN Uploader Hook ────────────────────────────────────────────────────────
export function useCDNUploader(cdnType: string, cdnContext?: string) {
    const [upload, setUpload] = useState({
        uploading: false,
        progress: 0,
        error: ""
    });
    const patch = (p: Partial<typeof upload>) => setUpload((s) => ({ ...s, ...p }));

    const uploadFile = async (file: File, onSuccess: (url: string) => void) => {
        patch({ uploading: true, error: "", progress: 0 });
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("type", cdnType);
            if (cdnContext) fd.append("context", cdnContext);

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/api/cdn/upload");
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable)
                        patch({
                            progress: Math.round((e.loaded / e.total) * 100)
                        });
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            onSuccess(JSON.parse(xhr.responseText).cdnUrl);
                            resolve();
                        } catch {
                            reject(new Error("Invalid response"));
                        }
                    } else {
                        try {
                            reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed"));
                        } catch {
                            reject(new Error(`Upload failed (${xhr.status})`));
                        }
                    }
                };
                xhr.onerror = () => reject(new Error("Network error"));
                xhr.send(fd);
            });
        } catch (e: any) {
            patch({ error: e.message || "Upload failed" });
        } finally {
            patch({ uploading: false });
        }
    };

    return {
        uploading: upload.uploading,
        progress: upload.progress,
        uploadError: upload.error,
        uploadFile
    };
}

export function isCdnUrl(url: string) {
    return url.includes("/api/cdn/");
}

export function CDNImageField({
    value,
    onChange,
    cdnType = "icon",
    cdnContext,
    fieldKey,
    palette,
    isDark,
    borderColor,
    isApple
}: {
    value: string;
    onChange: (url: string) => void;
    cdnType?: string;
    cdnContext?: string;
    fieldKey?: string;
    palette: any;
    isDark: boolean;
    borderColor: string;
    isApple: boolean;
}) {
    const { uploading, progress, uploadError, uploadFile } = useCDNUploader(cdnType, cdnContext);
    const [isLocked, setIsLocked] = useState(() => Boolean(value && isCdnUrl(value)));
    const fileRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const prevValueRef = useRef(value);
    if (prevValueRef.current !== value) {
        prevValueRef.current = value;
        if (!value) setIsLocked(false);
        else if (isCdnUrl(value)) setIsLocked(true);
    }

    const handleFile = async (file: File) => {
        await uploadFile(file, (url) => {
            onChange(url);
            setIsLocked(true);
        });
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items);
        const imgItem = items.find((i) => i.type.startsWith("image/"));
        if (imgItem) {
            e.preventDefault();
            const file = imgItem.getAsFile();
            if (file) handleFile(file);
        }
    };

    const handleClear = () => {
        onChange("");
        setIsLocked(false);
    };

    const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
    const r = isApple ? "12px" : "16px";

    return (
        <div
            ref={containerRef}
            onPaste={handlePaste}
            tabIndex={0}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                outline: "none"
            }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: bg,
                        border: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden"
                    }}>
                    {value ? (
                        <img
                            src={value}
                            alt="preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                    ) : (
                        <ImageIcon style={{ color: palette.textTertiary, fontSize: 24 }} />
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{
                        background: bg,
                        border: `1px dashed ${borderColor}`,
                        borderRadius: r,
                        padding: "8px 14px",
                        color: uploading ? palette.textTertiary : palette.accent,
                        cursor: uploading ? "not-allowed" : "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                    }}>
                    <CloudUpload style={{ fontSize: 16 }} />
                    {uploading ? `Uploading… ${progress}%` : value ? "Change Image" : "Upload Image"}
                </button>

                {value && !uploading && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{ background: "none", border: "none", cursor: "pointer", color: palette.textTertiary, padding: 4 }}
                        title="Clear">
                        <Close style={{ fontSize: 16 }} />
                    </button>
                )}
            </div>

            {uploading && (
                <div style={{ height: 4, borderRadius: 4, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: palette.accent, transition: "width 0.3s ease", borderRadius: 4 }} />
                </div>
            )}

            {uploadError && <p style={{ fontSize: 12, color: "#ef4444" }}>{uploadError}</p>}

            {isLocked ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: bg, border: `1px solid ${borderColor}`, borderRadius: r, padding: "8px 12px" }}>
                    <span style={{ flex: 1, fontSize: 11, fontFamily: "monospace", color: palette.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {value}
                    </span>
                    <span style={{ fontSize: 10, color: palette.textTertiary, fontWeight: 600, flexShrink: 0 }}>CDN</span>
                </div>
            ) : (
                <>
                    <input
                        type="url"
                        value={value}
                        onChange={(e) => { onChange(e.target.value); setIsLocked(false); }}
                        placeholder="Paste image URL or use Ctrl+V to paste screenshot…"
                        style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: r, color: palette.textPrimary, padding: "8px 12px", outline: "none", width: "100%", fontSize: 12, fontFamily: "monospace" }}
                    />
                    <p style={{ fontSize: 11, color: palette.textTertiary, margin: 0 }}>Tip: Ctrl+V to paste a screenshot directly</p>
                </>
            )}

            <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,.pdf,.svg"
                style={{ display: "none" }}
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

export function CDNImageListField({
    value,
    onChange,
    cdnType = "banner",
    cdnContext,
    palette,
    isDark,
    borderColor,
    isApple
}: {
    value: string[];
    onChange: (urls: string[]) => void;
    cdnType?: string;
    cdnContext?: string;
    palette: any;
    isDark: boolean;
    borderColor: string;
    isApple: boolean;
}) {
    const { uploading, progress, uploadError, uploadFile } = useCDNUploader(cdnType, cdnContext);
    const fileRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const urls: string[] = Array.isArray(value) ? value : [];

    const handleFile = async (file: File) => {
        await uploadFile(file, (url) => onChange([...urls, url]));
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items);
        const imgItem = items.find((i) => i.type.startsWith("image/"));
        if (imgItem) {
            e.preventDefault();
            const file = imgItem.getAsFile();
            if (file) handleFile(file);
        }
    };

    const removeAt = (i: number) => onChange(urls.filter((_, j) => j !== i));

    const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
    const r = isApple ? "12px" : "16px";

    return (
        <div
            ref={containerRef}
            onPaste={handlePaste}
            tabIndex={0}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                outline: "none"
            }}>
            {urls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {urls.map((url, i) => (
                        <div
                            key={i}
                            style={{
                                position: "relative",
                                width: 72,
                                height: 72,
                                borderRadius: 10,
                                overflow: "hidden",
                                background: bg,
                                border: `1px solid ${borderColor}`
                            }}>
                            <img
                                src={url}
                                alt={`screenshot-${i}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                            />
                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                                title="Remove">
                                <Close style={{ fontSize: 12, color: "#fff" }} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                    background: bg,
                    border: `1px dashed ${borderColor}`,
                    borderRadius: r,
                    padding: "8px 14px",
                    color: uploading ? palette.textTertiary : palette.accent,
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "fit-content"
                }}>
                <CloudUpload style={{ fontSize: 16 }} />
                {uploading ? `Uploading… ${progress}%` : `Add Screenshot (${urls.length})`}
            </button>

            {uploading && (
                <div style={{ height: 4, borderRadius: 4, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: palette.accent, transition: "width 0.3s ease", borderRadius: 4 }} />
                </div>
            )}

            {uploadError && <p style={{ fontSize: 12, color: "#ef4444" }}>{uploadError}</p>}

            <p style={{ fontSize: 11, color: palette.textTertiary, margin: 0 }}>
                Ctrl+V to paste screenshot · Click button to browse files
            </p>

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

export function CDNFileListField({
    value,
    onChange,
    cdnType = "document",
    cdnContext,
    palette,
    isDark,
    borderColor,
    isApple
}: {
    value: string[];
    onChange: (urls: string[]) => void;
    cdnType?: string;
    cdnContext?: string;
    palette: any;
    isDark: boolean;
    borderColor: string;
    isApple: boolean;
}) {
    const { uploading, progress, uploadError, uploadFile } = useCDNUploader(cdnType, cdnContext);
    const fileRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const urls: string[] = Array.isArray(value) ? value : [];

    const handleFile = async (file: File) => {
        await uploadFile(file, (url) => onChange([...urls, url]));
    };

    const removeAt = (i: number) => onChange(urls.filter((_, j) => j !== i));

    const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
    const r = isApple ? "12px" : "16px";

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            style={{ display: "flex", flexDirection: "column", gap: 8, outline: "none" }}>
            {urls.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {urls.map((url, i) => {
                        const filename = url.split("/").pop() || url;
                        return (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "8px 12px",
                                    borderRadius: 10,
                                    background: bg,
                                    border: `1px solid ${borderColor}`
                                }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <CloudUpload style={{ fontSize: 16, color: palette.textTertiary }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {filename}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 11, color: palette.textTertiary, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {url}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAt(i)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4, display: "flex", alignItems: "center" }}>
                                    <Delete fontSize="small" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{
                        background: bg,
                        border: `1px dashed ${borderColor}`,
                        borderRadius: r,
                        padding: "8px 14px",
                        color: uploading ? palette.textTertiary : palette.accent,
                        cursor: uploading ? "not-allowed" : "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                    }}>
                    <CloudUpload style={{ fontSize: 16 }} />
                    {uploading ? `Uploading… ${progress}%` : "Add File"}
                </button>
            </div>

            {uploading && (
                <div style={{ height: 4, borderRadius: 4, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: palette.accent, transition: "width 0.3s ease", borderRadius: 4 }} />
                </div>
            )}

            {uploadError && <p style={{ fontSize: 12, color: "#ef4444" }}>{uploadError}</p>}

            <input
                ref={fileRef}
                type="file"
                accept="*"
                style={{ display: "none" }}
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
        </div>
    );
}
