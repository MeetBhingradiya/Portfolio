import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { SSOApp } from "@Models/SSO";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Fetch apps that are public
        const apps = await SSOApp.find({ 
            visibility: "public"
        })
        .select("name description appIcon clientId enabled accessMode createdAt") // Return safe fields
        .sort({ name: 1 })
        .lean();

        return NextResponse.json({ success: true, data: apps });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error fetching apps" }, { status: 500 });
    }
}
