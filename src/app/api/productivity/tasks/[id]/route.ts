/**
 * GET    /api/productivity/tasks/[id]   – get task
 * PUT    /api/productivity/tasks/[id]   – update / complete / hide task
 * DELETE /api/productivity/tasks/[id]   – hard-delete task (revokes XP)
 *
 * Status rules:
 *   PENDING → COMPLETED        : award XP
 *   COMPLETED → PENDING        : revoke XP  (only via 3-dot menu)
 *   any → HIDDEN               : soft delete (primary delete button in UI)
 *   DELETE method              : hard delete + revoke XP if completed
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

async function awardTaskXP(userId: string, xp: number, reason: string, taskId: string) {
    const stats    = await getOrCreateStats(userId);
    const newXP    = stats.TotalXP + xp;
    const levelInfo = computeLevel(newXP);

    const xpEntry = { Amount: xp, Reason: reason, Source: "task" as const, SourceID: taskId, EarnedAt: new Date() };

    const earnedIds    = new Set(stats.EarnedAchievements.map((a: { id: string }) => a.id));
    const newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] = [];
    let bonusXP = 0;

    const newCompleted = stats.TotalTasksCompleted + 1;
    const checks: Record<string, boolean> = {
        first_task:  newCompleted >= 1,
        tasks_10:    newCompleted >= 10,
        tasks_50:    newCompleted >= 50,
        tasks_100:   newCompleted >= 100,
        tasks_500:   newCompleted >= 500,
        urgent_task: reason.includes("URGENT"),
    };

    for (const ach of ACHIEVEMENTS) {
        if (earnedIds.has(ach.id) || !(ach.id in checks)) continue;
        if (checks[ach.id]) {
            newAchievements.push({ id: ach.id, EarnedAt: new Date(), XPAwarded: ach.xpReward });
            bonusXP += ach.xpReward;
        }
    }

    const finalXP    = newXP + bonusXP;
    const finalLevel = computeLevel(finalXP);

    await UserProductivityStats.updateOne(
        { UserID: userId },
        {
            $set: { TotalXP: finalXP, Level: finalLevel.level, LevelTitle: finalLevel.title },
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
        const h    = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const task   = await ProductivityTask.findOne({ TaskID: id, UserID: user.userId }).lean();

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
        const h    = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id }  = await params;
        const body     = await req.json();

        const existing = await ProductivityTask.findOne({ TaskID: id, UserID: user.userId });
        if (!existing) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

        const wasCompleted = existing.Status === TaskStatus.COMPLETED;
        const isCompletingNow = !wasCompleted && body.Status === TaskStatus.COMPLETED;

        const update: Record<string, unknown> = {};
        const allowed = ["Title", "Description", "Category", "Tags", "Status", "Priority", "DueDate", "Attachments"];

        for (const key of allowed) {
            if (key in body) {
                update[key] = key === "DueDate" && body[key] ? new Date(body[key] as string) : body[key];
            }
        }

        let xpResult: { xpAwarded: number; newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] } | null = null;

        // ── completing ──────────────────────────────────────────────────────
        if (isCompletingNow) {
            update.CompletedAt = new Date();
            const xp           = XP_REWARDS[existing.Priority as TaskPriority] ?? XP_REWARDS[TaskPriority.MEDIUM];
            update.XPEarned    = xp;
            xpResult           = await awardTaskXP(user.userId, xp, `Completed task (${existing.Priority})`, id);
        }

        // ── un-completing (only via 3-dot menu — Status → PENDING) ──────────
        if (wasCompleted && body.Status === TaskStatus.PENDING) {
            update.CompletedAt = undefined;
            update.XPEarned    = 0;

            const stats  = await getOrCreateStats(user.userId);
            const deduct = existing.XPEarned ?? 0;
            const newXP  = Math.max(0, stats.TotalXP - deduct);
            const lvl    = computeLevel(newXP);

            await UserProductivityStats.updateOne(
                { UserID: user.userId },
                { $set: { TotalXP: newXP, Level: lvl.level, LevelTitle: lvl.title }, $inc: { TotalTasksCompleted: -1 } }
            );
        }

        const updated = await ProductivityTask.findOneAndUpdate(
            { TaskID: id, UserID: user.userId },
            { $set: update },
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updated, ...(xpResult ? { xp: xpResult } : {}) });
    } catch (err) {
        console.error("PUT /api/productivity/tasks/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
// Hard-delete: removes record from DB and revokes any XP earned

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const h    = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id }  = await params;
        const deleted = await ProductivityTask.findOneAndDelete({ TaskID: id, UserID: user.userId });

        if (!deleted) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

        // Revoke XP if the task was completed
        if (deleted.XPEarned && deleted.XPEarned > 0) {
            const stats  = await getOrCreateStats(user.userId);
            const newXP  = Math.max(0, stats.TotalXP - deleted.XPEarned);
            const lvl    = computeLevel(newXP);

            await UserProductivityStats.updateOne(
                { UserID: user.userId },
                {
                    $set: { TotalXP: newXP, Level: lvl.level, LevelTitle: lvl.title },
                    $inc: { TotalTasksCompleted: -1 },
                }
            );
        }

        return NextResponse.json({ success: true, message: "Task deleted" });
    } catch (err) {
        console.error("DELETE /api/productivity/tasks/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 });
    }
}
