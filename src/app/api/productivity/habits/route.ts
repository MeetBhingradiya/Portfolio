/**
 * GET  /api/productivity/habits   – list habits (requires Tools.Private.Productivity.Access)
 * POST /api/productivity/habits   – create habit (requires Tools.Private.Productivity.Access)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser, hasPermission } from "@Utils/RolePermissions";
import { ProductivityHabit, HabitFrequency, HabitCategory, HabitDifficulty } from "@Models/ProductivityHabit";
import { UserProductivityStats, getOrCreateStats } from "@Models/UserProductivityStats";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Check permission to access productivity tool
        const canAccess = await hasPermission(req.headers, "Tools.Private.Productivity.Access");
        if (!canAccess) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Permission required: Tools.Private.Productivity.Access" },
                { status: 403 }
            );
        }

        const q = req.nextUrl.searchParams;
        const category = q.get("category");
        const frequency = q.get("frequency");
        const archived = q.get("archived") === "true";

        const query: Record<string, unknown> = {
            UserID: user.userId,
            Archived: archived,
            IsActive: true
        };
        if (archived) delete (query as Record<string, unknown>).IsActive;
        if (category) query.Category = category;
        if (frequency) query.Frequency = frequency;

        const habits = await ProductivityHabit.find(query).sort({ CurrentStreak: -1, createdAt: -1 }).lean();

        // Annotate with today's completion flag
        const today = new Date().toISOString().split("T")[0];
        const habitsWithToday = habits.map((habit) => ({
            ...habit,
            completedToday: habit.CompletionHistory?.some((c: { Date: string }) => c.Date === today) ?? false
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

        // Check permission to access productivity tool
        const canAccess = await hasPermission(req.headers, "Tools.Private.Productivity.Access");
        if (!canAccess) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Permission required: Tools.Private.Productivity.Access" },
                { status: 403 }
            );
        }

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
            ReminderEnabled = false,
            ReminderTime,
            StartDate,
            EndDate
        } = body;

        if (!Title?.trim()) {
            return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
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
            ReminderEnabled,
            ReminderTime,
            StartDate,
            EndDate
        });

        // Stats + first-habit achievement
        const stats = await getOrCreateStats(user.userId);
        const isFirst = stats.TotalHabitsCreated === 0;

        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $inc: {
                    TotalHabitsCreated: 1,
                    ...(isFirst ? { TotalXP: 20 } : {})
                },
                ...(isFirst
                    ? {
                          $push: {
                              EarnedAchievements: {
                                  id: "first_habit",
                                  EarnedAt: new Date(),
                                  XPAwarded: 20
                              },
                              XPHistory: {
                                  Amount: 20,
                                  Reason: "Achievement: New Habit",
                                  Source: "achievement",
                                  SourceID: "first_habit",
                                  EarnedAt: new Date()
                              }
                          }
                      }
                    : {})
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, data: habit }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/habits:", err);
        return NextResponse.json({ success: false, error: "Failed to create habit" }, { status: 500 });
    }
}
