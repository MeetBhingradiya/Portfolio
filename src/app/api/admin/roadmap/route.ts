import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { RoadmapItem } from "@Models/Roadmap";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const auth = await requirePermission(req, "admin.site.settings");
    if (auth.error) {
        return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
    }

    try {
        await dbConnect();
        const items = await RoadmapItem.find().sort({ order: 1, completedAt: -1 }).lean();
        return NextResponse.json({ success: true, data: items });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requirePermission(req, "admin.site.settings");
    if (auth.error) {
        return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
    }

    try {
        const body = await req.json();
        await dbConnect();

        // Get max order
        const lastItem = await RoadmapItem.findOne({ status: "planned" }).sort({ order: -1 }).lean();
        const nextOrder = lastItem ? lastItem.order + 1 : 0;

        const newItem = await RoadmapItem.create({
            title: body.title,
            description: body.description,
            status: body.status || "planned",
            completedAt: body.status === "completed" ? new Date() : undefined,
            order: nextOrder,
            isPublished: body.isPublished ?? true
        });

        return NextResponse.json({ success: true, data: newItem });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
