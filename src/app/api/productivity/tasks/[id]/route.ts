/**
 * GET    /api/productivity/tasks/[id]   – get task
 * PUT    /api/productivity/tasks/[id]   – update task (including complete)
 * DELETE /api/productivity/tasks/[id]   – delete task
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import {
    ProductivityTask,
    TaskStatus,
    TaskPriority,
    XP_REWARDS,
} from "@Models/ProductivityTask";
import {
    UserProductivityStats,
    getOrCreateStats,
    computeLevel,
    ACHIEVEMENTS,
} from "@Models/UserProductivityStats";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function awardTaskXP(
    userId: string,
    xp: number,
    reason: string,
    taskId: string
) {
    const stats = await getOrCreateStats(userId);
    const newXP = stats.TotalXP + xp;
    const levelInfo = computeLevel(newXP);

    const xpEntry = {
        Amount: xp,
        Reason: reason,
        Source: "task" as const,
        SourceID: taskId,
        EarnedAt: new Date(),
    };

    const earnedIds = new Set(stats.EarnedAchievements.map((a: { id: string }) => a.id));
    const newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] = [];
    let bonusXP = 0;

    const newCompleted = stats.TotalTasksCompleted + 1;

    const checks: Record<string, boolean> = {
        first_task: newCompleted >= 1,
        tasks_10: newCompleted >= 10,
        tasks_50: newCompleted >= 50,
        tasks_100: newCompleted >= 100,
        tasks_500: newCompleted >= 500,
        urgent_task: reason.includes("URGENT"),
        early_task: reason.includes("early"),
    };

    for (const ach of ACHIEVEMENTS) {
        if (earnedIds.has(ach.id) || !(ach.id in checks)) continue;
        if (checks[ach.id]) {
            newAchievements.push({ id: ach.id, EarnedAt: new Date(), XPAwarded: ach.xpReward });
            bonusXP += ach.xpReward;
        }
    }

    const finalXP = newXP + bonusXP;
    const finalLevel = computeLevel(finalXP);

    await UserProductivityStats.updateOne(
        { UserID: userId },
        {
            $set: {
                TotalXP: finalXP,
                Level: finalLevel.level,
                LevelTitle: finalLevel.title,
            },
            $inc: { TotalTasksCompleted: 1 },
            $push: {
                XPHistory: {
                    $each: [
                        xpEntry,
                        ...newAchievements.map((a) => ({
                            Amount: a.XPAwarded,
                            Reason: `Achievement: ${ACHIEVEMENTS.find((x) => x.id === a.id)?.title ?? a.id}`,
                            Source: "achievement" as const,
                            SourceID: a.id,
                            EarnedAt: new Date(),
                        })),
                    ],
                    $slice: -500,
                },
                EarnedAchievements: { $each: newAchievements },
            },
        },
        { upsert: true }
    );

    return { xpAwarded: xp + bonusXP, newAchievements };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

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
        const task = await ProductivityTask.findOne({
            TaskID: id,
            UserID: user.userId,
        }).lean();

        if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: task });
    } catch (err) {
        console.error("GET /api/productivity/tasks/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 });
    }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

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

        const existing = await ProductivityTask.findOne({
            TaskID: id,
            UserID: user.userId,
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        const wasCompleted = existing.Status === TaskStatus.COMPLETED;
        const isCompletingNow =
            !wasCompleted &&
            body.Status === TaskStatus.COMPLETED;

        // Build update object
        const update: Record<string, unknown> = {};
        const allowed = [
            "Title", "Description", "Category", "Tags", "Status", "Priority",
            "DueDate", "StartDate", "ReminderAt", "Repeat", "RepeatInterval",
            "RepeatDaysOfWeek", "SubTasks", "GoalID", "Notes", "Attachments",
            "SortOrder", "Archived",
        ];

        for (const key of allowed) {
            if (key in body) {
                if ((key === "DueDate" || key === "StartDate" || key === "ReminderAt") && body[key]) {
                    update[key] = new Date(body[key] as string);
                } else {
                    update[key] = body[key];
                }
            }
        }

        // Handle task completion
        let xpResult: { xpAwarded: number; newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] } | null = null;
        if (isCompletingNow) {
            const now = new Date();
            update.CompletedAt = now;

            const isEarly =
                existing.DueDate != null && now < existing.DueDate;
            update.CompletedEarly = isEarly;

            const baseXP = XP_REWARDS[existing.Priority as TaskPriority] ?? 10;
            const earlyBonus = isEarly ? XP_REWARDS.EARLY_COMPLETION_BONUS : 0;
            const totalXP = baseXP + earlyBonus;

            update.XPEarned = totalXP;
            update.EarlyCompletionBonus = earlyBonus;

            const reason = [
                `Completed task (${existing.Priority})`,
                isEarly ? "early" : "",
            ]
                .filter(Boolean)
                .join(", ");

            xpResult = await awardTaskXP(user.userId, totalXP, reason, id);
        }

        // Handle un-complete (re-open)
        if (wasCompleted && body.Status && body.Status !== TaskStatus.COMPLETED) {
            update.CompletedAt = undefined;
            update.CompletedEarly = false;
            update.XPEarned = 0;
            update.EarlyCompletionBonus = 0;

            // Decrement completed count (floor at 0)
            const stats = await getOrCreateStats(user.userId);
            const deductXP = existing.XPEarned ?? 0;
            const newXP = Math.max(0, stats.TotalXP - deductXP);
            const levelInfo = computeLevel(newXP);

            await UserProductivityStats.updateOne(
                { UserID: user.userId },
                {
                    $set: { TotalXP: newXP, Level: levelInfo.level, LevelTitle: levelInfo.title },
                    $inc: { TotalTasksCompleted: -1 },
                }
            );
        }

        // Handle cancel
        if (!wasCompleted && body.Status === TaskStatus.CANCELLED) {
            await UserProductivityStats.updateOne(
                { UserID: user.userId },
                { $inc: { TotalTasksCancelled: 1 } },
                { upsert: true }
            );
        }

        const updated = await ProductivityTask.findOneAndUpdate(
            { TaskID: id, UserID: user.userId },
            { $set: update },
            { new: true }
        ).lean();

        return NextResponse.json({
            success: true,
            data: updated,
            ...(xpResult ? { xp: xpResult } : {}),
        });
    } catch (err) {
        console.error("PUT /api/productivity/tasks/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

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
        const deleted = await ProductivityTask.findOneAndDelete({
            TaskID: id,
            UserID: user.userId,
        });

        if (!deleted) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Task deleted" });
    } catch (err) {
        console.error("DELETE /api/productivity/tasks/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 });
    }
}
