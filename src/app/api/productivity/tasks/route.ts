/**
 * GET  /api/productivity/tasks   – list tasks (paginated, filtered)
 * POST /api/productivity/tasks   – create task
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import {
    ProductivityTask,
    TaskStatus,
    TaskPriority,
    TaskCategory,
    XP_REWARDS,
    RepeatType,
} from "@Models/ProductivityTask";
import { getOrCreateStats, ACHIEVEMENTS, computeLevel, UserProductivityStats } from "@Models/UserProductivityStats";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function awardXPAndCheckAchievements(
    userId: string,
    xp: number,
    reason: string,
    source: "task" | "habit" | "goal" | "achievement" | "streak" | "bonus",
    sourceId?: string
) {
    const stats = await getOrCreateStats(userId);

    const newTotalXP = stats.TotalXP + xp;
    const levelInfo = computeLevel(newTotalXP);

    const xpEntry = {
        Amount: xp,
        Reason: reason,
        Source: source,
        SourceID: sourceId,
        EarnedAt: new Date(),
    };

    // Keep last 500 XP history entries
    const xpHistory = [xpEntry, ...stats.XPHistory].slice(0, 500);

    // Check for newly unlocked achievements
    const earnedIds = new Set(stats.EarnedAchievements.map((a) => a.id));
    const newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] = [];
    let bonusXP = 0;

    for (const ach of ACHIEVEMENTS) {
        if (earnedIds.has(ach.id)) continue;

        let unlock = false;
        const newCompleted = stats.TotalTasksCompleted + (source === "task" ? 1 : 0);
        const newHabitCompletions = stats.TotalHabitCompletions + (source === "habit" ? 1 : 0);
        const newGoalsCompleted = stats.TotalGoalsCompleted + (source === "goal" ? 1 : 0);

        switch (ach.id) {
            case "first_task":
                unlock = newCompleted >= 1;
                break;
            case "tasks_10":
                unlock = newCompleted >= 10;
                break;
            case "tasks_50":
                unlock = newCompleted >= 50;
                break;
            case "tasks_100":
                unlock = newCompleted >= 100;
                break;
            case "tasks_500":
                unlock = newCompleted >= 500;
                break;
            case "urgent_task":
                unlock = source === "task" && reason.includes("URGENT");
                break;
            case "early_task":
                unlock = source === "task" && reason.includes("early");
                break;
            case "first_habit":
                unlock = stats.TotalHabitsCreated >= 1;
                break;
            case "habit_streak_3":
                unlock = stats.BestHabitStreak >= 3;
                break;
            case "habit_streak_7":
                unlock = stats.BestHabitStreak >= 7;
                break;
            case "habit_streak_30":
                unlock = stats.BestHabitStreak >= 30;
                break;
            case "habit_streak_100":
                unlock = stats.BestHabitStreak >= 100;
                break;
            case "habits_5":
                unlock = stats.TotalHabitsCreated >= 5;
                break;
            case "first_goal":
                unlock = stats.TotalGoalsCreated >= 1;
                break;
            case "short_goal_done":
            case "long_goal_done":
                unlock = newGoalsCompleted >= 1;
                break;
            case "goals_5":
                unlock = newGoalsCompleted >= 5;
                break;
            case "daily_streak_3":
                unlock = stats.DailyStreak >= 3;
                break;
            case "daily_streak_7":
                unlock = stats.DailyStreak >= 7;
                break;
            case "daily_streak_30":
                unlock = stats.DailyStreak >= 30;
                break;
            case "level_5":
                unlock = levelInfo.level >= 5;
                break;
            case "level_10":
                unlock = levelInfo.level >= 10;
                break;
            case "first_reminder":
                unlock = stats.TotalRemindersCreated >= 1;
                break;
            case "ai_task_created":
                unlock = stats.AITasksCreated >= 1;
                break;
        }

        if (unlock) {
            newAchievements.push({
                id: ach.id,
                EarnedAt: new Date(),
                XPAwarded: ach.xpReward,
            });
            bonusXP += ach.xpReward;
            xpHistory.unshift({
                Amount: ach.xpReward,
                Reason: `Achievement: ${ach.title}`,
                Source: "achievement",
                SourceID: ach.id,
                EarnedAt: new Date(),
            });
        }
    }

    const finalXP = newTotalXP + bonusXP;
    const finalLevel = computeLevel(finalXP);

    await UserProductivityStats.updateOne(
        { UserID: userId },
        {
            $set: {
                TotalXP: finalXP,
                Level: finalLevel.level,
                LevelTitle: finalLevel.title,
                XPHistory: xpHistory.slice(0, 500),
            },
            $push: {
                EarnedAchievements: { $each: newAchievements },
            },
        },
        { upsert: true }
    );

    return { xpAwarded: xp + bonusXP, newAchievements };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(100, parseInt(q.get("limit") || "20"));
        const status = q.get("status");
        const priority = q.get("priority");
        const category = q.get("category");
        const goalId = q.get("goalId");
        const search = q.get("search");
        const archived = q.get("archived") === "true";
        const overdue = q.get("overdue") === "true";
        const dueBefore = q.get("dueBefore");
        const dueAfter = q.get("dueAfter");

        const query: Record<string, unknown> = { UserID: user.userId, Archived: archived };

        if (status) query.Status = status;
        if (priority) query.Priority = priority;
        if (category) query.Category = category;
        if (goalId) query.GoalID = goalId;
        if (overdue) {
            query.DueDate = { $lt: new Date() };
            query.Status = { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
        }
        if (dueBefore || dueAfter) {
            query.DueDate = {} as Record<string, unknown>;
            if (dueBefore) (query.DueDate as Record<string, unknown>).$lte = new Date(dueBefore);
            if (dueAfter) (query.DueDate as Record<string, unknown>).$gte = new Date(dueAfter);
        }
        if (search) {
            query.$text = { $search: search };
        }

        const [total, tasks] = await Promise.all([
            ProductivityTask.countDocuments(query),
            ProductivityTask.find(query)
                .sort({ SortOrder: 1, Priority: -1, DueDate: 1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                tasks,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (err) {
        console.error("GET /api/productivity/tasks:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
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
            Category = TaskCategory.PERSONAL,
            Tags = [],
            Priority = TaskPriority.MEDIUM,
            DueDate,
            StartDate,
            ReminderAt,
            Repeat = RepeatType.NONE,
            RepeatInterval = 1,
            RepeatDaysOfWeek = [],
            SubTasks = [],
            GoalID,
            Notes,
            Attachments = [],
            SortOrder = 0,
            AIGenerated = false,
            AIPrompt,
        } = body;

        if (!Title?.trim()) {
            return NextResponse.json(
                { success: false, error: "Title is required" },
                { status: 400 }
            );
        }

        const xpReward = XP_REWARDS[Priority as TaskPriority] ?? XP_REWARDS[TaskPriority.MEDIUM];

        const task = await ProductivityTask.create({
            UserID: user.userId,
            Title: Title.trim(),
            Description: Description?.trim(),
            Category,
            Tags,
            Priority,
            Status: TaskStatus.PENDING,
            DueDate: DueDate ? new Date(DueDate) : undefined,
            StartDate: StartDate ? new Date(StartDate) : undefined,
            ReminderAt: ReminderAt ? new Date(ReminderAt) : undefined,
            Repeat,
            RepeatInterval,
            RepeatDaysOfWeek,
            SubTasks: SubTasks.map((st: { text: string }) => ({
                id: crypto.randomUUID(),
                text: st.text,
                completed: false,
            })),
            XPReward: xpReward,
            GoalID,
            Notes,
            Attachments,
            SortOrder,
            AIGenerated,
            AIPrompt,
        });

        // Update stats
        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $inc: {
                    TotalTasksCreated: 1,
                    ...(AIGenerated ? { AITasksCreated: 1 } : {}),
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/tasks:", err);
        return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
    }
}
