/**
 * GET /api/security/site-status
 * ─────────────────────────────
 * Public, unauthenticated endpoint that returns the current maintenance state.
 * Used by AntiDebuggerShield to decide where to redirect on threat detection.
 * Exposes ONLY the maintenanceMode boolean — nothing sensitive.
 */

import { NextResponse } from "next/server";
import dbConnect from "@/Utils/dbConnect";
import { getSiteSettings } from "@/Models/SiteSettings";

export const dynamic = "force-dynamic"; // never cache — always fresh

export async function GET(): Promise<NextResponse> {
    try {
        await dbConnect();
        const settings = await getSiteSettings();
        return NextResponse.json({ maintenanceMode: settings.maintenanceMode ?? false }, { status: 200 });
    } catch {
        // On DB error fall back to "not in maintenance" so the shield
        // still redirects sensibly (home/back) rather than showing a
        // broken maintenance page.
        return NextResponse.json({ maintenanceMode: false }, { status: 200 });
    }
}
