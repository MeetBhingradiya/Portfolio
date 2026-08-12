import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { SSOApp } from "@Models/SSO";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        
        const { id } = await params;
        const body = await req.json();
        await dbConnect();
        
        const updateData: any = {};
        if (body.enabled !== undefined) updateData.enabled = body.enabled;
        if (body.allowNewTokens !== undefined) updateData.allowNewTokens = body.allowNewTokens;
        if (body.allowNewSignups !== undefined) updateData.allowNewSignups = body.allowNewSignups;
        if (body.appIcon !== undefined) updateData.appIcon = body.appIcon;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.visibility !== undefined) updateData.visibility = body.visibility;
        if (body.accessMode !== undefined) updateData.accessMode = body.accessMode;
        if (body.redirectUris !== undefined) {
            updateData.redirectUris = typeof body.redirectUris === "string" 
                ? body.redirectUris.split(",").map((s: string) => s.trim()) 
                : body.redirectUris;
        }
        if (body.allowedOrigins !== undefined) {
            updateData.allowedOrigins = typeof body.allowedOrigins === "string" 
                ? body.allowedOrigins.split(",").map((s: string) => s.trim()).filter(Boolean) 
                : body.allowedOrigins;
        }

        const app = await SSOApp.findByIdAndUpdate(id, updateData, { new: true });
        if (!app) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        
        return NextResponse.json({ success: true, data: app });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
