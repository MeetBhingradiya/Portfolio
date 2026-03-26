/**
 * User-Facing CDN Keys
 *
 * GET  /api/cdn/my-keys            — list all keys linked to the logged-in user's email
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAPIKey } from "@Models/CDNAPIKey";
import { CDNApplication } from "@Models/CDNApplication";
import { CDNRateWindow } from "@Models/CDNRateWindow";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Authentication required." }, { status: 401 });
        }
        const email = session.user.email.toLowerCase();

        await dbConnect();

        // Fetch all keys linked to this email (excludes hash)
        const keys = await CDNAPIKey.find({ applicantEmail: email })
            .select("-keyHash")
            .sort({ createdAt: -1 })
            .lean();

        // Fetch corresponding applications for context
        const applicationIds = [...new Set(keys.map(k => k.applicationId))];
        const applications = await CDNApplication.find({ _id: { $in: applicationIds } })
            .select("appName status requestedPlan createdAt reviewedAt")
            .lean();
        const appMap: Record<string, any> = {};
        applications.forEach(a => { appMap[a._id.toString()] = a; });

        // Fetch live usage windows (minute/hour/day remaining) for active keys
        const activeKeyIds = keys.filter(k => k.status === "active").map(k => k.keyId);
        const windows = activeKeyIds.length
            ? await CDNRateWindow.find({ keyId: { $in: activeKeyIds } }).lean()
            : [];

        const windowMap: Record<string, { minute?: number; hour?: number; day?: number }> = {};
        windows.forEach(w => {
            if (!windowMap[w.keyId]) windowMap[w.keyId] = {};
            windowMap[w.keyId][w.windowType as "minute" | "hour" | "day"] = w.count;
        });

        const enriched = keys.map(k => ({
            ...k,
            application: appMap[k.applicationId] ?? null,
            liveUsage   : windowMap[k.keyId] ?? {},
        }));

        return NextResponse.json({ keys: enriched });
    } catch (err: any) {
        console.error("[CDN my-keys GET]", err);
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}
