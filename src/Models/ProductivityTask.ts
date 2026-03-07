/**
 * ProductivityTask Mongoose Model
 * Gamified task model with priorities, due dates, XP rewards, and tags.
 */

import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT",
}

export enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    OVERDUE = "OVERDUE",
}

export enum TaskCategory {
    PERSONAL = "PERSONAL",
    WORK = "WORK",
    HEALTH = "HEALTH",
    EDUCATION = "EDUCATION",
    FINANCE = "FINANCE",
    SOCIAL = "SOCIAL",
    HOBBY = "HOBBY",
    OTHER = "OTHER",
}

export enum RepeatType {
    NONE = "NONE",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY",
    CUSTOM = "CUSTOM",
}

// ─── XP Rewards ──────────────────────────────────────────────────────────────

export const XP_REWARDS = {
    [TaskPriority.LOW]: 5,
    [TaskPriority.MEDIUM]: 10,
    [TaskPriority.HIGH]: 20,
    [TaskPriority.URGENT]: 35,
    EARLY_COMPLETION_BONUS: 10,
    STREAK_BONUS: 5,
} as const;

// ─── Schema ──────────────────────────────────────────────────────────────────

const SubTaskSchema = new mongoose.Schema(
    {
        id: { type: String, default: v4 },
        text: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
    },
    { _id: false }
);

const ProductivityTask_Schema = new mongoose.Schema(
    {
        TaskID: { type: String, default: v4, unique: true, index: true },
        UserID: { type: String, required: true, index: true },

        // Content
        Title: { type: String, required: true, trim: true, maxlength: 500 },
        Description: { type: String, trim: true, maxlength: 5000 },
        Category: {
            type: String,
            enum: Object.values(TaskCategory),
            default: TaskCategory.PERSONAL,
        },
        Tags: { type: [String], default: [] },

        // Status & Priority
        Status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.PENDING,
        },
        Priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.MEDIUM,
        },

        // Scheduling
        DueDate: { type: Date },
        StartDate: { type: Date },
        ReminderAt: { type: Date },
        Repeat: {
            type: String,
            enum: Object.values(RepeatType),
            default: RepeatType.NONE,
        },
        RepeatInterval: { type: Number, default: 1 },
        RepeatDaysOfWeek: { type: [Number], default: [] }, // 0=Sun…6=Sat

        // Sub-tasks
        SubTasks: { type: [SubTaskSchema], default: [] },

        // Gamification
        XPReward: { type: Number, default: 10 },
        XPEarned: { type: Number, default: 0 },
        EarlyCompletionBonus: { type: Number, default: 0 },

        // Completion
        CompletedAt: { type: Date },
        CompletedEarly: { type: Boolean, default: false },

        // AI-generated flag
        AIGenerated: { type: Boolean, default: false },
        AIPrompt: { type: String },

        // Linked goal
        GoalID: { type: String },

        // Attachments (CDN URLs)
        Attachments: { type: [String], default: [] },

        // Notes (OCR / manual)
        Notes: { type: String, trim: true },

        // Sort order (for drag-drop)
        SortOrder: { type: Number, default: 0 },

        // Soft delete
        Archived: { type: Boolean, default: false },
        ArchivedAt: { type: Date },
    },
    { timestamps: true }
);

ProductivityTask_Schema.index({ UserID: 1, Status: 1 });
ProductivityTask_Schema.index({ UserID: 1, DueDate: 1 });
ProductivityTask_Schema.index({ UserID: 1, Category: 1 });
ProductivityTask_Schema.index({ UserID: 1, Priority: 1 });
ProductivityTask_Schema.index(
    { Title: "text", Description: "text", Tags: "text" },
    { weights: { Title: 10, Tags: 5, Description: 1 } }
);

export interface IProductivityTask extends mongoose.Document {
    TaskID: string;
    UserID: string;
    Title: string;
    Description?: string;
    Category: TaskCategory;
    Tags: string[];
    Status: TaskStatus;
    Priority: TaskPriority;
    DueDate?: Date;
    StartDate?: Date;
    ReminderAt?: Date;
    Repeat: RepeatType;
    RepeatInterval: number;
    RepeatDaysOfWeek: number[];
    SubTasks: Array<{
        id: string;
        text: string;
        completed: boolean;
        completedAt?: Date;
    }>;
    XPReward: number;
    XPEarned: number;
    EarlyCompletionBonus: number;
    CompletedAt?: Date;
    CompletedEarly: boolean;
    AIGenerated: boolean;
    AIPrompt?: string;
    GoalID?: string;
    Attachments: string[];
    Notes?: string;
    SortOrder: number;
    Archived: boolean;
    ArchivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export const ProductivityTask: mongoose.Model<IProductivityTask> =
    mongoose.models.ProductivityTask ||
    mongoose.model<IProductivityTask>("ProductivityTask", ProductivityTask_Schema);
