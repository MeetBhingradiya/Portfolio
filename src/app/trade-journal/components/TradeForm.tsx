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

const parseOptionalNumber = (value: string): number | null => {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
};

function toInputDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getNextWeekExpiryDate(targetWeekday: number): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = today.getDay();
    const daysUntilNextMonday = day === 1 ? 7 : (8 - day) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (daysUntilNextMonday || 7));
    const offsetFromMonday = (targetWeekday + 6) % 7;
    const expiry = new Date(nextMonday);
    expiry.setDate(nextMonday.getDate() + offsetFromMonday);
    return toInputDate(expiry);
}

function getInstrumentDefaultExpiry(instrumentName: string): string | null {
    const key = instrumentName.replace(/\s+/g, "").toUpperCase();
    if (key === "NIFTY") return getNextWeekExpiryDate(1); // Thursday
    if (key === "BANKNIFTY") return getNextWeekExpiryDate(2); // Wednesday
    return null;
}

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

function isAmPmTime(value: string): boolean {
    return /^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(value.trim());
}

function normalizeAmPm(value: string): string {
    const upper = value.trim().toUpperCase().replace(/\s+/g, " ");
    const m = upper.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (!m) return upper;
    const hh = String(Math.min(12, Math.max(1, Number(m[1])))).padStart(2, "0");
    return `${hh}:${m[2]} ${m[3]}`;
}

function splitAmPm(value?: string): { hour: string; minute: string; meridiem: string } {
    const m = normalizeAmPm(String(value || "")).match(/^(\d{2}):(\d{2})\s(AM|PM)$/);
    return {
        hour: m?.[1] || "",
        minute: m?.[2] || "",
        meridiem: m?.[3] || "",
    };
}

function composeAmPm(parts: { hour: string; minute: string; meridiem: string }): string {
    if (!parts.hour || !parts.minute || !parts.meridiem) return "";
    return `${parts.hour}:${parts.minute} ${parts.meridiem}`;
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, idx) => String(idx + 1).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, idx) => String(idx).padStart(2, "0"));

