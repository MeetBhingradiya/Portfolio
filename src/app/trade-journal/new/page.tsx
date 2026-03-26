/**
 * New Trade Page — log a fresh trade.
 * Draft state is managed directly inside TradeForm/useTradeFormState.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks";
import { ArrowBack } from "@mui/icons-material";
import { motion } from "motion/react";
import TradeForm, { TradeFormData } from "../components/TradeForm";

const DRAFT_STORAGE_KEY = "tradeform_draft";
const DRAFT_TIMESTAMP_KEY = "tradeform_draft_timestamp";
const DRAFT_ID_KEY = "tradeform_draft_id";

export default function NewTradePage() {
    const router = useRouter();
    const { palette } = useDesignTheme();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(data: TradeFormData) {
        setSubmitting(true);
        setError("");
        try {
            if (!data.Quantity && !data.LotSize) {
                setError("Either Quantity or Lot Size must be provided (at least one).");
                setSubmitting(false);
                return;
            }

            const payload = {
                ...data,
                IsDraft: false,
                Segment: data.Segment || "OPTIONS",
                PositionDuration: data.PositionDuration || "SHORT",
                Direction: data.PositionDuration || "SHORT",
                Instrument: data.Instrument || data.InstrumentName,
                EntryPrice: data.EntryPrice !== "" ? Number(data.EntryPrice) : undefined,
                ExitPrice: data.ExitPrice !== "" ? Number(data.ExitPrice) : undefined,
                StopLoss: data.StopLoss !== "" ? Number(data.StopLoss) : undefined,
                Target: data.Target !== "" ? Number(data.Target) : undefined,
                Quantity: data.Quantity !== "" ? Number(data.Quantity) : undefined,
                LotSize: data.LotSize !== "" ? Number(data.LotSize) : undefined,
                StrikePrice: data.Strike !== "" ? Number(data.Strike) : undefined,
                IsHit: data.IsHit || "AUTO",
                PnLAmount: data.PnLAmount !== "" ? Number(data.PnLAmount) : undefined,
                StrategyName: data.StrategyName,
                PostTradeNotes: data.Notes,
                Tags: data.Tags ? data.Tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
                Screenshots: data.AttachmentLinks ? data.AttachmentLinks.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
                ScreenshotCdnUrls: Array.isArray(data.ScreenshotCdnUrls) ? data.ScreenshotCdnUrls : [],
            };

            const res = await fetch("/api/trade-journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                    localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
                    localStorage.removeItem(DRAFT_ID_KEY);
                }
                router.push("/trade-journal");
            } else {
                setError(json.error ?? "Failed to save trade.");
            }
        } catch {
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

            <TradeForm onSubmit={handleSubmit} submitting={submitting} enableBackendDraft />
        </div>
    );
}
