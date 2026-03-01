/**
 * Shared Trade Form — used by both /new and /[id] pages.
 * • Native <select> replaced with themed CustomSelect
 * • OCR scanner button auto-fills fields from uploaded screenshots
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { Save, TrendingUp, Psychology, InfoOutlined, DocumentScanner } from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import OcrScanner from "./OcrScanner";

// ── Option lists ──────────────────────────────────────────────────────────────
const mkOpts = (arr: string[], emptyLabel?: string) =>
    [...(emptyLabel !== undefined ? [{ value: "", label: emptyLabel }] : []),
     ...arr.map(v => ({ value: v, label: v.replace(/_/g, " ") }))];

const SEGMENT_OPTS  = mkOpts(["EQUITY","FUTURES","OPTIONS","CRYPTO","FOREX","COMMODITY"]);
const DIR_OPTS      = mkOpts(["LONG","SHORT"]);
const OPTTYPE_OPTS  = mkOpts(["CE","PE"], "—");
const RESULT_OPTS   = mkOpts(["WIN","LOSS","BREAKEVEN"], "Auto from Net P&L");
const SETUP_OPTS    = mkOpts(["BREAKOUT","BREAKDOWN","REVERSAL","TREND_FOLLOW","MOMENTUM","MEAN_REVERSION","SUPPORT_RESISTANCE","OTHERS"], "—");
const COND_OPTS     = mkOpts(["TRENDING","RANGING","VOLATILE","CONSOLIDATING","GAP_UP","GAP_DOWN"], "—");
const EMOTION_OPTS  = mkOpts(["CALM","CONFIDENT","ANXIOUS","FOMO","GREEDY","FEARFUL","DISCIPLINED","IMPULSIVE","NEUTRAL","FRUSTRATED"], "—");
const MISTAKE_OPTS  = mkOpts(["EARLY_ENTRY","LATE_ENTRY","EARLY_EXIT","LATE_EXIT","OVERSIZE","NO_SL","MOVED_SL","REVENGE_TRADE","FOMO_ENTRY","IGNORED_RULES"], "None");
const ISOPEN_OPTS   = [{ value: "true", label: "Open (running)" }, { value: "false", label: "Closed" }];

export interface TradeFormData {
    Date:           string;
    EntryTime?:     string;
    ExitTime?:      string;
    Instrument:     string;
    Segment:        string;
    Direction:      string;
    OptionType?:    string;
    Strike?:        number | string;
    Expiry?:        string;
    EntryPrice:     number | string;
    ExitPrice?:     number | string;
    StopLoss?:      number | string;
    Target?:        number | string;
    Quantity:       number | string;
    LotSize?:       number | string;
    PlannedRR?:     number | string;
    GrossPnL?:      number | string;
    NetPnL?:        number | string;
    Brokerage?:     number | string;
    Taxes?:         number | string;
    Result?:        string;
    IsOpen:         boolean;
    SetupType?:     string;
    Strategy?:      string;
    MarketCondition?: string;
    EmotionalState?: string;
    PlanAdherence?: number | string;
    MistakeType?:   string;
    Learnings?:     string;
    Notes?:         string;
    Tags?:          string;
    Screenshots?:   string;
}

interface Props {
    initialData?: Partial<TradeFormData>;
    onSubmit: (data: TradeFormData) => Promise<void>;
    submitting: boolean;
    isEdit?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "inherit", opacity: 0.65 }}>{label}</label>
            {children}
        </div>
    );
}

export default function TradeForm({ initialData, onSubmit, submitting, isEdit }: Props) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const surfaceBg   = isApple
        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: "8px 12px",
        color: palette.textPrimary,
        fontSize: 14,
        outline: "none",
        width: "100%",
    };

    const today = new Date().toISOString().slice(0, 10);
    const [showOcr, setShowOcr] = useState(false);

    const [form, setForm] = useState<TradeFormData>({
        Date:           initialData?.Date           ?? today,
        EntryTime:      initialData?.EntryTime      ?? "",
        ExitTime:       initialData?.ExitTime       ?? "",
        Instrument:     initialData?.Instrument     ?? "",
        Segment:        initialData?.Segment        ?? "EQUITY",
        Direction:      initialData?.Direction      ?? "LONG",
        OptionType:     initialData?.OptionType     ?? "",
        Strike:         initialData?.Strike         ?? "",
        Expiry:         initialData?.Expiry         ?? "",
        EntryPrice:     initialData?.EntryPrice     ?? "",
        ExitPrice:      initialData?.ExitPrice      ?? "",
        StopLoss:       initialData?.StopLoss       ?? "",
        Target:         initialData?.Target         ?? "",
        Quantity:       initialData?.Quantity       ?? "",
        LotSize:        initialData?.LotSize        ?? "",
        PlannedRR:      initialData?.PlannedRR      ?? "",
        GrossPnL:       initialData?.GrossPnL       ?? "",
        NetPnL:         initialData?.NetPnL         ?? "",
        Brokerage:      initialData?.Brokerage      ?? "",
        Taxes:          initialData?.Taxes          ?? "",
        Result:         initialData?.Result         ?? "",
        IsOpen:         initialData?.IsOpen         ?? true,
        SetupType:      initialData?.SetupType      ?? "",
        Strategy:       initialData?.Strategy       ?? "",
        MarketCondition: initialData?.MarketCondition ?? "",
        EmotionalState: initialData?.EmotionalState ?? "",
        PlanAdherence:  initialData?.PlanAdherence  ?? "",
        MistakeType:    initialData?.MistakeType    ?? "",
        Learnings:      initialData?.Learnings      ?? "",
        Notes:          initialData?.Notes          ?? "",
        Tags:           initialData?.Tags           ?? "",
        Screenshots:    initialData?.Screenshots    ?? "",
    });

    function set(key: keyof TradeFormData, value: any) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    /** Merge OCR-extracted fields into the form state */
    function applyOcr(extracted: Partial<TradeFormData>) {
        setForm(prev => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(extracted)) {
                if (v !== "" && v != null) (next as any)[k] = v;
            }
            return next;
        });
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
            {/* OCR Scanner modal */}
            <AnimatePresence>
                {showOcr && (
                    <OcrScanner
                        onExtracted={applyOcr}
                        onClose={() => setShowOcr(false)}
                    />
                )}
            </AnimatePresence>

        <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }}>
            {/* OCR Button */}
            <motion.div
                className="flex items-center gap-2 mb-4 p-4 rounded-2xl cursor-pointer w-fit"
                style={{ background: `${palette.accent}12`, border: `1.5px dashed ${palette.accent}50` }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowOcr(true)}
            >
                <DocumentScanner style={{ color: palette.accent, fontSize: 20 }} />
                <span className="text-sm font-semibold" style={{ color: palette.accent }}>
                    Auto-fill from Screenshot (OCR)
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${palette.accent}22`, color: palette.accent }}>
                    Client-side · No upload
                </span>
            </motion.div>
            {/* Section 1: Basic Info */}
            {sectionCard("Basic Info", <InfoOutlined />, <>
                <Field label="Date *">
                    <input type="date" style={inputStyle} value={form.Date} onChange={e => set("Date", e.target.value)} required />
                </Field>
                <Field label="Entry Time">
                    <input type="time" style={inputStyle} value={form.EntryTime ?? ""} onChange={e => set("EntryTime", e.target.value)} />
                </Field>
                <Field label="Exit Time">
                    <input type="time" style={inputStyle} value={form.ExitTime ?? ""} onChange={e => set("ExitTime", e.target.value)} />
                </Field>
                <Field label="Instrument *">
                    <input type="text" style={inputStyle} placeholder="e.g. RELIANCE, NIFTY" value={String(form.Instrument)} onChange={e => set("Instrument", e.target.value.toUpperCase())} required />
                </Field>
                <Field label="Segment *">
                    <CustomSelect value={form.Segment} onChange={v => set("Segment", v)} options={SEGMENT_OPTS} />
                </Field>
                <Field label="Direction *">
                    <CustomSelect value={form.Direction} onChange={v => set("Direction", v)} options={DIR_OPTS} />
                </Field>
                {form.Segment === "OPTIONS" && <>
                    <Field label="Option Type">
                        <CustomSelect value={form.OptionType ?? ""} onChange={v => set("OptionType", v)} options={OPTTYPE_OPTS} />
                    </Field>
                    <Field label="Strike Price">
                        <input type="number" style={inputStyle} placeholder="e.g. 24000" value={String(form.Strike ?? "")} onChange={e => set("Strike", e.target.value)} />
                    </Field>
                    <Field label="Expiry">
                        <input type="date" style={inputStyle} value={form.Expiry ?? ""} onChange={e => set("Expiry", e.target.value)} />
                    </Field>
                </>}
                <Field label="Is Open?">
                    <CustomSelect value={form.IsOpen ? "true" : "false"} onChange={v => set("IsOpen", v === "true")} options={ISOPEN_OPTS} />
                </Field>
            </>)}

            {/* Section 2: Position & Risk */}
            {sectionCard("Position & Risk", <TrendingUp />, <>
                <Field label="Entry Price *">
                    <input type="number" step="0.01" style={inputStyle} value={String(form.EntryPrice)} onChange={e => set("EntryPrice", e.target.value)} required />
                </Field>
                <Field label="Exit Price">
                    <input type="number" step="0.01" style={inputStyle} value={String(form.ExitPrice ?? "")} onChange={e => set("ExitPrice", e.target.value)} />
                </Field>
                <Field label="Stop Loss">
                    <input type="number" step="0.01" style={inputStyle} value={String(form.StopLoss ?? "")} onChange={e => set("StopLoss", e.target.value)} />
                </Field>
                <Field label="Target">
                    <input type="number" step="0.01" style={inputStyle} value={String(form.Target ?? "")} onChange={e => set("Target", e.target.value)} />
                </Field>
                <Field label="Quantity *">
                    <input type="number" step="1" style={inputStyle} value={String(form.Quantity)} onChange={e => set("Quantity", e.target.value)} required />
                </Field>
                <Field label="Lot Size">
                    <input type="number" step="1" style={inputStyle} placeholder="1 for equity" value={String(form.LotSize ?? "")} onChange={e => set("LotSize", e.target.value)} />
                </Field>
                <Field label="Planned R:R">
                    <input type="number" step="0.01" style={inputStyle} placeholder="e.g. 2.5" value={String(form.PlannedRR ?? "")} onChange={e => set("PlannedRR", e.target.value)} />
                </Field>
                <Field label="Brokerage">
                    <input type="number" step="0.01" style={inputStyle} value={String(form.Brokerage ?? "")} onChange={e => set("Brokerage", e.target.value)} />
                </Field>
                <Field label="Taxes / Charges">
                    <input type="number" step="0.01" style={inputStyle} value={String(form.Taxes ?? "")} onChange={e => set("Taxes", e.target.value)} />
                </Field>
                <Field label="Gross P&L (override)">
                    <input type="number" step="0.01" style={inputStyle} placeholder="Auto-computed if blank" value={String(form.GrossPnL ?? "")} onChange={e => set("GrossPnL", e.target.value)} />
                </Field>
                <Field label="Net P&L (override)">
                    <input type="number" step="0.01" style={inputStyle} placeholder="Auto-computed if blank" value={String(form.NetPnL ?? "")} onChange={e => set("NetPnL", e.target.value)} />
                </Field>
                <Field label="Result (override)">
                    <CustomSelect value={form.Result ?? ""} onChange={v => set("Result", v)} options={RESULT_OPTS} />
                </Field>
            </>)}

            {/* Section 3: Psychology */}
            {sectionCard("Psychology & Review", <Psychology />, <>
                <Field label="Setup Type">
                    <CustomSelect value={form.SetupType ?? ""} onChange={v => set("SetupType", v)} options={SETUP_OPTS} />
                </Field>
                <Field label="Strategy Name">
                    <input type="text" style={inputStyle} placeholder="e.g. EMA crossover" value={form.Strategy ?? ""} onChange={e => set("Strategy", e.target.value)} />
                </Field>
                <Field label="Market Condition">
                    <CustomSelect value={form.MarketCondition ?? ""} onChange={v => set("MarketCondition", v)} options={COND_OPTS} />
                </Field>
                <Field label="Emotional State">
                    <CustomSelect value={form.EmotionalState ?? ""} onChange={v => set("EmotionalState", v)} options={EMOTION_OPTS} />
                </Field>
                <Field label="Plan Adherence (0-100%)">
                    <input type="number" min={0} max={100} style={inputStyle} placeholder="e.g. 80" value={String(form.PlanAdherence ?? "")} onChange={e => set("PlanAdherence", e.target.value)} />
                </Field>
                <Field label="Mistake Type">
                    <CustomSelect value={form.MistakeType ?? ""} onChange={v => set("MistakeType", v)} options={MISTAKE_OPTS} />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Learnings">
                        <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="What did you learn from this trade?" value={form.Learnings ?? ""} onChange={e => set("Learnings", e.target.value)} />
                    </Field>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Notes">
                        <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Any additional notes…" value={form.Notes ?? ""} onChange={e => set("Notes", e.target.value)} />
                    </Field>
                </div>
                <Field label="Tags (comma-separated)">
                    <input type="text" style={inputStyle} placeholder="e.g. scalp, options, gap" value={form.Tags ?? ""} onChange={e => set("Tags", e.target.value)} />
                </Field>
                <Field label="Screenshot URLs (comma-separated)">
                    <input type="text" style={inputStyle} placeholder="https://…" value={form.Screenshots ?? ""} onChange={e => set("Screenshots", e.target.value)} />
                </Field>
            </>)}

            {/* Submit */}
            <motion.button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold mt-2"
                style={{ background: palette.accent, color: "#fff", opacity: submitting ? 0.6 : 1 }}
                whileHover={{ scale: submitting ? 1 : 1.03 }}
                whileTap={{   scale: submitting ? 1 : 0.97 }}
            >
                <Save fontSize="small" />
                {submitting ? "Saving…" : isEdit ? "Update Trade" : "Log Trade"}
            </motion.button>
        </form>
        </>
    );
}
