/**
 * OIDC JWKS Endpoint
 * GET /api/immich-sso/jwks
 * Exposes the RSA public key so Immich (openid-client) can verify ID tokens.
 */
import { NextResponse } from "next/server";
import { getOIDCKeys } from "@Utils/OIDCKeys";

export const dynamic = "force-dynamic";

export async function GET() {
    const { publicJwk } = await getOIDCKeys();

    return NextResponse.json(
        { keys: [publicJwk] },
        {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600"
            }
        }
    );
}
