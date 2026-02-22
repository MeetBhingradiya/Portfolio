import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/Library/auth";

export async function GET(req: NextRequest) {
    const session = await getSession(req.headers);
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = !!adminEmail && session?.user?.email === adminEmail;
    return NextResponse.json({ isAdmin });
}
