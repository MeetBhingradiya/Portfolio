/**
 * Photos Gateway
 * GET /api/photos
 *
 * Called when a user clicks "Photos" in navigation.
 * Verifies the user is both authenticated on this site AND on the Immich
 * whitelist (in SSOAppAccess) before initiating the OIDC flow with Immich.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { SSOApp, SSOAppAccess } from "@Models/SSO";
import { getSession } from "@Library/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;

    // 1. Must be signed in on this site first
    const session = await getSession(req.headers);
    if (!session?.user?.email) {
        return NextResponse.redirect(new URL("/?notice=photos_sign_in_required", baseUrl));
    }

    // 2. Must be on the Immich whitelist
    try {
        await dbConnect();
        const email = session.user.email;

        const app = await SSOApp.findOne({ name: "Immich", enabled: true }).lean();
        if (!app) {
            return NextResponse.redirect(new URL("/?notice=photos_error", baseUrl));
        }

        const entry = await SSOAppAccess.findOne({
            appId: app._id,
            email: {
                $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            },
            enabled: true
        }).lean();

        if (!entry) {
            return NextResponse.redirect(new URL("/?notice=photos_access_denied", baseUrl));
        }

        const targetUrl = (Array.isArray(app.allowedOrigins) && app.allowedOrigins.length > 0)
            ? app.allowedOrigins[0]
            : (Array.isArray(app.redirectUris) && app.redirectUris.length > 0 ? app.redirectUris[0] : null);

        if (!targetUrl) {
            return NextResponse.redirect(new URL("/?notice=photos_error", baseUrl));
        }

        return NextResponse.redirect(targetUrl);
    } catch (err) {
        console.error("[photos-gateway]", err);
        return NextResponse.redirect(new URL("/?notice=photos_error", baseUrl));
    }
}
