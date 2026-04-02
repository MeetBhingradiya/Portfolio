import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@Library/auth";
import { getUserPermissions, getUserRoles, isAdminUser } from "@/Library/permissions";

export async function GET(req: NextRequest) {
    const session = await getSession(req.headers);

    // Not authenticated
    if (!session?.user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    // Get user roles and permissions
    const roles = await getUserRoles(session.user.id);
    const permissions = await getUserPermissions(session.user.id);
    const isAdmin = await isAdminUser(session.user.id, session.user.email);
    const canAccessAdmin = isAdmin || permissions.some((perm) => perm !== "user");

    return NextResponse.json({
        isAdmin,
        canAccessAdmin,
        email: session.user.email,
        roles,
        permissions,
    });
}