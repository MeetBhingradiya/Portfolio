/**
 * GET  /api/faq          → list published FAQs (public)
 * POST /api/faq          → create FAQ (admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { FAQ } from "@Models/FAQ";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const q = req.nextUrl.searchParams;
        const category = q.get("category") || "";
        const all = q.get("all") === "true"; // admin: show unpublished too

        const h = await headers();
        const user = await getResolvedUser(h);
        const canViewAll = all && (user?.isAdmin || user?.isEmployee);

        const query: any = canViewAll ? {} : { isPublished: true };
        if (category) query.category = category;

        const faqs = await FAQ.find(query).sort({ category: 1, order: 1 }).lean();
        return NextResponse.json({ success: true, data: faqs });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        const body = await req.json();
        const faq = await FAQ.create({ ...body, createdBy: user.email });
        return NextResponse.json({ success: true, data: faq }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
