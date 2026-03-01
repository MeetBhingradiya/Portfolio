/**
 * New Trade Page — log a fresh trade.
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks";
import { ArrowBack } from "@mui/icons-material";
import { motion } from "motion/react";
import TradeForm, { TradeFormData } from "../_components/TradeForm";

export default function NewTradePage() {
    const router = useRouter();
    const { palette } = useDesignTheme();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(data: TradeFormData) {
        setSubmitting(true);
        setError("");
        try {
            // Convert string fields to numbers
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

            const res = await fetch("/api/trade-journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                router.push("/trade-journal");
            } else {
                setError(json.error ?? "Failed to save trade.");
            }
        } catch (e) {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
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
                        Log New Trade
                    </h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Record your trade details for review and analytics.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                    {error}
                </div>
            )}

            <TradeForm onSubmit={handleSubmit} submitting={submitting} />
        </div>
    );
}
