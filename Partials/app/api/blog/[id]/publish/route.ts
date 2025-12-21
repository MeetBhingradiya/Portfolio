import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../../../Utils/dbConnect";
import { log } from "../../../../../Utils";
import { verifyJWT } from "../../../../../Utils/JWT";
import { Sessions_Model, Users_Model, Blogs_Model } from "../../../../../Models";

// Helper function to get user from token
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
            ExpiresAt: { $gt: new Date() }
        });

        if (!session) return null;

        const user = await Users_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        });

        return user;
    } catch (error) {
        log(`Token verification error: ${error}`);
        return null;
    }
}

// Define the route context type properly
interface RouteContext {
    params: Promise<{ id: string }>;
}

// POST /api/blog/[id]/publish - Toggle publish status
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const user = await getUserFromToken(request);

        if (!user) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        await dbConnect();

        // Await the params since they're now a Promise in Next.js 15
        const params = await context.params;
        const { id: blogID } = params;

        const body = await request.json();
        const { action } = body; // 'publish' or 'unpublish'

        // Find existing blog
        const existingBlog = await Blogs_Model.findOne({
            BlogID: blogID,
            isDeleted: false
        });

        if (!existingBlog) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Blog not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Check permissions (author or admin)
        if (existingBlog.AuthorID !== user.UserID && user.role !== 'admin') {
            return NextResponse.json(
                {
                    Status: 0,
                    Message:
                        "Insufficient permissions to publish/unpublish this blog",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        const isPublishing = action === "publish";
        const updateData: any = {
            isPublished: isPublishing
        };

        if (isPublishing) {
            updateData.PublishDate = new Date();
        }

        await Blogs_Model.updateOne({ BlogID: blogID }, updateData);

        return NextResponse.json({
            Status: 1,
            Message: `Blog ${isPublishing ? "published" : "unpublished"} successfully`,
            StatusCode: 200,
            Data: {
                blogID,
                isPublished: isPublishing,
                publishDate: isPublishing ? updateData.PublishDate : null
            }
        });
    } catch (error: any) {
        log(`Blog publish error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to update publish status",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
