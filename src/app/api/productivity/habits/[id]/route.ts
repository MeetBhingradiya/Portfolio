/**
 * GET    /api/productivity/habits/[id]          – get habit
 * PUT    /api/productivity/habits/[id]          – update habit
 * DELETE /api/productivity/habits/[id]          – delete habit
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { ProductivityHabit } from "@Models/ProductivityHabit";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const habit = await ProductivityHabit.findOne({
            HabitID: id,
            UserID: user.userId,
        }).lean();

        if (!habit) return NextResponse.json({ success: false, error: "Habit not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: habit });
    } catch (err) {
        console.error("GET /api/productivity/habits/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch habit" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const allowed = [
            "Title", "Description", "Category", "Difficulty", "Emoji", "Color",
            "Frequency", "FrequencyDays", "FrequencyTimesPerPeriod",
            "TargetValue", "TargetUnit", "GoalID", "ReminderEnabled", "ReminderTime",
            "StartDate", "EndDate", "SortOrder", "IsActive", "Archived",
        ];

        const update: Record<string, unknown> = {};
        for (const key of allowed) {
            if (key in body) update[key] = body[key];
        }

        const updated = await ProductivityHabit.findOneAndUpdate(
            { HabitID: id, UserID: user.userId },
            { $set: update },
            { new: true }
        ).lean();

        if (!updated) return NextResponse.json({ success: false, error: "Habit not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        console.error("PUT /api/productivity/habits/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to update habit" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const deleted = await ProductivityHabit.findOneAndDelete({
            HabitID: id,
            UserID: user.userId,
        });

        if (!deleted) return NextResponse.json({ success: false, error: "Habit not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: "Habit deleted" });
    } catch (err) {
        console.error("DELETE /api/productivity/habits/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to delete habit" }, { status: 500 });
    }
}
