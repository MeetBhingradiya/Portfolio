import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@/Models/Willbe/Users";
import { verifyJWT } from "@Utils/JWT";

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
        const currentUser = await Users_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        }).select("UserID Username isAdmin FirstName LastName");

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

        const isAdminUser =
            currentUser.isAdmin || currentUser.Username === "MeetBhingradiya";

        return NextResponse.json(
            {
                Status: 1,
                Message: "User admin status retrieved successfully",
                StatusCode: 200,
                Data: {
                    userID: currentUser.UserID,
                    username: currentUser.Username,
                    firstName: currentUser.FirstName,
                    lastName: currentUser.LastName,
                    isAdmin: isAdminUser,
                    hasDbAdminFlag: currentUser.isAdmin,
                    hasSpecialUsername:
                        currentUser.Username === "MeetBhingradiya",
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
