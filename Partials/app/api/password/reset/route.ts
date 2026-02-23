import { NextRequest, NextResponse } from "next/server";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";
import { OTPs_Model, OTPs } from "../../../../Models/OneTimePass";
import { useEmptyFields } from "../../../../Hooks/useEmptyFields";
import { dbConnect } from "../../../../Utils/dbConnect";
import { log } from "../../../../Utils";
import {
    Encrypt,
    generateSalt,
    generateRounds,
    generateSecret
} from "../../../../Utils/Crypto";

// PUT - Reset password with OTP verification
export async function PUT(req: NextRequest) {
    try {
        const Request = await req.json();

        if (
            useEmptyFields({
                ReqiuredFields: ["email", "otp", "newPassword"],
                targetObject: Request
            }).isMissing
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Email, OTP, and new password are required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find valid password reset OTP
        const otpRecord = await OTPs_Model.findOne({
            Type: OTPs.PasswordReset,
            ExpiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid or expired reset code",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Parse OTP data
        const otpData = JSON.parse(otpRecord.Data);

        if (
            otpData.email !== Request.email.toLowerCase() ||
            otpData.otp !== Request.otp
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid reset code",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Find the user
        const user = await EnhancedUsers_Model.findOne({
            "UserID": otpData.userID,
            "Emails.Email": Request.email.toLowerCase(),
            "isDeleted": false
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

        // Check if account is locked or suspended
        if (user.isLocked() || user.isSuspended) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message:
                        "Account is locked or suspended. Please contact support.",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        // Encrypt new password
        const salt = generateSalt();
        const rounds = generateRounds();
        const secret = generateSecret();

        const encryptedPassword = await Encrypt({
            Data: Request.newPassword,
            Secret: secret,
            Salt: salt,
            Format: "both",
            Rounds: rounds
        });

        // Update user's password by adding a new credential and deactivating old ones
        await EnhancedUsers_Model.updateOne(
            { UserID: otpData.userID },
            {
                $set: {
                    "Credentials.$[].isActive": false // Deactivate all existing credentials
                }
            }
        );

        // Add new active credential
        await EnhancedUsers_Model.updateOne(
            { UserID: otpData.userID },
            {
                $push: {
                    Credentials: {
                        Salt: salt,
                        Secret: secret,
                        Data: encryptedPassword,
                        Rounds: rounds,
                        isActive: true
                    }
                }
            }
        );

        // Delete used OTP
        await OTPs_Model.deleteOne({ _id: otpRecord._id });

        // Also delete any other password reset OTPs for this user
        await OTPs_Model.deleteMany({
            Type: OTPs.PasswordReset,
            Data: { $regex: `"userID":"${otpData.userID}"` }
        });

        log(`Password reset successful for user ${otpData.userID}`);

        return NextResponse.json(
            {
                Status: 1,
                Message: "Password reset successfully",
                StatusCode: 200,
                Data: {
                    userID: otpData.userID,
                    email: Request.email
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Password reset error: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// POST - Verify password reset OTP (without changing password)
export async function POST(req: NextRequest) {
    try {
        const Request = await req.json();

        if (
            useEmptyFields({
                ReqiuredFields: ["email", "otp"],
                targetObject: Request
            }).isMissing
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Email and OTP are required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find valid password reset OTP
        const otpRecord = await OTPs_Model.findOne({
            Type: OTPs.PasswordReset,
            ExpiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid or expired reset code",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Parse OTP data
        const otpData = JSON.parse(otpRecord.Data);

        if (
            otpData.email !== Request.email.toLowerCase() ||
            otpData.otp !== Request.otp
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid reset code",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Verify user exists and is valid
        const user = await EnhancedUsers_Model.findOne({
            "UserID": otpData.userID,
            "Emails.Email": Request.email.toLowerCase(),
            "isDeleted": false
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

        if (user.isLocked() || user.isSuspended) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message:
                        "Account is locked or suspended. Please contact support.",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                Status: 1,
                Message: "Reset code verified successfully",
                StatusCode: 200,
                Data: {
                    userID: otpData.userID,
                    email: Request.email,
                    verified: true
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Password reset OTP verification error: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

