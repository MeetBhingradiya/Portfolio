import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { ResumePreset } from "@Models/ResumePreset";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

type Params = { params: Promise<{ key: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "portfolio.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const admin = auth.session?.user;
        if (!admin) return permissionError(401, "Unauthorized");

        const { key } = await params;
        const body = await req.json();
        const update = {
            ...(body.label !== undefined && { label: String(body.label).trim() }),
            ...(body.title !== undefined && { title: String(body.title).trim() }),
            ...(body.summary !== undefined && { summary: String(body.summary).trim() }),
            ...(body.iconKey !== undefined && { iconKey: body.iconKey }),
            ...(body.header !== undefined && {
                header: body.header,
                title: String(body.header?.title || "").trim(),
                summary: String(body.header?.summary || "").trim()
            }),
            ...(body.selectedIdsByCategory !== undefined && {
                selectedIdsByCategory: body.selectedIdsByCategory
            }),
            ...(body.sectionOrder !== undefined && {
                sectionOrder: Array.isArray(body.sectionOrder) ? body.sectionOrder : []
            }),
            ...(body.itemOrderByCategory !== undefined && {
                itemOrderByCategory: body.itemOrderByCategory
            }),
            ...(body.style !== undefined && { style: body.style }),
            updatedBy: admin.email || ""
        };

        const preset = await ResumePreset.findOneAndUpdate({ key }, { $set: update }, { new: true });
        if (!preset) return NextResponse.json({ success: false, error: "Preset not found." }, { status: 404 });

        return NextResponse.json({ success: true, data: preset });
    } catch (err: any) {
        const status = err.message?.includes("Forbidden") ? 403 : err.message?.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message || "Failed to update preset" }, { status });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "portfolio.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const { key } = await params;
        await ResumePreset.findOneAndDelete({ key });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        const status = err.message?.includes("Forbidden") ? 403 : err.message?.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message || "Failed to delete preset" }, { status });
    }
}
