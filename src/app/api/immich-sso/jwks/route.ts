/**
 * OIDC JWKS Endpoint
 * GET /api/immich-sso/jwks
 * Exposes the RSA public key so Immich (openid-client) can verify ID tokens.
 */
import { NextRequest, NextResponse } from "next/server";
import { getOIDCKeys } from "@Utils/OIDCKeys";
import { getImmichOrigins } from "@Utils/origin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {


    const { publicJwk } = await getOIDCKeys();

    return NextResponse.json(
        { keys: [publicJwk] },
        {
            headers: {
                "Access-Control-Allow-Origin": getImmichOrigins().join(","),
                "Cache-Control": "public, max-age=3600"
            }
        }
    );
}
