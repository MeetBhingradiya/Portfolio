import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum TradeSegment {
    EQUITY = "EQUITY",
    OPTIONS = "OPTIONS",
    FUTURES = "FUTURES",
    FOREX = "FOREX",
    CRYPTO = "CRYPTO",
    COMMODITY = "COMMODITY"
}

export enum TradeDirection {
    LONG = "LONG",
    SHORT = "SHORT"
}

export enum TradeHitStatus {
    NONE = "NONE",
    TARGET_ACHIEVED = "TARGET_ACHIEVED",
    STOPLOSS_HIT = "STOPLOSS_HIT"
}

export enum TradePnLSign {
    PROFIT = "PROFIT",
    LOSS = "LOSS"
}

export enum TradeResult {
    WIN = "WIN",
    LOSS = "LOSS",
    BREAKEVEN = "BREAKEVEN",
    PENDING = "PENDING"
}

export enum SetupType {
    BREAKOUT = "BREAKOUT",
    PULLBACK = "PULLBACK",
    REVERSAL = "REVERSAL",
    MOMENTUM = "MOMENTUM",
    RANGE = "RANGE",
    GAP_FILL = "GAP_FILL",
    TREND_FOLLOW = "TREND_FOLLOW",
    SCALP = "SCALP",
    SWING = "SWING",
    POSITIONAL = "POSITIONAL",
    OTHER = "OTHER"
}

export enum MarketCondition {
    TRENDING_UP = "TRENDING_UP",
    TRENDING_DOWN = "TRENDING_DOWN",
    SIDEWAYS = "SIDEWAYS",
    VOLATILE = "VOLATILE",
    BREAKOUT = "BREAKOUT",
    CONSOLIDATION = "CONSOLIDATION"
}

export enum EmotionalState {
    CALM = "CALM",
    CONFIDENT = "CONFIDENT",
    FOMO = "FOMO",
    ANXIOUS = "ANXIOUS",
    REVENGE = "REVENGE",
    GREEDY = "GREEDY",
    FEARFUL = "FEARFUL",
    DISCIPLINED = "DISCIPLINED"
}

export enum MistakeType {
    NONE = "NONE",
    EARLY_EXIT = "EARLY_EXIT",
    LATE_ENTRY = "LATE_ENTRY",
    LATE_EXIT = "LATE_EXIT",
    NO_STOP_LOSS = "NO_STOP_LOSS",
    OVERLEVERAGED = "OVERLEVERAGED",
    CHASING = "CHASING",
    REVENGE_TRADE = "REVENGE_TRADE",
    IGNORED_PLAN = "IGNORED_PLAN",
    OVERTRADING = "OVERTRADING",
    POOR_RISK_MANAGEMENT = "POOR_RISK_MANAGEMENT"
}

export enum OptionType {
    CALL = "CALL",
    PUT = "PUT",
    NA = "NA"
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const TradeJournal_Schema = new mongoose.Schema(
    {
        TradeID: { type: String, default: v4, unique: true, index: true },
        DraftID: { type: String, sparse: true, index: true },
        UserID: { type: String, required: true, index: true },
        IsDraft: { type: Boolean, default: false, index: true },
        DraftUpdatedAt: { type: Date },

        // Basic Trade Info
        Date: { type: Date, required: true, default: Date.now },
        EntryTime: {
            type: String,
            match: /^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i
        },
        ExitTime: { type: String },
        Instrument: { type: String, trim: true, uppercase: true },
        InstrumentName: { type: String, trim: true, uppercase: true },
        Segment: {
            type: String,
            enum: Object.values(TradeSegment),
            default: TradeSegment.OPTIONS
        },
        Direction: {
            type: String,
            enum: Object.values(TradeDirection),
            default: TradeDirection.SHORT
        },
        PositionDuration: {
            type: String,
            enum: Object.values(TradeDirection),
            default: TradeDirection.SHORT
        },

        // Options-specific
        OptionType: {
            type: String,
            enum: Object.values(OptionType),
            default: OptionType.NA
        },
        StrikePrice: { type: Number },
        Expiry: { type: String },

        // Position Details
        EntryPrice: { type: Number },
        ExitPrice: { type: Number },
        StopLoss: { type: Number },
        Target: { type: Number },
        Quantity: { type: Number },
        LotSize: { type: Number, default: 1 },
        IsHit: {
            type: String,
            enum: Object.values(TradeHitStatus),
            default: TradeHitStatus.NONE
        },
        PnLAmount: { type: Number, min: 0 },
        PnLSign: {
            type: String,
            enum: Object.values(TradePnLSign),
            default: TradePnLSign.PROFIT
        },
        TotalCapital: { type: Number },
        RiskPercentage: { type: Number },

        // Risk Metrics
        PlannedRiskAmount: { type: Number },
        PlannedRewardAmount: { type: Number },
        PlannedRR: { type: Number },
        ActualRR: { type: Number },

        // Outcome
        GrossPnL: { type: Number, default: 0 },
        Brokerage: { type: Number, default: 0 },
        Taxes: { type: Number, default: 0 },
        NetPnL: { type: Number, default: 0 },
        Result: {
            type: String,
            enum: Object.values(TradeResult),
            default: TradeResult.PENDING
        },
        HoldingDurationMinutes: { type: Number },

        // Psychology & Execution
        SetupType: { type: String, enum: Object.values(SetupType) },
        StrategyName: { type: String, trim: true },
        MarketCondition: { type: String, enum: Object.values(MarketCondition) },
        EmotionalState: { type: String, enum: Object.values(EmotionalState) },
        FollowedPlan: { type: Boolean },
        MistakeType: {
            type: String,
            enum: Object.values(MistakeType),
            default: MistakeType.NONE
        },

        // Notes & Tags
        PreTradeAnalysis: { type: String },
        PostTradeNotes: { type: String },
        Lessons: { type: String },
        Screenshots: { type: [String], default: [] },
        AttachmentUrls: { type: [String], default: [] },
        Tags: { type: [String], default: [] },

        IsOpen: { type: Boolean, default: true }
    },
    { timestamps: true }
);

TradeJournal_Schema.index({ UserID: 1, Date: -1 });
TradeJournal_Schema.index({ UserID: 1, Result: 1 });
TradeJournal_Schema.index({ UserID: 1, Instrument: 1 });
TradeJournal_Schema.index({ UserID: 1, IsDraft: 1, DraftUpdatedAt: -1 });

export const TradeJournal = mongoose.models.TradeJournal || mongoose.model("TradeJournal", TradeJournal_Schema);
