/**
 * SSO — Gate Validator
 * POST /api/sso/validate-gate
 *
 * Called by the /sso page on mount to verify the request is
 * legitimate (came through the authorized OIDC flow) and to determine
 * whether the currently signed-in user already has whitelist access.
 *
 * Checks (in order):
 *  1. The `sso_request` signed cookie exists and is a valid JWT
 *  2. If the user has an active session, look them up in the whitelist for the specific app.
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@Utils/dbConnect";
import { SSOApp, SSOAppAccess } from "@Models/SSO";
import { getSession } from "@Library/auth";
import { getIssuer } from "@Utils/OIDCKeys";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {

    // ── 1. Verify the OIDC request cookie ──────────────────────────────────
    const requestToken = req.cookies.get("sso_request")?.value;

    if (!requestToken) {
        return NextResponse.json({ gateValid: false, reason: "no_cookie" });
    }

    let oidcRequest: { clientId: string; loginHint?: string };

    try {
        const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me");
        const { payload } = await jwtVerify(requestToken, secret, { issuer: getIssuer() });
        oidcRequest = payload as typeof oidcRequest;
    } catch (err: any) {
        // Expired or tampered
        return NextResponse.json({
            gateValid: false,
            reason: "cookie_invalid"
        });
    }

    // ── 2. Check current session + whitelist ────────────────────────────────
    const session = await getSession(req.headers);

    if (!session?.user?.email) {
        // Valid gate, not signed in — page should show provider picker
        return NextResponse.json({
            gateValid: true,
            hasAccess: false,
            needsAuth: true,
            loginHint: oidcRequest.loginHint
        });
    }

    const email = session.user.email;

    try {
        await dbConnect();

        const app = await SSOApp.findOne({ clientId: oidcRequest.clientId, enabled: true }).lean();
        
        if (!app) {
            return NextResponse.json({
                gateValid: true,
                hasAccess: false,
                needsAuth: false,
                reason: "app_not_found"
            });
        }

        const appInfo = {
            name: app.name,
            clientId: app.clientId,
            appIcon: app.appIcon,
            allowNewTokens: app.allowNewTokens
        };

        const entry = await SSOAppAccess.findOne({
            appId: app._id,
            email: {
                $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            },
            enabled: true
        }).lean();

        if (!entry) {
            // Signed in but not on the whitelist — gate is legitimate, no access
            return NextResponse.json({
                gateValid: true,
                hasAccess: false,
                needsAuth: false,
                reason: "not_whitelisted"
            });
        }

        // accessCount is incremented only in oidc-done (actual sign-in completes there).
        return NextResponse.json({
            gateValid: true,
            hasAccess: true,
            email,
            appName: app.name
        });
    } catch (err: any) {
        console.error("[validate-gate]", err);
        return NextResponse.json({ gateValid: true, hasAccess: false, reason: "error" }, { status: 500 });
    }
}
