import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@Utils/dbConnect";

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({
                Status: 0,
                Message: "Authentication required",
                StatusCode: "AUTHENTICATION_REQUIRED"
            }, { status: 401 });
        }

        await dbConnect();
        const { Users_Model } = await import("@Models/EnhancedUsers");
        const { Sessions_Model } = await import("@Models/Sessions");

        // Find user by email
        const user = await Users_Model.findOne({
            email: session.user.email
        });

        if (!user) {
            return NextResponse.json({
                Status: 0,
                Message: "User not found",
                StatusCode: "USER_NOT_FOUND"
            }, { status: 404 });
        }

        const userID = user.UserID || user._id;

        // Delete user's sessions first
        await Sessions_Model.deleteMany({
            UserID: userID
        });

        // Soft delete or hard delete the user account
        // For compliance and data retention, we'll do a soft delete
        await Users_Model.updateOne(
            { email: session.user.email },
            {
                $set: {
                    isActive: false,
                    isSuspended: true,
                    email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
                    "profile.displayName": "Deleted User",
                    "profile.firstName": "",
                    "profile.lastName": "",
                    "profile.bio": "",
                    "profile.avatar": "",
                    "profile.website": "",
                    "profile.location": "",
                    password: null,
                    connectedAccounts: [],
                    deletedAt: new Date()
                }
            }
        );

        // Alternative: Hard delete (uncomment if preferred)
        // await Users_Model.deleteOne({ email: session.user.email });

        return NextResponse.json({
            Status: 1,
            Message: "Account deleted successfully",
            Data: {
                deletedAt: new Date()
            }
        });

    } catch (error: any) {
        console.error("Delete account error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            StatusCode: "INTERNAL_ERROR"
        }, { status: 500 });
    }
}
