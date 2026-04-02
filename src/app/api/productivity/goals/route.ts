/**
 * GET  /api/productivity/goals   – list goals
 * POST /api/productivity/goals   – create goal
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { ProductivityGoal, GoalStatus, GoalCategory, GOAL_XP } from "@Models/ProductivityGoal";
import { UserProductivityStats, getOrCreateStats } from "@Models/UserProductivityStats";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const status = q.get("status");
        const category = q.get("category");
        const archived = q.get("archived") === "true";

        const query: Record<string, unknown> = {
            UserID: user.userId,
            Archived: archived
        };

        if (status) query.Status = status;
        if (category) query.Category = category;

        const goals = await ProductivityGoal.find(query).sort({ Status: 1, TargetDate: 1, createdAt: -1 }).lean();

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
            StartDate,
            TargetDate,
            LinkedTaskIDs = [],
            LinkedHabitIDs = [],
            LinkedReminderIDs = [],
            Tags = []
        } = body;

        if (!Title?.trim()) {
            return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
        }

        const goal = await ProductivityGoal.create({
            UserID: user.userId,
            Title: Title.trim(),
            Description: Description?.trim(),
            Category,
            Emoji,
            Color,
            Status: GoalStatus.NOT_STARTED,
            StartDate: StartDate ? new Date(StartDate) : new Date(),
            TargetDate: TargetDate ? new Date(TargetDate) : undefined,
            LinkedTaskIDs,
            LinkedHabitIDs,
            LinkedReminderIDs,
            XPReward: GOAL_XP,
            Tags
        });

        // Track stats / first-goal achievement
        const stats = await getOrCreateStats(user.userId);
        const isFirst = stats.TotalGoalsCreated === 0;

        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $inc: {
                    TotalGoalsCreated: 1,
                    ...(isFirst ? { TotalXP: 25 } : {})
                },
                ...(isFirst
                    ? {
                          $push: {
                              EarnedAchievements: {
                                  id: "first_goal",
                                  EarnedAt: new Date(),
                                  XPAwarded: 25
                              },
                              XPHistory: {
                                  Amount: 25,
                                  Reason: "Achievement: Dream Big",
                                  Source: "achievement",
                                  SourceID: "first_goal",
                                  EarnedAt: new Date()
                              }
                          }
                      }
                    : {})
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, data: goal }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/goals:", err);
        return NextResponse.json({ success: false, error: "Failed to create goal" }, { status: 500 });
    }
}
