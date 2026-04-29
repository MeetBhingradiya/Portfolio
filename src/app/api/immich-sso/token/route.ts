/**
 * OIDC Token Endpoint
 * POST /api/immich-sso/token
 *
 * Immich exchanges the authorization code for an ID token + access token.
 *
 * Supports Basic auth and request body for client credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import dbConnect from "@Utils/dbConnect";
import { ImmichAuthCode } from "@Models/ImmichWhitelist";
import { getOIDCKeys, getIssuer, validateClient } from "@Utils/OIDCKeys";
import { createImmichSsoForbiddenResponse, getImmichCorsOrigin, isImmichSsoRequestAllowed } from "@Utils/immichSsoAccess";

export const dynamic = "force-dynamic";

function tokenError(error: string, description: string, status = 400): NextResponse {
    return NextResponse.json({ error, error_description: description }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
    if (!isImmichSsoRequestAllowed(req)) {
        return createImmichSsoForbiddenResponse();
    }

    let body: URLSearchParams;
    try {
        const text = await req.text();
        body = new URLSearchParams(text);
    } catch {
        return tokenError("invalid_request", "Unable to parse request body");
    }

    const grantType = body.get("grant_type");
    if (grantType !== "authorization_code") {
        return tokenError("unsupported_grant_type", "Only authorization_code is supported");
    }

    const code = body.get("code");
    const redirectUri = body.get("redirect_uri");

    // Client credentials — check Basic auth header first, then body params
    let clientId = body.get("client_id") || "";
    let clientSecret = body.get("client_secret") || "";

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Basic ")) {
        try {
            const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
            const [id, secret] = decoded.split(":");
            if (id) clientId = decodeURIComponent(id);
            if (secret) clientSecret = decodeURIComponent(secret);
        } catch {
            // ignore, fall back to body params
        }
    }

    if (!code || !redirectUri) {
        return tokenError("invalid_request", "Missing code or redirect_uri");
    }

    // Validate client
    const clientCheck = validateClient(clientId, clientSecret);
    if (!clientCheck.valid) {
        return tokenError("invalid_client", clientCheck.reason || "Invalid client", 401);
    }

    // Find the auth code
    await dbConnect();
    const authCode = await ImmichAuthCode.findOne({ code });
    if (!authCode) {
        return tokenError("invalid_grant", "Authorization code not found or already used");
    }

    // Check expiry
    if (authCode.expiresAt < new Date()) {
        await ImmichAuthCode.deleteOne({ code });
        return tokenError("invalid_grant", "Authorization code has expired");
    }

    // Validate client_id and redirect_uri match
    if (authCode.clientId !== clientId) {
        return tokenError("invalid_grant", "client_id mismatch");
    }
    if (authCode.redirectUri !== redirectUri) {
        return tokenError("invalid_grant", "redirect_uri mismatch");
    }

    // Delete the code (single-use)
    await ImmichAuthCode.deleteOne({ code });

    // Build ID token
    const { privateKey, kid } = await getOIDCKeys();
    const issuer = getIssuer();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour

    const idToken = await new SignJWT({
        sub: authCode.sub,
        email: authCode.email,
        name: authCode.name,
        email_verified: true,
        ...(authCode.nonce ? { nonce: authCode.nonce } : {})
    })
        .setProtectedHeader({ alg: "RS256", kid })
        .setIssuer(issuer)
        .setAudience(clientId)
        .setIssuedAt(now)
        .setExpirationTime(now + expiresIn)
        .sign(privateKey);

    // Access token = same sub:email signed short JWT (used for /userinfo)
    const accessToken = await new SignJWT({
        sub: authCode.sub,
        email: authCode.email,
        name: authCode.name,
        scope: authCode.scope
    })
        .setProtectedHeader({ alg: "RS256", kid })
        .setIssuer(issuer)
        .setAudience(clientId)
        .setIssuedAt(now)
        .setExpirationTime(now + expiresIn)
        .sign(privateKey);

    return NextResponse.json(
        {
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: expiresIn,
            id_token: idToken,
            scope: authCode.scope
        },
        {
            headers: {
                "Cache-Control": "no-store",
                "Pragma": "no-cache"
            }
        }
    );
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
    if (!isImmichSsoRequestAllowed(req)) {
        return createImmichSsoForbiddenResponse();
    }

    const corsOrigin = getImmichCorsOrigin(req);
    return new NextResponse(null, {
        status: 204,
        headers: {
            ...(corsOrigin ? { "Access-Control-Allow-Origin": corsOrigin, Vary: "Origin" } : {}),
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    });
}
