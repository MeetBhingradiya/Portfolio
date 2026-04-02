/**
 * OIDC Discovery Document
 * GET /api/immich-sso/.well-known/openid-configuration
 *
 * In Immich Admin Settings → OAuth, set:
 *   Issuer URL: https://<your-domain>/api/immich-sso
 *   (do NOT include /authorize or ?_gate= — Immich discovers those from this document)
 */
import { NextResponse } from "next/server";
import { getIssuer } from "@Utils/OIDCKeys";

export const dynamic = "force-dynamic";

export async function GET() {
    const issuer = getIssuer();
    const gateKey = process.env.IMMICH_SSO_GATE_KEY ?? "";

    const config = {
        issuer,
        authorization_endpoint: gateKey ? `${issuer}/authorize?_gate=${encodeURIComponent(gateKey)}` : `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/jwks`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        scopes_supported: ["openid", "email", "profile"],
        token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
        claims_supported: ["sub", "email", "name", "email_verified"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["S256"]
    };

    return NextResponse.json(config, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600"
        }
    });
}
