/**
 * SSO OIDC JWKS Endpoint
 * GET /api/sso/jwks
 * Exposes the RSA public key so applications can verify ID tokens.
 */
import { NextRequest, NextResponse } from "next/server";
import { getOIDCKeys } from "@Utils/OIDCKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
