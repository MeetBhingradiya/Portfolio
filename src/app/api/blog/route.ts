import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Blogs_Model, IBlog, BlogVisibility } from "@Models/Blogs";
import { BlogsContents_Model } from "@Models/BlogsContent";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { verifyJWT } from "@Utils/JWT";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { log } from "@Utils";
import { v4 } from "uuid";
import { generateUniqueSlug } from "@Utils/slugify";

// Helper function to get user from JWT token
async function getUserFromToken(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) return null;

        const decoded = await verifyJWT(token);
        if (!decoded) return null;

        await dbConnect();

        // Verify session is still active
        const session = await Sessions_Model.findOne({
            SessionID: decoded.sessionID,
            UserID: decoded.userID,
            ExpiresAt: { $gt: new Date() },
        });

        if (!session) return null;

        const user = await Users_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false,
        });

        return user;
    } catch (error) {
        log(`Token verification error: ${error}`);
        return null;
    }
}

// GET /api/blog - List blogs with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status"); // published, draft, all
        const author = searchParams.get("author");
        const tags = searchParams.get("tags")?.split(",");
        const search = searchParams.get("search");
        const visibility = searchParams.get("visibility") as BlogVisibility;

        // Get user for authorization
        const user = await getUserFromToken(request);

        // Build query
        const query: any = { isDeleted: false };

        // If not authenticated or not admin, only show public published blogs
        if (!user || !user.isAdmin) {
            query.isPublished = true;
            query.Visiblity = BlogVisibility.Public;
        } else {
            // Admin can see all blogs
            if (status === "published") query.isPublished = true;
            if (status === "draft") query.isPublished = false;
            if (visibility) query.Visiblity = visibility;
        }

        if (author) query.AuthorID = author;
        if (tags?.length) query.Tags = { $in: tags };

        // Search functionality
        if (search) {
            query.$or = [
                { Title: { $regex: search, $options: "i" } },
                { Description: { $regex: search, $options: "i" } },
                { Tags: { $in: [new RegExp(search, "i")] } },
            ];
        }

        // Get total count
        const total = await Blogs_Model.countDocuments(query);

        // Get blogs with pagination
        const blogs = await Blogs_Model.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Get author information for each blog
        const blogsWithAuthors = await Promise.all(
            blogs.map(async (blog) => {
                const author = await Users_Model.findOne({
                    UserID: blog.AuthorID,
                })
                    .select("UserID Username FirstName LastName")
                    .lean();

                return {
                    ...blog,
                    author: author
                        ? {
                                userID: author.UserID,
                                username: author.Username,
                                name: `${author.FirstName} ${author.LastName}`.trim(),
                            }
                        : null,
                    // Don't include content in list view for performance
                    content: undefined,
                };
            })
        );

        return NextResponse.json({
            Status: 1,
            Message: "Blogs retrieved successfully",
            StatusCode: 200,
            Data: {
                blogs: blogsWithAuthors,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1,
                },
                filters: {
                    status,
                    author,
                    tags,
                    search,
                    visibility,
                },
            },
        });
    } catch (error: any) {
        log(`Blog list error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to retrieve blogs",
                StatusCode: 500,
            },
            { status: 500 }
        );
    }
}

// POST /api/blog - Create new blog post
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);

        if (!user) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication required",
                    StatusCode: 401,
                },
                { status: 401 }
            );
        }

        // Check if user can create blogs (admin or has blog permissions)
        if (!user.isAdmin) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Insufficient permissions to create blogs",
                    StatusCode: 403,
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate required fields
        if (
            useEmptyFields({
                ReqiuredFields: ["title", "content"],
                targetObject: body,
            }).isMissing
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Missing required fields: title and content",
                    StatusCode: 400,
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Generate unique slug for the blog
        const existingSlugs = await Blogs_Model.find({ 
            isDeleted: false 
        }).distinct('Slug');

        const blogSlug = generateUniqueSlug(body.title, existingSlugs);

        // Create blog content entry
        const contentID = v4();
        await BlogsContents_Model.create({
            ContentID: contentID,
            Data: body.content,
        });

        // Create blog entry
        const blogData = {
            ContentID: contentID,
            AuthorID: user.UserID,
            Title: body.title,
            Slug: blogSlug,
            Description: body.description || "",
            Tags: body.tags || [],
            BannerImage: body.bannerImage || "",
            Visiblity: body.visibility || BlogVisibility.Public,
            isPublished: body.isPublished || false,
            PublishDate: body.isPublished ? new Date() : undefined,
            CreateDate: new Date(),
            Likes: 0,
            Views: 0,
            LikedBy: [],
            History: [], // Initialize history array
        };

        const blog = await Blogs_Model.create(blogData);

        return NextResponse.json(
            {
                Status: 1,
                Message: blog.isPublished
                    ? "Blog published successfully"
                    : "Blog draft created successfully",
                StatusCode: 201,
                Data: {
                    blog: {
                        blogID: blog.BlogID,
                        slug: blog.Slug,
                        title: blog.Title,
                        isPublished: blog.isPublished,
                        visibility: blog.Visiblity,
                        createdAt: blog.CreateDate,
                    },
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        log(`Blog creation error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to create blog",
                StatusCode: 500,
            },
            { status: 500 }
        );
    }
}