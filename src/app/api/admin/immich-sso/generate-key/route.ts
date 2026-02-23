/**
 * Admin — Generate RSA JWK for Immich SSO
 * POST /api/admin/immich-sso/generate-key
 *
 * Returns a fresh RS256 private key JWK.
 * Paste the result as IMMICH_SSO_PRIVATE_KEY_JWK in .env.local
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/Library/auth";
import { generateKeyPair, exportJWK } from "jose";

export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req.headers);

        const { privateKey } = await generateKeyPair("RS256", { modulusLength: 2048, extractable: true });
        const jwk = await exportJWK(privateKey);
        jwk.kid = `immich-sso-${Date.now()}`;

        return NextResponse.json({ success: true, jwk: JSON.stringify(jwk) });
    } catch (err: any) {
        if (err?.message?.includes("Forbidden") || err?.message?.includes("Admin")) {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
