/**
 * Shared Trade Form — used by both /new and /[id] pages.
 */

"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { Save, TrendingUp, TrendingDown, Psychology, InfoOutlined } from "@mui/icons-material";

// ── Option lists ──────────────────────────────────────────────────────────────
const SEGMENTS    = ["EQUITY","FUTURES","OPTIONS","CRYPTO","FOREX","COMMODITY"];
const DIRECTIONS  = ["LONG","SHORT"];
const OPTION_TYPES = ["CE","PE",""];
const RESULTS     = ["WIN","LOSS","BREAKEVEN"];
const SETUPS      = ["BREAKOUT","BREAKDOWN","REVERSAL","TREND_FOLLOW","MOMENTUM","MEAN_REVERSION","SUPPORT_RESISTANCE","OTHERS"];
const CONDITIONS  = ["TRENDING","RANGING","VOLATILE","CONSOLIDATING","GAP_UP","GAP_DOWN"];
const EMOTIONS    = ["CALM","CONFIDENT","ANXIOUS","FOMO","GREEDY","FEARFUL","DISCIPLINED","IMPULSIVE","NEUTRAL","FRUSTRATED"];
const MISTAKES    = ["EARLY_ENTRY","LATE_ENTRY","EARLY_EXIT","LATE_EXIT","OVERSIZE","NO_SL","MOVED_SL","REVENGE_TRADE","FOMO_ENTRY","IGNORED_RULES",""];

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
        <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }}>
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
                    <select style={inputStyle} value={form.Segment} onChange={e => set("Segment", e.target.value)}>
                        {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </Field>
                <Field label="Direction *">
                    <select style={inputStyle} value={form.Direction} onChange={e => set("Direction", e.target.value)}>
                        {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </Field>
                {form.Segment === "OPTIONS" && <>
                    <Field label="Option Type">
                        <select style={inputStyle} value={form.OptionType ?? ""} onChange={e => set("OptionType", e.target.value)}>
                            {OPTION_TYPES.map(o => <option key={o} value={o}>{o || "—"}</option>)}
                        </select>
                    </Field>
                    <Field label="Strike Price">
                        <input type="number" style={inputStyle} placeholder="e.g. 24000" value={String(form.Strike ?? "")} onChange={e => set("Strike", e.target.value)} />
                    </Field>
                    <Field label="Expiry">
                        <input type="date" style={inputStyle} value={form.Expiry ?? ""} onChange={e => set("Expiry", e.target.value)} />
                    </Field>
                </>}
                <Field label="Is Open?">
                    <select style={inputStyle} value={form.IsOpen ? "true" : "false"} onChange={e => set("IsOpen", e.target.value === "true")}>
                        <option value="true">Open (running)</option>
                        <option value="false">Closed</option>
                    </select>
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
                    <select style={inputStyle} value={form.Result ?? ""} onChange={e => set("Result", e.target.value)}>
                        <option value="">Auto from Net P&L</option>
                        {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </Field>
            </>)}

            {/* Section 3: Psychology */}
            {sectionCard("Psychology & Review", <Psychology />, <>
                <Field label="Setup Type">
                    <select style={inputStyle} value={form.SetupType ?? ""} onChange={e => set("SetupType", e.target.value)}>
                        <option value="">—</option>
                        {SETUPS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                </Field>
                <Field label="Strategy Name">
                    <input type="text" style={inputStyle} placeholder="e.g. EMA crossover" value={form.Strategy ?? ""} onChange={e => set("Strategy", e.target.value)} />
                </Field>
                <Field label="Market Condition">
                    <select style={inputStyle} value={form.MarketCondition ?? ""} onChange={e => set("MarketCondition", e.target.value)}>
                        <option value="">—</option>
                        {CONDITIONS.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                    </select>
                </Field>
                <Field label="Emotional State">
                    <select style={inputStyle} value={form.EmotionalState ?? ""} onChange={e => set("EmotionalState", e.target.value)}>
                        <option value="">—</option>
                        {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </Field>
                <Field label="Plan Adherence (0-100%)">
                    <input type="number" min={0} max={100} style={inputStyle} placeholder="e.g. 80" value={String(form.PlanAdherence ?? "")} onChange={e => set("PlanAdherence", e.target.value)} />
                </Field>
                <Field label="Mistake Type">
                    <select style={inputStyle} value={form.MistakeType ?? ""} onChange={e => set("MistakeType", e.target.value)}>
                        <option value="">None</option>
                        {MISTAKES.filter(Boolean).map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
                    </select>
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
    );
}
