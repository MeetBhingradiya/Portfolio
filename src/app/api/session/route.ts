import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import { NextRequest, NextResponse } from "next/server";
import { Sessions_Model } from "@Models/Sessions";
import { Users_Model } from "@Models/Users";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";
import { verifyJWT } from "@Utils/JWT";

// Using Node.js runtime for database access
// export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Get token from Authorization header or cookies
        const authHeader = req.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            req.cookies.get("auth-token")?.value;

        if (!token) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Authentication token required",
                StatusCode: 401
            });
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

        // Check if current session is still active
        const currentSession = await Sessions_Model.findOne({
            SessionID: decoded.sessionID,
            UserID: decoded.userID,
            ExpiresAt: { $gt: new Date() }
        });

        if (!currentSession) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Session expired or invalid",
                StatusCode: 401
            });
        }

        // Get user data
        const user = await Users_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        })
            .select("-Credentials")
            .lean();

        if (!user) {
            return ControllerResponseMap({
                Status: 0,
                Message: "User not found or account suspended",
                StatusCode: 404
            });
        }

        // Return validated session and user data
        return ControllerResponseMap({
            Status: 1,
            Message: "Session valid",
            StatusCode: 200,
            Data: {
                user: {
                    UserID: user.UserID,
                    Username: user.Username,
                    FirstName: user.FirstName,
                    LastName: user.LastName,
                    Email:
                        user.Emails?.find((email: any) => email.isPrimary)
                            ?.Email ||
                        user.Emails?.[0]?.Email ||
                        "",
                    isAdmin: user.isAdmin
                },
                session: {
                    SessionID: currentSession.SessionID,
                    Platform: currentSession.Platform,
                    Browser: currentSession.Browser,
                    ExpiresAt: currentSession.ExpiresAt
                }
            }
        });
    } catch (error: any) {
        log(`Session validation error: ${error?.message}`);
        return ControllerResponseMap({
            Status: 0,
            Message: "Internal server error",
            StatusCode: 500
        });
    }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    try {
        // Get token from Authorization header or cookies
        const authHeader = req.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            req.cookies.get("auth-token")?.value;

        if (!token) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Authentication token required",
                StatusCode: 401
            });
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

        // Check if current session exists and is active
        const currentSession = await Sessions_Model.findOne({
            SessionID: decoded.sessionID,
            UserID: decoded.userID,
            ExpiresAt: { $gt: new Date() }
        });

        if (!currentSession) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Session expired or invalid",
                StatusCode: 401
            });
        }

        // Delete the authenticated user's session (logout)
        await Sessions_Model.updateOne(
            { SessionID: decoded.sessionID },
            {
                isActive: false,
                LoggedOutAt: new Date()
            }
        );

        log(
            `User ${decoded.userID} logged out successfully from session ${decoded.sessionID}`
        );

        return ControllerResponseMap({
            Status: 1,
            Message: "Logged out successfully",
            StatusCode: 200,
            Data: {
                sessionID: decoded.sessionID,
                userID: decoded.userID,
                loggedOutAt: new Date()
            }
        });
    } catch (error: any) {
        log(`Logout error: ${error?.message}`);
        return ControllerResponseMap({
            Status: 0,
            Message: "Internal server error",
            StatusCode: 500
        });
    }
}
