/**
 * Photos Gateway
 * GET /api/photos
 *
 * Called when a user clicks "Photos" in navigation.
 * Verifies the user is both authenticated on this site AND on the Immich
 * whitelist before initiating the OIDC flow with Immich.
 *
 * Flow:
 *  • Not authenticated            → /?notice=photos_sign_in_required
 *  • Authenticated + NOT listed   → /?notice=photos_access_denied
 *  • Authenticated + whitelisted  → redirect to Immich login page so Immich
 *                                   triggers the OIDC back-channel.
 *                                   The /immich-sso page will auto-forward
 *                                   because validate-gate sees the whitelist hit.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { ImmichWhitelist } from "@Models/ImmichWhitelist";
import { getSession } from "@/Library/auth";

export const dynamic = "force-dynamic";

// The Immich login page — visiting this causes Immich to start the OIDC redirect.
const IMMICH_LOGIN_URL = "https://photos.meetbhingradiya.shop/auth/login";

export async function GET(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;

    // 1. Must be signed in on this site first
    const session = await getSession(req.headers);
    if (!session?.user?.email) {
        return NextResponse.redirect(
            new URL("/?notice=photos_sign_in_required", baseUrl)
        );
    }

    // 2. Must be on the Immich whitelist
    try {
        await dbConnect();
        const email = session.user.email;
        const entry = await ImmichWhitelist.findOne({
            email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
            enabled: true,
        }).lean();

        if (!entry) {
            return NextResponse.redirect(
                new URL("/?notice=photos_access_denied", baseUrl)
            );
        }

        // 3. Whitelist hit — update tracking then send the user to Immich's
        //    login page. Immich will redirect to /api/immich-sso/authorize
        //    (with the gate key configured in Immich's OIDC settings).
        //    The /immich-sso page's validate-gate will recognise the
        //    whitelisted session and immediately forward to oidc-done —
        //    no provider picker shown.
        await ImmichWhitelist.updateOne(
            { _id: (entry as any)._id },
            { $inc: { accessCount: 1 }, $set: { lastAccess: new Date() } }
        ).catch(() => {});

        return NextResponse.redirect(IMMICH_LOGIN_URL);
    } catch (err) {
        console.error("[photos-gateway]", err);
        return NextResponse.redirect(
            new URL("/?notice=photos_error", baseUrl)
        );
    }
}
