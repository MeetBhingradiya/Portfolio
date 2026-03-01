/**
 * OcrScanner — Client-side trade screenshot OCR using Tesseract.js
 *
 * Extracts text from a dropped/selected image, then parses it for common
 * trade fields (instrument, price, time, QTY, P&L, etc.) and calls onExtracted
 * with a partial TradeFormData so the parent form can pre-fill the fields.
 *
 * Runs entirely in the browser — no API call, no image is ever uploaded.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import {
    DocumentScanner,
    CloudUpload,
    CheckCircle,
    Warning,
    Close,
} from "@mui/icons-material";
import type { TradeFormData } from "./TradeForm";

// ─── Field parsers ────────────────────────────────────────────────────────────

/** Extract HH:MM from a string that may contain time like "09:32", "9:32 AM" */
function extractTime(text: string): string | null {
    const m = text.match(/\b(\d{1,2}):(\d{2})(?:\s*(?:AM|PM))?\b/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = m[2];
    if (/PM/i.test(text) && h < 12) h += 12;
    if (/AM/i.test(text) && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
}

/** Parse a number from text like "₹ 1,234.50" or "1234.50" */
function numFromText(text: string): number | null {
    const cleaned = text.replace(/[₹$,\s]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
}

/** Find all decimal numbers in a text segment */
function allNums(segment: string): number[] {
    return Array.from(segment.matchAll(/\d[\d,]*(?:\.\d+)?/g))
        .map(m => numFromText(m[0]))
        .filter((n): n is number => n !== null);
}

/**
 * Best-effort extraction from raw OCR text.
 * Returns a partial TradeFormData with any confidently-detected fields.
 * Designed for Zerodha / AngelOne / Upstox contract note / order screenshots.
 */
export function parseOcrText(raw: string): Partial<TradeFormData> & { _ocrRaw?: string } {
    const result: Partial<TradeFormData> & { _ocrRaw?: string } = { _ocrRaw: raw };
    const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const upper = raw.toUpperCase();

    // ── Date ──────────────────────────────────────────────────────────────────
    // Formats: "27 Feb 2026", "2026-02-27", "27/02/2026", "Feb 27, 2026"
    const datePatterns = [
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\d{2})\/(\d{2})\/(\d{4})/,
        /(\d{1,2})[\s-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,-]+(\d{4})/i,
    ];
    for (const pat of datePatterns) {
        const m = raw.match(pat);
        if (m) {
            try {
                const d = new Date(m[0]);
                if (!isNaN(d.getTime())) {
                    result.Date = d.toISOString().slice(0, 10);
                    break;
                }
            } catch {}
        }
    }

    // ── Entry time (look for "entry" near a time) ─────────────────────────────
    for (const line of lines) {
        if (/entry|bought|buy|order\s*time|placed/i.test(line)) {
            const t = extractTime(line);
            if (t) { result.EntryTime = t; break; }
        }
    }
    // Fallback: first HH:MM on any line
    if (!result.EntryTime) {
        const t = extractTime(raw);
        if (t) result.EntryTime = t;
    }

    // ── Exit time ─────────────────────────────────────────────────────────────
    for (const line of lines) {
        if (/exit|sold|sell|square.?off/i.test(line)) {
            const t = extractTime(line);
            if (t) { result.ExitTime = t; break; }
        }
    }

    // ── Instrument ────────────────────────────────────────────────────────────
    const knownInstruments = [
        "NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "SENSEX",
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "WIPRO",
        "SBIN", "HDFC", "LT", "ONGC", "TATAMOTORS", "HINDALCO",
        "BAJFINANCE", "ASIANPAINT", "MARUTI", "ADANIPORTS", "AXISBANK",
    ];
    for (const inst of knownInstruments) {
        if (upper.includes(inst)) { result.Instrument = inst; break; }
    }
    if (!result.Instrument) {
        // try to match ticker-like word: 4-12 uppercase letters
        const m = upper.match(/\b([A-Z]{4,12})\b(?:\s+(?:CE|PE|FUT|EQ|OPT))?/);
        if (m) result.Instrument = m[1];
    }

    // ── Segment & direction ───────────────────────────────────────────────────
    if (/\bFUTURE|FUT\b/.test(upper))   result.Segment = "FUTURES";
    else if (/\bOPTION|CE\b|PE\b/.test(upper)) result.Segment = "OPTIONS";
    else if (/\bCRYPTO|BTC|ETH\b/.test(upper)) result.Segment = "CRYPTO";
    else if (/\bFUTURES\b/.test(upper)) result.Segment = "FUTURES";
    else                                 result.Segment = "EQUITY";

    if (/\bBUY|LONG|BT\b/.test(upper))  result.Direction = "LONG";
    if (/\bSELL|SHORT|ST\b/.test(upper)) result.Direction = "SHORT";

    // ── Option type / strike ──────────────────────────────────────────────────
    const ceM = upper.match(/(\d{4,6})\s*CE\b/);
    const peM = upper.match(/(\d{4,6})\s*PE\b/);
    if (ceM) { result.OptionType = "CE"; result.Strike = parseInt(ceM[1]); result.Segment = "OPTIONS"; }
    else if (peM) { result.OptionType = "PE"; result.Strike = parseInt(peM[1]); result.Segment = "OPTIONS"; }

    // ── Prices: look for "price", "avg", "rate" labels near numbers ───────────
    for (const line of lines) {
        const nums = allNums(line);
        if (!nums.length) continue;
        const low = line.toLowerCase();
        if (/entry|avg\.?\s*buy|bought\s*@|buy\s*price|buy\s*rate/.test(low) && nums[0])
            result.EntryPrice = result.EntryPrice ?? nums[0];
        if (/exit|avg\.?\s*sell|sold\s*@|sell\s*price|sell\s*rate/.test(low) && nums[0])
            result.ExitPrice = result.ExitPrice ?? nums[0];
        if (/stop|sl\b|stoploss/.test(low) && nums[0])
            result.StopLoss = result.StopLoss ?? nums[0];
        if (/target|tgt\b/.test(low) && nums[0])
            result.Target = result.Target ?? nums[0];
        if (/qty|quantity|lots?/.test(low) && nums[0])
            result.Quantity = result.Quantity ?? nums[0];
        if (/lot\s*size|lotsize/.test(low) && nums[0])
            result.LotSize = result.LotSize ?? nums[0];
    }

    // ── PnL extraction ────────────────────────────────────────────────────────
    for (const line of lines) {
        const low = line.toLowerCase();
        const nums = allNums(line);
        if (/net\s*p[&/]?l|net\s*profit|net\s*loss/.test(low) && nums[0] !== undefined) {
            const sign = /loss/i.test(line) ? -1 : 1;
            result.NetPnL = result.NetPnL ?? nums[0] * sign;
        }
        if (/gross\s*p[&/]?l|gross\s*profit/.test(low) && nums[0] !== undefined) {
            result.GrossPnL = result.GrossPnL ?? nums[0];
        }
        if (/brokerage|commission|fee/.test(low) && nums[0] !== undefined) {
            result.Brokerage = result.Brokerage ?? nums[0];
        }
    }

    // ── Result inference ──────────────────────────────────────────────────────
    if (!result.Result) {
        if (/profit|win\b|\bgreen/.test(upper.toLowerCase())) result.Result = "WIN";
        else if (/loss|\bred\b/.test(upper.toLowerCase()))     result.Result = "LOSS";
    }
    if (!result.Result && result.NetPnL != null) {
        const n = parseFloat(String(result.NetPnL));
        if (!isNaN(n)) result.Result = n > 0 ? "WIN" : n < 0 ? "LOSS" : "BREAKEVEN";
    }

    // ── IsOpen inference ──────────────────────────────────────────────────────
    result.IsOpen = !result.ExitPrice && !result.ExitTime;

    return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    onExtracted: (data: Partial<TradeFormData>) => void;
    onClose: () => void;
}

export default function OcrScanner({ onExtracted, onClose }: Props) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark   = actualColorMode === "dark";
    const isApple  = designTheme === "apple";

    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [rawText, setRawText]  = useState<string>("");
    const [extracted, setExtracted] = useState<Partial<TradeFormData> | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const surfaceBg   = isApple
        ? isDark ? "rgba(38,38,42,0.95)" : "rgba(255,255,255,0.95)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setStatus("error"); return;
        }
        setStatus("loading");
        setProgress(0);
        setPreview(URL.createObjectURL(file));

        try {
            // Dynamic import so Tesseract is never bundled server-side
            const { createWorker } = await import("tesseract.js");
            const worker = await createWorker("eng", 1, {
                logger: (m: any) => {
                    if (m.status === "recognizing text") {
                        setProgress(Math.round((m.progress ?? 0) * 100));
                    }
                },
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            setRawText(text);
            const parsed = parseOcrText(text);
            const { _ocrRaw, ...clean } = parsed;
            setExtracted(clean);
            setStatus("done");
            setProgress(100);
        } catch (err) {
            console.error("OCR error:", err);
            setStatus("error");
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const applyAndClose = () => {
        if (extracted) onExtracted(extracted);
        onClose();
    };

    const fieldCount = extracted
        ? Object.entries(extracted).filter(([k, v]) => v !== "" && v != null && k !== "IsOpen").length
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: `${palette.accent}18` }}>
                            <DocumentScanner style={{ color: palette.accent }} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg" style={{ color: palette.textPrimary }}>OCR Scan</h2>
                            <p className="text-xs" style={{ color: palette.textSecondary }}>
                                Upload a trade screenshot — fields auto-fill from the image (runs in browser, no upload)
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: palette.textSecondary }}>
                        <Close />
                    </button>
                </div>

                {/* Drop zone */}
                {status === "idle" && (
                    <div
                        className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl cursor-pointer"
                        style={{ border: `2px dashed ${palette.accent}50`, background: `${palette.accent}08` }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <CloudUpload style={{ color: palette.accent, fontSize: 42 }} />
                        <p className="font-semibold" style={{ color: palette.textPrimary }}>
                            Drop screenshot here or click to browse
                        </p>
                        <p className="text-xs" style={{ color: palette.textSecondary }}>
                            PNG, JPG, WEBP — Zerodha / AngelOne / Upstox order screenshots work best
                        </p>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </div>
                )}

                {/* Loading */}
                {status === "loading" && (
                    <div className="space-y-4">
                        {preview && (
                            <img src={preview} alt="preview" className="w-full rounded-xl max-h-48 object-contain"
                                style={{ border: `1px solid ${borderColor}` }} />
                        )}
                        <p className="text-sm font-medium text-center" style={{ color: palette.textSecondary }}>
                            Scanning image… {progress}%
                        </p>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: `${palette.accent}18` }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: palette.accent }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-xs text-center" style={{ color: palette.textTertiary }}>
                            Running Tesseract OCR locally in your browser — no data is sent anywhere
                        </p>
                    </div>
                )}

                {/* Error */}
                {status === "error" && (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <Warning style={{ color: "#ef4444", fontSize: 36 }} />
                        <p style={{ color: "#ef4444" }}>Could not scan this image. Please try a clearer screenshot.</p>
                        <button onClick={() => setStatus("idle")}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{ background: `${palette.accent}20`, color: palette.accent }}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Results */}
                {status === "done" && extracted && (
                    <div className="space-y-4">
                        {preview && (
                            <img src={preview} alt="preview" className="w-full rounded-xl max-h-40 object-contain"
                                style={{ border: `1px solid ${borderColor}` }} />
                        )}

                        {/* Detected fields summary */}
                        <div className="p-4 rounded-xl" style={{ background: isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.20)" }}>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle style={{ color: "#22c55e" }} fontSize="small" />
                                <p className="font-semibold text-sm" style={{ color: "#22c55e" }}>
                                    Detected {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(Object.entries(extracted) as [string, any][])
                                    .filter(([k, v]) => v !== "" && v != null && k !== "IsOpen")
                                    .map(([k, v]) => (
                                        <div key={k} className="text-xs flex items-center justify-between px-3 py-1.5 rounded-lg"
                                            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                                            <span style={{ color: palette.textSecondary }}>{k}</span>
                                            <span className="font-semibold ml-1 truncate max-w-[80px]" style={{ color: palette.textPrimary }}>{String(v)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Raw text accordion */}
                        <details>
                            <summary className="text-xs cursor-pointer" style={{ color: palette.textTertiary }}>
                                View raw OCR text
                            </summary>
                            <pre className="text-xs mt-2 p-3 rounded-xl overflow-auto max-h-32 whitespace-pre-wrap"
                                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", color: palette.textSecondary, border: `1px solid ${borderColor}` }}>
                                {rawText}
                            </pre>
                        </details>

                        <div className="flex gap-3 pt-1">
                            <motion.button
                                onClick={applyAndClose}
                                className="flex-1 py-2.5 rounded-xl font-semibold"
                                style={{ background: palette.accent, color: "#fff" }}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            >
                                Apply to Form
                            </motion.button>
                            <button
                                onClick={() => { setStatus("idle"); setPreview(null); setExtracted(null); }}
                                className="px-4 py-2.5 rounded-xl font-semibold"
                                style={{ background: `${palette.accent}20`, color: palette.accent }}
                            >
                                Scan Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
