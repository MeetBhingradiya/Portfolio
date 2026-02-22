/**
 * Admin Tool Settings API — GET + PUT
 * Singleton config document: fetches or upserts the one ToolSettings doc.
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/Utils/dbConnect";
import { requireAdmin } from "@/Library/auth";
import { ToolSettings_Model } from "@/Models/ToolSettings";

const SINGLETON_ID = "tool_settings_singleton";

/** GET /api/admin/tool-settings — fetch current defaults */
export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        let doc = await ToolSettings_Model.findOne({ ConfigID: SINGLETON_ID }).lean();
        if (!doc) {
            doc = await ToolSettings_Model.create({ ConfigID: SINGLETON_ID });
            doc = doc.toObject();
        }

        return NextResponse.json({ success: true, data: doc });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Internal server error" },
            { status: 500 }
        );
    }
}

/** PUT /api/admin/tool-settings — update defaults (partial merge) */
export async function PUT(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const body = await req.json();
        // Remove fields that shouldn't be overwritten
        delete body._id;
        delete body.ConfigID;
        delete body.createdAt;
        delete body.__v;

        const doc = await ToolSettings_Model.findOneAndUpdate(
            { ConfigID: SINGLETON_ID },
            { $set: body },
            { new: true, upsert: true, runValidators: true }
        ).lean();

        return NextResponse.json({ success: true, data: doc });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Internal server error" },
            { status: 500 }
        );
    }
}
