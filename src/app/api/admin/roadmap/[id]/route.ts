import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { RoadmapItem } from "@Models/Roadmap";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission(req, "admin.site.settings");
    if (auth.error) {
        return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
    }

    try {
        const { id } = await params;
        const body = await req.json();
        await dbConnect();

        const updateData: any = {
            title: body.title,
            description: body.description,
            order: body.order,
            isPublished: body.isPublished
        };

        if (body.status) {
            updateData.status = body.status;
            if (body.status === "completed") {
                updateData.completedAt = body.completedAt || new Date();
            } else {
                updateData.completedAt = null;
            }
        }

        // Clean up undefined
        Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

        const updated = await RoadmapItem.findByIdAndUpdate(id, updateData, { new: true }).lean();
        if (!updated) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission(req, "admin.site.settings");
    if (auth.error) {
        return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
    }

    try {
        const { id } = await params;
        await dbConnect();
        
        const deleted = await RoadmapItem.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
