/**
 * OcrScanner — Client-side trade screenshot OCR using Tesseract.js.
 * Tuned for dark broker screenshots with instrument summary and order logs.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { CheckCircle, CloudUpload, Close, DocumentScanner, Warning } from "@mui/icons-material";
import type { TradeFormData } from "./TradeForm";

type ParsedResult = Partial<TradeFormData> & {
    _ocrRaw?: string;
    _score?: number;
};

function numFromText(text: string): number | null {
    const cleaned = text.replace(/[^\d.+-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

function allNums(text: string): number[] {
    return Array.from(text.matchAll(/[+-]?\d[\d,]*(?:\.\d+)?/g))
        .map((m) => numFromText(m[0]))
        .filter((n): n is number => n !== null);
}

function toAmPm(value: string): string | null {
    const m = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;
    const hh = String(Math.min(12, Math.max(1, Number(m[1])))).padStart(2, "0");
    return `${hh}:${m[2]} ${m[3].toUpperCase()}`;
}

function parseExpiryToken(token: string): string | undefined {
    const m = token.toUpperCase().match(/^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/);
    if (!m) return undefined;

    const monthMap: Record<string, string> = {
        JAN: "01",
        FEB: "02",
        MAR: "03",
        APR: "04",
        MAY: "05",
        JUN: "06",
        JUL: "07",
        AUG: "08",
        SEP: "09",
        OCT: "10",
        NOV: "11",
        DEC: "12"
    };

    const dd = String(Number(m[1])).padStart(2, "0");
    const mm = monthMap[m[2]];
    const yyyy = `20${m[3]}`;
    return `${yyyy}-${mm}-${dd}`;
}

function parseDate(raw: string): string | undefined {
    const m1 = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
    if (m1) {
        const dd = String(Number(m1[1])).padStart(2, "0");
        const mm = String(Number(m1[2])).padStart(2, "0");
        const yy = m1[3].length === 2 ? `20${m1[3]}` : m1[3];
        return `${yy}-${mm}-${dd}`;
    }

    const m2 = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;

    return undefined;
}

function scoreParsed(p: ParsedResult): number {
    let score = 0;
    if (p.InstrumentName) score += 3;
    if (p.OptionType) score += 2;
    if (p.Strike) score += 2;
    if (p.EntryPrice) score += 2;
    if (p.ExitPrice) score += 2;
    if (p.Quantity) score += 2;
    if (p.EntryTime) score += 1;
    if (p.ExitTime) score += 1;
    if (p.PnLAmount) score += 2;
    if (p.PnLSign) score += 1;
    return score;
}

function mergePreferNew(base: ParsedResult, next: ParsedResult): ParsedResult {
    const merged: ParsedResult = { ...base };
    for (const [k, v] of Object.entries(next)) {
        if (k === "_ocrRaw" || k === "_score") continue;

        const current = (merged as any)[k];
        const hasCurrent = !(current === "" || current == null);
        const hasIncoming = !(v === "" || v == null);

        // Fill missing fields only; do not let low-confidence variants overwrite extracted values.
        if (!hasCurrent && hasIncoming) {
            (merged as any)[k] = v;
        }
    }
    return merged;
}

function applyFinalPnlSanity(parsed: ParsedResult): ParsedResult {
    const next: ParsedResult = { ...parsed };
    const e = Number(next.EntryPrice);
    const x = Number(next.ExitPrice);
    const q = Number(next.Quantity);
    if (!Number.isFinite(e) || !Number.isFinite(x) || !Number.isFinite(q) || q <= 0) {
        return next;
    }

    const lot = next.LotSize != null && next.LotSize !== "" ? Number(next.LotSize) : 1;
    const direction = next.PositionDuration || "SHORT";
    const gross = direction === "SHORT" ? (e - x) * q * lot : (x - e) * q * lot;
    const expectedAbs = Math.abs(Number(gross.toFixed(2)));
    const currentAbs = Number(next.PnLAmount);

    if (!Number.isFinite(currentAbs) || currentAbs > expectedAbs * 2.2) {
        next.PnLAmount = expectedAbs;
        next.PnLSign = gross < 0 ? "LOSS" : "PROFIT";
    }

    return next;
}

export function parseOcrText(raw: string): ParsedResult {
    const result: ParsedResult = { _ocrRaw: raw };
    const upper = raw.toUpperCase();
    const lines = raw
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean);
    let estCharges: number | undefined;
    let sawBuyPlaced = false;
    let sawSellPlaced = false;
    let sawBuyClosed = false;
    let sawSellClosed = false;

    const date = parseDate(raw);
    if (date) result.Date = date;

    const contract = upper.match(/\b([A-Z]{3,15})\s+(\d{1,2}[A-Z]{3}\d{2})\s+(\d{4,6})\s+(CE|PE)\b/);
    if (contract) {
        result.InstrumentName = contract[1];
        result.Instrument = `${contract[1]} ${contract[2]} ${contract[3]} ${contract[4]}`;
        result.OptionType = contract[4];
        result.Strike = Number(contract[3]);
        result.Expiry = parseExpiryToken(contract[2]);
        result.Segment = "OPTIONS";
    }

    if (!result.InstrumentName) {
        const stock = upper.match(/\b(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY|SENSEX|RELIANCE|TCS|INFY|ICICIBANK|HDFCBANK)\b/);
        if (stock) result.InstrumentName = stock[1];
    }

    if (/\bEXITED\b/.test(upper)) {
        result.IsHit = result.IsHit || "NONE";
    }

    for (const line of lines) {
        const low = line.toLowerCase();
        const nums = allNums(line);

        if (/quantity/.test(low) && nums[0] != null) {
            result.Quantity = result.Quantity ?? Math.abs(nums[0]);
        }
        if (/entry\s*price/.test(low) && nums[0] != null) {
            result.EntryPrice = result.EntryPrice ?? nums[0];
        }
        if (/exit\s*price/.test(low) && nums[0] != null) {
            result.ExitPrice = result.ExitPrice ?? nums[0];
        }
        if (/stop\s*loss|stoploss|\bsl\b/.test(low) && nums[0] != null) {
            result.StopLoss = result.StopLoss ?? nums[0];
        }
        if (/target|\btgt\b/.test(low) && nums[0] != null) {
            result.Target = result.Target ?? nums[0];
        }
        if (/est\.?\s*charges|brokerage|charges/.test(low) && nums[0] != null) {
            estCharges = nums[0];
        }

        if (/buy\)?\s*trade\s*placed|trade\s*placed/.test(low)) {
            const t = toAmPm(line);
            if (t) result.EntryTime = result.EntryTime ?? t;
        }
        if (/sell\)?\s*trade\s*closed|trade\s*closed/.test(low)) {
            const t = toAmPm(line);
            if (t) result.ExitTime = result.ExitTime ?? t;
        }

        if (/buy\)?\s*trade\s*placed/.test(low)) sawBuyPlaced = true;
        if (/sell\)?\s*trade\s*placed/.test(low)) sawSellPlaced = true;
        if (/buy\)?\s*trade\s*closed/.test(low)) sawBuyClosed = true;
        if (/sell\)?\s*trade\s*closed/.test(low)) sawSellClosed = true;

        if (/buy\)?\s*trade\s*placed/.test(low)) {
            const priceFromNext = low.includes("price") ? nums[0] : undefined;
            if (priceFromNext != null) result.EntryPrice = result.EntryPrice ?? priceFromNext;
        }
        if (/sell\)?\s*trade\s*closed/.test(low)) {
            const priceFromNext = low.includes("price") ? nums[0] : undefined;
            if (priceFromNext != null) result.ExitPrice = result.ExitPrice ?? priceFromNext;
        }
    }

    const entryLog = upper.match(/BUY\)?\s*TRADE\s*PLACED[\s\S]{0,80}?(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (entryLog) {
        const t = toAmPm(entryLog[1]);
        if (t) result.EntryTime = result.EntryTime ?? t;
    }

    const exitLog = upper.match(/SELL\)?\s*TRADE\s*CLOSED[\s\S]{0,80}?(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (exitLog) {
        const t = toAmPm(exitLog[1]);
        if (t) result.ExitTime = result.ExitTime ?? t;
    }

    // Infer direction from order log pattern.
    if ((sawBuyPlaced && sawSellClosed) || /\bBUY\)?\s*TRADE\s*PLACED\b[\s\S]{0,180}\bSELL\)?\s*TRADE\s*CLOSED\b/i.test(raw)) {
        result.PositionDuration = "LONG";
    } else if ((sawSellPlaced && sawBuyClosed) || /\bSELL\)?\s*TRADE\s*PLACED\b[\s\S]{0,180}\bBUY\)?\s*TRADE\s*CLOSED\b/i.test(raw)) {
        result.PositionDuration = "SHORT";
    }

    // Robust net PnL parse from the exact line, ignoring percent and OCR symbols like '%'.
    const netLineText = lines.find((l) => /net\s*profit\s*&?\s*loss/i.test(l));
    if (netLineText) {
        const cleaned = netLineText.replace(/\s+/g, " ");
        const signMatch = cleaned.match(/[:\s]([+-])/);
        const amountCandidates = Array.from(cleaned.matchAll(/\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?/g))
            .map((m) => numFromText(m[0]))
            .filter((n): n is number => n !== null);
        // Prefer currency-like values, not percentages.
        const amount = amountCandidates.find((n) => n >= 100) ?? amountCandidates[0];
        if (amount != null) {
            result.PnLAmount = Math.abs(amount);
            result.PnLSign = signMatch?.[1] === "-" ? "LOSS" : "PROFIT";
        }
    }

    if (!result.PnLAmount) {
        const signed = raw.match(/([+-])\s*([\d,]+(?:\.\d+)?)/);
        if (signed) {
            const amount = numFromText(signed[2]);
            if (amount != null) {
                result.PnLAmount = Math.abs(amount);
                result.PnLSign = signed[1] === "-" ? "LOSS" : "PROFIT";
            }
        }
    }

    // Plausibility correction: if parsed PnL is too large, recompute from price/qty and charges.
    if (result.EntryPrice != null && result.ExitPrice != null && result.Quantity != null) {
        const e = Number(result.EntryPrice);
        const x = Number(result.ExitPrice);
        const q = Math.max(1, Number(result.Quantity));
        const lot = result.LotSize != null && result.LotSize !== "" ? Number(result.LotSize) : 1;
        const dir = result.PositionDuration || "SHORT";
        const gross = dir === "SHORT" ? (e - x) * q * lot : (x - e) * q * lot;
        const expectedNet = estCharges != null ? gross - estCharges : gross;
        const expectedAbs = Math.abs(Number(expectedNet.toFixed(2)));

        if (result.PnLAmount == null || !Number.isFinite(Number(result.PnLAmount)) || Number(result.PnLAmount) > expectedAbs * 2.2) {
            result.PnLAmount = expectedAbs;
            result.PnLSign = expectedNet < 0 ? "LOSS" : "PROFIT";
        }
    }

    if (result.EntryPrice != null && result.ExitPrice != null && !result.PnLSign) {
        const e = Number(result.EntryPrice);
        const x = Number(result.ExitPrice);
        result.PnLSign = x >= e ? "PROFIT" : "LOSS";
    }

    result.PositionDuration = result.PositionDuration || "SHORT";
    result.Segment = result.Segment || "OPTIONS";

    result._score = scoreParsed(result);
    return result;
}

async function preprocessForOcr(file: File): Promise<Blob[]> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(2.4, 2200 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = width;
    baseCanvas.height = height;
    const ctx = baseCanvas.getContext("2d");
    if (!ctx) return [file];

    ctx.drawImage(bitmap, 0, 0, width, height);

    const variants: Blob[] = [];

    const pushCanvasBlob = async (canvas: HTMLCanvasElement) => {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
        if (blob) variants.push(blob);
    };

    await pushCanvasBlob(baseCanvas);

    const contrasted = document.createElement("canvas");
    contrasted.width = width;
    contrasted.height = height;
    const cctx = contrasted.getContext("2d");
    if (cctx) {
        cctx.drawImage(baseCanvas, 0, 0);
        const img = cctx.getImageData(0, 0, width, height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const boosted = Math.max(0, Math.min(255, (gray - 128) * 1.55 + 128));
            d[i] = boosted;
            d[i + 1] = boosted;
            d[i + 2] = boosted;
        }
        cctx.putImageData(img, 0, 0);
        await pushCanvasBlob(contrasted);
    }

    const thresholded = document.createElement("canvas");
    thresholded.width = width;
    thresholded.height = height;
    const tctx = thresholded.getContext("2d");
    if (tctx) {
        tctx.drawImage(baseCanvas, 0, 0);
        const img = tctx.getImageData(0, 0, width, height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const v = gray > 120 ? 255 : 0;
            d[i] = v;
            d[i + 1] = v;
            d[i + 2] = v;
        }
        tctx.putImageData(img, 0, 0);
        await pushCanvasBlob(thresholded);
    }

    return variants.length ? variants : [file];
}

interface Props {
    onExtracted: (data: Partial<TradeFormData>) => void;
    onClose: () => void;
}

export default function OcrScanner({ onExtracted, onClose }: Props) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [rawText, setRawText] = useState("");
    const [extracted, setExtracted] = useState<Partial<TradeFormData> | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const surfaceBg = isApple ? (isDark ? "rgba(38,38,42,0.95)" : "rgba(255,255,255,0.95)") : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setStatus("error");
            return;
        }

        setStatus("loading");
        setProgress(0);
        setPreview(URL.createObjectURL(file));

        try {
            const variants = await preprocessForOcr(file);
            const { createWorker } = await import("tesseract.js");
            const worker = await createWorker("eng", 1, {
                logger: (m: any) => {
                    if (m.status === "recognizing text") {
                        setProgress(Math.round((m.progress ?? 0) * 100));
                    }
                }
            });

            await worker.setParameters({
                tessedit_pageseg_mode: 6 as any,
                preserve_interword_spaces: "1",
                tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:+-./()%, "
            });

            let bestParsed: ParsedResult = {};
            let bestRaw = "";

            for (const variant of variants) {
                const { data } = await worker.recognize(variant);
                const parsed = parseOcrText(data.text || "");

                if ((parsed._score || 0) > (bestParsed._score || 0)) {
                    bestParsed = parsed;
                    bestRaw = data.text || "";
                } else {
                    bestParsed = mergePreferNew(bestParsed, parsed);
                }
            }

            bestParsed = applyFinalPnlSanity(bestParsed);

            await worker.terminate();

            const { _ocrRaw, _score, ...clean } = bestParsed;
            setRawText(bestRaw || _ocrRaw || "");
            setExtracted(clean);
            setStatus("done");
            setProgress(100);
        } catch (error) {
            console.error("OCR error:", error);
            setStatus("error");
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const applyAndClose = () => {
        if (extracted) onExtracted(extracted);
        onClose();
    };

    const fieldCount = extracted ? Object.entries(extracted).filter(([, v]) => v !== "" && v != null).length : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)"
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}>
            <div
                className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                style={{
                    background: surfaceBg,
                    border: `1px solid ${borderColor}`
                }}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-xl"
                            style={{ background: `${palette.accent}18` }}>
                            <DocumentScanner style={{ color: palette.accent }} />
                        </div>
                        <div>
                            <h2
                                className="font-bold text-lg"
                                style={{ color: palette.textPrimary }}>
                                OCR Scan
                            </h2>
                            <p
                                className="text-xs"
                                style={{ color: palette.textSecondary }}>
                                Upload a trade screenshot. Optimized for dark broker summary + order logs.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg"
                        style={{ color: palette.textSecondary }}>
                        <Close />
                    </button>
                </div>

                {status === "idle" && (
                    <div
                        className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl cursor-pointer"
                        style={{
                            border: `2px dashed ${palette.accent}50`,
                            background: `${palette.accent}08`
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}>
                        <CloudUpload style={{ color: palette.accent, fontSize: 42 }} />
                        <p
                            className="font-semibold"
                            style={{ color: palette.textPrimary }}>
                            Drop screenshot here or click to browse
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: palette.textSecondary }}>
                            Uses enhanced preprocessing plus multi-pass OCR for better extraction.
                        </p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFile}
                        />
                    </div>
                )}

                {status === "loading" && (
                    <div className="space-y-4">
                        {preview && (
                            <img
                                src={preview}
                                alt="preview"
                                className="w-full rounded-xl max-h-48 object-contain"
                                style={{ border: `1px solid ${borderColor}` }}
                            />
                        )}
                        <p
                            className="text-sm font-medium text-center"
                            style={{ color: palette.textSecondary }}>
                            Enhancing + scanning image... {progress}%
                        </p>
                        <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ background: `${palette.accent}18` }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: palette.accent }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <Warning style={{ color: "#ef4444", fontSize: 36 }} />
                        <p style={{ color: "#ef4444" }}>Could not scan this image. Try a clearer full screenshot.</p>
                        <button
                            onClick={() => setStatus("idle")}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{
                                background: `${palette.accent}20`,
                                color: palette.accent
                            }}>
                            Try Again
                        </button>
                    </div>
                )}

                {status === "done" && extracted && (
                    <div className="space-y-4">
                        {preview && (
                            <img
                                src={preview}
                                alt="preview"
                                className="w-full rounded-xl max-h-40 object-contain"
                                style={{ border: `1px solid ${borderColor}` }}
                            />
                        )}

                        <div
                            className="p-4 rounded-xl"
                            style={{
                                background: isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.06)",
                                border: "1px solid rgba(34,197,94,0.20)"
                            }}>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle
                                    style={{ color: "#22c55e" }}
                                    fontSize="small"
                                />
                                <p
                                    className="font-semibold text-sm"
                                    style={{ color: "#22c55e" }}>
                                    Detected {fieldCount} field
                                    {fieldCount !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(Object.entries(extracted) as [string, any][])
                                    .filter(([, v]) => v !== "" && v != null)
                                    .map(([k, v]) => (
                                        <div
                                            key={k}
                                            className="text-xs flex items-center justify-between px-3 py-1.5 rounded-lg"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
                                            }}>
                                            <span
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {k}
                                            </span>
                                            <span
                                                className="font-semibold ml-1 truncate max-w-[90px]"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {String(v)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <details>
                            <summary
                                className="text-xs cursor-pointer"
                                style={{ color: palette.textTertiary }}>
                                View raw OCR text
                            </summary>
                            <pre
                                className="text-xs mt-2 p-3 rounded-xl overflow-auto max-h-36 whitespace-pre-wrap"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                    color: palette.textSecondary,
                                    border: `1px solid ${borderColor}`
                                }}>
                                {rawText}
                            </pre>
                        </details>

                        <div className="flex gap-3 pt-1">
                            <motion.button
                                onClick={applyAndClose}
                                className="flex-1 py-2.5 rounded-xl font-semibold"
                                style={{
                                    background: palette.accent,
                                    color: "#fff"
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}>
                                Apply to Form
                            </motion.button>
                            <button
                                onClick={() => {
                                    setStatus("idle");
                                    setPreview(null);
                                    setExtracted(null);
                                }}
                                className="px-4 py-2.5 rounded-xl font-semibold"
                                style={{
                                    background: `${palette.accent}20`,
                                    color: palette.accent
                                }}>
                                Scan Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
