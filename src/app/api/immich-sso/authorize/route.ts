/**
 * OIDC Authorization Endpoint
 * GET /api/immich-sso/authorize
 *
 * Security gate (evaluated first):
 *  1. `_gate` query param must match IMMICH_SSO_GATE_KEY env var.
 *  2. `Origin` or `Referer` should originate from the Immich instance.
 *     If headers are missing in mobile/webview flows, fallback is allowed only
 *     for valid redirect_uri + mobile/Immich-like user-agent requests.
 *
 * If both pass: validates OIDC request params, stores them in a signed
 * cookie, then redirects the user to /immich-sso login page.
 */
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getIssuer, validateClient, isRedirectUriAllowed } from "@Utils/OIDCKeys";
import { Config } from "@Config/Server";
import { UserAgent } from "@Library/UserAgent";
import { normalizeHeader } from "@Utils/NormalizeHeader";

export const dynamic = "force-dynamic";

function oidcError(
    redirectUri: string | null,
    state: string | null,
    error: string,
    description: string,
    baseUrl: string
): NextResponse {
    if (redirectUri) {
        const url = new URL(redirectUri);
        url.searchParams.set("error", error);
        url.searchParams.set("error_description", description);
        if (state) url.searchParams.set("state", state);
        return NextResponse.redirect(url.toString());
    }
    // Can't redirect - show error page
    return NextResponse.redirect(
        new URL(
            `/immich-sso?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(description)}`,
            baseUrl
        )
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
    const baseUrl = req.nextUrl.origin;

    // - Gate key validation -------------------------------------------------
    // The Immich OIDC authorization URL must include ?_gate=<IMMICH_SSO_GATE_KEY>
    const gateKey = searchParams.get("_gate");
    const expectedKey = process.env.IMMICH_SSO_GATE_KEY;
    if (!expectedKey || !gateKey || gateKey !== expectedKey) {
        console.warn("[authorize] Gate key mismatch - rejecting request");
        return NextResponse.redirect(new URL("/?notice=immich_access_denied", baseUrl));
    }

    // Validate client
    const clientCheck = validateClient(clientId);
    if (!clientCheck.valid) {
        return oidcError(
            redirectUri,
            state,
            "unauthorized_client",
            clientCheck.reason || "Invalid client_id",
            baseUrl
        );
    }

    // Validate redirect_uri
    if (!redirectUri) {
        return NextResponse.redirect(new URL("/immich-sso?error=missing_redirect_uri", baseUrl));
    }

    if (!isRedirectUriAllowed(redirectUri)) {
        return oidcError(
            null,
            state,
            "invalid_request",
            "redirect_uri is not allowed",
            baseUrl
        );
    }

    // - Origin / Referer validation ----------------------------------------
    // Browsers usually send Origin/Referer, but some Android secure-folder / webview
    // flows omit them or send non-URL placeholders (e.g., "null").
    const origin = normalizeHeader(req.headers.get("origin"));
    const referer = normalizeHeader(req.headers.get("referer"));

    const fromImmichHeaders = Config.Immich_Origins.some((immichOrigin) => {
        return origin.startsWith(immichOrigin) || referer.startsWith(immichOrigin);
    });

    const userAgentSource = normalizeHeader(req.headers.get("user-agent"));
    const userAgentLower = userAgentSource.toLowerCase();
    const parsedUserAgent = userAgentSource ? new UserAgent(userAgentSource).parse() : null;

    const isImmichUserAgent = userAgentLower.includes("immich");
    const isMobileUserAgent = Boolean(
        parsedUserAgent?.isAndroid ||
            parsedUserAgent?.isiPhone ||
            parsedUserAgent?.isiPad ||
            parsedUserAgent?.isMobile ||
            parsedUserAgent?.isMobileNative
    );

    // Fallback for mobile app/webview flows without reliable browser headers.
    // At this point, gate key + client_id + redirect_uri checks already passed.
    const fromImmichRedirect = Config.Immich_Origins.some((immichOrigin) => {
        return redirectUri.startsWith(immichOrigin);
    });

    const allowMobileFallback = fromImmichRedirect && (isImmichUserAgent || isMobileUserAgent);

    if (!fromImmichHeaders && !allowMobileFallback) {
        console.warn("[authorize] Unable to verify Immich source - rejecting request", {
            origin,
            referer,
            redirectUri,
            userAgent: userAgentSource,
        });
        return NextResponse.redirect(new URL("/?notice=immich_access_denied", baseUrl));
    }

    // Validate response_type
    if (responseType !== "code") {
        return oidcError(
            redirectUri,
            state,
            "unsupported_response_type",
            "Only 'code' response_type is supported",
            baseUrl
        );
    }

    // Build a short-lived signed JWT containing the OIDC request params
    const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me");
    const oidcRequestToken = await new SignJWT({
        clientId,
        redirectUri,
        scope,
        state: state || "",
        nonce: nonce || "",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("10m")
        .setIssuer(getIssuer())
        .sign(secret);

    // Redirect to the SSO login page and store the OIDC request in a cookie
    const loginUrl = new URL("/immich-sso", baseUrl);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set("immich_sso_request", oidcRequestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
    });

    return response;
}
