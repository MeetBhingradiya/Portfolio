import { NextRequest, NextResponse } from "next/server";
import { Users_Model as EnhancedUsers_Model } from "../../../Models/EnhancedUsers";
import { useEmptyFields } from "../../../Hooks";
import { Config } from "../../../Config";
import { dbConnect } from "../../../Utils/dbConnect";
import { log } from "../../../Utils";

// Using Node.js runtime for database access
// export const runtime = "edge";

// POST - Create/update username after email verification
export async function POST(req: NextRequest) {
    try {
        const Request = await req.json();

        if (
            useEmptyFields({
                targetObject: Request,
                ReqiuredFields: ["email", "username"]
            }).isMissing
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Email and username are required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Debug: Check if user exists at all
        const userExists = await EnhancedUsers_Model.findOne({
            email: Request.email.toLowerCase()
        });

        if (!userExists) {
            log(`Username API: User not found for email: ${Request.email}`);
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        log(`Username API: User found - ID: ${userExists.UserID}, isEmailVerified: ${userExists.isEmailVerified}`);

        // Find user by email and check if email is verified
        const user = await EnhancedUsers_Model.findOne({
            email: Request.email.toLowerCase(),
            isEmailVerified: true
        });

        if (!user) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: userExists.isEmailVerified ? "User verification issue" : "Email not verified. Please verify your email first.",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Check if username is already taken
        const existingUsername = await EnhancedUsers_Model.findOne({
            "profile.username": Request.username,
            UserID: { $ne: user.UserID } // Exclude current user
        });

        if (existingUsername) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Username is already taken",
                    StatusCode: 409
                },
                { status: 409 }
            );
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernameRegex.test(Request.username)) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message:
                        "Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Update username
        await EnhancedUsers_Model.updateOne(
            { UserID: user.UserID },
            {
                $set: {
                    "profile.username": Request.username,
                    "metadata.lastModified": new Date()
                }
            }
        );

        log(`User ${user.UserID} created username: ${Request.username}`);

        return NextResponse.json(
            {
                Status: 1,
                Message: "Username created successfully",
                StatusCode: 200,
                Data: {
                    UserID: user.UserID,
                    Username: Request.username,
                    Email: Request.email
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Username creation error: ${error?.message}`);
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

// GET - Check username availability
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const username = url.searchParams.get("username");

        if (!username) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Username parameter is required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid username format",
                    StatusCode: 400,
                    Data: {
                        available: false,
                        reason: "Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens"
                    }
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if username exists
        const existingUser = await EnhancedUsers_Model.findOne({
            "profile.username": username
        });

        const isAvailable = !existingUser;

        return NextResponse.json(
            {
                Status: 1,
                Message: isAvailable
                    ? "Username is available"
                    : "Username is already taken",
                StatusCode: 200,
                Data: {
                    username,
                    available: isAvailable,
                    reason: isAvailable ? null : "Username is already taken"
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Username availability check error: ${error?.message}`);
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
