import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@Utils/dbConnect";
import { verifyJWT } from "@Utils/JWT";

// Using Node.js runtime for database access
// export const runtime = "edge";

export async function PUT(req: NextRequest) {
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

        const updateData = await req.json();
        const {
            firstName,
            lastName,
            displayName,
            bio,
            website,
            location,
            preferences
        } = updateData;

        await dbConnect();
        const { Users_Model } = await import("@Models/EnhancedUsers");

        // Find and update user
        const updatedUser = await Users_Model.findOneAndUpdate(
            { email: userEmail },
            {
                $set: {
                    "profile.firstName": firstName,
                    "profile.lastName": lastName,
                    "profile.displayName": displayName,
                    "profile.bio": bio,
                    "profile.website": website,
                    "profile.location": location,
                    preferences: preferences,
                    lastActiveAt: new Date()
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({
                Status: 0,
                Message: "User not found",
                StatusCode: "USER_NOT_FOUND"
            }, { status: 404 });
        }

        // Return updated user data
        const userData = {
            UserID: updatedUser.UserID || updatedUser._id?.toString(),
            Username: updatedUser.profile?.username || updatedUser.profile?.displayName?.replace(/\s+/g, '').toLowerCase() || '',
            FirstName: updatedUser.profile?.firstName || '',
            LastName: updatedUser.profile?.lastName || '',
            DisplayName: updatedUser.profile?.displayName || '',
            Bio: updatedUser.profile?.bio || '',
            Avatar: updatedUser.profile?.avatar || (authMethod === "nextauth" ? session?.user?.image : null),
            Website: updatedUser.profile?.website || '',
            Location: updatedUser.profile?.location || '',
            Emails: [{ 
                Email: updatedUser.email, 
                isPrimary: true, 
                isVerified: updatedUser.isEmailVerified
            }],
            isAdmin: updatedUser.role === 'admin',
            isEmailVerified: updatedUser.isEmailVerified,
            isMFA: updatedUser.security?.isMFAEnabled || false,
            role: updatedUser.role,
            accountType: updatedUser.accountType,
            createdAt: updatedUser.createdAt,
            lastLoginAt: updatedUser.lastLoginAt || updatedUser.updatedAt || updatedUser.createdAt,
            preferences: updatedUser.preferences || {}
        };

        return NextResponse.json({
            Status: 1,
            Message: "Profile updated successfully",
            Data: {
                user: userData
            }
        });

    } catch (error: any) {
        console.error("Profile update error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            StatusCode: "INTERNAL_ERROR"
        }, { status: 500 });
    }
}
