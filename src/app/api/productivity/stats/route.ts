/**
 * GET  /api/productivity/stats   – get user gamification stats
 * POST /api/productivity/stats   – update daily streak / activity ping
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import {
    UserProductivityStats,
    getOrCreateStats,
    computeLevel,
    LEVEL_XP_THRESHOLDS,
    LEVEL_TITLES,
    ACHIEVEMENTS,
} from "@Models/UserProductivityStats";

export async function GET(_req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const stats = await getOrCreateStats(user.userId);
        const levelInfo = computeLevel(stats.TotalXP);

        // Enrich with achievement metadata
        const achievementsWithMeta = stats.EarnedAchievements.map((earned) => {
            const meta = ACHIEVEMENTS.find((a) => a.id === earned.id);
            return {
                ...earned,
                title: meta?.title ?? earned.id,
                description: meta?.description ?? "",
                emoji: meta?.emoji ?? "🏆",
            };
        });

        // Build next level info
        const nextLevelIdx = levelInfo.level;
        const nextLevelXP = LEVEL_XP_THRESHOLDS[nextLevelIdx] ?? null;

        return NextResponse.json({
            success: true,
            data: {
                ...stats.toObject(),
                levelInfo: {
                    ...levelInfo,
                    nextLevelXP,
                    nextLevelTitle: LEVEL_TITLES[nextLevelIdx] ?? null,
                },
                achievements: achievementsWithMeta,
                allAchievements: ACHIEVEMENTS,
            },
        });
    } catch (err) {
        console.error("GET /api/productivity/stats:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
    }
}

/** Activity ping — call once per session to update daily streak */
export async function POST(_req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const today = new Date().toISOString().split("T")[0];
        const stats = await getOrCreateStats(user.userId);

        if (stats.LastActiveDate === today) {
            // Already updated today
            return NextResponse.json({
                success: true,
                data: { streak: stats.DailyStreak, alreadyPinged: true },
            });
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yday = yesterday.toISOString().split("T")[0];

        const newStreak = stats.LastActiveDate === yday ? stats.DailyStreak + 1 : 1;
        const newLongest = Math.max(stats.LongestDailyStreak, newStreak);

        const earnedIds = new Set(stats.EarnedAchievements.map((a: { id: string }) => a.id));
        const newAchievements: { id: string; EarnedAt: Date; XPAwarded: number }[] = [];
        let bonusXP = 0;

        const checks: Record<string, boolean> = {
            daily_streak_3: newStreak >= 3,
            daily_streak_7: newStreak >= 7,
            daily_streak_30: newStreak >= 30,
        };

        for (const ach of ACHIEVEMENTS) {
            if (earnedIds.has(ach.id) || !(ach.id in checks)) continue;
            if (checks[ach.id]) {
                newAchievements.push({ id: ach.id, EarnedAt: new Date(), XPAwarded: ach.xpReward });
                bonusXP += ach.xpReward;
            }
        }

        const newXP = stats.TotalXP + bonusXP;
        const levelInfo = computeLevel(newXP);

        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $set: {
                    LastActiveDate: today,
                    DailyStreak: newStreak,
                    LongestDailyStreak: newLongest,
                    TotalXP: newXP,
                    Level: levelInfo.level,
                    LevelTitle: levelInfo.title,
                },
                ...(newAchievements.length > 0
                    ? {
                        $push: {
                            EarnedAchievements: { $each: newAchievements },
                            XPHistory: {
                                $each: newAchievements.map((a) => ({
                                    Amount: a.XPAwarded,
                                    Reason: `Achievement: ${ACHIEVEMENTS.find((x) => x.id === a.id)?.title ?? a.id}`,
                                    Source: "achievement",
                                    SourceID: a.id,
                                    EarnedAt: new Date(),
                                })),
                                $slice: -500,
                            },
                        },
                    }
                    : {}),
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            data: {
                streak: newStreak,
                longestStreak: newLongest,
                xpAwarded: bonusXP,
                newAchievements,
            },
        });
    } catch (err) {
        console.error("POST /api/productivity/stats:", err);
        return NextResponse.json({ success: false, error: "Failed to update stats" }, { status: 500 });
    }
}
