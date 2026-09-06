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
import { hasPermission, hasAnyPermission, hasAllPermissions, isAdminUser } from "@/Utils/RolePermissions";
import { logSecurity, extractDeviceInfo } from "@Utils/DiscordLogger";

/**
 * Check if a request is from an authenticated admin account
 */
export async function requireAdminEmail(req: NextRequest) {
    const session = await getSession(req.headers);

    if (!session?.user) {
        logSecurity("unauthenticated", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            message: "Unauthenticated access to admin-only endpoint"
        });
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated"
        };
    }

    const isAdmin = await isAdminUser(req.headers);
    if (!isAdmin) {
        logSecurity("permission_denied", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            userEmail: session.user.email || undefined,
            permission: "admin",
            message: `Non-admin user attempted admin-only endpoint: ${session.user.email}`
        });
        return {
            error: true,
            status: 403,
            message: "Forbidden: Admin access required"
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
        logSecurity("unauthenticated", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            permission,
            message: `Unauthenticated access — permission required: ${permission}`
        });
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated"
        };
    }

    const has = await hasPermission(req.headers, permission);

    if (!has) {
        logSecurity("permission_denied", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            userEmail: session.user.email || undefined,
            permission,
            message: `Permission denied: ${permission} for ${session.user.email}`
        });
        return {
            error: true,
            status: 403,
            message: `Forbidden: Permission required: ${permission}`
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
        logSecurity("unauthenticated", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            permission: permissions.join(", "),
            message: `Unauthenticated access — one of required: ${permissions.join(", ")}`
        });
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated"
        };
    }

    const has = await hasAnyPermission(req.headers, permissions);

    if (!has) {
        logSecurity("permission_denied", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            userEmail: session.user.email || undefined,
            permission: permissions.join(", "),
            message: `Permission denied: none of [${permissions.join(", ")}] for ${session.user.email}`
        });
        return {
            error: true,
            status: 403,
            message: `Forbidden: One of these permissions required: ${permissions.join(", ")}`
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
        logSecurity("unauthenticated", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            permission: permissions.join(", "),
            message: `Unauthenticated access — all required: ${permissions.join(", ")}`
        });
        return {
            error: true,
            status: 401,
            message: "Unauthorized: Not authenticated"
        };
    }

    const has = await hasAllPermissions(req.headers, permissions);

    if (!has) {
        logSecurity("permission_denied", {
            path: req.nextUrl.pathname,
            method: req.method,
            device: extractDeviceInfo(req.headers),
            userEmail: session.user.email || undefined,
            permission: permissions.join(", "),
            message: `Permission denied: missing some of [${permissions.join(", ")}] for ${session.user.email}`
        });
        return {
            error: true,
            status: 403,
            message: `Forbidden: All of these permissions required: ${permissions.join(", ")}`
        };
    }

    return { error: false, session };
}

/**
 * Helper to return error response
 */
export function permissionError(status: number, message: string) {
    return NextResponse.json({ error: message }, { status });
}
