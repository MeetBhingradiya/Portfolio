import { NextRequest, NextResponse } from "next/server";
import { EAAccess } from "@/Models/EAAccess";
import dbConnect from "@/Utils/dbConnect";
import { DateTime } from "luxon";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        // The EA (MQL5) sends: {"account":123456,"server":"Broker","balance":1000,"ea_version":"1.0","timestamp":123123}
        const body = await req.json();
        const { account, server, balance } = body;

        // Read productId from query params, as the EA does not send it in the body.
        // User should configure EA webhook as: https://website.com/api/eas/verify-access?productId=APEX_LIQ
        const productId = req.nextUrl.searchParams.get("productId");

        if (!account) {
            return NextResponse.json({ allowed: false, message: "Missing MetaTrader account number." }, { status: 400 });
        }

        const mtIdStr = account.toString();

        // Find an active access record that has this mtId in allowedMTIds
        const query: any = { status: "active", allowedMTIds: mtIdStr };
        if (productId) query.productId = productId;

        const access = await EAAccess.findOne(query);
        
        if (!access) {
            return NextResponse.json({ allowed: false, message: "License denied or account not registered." }, { status: 200 }); // EA expects 200 with allowed:false
        }

        const now = DateTime.now().setZone(access.timezone || "UTC");

        // Date range checks
        if (access.accessStartDate && now.toJSDate() < access.accessStartDate) {
            return NextResponse.json({ allowed: false, message: "Access has not started yet." }, { status: 200 });
        }
        if (access.accessEndDate && now.toJSDate() > access.accessEndDate) {
            return NextResponse.json({ allowed: false, message: "Access has expired." }, { status: 200 });
        }

        // Day of week restrictions
        if (access.allowedDaysOfWeek && access.allowedDaysOfWeek.length > 0) {
            const jsDay = now.weekday === 7 ? 0 : now.weekday;
            if (!access.allowedDaysOfWeek.includes(jsDay)) {
                return NextResponse.json({ allowed: false, message: "Trading disabled today based on schedule." }, { status: 200 });
            }
        }

        // Time of day restrictions
        if (access.allowedStartHour && access.allowedEndHour) {
            const currentFormatted = now.toFormat("HH:mm");
            if (currentFormatted < access.allowedStartHour || currentFormatted > access.allowedEndHour) {
                return NextResponse.json({ allowed: false, message: `Restricted hours: ${access.allowedStartHour}-${access.allowedEndHour}` }, { status: 200 });
            }
        }

        return NextResponse.json({ allowed: true, message: "Authorized" }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ allowed: false, message: err.message }, { status: 500 });
    }
}
