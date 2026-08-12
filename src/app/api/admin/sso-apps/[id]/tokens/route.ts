import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { SSOApp, SSOAuthCode } from "@Models/SSO";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        
        const { id } = await params;
        await dbConnect();
        
        const app = await SSOApp.findById(id).lean();
        if (!app) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        
        const result = await SSOAuthCode.deleteMany({ clientId: app.clientId });
        
        return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
