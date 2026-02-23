import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../../Utils/dbConnect";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";
import { verifyJWT } from "../../../../Utils/JWT";
import { log } from "../../../../Utils";

export async function PUT(request: NextRequest) {
    try {
        // Get token from Authorization header or cookies
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication token required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        // Verify JWT token
        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid authentication token",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        await dbConnect();

        // Get current user
        const currentUser = await EnhancedUsers_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        });

        if (!currentUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Check if user is already admin or has special username
        if (currentUser.role !== "admin" && currentUser.profile?.username !== "meetbhingradiya") {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Unauthorized: You don't have permission to grant admin access",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        const { userID, makeAdmin } = await request.json();

        if (!userID || typeof makeAdmin !== 'boolean') {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Missing required fields: userID and makeAdmin",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Update user admin status
        const updatedUser = await EnhancedUsers_Model.findOneAndUpdate(
            { UserID: userID },
            { role: makeAdmin ? "admin" : "user" },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        log(`Admin status ${makeAdmin ? 'granted to' : 'revoked from'} user ${updatedUser.profile?.username} (${userID}) by ${currentUser.profile?.username}`);

        return NextResponse.json(
            {
                Status: 1,
                Message: `Admin status ${makeAdmin ? 'granted' : 'revoked'} successfully`,
                StatusCode: 200,
                Data: {
                    userID: updatedUser.UserID,
                    username: updatedUser.profile?.username,
                    isAdmin: updatedUser.role === "admin"
                }
            },
            { status: 200 }
        );

    } catch (error: any) {
        log(`Set admin status error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to update admin status",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check current admin status
export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header or cookies
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication token required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        // Verify JWT token
        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid authentication token",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        await dbConnect();

        // Get current user
        const currentUser = await EnhancedUsers_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        }).select('UserID profile.username profile.firstName profile.lastName role');

        if (!currentUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        const isAdminUser = currentUser.role === "admin" || currentUser.profile?.username === "meetbhingradiya";

        return NextResponse.json(
            {
                Status: 1,
                Message: "Admin status retrieved successfully",
                StatusCode: 200,
                Data: {
                    userID: currentUser.UserID,
                    username: currentUser.profile?.username,
                    firstName: currentUser.profile?.firstName,
                    lastName: currentUser.profile?.lastName,
                    isAdmin: isAdminUser,
                    hasDbAdminFlag: currentUser.role === "admin",
                    hasSpecialUsername: currentUser.profile?.username === "meetbhingradiya"
                }
            },
            { status: 200 }
        );

    } catch (error: any) {
        log(`Get admin status error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to retrieve admin status",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
