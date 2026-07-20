import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/Utils/dbConnect";
import { BlogAccess_Model } from "@/Models/BlogAccess";
import { getSession } from "@Library/auth";

export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const p = req.nextUrl.searchParams;
        const blogId = p.get("blogId");
        const session = await getSession(req.headers).catch(() => null);

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!blogId) {
            return NextResponse.json({ success: false, error: "Missing blogId" }, { status: 400 });
        }

        await BlogAccess_Model().findOneAndDelete({ blogId, userId: session.user.id });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
