import { NextRequest, NextResponse } from "next/server";
import Libraries from "@Lib";

export async function GET(req: NextRequest) {
    const IP = Libraries.requestIp(req);

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
