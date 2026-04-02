/**
 * GET  /api/productivity/tasks   – list tasks (paginated, filtered)
 * POST /api/productivity/tasks   – create task
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { ProductivityTask, TaskStatus, TaskPriority, TaskCategory, XP_REWARDS } from "@Models/ProductivityTask";
import { UserProductivityStats } from "@Models/UserProductivityStats";

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
        const search = q.get("search");
        const overdue = q.get("overdue") === "true";
        const dueBefore = q.get("dueBefore");
        const dueAfter = q.get("dueAfter");

        // Default: exclude HIDDEN (soft-deleted); pass status=HIDDEN to view trash
        const query: Record<string, unknown> = { UserID: user.userId };

        if (status) {
            query.Status = status;
        } else {
            query.Status = { $ne: TaskStatus.HIDDEN };
        }

        if (priority) query.Priority = priority;
        if (category) query.Category = category;

        if (overdue) {
            query.DueDate = { $lt: new Date() };
            query.Status = TaskStatus.PENDING;
        }
        if (dueBefore || dueAfter) {
            query.DueDate = {} as Record<string, unknown>;
            if (dueBefore) (query.DueDate as Record<string, unknown>).$lte = new Date(dueBefore);
            if (dueAfter) (query.DueDate as Record<string, unknown>).$gte = new Date(dueAfter);
        }
        if (search) query.$text = { $search: search };

        const [total, tasks] = await Promise.all([
            ProductivityTask.countDocuments(query),
            ProductivityTask.find(query)
                .sort({ Priority: -1, DueDate: 1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
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
        const { Title, Description, Category = TaskCategory.PERSONAL, Tags = [], Priority = TaskPriority.MEDIUM, DueDate } = body;

        if (!Title?.trim()) {
            return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
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
            XPReward: xpReward
        });

        await UserProductivityStats.updateOne({ UserID: user.userId }, { $inc: { TotalTasksCreated: 1 } }, { upsert: true });

        return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (err) {
        console.error("POST /api/productivity/tasks:", err);
        return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
    }
}
