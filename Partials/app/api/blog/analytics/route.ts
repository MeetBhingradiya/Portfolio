import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../../Utils/dbConnect";
import { Blogs_Model } from "../../../../Models/Blogs";
import { log } from "../../../../Utils";
import { verifyJWT } from "../../../../Utils/JWT";
import { Sessions_Model } from "../../../../Models";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";

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

        const user = await EnhancedUsers_Model.findOne({
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

// GET /api/blog/analytics - Get blog analytics
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);

        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Admin access required",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        await dbConnect();

        // Get overall statistics
        const totalBlogs = await Blogs_Model.countDocuments({
            isDeleted: false
        });
        const publishedBlogs = await Blogs_Model.countDocuments({
            isDeleted: false,
            isPublished: true
        });
        const draftBlogs = await Blogs_Model.countDocuments({
            isDeleted: false,
            isPublished: false
        });

        // Get total views and likes
        const viewsResult = await Blogs_Model.aggregate([
            { $match: { isDeleted: false, isPublished: true } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$Views" },
                    totalLikes: { $sum: "$Likes" }
                }
            }
        ]);

        const totalViews = viewsResult[0]?.totalViews || 0;
        const totalLikes = viewsResult[0]?.totalLikes || 0;

        // Get most popular blogs
        const popularBlogs = await Blogs_Model.find({
            isDeleted: false,
            isPublished: true
        })
            .sort({ Views: -1 })
            .limit(5)
            .select("BlogID Title Views Likes createdAt")
            .lean();

        // Get recent blogs
        const recentBlogs = await Blogs_Model.find({
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("BlogID Title isPublished createdAt")
            .lean();

        // Get blogs by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const blogsByMonth = await Blogs_Model.aggregate([
            {
                $match: {
                    isDeleted: false,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    published: {
                        $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        return NextResponse.json({
            Status: 1,
            Message: "Blog analytics retrieved successfully",
            StatusCode: 200,
            Data: {
                overview: {
                    totalBlogs,
                    publishedBlogs,
                    draftBlogs,
                    totalViews,
                    totalLikes,
                    avgViewsPerBlog:
                        publishedBlogs > 0
                            ? Math.round(totalViews / publishedBlogs)
                            : 0
                },
                popularBlogs,
                recentBlogs,
                blogsByMonth,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error: any) {
        log(`Blog analytics error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to retrieve blog analytics",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

