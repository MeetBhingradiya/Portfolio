import { NextRequest, NextResponse } from "next/server";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { Decrypt } from "@Utils/Crypto";
import { IPData, log } from "@Utils";
import { dbConnect } from "@Utils/dbConnect";
import { generateAuthToken } from "@Utils/JWT";
import { Config } from "@Config";
import { getCurrentState } from "@Controllers/State";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        let Request = await req.json();
        if (
            useEmptyFields({
                ReqiuredFields: [
                    "username", // Changed from email to username per documentation
                    "password"
                ],
                targetObject: Request
            }).isMissing
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Missing required fields",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check state settings before allowing signin
        const currentState = await getCurrentState();
        if (!currentState) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Service configuration error",
                    StatusCode: 503
                },
                { status: 503 }
            );
        }

        // Check if signin is enabled
        if (!currentState.Authentication.Signin_Enabled) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Sign in is currently disabled",
                    StatusCode: 403
                },
                { status: 403 }
            );
        }

        // Find user by username or email (flexible lookup)
        const user = await Users_Model.findOne({
            "$or": [
                { Username: Request.username },
                { "Emails.Email": Request.username.toLowerCase() }
            ],
            "Emails.isVerified": true,
            "isDeleted": false,
            "isLocked": false,
            "isSuspended": false
        });

        if (!user) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid username or password",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await verifyUserPassword(
            user,
            Request.password
        );

        if (!isValidPassword) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid username or password",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        // Create session for tracking
        const sessionData = await createUserSession(user, req);
        if (!sessionData) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Failed to create session",
                    StatusCode: 500
                },
                { status: 500 }
            );
        }

        // Generate JWT token as per documentation
        const jwtToken = await generateAuthToken(
            {
                userID: user.UserID,
                email:
                    user.Emails.find((e) => e.isPrimary)?.Email ||
                    user.Emails[0]?.Email,
                username: user.Username,
                sessionID: sessionData.sessionID
            },
            "30d"
        );

        return NextResponse.json(
            {
                Status: 1,
                Message: "Sign in successful",
                StatusCode: 200,
                Data: {
                    AuthorisedToken: jwtToken,
                    SessionID: sessionData.sessionID
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(error?.message);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            {
                status: 500
            }
        );
    }
}

// Helper function to verify password
async function verifyUserPassword(
    user: any,
    password: string
): Promise<boolean> {
    try {
        // Get the active credential
        const activeCredential = user.Credentials?.find(
            (cred: any) => cred.isActive
        );

        if (!activeCredential) {
            return false;
        }

        // Decrypt the stored password using the user's credential data
        const decryptedPassword = await Decrypt(
            activeCredential.Data,
            activeCredential.Secret,
            activeCredential.Rounds
        );

        // Compare the provided password with the decrypted stored password
        return password === decryptedPassword;
    } catch (error) {
        log(`Password verification error: ${error}`);
        return false;
    }
}

// Helper function to create user session
async function createUserSession(user: any, req: NextRequest) {
    try {
        // Generate RSA key pairs for session encryption
        // const localStorageRSAKey = RSA.CreateRSAKeys();
        // const cookieRSAKey = RSA.CreateRSAKeys();

        // Create RSA key records in database for tracking permissions
        // const localStorageRSARecord = await RSAKeys_Model.create({
        //     Permissions: [RSAKeyPermissions.Local]
        // });

        // const cookieRSARecord = await RSAKeys_Model.create({
        //     Permissions: [RSAKeyPermissions.Cookies]
        // });

        // Generate access token
        const accessToken = crypto.randomBytes(64).toString("hex");

        // Get user agent and headers
        const userAgent = req.headers.get("user-agent") || "Unknown";
        const unknownHeaders: any[] = [];

        // Parse user agent for platform and browser detection
        const platform = detectPlatform(userAgent);
        const browser = detectBrowser(userAgent); // Create session with expiration
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const IP_Data = await IPData(getClientIP(req));

        const session = await Sessions_Model.create({
            UserID: user.UserID,
            LocalStorage_RSAKeyID: "null",
            Cookie_RSAKeyID: "null",
            AccessToken: accessToken,
            UserAgent: userAgent,
            UnknownRequestHeaders: unknownHeaders,
            DetectedExtensions: [],
            Platform: platform,
            Browser: browser,
            IPDataMappedResponse: IP_Data,
            ExpiresAt: expiresAt
        });
        return {
            sessionID: session.SessionID,
            accessToken: accessToken,
            localStorageKey: "",
            cookieKey: "",
            expiresAt: expiresAt
        };
    } catch (error) {
        log(`Session creation error: ${error}`);
        throw new Error("Failed to create session");
    }
}

// Helper function to detect platform from user agent
function detectPlatform(userAgent: string): string {
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "MacOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
        return "iOS";
    return "Unknown";
}

// Helper function to detect browser from user agent
function detectBrowser(userAgent: string): string {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";
    if (userAgent.includes("Arc")) return "Arc";
    return "Unknown";
}

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return req.headers.get("x-real-ip") || "Unknown";
}
