import { NextRequest, NextResponse } from "next/server";
import { withJWTAuth, AuthenticatedRequest } from "@Utils/JWTAuth";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";

// GET - Get user dashboard data
async function getUserDashboard(req: AuthenticatedRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        // Get user's sessions (excluding current one)
        const userSessions = await Sessions_Model.find({
            UserID: req.user!.UserID,
            isActive: true,
            SessionID: { $ne: req.session!.SessionID }
        }).select('SessionID Platform Browser LastActivity createdAt IPDataMappedResponse');        // Get user's complete profile
        const userProfile = await Users_Model.findOne({
            UserID: req.user!.UserID
        }).select('-Credentials'); // Exclude sensitive credential data

        // Get user's credentials separately for last password change
        const userCredentials = await Users_Model.findOne({
            UserID: req.user!.UserID
        }).select('Credentials');

        if (!userProfile) {
            return NextResponse.json({
                Status: 0,
                Message: 'User profile not found',
                StatusCode: 404
            }, { status: 404 });
        }

        return NextResponse.json({
            Status: 1,
            Message: 'Dashboard data retrieved successfully',
            StatusCode: 200,
            Data: {
                user: {
                    UserID: userProfile.UserID,
                    Username: userProfile.Username,
                    FirstName: userProfile.FirstName,
                    LastName: userProfile.LastName,
                    DateOfBirth: userProfile.DateOfBirth,
                    Gender: userProfile.Gender,
                    Emails: userProfile.Emails,
                    isAdmin: userProfile.isAdmin || false,
                    isEmailVerified: userProfile.Emails.some(email => email.isVerified),
                    MFA: {
                        isEnabled: userProfile.isMFA || false,
                        methods: userProfile.AuthenticatorApp?.isEnabled ? ['authenticatorApp'] : []
                    },
                    AccountStatus: {
                        isLocked: userProfile.isLocked,
                        isSuspended: userProfile.isSuspended,
                        isDeleted: userProfile.isDeleted
                    }
                },
                currentSession: {
                    SessionID: req.session!.SessionID,
                    Platform: req.session!.Platform,
                    Browser: req.session!.Browser,
                    ExpiresAt: req.session!.ExpiresAt
                },                activeSessions: userSessions.map(session => ({
                    SessionID: session.SessionID,
                    Platform: session.Platform,
                    Browser: session.Browser,
                    LastActivity: session.LastActivity,
                    CreatedAt: (session as any).createdAt, // MongoDB timestamps
                    Location: session.IPDataMappedResponse?.City || 'Unknown'
                })),                security: {
                    totalActiveSessions: userSessions.length + 1, // +1 for current session
                    lastPasswordChange: userCredentials?.Credentials
                        ?.filter(cred => cred.isActive)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt
                }
            }
        }, { status: 200 });

    } catch (error: any) {
        log(`Dashboard data retrieval error: ${error?.message}`);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, { status: 500 });
    }
}

// PUT - Update user profile
async function updateUserProfile(req: AuthenticatedRequest): Promise<NextResponse> {
    try {
        const Request = await req.json();
        
        // Validate and sanitize update fields
        const allowedUpdates = ['FirstName', 'LastName', 'DateOfBirth', 'Gender'];
        const updates: any = {};
        
        for (const field of allowedUpdates) {
            if (Request[field] !== undefined) {
                updates[field] = Request[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({
                Status: 0,
                Message: 'No valid fields to update',
                StatusCode: 400
            }, { status: 400 });
        }

        await dbConnect();

        // Update user profile
        await Users_Model.updateOne(
            { UserID: req.user!.UserID },
            { $set: updates }
        );

        log(`User ${req.user!.UserID} updated profile: ${Object.keys(updates).join(', ')}`);

        return NextResponse.json({
            Status: 1,
            Message: 'Profile updated successfully',
            StatusCode: 200,
            Data: {
                updatedFields: Object.keys(updates)
            }
        }, { status: 200 });

    } catch (error: any) {
        log(`Profile update error: ${error?.message}`);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, { status: 500 });
    }
}

// DELETE - Deactivate other sessions
async function deactivateOtherSessions(req: AuthenticatedRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        // Deactivate all other sessions for this user
        const result = await Sessions_Model.updateMany(
            {
                UserID: req.user!.UserID,
                SessionID: { $ne: req.session!.SessionID },
                isActive: true
            },
            {
                $set: {
                    isActive: false,
                    LoggedOutAt: new Date()
                }
            }
        );

        log(`User ${req.user!.UserID} deactivated ${result.modifiedCount} other sessions`);

        return NextResponse.json({
            Status: 1,
            Message: `Successfully deactivated ${result.modifiedCount} other sessions`,
            StatusCode: 200,
            Data: {
                deactivatedSessions: result.modifiedCount
            }
        }, { status: 200 });

    } catch (error: any) {
        log(`Session deactivation error: ${error?.message}`);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, { status: 500 });
    }
}

// Export protected endpoints using the withJWTAuth middleware
export const GET = withJWTAuth(getUserDashboard);
export const PUT = withJWTAuth(updateUserProfile);
export const DELETE = withJWTAuth(deactivateOtherSessions);
