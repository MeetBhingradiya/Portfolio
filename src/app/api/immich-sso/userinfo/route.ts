/**
 * OIDC UserInfo Endpoint
 * GET /api/immich-sso/userinfo
 *
 * Immich calls this with the access_token to get the user's profile.
 * Returns: sub, email, name, email_verified
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getOIDCKeys, getIssuer, validateClient } from "@Utils/OIDCKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    return handleUserInfo(req);
}

export async function POST(req: NextRequest) {
    return handleUserInfo(req);
}

async function handleUserInfo(req: NextRequest): Promise<NextResponse> {
    // Extract Bearer token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return NextResponse.json(
            { error: "invalid_token", error_description: "Missing access token" },
            { status: 401, headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' } }
        );
    }

    // Verify the access token
    const { privateKey: _pk, publicKey, kid } = await getOIDCKeys();
    const issuer = getIssuer();

    let payload: any;
    try {
        const result = await jwtVerify(token, publicKey, {
            issuer,
            algorithms: ["RS256"],
        });
        payload = result.payload;
    } catch (err: any) {
        return NextResponse.json(
            { error: "invalid_token", error_description: "Token verification failed" },
            { status: 401, headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' } }
        );
    }

    return NextResponse.json(
        {
            sub: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string,
            email_verified: true,
            preferred_username: (payload.email as string)?.split("@")[0],
        },
        {
            headers: {
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
            },
        }
    );
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
        },
    });
}
