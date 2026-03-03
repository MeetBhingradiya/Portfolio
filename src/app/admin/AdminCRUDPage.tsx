/**
 * Generic Admin CRUD Page — v2
 * Full redesign:
 *  • 2 combined state objects instead of 13 separate useState hooks
 *  • Polished table with skeletons, empty state, hover rows
 *  • Spring-animated modal with cleaner form layout
 *  • All existing functionality preserved
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import dayjs, { Dayjs } from "dayjs";
import {
    Add,
    Search,
    Edit,
    Delete,
    Close,
    Save,
    ChevronLeft,
    ChevronRight,
    Refresh,
    CloudUpload,
    Image as ImageIcon,
    ContentCopy,
    CalendarToday,
    KeyboardArrowLeft,
    KeyboardArrowRight,
} from "@mui/icons-material";

export interface FieldDef {
    key: string;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "select" | "multiline" | "url" | "boolean" | "tags" | "cdn-image" | "cdn-image-list";
    options?: string[];          // for select
    required?: boolean;
    placeholder?: string;
    colSpan?: 1 | 2;            // grid column span in form
    tableVisible?: boolean;     // show in table? default true
    cdnType?: string;           // cdn-image / cdn-image-list: asset type e.g. "icon" | "banner"
    cdnContext?: string;        // cdn-image / cdn-image-list: context prefix e.g. "company" | "project"
}

interface AdminCRUDPageProps {
    title: string;
    subtitle?: string;
    apiBase: string;             // e.g. "/api/admin/projects"
    idField: string;             // e.g. "ProjectID"
    fields: FieldDef[];
    defaultValues?: Record<string, any>;
}

const PAGE_SIZE = 15;

// ─── CDN Uploader Hook — combined state ───────────────────────────────────────
function useCDNUploader(cdnType: string, cdnContext?: string) {
    const [upload, setUpload] = useState({ uploading: false, progress: 0, error: "" });
    const patch = (p: Partial<typeof upload>) => setUpload(s => ({ ...s, ...p }));

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
                    if (e.lengthComputable) patch({ progress: Math.round((e.loaded / e.total) * 100) });
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try { onSuccess(JSON.parse(xhr.responseText).cdnUrl); resolve(); }
                        catch { reject(new Error("Invalid response")); }
                    } else {
                        try { reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed")); }
                        catch { reject(new Error(`Upload failed (${xhr.status})`)); }
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

    return { uploading: upload.uploading, progress: upload.progress, uploadError: upload.error, uploadFile };
}

// Detect if a URL came from CDN upload (has /api/cdn/ path segment)
function isCdnUrl(url: string) {
    return url.includes("/api/cdn/");
}

// ---------------------------------------------------------------------------
// CDN Image Field — single image upload with Ctrl+V paste + locked URL
// ---------------------------------------------------------------------------
function CDNImageField({
    value,
    onChange,
    cdnType = "icon",
    cdnContext,
    fieldKey,
    palette,
    isDark,
    borderColor,
    isApple,
}: {
    value: string;
    onChange: (url: string) => void;
    cdnType?: string;
    cdnContext?: string;
    fieldKey: string;
    palette: any;
    isDark: boolean;
    borderColor: string;
    isApple: boolean;
}) {
    const { uploading, progress, uploadError, uploadFile } = useCDNUploader(cdnType, cdnContext);
    // Track if value was set via file upload or paste (lock URL input in that case)
    const [isLocked, setIsLocked] = useState(() => Boolean(value && isCdnUrl(value)));
    const fileRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keep lock in sync when form value changes externally (e.g. opening edit modal)
    const prevValueRef = useRef(value);
    if (prevValueRef.current !== value) {
        prevValueRef.current = value;
        // If cleared, unlock; if re-populated with cdn url, lock
        if (!value) setIsLocked(false);
        else if (isCdnUrl(value)) setIsLocked(true);
    }

    const handleFile = async (file: File) => {
        await uploadFile(file, (url) => { onChange(url); setIsLocked(true); });
    };

    // Ctrl+V / right-click paste from clipboard
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items);
        const imgItem = items.find(i => i.type.startsWith("image/"));
        if (imgItem) {
            e.preventDefault();
            const file = imgItem.getAsFile();
            if (file) handleFile(file);
        }
    };

    const handleClear = () => { onChange(""); setIsLocked(false); };

    const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
    const r = isApple ? "12px" : "16px";

    return (
        <div
            ref={containerRef}
            onPaste={handlePaste}
            tabIndex={0}
            style={{ display: "flex", flexDirection: "column", gap: 8, outline: "none" }}
        >
            {/* Preview + Upload button row */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {/* Thumbnail */}
                <div style={{
                    width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                    background: bg, border: `1px solid ${borderColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
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

                {/* Upload btn */}
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{
                        background: bg, border: `1px dashed ${borderColor}`,
                        borderRadius: r, padding: "8px 14px",
                        color: uploading ? palette.textTertiary : palette.accent,
                        cursor: uploading ? "not-allowed" : "pointer",
                        fontSize: 13, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 6,
                    }}
                >
                    <CloudUpload style={{ fontSize: 16 }} />
                    {uploading ? `Uploading… ${progress}%` : value ? "Change Image" : "Upload Image"}
                </button>

                {/* Clear */}
                {value && !uploading && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{ background: "none", border: "none", cursor: "pointer", color: palette.textTertiary, padding: 4 }}
                        title="Clear"
                    >
                        <Close style={{ fontSize: 16 }} />
                    </button>
                )}
            </div>

            {/* Upload progress bar */}
            {uploading && (
                <div style={{ height: 4, borderRadius: 4, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: palette.accent, transition: "width 0.3s ease", borderRadius: 4 }} />
                </div>
            )}

            {/* Error */}
            {uploadError && <p style={{ fontSize: 12, color: "#ef4444" }}>{uploadError}</p>}

            {/* URL display: read-only when CDN-uploaded, editable for manual paste */}
            {isLocked ? (
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: bg, border: `1px solid ${borderColor}`,
                    borderRadius: r, padding: "8px 12px",
                }}>
                    <span style={{ flex: 1, fontSize: 11, fontFamily: "monospace", color: palette.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {value}
                    </span>
                    <span style={{ fontSize: 10, color: palette.textTertiary, fontWeight: 600, flexShrink: 0 }}>
                        CDN
                    </span>
                </div>
            ) : (
                <>
                    <input
                        type="url"
                        value={value}
                        onChange={(e) => { onChange(e.target.value); setIsLocked(false); }}
                        placeholder="Paste image URL or use Ctrl+V to paste screenshot…"
                        style={{
                            background: bg, border: `1px solid ${borderColor}`,
                            borderRadius: r, color: palette.textPrimary,
                            padding: "8px 12px", outline: "none", width: "100%", fontSize: 12,
                            fontFamily: "monospace",
                        }}
                    />
                    <p style={{ fontSize: 11, color: palette.textTertiary, margin: 0 }}>
                        Tip: Ctrl+V to paste a screenshot directly
                    </p>
                </>
            )}

            <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,.pdf,.svg"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// CDN Image List Field — multi-image upload (e.g. project screenshots)
// ---------------------------------------------------------------------------
function CDNImageListField({
    value,
    onChange,
    cdnType = "banner",
    cdnContext,
    palette,
    isDark,
    borderColor,
    isApple,
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
        const imgItem = items.find(i => i.type.startsWith("image/"));
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
            style={{ display: "flex", flexDirection: "column", gap: 8, outline: "none" }}
        >
            {/* Image grid */}
            {urls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {urls.map((url, i) => (
                        <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", background: bg, border: `1px solid ${borderColor}` }}>
                            <img src={url} alt={`screenshot-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                style={{
                                    position: "absolute", top: 2, right: 2,
                                    background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
                                    width: 18, height: 18, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                }}
                                title="Remove"
                            >
                                <Close style={{ fontSize: 12, color: "#fff" }} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add button */}
            <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                    background: bg, border: `1px dashed ${borderColor}`,
                    borderRadius: r, padding: "8px 14px",
                    color: uploading ? palette.textTertiary : palette.accent,
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6, width: "fit-content",
                }}
            >
                <CloudUpload style={{ fontSize: 16 }} />
                {uploading ? `Uploading… ${progress}%` : `Add Screenshot (${urls.length})`}
            </button>

            {/* Progress */}
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
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
        </div>
    );
}

