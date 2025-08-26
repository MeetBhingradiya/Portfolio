import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@Utils/JWT";
import { Users_Model } from "@Models/Users";
import { dbConnect } from "@Utils/dbConnect";
import { Sessions_Model } from "@/Models";

// Using Node.js runtime for database access
// export const runtime = "edge";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "No authentication token provided",
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

        // Connect to database and verify user exists
        await dbConnect();
        const user = await Users_Model.findOne({
            UserID: decoded.userID
        }).select("UserID Username FirstName LastName Emails isAdmin");

        const session = await Sessions_Model.findOne({
            UserID: decoded.userID,
            SessionID: decoded.sessionID
        });

        if (!user) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        if (!session) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Session not found or its revoked or expired",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Check if user account is still active (you can add more checks here)
        // For example, check if account is not disabled, suspended, etc.
        if (!session.isActive) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User account is not active",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            Status: 1,
            Message: "Token is valid",
            StatusCode: 200,
            Data: {
                userID: user.UserID,
                username: user.Username,
                firstName: user.FirstName,
                lastName: user.LastName,
                email:
                    user.Emails.find((e) => e.isPrimary)?.Email ||
                    user.Emails[0]?.Email,
                isAdmin: user.isAdmin,
                isEmailVerified: user.Emails.some((e) => e.isVerified)
            }
        });
    } catch (error: any) {
        console.error("Token validation error:", error);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Token validation failed",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
