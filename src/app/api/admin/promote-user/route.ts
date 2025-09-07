import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@/Models/Willbe/Users";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";
import { Config } from "@Config";
import * as jose from "jose";

export async function PUT(request: NextRequest) {
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

        // Get current user
        const currentUser = await Users_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        });

        if (!currentUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Check if user is admin or has signature verification
        const adminSignatureHeader = request.headers.get("Admin-Signature");
        let isAuthorized =
            currentUser.isAdmin || currentUser.Username === "MeetBhingradiya";

        // If not admin, check for valid admin signature token
        if (!isAuthorized && adminSignatureHeader) {
            try {
                const secret = new TextEncoder().encode(
                    Config.Env.ADMIN_SIGNATURE
                );
                const { payload } = await jose.jwtVerify(
                    adminSignatureHeader,
                    secret
                );

                // Verify the signature hash in the token
                if (payload.signature === Config.Env.ADMIN_SIGNATURE) {
                    isAuthorized = true;
                }
            } catch (jwtError) {
                // Invalid token, continue with unauthorized
            }
        }

        if (!isAuthorized) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message:
                        "Unauthorized: You don't have permission to grant admin access",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        const { userIdentifier, makeAdmin } = await request.json();

        if (!userIdentifier || typeof makeAdmin !== "boolean") {
            return NextResponse.json(
                {
                    Status: 0,
                    Message:
                        "Missing required fields: userIdentifier and makeAdmin",
                    StatusCode: 400
                },
                { status: 400 }
            );
        } // Find user by email or username (case-insensitive)
        const targetUser = await Users_Model.findOne({
            $or: [
                {
                    "Emails.Email": {
                        $regex: new RegExp(`^${userIdentifier}$`, "i")
                    }
                },
                { Username: { $regex: new RegExp(`^${userIdentifier}$`, "i") } }
            ],
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        });

        if (!targetUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found with provided email or username",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Check if already has the desired admin status
        if (targetUser.isAdmin === makeAdmin) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: `User ${targetUser.Username} is already ${makeAdmin ? "an admin" : "not an admin"}`,
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Update user admin status
        const updatedUser = await Users_Model.findOneAndUpdate(
            { UserID: targetUser.UserID },
            { isAdmin: makeAdmin },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Failed to update user admin status",
                    StatusCode: 500
                },
                { status: 500 }
            );
        }

        log(
            `Admin status ${makeAdmin ? "granted to" : "revoked from"} user ${updatedUser.Username} (${updatedUser.UserID}) by ${currentUser.Username} using ${adminSignatureHeader ? "signature verification" : "admin privileges"}`
        );

        return NextResponse.json(
            {
                Status: 1,
                Message: `Admin status ${makeAdmin ? "granted" : "revoked"} successfully`,
                StatusCode: 200,
                Data: {
                    userID: updatedUser.UserID,
                    username: updatedUser.Username,
                    email: updatedUser.Emails?.[0]?.Email || "No email",
                    isAdmin: updatedUser.isAdmin
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Promote user error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to update admin status",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
