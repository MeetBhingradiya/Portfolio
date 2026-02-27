/**
 * Admin Blogs API
 * GET    /api/admin/blogs              — list all blogs (any status, paginated)
 * PUT    /api/admin/blogs              — update any field (approve/reject/toggle featured)
 * DELETE /api/admin/blogs?id=          — hard delete
 */

import { NextRequest, NextResponse } from "next/server";
import Blog, { BlogStatus } from "@/Models/Blog";
import dbConnect from "@/Utils/dbConnect";
import { requireAdmin, getSession } from "@/Library/auth";

// GET — fetch all blogs with filters
export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const p = req.nextUrl.searchParams;
        const status = p.get("status");
        const authorId = p.get("authorId");
        const search = p.get("search");
        const limit = Math.min(parseInt(p.get("limit") || "25"), 100);
        const skip = parseInt(p.get("skip") || "0");

        const query: any = {};
        if (status) query.status = status;
        if (authorId) query.authorId = authorId;
        if (search) query.$text = { $search: search };

        const blogs = await Blog.find(query)
            .select("-content")
            .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Blog.countDocuments(query);

        // Counts by status for stats bar
        const statusCounts = await Blog.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const counts: Record<string, number> = { all: total };
        statusCounts.forEach((s) => (counts[s._id] = s.count));

        return NextResponse.json({ success: true, data: blogs, pagination: { total, limit, skip }, counts });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// PUT — approve / reject / edit metadata
export async function PUT(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const session = await getSession(req.headers);
        const body = await req.json();
        const { _id: bodyId, action, rejectionReason, ...fields } = body;

        // Accept id from query param (?id=) or from request body (_id / id)
        const id = req.nextUrl.searchParams.get("id") || bodyId || body.id;
        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        const blog = await Blog.findById(id);
        if (!blog) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        let update: any = { ...fields };

        if (action === "approve") {
            const targetStatus = fields.status || body.status || BlogStatus.Published;
            update = {
                ...update,
                status: targetStatus,
                approvedBy: session?.user?.email || "admin",
                approvedAt: new Date(),
                rejectionReason: undefined
            };
            if (targetStatus === BlogStatus.Published) {
                update.published = true;
                update.publishedAt = update.publishedAt || new Date();
            }
        } else if (action === "reject") {
            update = {
                status: BlogStatus.Rejected,
                rejectionReason: rejectionReason || body.rejectionReason || "Did not meet publishing standards.",
                approvedBy: undefined,
                approvedAt: undefined
            };
        }

        const updated = await Blog.findByIdAndUpdate(id, update, { new: true, runValidators: true });
        return NextResponse.json({ success: true, data: updated });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// DELETE — hard delete
export async function DELETE(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        const deleted = await Blog.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
