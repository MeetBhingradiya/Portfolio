import { ControllerResponseMap } from "@Utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
    return ControllerResponseMap({
        Status: 0,
        Message: "Session POST",
        StatusCode: 200
    });
}