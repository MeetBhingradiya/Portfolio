/**
 * Blogs API Routes
 * CRUD operations for blog posts
 */

import { NextRequest, NextResponse } from "next/server";
import Blog, { BlogVisibility, BlogCategory } from "@/Models/Blog";
import dbConnect from "@/Utils/dbConnect";
import { requireAuth } from "@/Library/auth";

// GET - List all blogs (public published) or all blogs (admin)
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const slug = searchParams.get("slug");
        const category = searchParams.get("category") as BlogCategory | null;
        const tag = searchParams.get("tag");
        const featured = searchParams.get("featured");
        const visibility = searchParams.get("visibility") as BlogVisibility | null;
        const authorId = searchParams.get("authorId");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = parseInt(searchParams.get("skip") || "0");

        // Get single blog by slug
        if (slug) {
            const blog = await Blog.findOne({ slug }).lean();
            
            if (!blog) {
                return NextResponse.json(
                    { success: false, error: "Blog not found" },
                    { status: 404 }
                );
            }

            // Increment views
            await Blog.findOneAndUpdate(
                { slug },
                { $inc: { views: 1 } }
            );

            return NextResponse.json({ success: true, data: blog });
        }

        // Build query
        const query: any = {};
        
        if (category) {
            query.category = category;
        }
        
        if (tag) {
            query.tags = tag;
        }

        if (featured === "true") {
            query.featured = true;
        }

        if (visibility) {
            query.visibility = visibility;
        } else {
            // Only show public published blogs for non-admin
            query.visibility = BlogVisibility.Public;
            query.published = true;
        }

        if (authorId) {
            query.authorId = authorId;
        }

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        // List query - exclude full content for performance
        const blogs = await Blog.find(query)
            .select('-content') // Exclude full content, use contentPreview instead
            .sort(search ? { score: { $meta: "textScore" } } : { publishedAt: -1, createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Blog.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: blogs,
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + limit < total
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new blog (authenticated users)
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request.headers);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();

        const body = await request.json();

        // Check if slug exists
        const existing = await Blog.findOne({ slug: body.slug });
        if (existing) {
            return NextResponse.json(
                { success: false, error: "Blog with this slug already exists" },
                { status: 400 }
            );
        }

        // Add author information
        const blogData = {
            ...body,
            authorId: session.user.id,
            authorName: session.user.name || "Anonymous"
        };

        // Auto-publish if visibility is public
        if (body.visibility === BlogVisibility.Public) {
            blogData.published = true;
            blogData.publishedAt = new Date();
        }

        const blog = await Blog.create(blogData);

        return NextResponse.json(
            { success: true, data: blog },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update blog (author or admin)
export async function PUT(request: NextRequest) {
    try {
        const session = await requireAuth(request.headers);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();

        const body = await request.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json(
                { success: false, error: "Blog ID required" },
                { status: 400 }
            );
        }

        // Check if user is author
        const existingBlog = await Blog.findById(_id);
        if (!existingBlog) {
            return NextResponse.json(
                { success: false, error: "Blog not found" },
                { status: 404 }
            );
        }

        if (existingBlog.authorId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: "Not authorized to edit this blog" },
                { status: 403 }
            );
        }

        // Update version and last editor
        updateData.version = (existingBlog.version || 1) + 1;
        updateData.lastEditedBy = session.user.id;

        // Auto-publish if visibility is public and not already published
        if (updateData.visibility === BlogVisibility.Public && !existingBlog.published) {
            updateData.published = true;
            updateData.publishedAt = new Date();
        }

        const blog = await Blog.findByIdAndUpdate(
            _id,
            updateData,
            { new: true, runValidators: true }
        );

        return NextResponse.json({ success: true, data: blog });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete blog (author or admin)
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth(request.headers);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Blog ID required" },
                { status: 400 }
            );
        }

        const blog = await Blog.findById(id);

        if (!blog) {
            return NextResponse.json(
                { success: false, error: "Blog not found" },
                { status: 404 }
            );
        }

        // Check if user is author
        if (blog.authorId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: "Not authorized to delete this blog" },
                { status: 403 }
            );
        }

        await Blog.findByIdAndDelete(id);

        return NextResponse.json({ 
            success: true, 
            message: "Blog deleted successfully" 
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
