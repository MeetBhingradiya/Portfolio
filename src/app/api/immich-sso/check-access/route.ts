/**
 * Immich SSO — Quick Access Check
 * POST /api/immich-sso/check-access
 *
 * Called from the /immich-sso page when the user is already authenticated.
 * Returns { granted: true } if the email is in the active whitelist, otherwise
 * { granted: false } — no session is created here, that happens in oidc-done.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { ImmichWhitelist } from "@Models/ImmichWhitelist";
import { getSession } from "@Library/auth";
import { createImmichSsoForbiddenResponse, isImmichSsoRequestAllowed } from "@Utils/immichSsoAccess";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    if (!isImmichSsoRequestAllowed(req)) {
        return createImmichSsoForbiddenResponse();
    }

    try {
        // Must be an authenticated user making their own access check
        const session = await getSession(req.headers);
        if (!session?.user?.email) {
            return NextResponse.json({
                granted: false,
                reason: "unauthenticated"
            });
        }

        const body = await req.json().catch(() => ({}));
        const email: string | undefined = body.email;

        // Validate the requested email matches the session (prevent probing)
        if (!email || email.toLowerCase() !== session.user.email.toLowerCase()) {
            return NextResponse.json({
                granted: false,
                reason: "email_mismatch"
            });
        }

        await dbConnect();

        const entry = await ImmichWhitelist.findOne({
            email: {
                $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            },
            enabled: true
        }).lean();

        if (!entry) {
            return NextResponse.json({
                granted: false,
                reason: "not_whitelisted"
            });
        }

        return NextResponse.json({ granted: true });
    } catch (err: any) {
        console.error("[check-access]", err);
        return NextResponse.json({ granted: false, reason: "error" }, { status: 500 });
    }
}
