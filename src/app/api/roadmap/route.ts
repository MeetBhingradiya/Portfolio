import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { RoadmapItem } from "@Models/Roadmap";

export const revalidate = 3600; // 1 hour ISR

export async function GET(_req: NextRequest) {
    try {
        await dbConnect();
        
        // Fetch only published items
        const items = await RoadmapItem.find({ isPublished: true }).lean();
        
        // Split into planned and completed
        const planned = items
            .filter((item) => item.status === "planned")
            .sort((a, b) => (a.order || 0) - (b.order || 0));
            
        const completed = items
            .filter((item) => item.status === "completed" && item.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
            
        return NextResponse.json({
            success: true,
            data: {
                planned,
                completed
            }
        });
    } catch (err: any) {
        console.error("[GET /api/roadmap]", err);
        return NextResponse.json({ success: false, error: "Failed to fetch roadmap" }, { status: 500 });
    }
}
