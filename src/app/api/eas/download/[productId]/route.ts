import { NextRequest, NextResponse } from "next/server";
import { EAAccess } from "@/Models/EAAccess";
import { ShopProduct } from "@/Models/ShopProduct";
import dbConnect from "@/Utils/dbConnect";
import { getSession } from "@Library/auth";
import fs from "fs";
import path from "path";
import { DateTime } from "luxon"; // Luxon is in package.json

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    try {
        await dbConnect();
        const { productId } = await params;
        const session = await getSession(req.headers);

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        // Verify product exists
        const product = await ShopProduct.findOne({ productId });
        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        // Verify user has active access (allow matching by their web user ID or their email)
        const access = await EAAccess.findOne({ 
            $or: [{ userId: userId }, { userId: userEmail }],
            productId, 
            status: "active" 
        });
        
        if (!access) {
            return NextResponse.json({ success: false, error: "Active subscription or access not found." }, { status: 403 });
        }

        const now = DateTime.now().setZone(access.timezone || "UTC");

        // Date range checks
        if (access.accessStartDate && now.toJSDate() < access.accessStartDate) {
            return NextResponse.json({ success: false, error: "Access has not started yet." }, { status: 403 });
        }
        if (access.accessEndDate && now.toJSDate() > access.accessEndDate) {
            return NextResponse.json({ success: false, error: "Access has expired." }, { status: 403 });
        }

        // Day of week restrictions
        if (access.allowedDaysOfWeek && access.allowedDaysOfWeek.length > 0) {
            // Luxon weekday: 1 (Mon) to 7 (Sun). 
            // Our DB assumes: 0=Sun, 1=Mon... 6=Sat.
            const jsDay = now.weekday === 7 ? 0 : now.weekday;
            if (!access.allowedDaysOfWeek.includes(jsDay)) {
                return NextResponse.json({ success: false, error: "Not allowed to access today based on schedule." }, { status: 403 });
            }
        }

        // Time of day restrictions
        if (access.allowedStartHour && access.allowedEndHour) {
            const currentFormatted = now.toFormat("HH:mm");
            if (currentFormatted < access.allowedStartHour || currentFormatted > access.allowedEndHour) {
                return NextResponse.json({ success: false, error: `Access restricted. Allowed hours: ${access.allowedStartHour} - ${access.allowedEndHour} (${access.timezone || "UTC"})` }, { status: 403 });
            }
        }

        // Get the filename from the product downloadUrl or assume APEX_LiquidityHunter
        // Since we are integrating APEX_LiquidityHunter right now:
        const fileName = product.downloadUrl ? product.downloadUrl.split('/').pop() : "APEX_LiquidityHunter.ex5";
        
        // Ensure secure path construction
        if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
            return NextResponse.json({ success: false, error: "Invalid filename" }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), "src", "EAs", fileName);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ success: false, error: "File not found on server." }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const headers = new Headers();
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

        return new NextResponse(fileBuffer, { status: 200, statusText: "OK", headers });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
