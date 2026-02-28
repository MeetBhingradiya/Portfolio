/**
 * Immich SSO — Gate Validator
 * POST /api/immich-sso/validate-gate
 *
 * Called by the /immich-sso page on mount to verify the request is
 * legitimate (came through the authorized OIDC flow) and to determine
 * whether the currently signed-in user already has whitelist access.
 *
 * Checks (in order):
 *  1. The `immich_sso_request` signed cookie exists and is a valid JWT
 *     (proves the user went through /api/immich-sso/authorize).
 *  2. If the user has an active session, look them up in the whitelist.
 *
 * Response:
 *  { gateValid: false }                        → no valid cookie — deny / redirect home
 *  { gateValid: true, hasAccess: false }       → show provider picker
 *  { gateValid: true, hasAccess: true }        → whitelisted — forward to oidc-done
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@Utils/dbConnect";
import { ImmichWhitelist } from "@Models/ImmichWhitelist";
import { getSession } from "@/Library/auth";
import { getIssuer } from "@Utils/OIDCKeys";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;

    // ── 1. Verify the OIDC request cookie ──────────────────────────────────
    const requestToken = req.cookies.get("immich_sso_request")?.value;

    if (!requestToken) {
        return NextResponse.json({ gateValid: false, reason: "no_cookie" });
    }

    try {
        const secret = new TextEncoder().encode(
            process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me"
        );
        await jwtVerify(requestToken, secret, { issuer: getIssuer() });
    } catch (err: any) {
        // Expired or tampered
        return NextResponse.json({ gateValid: false, reason: "cookie_invalid" });
    }

    // ── 2. Check current session + whitelist ────────────────────────────────
    const session = await getSession(req.headers);

    if (!session?.user?.email) {
        // Valid gate, not signed in — page should show provider picker
        return NextResponse.json({ gateValid: true, hasAccess: false, needsAuth: true });
    }

    const email = session.user.email;

    try {
        await dbConnect();

        const entry = await ImmichWhitelist.findOne({
            email: {
                $regex: new RegExp(
                    `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                    "i"
                ),
            },
            enabled: true,
        }).lean();

        if (!entry) {
            // Signed in but not on the whitelist — gate is legitimate, no access
            return NextResponse.json({
                gateValid: true,
                hasAccess: false,
                needsAuth: false,
                reason: "not_whitelisted",
            });
        }

        // Update access tracking
        await ImmichWhitelist.updateOne(
            { _id: (entry as any)._id },
            { $inc: { accessCount: 1 }, $set: { lastAccess: new Date() } }
        ).catch(() => {});

        return NextResponse.json({
            gateValid: true,
            hasAccess: true,
            email,
        });
    } catch (err: any) {
        console.error("[validate-gate]", err);
        return NextResponse.json(
            { gateValid: true, hasAccess: false, reason: "error" },
            { status: 500 }
        );
    }
}
