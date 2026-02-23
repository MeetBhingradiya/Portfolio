/**
 * Public API — GET /api/maintenance-status
 * Returns current maintenance mode status. No auth required.
 * Used by the client-side HeadNavigation to show the banner.
 */

import { NextResponse } from "next/server";
import dbConnect from "@/Utils/dbConnect";
import { getSiteSettings } from "@/Models/SiteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await dbConnect();
        const settings = await getSiteSettings();
        return NextResponse.json({
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage
        });
    } catch {
        return NextResponse.json({ maintenanceMode: false, maintenanceMessage: "" });
    }
}
