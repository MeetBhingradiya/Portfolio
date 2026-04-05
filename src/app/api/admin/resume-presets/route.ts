import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { ResumePreset } from "@Models/ResumePreset";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

function normalizeKey(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "portfolio.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const presets = await ResumePreset.find().sort({ updatedAt: -1, createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: presets });
    } catch (err: any) {
        const status = err.message?.includes("Forbidden") ? 403 : err.message?.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message || "Failed to fetch presets" }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "portfolio.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const admin = auth.session?.user;
        if (!admin) return permissionError(401, "Unauthorized");

        const body = await req.json();
        const key = normalizeKey(body?.key || body?.label || body?.title || "");

        if (!key || !body?.label || !body?.title) {
            return NextResponse.json(
                { success: false, error: "key/label/title are required." },
                { status: 422 }
            );
        }

        const preset = await ResumePreset.create({
            key,
            label: String(body.label).trim(),
            title: String(body.title).trim(),
            summary: String(body.summary || "").trim(),
            keywordsByCategory: body.keywordsByCategory || {},
            includeAll: Array.isArray(body.includeAll) ? body.includeAll : [],
            iconKey: body.iconKey || "code",
            pinnedIdsByCategory: body.pinnedIdsByCategory || {},
            createdBy: admin.email || "",
            updatedBy: admin.email || ""
        });

        return NextResponse.json({ success: true, data: preset }, { status: 201 });
    } catch (err: any) {
        if (err?.code === 11000) {
            return NextResponse.json(
                { success: false, error: "A preset with this key already exists." },
                { status: 409 }
            );
        }
        const status = err.message?.includes("Forbidden") ? 403 : err.message?.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message || "Failed to create preset" }, { status });
    }
}
