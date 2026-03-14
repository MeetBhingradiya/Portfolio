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
import { UserProductivityStats } from "@Models/UserProductivityStats";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q            = req.nextUrl.searchParams;
        const status       = q.get("status");
        const archived     = q.get("archived") === "true";
        const linkedTaskId = q.get("linkedTaskId");

        const query: Record<string, unknown> = { UserID: user.userId, Archived: archived };

        if (status)       query.Status       = status;
        if (linkedTaskId) query.LinkedTaskID = linkedTaskId;

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
            ScheduledAt,
            Repeat             = ReminderRepeat.NONE,
            RepeatDaysOfWeek   = [],
            Priority           = ReminderPriority.NORMAL,
            LinkedTaskID,
            NotificationChannels = ["browser"],
            Tags               = [],
        } = body;

        if (!Title?.trim()) {
            return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
        }
        if (!ScheduledAt) {
            return NextResponse.json({ success: false, error: "ScheduledAt is required" }, { status: 400 });
        }

        const reminder = await ProductivityReminder.create({
            UserID:              user.userId,
            Title:               Title.trim(),
            Description:         Description?.trim(),
            ScheduledAt:         new Date(ScheduledAt),
            Repeat,
            RepeatDaysOfWeek,
            Priority,
            Status:              ReminderStatus.ACTIVE,
            LinkedTaskID,
            NotificationChannels,
            Tags,
        });

        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            { $inc: { TotalRemindersCreated: 1 } },
            { upsert: true }
        );

        return NextResponse.json({ success: true, data: reminder }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/reminders:", err);
        return NextResponse.json({ success: false, error: "Failed to create reminder" }, { status: 500 });
    }
}
