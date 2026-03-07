/**
 * ProductivityGoal Mongoose Model
 * Short & long-term goals with milestones, progress tracking, and XP rewards.
 */

import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum GoalType {
    SHORT_TERM = "SHORT_TERM", // < 30 days
    LONG_TERM = "LONG_TERM",   // > 30 days
    ONGOING = "ONGOING",       // No fixed end date
}

export enum GoalStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    ON_HOLD = "ON_HOLD",
    COMPLETED = "COMPLETED",
    ABANDONED = "ABANDONED",
}

export enum GoalCategory {
    CAREER = "CAREER",
    EDUCATION = "EDUCATION",
    HEALTH = "HEALTH",
    FITNESS = "FITNESS",
    FINANCE = "FINANCE",
    RELATIONSHIPS = "RELATIONSHIPS",
    PERSONAL_GROWTH = "PERSONAL_GROWTH",
    CREATIVITY = "CREATIVITY",
    TRAVEL = "TRAVEL",
    TECHNOLOGY = "TECHNOLOGY",
    OTHER = "OTHER",
}

export enum MilestoneStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    SKIPPED = "SKIPPED",
}

// ─── XP rewards ──────────────────────────────────────────────────────────────

export const GOAL_XP = {
    [GoalType.SHORT_TERM]: 100,
    [GoalType.LONG_TERM]: 500,
    [GoalType.ONGOING]: 50,
    MILESTONE_BONUS: 25,
    EARLY_COMPLETION_BONUS: 100,
} as const;

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const MilestoneSchema = new mongoose.Schema(
    {
        id: { type: String, default: v4 },
        Title: { type: String, required: true, trim: true },
        Description: { type: String, trim: true },
        TargetDate: { type: Date },
        Status: {
            type: String,
            enum: Object.values(MilestoneStatus),
            default: MilestoneStatus.PENDING,
        },
        CompletedAt: { type: Date },
        XPReward: { type: Number, default: 25 },
        SortOrder: { type: Number, default: 0 },
    },
    { _id: false }
);

const GoalProgressUpdateSchema = new mongoose.Schema(
    {
        Date: { type: Date, default: Date.now },
        Value: { type: Number, required: true },
        Note: { type: String, trim: true },
    },
    { _id: false }
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const ProductivityGoal_Schema = new mongoose.Schema(
    {
        GoalID: { type: String, default: v4, unique: true, index: true },
        UserID: { type: String, required: true, index: true },

        // Content
        Title: { type: String, required: true, trim: true, maxlength: 500 },
        Description: { type: String, trim: true, maxlength: 5000 },
        Category: {
            type: String,
            enum: Object.values(GoalCategory),
            default: GoalCategory.OTHER,
        },
        Emoji: { type: String, default: "🎯" },
        Color: { type: String, default: "#AF52DE" },

        // Type & Status
        Type: {
            type: String,
            enum: Object.values(GoalType),
            default: GoalType.SHORT_TERM,
        },
        Status: {
            type: String,
            enum: Object.values(GoalStatus),
            default: GoalStatus.NOT_STARTED,
        },

        // Dates
        StartDate: { type: Date, default: Date.now },
        TargetDate: { type: Date },
        CompletedAt: { type: Date },

        // Progress tracking
        ProgressType: {
            type: String,
            enum: ["PERCENTAGE", "NUMERIC", "BOOLEAN"],
            default: "PERCENTAGE",
        },
        ProgressTarget: { type: Number, default: 100 }, // e.g. 100 for percentage
        ProgressCurrent: { type: Number, default: 0 },
        ProgressUnit: { type: String, trim: true }, // e.g. "kg", "pages", "%"
        ProgressHistory: { type: [GoalProgressUpdateSchema], default: [] },

        // Milestones
        Milestones: { type: [MilestoneSchema], default: [] },

        // Why (motivation)
        Motivation: { type: String, trim: true, maxlength: 2000 },

        // Gamification
        XPReward: { type: Number, default: 100 },
        XPEarned: { type: Number, default: 0 },
        CompletedEarly: { type: Boolean, default: false },

        // Tags
        Tags: { type: [String], default: [] },

        // AI-generated flag
        AIGenerated: { type: Boolean, default: false },
        AIPrompt: { type: String },

        // Linked items
        LinkedTaskIDs: { type: [String], default: [] },
        LinkedHabitIDs: { type: [String], default: [] },

        // Visibility
        IsPublic: { type: Boolean, default: false },

        // Archived
        Archived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ProductivityGoal_Schema.index({ UserID: 1, Status: 1 });
ProductivityGoal_Schema.index({ UserID: 1, Type: 1 });
ProductivityGoal_Schema.index({ UserID: 1, Category: 1 });
ProductivityGoal_Schema.index({ UserID: 1, TargetDate: 1 });

export interface IMilestone {
    id: string;
    Title: string;
    Description?: string;
    TargetDate?: Date;
    Status: MilestoneStatus;
    CompletedAt?: Date;
    XPReward: number;
    SortOrder: number;
}

export interface IGoalProgressUpdate {
    Date: Date;
    Value: number;
    Note?: string;
}

export interface IProductivityGoal extends mongoose.Document {
    GoalID: string;
    UserID: string;
    Title: string;
    Description?: string;
    Category: GoalCategory;
    Emoji: string;
    Color: string;
    Type: GoalType;
    Status: GoalStatus;
    StartDate: Date;
    TargetDate?: Date;
    CompletedAt?: Date;
    ProgressType: "PERCENTAGE" | "NUMERIC" | "BOOLEAN";
    ProgressTarget: number;
    ProgressCurrent: number;
    ProgressUnit?: string;
    ProgressHistory: IGoalProgressUpdate[];
    Milestones: IMilestone[];
    Motivation?: string;
    XPReward: number;
    XPEarned: number;
    CompletedEarly: boolean;
    Tags: string[];
    AIGenerated: boolean;
    AIPrompt?: string;
    LinkedTaskIDs: string[];
    LinkedHabitIDs: string[];
    IsPublic: boolean;
    Archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const ProductivityGoal: mongoose.Model<IProductivityGoal> =
    mongoose.models.ProductivityGoal ||
    mongoose.model<IProductivityGoal>("ProductivityGoal", ProductivityGoal_Schema);
