import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
    try {
        const session = await auth();
        const { provider } = await params;

        if (!session?.user?.email) {
            return NextResponse.json({
                Status: 0,
                Message: "Authentication required",
                StatusCode: "AUTHENTICATION_REQUIRED"
            }, { status: 401 });
        }

        const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";

        // Redirect to NextAuth provider connection
        const authUrl = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        
        return NextResponse.redirect(new URL(authUrl, req.url));

    } catch (error: any) {
        console.error("Connect provider error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            StatusCode: "INTERNAL_ERROR"
        }, { status: 500 });
    }
}
