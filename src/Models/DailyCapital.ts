/**
 * DailyCapital — tracks per-day portfolio starting/ending capital.
 * Used to compute Sharpe Ratio across your trade history.
 *
 * Log once per day (after market close) so the analytics can compute:
 *   dailyReturn = (EndingCapital - StartingCapital) / StartingCapital
 *   Sharpe = (avgDailyReturn - riskFreeDaily) / stdDev(dailyReturns) × √252
 */

import mongoose from "mongoose";

const DailyCapital_Schema = new mongoose.Schema(
    {
        UserID: { type: String, required: true, index: true },
        Date: { type: String, required: true }, // "YYYY-MM-DD"

        StartingCapital: { type: Number, required: true },
        EndingCapital: { type: Number, required: true },
        NetPnL: { type: Number, required: true }, // EndingCapital - StartingCapital
        DailyReturn: { type: Number, required: true }, // NetPnL / StartingCapital

        Notes: { type: String }
    },
    { timestamps: true }
);

// Unique day per user
DailyCapital_Schema.index({ UserID: 1, Date: 1 }, { unique: true });

export const DailyCapital = mongoose.models.DailyCapital || mongoose.model("DailyCapital", DailyCapital_Schema);
