import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@Library/auth";
import { canAccessAdminPanel, getUserPermissions, isAdminUser } from "@/Utils/RolePermissions";
export async function GET(req: NextRequest) {
    const session = await getSession(req.headers);

    // Not authenticated
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user roles and permissions
    const { getResolvedUser } = await import("@/Utils/RolePermissions");
    const resolved = await getResolvedUser(req.headers);

    const roles = resolved?.roles || ["user"];
    const permissions = resolved ? Array.from(resolved.effectivePermissions) : [];
    const isAdmin = resolved?.isAdmin || false;
    const canAccessAdmin = await canAccessAdminPanel(req.headers);

    return NextResponse.json({
        isAdmin,
        canAccessAdmin,
        email: session.user.email,
        roles,
        permissions
    });
}
