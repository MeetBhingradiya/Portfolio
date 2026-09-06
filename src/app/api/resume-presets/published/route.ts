import { NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { ResumePreset } from "@Models/ResumePreset";

export async function GET() {
    try {
        await dbConnect();
        
        // Fetch only published presets, sorted by updatedAt descending
        const presets = await ResumePreset.find({ isPublished: true }).sort({ updatedAt: -1, createdAt: -1 }).lean();
        
        return NextResponse.json({ success: true, data: presets });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || "Failed to fetch published presets" }, { status: 500 });
    }
}
