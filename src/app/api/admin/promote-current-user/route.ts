import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@/Models/Willbe/Users";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";
import { Config } from "@Config";
import { createHash } from "crypto";
import * as jose from "jose";

export async function POST(request: NextRequest) {
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

        // Get current user first to check if already admin
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

        // Check if user is already admin or has special username
        if (currentUser.isAdmin || currentUser.Username === "MeetBhingradiya") {
            // Already admin, no signature needed - just return success
            const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
            const adminToken = await new jose.SignJWT({
                signature: "already_admin",
                userID: currentUser.UserID
            })
                .setProtectedHeader({ alg: "HS256" })
                .setExpirationTime("30m")
                .sign(secret);

            return NextResponse.json(
                {
                    Status: 1,
                    Message: "User is already an admin",
                    StatusCode: 200,
                    Data: {
                        token: adminToken,
                        userID: currentUser.UserID,
                        username: currentUser.Username,
                        isAlreadyAdmin: true
                    }
                },
                { status: 200 }
            );
        }

        const { signature } = await request.json();

        if (!signature) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Missing required field: signature",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Verify admin signature
        const signatureHash = createHash("sha512")
            .update(signature)
            .digest("hex");

        if (signatureHash !== Config.Env.ADMIN_SIGNATURE) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid admin signature",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        // Promote current user to admin
        const updatedUser = await Users_Model.findOneAndUpdate(
            { UserID: decoded.userID },
            { isAdmin: true },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Failed to promote user to admin",
                    StatusCode: 500
                },
                { status: 500 }
            );
        } // Generate admin token
        const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
        const adminToken = await new jose.SignJWT({
            signature: signatureHash,
            userID: updatedUser.UserID
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("30m")
            .sign(secret);

        log(
            `User ${updatedUser.Username} (${updatedUser.UserID}) promoted to admin via signature verification`
        );

        return NextResponse.json(
            {
                Status: 1,
                Message: "Successfully promoted to admin",
                StatusCode: 200,
                Data: {
                    token: adminToken,
                    userID: updatedUser.UserID,
                    username: updatedUser.Username,
                    isAlreadyAdmin: false
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Promote current user error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500,
                Debug: error?.message
            },
            { status: 500 }
        );
    }
}
