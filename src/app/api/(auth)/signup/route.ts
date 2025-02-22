import { NextRequest, NextResponse } from "next/server";
import {  } from "@Models/Users";
import { } from "@Models/Sessions";

export function POST(req: NextRequest) {
    


    return NextResponse.json({ Status: 1, Message: 'Email status route is working', StatusCode: 200 }, { status: 200 });
}