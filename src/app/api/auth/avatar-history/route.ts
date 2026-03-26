import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const context = `user:${session.user.id}`;
        const docs = await CDNAsset.find({
            type: "avatar",
            status: "active",
            context,
        })
            .sort({ createdAt: -1 })
            .limit(24)
            .select("assetId createdAt altText")
            .lean();

        const history = docs.map((doc: any) => ({
            assetId: doc.assetId,
            url: `/api/cdn/${doc.assetId}`,
            altText: doc.altText || "Previous profile avatar",
            createdAt: doc.createdAt,
        }));

        return NextResponse.json({ history });
    } catch (error: any) {
        console.error("[avatar-history]", error);
        return NextResponse.json(
            { error: error?.message || "Failed to load avatar history" },
            { status: 500 }
        );
    }
}
