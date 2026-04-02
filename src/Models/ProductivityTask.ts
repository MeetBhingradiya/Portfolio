/**
 * ProductivityTask Mongoose Model
 * Simple task with done/undone XP, soft-delete (hidden), and hard-delete.
 *
 * Status lifecycle:
 *   PENDING  → user marks done  → COMPLETED  (XP awarded)
 *   COMPLETED→ user undoes (3-dot menu) → PENDING (XP removed)
 *   PENDING/COMPLETED → primary delete button → HIDDEN (soft delete, XP untouched)
 *   PENDING/COMPLETED/HIDDEN → "Delete" in 3-dot menu → record removed from DB + XP revoked
 */

import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Attachment sub-schema ────────────────────────────────────────────────────

const AttachmentSchema = new mongoose.Schema(
    {
        AssetID: { type: String, required: true },
        URL: { type: String, required: true },
        FileName: { type: String, required: true },
        FileType: { type: String, required: true }, // MIME type
        FileSize: { type: Number, required: true }, // bytes
        UploadedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TaskStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    HIDDEN = "HIDDEN" // soft-deleted; not shown in normal lists
}

export enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}

export enum TaskCategory {
    PERSONAL = "PERSONAL",
    WORK = "WORK",
    HEALTH = "HEALTH",
    EDUCATION = "EDUCATION",
    FINANCE = "FINANCE",
    SOCIAL = "SOCIAL",
    HOBBY = "HOBBY",
    OTHER = "OTHER"
}

// ─── XP per priority ──────────────────────────────────────────────────────────

export const XP_REWARDS = {
    [TaskPriority.LOW]: 5,
    [TaskPriority.MEDIUM]: 10,
    [TaskPriority.HIGH]: 20,
    [TaskPriority.URGENT]: 35
} as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

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
            default: TaskCategory.PERSONAL
        },
        Tags: { type: [String], default: [] },

        // Status & Priority
        Status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.PENDING
        },
        Priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.MEDIUM
        },

        // Scheduling
        DueDate: { type: Date },

        // Gamification
        XPReward: { type: Number, default: 10 },
        XPEarned: { type: Number, default: 0 },

        // Attachments
        Attachments: { type: [AttachmentSchema], default: [] },

        // Completion
        CompletedAt: { type: Date }
    },
    { timestamps: true }
);

ProductivityTask_Schema.index({ UserID: 1, Status: 1 });
ProductivityTask_Schema.index({ UserID: 1, DueDate: 1 });
ProductivityTask_Schema.index({ UserID: 1, Priority: 1 });
ProductivityTask_Schema.index({ Title: "text", Description: "text", Tags: "text" }, { weights: { Title: 10, Tags: 5, Description: 1 } });

export interface ITaskAttachment {
    AssetID: string;
    URL: string;
    FileName: string;
    FileType: string;
    FileSize: number;
    UploadedAt: Date;
}

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
    XPReward: number;
    XPEarned: number;
    Attachments: ITaskAttachment[];
    CompletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export const ProductivityTask: mongoose.Model<IProductivityTask> =
    mongoose.models.ProductivityTask || mongoose.model<IProductivityTask>("ProductivityTask", ProductivityTask_Schema);
