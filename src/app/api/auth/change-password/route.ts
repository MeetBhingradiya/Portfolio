import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@Utils/dbConnect";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({
                Status: 0,
                Message: "Authentication required",
                StatusCode: "AUTHENTICATION_REQUIRED"
            }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                Status: 0,
                Message: "Current password and new password are required",
                StatusCode: "MISSING_FIELDS"
            }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({
                Status: 0,
                Message: "New password must be at least 8 characters long",
                StatusCode: "WEAK_PASSWORD"
            }, { status: 400 });
        }

        await dbConnect();
        const { Users_Model } = await import("@Models/EnhancedUsers");

        // Find user by email
        const user = await Users_Model.findOne({
            email: session.user.email
        }).select('+password'); // Include password field

        if (!user) {
            return NextResponse.json({
                Status: 0,
                Message: "User not found",
                StatusCode: "USER_NOT_FOUND"
            }, { status: 404 });
        }

        // Check if user has a password (might be OAuth-only user)
        if (!user.password) {
            return NextResponse.json({
                Status: 0,
                Message: "No password set. Please set a password first.",
                StatusCode: "NO_PASSWORD_SET"
            }, { status: 400 });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return NextResponse.json({
                Status: 0,
                Message: "Current password is incorrect",
                StatusCode: "INVALID_PASSWORD"
            }, { status: 400 });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password and security info
        await Users_Model.updateOne(
            { email: session.user.email },
            {
                $set: {
                    password: hashedNewPassword,
                    "security.lastPasswordChange": new Date(),
                    "security.loginAttempts": 0, // Reset login attempts
                    lastActiveAt: new Date()
                },
                $unset: {
                    "security.lockUntil": 1 // Remove any account lock
                }
            }
        );

        return NextResponse.json({
            Status: 1,
            Message: "Password changed successfully",
            Data: {
                changedAt: new Date()
            }
        });

    } catch (error: any) {
        console.error("Change password error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            StatusCode: "INTERNAL_ERROR"
        }, { status: 500 });
    }
}
