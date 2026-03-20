/**
 * Shared Trade Form — used by both /new and /[id] pages.
 * Structured by trading workflow with draft-first behavior.
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCDNUpload, useDesignTheme, useTradeFormState } from "@Hooks";
import { CloudDone, DocumentScanner, InfoOutlined, Psychology, Save, TrendingUp, UploadFile } from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import OcrScanner from "./OcrScanner";

const mkOpts = (arr: string[], emptyLabel?: string) =>
    [...(emptyLabel !== undefined ? [{ value: "", label: emptyLabel }] : []), ...arr.map(v => ({ value: v, label: v.replace(/_/g, " ") }))];

const SEGMENT_OPTS = mkOpts(["OPTIONS", "EQUITY", "FUTURES", "CRYPTO", "FOREX", "COMMODITY"]);
const DURATION_OPTS = mkOpts(["SHORT", "LONG"]);
const OPTION_TYPE_OPTS = mkOpts(["CE", "PE"], "-");
const HIT_OPTS = mkOpts(["AUTO", "TARGET_ACHIEVED", "STOPLOSS_HIT", "NONE"]);

const SETUP_SUGGESTIONS = ["BREAKOUT", "REVERSAL", "PULLBACK", "MOMENTUM", "RANGE", "SCALP"];
const STRATEGY_SUGGESTIONS = ["EMA Crossover", "ORB", "VWAP Reclaim", "Break and Retest", "Range Fade"];
const MARKET_SUGGESTIONS = ["TRENDING_UP", "TRENDING_DOWN", "SIDEWAYS", "VOLATILE", "CONSOLIDATION"];
const EMOTION_SUGGESTIONS = ["CALM", "CONFIDENT", "DISCIPLINED", "ANXIOUS", "FOMO", "REVENGE"];
const MISTAKE_SUGGESTIONS = ["NONE", "EARLY_EXIT", "LATE_ENTRY", "NO_STOP_LOSS", "OVERTRADING", "IGNORED_PLAN"];

interface ChargesDetail {
    brokerage:        number; // ₹20 buy + ₹20 sell (flat per order)
    stt:              number; // Securities Transaction Tax
    stampDuty:        number; // State stamp duty on buy side
    exchangeTurnover: number; // NSE / BSE / MCX / MCX-SX transaction charges
    sebiTurnover:     number; // SEBI regulatory fee (₹10 per crore)
    gst:              number; // GST on brokerage + exchange + SEBI (18% Indian / 30% Forex & Crypto)
    taxes:            number; // stt + stampDuty + exchangeTurnover + sebiTurnover + gst
    total:            number; // brokerage + taxes
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const t2 = (n: number) => Math.trunc(n * 100) / 100;

function estimateCharges(
    segment: string,
    entryPrice: number,
    exitPrice: number,
    qty: number,
    direction: string,
): ChargesDetail {
    const entryValue = entryPrice * qty;
    const exitValue  = exitPrice  * qty;
    const isShort    = String(direction || "SHORT").toUpperCase() === "SHORT";
    const buyValue   = isShort ? exitValue : entryValue;
    const sellValue  = isShort ? entryValue : exitValue;
    const turnover  = buyValue + sellValue;
    const seg       = segment.toUpperCase();

    // Brokerage: flat ₹20/order, ₹40 round-trip (except EQUITY where it's % capped at ₹20/order)
    let brokerage        = 40;
    let stt              = 0;
    let stampDuty        = 0;
    let exchangeTurnover = 0;
    let sebiTurnover     = r2(turnover * 0.000001); // ₹10 per crore for all regulated segments
    // GST applied on brokerage + exchange + SEBI charges
    // 18% for all Indian-regulated instruments; 30% flat for Forex & Crypto
    // (Forex/Crypto are treated as 30% per business requirement — reflects the
    //  higher effective tax burden outside the standard STT/stamp-duty framework)
    const gstRate        = (seg === "FOREX" || seg === "CRYPTO") ? 0.30 : 0.18;

    if (seg === "OPTIONS") {
        // STT: 0.1% on sell-side premium (intraday options)
        stt              = r2(sellValue * 0.001);
        // Stamp duty: 0.003% on buy side
        stampDuty        = r2(buyValue  * 0.00003);
        // Exchange transaction: 0.035031% of total turnover (NSE F&O effective)
        exchangeTurnover = r2(turnover  * 0.00035031);
    } else if (seg === "FUTURES") {
        // STT: 0.01% on sell side
        stt              = r2(sellValue * 0.0001);
        // Stamp duty: 0.002% on buy side
        stampDuty        = r2(buyValue  * 0.00002);
        // Exchange transaction: 0.002% (NSE Futures)
        exchangeTurnover = r2(turnover  * 0.00002);
    } else if (seg === "EQUITY") {
        // Brokerage: min(0.03%, ₹20) per order
        brokerage        = r2(Math.min(buyValue * 0.0003, 20) + Math.min(sellValue * 0.0003, 20));
        // STT: 0.025% on sell side (intraday)
        stt              = r2(sellValue * 0.00025);
        // Stamp duty: 0.003% on buy side
        stampDuty        = r2(buyValue  * 0.00003);
        // Exchange transaction: 0.00345% (NSE Equity)
        exchangeTurnover = r2(turnover  * 0.0000345);
    } else if (seg === "COMMODITY") {
        // STT: 0.01% on sell side (non-agricultural futures, MCX)
        stt              = r2(sellValue * 0.0001);
        // Stamp duty: 0.002% on buy side
        stampDuty        = r2(buyValue  * 0.00002);
        // Exchange transaction: 0.0021% (MCX)
        exchangeTurnover = r2(turnover  * 0.000021);
    } else if (seg === "FOREX") {
        // No STT on currency derivatives
        stt              = 0;
        // Stamp duty: 0.0001% on buy side
        stampDuty        = r2(buyValue  * 0.000001);
        // Exchange transaction: 0.00045% (NSE Currency)
        exchangeTurnover = r2(turnover  * 0.0000045);
        // SEBI charges apply on currency too
    } else if (seg === "CRYPTO") {
        // Crypto is unregulated in India — no STT, no stamp duty, no SEBI
        stt              = 0;
        stampDuty        = 0;
        sebiTurnover     = 0;
        // Platform/exchange fee: ~0.1% per side (typical Indian exchange)
        exchangeTurnover = r2(turnover  * 0.001);
    }

    // GST = 18% (or 30%) on brokerage + exchange charges + SEBI charges
    // Broker UI commonly truncates GST to 2 decimals instead of half-up rounding.
    const gst    = t2((brokerage + exchangeTurnover + sebiTurnover) * gstRate);
    const taxes  = r2(stt + stampDuty + exchangeTurnover + sebiTurnover + gst);
    const total  = r2(brokerage + taxes);

    return { brokerage, stt, stampDuty, exchangeTurnover, sebiTurnover, gst, taxes, total };
}

export interface TradeFormData {
    Date: string;
    EntryTime: string;
    ExitTime?: string;
    InstrumentName: string;
    Instrument?: string;
    Segment: string;
    PositionDuration: string;
    Direction?: string;
    OptionType?: string;
    Strike?: number | string;
    Expiry?: string;
    EntryPrice: number | string;
    ExitPrice?: number | string;
    StopLoss?: number | string;
    Target?: number | string;
    Quantity?: number | string;
    LotSize?: number | string;
    Brokerage?: number | string;
    Taxes?: number | string;
    IsHit?: string;
    PnLAmount?: number | string;
    PnLSign?: string;
    SetupType?: string;
    StrategyName?: string;
    MarketCondition?: string;
    EmotionalState?: string;
    MistakeType?: string;
    Notes?: string;
    Tags?: string;
    AttachmentLinks?: string;
    ScreenshotCdnUrls?: string[];
    DraftID?: string;
}

interface Props {
    initialData?: Partial<TradeFormData>;
    onSubmit: (data: TradeFormData) => Promise<void>;
    submitting: boolean;
    isEdit?: boolean;
    enableBackendDraft?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "inherit", opacity: 0.65 }}>{label}</label>
            {children}
        </div>
    );
}

function normalizeAmPm(value: string): string {
    const upper = value.trim().toUpperCase().replace(/\s+/g, " ");
    const m = upper.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (!m) return value.toUpperCase();
    const hh = String(Math.min(12, Math.max(1, Number(m[1])))).padStart(2, "0");
    return `${hh}:${m[2]} ${m[3]}`;
}

function isAmPmTime(value: string): boolean {
    return /^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(value.trim());
}

export default function TradeForm({ initialData, onSubmit, submitting, isEdit, enableBackendDraft = false }: Props) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const surfaceBg = isApple
        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const inputStyle: React.CSSProperties = useMemo(() => ({
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: "8px 12px",
        color: palette.textPrimary,
        fontSize: 14,
        outline: "none",
        width: "100%",
    }), [isDark, borderColor, palette.textPrimary]);

    const [showOcr, setShowOcr] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [instrumentSuggestions, setInstrumentSuggestions] = useState<string[]>([]);
    const [directionTouched, setDirectionTouched] = useState(
        Boolean(initialData?.PositionDuration || initialData?.Direction)
    );

    const { upload, uploading } = useCDNUpload();
    const { form, setField, mergeForm, hasDraft, clearDraft, draftSaving } = useTradeFormState(initialData, {
        enableBackendDraft,
        enableLocalDraft: !isEdit,
    });

    useEffect(() => {
        fetch("/api/trade-journal/instruments")
            .then(r => r.json())
            .then(j => { if (j.success) setInstrumentSuggestions(j.data); })
            .catch(() => {});
    }, []);

    const inferredDirection = useMemo(() => {
        const entry = Number(form.EntryPrice);
        const exit = Number(form.ExitPrice);
        const sl = Number(form.StopLoss);
        const tgt = Number(form.Target);

        if (Number.isFinite(entry) && Number.isFinite(tgt) && Number.isFinite(sl)) {
            if (tgt > entry && sl < entry) return "LONG";
            if (tgt < entry && sl > entry) return "SHORT";
        }

        if (Number.isFinite(entry) && Number.isFinite(exit)) {
            if (exit > entry) return "LONG";
            if (exit < entry) return "SHORT";
        }

        return "SHORT";
    }, [form.EntryPrice, form.ExitPrice, form.StopLoss, form.Target]);

    const selectedDirection = String(form.PositionDuration || form.Direction || "SHORT").toUpperCase();
    const effectiveDirection = directionTouched
        ? (selectedDirection === "LONG" ? "LONG" : "SHORT")
        : inferredDirection;

    const instrumentPreview = useMemo(() => {
        const parts = [String(form.InstrumentName || "").trim().toUpperCase()];
        if (form.Strike) parts.push(String(form.Strike));
        if (form.OptionType) parts.push(String(form.OptionType).toUpperCase());
        if (form.Expiry) parts.push(String(form.Expiry));
        return parts.filter(Boolean).join(" ");
    }, [form.InstrumentName, form.Strike, form.OptionType, form.Expiry]);

    const calculatedHit = useMemo(() => {
        const exit = Number(form.ExitPrice);
        const sl = Number(form.StopLoss);
        const tgt = Number(form.Target);
        if (!Number.isFinite(exit)) return "NONE";

        if (Number.isFinite(tgt)) {
            const hitTarget = effectiveDirection === "SHORT" ? exit <= tgt : exit >= tgt;
            if (hitTarget) return "TARGET_ACHIEVED";
        }
        if (Number.isFinite(sl)) {
            const hitStop = effectiveDirection === "SHORT" ? exit >= sl : exit <= sl;
            if (hitStop) return "STOPLOSS_HIT";
        }

        return "NONE";
    }, [effectiveDirection, form.ExitPrice, form.StopLoss, form.Target]);

    const calculatedPnl = useMemo(() => {
        const entry = Number(form.EntryPrice);
        const exit = Number(form.ExitPrice);
        const qty = Number(form.Quantity || 0);
        const lot = Number(form.LotSize || 1);

        const effectiveQty = Number.isFinite(qty) && qty > 0
            ? (Number.isFinite(lot) && lot > 1 ? Math.floor(qty / lot) * lot : qty)
            : 0;

        if (!Number.isFinite(entry) || !Number.isFinite(exit) || effectiveQty <= 0) {
            return { amount: "", sign: "PROFIT" };
        }

        const raw = effectiveDirection === "SHORT"
            ? (entry - exit) * effectiveQty
            : (exit - entry) * effectiveQty;

        return { amount: Math.abs(Number(raw.toFixed(2))), sign: raw >= 0 ? "PROFIT" : "LOSS" };
    }, [effectiveDirection, form.EntryPrice, form.ExitPrice, form.Quantity, form.LotSize]);

    const effectiveQuantity = useMemo(() => {
        const qty = Number(form.Quantity || 0);
        const lot = Number(form.LotSize || 1);
        if (!Number.isFinite(qty) || qty <= 0) return 0;
        if (Number.isFinite(lot) && lot > 1) {
            const normalized = Math.floor(qty / lot) * lot;
            return normalized > 0 ? normalized : qty;
        }
        return qty;
    }, [form.Quantity, form.LotSize]);

    const calculatedCharges = useMemo((): ChargesDetail => {
        const entry = Number(form.EntryPrice);
        const exit  = Number(form.ExitPrice);
        if (!Number.isFinite(entry) || !Number.isFinite(exit) || effectiveQuantity <= 0) {
            return { brokerage: 0, stt: 0, stampDuty: 0, exchangeTurnover: 0, sebiTurnover: 0, gst: 0, taxes: 0, total: 0 };
        }
        return estimateCharges(form.Segment || "OPTIONS", entry, exit, effectiveQuantity, effectiveDirection);
    }, [effectiveDirection, effectiveQuantity, form.EntryPrice, form.ExitPrice, form.Segment]);

    const marginUsed = useMemo(() => {
        const entry = Number(form.EntryPrice);
        const exit = Number(form.ExitPrice);
        if (effectiveQuantity <= 0) return null;

        // For options premium-style accounting, capital outflow is buy-side premium.
        const buySidePrice = effectiveDirection === "SHORT"
            ? (Number.isFinite(exit) ? exit : entry)
            : entry;

        if (!Number.isFinite(buySidePrice)) return null;
        return r2(buySidePrice * effectiveQuantity);
    }, [effectiveDirection, effectiveQuantity, form.EntryPrice, form.ExitPrice]);

    const netPnlAfterCharges = useMemo(() => {
        if (calculatedPnl.amount === "") return null;
        const gross  = Number(calculatedPnl.amount);
        const sign   = calculatedPnl.sign === "LOSS" ? -1 : 1;
        const brok   = calculatedCharges.brokerage;
        const taxAmt = calculatedCharges.taxes;
        return parseFloat(((sign * gross) - brok - taxAmt).toFixed(2));
    }, [calculatedPnl, calculatedCharges]);

    const netPnlPercentage = useMemo(() => {
        if (netPnlAfterCharges == null || marginUsed == null || marginUsed <= 0) return null;
        return r2((netPnlAfterCharges / marginUsed) * 100);
    }, [marginUsed, netPnlAfterCharges]);

    function applyOcr(extracted: Partial<TradeFormData>) {
        const next: Partial<TradeFormData> = { ...extracted };

        if (!next.InstrumentName && (extracted as any).Instrument) {
            next.InstrumentName = String((extracted as any).Instrument);
        }
        if (!next.PositionDuration && (extracted as any).Direction) {
            next.PositionDuration = String((extracted as any).Direction);
        }

        for (const [k, v] of Object.entries(extracted)) {
            if (v !== "" && v != null) (next as any)[k as keyof TradeFormData] = v;
        }

        mergeForm(next);
    }

    async function handleAttachmentUpload(files: FileList | null) {
        if (!files?.length) return;
        setUploadError("");

        const uploaded: string[] = [];
        try {
            for (const file of Array.from(files)) {
                const result = await upload(file, {
                    type: "banner",
                    context: "trade-journal:new",
                    tags: ["trade", "journal", "screenshot"],
                    altText: `Trade attachment ${file.name}`,
                });
                uploaded.push(result.cdnUrl);
            }

            const existing = Array.isArray(form.ScreenshotCdnUrls) ? form.ScreenshotCdnUrls : [];
            setField("ScreenshotCdnUrls", [...existing, ...uploaded]);

            const links = [
                ...(form.AttachmentLinks?.split(",").map((s: string) => s.trim()).filter(Boolean) || []),
                ...uploaded,
            ];
            setField("AttachmentLinks", links.join(", "));
        } catch (error: any) {
            setUploadError(error?.message || "Failed to upload attachment.");
        }
    }

    const sectionCard = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
        <motion.div
            className="p-5 rounded-2xl mb-4"
            style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-2 mb-4">
                <span style={{ color: palette.accent }}>{icon}</span>
                <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: palette.textPrimary }}>
                    {title}
                </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ color: palette.textPrimary }}>
                {content}
            </div>
        </motion.div>
    );

    return (
        <>
            <AnimatePresence>
                {showOcr && (
                    <OcrScanner onExtracted={applyOcr} onClose={() => setShowOcr(false)} />
                )}
            </AnimatePresence>

            <form
                onSubmit={async e => {
                    e.preventDefault();
                    if (!isAmPmTime(form.EntryTime)) return;
                    if (form.ExitTime && !isAmPmTime(form.ExitTime)) return;

                    const nextForm: TradeFormData = {
                        ...form,
                        Quantity: effectiveQuantity > 0 ? effectiveQuantity : form.Quantity,
                        Instrument: instrumentPreview || form.InstrumentName,
                        PositionDuration: effectiveDirection,
                        Direction: effectiveDirection,
                        IsHit: form.IsHit === "AUTO" || !form.IsHit ? calculatedHit : form.IsHit,
                        PnLAmount: calculatedPnl.amount === "" ? undefined : calculatedPnl.amount,
                        PnLSign: calculatedPnl.sign,
                        Brokerage: calculatedCharges.brokerage,
                        Taxes: calculatedCharges.taxes,
                    };
                    await onSubmit(nextForm);
                }}
            >
                <motion.div
                    className="flex items-center gap-2 mb-4 p-4 rounded-2xl cursor-pointer w-fit"
                    style={{ background: `${palette.accent}12`, border: `1.5px dashed ${palette.accent}50` }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowOcr(true)}
                >
                    <DocumentScanner style={{ color: palette.accent, fontSize: 20 }} />
                    <span className="text-sm font-semibold" style={{ color: palette.accent }}>
                        Auto-fill from Screenshot (OCR)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${palette.accent}22`, color: palette.accent }}>
                        Client-side · No upload
                    </span>
                </motion.div>

                {hasDraft && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between gap-2 mb-4 p-3 rounded-xl text-xs"
                        style={{ background: `${palette.accent}15`, color: palette.accent }}
                    >
                        <div className="flex items-center gap-2">
                            <CloudDone fontSize="small" />
                            <span>{draftSaving ? "Saving draft..." : "Draft auto-saved"}</span>
                        </div>
                        <button
                            type="button"
                            onClick={clearDraft}
                            className="px-2 py-1 rounded-md"
                            style={{ background: `${palette.accent}20`, color: palette.accent }}
                        >
                            Clear Draft
                        </button>
                    </motion.div>
                )}

                {sectionCard("Timing & Instrument", <InfoOutlined />, <>
                    <Field label="Date *">
                        <input type="date" style={inputStyle} value={form.Date} onChange={e => setField("Date", e.target.value)} required />
                    </Field>
                    <Field label="Entry Time (AM/PM) *">
                        <input
                            type="text"
                            style={inputStyle}
                            value={form.EntryTime}
                            placeholder="09:15 AM"
                            inputMode="text"
                            title="Use format HH:MM AM/PM (e.g. 09:15 AM)"
                            onBlur={e => setField("EntryTime", normalizeAmPm(e.target.value))}
                            onChange={e => setField("EntryTime", e.target.value.toUpperCase())}
                            required
                        />
                    </Field>
                    <Field label="Exit Time (AM/PM)">
                        <input
                            type="text"
                            style={inputStyle}
                            value={form.ExitTime ?? ""}
                            placeholder="03:20 PM"
                            inputMode="text"
                            title="Use format HH:MM AM/PM (e.g. 03:20 PM)"
                            onBlur={e => setField("ExitTime", normalizeAmPm(e.target.value))}
                            onChange={e => setField("ExitTime", e.target.value.toUpperCase())}
                        />
                    </Field>
                    <Field label="Instrument Name *">
                        <input list="instrument-suggestions" type="text" style={inputStyle} placeholder="e.g. NIFTY" value={String(form.InstrumentName)} onChange={e => setField("InstrumentName", e.target.value.toUpperCase())} required />
                        <datalist id="instrument-suggestions">{instrumentSuggestions.map(v => <option key={v} value={v} />)}</datalist>
                    </Field>
                    <Field label="Segment *">
                        <CustomSelect value={form.Segment} onChange={v => setField("Segment", v)} options={SEGMENT_OPTS} />
                    </Field>
                    <Field label="Position Duration *">
                        <CustomSelect value={effectiveDirection} onChange={v => { setDirectionTouched(true); setField("PositionDuration", v); }} options={DURATION_OPTS} />
                    </Field>
                    <Field label="Option Type">
                        <CustomSelect value={form.OptionType ?? ""} onChange={v => setField("OptionType", v)} options={OPTION_TYPE_OPTS} />
                    </Field>
                    <Field label="Strike Price">
                        <input type="number" style={inputStyle} placeholder="e.g. 24000" value={String(form.Strike ?? "")} onChange={e => setField("Strike", e.target.value)} />
                    </Field>
                    <Field label="Expiry">
                        <input type="date" style={inputStyle} value={form.Expiry ?? ""} onChange={e => setField("Expiry", e.target.value)} />
                    </Field>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Field label="Composed Instrument Preview">
                            <input type="text" style={{ ...inputStyle, opacity: 0.75 }} value={instrumentPreview} readOnly />
                        </Field>
                    </div>
                </>)}

                {sectionCard("Position & Outcome", <TrendingUp />, <>
                    <Field label="Entry Price *">
                        <input type="number" step="0.01" style={inputStyle} value={String(form.EntryPrice)} onChange={e => setField("EntryPrice", e.target.value)} required />
                    </Field>
                    <Field label="Exit Price *">
                        <input type="number" step="0.01" style={inputStyle} value={String(form.ExitPrice ?? "")} onChange={e => setField("ExitPrice", e.target.value)} required />
                    </Field>
                    <Field label="Stop Loss">
                        <input type="number" step="0.01" style={inputStyle} value={String(form.StopLoss ?? "")} onChange={e => setField("StopLoss", e.target.value)} />
                    </Field>
                    <Field label="Target">
                        <input type="number" step="0.01" style={inputStyle} value={String(form.Target ?? "")} onChange={e => setField("Target", e.target.value)} />
                    </Field>
                    <Field label="Quantity">
                        <input type="number" step="1" style={inputStyle} value={String(form.Quantity ?? "")} onChange={e => setField("Quantity", e.target.value)} />
                    </Field>
                    <Field label="Lot Size">
                        <input type="number" step="1" style={inputStyle} value={String(form.LotSize ?? "")} onChange={e => setField("LotSize", e.target.value)} />
                    </Field>
                    <Field label="Hit Status">
                        <CustomSelect value={form.IsHit ?? "AUTO"} onChange={v => setField("IsHit", v)} options={HIT_OPTS} />
                    </Field>
                    <Field label="Detected Hit (read-only)">
                        <input type="text" style={{ ...inputStyle, opacity: 0.75 }} value={calculatedHit} readOnly />
                    </Field>
                    <Field label="P&L Sign (auto)">
                        <input type="text" style={{ ...inputStyle, opacity: 0.75 }} value={calculatedPnl.sign} readOnly />
                    </Field>
                    <Field label="Gross P&L Amount (auto)">
                        <input type="text" style={{ ...inputStyle, opacity: 0.75 }} value={calculatedPnl.amount === "" ? "-" : String(calculatedPnl.amount)} readOnly />
                    </Field>

                    {/* ── Charges breakdown ─────────────────────────────── */}
                    <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: palette.textTertiary }}>
                            Charges Breakdown
                            {calculatedCharges.total > 0 && (
                                <span className="ml-2 font-bold text-sm normal-case tracking-normal" style={{ color: "#ef4444" }}>
                                    Total: ₹{calculatedCharges.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </p>
                        {(() => {
                            const isHighGstSegment = ["FOREX", "CRYPTO"].includes((form.Segment || "OPTIONS").toUpperCase());
                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                    {([
                                        { label: "Brokerage",          hint: "₹20 buy + ₹20 sell",          value: calculatedCharges.brokerage },
                                        { label: "STT",                hint: "Securities Transaction Tax",   value: calculatedCharges.stt },
                                        { label: "Stamp Duty",         hint: "On buy-side notional",         value: calculatedCharges.stampDuty },
                                        { label: "Exchange Turnover",  hint: "NSE / MCX fees",               value: calculatedCharges.exchangeTurnover },
                                        { label: "SEBI Turnover",      hint: "₹10 per crore",                value: calculatedCharges.sebiTurnover },
                                        { label: `GST (${isHighGstSegment ? "30%" : "18%"})`,
                                          hint: "On brokerage + exchange + SEBI",                            value: calculatedCharges.gst },
                                    ] as const).map(({ label, hint, value }) => (
                                        <div key={label} className="p-2 rounded-xl flex flex-col gap-0.5"
                                            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${borderColor}` }}>
                                            <span className="text-xs font-medium leading-tight" style={{ color: palette.textTertiary }} title={hint}>{label}</span>
                                            <span className="text-sm font-bold tabular-nums" style={{ color: value > 0 ? "#ef4444" : palette.textSecondary }}>
                                                ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    <Field label="Brokerage (auto)">
                        <input type="text" style={{ ...inputStyle, opacity: 0.75 }}
                            value={`₹${calculatedCharges.brokerage.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                            readOnly />
                    </Field>
                    <Field label="Taxes (auto, excl. brokerage)">
                        <input type="text" style={{ ...inputStyle, opacity: 0.75 }}
                            value={`₹${calculatedCharges.taxes.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                            readOnly />
                    </Field>
                    <Field label="Total Charges (auto)">
                        <input type="text" style={{ ...inputStyle, opacity: 0.75, fontWeight: 700 }}
                            value={`₹${calculatedCharges.total.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                            readOnly />
                    </Field>

                    {marginUsed !== null && (
                        <Field label="Margin Used (Entry Price × Quantity)">
                            <input type="text" style={{ ...inputStyle, opacity: 0.75 }}
                                value={`₹${marginUsed.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                                readOnly />
                        </Field>
                    )}

                    {/* Net P&L after all charges */}
                    {netPnlAfterCharges !== null && (
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Field label="Net P&L after All Charges (read-only)">
                                <input type="text" style={{ ...inputStyle, opacity: 0.85, fontWeight: 700,
                                    color: netPnlAfterCharges >= 0 ? "#22c55e" : "#ef4444" }}
                                    value={`${netPnlAfterCharges >= 0 ? "+" : ""}₹${Math.abs(netPnlAfterCharges).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${netPnlPercentage != null ? ` (${netPnlPercentage >= 0 ? "+" : ""}${netPnlPercentage.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%)` : ""}`}
                                    readOnly />
                            </Field>
                        </div>
                    )}
                </>)}

                {sectionCard("Setup & Psychology", <Psychology />, <>
                    <Field label="Setup Type">
                        <input list="setup-suggestions" type="text" style={inputStyle} value={form.SetupType ?? ""} onChange={e => setField("SetupType", e.target.value.toUpperCase())} />
                        <datalist id="setup-suggestions">{SETUP_SUGGESTIONS.map(v => <option key={v} value={v} />)}</datalist>
                    </Field>
                    <Field label="Strategy Name">
                        <input list="strategy-suggestions" type="text" style={inputStyle} value={form.StrategyName ?? ""} onChange={e => setField("StrategyName", e.target.value)} />
                        <datalist id="strategy-suggestions">{STRATEGY_SUGGESTIONS.map(v => <option key={v} value={v} />)}</datalist>
                    </Field>
                    <Field label="Market Condition">
                        <input list="market-suggestions" type="text" style={inputStyle} value={form.MarketCondition ?? ""} onChange={e => setField("MarketCondition", e.target.value.toUpperCase())} />
                        <datalist id="market-suggestions">{MARKET_SUGGESTIONS.map(v => <option key={v} value={v} />)}</datalist>
                    </Field>
                    <Field label="Emotional State">
                        <input list="emotion-suggestions" type="text" style={inputStyle} value={form.EmotionalState ?? ""} onChange={e => setField("EmotionalState", e.target.value.toUpperCase())} />
                        <datalist id="emotion-suggestions">{EMOTION_SUGGESTIONS.map(v => <option key={v} value={v} />)}</datalist>
                    </Field>
                    <Field label="Mistake Type">
                        <input list="mistake-suggestions" type="text" style={inputStyle} value={form.MistakeType ?? ""} onChange={e => setField("MistakeType", e.target.value.toUpperCase())} />
                        <datalist id="mistake-suggestions">{MISTAKE_SUGGESTIONS.map(v => <option key={v} value={v} />)}</datalist>
                    </Field>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Field label="Notes">
                            <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.Notes ?? ""} onChange={e => setField("Notes", e.target.value)} />
                        </Field>
                    </div>
                    <Field label="Tags (comma-separated)">
                        <input type="text" style={inputStyle} value={form.Tags ?? ""} onChange={e => setField("Tags", e.target.value)} />
                    </Field>
                    <Field label="Attachment Links (comma-separated)">
                        <input type="text" style={inputStyle} value={form.AttachmentLinks ?? ""} onChange={e => setField("AttachmentLinks", e.target.value)} />
                    </Field>
                    <div>
                        <Field label="Upload Screenshot to CDN">
                            <label className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
                                style={{ border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                <UploadFile fontSize="small" style={{ color: palette.accent }} />
                                <span className="text-xs" style={{ color: palette.textSecondary }}>{uploading ? "Uploading..." : "Select file(s)"}</span>
                                <input type="file" className="hidden" multiple accept="image/*" onChange={e => handleAttachmentUpload(e.target.files)} />
                            </label>
                        </Field>
                        {uploadError && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{uploadError}</p>}
                    </div>
                    {!!form.ScreenshotCdnUrls?.length && (
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Field label="Uploaded CDN URLs">
                                <div className="flex flex-wrap gap-2">
                                    {form.ScreenshotCdnUrls.map((url: string, idx: number) => (
                                        <span key={`${url}-${idx}`} className="text-xs px-2 py-1 rounded-md" style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                            {url}
                                        </span>
                                    ))}
                                </div>
                            </Field>
                        </div>
                    )}
                </>)}

                <motion.button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold mt-2"
                    style={{ background: palette.accent, color: "#fff", opacity: submitting ? 0.6 : 1 }}
                    whileHover={{ scale: submitting ? 1 : 1.03 }}
                    whileTap={{ scale: submitting ? 1 : 0.97 }}
                >
                    <Save fontSize="small" />
                    {submitting ? "Saving..." : isEdit ? "Update Trade" : "Log Trade"}
                </motion.button>
            </form>
        </>
    );
}
