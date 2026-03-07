/**
 * ProductivityReminder Mongoose Model
 * Scheduled reminders with repeat options and notification support.
 */

import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ReminderRepeat {
    NONE = "NONE",
    DAILY = "DAILY",
    WEEKDAYS = "WEEKDAYS",  // Mon–Fri
    WEEKENDS = "WEEKENDS",  // Sat–Sun
    WEEKLY = "WEEKLY",
    BIWEEKLY = "BIWEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY",
    CUSTOM = "CUSTOM",
}

export enum ReminderStatus {
    ACTIVE = "ACTIVE",
    SNOOZED = "SNOOZED",
    DISMISSED = "DISMISSED",
    COMPLETED = "COMPLETED",
}

export enum ReminderPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL",
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const ProductivityReminder_Schema = new mongoose.Schema(
    {
        ReminderID: { type: String, default: v4, unique: true, index: true },
        UserID: { type: String, required: true, index: true },

        // Content
        Title: { type: String, required: true, trim: true, maxlength: 500 },
        Description: { type: String, trim: true, maxlength: 2000 },
        Emoji: { type: String, default: "🔔" },
        Color: { type: String, default: "#FF9500" },

        // Scheduling
        ScheduledAt: { type: Date, required: true },
        Repeat: {
            type: String,
            enum: Object.values(ReminderRepeat),
            default: ReminderRepeat.NONE,
        },
        RepeatDaysOfWeek: { type: [Number], default: [] }, // 0=Sun…6=Sat (for CUSTOM)
        RepeatEndDate: { type: Date }, // When to stop repeating

        // Status
        Status: {
            type: String,
            enum: Object.values(ReminderStatus),
            default: ReminderStatus.ACTIVE,
        },
        Priority: {
            type: String,
            enum: Object.values(ReminderPriority),
            default: ReminderPriority.NORMAL,
        },

        // Snooze
        SnoozedUntil: { type: Date },
        SnoozeCount: { type: Number, default: 0 },

        // Fired tracking
        LastFiredAt: { type: Date },
        NextFireAt: { type: Date },
        FireCount: { type: Number, default: 0 },

        // Linked items
        LinkedTaskID: { type: String },
        LinkedHabitID: { type: String },
        LinkedGoalID: { type: String },

        // Notification
        NotificationSent: { type: Boolean, default: false },
        NotificationChannels: {
            type: [String],
            default: ["browser"],
            enum: ["browser", "email"],
        },

        // Tags
        Tags: { type: [String], default: [] },

        // Archived
        Archived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ProductivityReminder_Schema.index({ UserID: 1, ScheduledAt: 1 });
ProductivityReminder_Schema.index({ UserID: 1, Status: 1 });
ProductivityReminder_Schema.index({ UserID: 1, NextFireAt: 1 });

export interface IProductivityReminder extends mongoose.Document {
    ReminderID: string;
    UserID: string;
    Title: string;
    Description?: string;
    Emoji: string;
    Color: string;
    ScheduledAt: Date;
    Repeat: ReminderRepeat;
    RepeatDaysOfWeek: number[];
    RepeatEndDate?: Date;
    Status: ReminderStatus;
    Priority: ReminderPriority;
    SnoozedUntil?: Date;
    SnoozeCount: number;
    LastFiredAt?: Date;
    NextFireAt?: Date;
    FireCount: number;
    LinkedTaskID?: string;
    LinkedHabitID?: string;
    LinkedGoalID?: string;
    NotificationSent: boolean;
    NotificationChannels: string[];
    Tags: string[];
    Archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const ProductivityReminder: mongoose.Model<IProductivityReminder> =
    mongoose.models.ProductivityReminder ||
    mongoose.model<IProductivityReminder>("ProductivityReminder", ProductivityReminder_Schema);
