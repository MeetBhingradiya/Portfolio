/**
 * Photos Gateway
 * GET /api/photos
 *
 * Called when a user clicks the "Photos" link in navigation.
 * Checks the session and the Immich whitelist before forwarding
 * to the self-hosted Immich instance.
 *
 * Flow:
 *  • Authenticated + whitelisted → redirect to https://photos.meetbhingradiya.shop
 *  • Authenticated but NOT whitelisted → redirect to home with access-denied notice
 *  • Not authenticated → redirect to /immich-sso to start the OIDC sign-in
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { ImmichWhitelist } from "@Models/ImmichWhitelist";
import { getSession } from "@/Library/auth";

export const dynamic = "force-dynamic";

const IMMICH_URL = "https://photos.meetbhingradiya.shop";

export async function GET(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;

    // 1. Check session
    const session = await getSession(req.headers);
    if (!session?.user?.email) {
        // Not signed in → start OIDC flow (Immich will redirect back here)
        return NextResponse.redirect(new URL("/immich-sso?ref=nav", baseUrl));
    }

    // 2. Check whitelist
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

        // 3. Update access tracking
        await ImmichWhitelist.updateOne(
            { _id: (entry as any)._id },
            { $inc: { accessCount: 1 }, $set: { lastAccess: new Date() } }
        );

        return NextResponse.redirect(IMMICH_URL);
    } catch (err) {
        console.error("[photos-gateway]", err);
        return NextResponse.redirect(
            new URL("/?notice=photos_error", baseUrl)
        );
    }
}
