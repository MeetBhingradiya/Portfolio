/**
 * Admin — SSO Apps API
 * GET  /api/admin/sso-apps          list apps
 * POST /api/admin/sso-apps          create app
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { SSOApp } from "@Models/SSO";

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        await dbConnect();
        const apps = await SSOApp.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: apps });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) {
            return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        }
        const session = auth.session;
        if (!session?.user) {
            return permissionError(401, "Unauthorized: Not authenticated");
        }
        
        const body = await req.json();

        if (!body.name || !body.clientId || !body.redirectUris) {
            return NextResponse.json({ success: false, error: "name, clientId, and redirectUris are required" }, { status: 400 });
        }

        await dbConnect();

        const existing = await SSOApp.findOne({ clientId: body.clientId });
        if (existing) {
            return NextResponse.json({ success: false, error: "App with this Client ID already exists" }, { status: 409 });
        }

        const app = await SSOApp.create({
            name: body.name,
            clientId: body.clientId,
            appIcon: body.appIcon,
            description: body.description,
            clientSecret: body.clientSecret,
            redirectUris: typeof body.redirectUris === "string" ? body.redirectUris.split(",").map((s: string) => s.trim()) : body.redirectUris,
            gateKey: body.gateKey,
            enabled: true,
            allowNewTokens: true,
            allowNewSignups: Boolean(body.allowNewSignups),
            visibility: body.visibility || "private",
            accessMode: body.accessMode || "private",
            addedBy: session.user.email
        });

        return NextResponse.json({ success: true, data: app }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Error" }, { status: 500 });
    }
}
