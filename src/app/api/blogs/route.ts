/**
 * Blogs API Routes — CRUD + approval workflow
 * GET  ?slug=  → single blog (public: published/unlisted only; auth: own drafts too)
 * GET  ?mine=true (auth) → user's own blogs regardless of status
 * GET  ?pending=true (requires content.blog.manage) → pending review queue
 * POST → create blog (requires Users.Blogs.Create)
 * PUT  → update blog (auth, must be author)
 * PATCH ?id=&action=submit  → submit draft for review
 * PATCH ?id=&action=like    → increment likes (public)
 * DELETE ?id=  → delete blog (auth, must be author)
 */

import { NextRequest, NextResponse } from "next/server";
import Blog, { BlogStatus, BlogCategory } from "@/Models/Blog";
import { BlogLike } from "@/Models/BlogLike";
import { BlogAccess_Model } from "@/Models/BlogAccess";
import dbConnect from "@/Utils/dbConnect";
import { getSession, requireAuth } from "@Library/auth";
import { hasPermission } from "@/Utils/RolePermissions";
import slugify from "@sindresorhus/slugify";

// ── helpers ──────────────────────────────────────────────────────
const isAdmin = (email?: string | null) => !!email && !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;

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
        const id = p.get("id");

        // ── Single blog by _id (admin/author edit flow) ──
        if (id) {
            const blog = await Blog.findById(id).lean();
            if (!blog) return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
            const isAuthor = blog.authorId === session?.user?.id;
            if (!admin && !isAuthor) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            return NextResponse.json({ success: true, data: blog });
        }

        // ── Single blog by slug ──
        if (slug) {
            const blog = await Blog.findOne({ slug }).lean();
            if (!blog) {
                return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
            }
            const isAuthor = blog.authorId === session?.user?.id;
            
            // Check if user has BlogAccess
            let hasAccessRecord = false;
            if (session?.user?.id) {
                const access = await BlogAccess_Model().findOne({ blogId: blog._id, userId: session.user.id });
                if (access) hasAccessRecord = true;
            }

            let canView = admin || isAuthor;

            if (!canView) {
                if (blog.status === BlogStatus.Published) {
                    canView = true;
                } else if (blog.status === BlogStatus.Unlisted) {
                    // Unlisted: must be logged in
                    if (session?.user?.id) canView = true;
                } else if (blog.status === BlogStatus.Private) {
                    // Private: must be logged in and email whitelisted, or have access record
                    if (session?.user?.id) {
                        const isWhitelisted = blog.whitelistedEmails?.includes(session.user.email);
                        if (isWhitelisted || hasAccessRecord) canView = true;
                    }
                }
            }

            if (!canView) {
                return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
            }

            // If logged in and viewing Unlisted, or viewing Private via whitelist, ensure they have BlogAccess record for "Shared with me" feed
            if (session?.user?.id && (blog.status === BlogStatus.Unlisted || blog.status === BlogStatus.Private) && !hasAccessRecord && !isAuthor && !admin) {
                await BlogAccess_Model().create({ blogId: blog._id, userId: session.user.id });
            }

            // increment views for public posts if noview is not set
            if (p.get("noview") !== "true" && (blog.status === BlogStatus.Published || blog.status === BlogStatus.Unlisted)) {
                await Blog.findOneAndUpdate({ slug }, { $inc: { views: 1 } });
            }
            return NextResponse.json({ success: true, data: blog });
        }

        // ── Shared with me blogs (auth required) ──
        if (p.get("shared") === "true") {
            if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            const accessRecords = await BlogAccess_Model().find({ userId: session.user.id }).lean();
            const blogIds = accessRecords.map(a => a.blogId);
            const blogs = await Blog.find({ _id: { $in: blogIds } }).select("-content").sort({ updatedAt: -1 }).lean();
            return NextResponse.json({ success: true, data: blogs });
        }

        // ── My blogs (auth required) ──
        if (mine) {
            if (!session) {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            const query: any = { authorId: session.user.id };
            if (status) query.status = status;
            const blogs = await Blog.find(query).select("-content").sort({ updatedAt: -1 }).limit(limit).skip(skip).lean();
            const total = await Blog.countDocuments(query);
            return NextResponse.json({
                success: true,
                data: blogs,
                pagination: { total, limit, skip }
            });
        }

        // ── Admin pending queue ──
        if (pending) {
            if (!session?.user?.id) {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            
            // Check permission to manage blog content
            const canManage = await hasPermission(req.headers, "content.blog.manage");
            if (!canManage && !admin) {
                return NextResponse.json({ success: false, error: "Forbidden: Permission required: content.blog.manage" }, { status: 403 });
            }
            
            const blogs = await Blog.find({ status: BlogStatus.PendingReview })
                .select("-content")
                .sort({ submittedAt: 1 })
                .limit(limit)
                .skip(skip)
                .lean();
            const total = await Blog.countDocuments({
                status: BlogStatus.PendingReview
            });
            return NextResponse.json({
                success: true,
                data: blogs,
                pagination: { total, limit, skip }
            });
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

        // Check permission to create blogs
        const canCreate = await hasPermission(req.headers, "Users.Blogs.Create");
        if (!canCreate) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Permission required: Users.Blogs.Create" },
                { status: 403 }
            );
        }

        const body = await req.json();

        // Auto-generate slug if missing
        if (!body.slug && body.title) {
            body.slug = await generateSlug(body.title);
        } else if (body.slug && (await Blog.exists({ slug: body.slug }))) {
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

        const blog = await Blog.findByIdAndUpdate(_id, updateData, {
            new: true,
            runValidators: true
        });
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
            let body: any = {};
            try {
                body = await req.json();
            } catch (e) {
                // ignore
            }
            const fingerprint = body.fingerprint;
            const session = await getSession(req.headers).catch(() => null);
            const userId = session?.user?.id;

            if (!userId && !fingerprint) {
                return NextResponse.json({ success: false, error: "Requires authentication or device fingerprint" }, { status: 400 });
            }

            const query: any = { blogId: id };
            if (userId) {
                query.userId = userId;
            } else {
                query.fingerprint = fingerprint;
            }

            const existingLike = await BlogLike.findOne(query);
            if (existingLike) {
                return NextResponse.json({ success: false, error: "Already liked" }, { status: 400 });
            }

            await BlogLike.create(query);
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
                return NextResponse.json(
                    {
                        success: false,
                        error: "Only draft or rejected blogs can be submitted"
                    },
                    { status: 400 }
                );
            }
            await Blog.findByIdAndUpdate(id, {
                status: BlogStatus.PendingReview,
                submittedAt: new Date(),
                rejectionReason: undefined
            });
            return NextResponse.json({
                success: true,
                message: "Submitted for review"
            });
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
