import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
    return NextResponse.json({ Status: 1, Message: 'Email status route is working', StatusCode: 200 }, { status: 200 });
}