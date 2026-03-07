/**
 * UserProductivityStats Mongoose Model
 * Gamification stats: XP, levels, achievements, and streaks per user.
 */

import mongoose from "mongoose";

// ─── Level definitions ────────────────────────────────────────────────────────

/** XP required to reach each level (index = level - 1) */
export const LEVEL_XP_THRESHOLDS = [
    0,      // Level 1  — Beginner
    100,    // Level 2  — Apprentice
    250,    // Level 3  — Learner
    500,    // Level 4  — Practitioner
    900,    // Level 5  — Achiever
    1400,   // Level 6  — Specialist
    2000,   // Level 7  — Expert
    2800,   // Level 8  — Master
    3800,   // Level 9  — Champion
    5000,   // Level 10 — Legend
    6500,   // Level 11 — Prodigy
    8500,   // Level 12 — Titan
    11000,  // Level 13 — Immortal
    14000,  // Level 14 — Mythic
    18000,  // Level 15 — God
];

export const LEVEL_TITLES = [
    "Beginner",
    "Apprentice",
    "Learner",
    "Practitioner",
    "Achiever",
    "Specialist",
    "Expert",
    "Master",
    "Champion",
    "Legend",
    "Prodigy",
    "Titan",
    "Immortal",
    "Mythic",
    "God",
];

/** Compute level and progress from total XP */
export function computeLevel(totalXP: number): {
    level: number;
    title: string;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progress: number; // 0–100
} {
    let level = 1;
    for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
        if (totalXP >= LEVEL_XP_THRESHOLDS[i]) {
            level = i + 1;
        } else {
            break;
        }
    }

    const isMax = level >= LEVEL_XP_THRESHOLDS.length;
    const xpForCurrentLevel = LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
    const xpForNextLevel = isMax ? LEVEL_XP_THRESHOLDS[level - 1] : (LEVEL_XP_THRESHOLDS[level] ?? LEVEL_XP_THRESHOLDS[level - 1]);

    const range = xpForNextLevel - xpForCurrentLevel;
    const earned = totalXP - xpForCurrentLevel;
    const progress = isMax ? 100 : range > 0 ? Math.min(100, Math.floor((earned / range) * 100)) : 100;

    return {
        level,
        title: LEVEL_TITLES[level - 1] ?? "God",
        xpForCurrentLevel,
        xpForNextLevel,
        progress,
    };
}

// ─── Achievement definitions ──────────────────────────────────────────────────

export interface AchievementDefinition {
    id: string;
    title: string;
    description: string;
    emoji: string;
    xpReward: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
    // Task achievements
    { id: "first_task", title: "First Step", description: "Complete your first task", emoji: "🎉", xpReward: 20 },
    { id: "tasks_10", title: "Getting Started", description: "Complete 10 tasks", emoji: "✅", xpReward: 50 },
    { id: "tasks_50", title: "Task Master", description: "Complete 50 tasks", emoji: "🏅", xpReward: 100 },
    { id: "tasks_100", title: "Centurion", description: "Complete 100 tasks", emoji: "💯", xpReward: 200 },
    { id: "tasks_500", title: "Unstoppable", description: "Complete 500 tasks", emoji: "⚡", xpReward: 500 },
    { id: "urgent_task", title: "Fire Fighter", description: "Complete an urgent task", emoji: "🔥", xpReward: 30 },
    { id: "early_task", title: "Ahead of Schedule", description: "Complete a task before its due date", emoji: "⏰", xpReward: 25 },

    // Habit achievements
    { id: "first_habit", title: "New Habit", description: "Create your first habit", emoji: "🌱", xpReward: 20 },
    { id: "habit_streak_3", title: "Three in a Row", description: "Maintain a 3-day habit streak", emoji: "3️⃣", xpReward: 30 },
    { id: "habit_streak_7", title: "Week Warrior", description: "Maintain a 7-day habit streak", emoji: "📅", xpReward: 75 },
    { id: "habit_streak_30", title: "Monthly Master", description: "Maintain a 30-day habit streak", emoji: "🗓️", xpReward: 300 },
    { id: "habit_streak_100", title: "Century Streak", description: "Maintain a 100-day habit streak", emoji: "💎", xpReward: 1000 },
    { id: "habits_5", title: "Habit Builder", description: "Have 5 active habits", emoji: "📋", xpReward: 50 },

    // Goal achievements
    { id: "first_goal", title: "Dream Big", description: "Set your first goal", emoji: "🎯", xpReward: 25 },
    { id: "short_goal_done", title: "Quick Win", description: "Complete a short-term goal", emoji: "🏆", xpReward: 100 },
    { id: "long_goal_done", title: "Long Haul", description: "Complete a long-term goal", emoji: "🌟", xpReward: 500 },
    { id: "goals_5", title: "Goal Setter", description: "Complete 5 goals", emoji: "🎖️", xpReward: 200 },
    { id: "milestone_done", title: "Milestone Reached", description: "Complete your first milestone", emoji: "🏁", xpReward: 50 },

