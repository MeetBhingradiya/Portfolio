/**
 * SSO — Quick Access Check
 * POST /api/sso/check-access
 *
 * Called from the /sso page when the user is already authenticated.
 * Returns { granted: true } if the email is in the active whitelist, otherwise
 * { granted: false }
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { SSOApp, SSOAppAccess } from "@Models/SSO";
import { getSession } from "@Library/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
        const clientId: string | undefined = body.clientId;

        if (!clientId) {
            return NextResponse.json({ granted: false, reason: "missing_client_id" });
        }

        // Validate the requested email matches the session (prevent probing)
        if (!email || email.toLowerCase() !== session.user.email.toLowerCase()) {
            return NextResponse.json({
                granted: false,
                reason: "email_mismatch"
            });
        }

        await dbConnect();

        const app = await SSOApp.findOne({ clientId, enabled: true }).lean();
        if (!app) {
            return NextResponse.json({ granted: false, reason: "app_not_found" });
        }

        const entry = await SSOAppAccess.findOne({
            appId: app._id,
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
