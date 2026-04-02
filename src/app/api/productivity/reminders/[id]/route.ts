/**
 * GET    /api/productivity/reminders/[id]   – get reminder
 * PUT    /api/productivity/reminders/[id]   – update / snooze / dismiss
 * DELETE /api/productivity/reminders/[id]   – delete reminder
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { ProductivityReminder, ReminderStatus } from "@Models/ProductivityReminder";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const reminder = await ProductivityReminder.findOne({
            ReminderID: id,
            UserID: user.userId
        }).lean();

        if (!reminder) return NextResponse.json({ success: false, error: "Reminder not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: reminder });
    } catch (err) {
        console.error("GET /api/productivity/reminders/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch reminder" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const allowed = [
            "Title",
            "Description",
            "ScheduledAt",
            "Repeat",
            "RepeatDaysOfWeek",
            "Status",
            "Priority",
            "SnoozedUntil",
            "LinkedTaskID",
            "NotificationChannels",
            "Tags",
            "Archived"
        ];

        const update: Record<string, unknown> = {};
        for (const key of allowed) {
            if (key in body) {
                update[key] = ["ScheduledAt", "SnoozedUntil"].includes(key) && body[key] ? new Date(body[key] as string) : body[key];
            }
        }

        // Snooze action
        if (body.action === "snooze" && body.snoozeMinutes) {
            const until = new Date(Date.now() + (body.snoozeMinutes as number) * 60 * 1000);
            update.Status = ReminderStatus.SNOOZED;
            update.SnoozedUntil = until;
        }

        // Dismiss action
        if (body.action === "dismiss") {
            update.Status = ReminderStatus.DISMISSED;
        }

        const updated = await ProductivityReminder.findOneAndUpdate(
            { ReminderID: id, UserID: user.userId },
            { $set: update },
            { new: true }
        ).lean();

        if (!updated) return NextResponse.json({ success: false, error: "Reminder not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        console.error("PUT /api/productivity/reminders/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to update reminder" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const deleted = await ProductivityReminder.findOneAndDelete({
            ReminderID: id,
            UserID: user.userId
        });

        if (!deleted) return NextResponse.json({ success: false, error: "Reminder not found" }, { status: 404 });
        return NextResponse.json({
            success: true,
            message: "Reminder deleted"
        });
    } catch (err) {
        console.error("DELETE /api/productivity/reminders/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to delete reminder" }, { status: 500 });
    }
}
