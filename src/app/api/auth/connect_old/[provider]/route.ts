import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@Utils/JWT";
import {
    getOAuthProvider,
    generateState,
    buildAuthUrl
} from "@Utils/OAuthProviders";
import { log } from "@Utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider } = await params;

        // Verify authentication
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

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

        // Get host from request
        const host = request.headers.get("host") || "localhost:3000";

        // Get OAuth provider configuration
        const oauthProvider = getOAuthProvider(provider, host);
        if (!oauthProvider) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: `Unsupported OAuth provider: ${provider}`,
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Check if provider is configured
        if (!oauthProvider.clientId || !oauthProvider.clientSecret) {
            log(`OAuth provider ${provider} is not configured`);
            return NextResponse.json(
                {
                    Status: 0,
                    Message: `OAuth provider ${provider} is not configured`,
                    StatusCode: 500
                },
                { status: 500 }
            );
        }

        // Generate state parameter for security
        const state = generateState();

        // Build authorization URL
        const authUrl = buildAuthUrl(oauthProvider, state);

        // Store state in session/cookie for verification in callback
        const response = NextResponse.redirect(authUrl);
        response.cookies.set(`oauth_state_${provider}`, state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 600, // 10 minutes
            path: "/"
        });

        // Store user ID for callback
        response.cookies.set(`oauth_user_${provider}`, decoded.userID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 600, // 10 minutes
            path: "/"
        });

        log(
            `OAuth connect initiated for user ${decoded.userID} with provider ${provider}`
        );
        return response;
    } catch (error: any) {
        log(`OAuth connect error: ${error?.message}`);
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
