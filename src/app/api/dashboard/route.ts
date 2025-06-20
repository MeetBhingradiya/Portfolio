import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";

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

        // Check if current session is still active
        const currentSession = await Sessions_Model.findOne({
            SessionID: decoded.sessionID,
            UserID: decoded.userID,
            ExpiresAt: { $gt: new Date() }
        });

        if (!currentSession) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Session expired or invalid",
                    StatusCode: 401
                },
                { status: 401 }
            );
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
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found or account suspended",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Get all active sessions for this user (excluding current session)
        const allActiveSessions = await Sessions_Model.find({
            UserID: decoded.userID,
            ExpiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .lean();

        // Separate current session from other sessions
        const otherActiveSessions = allActiveSessions.filter(
            (session) => session.SessionID !== decoded.sessionID
        );

        // Calculate security stats
        const totalActiveSessions = allActiveSessions.length;
        // Get last password change (check the most recent active credential)
        // If no credentials exist, fall back to account creation date
        const lastPasswordChange =
            user.Credentials && user.Credentials.length > 0
                ? user.Credentials.filter((cred: any) => cred.isActive).sort(
                      (a: any, b: any) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                  )[0]?.createdAt || user.createdAt
                : user.createdAt;
        // Prepare comprehensive user data
        const userData = {
            UserID: user.UserID,
            Username: user.Username,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Emails: user.Emails || [],
            PhoneNumbers: user.PhoneNumbers || [],
            Icon: user.Icon,
            DateOfBirth: user.DateOfBirth,
            Gender: user.Gender,
            isAdmin: user.isAdmin || user.Username === "MeetBhingradiya",
            isMFA: user.isMFA || false,
            isEmailVerified:
                user.Emails?.some((email) => email.isVerified) || false,
            createdAt: user.createdAt,
            lastLoginAt: currentSession.createdAt,
            profileCompleteness: calculateProfileCompleteness(user),
            thirdPartyConnections: user.thirdPartyConnections || []
        };

        // Prepare current session data
        const currentSessionData = {
            SessionID: currentSession.SessionID,
            Platform: currentSession.Platform || "Unknown",
            Browser: currentSession.Browser || "Unknown",
            ExpiresAt: currentSession.ExpiresAt,
            IPDataMappedResponse: currentSession.IPDataMappedResponse || {},
            createdAt: currentSession.createdAt,
            lastActivity: currentSession.updatedAt || currentSession.createdAt,
            isCurrent: true
        };

        // Prepare other active sessions data
        const otherSessionsData = otherActiveSessions.map((session) => ({
            SessionID: session.SessionID,
            Platform: session.Platform || "Unknown",
            Browser: session.Browser || "Unknown",
            ExpiresAt: session.ExpiresAt,
            IPDataMappedResponse: session.IPDataMappedResponse || {},
            createdAt: session.createdAt,
            lastActivity: session.updatedAt || session.createdAt,
            Location: getLocationString(session.IPDataMappedResponse),
            isCurrent: false
        }));

        // Security overview
        const securityData = {
            totalActiveSessions,
            lastPasswordChange,
            twoFactorEnabled: userData.isMFA,
            emailVerificationStatus: userData.isEmailVerified,
            accountAge: Math.floor(
                (new Date().getTime() - new Date(user.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
            ),
            lastLoginLocation: getLocationString(
                currentSession.IPDataMappedResponse
            )
        };

        return NextResponse.json({
            Status: 1,
            Message: "Dashboard data retrieved successfully",
            StatusCode: 200,
            Data: {
                user: userData,
                currentSession: currentSessionData,
                activeSessions: otherSessionsData,
                security: securityData,
                stats: {
                    totalSessions: totalActiveSessions,
                    emailCount: userData.Emails.length,
                    verifiedEmails: userData.Emails.filter(
                        (email) => email.isVerified
                    ).length,
                    phoneCount: userData.PhoneNumbers.length
                }
            }
        });
    } catch (error: any) {
        log(`Dashboard error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to retrieve dashboard data",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// Terminate all other sessions (keep current session active)
export async function DELETE(request: NextRequest) {
    try {
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

        // Verify current session is valid
        const currentSession = await Sessions_Model.findOne({
            SessionID: decoded.sessionID,
            UserID: decoded.userID,
            ExpiresAt: { $gt: new Date() }
        });

        if (!currentSession) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Current session invalid",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        // Delete all other sessions for this user (except current session)
        const result = await Sessions_Model.deleteMany({
            UserID: decoded.userID,
            SessionID: { $ne: decoded.sessionID }
        });

        log(
            `User ${decoded.userID} terminated ${result.deletedCount} other sessions`
        );

        return NextResponse.json({
            Status: 1,
            Message: `Successfully terminated ${result.deletedCount} other sessions`,
            StatusCode: 200,
            Data: {
                terminatedSessions: result.deletedCount
            }
        });
    } catch (error: any) {
        log(`Session termination error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to terminate sessions",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user: any): number {
    let completeness = 0;
    const fields = [
        "FirstName",
        "LastName",
        "Username",
        "Emails",
        "DateOfBirth",
        "Gender"
    ];

    fields.forEach((field) => {
        if (field === "Emails") {
            if (user.Emails && user.Emails.length > 0) completeness += 20;
        } else if (user[field]) {
            completeness += 16.67;
        }
    });

    return Math.round(completeness);
}

// Helper function to format location string
function getLocationString(ipData: any): string {
    if (!ipData) return "Unknown location";

    const parts = [];
    if (ipData.city) parts.push(ipData.city);
    if (ipData.region) parts.push(ipData.region);
    if (ipData.country) parts.push(ipData.country);

    return parts.length > 0 ? parts.join(", ") : "Unknown location";
}
