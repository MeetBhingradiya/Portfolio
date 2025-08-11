import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@Library";

export async function GET(req: NextRequest) {
    const IP = getClientIp(req);

    return NextResponse.json(
        {
            Stats: 1,
            Message: IP,
            StatusCode: 200
        },
        {
            status: 200
        }
    );
}
