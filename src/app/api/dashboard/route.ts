import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@Utils/dbConnect";
import { verifyJWT } from "@Utils/JWT";

export async function GET(req: NextRequest) {
    try {
        let userEmail: string | null = null;
        let authMethod: "nextauth" | "jwt" = "nextauth";

        // Try NextAuth session first
        const session = await auth();
        if (session?.user?.email) {
            userEmail = session.user.email;
            authMethod = "nextauth";
        } else {
            // Fallback to JWT token authentication
            const authHeader = req.headers.get("authorization");
            const token = authHeader?.replace("Bearer ", "") || req.cookies.get("auth-token")?.value;

            if (!token) {
                return NextResponse.json({
                    Status: 0,
                    Message: "Authentication required",
                    StatusCode: "AUTHENTICATION_REQUIRED"
                }, { status: 401 });
            }

            const decoded = await verifyJWT(token);
            if (!decoded || !decoded.email) {
                return NextResponse.json({
                    Status: 0,
                    Message: "Invalid authentication token",
                    StatusCode: "INVALID_TOKEN"
                }, { status: 401 });
            }

            userEmail = decoded.email;
            authMethod = "jwt";
        }

        if (!userEmail) {
            return NextResponse.json({
                Status: 0,
                Message: "Authentication required",
                StatusCode: "AUTHENTICATION_REQUIRED"
            }, { status: 401 });
        }

        await dbConnect();
        const { Users_Model } = await import("@Models/EnhancedUsers");
        const { Sessions_Model } = await import("@Models/Sessions");

        // Get user data by email (works for both NextAuth and JWT authentication)
        const user = await Users_Model.findOne({
            email: userEmail
        });

        if (!user) {
            return NextResponse.json({
                Status: 0,
                Message: "User not found",
                StatusCode: "USER_NOT_FOUND"
            }, { status: 404 });
        }

        // Get active sessions for this user
        const activeSessions = await Sessions_Model.find({
            UserID: user.UserID || user._id,
            ExpiresAt: { $gt: new Date() }
        }).sort({ LastActivity: -1 });

        // Format session data
        const formattedSessions = activeSessions.map(sess => ({
            id: sess.SessionID,
            platform: sess.Platform || "Unknown",
            browser: sess.Browser || "Unknown",
            location: sess.IPDataMappedResponse ? {
                city: sess.IPDataMappedResponse.City,
                country: sess.IPDataMappedResponse.Country,
                region: sess.IPDataMappedResponse.Region
            } : undefined,
            createdAt: sess.createdAt,
            lastActivity: sess.LastActivity || sess.updatedAt,
            isCurrent: false
        }));

        // Get connected accounts/providers from the user model
        const connectedAccounts = user.connectedAccounts || [];

        // Prepare user data with new model structure
        const userData = {
            UserID: user.UserID || user._id?.toString(),
            Username: user.profile?.username || user.profile?.displayName?.replace(/\s+/g, '').toLowerCase() || '',
            FirstName: user.profile?.firstName || user.profile?.displayName?.split(' ')[0] || '',
            LastName: user.profile?.lastName || user.profile?.displayName?.split(' ').slice(1).join(' ') || '',
            DisplayName: user.profile?.displayName || '',
            Bio: user.profile?.bio || '',
            Avatar: user.profile?.avatar || (session?.user?.image) || '',
            Website: user.profile?.website || '',
            Location: user.profile?.location || '',
            Emails: [{ 
                Email: user.email, 
                isPrimary: true, 
                isVerified: user.isEmailVerified
            }],
            isAdmin: user.role === 'admin',
            isEmailVerified: user.isEmailVerified,
            isMFA: user.security?.isMFAEnabled || false,
            role: user.role,
            accountType: user.accountType,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt || user.updatedAt || user.createdAt,
            preferences: user.preferences || {}
        };

        return NextResponse.json({
            Status: 1,
            Message: "Dashboard data retrieved successfully",
            Data: {
                user: userData,
                connectedAccounts: connectedAccounts.map((account: any) => ({
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    connectedAt: account.connectedAt,
                    lastUsed: account.lastUsed,
                    email: account.email
                })),
                activeSessions: formattedSessions,
                security: {
                    mfaEnabled: userData.isMFA,
                    passkeyEnabled: false, // Not implemented in new model yet
                    lastPasswordChange: user.updatedAt || user.createdAt
                }
            }
        });

    } catch (error: any) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            StatusCode: "INTERNAL_ERROR"
        }, { status: 500 });
    }
}
