import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import { NextRequest, NextResponse } from "next/server";
import { Sessions_Model } from "@Models/Sessions";
import { Users_Model } from "@Models/Users";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";
import { authenticateUser } from "@Utils/Auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Use the authentication middleware to validate the session
        const authResult = await authenticateUser(req, false);

        if (!authResult.success) {
            return ControllerResponseMap({
                Status: 0,
                Message: authResult.error || 'Authentication failed',
                StatusCode: authResult.statusCode || 401
            });
        }

        // Return validated session and user data
        return ControllerResponseMap({
            Status: 1,
            Message: "Session valid",
            StatusCode: 200,
            Data: {
                user: {
                    UserID: authResult.user!.UserID,
                    Username: authResult.user!.Username,
                    FirstName: authResult.user!.FirstName,
                    LastName: authResult.user!.LastName,
                    Email: authResult.user!.Email,
                    isAdmin: authResult.user!.isAdmin
                },
                session: {
                    SessionID: authResult.session!.SessionID,
                    Platform: authResult.session!.Platform,
                    Browser: authResult.session!.Browser,
                    ExpiresAt: authResult.session!.ExpiresAt
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
        // Authenticate user first
        const authResult = await authenticateUser(req, false);

        if (!authResult.success) {
            return ControllerResponseMap({
                Status: 0,
                Message: authResult.error || 'Authentication failed',
                StatusCode: authResult.statusCode || 401
            });
        }

        await dbConnect();

        // Delete the authenticated user's session (logout)
        await Sessions_Model.updateOne(
            { SessionID: authResult.session!.SessionID },
            { 
                isActive: false,
                LoggedOutAt: new Date()
            }
        );

        log(`User ${authResult.user!.UserID} logged out successfully`);

        return ControllerResponseMap({
            Status: 1,
            Message: "Logged out successfully",
            StatusCode: 200
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