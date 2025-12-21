import { NextRequest, NextResponse } from "next/server";
import { log } from "../../../../Utils";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
    try {
        // Get access token from Authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                {
                    error: "invalid_token",
                    error_description: "Missing or invalid authorization header"
                },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verify JWT token
        const secret = new TextEncoder().encode(JWT_SECRET);
        let payload;
        
        try {
            const { payload: jwtPayload } = await jose.jwtVerify(token, secret);
            payload = jwtPayload;
        } catch (error) {
            return NextResponse.json(
                {
                    error: "invalid_token",
                    error_description: "Token verification failed"
                },
                { status: 401 }
            );
        }

        // Return user info in OpenID Connect format
        const email = typeof payload.email === 'string' ? payload.email : '';
        return NextResponse.json(
            {
                sub: payload.sub,
                email: payload.email,
                email_verified: true,
                name: payload.name,
                preferred_username: email.split('@')[0],
                iss: payload.iss,
                aud: payload.aud
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
        log(`OAuth userinfo error: ${error.message}`);
        return NextResponse.json(
            {
                error: "server_error",
                error_description: "Internal server error"
            },
            { status: 500 }
        );
    }
}
