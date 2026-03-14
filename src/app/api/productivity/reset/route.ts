/**
 * POST /api/productivity/reset  — wipe all productivity data, record reset date
 * GET  /api/productivity/reset  — fetch reset history (dates only)
 *
 * Reset deletes all Tasks, Habits, Goals, Reminders for the user
 * and resets UserProductivityStats to zero while preserving ResetHistory.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { ProductivityTask }         from "@Models/ProductivityTask";
import { ProductivityHabit }        from "@Models/ProductivityHabit";
import { ProductivityGoal }         from "@Models/ProductivityGoal";
import { ProductivityReminder }     from "@Models/ProductivityReminder";
import { UserProductivityStats }    from "@Models/UserProductivityStats";

// ─── GET — reset history ───────────────────────────────────────────────────────

export async function GET() {
    try {
        await dbConnect();
        const h    = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const stats = await UserProductivityStats.findOne({ UserID: user.userId }).lean();
        const history: Date[] = (stats as any)?.ResetHistory ?? [];

        return NextResponse.json({ success: true, data: history });
    } catch (err) {
        console.error("GET /api/productivity/reset:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch reset history" }, { status: 500 });
    }
}

// ─── POST — full wipe ─────────────────────────────────────────────────────────

export async function POST(_req: NextRequest) {
    try {
        await dbConnect();
        const h    = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const userId   = user.userId;
        const resetAt  = new Date();

        // Delete all productivity records for this user
        await Promise.all([
            ProductivityTask.deleteMany({ UserID: userId }),
            ProductivityHabit.deleteMany({ UserID: userId }),
            ProductivityGoal.deleteMany({ UserID: userId }),
            ProductivityReminder.deleteMany({ UserID: userId }),
        ]);

        // Reset stats — zero everything but append reset date to history
        await UserProductivityStats.updateOne(
            { UserID: userId },
            {
                $set: {
                    TotalXP:                     0,
                    Level:                       1,
                    LevelTitle:                  "Beginner",
                    TotalTasksCreated:           0,
                    TotalTasksCompleted:         0,
                    TotalTasksCancelled:         0,
                    TotalTasksEarlyCompletion:   0,
                    TotalHabitsCreated:          0,
                    TotalHabitCompletions:       0,
                    BestHabitStreak:             0,
                    TotalGoalsCreated:           0,
                    TotalGoalsCompleted:         0,
                    TotalMilestonesCompleted:    0,
                    TotalRemindersCreated:       0,
                    TotalRemindersFired:         0,
                    DailyStreak:                 0,
                    LongestDailyStreak:          0,
                    LastActiveDate:              null,
                    EarnedAchievements:          [],
                    XPHistory:                   [],
                    AITasksCreated:              0,
                    AISearchesPerformed:         0,
                },
                $push: { ResetHistory: resetAt },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, resetAt });
    } catch (err) {
        console.error("POST /api/productivity/reset:", err);
        return NextResponse.json({ success: false, error: "Failed to reset data" }, { status: 500 });
    }
}
