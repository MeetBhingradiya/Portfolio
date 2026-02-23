/**
 * Blogs API Routes — CRUD + approval workflow
 * GET  ?slug=  → single blog (public: published/unlisted only; auth: own drafts too)
 * GET  ?mine=true (auth) → user's own blogs regardless of status
 * POST → create blog (auth), starts as draft
 * PUT  → update blog (auth, must be author)
 * PATCH ?id=&action=submit  → submit draft for review
 * PATCH ?id=&action=like    → increment likes (public)
 * DELETE ?id=  → delete blog (auth, must be author)
 */

import { NextRequest, NextResponse } from "next/server";
import Blog, { BlogStatus, BlogCategory } from "@/Models/Blog";
import dbConnect from "@/Utils/dbConnect";
import { getSession, requireAuth } from "@/Library/auth";
import slugify from "@sindresorhus/slugify";

// ── helpers ──────────────────────────────────────────────────────
const isAdmin = (email?: string | null) =>
    !!email && !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;

const generateSlug = async (title: string): Promise<string> => {
    let base = slugify(title, { lowercase: true, separator: "-" });
    let slug = base;
    let n = 0;
    while (await Blog.exists({ slug })) {
        n++;
        slug = `${base}-${n}`;
    }
    return slug;
};

// ── GET ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const p = req.nextUrl.searchParams;
        const slug = p.get("slug");
        const mine = p.get("mine") === "true";
        const pending = p.get("pending") === "true";
        const category = p.get("category") as BlogCategory | null;
        const tag = p.get("tag");
        const featured = p.get("featured");
        const search = p.get("search");
        const status = p.get("status");
        const limit = Math.min(parseInt(p.get("limit") || "20"), 100);
        const skip = parseInt(p.get("skip") || "0");

        const session = await getSession(req.headers).catch(() => null);
        const userEmail = session?.user?.email;
        const admin = isAdmin(userEmail);

        // ── Single blog ──
        if (slug) {
            const blog = await Blog.findOne({ slug }).lean();
            if (!blog) {
                return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
            }
            const isAuthor = blog.authorId === session?.user?.id;
            const canView =
                admin ||
                isAuthor ||
                blog.status === BlogStatus.Published ||
                blog.status === BlogStatus.Unlisted;

            if (!canView) {
                return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
            }
            // increment views for public posts
            if (blog.status === BlogStatus.Published || blog.status === BlogStatus.Unlisted) {
                await Blog.findOneAndUpdate({ slug }, { $inc: { views: 1 } });
            }
            return NextResponse.json({ success: true, data: blog });
        }

        // ── My blogs (auth required) ──
        if (mine) {
            if (!session) {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            const query: any = { authorId: session.user.id };
            if (status) query.status = status;
            const blogs = await Blog.find(query)
                .select("-content")
                .sort({ updatedAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
            const total = await Blog.countDocuments(query);
            return NextResponse.json({ success: true, data: blogs, pagination: { total, limit, skip } });
        }

        // ── Admin pending queue ──
        if (pending && admin) {
            const blogs = await Blog.find({ status: BlogStatus.PendingReview })
                .select("-content")
                .sort({ submittedAt: 1 })
                .limit(limit)
                .skip(skip)
                .lean();
            const total = await Blog.countDocuments({ status: BlogStatus.PendingReview });
            return NextResponse.json({ success: true, data: blogs, pagination: { total, limit, skip } });
        }

        // ── Public listing ──
        const query: any = { status: BlogStatus.Published };
        if (category) query.category = category;
        if (tag) query.tags = tag;
        if (featured === "true") query.featured = true;
        if (search) query.$text = { $search: search };

        const blogs = await Blog.find(query)
            .select("-content")
            .sort(search ? { score: { $meta: "textScore" } } : { publishedAt: -1, createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();
        const total = await Blog.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: blogs,
            pagination: { total, limit, skip, hasMore: skip + limit < total }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── POST — create blog ───────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth(req.headers);
        await dbConnect();

        const body = await req.json();

        // Auto-generate slug if missing
        if (!body.slug && body.title) {
            body.slug = await generateSlug(body.title);
        } else if (body.slug && await Blog.exists({ slug: body.slug })) {
            return NextResponse.json({ success: false, error: "Slug already taken" }, { status: 400 });
        }

        const admin = isAdmin(session.user.email);

        const blogData: any = {
            ...body,
            authorId: session.user.id,
            authorName: session.user.name || session.user.email || "Anonymous",
            authorImage: session.user.image || "",
            status: body.status || BlogStatus.Draft,
            version: 1
        };

        // Admin can publish directly; regular users must go through review
        if (!admin && blogData.status === BlogStatus.Published) {
            blogData.status = BlogStatus.PendingReview;
            blogData.submittedAt = new Date();
        }
        if (blogData.status === BlogStatus.Published) {
            blogData.published = true;
            blogData.publishedAt = new Date();
        }

        const blog = await Blog.create(blogData);
        return NextResponse.json({ success: true, data: blog }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── PUT — update blog ────────────────────────────────────────────
export async function PUT(req: NextRequest) {
    try {
        const session = await requireAuth(req.headers);
        await dbConnect();

        const body = await req.json();
        const { _id, ...updateData } = body;
        if (!_id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        const existing = await Blog.findById(_id);
        if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        const admin = isAdmin(session.user.email);
        if (!admin && existing.authorId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Non-admins cannot self-publish
        if (!admin && updateData.status === BlogStatus.Published) {
            updateData.status = BlogStatus.PendingReview;
            updateData.submittedAt = new Date();
        }
        if (updateData.status === BlogStatus.Published && !existing.published) {
            updateData.published = true;
            updateData.publishedAt = updateData.publishedAt || new Date();
        }

        updateData.version = (existing.version || 1) + 1;
        updateData.lastEditedBy = session.user.id;

        const blog = await Blog.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
        return NextResponse.json({ success: true, data: blog });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── PATCH — submit for review or like ────────────────────────────
export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const p = req.nextUrl.searchParams;
        const id = p.get("id");
        const action = p.get("action");

        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        if (action === "like") {
            await Blog.findByIdAndUpdate(id, { $inc: { likes: 1 } });
            return NextResponse.json({ success: true });
        }

        if (action === "submit") {
            const session = await requireAuth(req.headers);
            const blog = await Blog.findById(id);
            if (!blog) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
            if (blog.authorId !== session.user.id && !isAdmin(session.user.email)) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
            if (blog.status !== BlogStatus.Draft && blog.status !== BlogStatus.Rejected) {
                return NextResponse.json({ success: false, error: "Only draft or rejected blogs can be submitted" }, { status: 400 });
            }
            await Blog.findByIdAndUpdate(id, {
                status: BlogStatus.PendingReview,
                submittedAt: new Date(),
                rejectionReason: undefined
            });
            return NextResponse.json({ success: true, message: "Submitted for review" });
        }

        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── DELETE ────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        const session = await requireAuth(req.headers);
        await dbConnect();

        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        const blog = await Blog.findById(id);
        if (!blog) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        const admin = isAdmin(session.user.email);
        if (!admin && blog.authorId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        await Blog.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
