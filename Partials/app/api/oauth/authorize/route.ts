import { NextRequest, NextResponse } from "next/server";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";
import { dbConnect } from "../../../../Utils/dbConnect";
import { verifyJWT } from "../../../../Utils/JWT";
import { v4 as uuidv4 } from "uuid";
import { log } from "../../../../Utils";

// In-memory store for authorization codes (use Redis in production)
const authCodes = new Map<string, {
    code: string;
    clientId: string;
    redirectUri: string;
    userID: string;
    email: string;
    name: string;
    expiresAt: number;
    used: boolean;
}>();

// Cleanup expired codes every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [code, data] of authCodes.entries()) {
        if (data.expiresAt < now || data.used) {
            authCodes.delete(code);
        }
    }
}, 5 * 60 * 1000);

// Immich client configuration
const IMMICH_CLIENT_ID = "immich";
const IMMICH_CLIENT_SECRET = process.env.IMMICH_OAUTH_SECRET || "immich-secret-key";
const ALLOWED_REDIRECT_URIS = [
    "https://photos.meetbhingradiya.shop/auth/login",
    "https://photos.meetbhingradiya.shop/user-settings",
    "https://photos.meetbhingradiya.shop/api/oauth/mobile-redirect"
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("client_id");
        const redirectUri = searchParams.get("redirect_uri");
        const responseType = searchParams.get("response_type");
        const state = searchParams.get("state");
        const scope = searchParams.get("scope");

        // Validate OAuth parameters
        if (!clientId || !redirectUri || !responseType) {
            return NextResponse.json(
                {
                    error: "invalid_request",
                    error_description: "Missing required parameters: client_id, redirect_uri, response_type"
                },
                { status: 400 }
            );
        }

        if (responseType !== "code") {
            return NextResponse.json(
                {
                    error: "unsupported_response_type",
                    error_description: "Only 'code' response type is supported"
                },
                { status: 400 }
            );
        }

        if (clientId !== IMMICH_CLIENT_ID) {
            return NextResponse.json(
                {
                    error: "invalid_client",
                    error_description: "Unknown client_id"
                },
                { status: 401 }
            );
        }

        if (!ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
            return NextResponse.json(
                {
                    error: "invalid_request",
                    error_description: "Invalid redirect_uri"
                },
                { status: 400 }
            );
        }

        // Check if user is authenticated
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value;

        if (!token) {
            // Redirect to login with return URL
            const loginUrl = new URL("/auth/signin", request.url);
            loginUrl.searchParams.set("callbackUrl", request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Verify user session
        const decoded = await verifyJWT(token);
        if (!decoded) {
            const loginUrl = new URL("/auth/signin", request.url);
            loginUrl.searchParams.set("callbackUrl", request.url);
            return NextResponse.redirect(loginUrl);
        }

        await dbConnect();

        // Get user info from session
        const user = await EnhancedUsers_Model.findOne({
            UserID: decoded.userID,
            isDeleted: false,
            isLocked: false
        }).select("UserID email profile.displayName profile.firstName profile.lastName");

        if (!user) {
            return NextResponse.json(
                {
                    error: "invalid_grant",
                    error_description: "User not found"
                },
                { status: 404 }
            );
        }

        // Generate authorization code
        const authCode = uuidv4();
        const userName = user.profile?.displayName || 
                        `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 
                        user.email.split('@')[0];

        authCodes.set(authCode, {
            code: authCode,
            clientId,
            redirectUri,
            userID: user.UserID,
            email: user.email,
            name: userName,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            used: false
        });

        log(`OAuth authorization code generated for user ${user.email} (Immich)`);

        // Redirect back to Immich with authorization code
        const callback = new URL(redirectUri);
        callback.searchParams.set("code", authCode);
        if (state) {
            callback.searchParams.set("state", state);
        }

        return NextResponse.redirect(callback.toString());

    } catch (error: any) {
        log(`OAuth authorize error: ${error.message}`);
        return NextResponse.json(
            {
                error: "server_error",
                error_description: "Internal server error"
            },
            { status: 500 }
        );
    }
}

export { authCodes };

