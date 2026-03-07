/**
 * GET  /api/productivity/habits   – list habits
 * POST /api/productivity/habits   – create habit
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import {
    ProductivityHabit,
    HabitFrequency,
    HabitCategory,
    HabitDifficulty,
} from "@Models/ProductivityHabit";
import {
    UserProductivityStats,
    getOrCreateStats,
} from "@Models/UserProductivityStats";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const category = q.get("category");
        const frequency = q.get("frequency");
        const archived = q.get("archived") === "true";
        const goalId = q.get("goalId");

        const query: Record<string, unknown> = {
            UserID: user.userId,
            Archived: archived,
            IsActive: true,
        };

        if (archived) delete (query as Record<string, unknown>).IsActive;
        if (category) query.Category = category;
        if (frequency) query.Frequency = frequency;
        if (goalId) query.GoalID = goalId;

        const habits = await ProductivityHabit.find(query)
            .sort({ SortOrder: 1, CurrentStreak: -1, createdAt: -1 })
            .lean();

        // Add today's completion flag
        const today = new Date().toISOString().split("T")[0];
        const habitsWithToday = habits.map((habit) => ({
            ...habit,
            completedToday: habit.CompletionHistory?.some(
                (c: { Date: string }) => c.Date === today
            ) ?? false,
        }));

        return NextResponse.json({ success: true, data: habitsWithToday });
    } catch (err) {
        console.error("GET /api/productivity/habits:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch habits" }, { status: 500 });
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
            Category = HabitCategory.OTHER,
            Difficulty = HabitDifficulty.MEDIUM,
            Emoji = "✅",
            Color = "#5E97F6",
            Frequency = HabitFrequency.DAILY,
            FrequencyDays = [0, 1, 2, 3, 4, 5, 6],
            FrequencyTimesPerPeriod = 1,
            TargetValue,
            TargetUnit,
            GoalID,
            ReminderEnabled = false,
            ReminderTime,
            StartDate,
            EndDate,
            SortOrder = 0,
            AIGenerated = false,
        } = body;

        if (!Title?.trim()) {
            return NextResponse.json(
                { success: false, error: "Title is required" },
                { status: 400 }
            );
        }

        const habit = await ProductivityHabit.create({
            UserID: user.userId,
            Title: Title.trim(),
            Description: Description?.trim(),
            Category,
            Difficulty,
            Emoji,
            Color,
            Frequency,
            FrequencyDays,
            FrequencyTimesPerPeriod,
            TargetValue,
            TargetUnit: TargetUnit?.trim(),
            GoalID,
            ReminderEnabled,
            ReminderTime,
            StartDate,
            EndDate,
            SortOrder,
            AIGenerated,
        });

        // Update stats
        const stats = await getOrCreateStats(user.userId);
        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            { $inc: { TotalHabitsCreated: 1 } },
            { upsert: true }
        );

        // Check "first_habit" achievement
        if (stats.TotalHabitsCreated === 0) {
            await UserProductivityStats.updateOne(
                { UserID: user.userId },
                {
                    $push: {
                        EarnedAchievements: { id: "first_habit", EarnedAt: new Date(), XPAwarded: 20 },
                        XPHistory: {
                            Amount: 20,
                            Reason: "Achievement: New Habit",
                            Source: "achievement",
                            SourceID: "first_habit",
                            EarnedAt: new Date(),
                        },
                    },
                    $inc: { TotalXP: 20 },
                }
            );
        }

        return NextResponse.json({ success: true, data: habit }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/habits:", err);
        return NextResponse.json({ success: false, error: "Failed to create habit" }, { status: 500 });
    }
}
