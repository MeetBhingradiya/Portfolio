/**
 * Trade Detail / Edit Page
 * Fetches the trade by ID, pre-fills the form, allows update + delete.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDesignTheme } from "@Hooks";
import { ArrowBack, Delete } from "@mui/icons-material";
import { motion } from "motion/react";
import TradeForm, { TradeFormData } from "../_components/TradeForm";

export default function TradeDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    const [loading,    setLoading]    = useState(true);
    const [initial,    setInitial]    = useState<Partial<TradeFormData> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting,   setDeleting]   = useState(false);
    const [error,      setError]      = useState("");
    const [notFound,   setNotFound]   = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/trade-journal/${id}`)
            .then(r => r.json())
            .then(json => {
                if (json.success) {
                    const t = json.data;
                    setInitial({
                        Date:            t.Date,
                        EntryTime:       t.EntryTime    ?? "",
                        ExitTime:        t.ExitTime     ?? "",
                        Instrument:      t.Instrument,
                        Segment:         t.Segment,
                        Direction:       t.Direction,
                        OptionType:      t.OptionType   ?? "",
                        Strike:          t.Strike       ?? "",
                        Expiry:          t.Expiry       ?? "",
                        EntryPrice:      t.EntryPrice,
                        ExitPrice:       t.ExitPrice    ?? "",
                        StopLoss:        t.StopLoss     ?? "",
                        Target:          t.Target       ?? "",
                        Quantity:        t.Quantity,
                        LotSize:         t.LotSize      ?? "",
                        PlannedRR:       t.PlannedRR    ?? "",
                        GrossPnL:        t.GrossPnL     ?? "",
                        NetPnL:          t.NetPnL       ?? "",
                        Brokerage:       t.Brokerage    ?? "",
                        Taxes:           t.Taxes        ?? "",
                        Result:          t.Result       ?? "",
                        IsOpen:          t.IsOpen       ?? false,
                        SetupType:       t.SetupType    ?? "",
                        Strategy:        t.Strategy     ?? "",
                        MarketCondition: t.MarketCondition ?? "",
                        EmotionalState:  t.EmotionalState  ?? "",
                        PlanAdherence:   t.PlanAdherence   ?? "",
                        MistakeType:     t.MistakeType  ?? "",
                        Learnings:       t.Learnings    ?? "",
                        Notes:           t.Notes        ?? "",
                        Tags:            Array.isArray(t.Tags) ? t.Tags.join(", ") : (t.Tags ?? ""),
                        Screenshots:     Array.isArray(t.Screenshots) ? t.Screenshots.join(", ") : (t.Screenshots ?? ""),
                    });
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [id]);

    async function handleSubmit(data: TradeFormData) {
        setSubmitting(true);
        setError("");
        try {
            const payload = {
                ...data,
                EntryPrice: data.EntryPrice !== "" ? Number(data.EntryPrice) : undefined,
                ExitPrice:  data.ExitPrice  !== "" ? Number(data.ExitPrice)  : undefined,
                StopLoss:   data.StopLoss   !== "" ? Number(data.StopLoss)   : undefined,
                Target:     data.Target     !== "" ? Number(data.Target)     : undefined,
                Quantity:   data.Quantity   !== "" ? Number(data.Quantity)   : undefined,
                LotSize:    data.LotSize    !== "" ? Number(data.LotSize)    : undefined,
                PlannedRR:  data.PlannedRR  !== "" ? Number(data.PlannedRR)  : undefined,
                GrossPnL:   data.GrossPnL   !== "" ? Number(data.GrossPnL)   : undefined,
                NetPnL:     data.NetPnL     !== "" ? Number(data.NetPnL)     : undefined,
                Brokerage:  data.Brokerage  !== "" ? Number(data.Brokerage)  : undefined,
                Taxes:      data.Taxes      !== "" ? Number(data.Taxes)      : undefined,
                PlanAdherence: data.PlanAdherence !== "" ? Number(data.PlanAdherence) : undefined,
                Strike:     data.Strike     !== "" ? Number(data.Strike)     : undefined,
                Tags:       data.Tags       ? data.Tags.split(",").map(t => t.trim()).filter(Boolean) : [],
                Screenshots: data.Screenshots ? data.Screenshots.split(",").map(s => s.trim()).filter(Boolean) : [],
            };

            const res  = await fetch(`/api/trade-journal/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                router.push("/trade-journal");
            } else {
                setError(json.error ?? "Failed to update trade.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Permanently delete this trade? This cannot be undone.")) return;
        setDeleting(true);
        const res  = await fetch(`/api/trade-journal/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) router.push("/trade-journal");
        else { setError(json.error ?? "Failed to delete."); setDeleting(false); }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <motion.button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl"
                        style={{ color: palette.textSecondary }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <ArrowBack />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>
                            Edit Trade
                        </h1>
                        <p className="text-xs font-mono mt-0.5" style={{ color: palette.textTertiary }}>
                            {id}
                        </p>
                    </div>
                </div>

                <motion.button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                        background: "rgba(239,68,68,0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                        opacity: deleting ? 0.5 : 1,
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                >
                    <Delete fontSize="small" />
                    {deleting ? "Deleting…" : "Delete"}
                </motion.button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24" style={{ color: palette.textSecondary }}>
                    Loading trade…
                </div>
            ) : notFound ? (
                <div className="text-center py-24">
                    <p className="text-lg font-semibold" style={{ color: palette.textPrimary }}>Trade not found</p>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                        It may have been deleted or the ID is incorrect.
                    </p>
                </div>
            ) : initial ? (
                <TradeForm
                    initialData={initial}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    isEdit
                />
            ) : null}
        </div>
    );
}
