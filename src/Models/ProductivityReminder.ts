/**
 * ProductivityReminder Mongoose Model
 * An extension of a Task — adds a scheduled fire time and notification
 * channels. Can optionally be linked to an existing Task.
 *
 * Repeat options mirror Habit frequency (daily / weekly / monthly / yearly).
 */

import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ReminderRepeat {
    NONE = "NONE",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}

export enum ReminderStatus {
    ACTIVE = "ACTIVE",
    SNOOZED = "SNOOZED",
    DISMISSED = "DISMISSED"
}

export enum ReminderPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProductivityReminder_Schema = new mongoose.Schema(
    {
        ReminderID: { type: String, default: v4, unique: true, index: true },
        UserID: { type: String, required: true, index: true },

        // Content (own title/description — reminders may be standalone or linked)
        Title: { type: String, required: true, trim: true, maxlength: 500 },
        Description: { type: String, trim: true, maxlength: 2000 },

        // Optional link to a Task this reminder belongs to
        LinkedTaskID: { type: String },

        // Scheduling
        ScheduledAt: { type: Date, required: true },
        Repeat: {
            type: String,
            enum: Object.values(ReminderRepeat),
            default: ReminderRepeat.NONE
        },
        // Which days of the week to repeat (0=Sun…6=Sat); used when Repeat=WEEKLY
        RepeatDaysOfWeek: { type: [Number], default: [] },

        // Status
        Status: {
            type: String,
            enum: Object.values(ReminderStatus),
            default: ReminderStatus.ACTIVE
        },
        Priority: {
            type: String,
            enum: Object.values(ReminderPriority),
            default: ReminderPriority.NORMAL
        },

        // Snooze
        SnoozedUntil: { type: Date },

        // Notification channels
        NotificationChannels: {
            type: [String],
            default: ["browser"],
            enum: ["browser", "email"]
        },

        // Tags
        Tags: { type: [String], default: [] },

        // Soft delete
        Archived: { type: Boolean, default: false }
    },
    { timestamps: true }
);

ProductivityReminder_Schema.index({ UserID: 1, ScheduledAt: 1 });
ProductivityReminder_Schema.index({ UserID: 1, Status: 1 });

export interface IProductivityReminder extends mongoose.Document {
    ReminderID: string;
    UserID: string;
    Title: string;
    Description?: string;
    LinkedTaskID?: string;
    ScheduledAt: Date;
    Repeat: ReminderRepeat;
    RepeatDaysOfWeek: number[];
    Status: ReminderStatus;
    Priority: ReminderPriority;
    SnoozedUntil?: Date;
    NotificationChannels: string[];
    Tags: string[];
    Archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const ProductivityReminder: mongoose.Model<IProductivityReminder> =
    mongoose.models.ProductivityReminder || mongoose.model<IProductivityReminder>("ProductivityReminder", ProductivityReminder_Schema);
