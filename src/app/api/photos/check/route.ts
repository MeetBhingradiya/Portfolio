/**
 * GET /api/photos/check
 * Returns { allowed: true } when the current user is on the Immich whitelist.
 * Used by the navigation to conditionally show the Photos link.
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/Library/auth";
import dbConnect from "@Utils/dbConnect";
import { ImmichWhitelist } from "@Models/ImmichWhitelist";

export async function GET(_req: NextRequest) {
    try {
        const h = await headers();
        const session = await getSession(h);
        if (!session?.user?.email) {
            return NextResponse.json({ allowed: false });
        }

        await dbConnect();
        const entry = await ImmichWhitelist.findOne({
            email: session.user.email.toLowerCase(),
            enabled: true,
        }).lean();

        return NextResponse.json({ allowed: !!entry });
    } catch {
        return NextResponse.json({ allowed: false });
    }
}
