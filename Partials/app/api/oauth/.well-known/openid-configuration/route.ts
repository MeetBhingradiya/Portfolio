import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXTAUTH_URL || "https://meetbhingradiya.com";

export async function GET() {
    return NextResponse.json(
        {
            issuer: BASE_URL,
            authorization_endpoint: `${BASE_URL}/api/oauth/authorize`,
            token_endpoint: `${BASE_URL}/api/oauth/token`,
            userinfo_endpoint: `${BASE_URL}/api/oauth/userinfo`,
            jwks_uri: `${BASE_URL}/api/oauth/.well-known/jwks.json`,
            response_types_supported: ["code"],
            subject_types_supported: ["public"],
            id_token_signing_alg_values_supported: ["HS256"],
            scopes_supported: ["openid", "profile", "email"],
            token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
            claims_supported: [
                "sub",
                "email",
                "email_verified",
                "name",
                "preferred_username",
                "iss",
                "aud"
            ],
            code_challenge_methods_supported: ["plain", "S256"]
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
