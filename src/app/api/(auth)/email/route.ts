import { NextRequest, NextResponse } from "next/server";
import { is_email_already_exists } from "@/Controllers/Signup";

export async function POST(req: NextRequest) {
    try {
        const { body = null } = await req.json();
        const isExists = await is_email_already_exists(body.email);
        if (isExists) {
            return NextResponse.json({ Status: 0, Message: 'Email already exists', StatusCode: 400 }, { status: 400 });
        }
        return NextResponse.json({ Status: 1, Message: 'Email is available', StatusCode: 200 }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ Status: 0, Message: 'Internal server error', StatusCode: 500 }, { status: 500 });
    }
}