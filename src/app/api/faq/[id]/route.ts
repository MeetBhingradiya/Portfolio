/**
 * PATCH /api/faq/[id]  → update FAQ (admin)
 * DELETE /api/faq/[id] → delete FAQ (admin)
 * PATCH /api/faq/[id]/vote → vote helpful/notHelpful (public)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { FAQ } from "@Models/FAQ";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Vote endpoint doesn't require admin
        if (body.vote === "helpful" || body.vote === "notHelpful") {
            const field = body.vote === "helpful" ? "helpful" : "notHelpful";
            const faq = await FAQ.findByIdAndUpdate(id, { $inc: { [field]: 1 } }, { returnDocument: "after" });
            return NextResponse.json({ success: true, data: faq });
        }

        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const faq = await FAQ.findByIdAndUpdate(id, body, {
            returnDocument: "after"
        });
        return NextResponse.json({ success: true, data: faq });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        await FAQ.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
