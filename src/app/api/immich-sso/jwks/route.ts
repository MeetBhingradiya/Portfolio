/**
 * OIDC JWKS Endpoint
 * GET /api/immich-sso/jwks
 * Exposes the RSA public key so Immich (openid-client) can verify ID tokens.
 */
import { NextRequest, NextResponse } from "next/server";
import { getOIDCKeys } from "@Utils/OIDCKeys";
import { createImmichSsoForbiddenResponse, getImmichCorsOrigin, isImmichSsoRequestAllowed } from "@Utils/immichSsoAccess";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    if (!isImmichSsoRequestAllowed(req)) {
        return createImmichSsoForbiddenResponse();
    }

    const { publicJwk } = await getOIDCKeys();

    return NextResponse.json(
        { keys: [publicJwk] },
        {
            headers: {
                ...(getImmichCorsOrigin(req)
                    ? {
                          "Access-Control-Allow-Origin": getImmichCorsOrigin(req),
                          Vary: "Origin"
                      }
                    : {}),
                "Cache-Control": "public, max-age=3600"
            }
        }
    );
}
