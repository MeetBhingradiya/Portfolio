/**
 * SSO — Post-Auth Callback
 * GET /api/sso/oidc-done
 *
 * better-auth redirects here after the user successfully authenticates
 * with a social provider (Google / GitHub / Microsoft / Apple).
 *
 * This route:
 *  1. Reads the active better-auth session
 *  2. Reads the OIDC request from the signed cookie
 *  3. Checks the user's email against the SSOAppAccess whitelist
 *  4. Generates a short-lived auth code stored in MongoDB
 *  5. Redirects back to the app's redirect_uri with the code + state
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { randomBytes } from "crypto";
import dbConnect, { getMongoCollection } from "@Utils/dbConnect";
import { SSOApp, SSOAppAccess, SSOAuthCode } from "@Models/SSO";
import { getSession } from "@Library/auth";
import { getIssuer } from "@Utils/OIDCKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;

    // ── 1. Get better-auth session ──────────────────────────────────────────
    const session = await getSession(req.headers);
    if (!session?.user) {
        return NextResponse.redirect(new URL("/sso?error=auth_required", baseUrl));
    }

    // ── 2. Read OIDC request cookie ─────────────────────────────────────────
    const requestToken = req.cookies.get("sso_request")?.value;
    if (!requestToken) {
        return NextResponse.redirect(
            new URL(
                "/sso?error=session_expired&error_description=OIDC+request+timed+out.+Please+go+back+to+the+application+and+try+again.",
                baseUrl
            )
        );
    }

    let oidcRequest: {
        clientId: string;
        redirectUri: string;
        scope: string;
        state: string;
        nonce: string;
    };

    try {
        const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me");
        const { payload } = await jwtVerify(requestToken, secret, {
            issuer: getIssuer()
        });
        oidcRequest = payload as typeof oidcRequest;
    } catch {
        return NextResponse.redirect(
            new URL("/sso?error=invalid_request&error_description=OIDC+session+is+invalid+or+expired.", baseUrl)
        );
    }

    // ── 3. App & Whitelist check ────────────────────────────────────────────
    const userEmail = session.user.email?.toLowerCase();
    const userId = session.user.id;

    if (!userEmail) {
        return redirectWithError(oidcRequest, "access_denied", "No email in session");
    }

    await dbConnect();

    const app = await SSOApp.findOne({ clientId: oidcRequest.clientId, enabled: true });
    if (!app) {
        return redirectWithError(oidcRequest, "access_denied", "Application is not found or disabled");
    }

    // Match by userId first (linked account — most authoritative),
    // then fall back to email (for email-only whitelist entries).
    const entry = await SSOAppAccess.findOne({
        appId: app._id,
        enabled: true,
        $or: [...(userId ? [{ userId }] : []), { email: userEmail }]
    });

    if (!entry) {
        return redirectWithError(
            oidcRequest,
            "access_denied",
            `${userEmail} is not authorized to access ${app.name}. Contact the administrator.`
        );
    }

    // Update last access stats + auto-upgrade email-only entry with userId
    if (!entry.userId && userId) {
        entry.userId = userId;
        entry.linkedAccount = true;
    }
    entry.lastAccess = new Date();
    entry.accessCount = (entry.accessCount || 0) + 1;
    await entry.save();

    // ── 4. Resolve `sub` — must match what the app already stored as oauthId ──
    let sub = userEmail; // safe fallback

    if ((entry as any).subOverride) {
        // Admin explicitly overrode the sub — use it directly, skip any lookup
        sub = (entry as any).subOverride as string;
    } else {
        try {
            const accountCollection = await getMongoCollection("account");
            // BA account collection stores: userId, providerId, providerAccountId
            const oauthAccount = await accountCollection.findOne({
                $or: [{ userId: userId }, { user_id: userId }],
                providerId: "google"
            });
            if (oauthAccount?.providerAccountId) {
                sub = oauthAccount.providerAccountId as string;
            }
        } catch {
            // keep email fallback
        }
    }

    // ── 5. Generate auth code ───────────────────────────────────────────────
    // Record the sub we actually issued so the admin can see/copy it
    (entry as any).lastIssuedSub = sub;
    await entry.save();

    const code = randomBytes(32).toString("hex");
    await SSOAuthCode.create({
        code,
        sub,
        email: userEmail,
        name: session.user.name || "",
        clientId: oidcRequest.clientId,
        redirectUri: oidcRequest.redirectUri,
        scope: oidcRequest.scope,
        nonce: oidcRequest.nonce || undefined,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // ── 6. Redirect to the App with code ─────────────────────────────────────
    const redirectUrl = new URL(oidcRequest.redirectUri);
    redirectUrl.searchParams.set("code", code);
    if (oidcRequest.state) redirectUrl.searchParams.set("state", oidcRequest.state);

    const response = NextResponse.redirect(redirectUrl.toString());
    // Clear the OIDC request cookie
    response.cookies.delete("sso_request");
    return response;
}

function redirectWithError(oidcRequest: { redirectUri: string; state: string }, error: string, description: string): NextResponse {
    const url = new URL(oidcRequest.redirectUri);
    url.searchParams.set("error", error);
    url.searchParams.set("error_description", description);
    if (oidcRequest.state) url.searchParams.set("state", oidcRequest.state);
    return NextResponse.redirect(url.toString());
}
