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

// The Immich login page — visiting this causes Immich to start the OIDC redirect.
const IMMICH_LOGIN_URL = "https://photos.meetbhingradiya.in/auth/login";

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

        return NextResponse.redirect(IMMICH_LOGIN_URL);
    } catch (err) {
        console.error("[photos-gateway]", err);
        return NextResponse.redirect(new URL("/?notice=photos_error", baseUrl));
    }
}
