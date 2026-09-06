import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { SSOApp } from "@Models/SSO";
import crypto from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const { id } = await params;
        await dbConnect();

        const app = await SSOApp.findById(id);
        if (!app) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        // Generate new 32-byte hex secret
        app.clientSecret = crypto.randomBytes(32).toString("hex");
        await app.save();

        return NextResponse.json({ success: true, clientSecret: app.clientSecret });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
