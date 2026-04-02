/**
 * Permissions & Role Management Utility
 *
 * Provides helpers to:
 *  - Check if a user has specific permissions
 *  - Get all effective permissions (from roles + custom)
 *  - Verify access to admin sections
 */

import { UserRole } from "@/Models/UserRole";
import { RoleDefinition } from "@/Models/RoleDefinition";

const ADMIN_ROLE = "admin";

/**
 * Get all effective permissions for a user
 * Merges permissions from all assigned roles + custom permissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
    const userRole = await UserRole.findOne({ userId });
    if (!userRole) return ["user"]; // Default to 'user' role

    const allPermissions = new Set<string>();

    // Collect permissions from all roles
    const roles = await RoleDefinition.find({ key: { $in: userRole.roles } });
    roles.forEach(role => {
        role.permissions.forEach((perm: string) => allPermissions.add(perm));
    });

    // Add custom permissions (only granted ones)
    userRole.permissions
        .filter((p: any) => p.granted)
        .forEach((p: any) => allPermissions.add(p.key));

    return Array.from(allPermissions);
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
    // Admin always has all permissions
    const userRole = await UserRole.findOne({ userId });
    if (userRole?.roles.includes(ADMIN_ROLE)) return true;

    const permissions = await getUserPermissions(userId);
    return permissions.includes(permission);
}

/**
 * Check if user has ANY of the given permissions
 */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    const userPerms = await getUserPermissions(userId);
    return permissions.some(p => userPerms.includes(p));
}

/**
 * Check if user has ALL of the given permissions
 */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const userPerms = await getUserPermissions(userId);
    return permissions.every(p => userPerms.includes(p));
}

/**
 * Get all roles assigned to a user
 */
export async function getUserRoles(userId: string): Promise<string[]> {
    const userRole = await UserRole.findOne({ userId });
    return userRole?.roles || ["user"];
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, role: string): Promise<boolean> {
    const roles = await getUserRoles(userId);
    return roles.includes(role);
}

/**
 * Check if user should be treated as admin
 * Supports ADMIN_EMAIL owner and delegated admin role.
 */
export async function isAdminUser(userId: string, email: string): Promise<boolean> {
    if (isAdminEmail(email)) return true;
    return hasRole(userId, ADMIN_ROLE);
}

/**
 * Check if user is admin (ADMIN_EMAIL env check)
 */
export function isAdminEmail(email: string): boolean {
    const adminEmail = process.env.ADMIN_EMAIL;
    return !!adminEmail && email === adminEmail;
}
