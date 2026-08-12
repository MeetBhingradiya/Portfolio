/**
 * SSO OIDC Authorization Endpoint
 * GET /api/sso/authorize
 */
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getIssuer, isRedirectUriAllowed } from "@Utils/OIDCKeys";
import { SSOApp } from "@Models/SSO";
import dbConnect from "@Utils/dbConnect";

export const dynamic = "force-dynamic";

function oidcError(redirectUri: string | null, state: string | null, error: string, description: string, baseUrl: string): NextResponse {
    if (redirectUri) {
        const url = new URL(redirectUri);
        url.searchParams.set("error", error);
        url.searchParams.set("error_description", description);
        if (state) url.searchParams.set("state", state);
        return NextResponse.redirect(url.toString());
    }
    // Can't redirect - show error page
    return NextResponse.redirect(
        new URL(`/sso?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(description)}`, baseUrl)
    );
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const responseType = searchParams.get("response_type");
    const clientId = searchParams.get("client_id") || "";
    const redirectUri = searchParams.get("redirect_uri");
    const scope = searchParams.get("scope") || "openid email profile";
    const state = searchParams.get("state");
    const nonce = searchParams.get("nonce");
    const loginHint = searchParams.get("login_hint");
    const baseUrl = req.nextUrl.origin;

    if (!clientId) {
        return oidcError(redirectUri, state, "invalid_request", "client_id is missing", baseUrl);
    }

    await dbConnect();
    
    // Validate client against database
    const app = await SSOApp.findOne({ clientId, enabled: true });
    
    if (!app) {
        return oidcError(redirectUri, state, "unauthorized_client", "Unknown or disabled client_id", baseUrl);
    }

    if (app.allowNewTokens === false) {
        return oidcError(redirectUri, state, "access_denied", "This application is currently not allowed to issue new tokens.", baseUrl);
    }

    // - Gate key validation -------------------------------------------------
    // If the app has a gate key configured, require the ?_gate query param to match
    if (app.gateKey) {
        const gateKey = searchParams.get("_gate");
        if (!gateKey || gateKey !== app.gateKey) {
            console.warn(`[authorize] Gate key mismatch for app ${app.name} - rejecting request`);
            return NextResponse.redirect(new URL("/?notice=sso_access_denied", baseUrl));
        }
    }

    // Validate redirect_uri
    if (!redirectUri) {
        return NextResponse.redirect(new URL("/sso?error=missing_redirect_uri", baseUrl));
    }

    if (!isRedirectUriAllowed(redirectUri, app.redirectUris)) {
        return oidcError(null, state, "invalid_request", "redirect_uri is not allowed", baseUrl);
    }

    // Validate response_type
    if (responseType !== "code") {
        return oidcError(redirectUri, state, "unsupported_response_type", "Only 'code' response_type is supported", baseUrl);
    }

    // Build a short-lived signed JWT containing the OIDC request params
    const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me");
    const oidcRequestToken = await new SignJWT({
        clientId,
        redirectUri,
        scope,
        state: state || "",
        nonce: nonce || "",
        loginHint: loginHint || ""
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("10m")
        .setIssuer(getIssuer())
        .sign(secret);

    // Redirect to the SSO login page and store the OIDC request in a cookie
    const loginUrl = new URL("/sso", baseUrl);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set("sso_request", oidcRequestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/"
    });

    return response;
}
