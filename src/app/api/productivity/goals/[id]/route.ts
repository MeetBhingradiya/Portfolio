/**
 * GET    /api/productivity/goals/[id]   – get goal
 * PUT    /api/productivity/goals/[id]   – update goal (progress, milestones, status)
 * DELETE /api/productivity/goals/[id]   – delete goal
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import {
    ProductivityGoal,
    GoalStatus,
    GoalType,
    MilestoneStatus,
    GOAL_XP,
} from "@Models/ProductivityGoal";
import {
    UserProductivityStats,
    getOrCreateStats,
    computeLevel,
    ACHIEVEMENTS,
} from "@Models/UserProductivityStats";

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
        const goal = await ProductivityGoal.findOne({ GoalID: id, UserID: user.userId }).lean();
        if (!goal) return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: goal });
    } catch (err) {
        console.error("GET /api/productivity/goals/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch goal" }, { status: 500 });
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

        const goal = await ProductivityGoal.findOne({ GoalID: id, UserID: user.userId });
        if (!goal) return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });

        const wasCompleted = goal.Status === GoalStatus.COMPLETED;
        const isCompletingNow = !wasCompleted && body.Status === GoalStatus.COMPLETED;

        const allowed = [
            "Title", "Description", "Category", "Emoji", "Color", "Type", "Status",
            "StartDate", "TargetDate", "ProgressType", "ProgressTarget",
            "ProgressCurrent", "ProgressUnit", "Motivation", "Tags",
            "IsPublic", "Archived", "LinkedTaskIDs", "LinkedHabitIDs",
        ];

        const update: Record<string, unknown> = {};
        for (const key of allowed) {
            if (key in body) {
                if ((key === "StartDate" || key === "TargetDate") && body[key]) {
                    update[key] = new Date(body[key] as string);
                } else {
                    update[key] = body[key];
                }
            }
        }

        // Handle progress update
        if ("ProgressCurrent" in body) {
            const newProgress = Math.min(body.ProgressCurrent as number, goal.ProgressTarget);
            update.ProgressCurrent = newProgress;

            if (newProgress > 0 && goal.Status === GoalStatus.NOT_STARTED) {
                update.Status = GoalStatus.IN_PROGRESS;
            }

            // Auto-complete if 100%
            if (newProgress >= goal.ProgressTarget && !wasCompleted) {
                update.Status = GoalStatus.COMPLETED;
                update.CompletedAt = new Date();
                const isEarly = goal.TargetDate && new Date() < goal.TargetDate;
                update.CompletedEarly = isEarly ?? false;
                update.XPEarned = goal.XPReward + (isEarly ? GOAL_XP.EARLY_COMPLETION_BONUS : 0);
            }

            // Add to progress history
            update.ProgressHistory = [
                ...goal.ProgressHistory,
                { Date: new Date(), Value: newProgress, Note: body.progressNote },
            ].slice(-365);
        }

        // Handle milestone update
        if (body.milestoneId && body.milestoneStatus) {
            const milestones = goal.Milestones.map((m) => {
                if (m.id === body.milestoneId) {
                    return {
                        ...m.toObject(),
                        Status: body.milestoneStatus,
                        CompletedAt:
                            body.milestoneStatus === MilestoneStatus.COMPLETED
                                ? new Date()
                                : undefined,
                    };
                }
                return m.toObject();
            });
            update.Milestones = milestones;
        }

        // Handle explicit completion
        if (isCompletingNow) {
            const now = new Date();
            update.CompletedAt = now;
            const isEarly = goal.TargetDate ? now < goal.TargetDate : false;
            update.CompletedEarly = isEarly;
            const xpReward = goal.XPReward + (isEarly ? GOAL_XP.EARLY_COMPLETION_BONUS : 0);
            update.XPEarned = xpReward;
            update.ProgressCurrent = goal.ProgressTarget;

            // Award XP
            const stats = await getOrCreateStats(user.userId);
            const newXP = stats.TotalXP + xpReward;
            const levelInfo = computeLevel(newXP);

            const earnedIds = new Set(stats.EarnedAchievements.map((a: { id: string }) => a.id));
            const newGoalsCompleted = stats.TotalGoalsCompleted + 1;
            const newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] = [];
            let bonusXP = 0;

            const checks: Record<string, boolean> = {
                short_goal_done: goal.Type === GoalType.SHORT_TERM,
                long_goal_done: goal.Type === GoalType.LONG_TERM,
                goals_5: newGoalsCompleted >= 5,
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
                { UserID: user.userId },
                {
                    $set: { TotalXP: finalXP, Level: finalLevel.level, LevelTitle: finalLevel.title },
                    $inc: { TotalGoalsCompleted: 1 },
                    $push: {
                        XPHistory: {
                            $each: [
                                {
                                    Amount: xpReward,
                                    Reason: `Goal completed: ${goal.Title}`,
                                    Source: "goal",
                                    SourceID: id,
                                    EarnedAt: new Date(),
                                },
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
        }

        const updated = await ProductivityGoal.findOneAndUpdate(
            { GoalID: id, UserID: user.userId },
            { $set: update },
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        console.error("PUT /api/productivity/goals/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to update goal" }, { status: 500 });
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
        const deleted = await ProductivityGoal.findOneAndDelete({ GoalID: id, UserID: user.userId });
        if (!deleted) return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: "Goal deleted" });
    } catch (err) {
        console.error("DELETE /api/productivity/goals/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed to delete goal" }, { status: 500 });
    }
}
