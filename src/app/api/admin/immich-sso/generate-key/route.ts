/**
 * Admin — Generate RSA JWK for Immich SSO
 * POST /api/admin/immich-sso/generate-key
 *
 * Returns a fresh RS256 private key JWK.
 * Paste the result as IMMICH_SSO_PRIVATE_KEY_JWK in .env.local
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import { generateKeyPair, exportJWK } from "jose";

export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }

        const { privateKey } = await generateKeyPair("RS256", { modulusLength: 2048, extractable: true });
        const jwk = await exportJWK(privateKey);
        jwk.kid = `immich-sso-${Date.now()}`;

        return NextResponse.json({ success: true, jwk: JSON.stringify(jwk) });
    } catch (err: any) {
        if (err?.message?.includes("Forbidden") || err?.message?.includes("Permission")) {
            return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
