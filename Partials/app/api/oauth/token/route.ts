import { NextRequest, NextResponse } from "next/server";
import { log } from "../../../../Utils";
import * as jose from "jose";
import { authCodes } from "../authorize/route";

const IMMICH_CLIENT_ID = "immich";
const IMMICH_CLIENT_SECRET = process.env.IMMICH_OAUTH_SECRET || "immich-secret-key";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type");
        let grantType: string | null = null;
        let code: string | null = null;
        let redirectUri: string | null = null;
        let clientId: string | null = null;
        let clientSecret: string | null = null;

        // Parse request body based on content type
        if (contentType?.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            grantType = formData.get("grant_type") as string;
            code = formData.get("code") as string;
            redirectUri = formData.get("redirect_uri") as string;
            clientId = formData.get("client_id") as string;
            clientSecret = formData.get("client_secret") as string;
        } else {
            const body = await request.json();
            grantType = body.grant_type;
            code = body.code;
            redirectUri = body.redirect_uri;
            clientId = body.client_id;
            clientSecret = body.client_secret;
        }

        // Validate request
        if (!grantType || !code || !redirectUri) {
            return NextResponse.json(
                {
                    error: "invalid_request",
                    error_description: "Missing required parameters"
                },
                { status: 400 }
            );
        }

        if (grantType !== "authorization_code") {
            return NextResponse.json(
                {
                    error: "unsupported_grant_type",
                    error_description: "Only authorization_code grant type is supported"
                },
                { status: 400 }
            );
        }

        // Check client authentication
        const authHeader = request.headers.get("authorization");
        if (authHeader) {
            const [type, credentials] = authHeader.split(" ");
            if (type === "Basic") {
                const decoded = Buffer.from(credentials, "base64").toString();
                const [id, secret] = decoded.split(":");
                clientId = id;
                clientSecret = secret;
            }
        }

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                {
                    error: "invalid_client",
                    error_description: "Client authentication failed"
                },
                { status: 401 }
            );
        }

        if (clientId !== IMMICH_CLIENT_ID || clientSecret !== IMMICH_CLIENT_SECRET) {
            return NextResponse.json(
                {
                    error: "invalid_client",
                    error_description: "Invalid client credentials"
                },
                { status: 401 }
            );
        }

        // Verify authorization code
        const authData = authCodes.get(code);
        if (!authData) {
            return NextResponse.json(
                {
                    error: "invalid_grant",
                    error_description: "Invalid or expired authorization code"
                },
                { status: 400 }
            );
        }

        if (authData.used) {
            authCodes.delete(code);
            return NextResponse.json(
                {
                    error: "invalid_grant",
                    error_description: "Authorization code already used"
                },
                { status: 400 }
            );
        }

        if (authData.expiresAt < Date.now()) {
            authCodes.delete(code);
            return NextResponse.json(
                {
                    error: "invalid_grant",
                    error_description: "Authorization code expired"
                },
                { status: 400 }
            );
        }

        if (authData.clientId !== clientId || authData.redirectUri !== redirectUri) {
            return NextResponse.json(
                {
                    error: "invalid_grant",
                    error_description: "Mismatched client_id or redirect_uri"
                },
                { status: 400 }
            );
        }

        // Mark code as used
        authData.used = true;

        // Generate access token (JWT)
        const secret = new TextEncoder().encode(JWT_SECRET);
        const accessToken = await new jose.SignJWT({
            sub: authData.userID,
            email: authData.email,
            name: authData.name,
            aud: IMMICH_CLIENT_ID,
            iss: "https://meetbhingradiya.com"
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("1h")
            .setIssuedAt()
            .sign(secret);

        log(`OAuth access token issued for user ${authData.email} (Immich)`);

        // Clean up used code
        setTimeout(() => authCodes.delete(code), 1000);

        return NextResponse.json(
            {
                access_token: accessToken,
                token_type: "Bearer",
                expires_in: 3600,
                scope: "openid profile email"
            },
            { 
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                    "Pragma": "no-cache"
                }
            }
        );

    } catch (error: any) {
        log(`OAuth token error: ${error.message}`);
        return NextResponse.json(
            {
                error: "server_error",
                error_description: "Internal server error"
            },
            { status: 500 }
        );
    }
}
