import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../../Utils/dbConnect";
import { ControllerResponseMap } from "../../../../Utils/ControllerResponseMap";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";
import { verifyJWT } from "../../../../Utils/JWT";

export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header or cookies
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Authentication token required",
                StatusCode: 401
            })
        }

        // Verify JWT token
        const decoded = await verifyJWT(token);
        if (!decoded) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Invalid authentication token",
                StatusCode: 401
            });
        }

        await dbConnect();

        // Get current user
        const currentUser = await EnhancedUsers_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        }).select("UserID profile.username profile.firstName profile.lastName role");

        if (!currentUser) {
            return ControllerResponseMap({
                Status: 0,
                Message: "User not found",
                StatusCode: 404
            });
        }

        const isAdminUser =
            currentUser.role === "admin" || currentUser.profile?.username === "meetbhingradiya";

        return NextResponse.json(
            {
                Status: 1,
                Message: "User admin status retrieved successfully",
                StatusCode: 200,
                Data: {
                    userID: currentUser.UserID,
                    username: currentUser.profile?.username,
                    firstName: currentUser.profile?.firstName,
                    lastName: currentUser.profile?.lastName,
                    isAdmin: isAdminUser,
                    hasDbAdminFlag: currentUser.role === "admin",
                    hasSpecialUsername:
                        currentUser.profile?.username === "meetbhingradiya",
                    needsSignature: !isAdminUser
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to retrieve user admin status",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
