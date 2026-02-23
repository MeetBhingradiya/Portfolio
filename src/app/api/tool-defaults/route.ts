/**
 * Public Tool Defaults API — GET only
 * Returns admin-configured default settings for tools.
 * No auth required so tools can load defaults for all users.
 * Cached with ISR (revalidate every 60s).
 */

import { NextResponse } from "next/server";
import dbConnect from "@/Utils/dbConnect";
import { ToolSettings_Model } from "@/Models/ToolSettings";

const SINGLETON_ID = "tool_settings_singleton";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function GET() {
    try {
        await dbConnect();

        let doc = await ToolSettings_Model.findOne({ ConfigID: SINGLETON_ID })
            .select("-_id -__v -ConfigID -lastUpdatedBy -createdAt -updatedAt -visibility")
            .lean();

        if (!doc) {
            // Return empty defaults — model defaults will be used
            doc = {} as any;
        }

        return NextResponse.json({ success: true, data: doc }, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
            }
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: "Failed to load tool defaults" },
            { status: 500 }
        );
    }
}