    // Streak achievements
    { id: "daily_streak_3", title: "Consistent", description: "Use the app 3 days in a row", emoji: "🔄", xpReward: 30 },
    { id: "daily_streak_7", title: "Weekly Regular", description: "Use the app 7 days in a row", emoji: "📆", xpReward: 70 },
    { id: "daily_streak_30", title: "Dedicated", description: "Use the app 30 days in a row", emoji: "🔑", xpReward: 250 },

    // Level achievements
    { id: "level_5", title: "Rising Star", description: "Reach Level 5", emoji: "⭐", xpReward: 100 },
    { id: "level_10", title: "Legend", description: "Reach Level 10", emoji: "👑", xpReward: 500 },

    // Reminder achievements
    { id: "first_reminder", title: "Never Forget", description: "Create your first reminder", emoji: "🔔", xpReward: 15 },

    // AI achievements
    { id: "ai_task_created", title: "AI Pioneer", description: "Create a task using AI", emoji: "🤖", xpReward: 20 },
];

// ─── Sub-schema ───────────────────────────────────────────────────────────────

const EarnedAchievementSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        EarnedAt: { type: Date, default: Date.now },
        XPAwarded: { type: Number, default: 0 },
    },
    { _id: false }
);

const XPHistoryEntrySchema = new mongoose.Schema(
    {
        Amount: { type: Number, required: true },
        Reason: { type: String, required: true },
        Source: {
            type: String,
            enum: ["task", "habit", "goal", "reminder", "achievement", "streak", "bonus"],
            default: "task",
        },
        SourceID: { type: String },
        EarnedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const UserProductivityStats_Schema = new mongoose.Schema(
    {
        UserID: { type: String, required: true, unique: true, index: true },

        // XP & Level
        TotalXP: { type: Number, default: 0 },
        Level: { type: Number, default: 1 },
        LevelTitle: { type: String, default: "Beginner" },

        // Task stats
        TotalTasksCreated: { type: Number, default: 0 },
        TotalTasksCompleted: { type: Number, default: 0 },
        TotalTasksCancelled: { type: Number, default: 0 },
        TotalTasksEarlyCompletion: { type: Number, default: 0 },

        // Habit stats
        TotalHabitsCreated: { type: Number, default: 0 },
        TotalHabitCompletions: { type: Number, default: 0 },
        BestHabitStreak: { type: Number, default: 0 },

        // Goal stats
        TotalGoalsCreated: { type: Number, default: 0 },
        TotalGoalsCompleted: { type: Number, default: 0 },
        TotalMilestonesCompleted: { type: Number, default: 0 },

        // Reminder stats
        TotalRemindersCreated: { type: Number, default: 0 },
        TotalRemindersFired: { type: Number, default: 0 },

        // Daily streak (login/activity streak)
        DailyStreak: { type: Number, default: 0 },
        LongestDailyStreak: { type: Number, default: 0 },
        LastActiveDate: { type: String }, // YYYY-MM-DD

        // Achievements
        EarnedAchievements: { type: [EarnedAchievementSchema], default: [] },

        // XP history (last 500 entries)
        XPHistory: { type: [XPHistoryEntrySchema], default: [] },

        // AI usage
        AITasksCreated: { type: Number, default: 0 },
        AISearchesPerformed: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export interface IEarnedAchievement {
    id: string;
    EarnedAt: Date;
    XPAwarded: number;
}

export interface IXPHistoryEntry {
    Amount: number;
    Reason: string;
    Source: "task" | "habit" | "goal" | "reminder" | "achievement" | "streak" | "bonus";
    SourceID?: string;
    EarnedAt: Date;
}

export interface IUserProductivityStats extends mongoose.Document {
    UserID: string;
    TotalXP: number;
    Level: number;
    LevelTitle: string;
    TotalTasksCreated: number;
    TotalTasksCompleted: number;
    TotalTasksCancelled: number;
    TotalTasksEarlyCompletion: number;
    TotalHabitsCreated: number;
    TotalHabitCompletions: number;
    BestHabitStreak: number;
    TotalGoalsCreated: number;
    TotalGoalsCompleted: number;
    TotalMilestonesCompleted: number;
    TotalRemindersCreated: number;
    TotalRemindersFired: number;
    DailyStreak: number;
    LongestDailyStreak: number;
    LastActiveDate?: string;
    EarnedAchievements: IEarnedAchievement[];
    XPHistory: IXPHistoryEntry[];
    AITasksCreated: number;
    AISearchesPerformed: number;
    createdAt: Date;
    updatedAt: Date;
}

export const UserProductivityStats: mongoose.Model<IUserProductivityStats> =
    mongoose.models.UserProductivityStats ||
    mongoose.model<IUserProductivityStats>("UserProductivityStats", UserProductivityStats_Schema);

/**
 * Get or create the stats document for a user.
 */
export async function getOrCreateStats(userId: string): Promise<IUserProductivityStats> {
    let doc = await UserProductivityStats.findOne({ UserID: userId });
    if (!doc) {
        doc = await UserProductivityStats.create({ UserID: userId });
    }
    return doc;
}
