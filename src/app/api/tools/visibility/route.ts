/**
 * Public Tool Visibility API — GET
 * Returns only the `visibility` array from the singleton ToolSettings doc.
 * No admin auth required — safe to call from the public tools dashboard.
 */

import { NextResponse } from "next/server";
import dbConnect from "@/Utils/dbConnect";
import { ToolSettings_Model } from "@/Models/ToolSettings";

const SINGLETON_ID = "tool_settings_singleton";

export async function GET() {
    try {
        await dbConnect();
        const doc = await ToolSettings_Model.findOne({ ConfigID: SINGLETON_ID })
            .select("visibility")
            .lean() as { visibility?: Array<{ toolId: string; enabled: boolean; featured: boolean; publicAccess: boolean }> } | null;

        const visibility: Array<{ toolId: string; enabled: boolean; featured: boolean; publicAccess: boolean }> =
            doc?.visibility ?? [];

        return NextResponse.json({ success: true, visibility });
    } catch (err) {
        // Gracefully degrade — tools page falls back to static defaults
        return NextResponse.json({ success: false, visibility: [] }, { status: 200 });
    }
}
