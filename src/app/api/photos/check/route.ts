/**
 * GET /api/photos/check
 * Returns { allowed: true } when the current user is on the Immich whitelist.
 * Used by the navigation to conditionally show the Photos link.
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { SSOApp, SSOAppAccess } from "@Models/SSO";

export async function GET(_req: NextRequest) {
    try {
        const h = await headers();
        const session = await getSession(h);
        if (!session?.user?.email) {
            return NextResponse.json({ allowed: false });
        }

        await dbConnect();
        
        const app = await SSOApp.findOne({ name: "Immich", enabled: true }).lean();
        if (!app) {
            return NextResponse.json({ allowed: false });
        }

        const entry = await SSOAppAccess.findOne({
            appId: app._id,
            email: session.user.email.toLowerCase(),
            enabled: true
        }).lean();

        return NextResponse.json({ allowed: !!entry });
    } catch {
        return NextResponse.json({ allowed: false });
    }
}
