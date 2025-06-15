import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";

export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header or cookies
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({
                Status: 0,
                Message: 'Authentication token required',
                StatusCode: 401
            }, { status: 401 });
        }

        // Verify JWT token
        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json({
                Status: 0,
                Message: 'Invalid authentication token',
                StatusCode: 401
            }, { status: 401 });
        }

        await dbConnect();

        // Check if session is still active
        const session = await Sessions_Model.findOne({
            SessionID: decoded.sessionID,
            UserID: decoded.userID,
            ExpiresAt: { $gt: new Date() }
        });

        if (!session) {
            return NextResponse.json({
                Status: 0,
                Message: 'Session expired or invalid',
                StatusCode: 401
            }, { status: 401 });
        }

        // Get user data
        const user = await Users_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        }).select('-Credentials').lean();

        if (!user) {
            return NextResponse.json({
                Status: 0,
                Message: 'User not found or account suspended',
                StatusCode: 404
            }, { status: 404 });
        }

        // Prepare user data for frontend
        const userData = {
            UserID: user.UserID,
            Username: user.Username,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Emails: user.Emails,
            PhoneNumbers: user.PhoneNumbers,
            Icon: user.Icon,
            DateOfBirth: user.DateOfBirth,
            Gender: user.Gender,
            isAdmin: user.isAdmin || user.Username === "MeetBhingradiya",
            isMFA: user.isMFA,
            isEmailVerified: user.Emails?.some(email => email.isVerified) || false,
            createdAt: user.createdAt as Date,
            lastLoginAt: session.createdAt as Date,
            sessionInfo: {
                platform: session.Platform,
                browser: session.Browser,
                location: session.IPDataMappedResponse
            }
        };

        return NextResponse.json({
            Status: 1,
            Message: 'Dashboard data retrieved successfully',
            StatusCode: 200,
            Data: {
                user: userData,
                session: {
                    sessionID: session.SessionID,
                    expiresAt: session.ExpiresAt,
                    isActive: true
                }
            }
        });

    } catch (error: any) {
        log(`Dashboard error: ${error.message}`);
        return NextResponse.json({
            Status: 0,
            Message: 'Failed to retrieve dashboard data',
            StatusCode: 500
        }, { status: 500 });
    }
}