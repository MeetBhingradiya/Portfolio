/**
 * POST /api/productivity/habits/[id]/complete
 * Mark a habit as completed for today (or a specific date).
 * Handles streak calculation and XP award.
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { ProductivityHabit, HABIT_XP, HabitDifficulty } from "@Models/ProductivityHabit";
import { UserProductivityStats, getOrCreateStats, computeLevel, ACHIEVEMENTS } from "@Models/UserProductivityStats";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { date, note } = body as { date?: string; note?: string };

        const targetDate = date ?? new Date().toISOString().split("T")[0];

        const habit = await ProductivityHabit.findOne({
            HabitID: id,
            UserID: user.userId
        });

        if (!habit) {
            return NextResponse.json({ success: false, error: "Habit not found" }, { status: 404 });
        }

        // Check already completed today
        const alreadyDone = habit.CompletionHistory.some((c) => c.Date === targetDate);
        if (alreadyDone) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Habit already completed for this date"
                },
                { status: 409 }
            );
        }

        // Compute streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const wasYesterday = habit.LastCompletedDate === yesterdayStr;
        const isToday = habit.LastCompletedDate === targetDate;

        let newStreak = 1;
        if (wasYesterday || isToday) {
            newStreak = habit.CurrentStreak + 1;
        }

        const newLongest = Math.max(habit.LongestStreak, newStreak);

        // Compute XP for this completion
        const baseXP = HABIT_XP[habit.Difficulty as HabitDifficulty] ?? HABIT_XP[HabitDifficulty.MEDIUM];
        let streakBonus = 0;
        if (newStreak === 7) streakBonus = HABIT_XP.STREAK_7_BONUS;
        else if (newStreak === 30) streakBonus = HABIT_XP.STREAK_30_BONUS;
        else if (newStreak === 100) streakBonus = HABIT_XP.STREAK_100_BONUS;

        const xpForThis = baseXP + streakBonus;

        const completionRecord = {
            Date: targetDate,
            CompletedAt: new Date(),
            Note: note?.trim(),
            XPAwarded: xpForThis
        };

        // Keep only last 365 entries
        const updatedHistory = [...habit.CompletionHistory, completionRecord].slice(-365);

        await ProductivityHabit.updateOne(
            { HabitID: id, UserID: user.userId },
            {
                $set: {
                    CurrentStreak: newStreak,
                    LongestStreak: newLongest,
                    LastCompletedDate: targetDate,
                    CompletionHistory: updatedHistory
                },
                $inc: {
                    TotalXPEarned: xpForThis,
                    TotalCompletions: 1
                }
            }
        );

        // Award XP to user stats
        const stats = await getOrCreateStats(user.userId);
        const newTotalXP = stats.TotalXP + xpForThis;
        const levelInfo = computeLevel(newTotalXP);

        const xpEntry = {
            Amount: xpForThis,
            Reason: `Habit completed: ${habit.Title} (streak: ${newStreak})`,
            Source: "habit" as const,
            SourceID: id,
            EarnedAt: new Date()
        };

        // Check streak achievements
        const earnedIds = new Set(stats.EarnedAchievements.map((a: { id: string }) => a.id));
        const newAchievements: {
            id: string;
            EarnedAt: Date;
            XPAwarded: number;
        }[] = [];
        let bonusXP = 0;

        const streakChecks: Record<string, boolean> = {
            habit_streak_3: newStreak >= 3,
            habit_streak_7: newStreak >= 7,
            habit_streak_30: newStreak >= 30,
            habit_streak_100: newStreak >= 100
        };

        for (const ach of ACHIEVEMENTS) {
            if (earnedIds.has(ach.id) || !(ach.id in streakChecks)) continue;
            if (streakChecks[ach.id]) {
                newAchievements.push({
                    id: ach.id,
                    EarnedAt: new Date(),
                    XPAwarded: ach.xpReward
                });
                bonusXP += ach.xpReward;
            }
        }

        const finalXP = newTotalXP + bonusXP;
        const finalLevel = computeLevel(finalXP);

        const newBestStreak = Math.max(stats.BestHabitStreak, newLongest);

        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $set: {
                    TotalXP: finalXP,
                    Level: finalLevel.level,
                    LevelTitle: finalLevel.title,
                    BestHabitStreak: newBestStreak
                },
                $inc: { TotalHabitCompletions: 1 },
                $push: {
                    XPHistory: {
                        $each: [
                            xpEntry,
                            ...newAchievements.map((a) => ({
                                Amount: a.XPAwarded,
                                Reason: `Achievement: ${ACHIEVEMENTS.find((x) => x.id === a.id)?.title ?? a.id}`,
                                Source: "achievement" as const,
                                SourceID: a.id,
                                EarnedAt: new Date()
                            }))
                        ],
                        $slice: -500
                    },
                    EarnedAchievements: { $each: newAchievements }
                }
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            data: {
                streak: newStreak,
                longestStreak: newLongest,
                xpAwarded: xpForThis + bonusXP,
                newAchievements
            }
        });
    } catch (err) {
        console.error("POST /api/productivity/habits/[id]/complete:", err);
        return NextResponse.json({ success: false, error: "Failed to mark habit complete" }, { status: 500 });
    }
}

/**
 * DELETE /api/productivity/habits/[id]/complete
 * Un-complete a habit for today (undo).
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const q = req.nextUrl.searchParams;
        const targetDate = q.get("date") ?? new Date().toISOString().split("T")[0];

        const habit = await ProductivityHabit.findOne({
            HabitID: id,
            UserID: user.userId
        });

        if (!habit) return NextResponse.json({ success: false, error: "Habit not found" }, { status: 404 });

        const entry = habit.CompletionHistory.find((c) => c.Date === targetDate);
        if (!entry) {
            return NextResponse.json({ success: false, error: "No completion found for this date" }, { status: 404 });
        }

        const xpToDeduct = entry.XPAwarded ?? 0;

        const newHistory = habit.CompletionHistory.filter((c) => c.Date !== targetDate);

        // Recalculate streak
        const sortedDates = newHistory
            .map((c) => c.Date)
            .sort()
            .reverse();
        let recalcStreak = 0;
        if (sortedDates.length > 0) {
            const latestDate = sortedDates[0];
            const today = new Date().toISOString().split("T")[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yday = yesterday.toISOString().split("T")[0];

            if (latestDate === today || latestDate === yday) {
                recalcStreak = 1;
                for (let i = 1; i < sortedDates.length; i++) {
                    const d1 = new Date(sortedDates[i - 1]);
                    const d2 = new Date(sortedDates[i]);
                    const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
                    if (diff === 1) recalcStreak++;
                    else break;
                }
            }
        }

        await ProductivityHabit.updateOne(
            { HabitID: id, UserID: user.userId },
            {
                $set: {
                    CompletionHistory: newHistory,
                    CurrentStreak: recalcStreak,
                    LastCompletedDate: sortedDates[0] ?? null
                },
                $inc: {
                    TotalXPEarned: -xpToDeduct,
                    TotalCompletions: -1
                }
            }
        );

        // Deduct XP from user stats
        if (xpToDeduct > 0) {
            const stats = await getOrCreateStats(user.userId);
            const newXP = Math.max(0, stats.TotalXP - xpToDeduct);
            const levelInfo = computeLevel(newXP);

            await UserProductivityStats.updateOne(
                { UserID: user.userId },
                {
                    $set: {
                        TotalXP: newXP,
                        Level: levelInfo.level,
                        LevelTitle: levelInfo.title
                    },
                    $inc: { TotalHabitCompletions: -1 }
                }
            );
        }

        return NextResponse.json({
            success: true,
            data: { streak: recalcStreak }
        });
    } catch (err) {
        console.error("DELETE /api/productivity/habits/[id]/complete:", err);
        return NextResponse.json({ success: false, error: "Failed to un-complete habit" }, { status: 500 });
    }
}
