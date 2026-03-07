/**
 * ProductivityHabit Mongoose Model
 * Habit tracking with streak computation, frequency configuration, and XP rewards.
 */

import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum HabitFrequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    CUSTOM = "CUSTOM",
}

export enum HabitCategory {
    HEALTH = "HEALTH",
    FITNESS = "FITNESS",
    MINDFULNESS = "MINDFULNESS",
    LEARNING = "LEARNING",
    PRODUCTIVITY = "PRODUCTIVITY",
    SOCIAL = "SOCIAL",
    FINANCE = "FINANCE",
    CREATIVITY = "CREATIVITY",
    OTHER = "OTHER",
}

export enum HabitDifficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
}

// ─── XP per difficulty ───────────────────────────────────────────────────────

export const HABIT_XP = {
    [HabitDifficulty.EASY]: 5,
    [HabitDifficulty.MEDIUM]: 10,
    [HabitDifficulty.HARD]: 20,
    STREAK_7_BONUS: 25,
    STREAK_30_BONUS: 100,
    STREAK_100_BONUS: 500,
} as const;

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

/** One day's completion record */
const CompletionRecordSchema = new mongoose.Schema(
    {
        Date: { type: String, required: true }, // ISO date string YYYY-MM-DD
        CompletedAt: { type: Date },
        Note: { type: String, trim: true },
        XPAwarded: { type: Number, default: 0 },
    },
    { _id: false }
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const ProductivityHabit_Schema = new mongoose.Schema(
    {
        HabitID: { type: String, default: v4, unique: true, index: true },
        UserID: { type: String, required: true, index: true },

        // Content
        Title: { type: String, required: true, trim: true, maxlength: 300 },
        Description: { type: String, trim: true, maxlength: 2000 },
        Category: {
            type: String,
            enum: Object.values(HabitCategory),
            default: HabitCategory.OTHER,
        },
        Difficulty: {
            type: String,
            enum: Object.values(HabitDifficulty),
            default: HabitDifficulty.MEDIUM,
        },
        Emoji: { type: String, default: "✅" },
        Color: { type: String, default: "#5E97F6" },

        // Frequency configuration
        Frequency: {
            type: String,
            enum: Object.values(HabitFrequency),
            default: HabitFrequency.DAILY,
        },
        FrequencyDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0=Sun…6=Sat
        FrequencyTimesPerPeriod: { type: Number, default: 1 }, // e.g. 3 times per week

        // Target (optional)
        TargetValue: { type: Number }, // e.g. 8 (glasses of water)
        TargetUnit: { type: String, trim: true }, // e.g. "glasses"

        // Streak tracking
        CurrentStreak: { type: Number, default: 0 },
        LongestStreak: { type: Number, default: 0 },
        LastCompletedDate: { type: String }, // YYYY-MM-DD

        // Completion history (last 365 days)
        CompletionHistory: { type: [CompletionRecordSchema], default: [] },

        // Gamification
        TotalXPEarned: { type: Number, default: 0 },
        TotalCompletions: { type: Number, default: 0 },

        // AI-generated flag
        AIGenerated: { type: Boolean, default: false },

        // Linked goal
        GoalID: { type: String },

        // Status
        IsActive: { type: Boolean, default: true },
        StartDate: { type: String }, // YYYY-MM-DD
        EndDate: { type: String }, // YYYY-MM-DD (optional)

        // Reminders
        ReminderEnabled: { type: Boolean, default: false },
        ReminderTime: { type: String }, // HH:MM

        // Sort order
        SortOrder: { type: Number, default: 0 },

        // Archived
        Archived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ProductivityHabit_Schema.index({ UserID: 1, IsActive: 1 });
ProductivityHabit_Schema.index({ UserID: 1, Category: 1 });
ProductivityHabit_Schema.index({ UserID: 1, CurrentStreak: -1 });

export interface ICompletionRecord {
    Date: string;
    CompletedAt?: Date;
    Note?: string;
    XPAwarded: number;
}

export interface IProductivityHabit extends mongoose.Document {
    HabitID: string;
    UserID: string;
    Title: string;
    Description?: string;
    Category: HabitCategory;
    Difficulty: HabitDifficulty;
    Emoji: string;
    Color: string;
    Frequency: HabitFrequency;
    FrequencyDays: number[];
    FrequencyTimesPerPeriod: number;
    TargetValue?: number;
    TargetUnit?: string;
    CurrentStreak: number;
    LongestStreak: number;
    LastCompletedDate?: string;
    CompletionHistory: ICompletionRecord[];
    TotalXPEarned: number;
    TotalCompletions: number;
    AIGenerated: boolean;
    GoalID?: string;
    IsActive: boolean;
    StartDate?: string;
    EndDate?: string;
    ReminderEnabled: boolean;
    ReminderTime?: string;
    SortOrder: number;
    Archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const ProductivityHabit: mongoose.Model<IProductivityHabit> =
    mongoose.models.ProductivityHabit ||
    mongoose.model<IProductivityHabit>("ProductivityHabit", ProductivityHabit_Schema);
