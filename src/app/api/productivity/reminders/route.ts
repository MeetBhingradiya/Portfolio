/**
 * GET  /api/productivity/reminders   – list reminders
 * POST /api/productivity/reminders   – create reminder
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import {
    ProductivityReminder,
    ReminderRepeat,
    ReminderStatus,
    ReminderPriority,
} from "@Models/ProductivityReminder";
import { UserProductivityStats, getOrCreateStats } from "@Models/UserProductivityStats";

/** Compute the next fire time for a repeating reminder */
function computeNextFire(scheduledAt: Date, repeat: ReminderRepeat, repeatDays: number[]): Date | null {
    if (repeat === ReminderRepeat.NONE) return null;

    const now = new Date();
    const base = new Date(scheduledAt);
    // Use today with the same time
    const candidate = new Date(now);
    candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);

    if (candidate <= now) {
        candidate.setDate(candidate.getDate() + 1);
    }

    switch (repeat) {
        case ReminderRepeat.DAILY:
            return candidate;
        case ReminderRepeat.WEEKDAYS:
            while ([0, 6].includes(candidate.getDay())) {
                candidate.setDate(candidate.getDate() + 1);
            }
            return candidate;
        case ReminderRepeat.WEEKENDS:
            while (![0, 6].includes(candidate.getDay())) {
                candidate.setDate(candidate.getDate() + 1);
            }
            return candidate;
        case ReminderRepeat.WEEKLY:
            candidate.setDate(candidate.getDate() + ((7 - candidate.getDay() + base.getDay()) % 7 || 7));
            return candidate;
        case ReminderRepeat.BIWEEKLY:
            candidate.setDate(candidate.getDate() + 14);
            return candidate;
        case ReminderRepeat.MONTHLY: {
            const next = new Date(now);
            next.setMonth(next.getMonth() + 1);
            next.setDate(base.getDate());
            next.setHours(base.getHours(), base.getMinutes(), 0, 0);
            return next;
        }
        case ReminderRepeat.YEARLY: {
            const next = new Date(base);
            next.setFullYear(now.getFullYear() + 1);
            return next;
        }
        case ReminderRepeat.CUSTOM:
            if (repeatDays.length === 0) return null;
            while (!repeatDays.includes(candidate.getDay())) {
                candidate.setDate(candidate.getDate() + 1);
            }
            return candidate;
        default:
            return null;
    }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const status = q.get("status");
        const archived = q.get("archived") === "true";
        const upcoming = q.get("upcoming") === "true";
        const linkedTaskId = q.get("linkedTaskId");

        const query: Record<string, unknown> = { UserID: user.userId, Archived: archived };

        if (status) query.Status = status;
        if (linkedTaskId) query.LinkedTaskID = linkedTaskId;
        if (upcoming) {
            const now = new Date();
            const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            query.NextFireAt = { $gte: now, $lte: in24h };
            query.Status = ReminderStatus.ACTIVE;
        }

        const reminders = await ProductivityReminder.find(query)
            .sort({ ScheduledAt: 1, Priority: -1 })
            .lean();

        return NextResponse.json({ success: true, data: reminders });
    } catch (err) {
        console.error("GET /api/productivity/reminders:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch reminders" }, { status: 500 });
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            Title,
            Description,
            Emoji = "🔔",
            Color = "#FF9500",
            ScheduledAt,
            Repeat = ReminderRepeat.NONE,
            RepeatDaysOfWeek = [],
            RepeatEndDate,
            Priority = ReminderPriority.NORMAL,
            LinkedTaskID,
            LinkedHabitID,
            LinkedGoalID,
            NotificationChannels = ["browser"],
            Tags = [],
        } = body;

        if (!Title?.trim()) {
            return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
        }
        if (!ScheduledAt) {
            return NextResponse.json({ success: false, error: "ScheduledAt is required" }, { status: 400 });
        }

        const scheduledDate = new Date(ScheduledAt);
        const nextFire = computeNextFire(scheduledDate, Repeat, RepeatDaysOfWeek) ?? scheduledDate;

        const reminder = await ProductivityReminder.create({
            UserID: user.userId,
            Title: Title.trim(),
            Description: Description?.trim(),
            Emoji,
            Color,
            ScheduledAt: scheduledDate,
            Repeat,
            RepeatDaysOfWeek,
            RepeatEndDate: RepeatEndDate ? new Date(RepeatEndDate) : undefined,
            Priority,
            Status: ReminderStatus.ACTIVE,
            NextFireAt: nextFire,
            LinkedTaskID,
            LinkedHabitID,
            LinkedGoalID,
            NotificationChannels,
            Tags,
        });

        // Update stats
        const stats = await getOrCreateStats(user.userId);
        const isFirst = stats.TotalRemindersCreated === 0;

        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $inc: { TotalRemindersCreated: 1 },
                ...(isFirst
                    ? {
                        $push: {
                            EarnedAchievements: { id: "first_reminder", EarnedAt: new Date(), XPAwarded: 15 },
                            XPHistory: {
                                Amount: 15,
                                Reason: "Achievement: Never Forget",
                                Source: "achievement",
                                SourceID: "first_reminder",
                                EarnedAt: new Date(),
                            },
                        },
                        $inc: { TotalXP: 15 },
                    }
                    : {}),
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, data: reminder }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/reminders:", err);
        return NextResponse.json({ success: false, error: "Failed to create reminder" }, { status: 500 });
    }
}
