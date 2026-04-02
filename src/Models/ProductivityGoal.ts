/**
 * ProductivityGoal Mongoose Model
 * A Goal is simply a named group of Tasks, Habits, and/or Reminders.
 * Completing all linked items (or manually marking done) awards XP.
 */

import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum GoalStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    ABANDONED = "ABANDONED"
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
    OTHER = "OTHER"
}

// ─── XP reward ────────────────────────────────────────────────────────────────

export const GOAL_XP = 100 as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

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
            default: GoalCategory.OTHER
        },
        Emoji: { type: String, default: "🎯" },
        Color: { type: String, default: "#AF52DE" },

        // Status
        Status: {
            type: String,
            enum: Object.values(GoalStatus),
            default: GoalStatus.NOT_STARTED
        },

        // Dates
        StartDate: { type: Date, default: Date.now },
        TargetDate: { type: Date },
        CompletedAt: { type: Date },

        // Linked items — the "group" core
        LinkedTaskIDs: { type: [String], default: [] },
        LinkedHabitIDs: { type: [String], default: [] },
        LinkedReminderIDs: { type: [String], default: [] },

        // Gamification
        XPReward: { type: Number, default: GOAL_XP },
        XPEarned: { type: Number, default: 0 },

        // Tags
        Tags: { type: [String], default: [] },

        // Soft delete
        Archived: { type: Boolean, default: false }
    },
    { timestamps: true }
);

ProductivityGoal_Schema.index({ UserID: 1, Status: 1 });
ProductivityGoal_Schema.index({ UserID: 1, Category: 1 });
ProductivityGoal_Schema.index({ UserID: 1, TargetDate: 1 });

export interface IProductivityGoal extends mongoose.Document {
    GoalID: string;
    UserID: string;
    Title: string;
    Description?: string;
    Category: GoalCategory;
    Emoji: string;
    Color: string;
    Status: GoalStatus;
    StartDate: Date;
    TargetDate?: Date;
    CompletedAt?: Date;
    LinkedTaskIDs: string[];
    LinkedHabitIDs: string[];
    LinkedReminderIDs: string[];
    XPReward: number;
    XPEarned: number;
    Tags: string[];
    Archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const ProductivityGoal: mongoose.Model<IProductivityGoal> =
    mongoose.models.ProductivityGoal || mongoose.model<IProductivityGoal>("ProductivityGoal", ProductivityGoal_Schema);
