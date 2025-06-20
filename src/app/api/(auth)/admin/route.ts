import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@Utils/Auth";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { Tickets_Model } from "@Models/Tickets";
import { OTPs_Model } from "@Models/OneTimePass";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";

// GET - Get admin dashboard analytics
async function getAdminDashboard(
    req: AuthenticatedRequest
): Promise<NextResponse> {
    try {
        await dbConnect();

        // Get user statistics
        const totalUsers = await Users_Model.countDocuments({
            isDeleted: false
        });
        const verifiedUsers = await Users_Model.countDocuments({
            "isDeleted": false,
            "Emails.isVerified": true
        });
        const lockedUsers = await Users_Model.countDocuments({
            isDeleted: false,
            isLocked: true
        });
        const suspendedUsers = await Users_Model.countDocuments({
            isDeleted: false,
            isSuspended: true
        });

        // Get session statistics
        const activeSessions = await Sessions_Model.countDocuments({
            isActive: true
        });
        const totalSessions = await Sessions_Model.countDocuments();

        // Get ticket statistics (if tickets exist)
        let ticketStats = { total: 0, open: 0, closed: 0, pending: 0 };
        try {
            ticketStats.total = await Tickets_Model.countDocuments();
            ticketStats.open = await Tickets_Model.countDocuments({
                Status: "Open"
            });
            ticketStats.closed = await Tickets_Model.countDocuments({
                Status: "Closed"
            });
            ticketStats.pending = await Tickets_Model.countDocuments({
                Status: "Pending"
            });
        } catch (error) {
            // Tickets model might not exist, ignore error
        }

        // Get OTP statistics
        const pendingOTPs = await OTPs_Model.countDocuments({
            ExpiresAt: { $gt: new Date() }
        });

        // Get recent users (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentUsers = await Users_Model.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            isDeleted: false
        });

        // Get active sessions by platform
        const sessionsByPlatform = await Sessions_Model.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$Platform", count: { $sum: 1 } } }
        ]);

        return NextResponse.json(
            {
                Status: 1,
                Message: "Admin dashboard data retrieved successfully",
                StatusCode: 200,
                Data: {
                    userStats: {
                        total: totalUsers,
                        verified: verifiedUsers,
                        locked: lockedUsers,
                        suspended: suspendedUsers,
                        recentRegistrations: recentUsers
                    },
                    sessionStats: {
                        active: activeSessions,
                        total: totalSessions,
                        byPlatform: sessionsByPlatform
                    },
                    ticketStats,
                    securityStats: {
                        pendingOTPs,
                        verificationRate:
                            totalUsers > 0
                                ? ((verifiedUsers / totalUsers) * 100).toFixed(
                                      2
                                  )
                                : 0
                    },
                    adminInfo: {
                        requestedBy: req.user!.UserID,
                        requestedAt: new Date()
                    }
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Admin dashboard error: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// GET - Get user management data
async function getUserManagement(
    req: AuthenticatedRequest
): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const search = url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "all"; // all, active, locked, suspended

        await dbConnect();

        // Build search query
        const searchQuery: any = { isDeleted: false };

        if (search) {
            searchQuery.$or = [
                { FirstName: { $regex: search, $options: "i" } },
                { LastName: { $regex: search, $options: "i" } },
                { Username: { $regex: search, $options: "i" } },
                { "Emails.Email": { $regex: search, $options: "i" } }
            ];
        }

        if (status !== "all") {
            switch (status) {
                case "locked":
                    searchQuery.isLocked = true;
                    break;
                case "suspended":
                    searchQuery.isSuspended = true;
                    break;
                case "active":
                    searchQuery.isLocked = false;
                    searchQuery.isSuspended = false;
                    break;
            }
        }

        // Get users with pagination
        const users = await Users_Model.find(searchQuery)
            .select("-Credentials") // Exclude sensitive data
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalUsers = await Users_Model.countDocuments(searchQuery);

        return NextResponse.json(
            {
                Status: 1,
                Message: "User management data retrieved successfully",
                StatusCode: 200,
                Data: {
                    users: users.map((user) => ({
                        UserID: user.UserID,
                        Username: user.Username,
                        FirstName: user.FirstName,
                        LastName: user.LastName,
                        Email:
                            user.Emails.find((email) => email.isPrimary)
                                ?.Email || user.Emails[0]?.Email,
                        isEmailVerified: user.Emails.some(
                            (email) => email.isVerified
                        ),
                        isLocked: user.isLocked,
                        isSuspended: user.isSuspended,
                        isAdmin: user.isAdmin
                    })),
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalUsers / limit),
                        totalUsers,
                        hasNext: page < Math.ceil(totalUsers / limit),
                        hasPrev: page > 1
                    }
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`User management error: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// PUT - Update user status (lock/unlock, suspend/unsuspend)
async function updateUserStatus(
    req: AuthenticatedRequest
): Promise<NextResponse> {
    try {
        const Request = await req.json();

        if (!Request.userID || !Request.action) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User ID and action are required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Validate action
        const validActions = [
            "lock",
            "unlock",
            "suspend",
            "unsuspend",
            "delete",
            "makeAdmin",
            "removeAdmin"
        ];
        if (!validActions.includes(Request.action)) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid action",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if target user exists
        const targetUser = await Users_Model.findOne({
            UserID: Request.userID,
            isDeleted: false
        });

        if (!targetUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Prevent self-modification
        if (targetUser.UserID === req.user!.UserID) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Cannot modify your own account",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        // Apply the action
        const updates: any = {};
        let actionDescription = "";

        switch (Request.action) {
            case "lock":
                updates.isLocked = true;
                actionDescription = "locked";
                break;
            case "unlock":
                updates.isLocked = false;
                actionDescription = "unlocked";
                break;
            case "suspend":
                updates.isSuspended = true;
                actionDescription = "suspended";
                break;
            case "unsuspend":
                updates.isSuspended = false;
                actionDescription = "unsuspended";
                break;
            case "delete":
                updates.isDeleted = true;
                actionDescription = "deleted";
                break;
            case "makeAdmin":
                updates.isAdmin = true;
                actionDescription = "granted admin privileges";
                break;
            case "removeAdmin":
                updates.isAdmin = false;
                actionDescription = "removed admin privileges";
                break;
        }

        // Update user
        await Users_Model.updateOne(
            { UserID: Request.userID },
            { $set: updates }
        );

        // If user is locked, suspended, or deleted, deactivate all their sessions
        if (["lock", "suspend", "delete"].includes(Request.action)) {
            await Sessions_Model.updateMany(
                { UserID: Request.userID, isActive: true },
                {
                    $set: {
                        isActive: false,
                        LoggedOutAt: new Date()
                    }
                }
            );
        }

        log(
            `Admin ${req.user!.UserID} ${actionDescription} user ${Request.userID}`
        );

        return NextResponse.json(
            {
                Status: 1,
                Message: `User ${actionDescription} successfully`,
                StatusCode: 200,
                Data: {
                    userID: Request.userID,
                    action: Request.action,
                    performedBy: req.user!.UserID
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`User status update error: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// Export protected admin endpoints
export const GET = withAuth(getAdminDashboard, true); // Requires admin
export const PUT = withAuth(updateUserStatus, true); // Requires admin

// Create a separate route for user management with pagination
export async function POST(req: NextRequest): Promise<NextResponse> {
    return withAuth(getUserManagement, true)(req);
}
