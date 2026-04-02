/**
 * Admin API Protection Middleware
 *
 * Provides server-side protection for admin API routes:
 *  - Verify authentication
 *  - Check specific permissions
 *  - Enforce admin-only access
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@Library/auth";
import {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdminUser
} from "@/Library/permissions";

/**
 * Check if a request is from an authenticated admin account
 */
export async function requireAdminEmail(req: NextRequest) {
    const session = await getSession(req.headers);

    if (!session?.user) {
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated",
        };
    }

    const isAdmin = await isAdminUser(session.user.id, session.user.email);
    if (!isAdmin) {
        return {
            error: true,
            status: 403,
            message: "Forbidden: Admin access required",
        };
    }

    return { error: false, session };
}

/**
 * Check if a user has a specific permission
 */
export async function requirePermission(req: NextRequest, permission: string) {
    const session = await getSession(req.headers);

    if (!session?.user) {
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated",
        };
    }

    const has = await hasPermission(session.user.id, permission);

    if (!has) {
        return {
            error: true,
            status: 403,
            message: `Forbidden: Permission required: ${permission}`,
        };
    }

    return { error: false, session };
}

/**
 * Check if a user has ANY of the given permissions
 */
export async function requireAnyPermission(req: NextRequest, permissions: string[]) {
    const session = await getSession(req.headers);

    if (!session?.user) {
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated",
        };
    }

    const has = await hasAnyPermission(session.user.id, permissions);

    if (!has) {
        return {
            error: true,
            status: 403,
            message: `Forbidden: One of these permissions required: ${permissions.join(", ")}`,
        };
    }

    return { error: false, session };
}

/**
 * Check if a user has ALL of the given permissions
 */
export async function requireAllPermissions(req: NextRequest, permissions: string[]) {
    const session = await getSession(req.headers);

    if (!session?.user) {
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated",
        };
    }

    const has = await hasAllPermissions(session.user.id, permissions);

    if (!has) {
        return {
            error: true,
            status: 403,
            message: `Forbidden: All of these permissions required: ${permissions.join(", ")}`,
        };
    }

    return { error: false, session };
}

/**
 * Helper to return error response
 */
export function permissionError(status: number, message: string) {
    return NextResponse.json(
        { error: message },
        { status }
    );
}