function TimePickerAmPm({
    value,
    onChange,
    required,
    inputStyle,
}: {
    value?: string;
    onChange: (value: string) => void;
    required?: boolean;
    inputStyle: React.CSSProperties;
}) {
    const parts = splitAmPm(value);

    const updatePart = (part: "hour" | "minute" | "meridiem", next: string) => {
        onChange(composeAmPm({ ...parts, [part]: next }));
    };

    return (
        <div className="grid grid-cols-3 gap-2">
            <select style={inputStyle} value={parts.hour} onChange={e => updatePart("hour", e.target.value)} required={required}>
                <option value="">HH</option>
                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <select style={inputStyle} value={parts.minute} onChange={e => updatePart("minute", e.target.value)} required={required}>
                <option value="">MM</option>
                {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select style={inputStyle} value={parts.meridiem} onChange={e => updatePart("meridiem", e.target.value)} required={required}>
                <option value="">AM/PM</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
}

function toAmPmFromDate(date: Date): string {
    const hh = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, "0");
    const meridiem = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${String(h12).padStart(2, "0")}:${mm} ${meridiem}`;
}

function nowAmPm(): string {
    return toAmPmFromDate(new Date());
}

function roundedToFiveAmPm(): string {
    const rounded = new Date();
    const next = Math.ceil(rounded.getMinutes() / 5) * 5;
    rounded.setMinutes(next, 0, 0);
    return toAmPmFromDate(rounded);
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
    const [expiryTouched, setExpiryTouched] = useState(Boolean(initialData?.Expiry));
    const [overrideBrokerage, setOverrideBrokerage] = useState("");
    const [overrideGst, setOverrideGst] = useState("");
    const [overrideChargesTotal, setOverrideChargesTotal] = useState("");
    const [overrideMarginUsed, setOverrideMarginUsed] = useState("");
    const [overrideNetPnl, setOverrideNetPnl] = useState("");

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

    useEffect(() => {
        if (isEdit || expiryTouched) return;
        const defaultExpiry = getInstrumentDefaultExpiry(String(form.InstrumentName || ""));
        if (!defaultExpiry) return;
        if (form.Expiry !== defaultExpiry) {
            setField("Expiry", defaultExpiry);
        }
    }, [expiryTouched, form.Expiry, form.InstrumentName, isEdit, setField]);

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
        if (effectiveQuantity <= 0) return null;
        if (!Number.isFinite(entry)) return null;
        return r2(entry * effectiveQuantity);
    }, [effectiveQuantity, form.EntryPrice]);

    const defaultExpirySuggestion = useMemo(
        () => getInstrumentDefaultExpiry(String(form.InstrumentName || "")),
        [form.InstrumentName],
    );

    const overrideBrokerageValue = useMemo(() => parseOptionalNumber(overrideBrokerage), [overrideBrokerage]);
    const overrideGstValue = useMemo(() => parseOptionalNumber(overrideGst), [overrideGst]);
    const overrideChargesTotalValue = useMemo(() => parseOptionalNumber(overrideChargesTotal), [overrideChargesTotal]);
    const overrideMarginUsedValue = useMemo(() => parseOptionalNumber(overrideMarginUsed), [overrideMarginUsed]);
    const overrideNetPnlValue = useMemo(() => parseOptionalNumber(overrideNetPnl), [overrideNetPnl]);

    const effectiveBrokerage = overrideBrokerageValue ?? calculatedCharges.brokerage;
    const effectiveGst = overrideGstValue ?? calculatedCharges.gst;
    const effectiveTaxes = useMemo(
        () => r2(calculatedCharges.stt + calculatedCharges.stampDuty + calculatedCharges.exchangeTurnover + calculatedCharges.sebiTurnover + effectiveGst),
        [calculatedCharges.exchangeTurnover, calculatedCharges.sebiTurnover, calculatedCharges.stampDuty, calculatedCharges.stt, effectiveGst],
    );
    const autoTotalCharges = useMemo(() => r2(effectiveBrokerage + effectiveTaxes), [effectiveBrokerage, effectiveTaxes]);
    const effectiveTotalCharges = overrideChargesTotalValue ?? autoTotalCharges;
    const effectiveMarginUsed = overrideMarginUsedValue ?? marginUsed;

    const autoNetPnlAfterCharges = useMemo(() => {
        if (calculatedPnl.amount === "") return null;
        const gross = Number(calculatedPnl.amount);
        const sign = calculatedPnl.sign === "LOSS" ? -1 : 1;
        return r2((sign * gross) - effectiveTotalCharges);
    }, [calculatedPnl.amount, calculatedPnl.sign, effectiveTotalCharges]);

    const effectiveNetPnlAfterCharges = overrideNetPnlValue ?? autoNetPnlAfterCharges;

    const netPnlPercentage = useMemo(() => {
        if (effectiveNetPnlAfterCharges == null || effectiveMarginUsed == null || effectiveMarginUsed <= 0) return null;
        return r2((effectiveNetPnlAfterCharges / effectiveMarginUsed) * 100);
    }, [effectiveMarginUsed, effectiveNetPnlAfterCharges]);

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
                        PnLAmount: effectiveNetPnlAfterCharges == null
                            ? (calculatedPnl.amount === "" ? undefined : calculatedPnl.amount)
                            : Math.abs(effectiveNetPnlAfterCharges),
                        PnLSign: effectiveNetPnlAfterCharges == null
                            ? calculatedPnl.sign
                            : (effectiveNetPnlAfterCharges >= 0 ? "PROFIT" : "LOSS"),
                        Brokerage: effectiveBrokerage,
                        Taxes: effectiveTaxes,
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
                    <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: palette.textTertiary }}>
                            Required Inputs
                        </p>
                    </div>
                    <Field label="Date *">
                        <input type="date" style={inputStyle} value={form.Date} onChange={e => setField("Date", e.target.value)} required />
                    </Field>
                    <Field label="Entry Time *">
                        <TimePickerAmPm value={form.EntryTime} onChange={v => setField("EntryTime", v)} required inputStyle={inputStyle} />
                        <div className="mt-1 flex items-center gap-2">
                            <button
                                type="button"
                                className="text-[11px] px-2 py-0.5 rounded-md"
                                style={{ background: `${palette.accent}16`, color: palette.accent }}
                                onClick={() => setField("EntryTime", nowAmPm())}
                            >
                                Set Current Time
                            </button>
                            <button
                                type="button"
                                className="text-[11px] px-2 py-0.5 rounded-md"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                onClick={() => setField("EntryTime", roundedToFiveAmPm())}
                            >
                                Round to 5 min
                            </button>
                        </div>
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

                    <div className="sm:col-span-2 lg:col-span-3">
                        <details className="rounded-xl p-3" style={{ border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                            <summary className="cursor-pointer text-sm font-semibold" style={{ color: palette.textPrimary }}>
                                Optional Contract Inputs
                            </summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <Field label="Exit Time">
                                    <TimePickerAmPm value={form.ExitTime} onChange={v => setField("ExitTime", v)} inputStyle={inputStyle} />
                                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                                        <button
                                            type="button"
                                            className="text-[11px] px-2 py-0.5 rounded-md"
                                            style={{ background: `${palette.accent}16`, color: palette.accent }}
                                            onClick={() => setField("ExitTime", nowAmPm())}
                                        >
                                            Set Current Time
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[11px] px-2 py-0.5 rounded-md"
                                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                            onClick={() => setField("ExitTime", roundedToFiveAmPm())}
                                        >
                                            Round to 5 min
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[11px] px-2 py-0.5 rounded-md"
                                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                            onClick={() => setField("ExitTime", "")}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </Field>
                                <Field label="Option Type">
                                    <CustomSelect value={form.OptionType ?? ""} onChange={v => setField("OptionType", v)} options={OPTION_TYPE_OPTS} />
                                </Field>
                                <Field label="Strike Price">
                                    <input type="number" style={inputStyle} placeholder="e.g. 24000" value={String(form.Strike ?? "")} onChange={e => setField("Strike", e.target.value)} />
                                </Field>
                                <Field label="Expiry">
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={form.Expiry ?? ""}
                                        onChange={e => {
                                            setExpiryTouched(true);
                                            setField("Expiry", e.target.value);
                                        }}
                                    />
                                    {defaultExpirySuggestion && (
                                        <div className="mt-1 flex items-center justify-between gap-2">
                                            <p className="text-[11px]" style={{ color: palette.textTertiary }}>
                                                Default next-week expiry: {defaultExpirySuggestion}
                                            </p>
                                            <button
                                                type="button"
                                                className="text-[11px] px-2 py-0.5 rounded-md"
                                                style={{ background: `${palette.accent}16`, color: palette.accent }}
                                                onClick={() => {
                                                    setExpiryTouched(false);
                                                    setField("Expiry", defaultExpirySuggestion);
                                                }}
                                            >
                                                Use Default
                                            </button>
                                        </div>
                                    )}
                                </Field>
                            </div>
                        </details>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                        <Field label="Composed Instrument Preview">
                            <input type="text" style={{ ...inputStyle, opacity: 0.75 }} value={instrumentPreview} readOnly />
                        </Field>
                    </div>
                </>)}

                {sectionCard("Position & Outcome", <TrendingUp />, <>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: palette.textTertiary }}>
                            Trade Calculation Inputs
                        </p>
                    </div>
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
                    <div className="sm:col-span-2 lg:col-span-3">
                        <details className="rounded-xl p-3" style={{ border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                            <summary className="cursor-pointer text-sm font-semibold" style={{ color: palette.textPrimary }}>
                                Optional Outcome Inputs
                            </summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <Field label="Stop Loss">
                                    <input type="number" step="0.01" style={inputStyle} value={String(form.StopLoss ?? "")} onChange={e => setField("StopLoss", e.target.value)} />
                                </Field>
                                <Field label="Target">
                                    <input type="number" step="0.01" style={inputStyle} value={String(form.Target ?? "")} onChange={e => setField("Target", e.target.value)} />
                                </Field>
                                <Field label="Hit Status">
                                    <CustomSelect value={form.IsHit ?? "AUTO"} onChange={v => setField("IsHit", v)} options={HIT_OPTS} />
                                </Field>
                            </div>
                        </details>
                    </div>
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
                            {effectiveTotalCharges > 0 && (
                                <span className="ml-2 font-bold text-sm normal-case tracking-normal" style={{ color: "#ef4444" }}>
                                    Total: ₹{effectiveTotalCharges.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </p>
                        {(() => {
                            const isHighGstSegment = ["FOREX", "CRYPTO"].includes((form.Segment || "OPTIONS").toUpperCase());
                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                    {([
                                                                                { label: `Brokerage${overrideBrokerageValue != null ? " (override)" : ""}`, hint: "₹20 buy + ₹20 sell", value: effectiveBrokerage },
                                        { label: "STT",                hint: "Securities Transaction Tax",   value: calculatedCharges.stt },
                                        { label: "Stamp Duty",         hint: "On buy-side notional",         value: calculatedCharges.stampDuty },
                                        { label: "Exchange Turnover",  hint: "NSE / MCX fees",               value: calculatedCharges.exchangeTurnover },
                                        { label: "SEBI Turnover",      hint: "₹10 per crore",                value: calculatedCharges.sebiTurnover },
                                                                                { label: `GST (${isHighGstSegment ? "30%" : "18%"})${overrideGstValue != null ? " (override)" : ""}`,
                                                                                    hint: "On brokerage + exchange + SEBI",                            value: effectiveGst },
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

                    <div className="sm:col-span-2 lg:col-span-3">
                        <details className="rounded-xl p-3" style={{ border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                            <summary className="cursor-pointer text-sm font-semibold" style={{ color: palette.textPrimary }}>
                                Manual Overrides (Optional)
                            </summary>
                            <p className="text-[11px] mt-2" style={{ color: palette.textTertiary }}>
                                Leave inputs empty to keep system-calculated values.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <Field label="Brokerage Override">
                                    <input
                                        type="number"
                                        step="0.01"
                                        style={inputStyle}
                                        placeholder="Leave blank to use auto"
                                        value={overrideBrokerage}
                                        onChange={e => setOverrideBrokerage(e.target.value)}
                                    />
                                    <p className="text-[11px] mt-1" style={{ color: palette.textTertiary }}>
                                        Auto: ₹{calculatedCharges.brokerage.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </p>
                                </Field>
                                <Field label="GST Override">
                                    <input
                                        type="number"
                                        step="0.01"
                                        style={inputStyle}
                                        placeholder="Leave blank to use auto"
                                        value={overrideGst}
                                        onChange={e => setOverrideGst(e.target.value)}
                                    />
                                    <p className="text-[11px] mt-1" style={{ color: palette.textTertiary }}>
                                        Auto: ₹{calculatedCharges.gst.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </p>
                                </Field>
                                <Field label="Total Charges Override">
                                    <input
                                        type="number"
                                        step="0.01"
                                        style={inputStyle}
                                        placeholder="Leave blank to use auto"
                                        value={overrideChargesTotal}
                                        onChange={e => setOverrideChargesTotal(e.target.value)}
                                    />
                                    <p className="text-[11px] mt-1" style={{ color: palette.textTertiary }}>
                                        Auto: ₹{autoTotalCharges.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </p>
                                </Field>
                                <Field label="Margin Used Override">
                                    <input
                                        type="number"
                                        step="0.01"
                                        style={inputStyle}
                                        placeholder="Leave blank to use auto"
                                        value={overrideMarginUsed}
                                        onChange={e => setOverrideMarginUsed(e.target.value)}
                                    />
                                    <p className="text-[11px] mt-1" style={{ color: palette.textTertiary }}>
                                        Auto: {marginUsed == null ? "-" : `₹${marginUsed.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                                    </p>
                                </Field>
                                <Field label="Net P&L Override">
                                    <input
                                        type="number"
                                        step="0.01"
                                        style={inputStyle}
                                        placeholder="Leave blank to use auto"
                                        value={overrideNetPnl}
                                        onChange={e => setOverrideNetPnl(e.target.value)}
                                    />
                                    <p className="text-[11px] mt-1" style={{ color: palette.textTertiary }}>
                                        Auto: {autoNetPnlAfterCharges == null ? "-" : `${autoNetPnlAfterCharges >= 0 ? "+" : ""}₹${Math.abs(autoNetPnlAfterCharges).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                                    </p>
                                </Field>
                            </div>
                        </details>
                    </div>

                    {/* Net P&L after all charges */}
                    {effectiveNetPnlAfterCharges !== null && (
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Field label="Net P&L after All Charges (read-only)">
                                <input type="text" style={{ ...inputStyle, opacity: 0.85, fontWeight: 700,
                                    color: effectiveNetPnlAfterCharges >= 0 ? "#22c55e" : "#ef4444" }}
                                    value={`${effectiveNetPnlAfterCharges >= 0 ? "+" : ""}₹${Math.abs(effectiveNetPnlAfterCharges).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${netPnlPercentage != null ? ` (${netPnlPercentage >= 0 ? "+" : ""}${netPnlPercentage.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%)` : ""}`}
                                    readOnly />
                            </Field>
                        </div>
                    )}
                </>)}

                {sectionCard("Setup & Psychology", <Psychology />, <>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <details className="rounded-xl p-3" style={{ border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                            <summary className="cursor-pointer text-sm font-semibold" style={{ color: palette.textPrimary }}>
                                Trade Context & Psychology (Optional)
                            </summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
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
                                <Field label="Tags (comma-separated)">
                                    <input type="text" style={inputStyle} value={form.Tags ?? ""} onChange={e => setField("Tags", e.target.value)} />
                                </Field>
                                <div className="sm:col-span-2 lg:col-span-3">
                                    <Field label="Notes">
                                        <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.Notes ?? ""} onChange={e => setField("Notes", e.target.value)} />
                                    </Field>
                                </div>
                            </div>
                        </details>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                        <details className="rounded-xl p-3" style={{ border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                            <summary className="cursor-pointer text-sm font-semibold" style={{ color: palette.textPrimary }}>
                                Attachments (Optional)
                            </summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
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
                            </div>
                        </details>
                    </div>
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
