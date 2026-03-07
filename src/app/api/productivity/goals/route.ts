/**
 * GET  /api/productivity/goals   – list goals
 * POST /api/productivity/goals   – create goal
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import {
    ProductivityGoal,
    GoalType,
    GoalStatus,
    GoalCategory,
    GOAL_XP,
} from "@Models/ProductivityGoal";
import {
    UserProductivityStats,
    getOrCreateStats,
    computeLevel,
    ACHIEVEMENTS,
} from "@Models/UserProductivityStats";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const type = q.get("type");
        const status = q.get("status");
        const category = q.get("category");
        const archived = q.get("archived") === "true";

        const query: Record<string, unknown> = { UserID: user.userId, Archived: archived };

        if (type) query.Type = type;
        if (status) query.Status = status;
        if (category) query.Category = category;

        const goals = await ProductivityGoal.find(query)
            .sort({ Status: 1, TargetDate: 1, createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: goals });
    } catch (err) {
        console.error("GET /api/productivity/goals:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch goals" }, { status: 500 });
    }
}

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
            Category = GoalCategory.OTHER,
            Emoji = "🎯",
            Color = "#AF52DE",
            Type = GoalType.SHORT_TERM,
            StartDate,
            TargetDate,
            ProgressType = "PERCENTAGE",
            ProgressTarget = 100,
            ProgressUnit,
            Milestones = [],
            Motivation,
            Tags = [],
            IsPublic = false,
            AIGenerated = false,
            AIPrompt,
        } = body;

        if (!Title?.trim()) {
            return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
        }

        const xpReward = GOAL_XP[Type as GoalType] ?? GOAL_XP[GoalType.SHORT_TERM];

        const goal = await ProductivityGoal.create({
            UserID: user.userId,
            Title: Title.trim(),
            Description: Description?.trim(),
            Category,
            Emoji,
            Color,
            Type,
            Status: GoalStatus.NOT_STARTED,
            StartDate: StartDate ? new Date(StartDate) : new Date(),
            TargetDate: TargetDate ? new Date(TargetDate) : undefined,
            ProgressType,
            ProgressTarget,
            ProgressUnit: ProgressUnit?.trim(),
            Milestones: Milestones.map((m: { Title: string; Description?: string; TargetDate?: string; XPReward?: number }, i: number) => ({
                id: crypto.randomUUID(),
                Title: m.Title,
                Description: m.Description,
                TargetDate: m.TargetDate ? new Date(m.TargetDate) : undefined,
                XPReward: m.XPReward ?? 25,
                SortOrder: i,
            })),
            Motivation: Motivation?.trim(),
            XPReward: xpReward,
            Tags,
            IsPublic,
            AIGenerated,
            AIPrompt,
        });

        // Update stats
        const stats = await getOrCreateStats(user.userId);
        const newGoalCount = stats.TotalGoalsCreated + 1;
        const earnedIds = new Set(stats.EarnedAchievements.map((a: { id: string }) => a.id));

        const updates: Record<string, unknown> = {};
        const newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] = [];
        let bonusXP = 0;

        if (!earnedIds.has("first_goal")) {
            newAchievements.push({ id: "first_goal", EarnedAt: new Date(), XPAwarded: 25 });
            bonusXP += 25;
        }

        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $set: { TotalGoalsCreated: newGoalCount },
                $inc: { TotalXP: bonusXP },
                ...(newAchievements.length > 0
                    ? {
                        $push: {
                            EarnedAchievements: { $each: newAchievements },
                            XPHistory: {
                                $each: newAchievements.map((a) => ({
                                    Amount: a.XPAwarded,
                                    Reason: `Achievement: Dream Big`,
                                    Source: "achievement",
                                    SourceID: a.id,
                                    EarnedAt: new Date(),
                                })),
                            },
                        },
                    }
                    : {}),
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, data: goal }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/goals:", err);
        return NextResponse.json({ success: false, error: "Failed to create goal" }, { status: 500 });
    }
}