// ============================================================
// Custom Calendar Date Picker
// ============================================================
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

interface AdminDatePickerProps {
    value: string;
    onChange: (iso: string) => void;
    placeholder?: string;
    palette: any;
    isDark: boolean;
    isApple: boolean;
    borderColor: string;
    inputStyle: React.CSSProperties;
}

function AdminDatePicker({ value, onChange, placeholder = "Pick a date", palette, isDark, isApple, borderColor, inputStyle }: AdminDatePickerProps) {
    const [dp, setDp] = useState({ open: false, view: "day" as "day" | "month" | "year" });
    const parsed = value ? dayjs(value) : null;
    const [cursor, setCursor] = useState<Dayjs>(parsed ?? dayjs());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!dp.open) return;
        const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setDp(s => ({ ...s, open: false })); };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDp(s => ({ ...s, open: false })); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
    }, [dp.open]);

    const popupBg = isDark ? "rgba(24, 24, 28, 0.98)" : "rgba(255,255,255,0.99)";
    const r = isApple ? "16px" : "20px";
    const accentColor = palette.accent;

    const startOfMonth = cursor.startOf("month");
    const daysInMonth = cursor.daysInMonth();
    const startWeekday = startOfMonth.day();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    const cells: (Dayjs | null)[] = Array.from({ length: totalCells }, (_, i) => {
        const dayNum = i - startWeekday + 1;
        if (dayNum < 1 || dayNum > daysInMonth) return null;
        return cursor.date(dayNum);
    });

    const selectDay = (d: Dayjs) => { onChange(d.toISOString()); setDp(s => ({ ...s, open: false })); };
    const toggleOpen = () => { setDp(s => ({ open: !s.open, view: "day" })); setCursor(parsed ?? dayjs()); };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {/* Trigger input */}
            <div role="button" tabIndex={0} onClick={toggleOpen} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleOpen(); }}
                style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", boxShadow: dp.open ? `0 0 0 3px ${accentColor}30` : undefined, border: dp.open ? `1px solid ${accentColor}` : inputStyle.border, transition: "border 0.15s, box-shadow 0.15s" }}>
                <CalendarToday style={{ fontSize: 15, color: palette.textTertiary, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: parsed ? palette.textPrimary : palette.textTertiary }}>
                    {parsed ? parsed.format("MMM D, YYYY") : placeholder}
                </span>
                {parsed && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: palette.textTertiary, fontSize: 16, lineHeight: 1, padding: 0, display: "flex" }}>×</button>
                )}
            </div>

            {/* Calendar popup */}
            <AnimatePresence>
                {dp.open && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.15 }}
                        style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, background: popupBg, borderRadius: r, border: `1px solid ${borderColor}`, boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.65)" : "0 12px 40px rgba(0,0,0,0.15)", padding: 16, minWidth: 284, backdropFilter: isApple ? "blur(24px) saturate(160%)" : undefined }}
                        onClick={(e) => e.stopPropagation()}>
                        {/* Navigation header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <button type="button" onClick={() => setCursor(c => c.subtract(1, "month"))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: palette.textSecondary, padding: "4px 6px", borderRadius: 8, display: "flex" }}>
                                <KeyboardArrowLeft style={{ fontSize: 20 }} />
                            </button>
                            <div style={{ display: "flex", gap: 4 }}>
                                <button type="button" onClick={() => setDp(s => ({ ...s, view: s.view === "month" ? "day" : "month" }))}
                                    style={{ fontWeight: 700, fontSize: 14, color: palette.textPrimary, padding: "3px 8px", borderRadius: 8, border: "none", cursor: "pointer", background: dp.view === "month" ? `${accentColor}20` : "transparent" }}>
                                    {MONTHS[cursor.month()]}
                                </button>
                                <button type="button" onClick={() => setDp(s => ({ ...s, view: s.view === "year" ? "day" : "year" }))}
                                    style={{ fontWeight: 700, fontSize: 14, color: palette.textPrimary, padding: "3px 8px", borderRadius: 8, border: "none", cursor: "pointer", background: dp.view === "year" ? `${accentColor}20` : "transparent" }}>
                                    {cursor.year()}
                                </button>
                            </div>
                            <button type="button" onClick={() => setCursor(c => c.add(1, "month"))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: palette.textSecondary, padding: "4px 6px", borderRadius: 8, display: "flex" }}>
                                <KeyboardArrowRight style={{ fontSize: 20 }} />
                            </button>
                        </div>

                        {/* Month picker */}
                        {dp.view === "month" && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                                {MONTHS.map((m, i) => (
                                    <button key={m} type="button" onClick={() => { setCursor(c => c.month(i)); setDp(s => ({ ...s, view: "day" })); }}
                                        style={{ padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: cursor.month() === i ? accentColor : "transparent", color: cursor.month() === i ? "#fff" : palette.textSecondary }}>
                                        {m.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Year picker */}
                        {dp.view === "year" && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                                {Array.from({ length: 50 }, (_, i) => dayjs().year() - 30 + i).map(y => (
                                    <button key={y} type="button" onClick={() => { setCursor(c => c.year(y)); setDp(s => ({ ...s, view: "day" })); }}
                                        style={{ padding: "6px 2px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: cursor.year() === y ? accentColor : "transparent", color: cursor.year() === y ? "#fff" : palette.textSecondary }}>
                                        {y}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Day grid */}
                        {dp.view === "day" && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
                                    {WEEKDAYS.map(w => (
                                        <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: palette.textTertiary, padding: "3px 0" }}>{w}</div>
                                    ))}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                                    {cells.map((d, i) => {
                                        if (!d) return <div key={i} />;
                                        const isSelected = parsed && d.isSame(parsed, "day");
                                        const isToday = d.isSame(dayjs(), "day");
                                        return (
                                            <button key={i} type="button" onClick={() => selectDay(d)}
                                                style={{ padding: "7px 0", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "center", border: isToday && !isSelected ? `1px solid ${accentColor}55` : "1px solid transparent", fontWeight: isSelected ? 700 : 400, background: isSelected ? accentColor : "transparent", color: isSelected ? "#fff" : isToday ? accentColor : palette.textPrimary, transition: "background 0.1s" }}>
                                                {d.date()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Bottom actions */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, borderTop: `1px solid ${borderColor}`, paddingTop: 10 }}>
                            <button type="button" onClick={() => { setCursor(dayjs()); setDp(s => ({ ...s, view: "day" })); }}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: accentColor }}>Today</button>
                            {parsed && (
                                <button type="button" onClick={() => { onChange(""); setDp(s => ({ ...s, open: false })); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: palette.textTertiary }}>Clear</button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================
// iOS-style Toggle Switch (boolean fields)
// ============================================================
function ToggleSwitch({ checked, onChange, label, palette }: { checked: boolean; onChange: (v: boolean) => void; label: string; palette: any; }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none", padding: "4px 0" }}
            onClick={() => onChange(!checked)}>
            <div style={{
                width: 44, height: 26, borderRadius: 13, padding: 3,
                background: checked ? palette.accent : (palette.textTertiary + "44"),
                transition: "background 0.2s",
                position: "relative", flexShrink: 0,
            }}>
                <div style={{
                    width: 20, height: 20, borderRadius: 10, background: "#fff",
                    position: "absolute", top: 3,
                    left: checked ? "calc(100% - 23px)" : 3,
                    transition: "left 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.3)",
                }} />
            </div>
            <span style={{ fontSize: 14, color: palette.textSecondary, fontWeight: 500 }}>{label}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------

export default function AdminCRUDPage({
    title,
    subtitle,
    apiBase,
    idField,
    fields,
    defaultValues = {}
}: AdminCRUDPageProps) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    // ── 2 combined state objects (replaces 13 separate useState hooks) ────────
    const [table, setTable] = useState<{
        items: any[]; total: number; page: number; search: string;
        loading: boolean; error: string; deleteConfirm: string | null;
    }>({ items: [], total: 0, page: 1, search: "", loading: false, error: "", deleteConfirm: null });

    const [modal, setModal] = useState<{
        open: boolean; editItem: any | null; isDuplicate: boolean;
        form: Record<string, any>; saving: boolean; focusedKey: string | null;
    }>({ open: false, editItem: null, isDuplicate: false, form: {}, saving: false, focusedKey: null });

    const patchTable = useCallback((patch: Partial<typeof table>) => setTable(s => ({ ...s, ...patch })), []); // eslint-disable-line
    const patchModal = useCallback((patch: Partial<typeof modal>) => setModal(s => ({ ...s, ...patch })), []); // eslint-disable-line

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const fetchData = useCallback(async () => {
        patchTable({ loading: true, error: "" });
        try {
            const params = new URLSearchParams({ page: String(table.page), limit: String(PAGE_SIZE), search: table.search });
            const res = await fetch(`${apiBase}?${params}`);
            const json = await res.json();
            if (json.success) {
                patchTable({ items: json.data ?? [], total: json.pagination?.total ?? json.data?.length ?? 0 });
            } else {
                patchTable({ error: json.error || "Failed to load" });
            }
        } catch {
            patchTable({ error: "Network error" });
        } finally {
            patchTable({ loading: false });
        }
    }, [apiBase, table.page, table.search]); // eslint-disable-line

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearchChange = (val: string) => {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => patchTable({ search: val, page: 1 }), 400);
    };

    const openCreate = () => patchModal({ open: true, editItem: null, isDuplicate: false, form: { ...defaultValues }, saving: false, focusedKey: null });

    const openEdit = (item: any) => {
        const form: Record<string, any> = {};
        fields.forEach(f => { form[f.key] = item[f.key] ?? defaultValues[f.key] ?? ""; });
        patchModal({ open: true, editItem: item, isDuplicate: false, form, saving: false, focusedKey: null });
    };

    /** Duplicate: opens the Create modal pre-filled with an existing entry's data */
    const openDuplicate = (item: any) => {
        const form: Record<string, any> = {};
        fields.forEach(f => {
            let val = item[f.key] ?? defaultValues[f.key] ?? "";
            if (f.type === "text" && f.required && typeof val === "string" && val && !val.endsWith(" (Copy)")) val += " (Copy)";
            form[f.key] = val;
        });
        patchModal({ open: true, editItem: null, isDuplicate: true, form, saving: false, focusedKey: null });
    };

    const closeModal = () => patchModal({ open: false, editItem: null, isDuplicate: false, form: {}, saving: false, focusedKey: null });

    const handleSave = async () => {
        patchModal({ saving: true });
        patchTable({ error: "" });
        try {
            const { editItem, isDuplicate, form } = modal;
            const res = editItem && !isDuplicate
                ? await fetch(`${apiBase}/${editItem[idField]}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
                : await fetch(apiBase, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const json = await res.json();
            if (json.success) { closeModal(); fetchData(); }
            else patchTable({ error: json.error || "Save failed" });
        } catch {
            patchTable({ error: "Network error" });
        } finally {
            patchModal({ saving: false });
        }
    };

    const handleDelete = async (id: string) => {
        patchTable({ deleteConfirm: null });
        try {
            const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) fetchData();
            else patchTable({ error: json.error || "Delete failed" });
        } catch {
            patchTable({ error: "Network error" });
        }
    };

    const tableFields = fields.filter(f => f.tableVisible !== false);
    const pages = Math.max(1, Math.ceil(table.total / PAGE_SIZE));

    // Style helpers
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)"
        : isDark ? "rgba(22,22,26,0.97)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";
    const cardRadius = isApple ? "20px" : "24px";
    const fieldRadius = isApple ? "12px" : "14px";

    const inputBase: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: fieldRadius,
        color: palette.textPrimary,
        padding: "11px 14px",
        outline: "none",
        width: "100%",
        fontSize: "14px",
        transition: "border 0.15s, box-shadow 0.15s",
    };

    const inputStyle = inputBase;

    const getInputStyle = (key: string): React.CSSProperties => ({
        ...inputBase,
        ...(modal.focusedKey === key
            ? { border: `1px solid ${palette.accent}`, boxShadow: `0 0 0 3px ${palette.accent}25` }
            : {}),
    });

    const renderField = (field: FieldDef) => {
        const val = modal.form[field.key];
        const update = (v: any) => patchModal({ form: { ...modal.form, [field.key]: v } });

        if (field.type === "boolean") {
            return <ToggleSwitch checked={!!val} onChange={update} label={field.label} palette={palette} />;
        }

        if (field.type === "textarea") {
            return (
                <textarea
                    placeholder={field.placeholder || field.label}
                    value={val || ""}
                    onChange={e => update(e.target.value)}
                    rows={4}
                    onFocus={() => patchModal({ focusedKey: field.key })}
                    onBlur={() => patchModal({ focusedKey: null })}
                    style={{ ...getInputStyle(field.key), resize: "vertical", lineHeight: 1.6 }}
                    required={field.required}
                />
            );
        }

        if (field.type === "select" && field.options) {
            return (
                <CustomSelect
                    key={field.key}
                    value={val || ""}
                    onChange={update}
                    options={[
                        { value: "", label: `Select ${field.label}` },
                        ...field.options.map(opt => ({ value: opt, label: opt })),
                    ]}
                    placeholder={`Select ${field.label}`}
                />
            );
        }

        if (field.type === "date") {
            return (
                <AdminDatePicker
                    value={val || ""}
                    onChange={update}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    palette={palette}
                    isDark={isDark}
                    isApple={isApple}
                    borderColor={borderColor}
                    inputStyle={getInputStyle(field.key)}
                />
            );
        }

        if (field.type === "cdn-image") {
            return (
                <CDNImageField
                    key={field.key}
                    fieldKey={field.key}
                    value={val || ""}
                    onChange={update}
                    cdnType={field.cdnType || "icon"}
                    cdnContext={field.cdnContext}
                    palette={palette}
                    isDark={isDark}
                    borderColor={borderColor}
                    isApple={isApple}
                />
            );
        }

        if (field.type === "cdn-image-list") {
            return (
                <CDNImageListField
                    key={field.key}
                    value={Array.isArray(val) ? val : []}
                    onChange={update}
                    cdnType={field.cdnType || "banner"}
                    cdnContext={field.cdnContext}
                    palette={palette}
                    isDark={isDark}
                    borderColor={borderColor}
                    isApple={isApple}
                />
            );
        }

        if (field.type === "tags") {
            const tags: string[] = Array.isArray(val) ? val : [];
            const isFocused = modal.focusedKey === field.key;
            return (
                <div>
                    <div
                        onClick={(e) => { (e.currentTarget as HTMLElement).querySelector("input")?.focus(); }}
                        style={{
                            ...inputBase,
                            ...(isFocused ? { border: `1px solid ${palette.accent}`, boxShadow: `0 0 0 3px ${palette.accent}25` } : {}),
                            minHeight: 46,
                            display: "flex", flexWrap: "wrap", gap: 6,
                            alignItems: "center", cursor: "text", padding: "8px 12px",
                        }}
                    >
                        {tags.map((tag, i) => (
                            <span key={i} style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "2px 8px 2px 10px", borderRadius: 99,
                                background: `${palette.accent}20`, color: palette.accent,
                                fontSize: 12, fontWeight: 600,
                            }}>
                                {tag}
                                <button type="button" onClick={() => update(tags.filter((_, j) => j !== i))}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: palette.accent, lineHeight: 1, padding: 0, display: "flex" }}>
                                    <Close style={{ fontSize: 12 }} />
                                </button>
                            </span>
                        ))}
                        <input
                            placeholder={tags.length === 0 ? (field.placeholder || `Add ${field.label}…`) : ""}
                            onFocus={() => patchModal({ focusedKey: field.key })}
                            onBlur={() => patchModal({ focusedKey: null })}
                            style={{ flex: 1, minWidth: 80, background: "none", border: "none", outline: "none", color: palette.textPrimary, fontSize: 14, padding: "2px 0" }}
                            onKeyDown={e => {
                                if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    const v = (e.target as HTMLInputElement).value.trim();
                                    if (v && !tags.includes(v)) update([...tags, v]);
                                    (e.target as HTMLInputElement).value = "";
                                }
                                if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "" && tags.length > 0) {
                                    update(tags.slice(0, -1));
                                }
                            }}
                        />
                    </div>
                    <p style={{ fontSize: 11, color: palette.textTertiary, marginTop: 4 }}>Press Enter or comma to add a tag</p>
                </div>
            );
        }

        // text / number / url
        return (
            <input
                type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                placeholder={field.placeholder || field.label}
                value={val ?? ""}
                onChange={e => update(field.type === "number" ? Number(e.target.value) : e.target.value)}
                onFocus={() => patchModal({ focusedKey: field.key })}
                onBlur={() => patchModal({ focusedKey: null })}
                style={getInputStyle(field.key)}
                required={field.required}
            />
        );
    };

    const renderCellValue = (item: any, field: FieldDef) => {
        const val = item[field.key];
        if (val === undefined || val === null || val === "") return <span style={{ color: palette.textTertiary }}>—</span>;
        if (field.type === "boolean") return (
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                background: val ? `${palette.accent}18` : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                color: val ? palette.accent : palette.textTertiary }}>
                {val ? "Yes" : "No"}
            </span>
        );
        if (field.type === "cdn-image" || (field.type === "url" && typeof val === "string" && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(val))) {
            return (
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", flexShrink: 0 }}>
                    <img src={val} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
            );
        }
        if (field.type === "cdn-image-list") {
            const imgs: string[] = Array.isArray(val) ? val : [];
            if (imgs.length === 0) return <span style={{ color: palette.textTertiary }}>—</span>;
            return (
                <div className="flex gap-1">
                    {imgs.slice(0, 3).map((url, i) => (
                        <div key={i} style={{ width: 28, height: 28, borderRadius: 6, overflow: "hidden", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                    ))}
                    {imgs.length > 3 && <span style={{ color: palette.textTertiary, fontSize: 11, alignSelf: "center" }}>+{imgs.length - 3}</span>}
                </div>
            );
        }
        if (field.type === "tags" || Array.isArray(val)) {
            const arr = Array.isArray(val) ? val : [val];
            return (
                <div className="flex flex-wrap gap-1">
                    {arr.slice(0, 3).map((t: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: `${palette.accent}18`, color: palette.accent }}>
                            {t}
                        </span>
                    ))}
                    {arr.length > 3 && <span style={{ color: palette.textTertiary, fontSize: 12 }}>+{arr.length - 3}</span>}
                </div>
            );
        }
        if (field.type === "date") return <span style={{ fontSize: 13 }}>{val ? dayjs(val).format("MMM D, YYYY") : "—"}</span>;
        if (field.type === "url") return (
            <a href={val} target="_blank" rel="noopener noreferrer"
                className="text-xs underline truncate max-w-[120px] block"
                style={{ color: palette.accent }}>
                {val}
            </a>
        );
        return <span className="truncate block max-w-[160px]">{String(val)}</span>;
    };

    return (
        <div className="p-6" style={{ minHeight: "100vh", background: palette.background }}>
            {/* Page header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: palette.textPrimary }}>{title}</h1>
                    {subtitle && <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>{subtitle}</p>}
                    <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>{table.total} records</p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={fetchData}
                    >
                        <Refresh fontSize="small" /> Refresh
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: palette.accent, color: "#fff" }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={openCreate}
                    >
                        <Add fontSize="small" /> Add New
                    </motion.button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: palette.textTertiary, fontSize: 18 }} />
                <input
                    placeholder={`Search ${title}...`}
                    style={{ ...inputBase, paddingLeft: "38px" }}
                    onFocus={() => patchModal({ focusedKey: "__search" })}
                    onBlur={() => patchModal({ focusedKey: null })}
                    onChange={e => handleSearchChange(e.target.value)}
                />
            </div>

            {/* Error */}
            {table.error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center justify-between"
                    style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232", border: "1px solid rgba(220,50,50,0.2)" }}>
                    <span>{table.error}</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        className="ml-2 p-1 rounded"
                        style={{ color: "#DC3232" }}
                        onClick={() => patchTable({ error: "" })}>
                        <Close style={{ fontSize: 16 }} />
                    </motion.button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                {tableFields.map(f => (
                                    <th key={f.key} className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide"
                                        style={{ color: palette.textTertiary }}>
                                        {f.label}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wide"
                                    style={{ color: palette.textTertiary }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t" style={{ borderColor }}>
                                        {tableFields.map(f => (
                                            <td key={f.key} className="px-4 py-3">
                                                <div className="h-4 rounded animate-pulse"
                                                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", width: "70%" }} />
                                            </td>
                                        ))}
                                        <td className="px-4 py-3" />
                                    </tr>
                                ))
                            ) : table.items.length === 0 ? (
                                <tr>
                                    <td colSpan={tableFields.length + 1} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                                                <Search style={{ fontSize: 28, color: palette.textTertiary }} />
                                            </div>
                                            <p className="text-sm font-medium" style={{ color: palette.textSecondary }}>No records found</p>
                                            <p className="text-xs" style={{ color: palette.textTertiary }}>Try adjusting your search or add a new entry</p>
                                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                className="mt-1 px-4 py-1.5 rounded-xl text-xs font-bold"
                                                style={{ background: palette.accent, color: "#fff" }}
                                                onClick={openCreate}>
                                                + Add New
                                            </motion.button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                table.items.map((item) => (
                                    <motion.tr
                                        key={item[idField] || item._id}
                                        className="border-t"
                                        style={{ borderColor }}
                                        whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                                        transition={{ duration: 0.12 }}
                                    >
                                        {tableFields.map(f => (
                                            <td key={f.key} className="px-4 py-3" style={{ color: palette.textPrimary }}>
                                                {renderCellValue(item, f)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Edit */}
                                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                    className="p-1.5 rounded-lg" title="Edit"
                                                    style={{ background: `${palette.accent}15`, color: palette.accent }}
                                                    onClick={() => openEdit(item)}>
                                                    <Edit style={{ fontSize: 15 }} />
                                                </motion.button>
                                                {/* Duplicate */}
                                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                    className="p-1.5 rounded-lg" title="Duplicate entry"
                                                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textSecondary }}
                                                    onClick={() => openDuplicate(item)}>
                                                    <ContentCopy style={{ fontSize: 15 }} />
                                                </motion.button>
                                                {table.deleteConfirm === (item[idField] || item._id) ? (
                                                    <div className="flex gap-1">
                                                        <motion.button whileHover={{ scale: 1.05 }}
                                                            className="px-2 py-1 rounded-lg text-xs font-bold"
                                                            style={{ background: "rgba(220,50,50,0.15)", color: "#DC3232" }}
                                                            onClick={() => handleDelete(item[idField] || item._id)}>
                                                            Confirm
                                                        </motion.button>
                                                        <motion.button whileHover={{ scale: 1.05 }}
                                                            className="px-2 py-1 rounded-lg text-xs"
                                                            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                                            onClick={() => patchTable({ deleteConfirm: null })}>
                                                            Cancel
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                        className="p-1.5 rounded-lg" title="Delete"
                                                        style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232" }}
                                                        onClick={() => patchTable({ deleteConfirm: item[idField] || item._id })}>
                                                        <Delete style={{ fontSize: 15 }} />
                                                    </motion.button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor }}>
                        <p className="text-xs" style={{ color: palette.textTertiary }}>
                            Page {table.page} of {pages} ({table.total} total)
                        </p>
                        <div className="flex gap-2">
                            <motion.button
                                disabled={table.page <= 1}
                                whileHover={{ scale: table.page > 1 ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: table.page <= 1 ? palette.textTertiary : palette.textSecondary
                                }}
                                onClick={() => patchTable({ page: Math.max(1, table.page - 1) })}
                            >
                                <ChevronLeft fontSize="small" />
                            </motion.button>
                            <motion.button
                                disabled={table.page >= pages}
                                whileHover={{ scale: table.page < pages ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: table.page >= pages ? palette.textTertiary : palette.textSecondary
                                }}
                                onClick={() => patchTable({ page: Math.min(pages, table.page + 1) })}
                            >
                                <ChevronRight fontSize="small" />
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create / Edit / Duplicate Modal ── */}
            <AnimatePresence>
                {modal.open && (
                    <>
                        <motion.div className="fixed inset-0 z-50"
                            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeModal} />
                        <motion.div className="fixed z-50 inset-0 flex items-center justify-center p-4"
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 6 }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}>
                            <div
                                className="w-full max-w-3xl max-h-[92vh] flex flex-col"
                                style={{
                                    background: cardBg, borderRadius: cardRadius,
                                    border: `1px solid ${borderColor}`,
                                    boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.7)" : "0 20px 60px rgba(0,0,0,0.16)",
                                }}
                                onClick={e => e.stopPropagation()}>

                                {/* Modal header */}
                                <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0" style={{ borderColor }}>
                                    <div>
                                        <h2 className="text-lg font-black" style={{ color: palette.textPrimary }}>
                                            {modal.isDuplicate ? `Duplicate ${title.replace(/ies$/, "y").replace(/s$/, "")}`
                                                : modal.editItem ? `Edit ${title.replace(/ies$/, "y").replace(/s$/, "")}`
                                                : `Add ${title.replace(/ies$/, "y").replace(/s$/, "")}`}
                                        </h2>
                                        {modal.isDuplicate && (
                                            <p className="text-xs mt-0.5" style={{ color: palette.textTertiary }}>
                                                Creating a copy — adjust fields before saving
                                            </p>
                                        )}
                                    </div>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        className="p-2 rounded-xl"
                                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                        onClick={closeModal}>
                                        <Close fontSize="small" />
                                    </motion.button>
                                </div>

                                {/* Scrollable form body */}
                                <div className="overflow-y-auto flex-1 px-7 py-6 admin-sidebar-scroll">
                                    <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                                        {fields.map(field => (
                                            <div key={field.key}
                                                className={field.colSpan === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                                                {field.type !== "boolean" && (
                                                    <label className="block text-sm font-semibold mb-2"
                                                        style={{ color: palette.textSecondary }}>
                                                        {field.label}
                                                        {field.required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
                                                    </label>
                                                )}
                                                {renderField(field)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal footer */}
                                <div className="flex items-center justify-between gap-3 px-7 py-5 border-t flex-shrink-0" style={{ borderColor }}>
                                    <span style={{ fontSize: 12, color: palette.textTertiary }}>
                                        {fields.filter(f => f.required).length} required fields
                                    </span>
                                    <div className="flex gap-3">
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                                            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                            onClick={closeModal}>
                                            Cancel
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold"
                                            style={{ background: palette.accent, color: "#fff", opacity: modal.saving ? 0.7 : 1 }}
                                            onClick={handleSave} disabled={modal.saving}>
                                            {modal.isDuplicate ? <ContentCopy fontSize="small" /> : <Save fontSize="small" />}
                                            {modal.saving ? "Saving…" : modal.isDuplicate ? "Save Copy" : "Save"}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
