import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/Library/auth";
import { getUserPermissions, getUserRoles, isAdminEmail } from "@/Library/permissions";

export async function GET(req: NextRequest) {
    const session = await getSession(req.headers);

    // Not authenticated
    if (!session?.user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = isAdminEmail(session.user.email);

    // Get user roles and permissions
    const roles = await getUserRoles(session.user.id);
    const permissions = await getUserPermissions(session.user.id);

    return NextResponse.json({
        isAdmin,
        email: session.user.email,
        roles,
        permissions,
    });
}