/**
 * Role & Permission Utilities
 * Server-side helpers for resolving effective user roles and permissions.
 *
 * Role hierarchy (highest to lowest):
 *   admin > employee > paid_customer > user
 *
 * The admin role is determined solely by the ADMIN_EMAIL env var.
 * All other roles are stored in the UserRole collection.
 *
 * Permission resolution order:
 *   1. If admin → all permissions granted implicitly.
 *   2. Expand each assigned role via RoleDefinition → collect permission keys.
 *   3. Apply per-user permission overrides (permissionOverrides) on top.
 */

import { getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { UserRole, IUserRole } from "@Models/UserRole";
import { RoleDefinition } from "@Models/RoleDefinition";
import { PERMISSIONS_MAP } from "@Config/Permissions";

export type AppRole = "admin" | "employee" | "paid_customer" | "user" | string;

export interface ResolvedUser {
    userId: string;
    email: string;
    name: string;
    image?: string;
    roles: AppRole[];
    /** Effective permission keys — union of all assigned role permissions + per-user overrides */
    effectivePermissions: Set<string>;
    /** Raw per-user overrides stored in UserRole.permissions */
    permissionOverrides: { key: string; granted: boolean }[];
    isAdmin: boolean;
    isEmployee: boolean;
    isPaidCustomer: boolean;
}

/** Resolve the full role object for a given userId/email combo from the DB */
export async function getUserRoleRecord(userId: string): Promise<IUserRole | null> {
    await dbConnect();
    return UserRole.findOne({ userId }).lean() as any;
}

/**
 * Expand role keys into effective permission strings.
 * Loads RoleDefinition documents for the given role keys, merges their
 * permission arrays, then applies any per-user overrides.
 */
export async function resolveEffectivePermissions(roles: string[], overrides: { key: string; granted: boolean }[]): Promise<Set<string>> {
    await dbConnect();
    const defs = await RoleDefinition.find({ key: { $in: roles } }).lean();

    // Union of all role permissions
    const perms = new Set<string>();
    defs.forEach((def) => def.permissions.forEach((p) => perms.add(p)));

    // Apply per-user overrides
    overrides.forEach((o) => {
        if (o.granted) perms.add(o.key);
        else perms.delete(o.key);
    });

    return perms;
}

/** Get effective roles & permissions for the current session user */
export async function getResolvedUser(headers: Headers): Promise<ResolvedUser | null> {
    const session = await getSession(headers);
    if (!session?.user) return null;

    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = !!adminEmail && session.user.email === adminEmail;

    const dbRecord = await getUserRoleRecord(session.user.id);
    const roles: AppRole[] = isAdmin ? ["admin", "employee", "paid_customer", "user"] : (dbRecord?.roles ?? ["user"]);

    const overrides = isAdmin ? [] : (dbRecord?.permissions ?? []);

    // Admin gets all permissions implicitly — no DB lookup needed
    const effectivePermissions: Set<string> = isAdmin
        ? new Set(Object.keys(PERMISSIONS_MAP))
        : await resolveEffectivePermissions(roles, overrides);

    return {
        userId: session.user.id,
        email: session.user.email!,
        name: session.user.name ?? "User",
        image: session.user.image ?? undefined,
        roles,
        effectivePermissions,
        permissionOverrides: overrides,
        isAdmin,
        isEmployee: isAdmin || roles.includes("employee"),
        isPaidCustomer: isAdmin || roles.includes("paid_customer")
    };
}

/** Check a single permission key for the current session */
export async function hasPermission(headers: Headers, permissionKey: string): Promise<boolean> {
    const user = await getResolvedUser(headers);
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.effectivePermissions.has(permissionKey);
}

/** Require a specific role, throws if not satisfied */
export async function requireRole(headers: Headers, role: AppRole): Promise<ResolvedUser> {
    const user = await getResolvedUser(headers);
    if (!user) throw new Error("Unauthorized");

    const hierarchy: Record<string, number> = {
        user: 0,
        paid_customer: 1,
        employee: 2,
        admin: 3
    };

    const requiredLevel = hierarchy[role] ?? 0;
    const maxLevel = Math.max(...user.roles.map((r) => hierarchy[r] ?? 0));

    if (maxLevel < requiredLevel) {
        throw new Error(`Forbidden: requires role '${role}'`);
    }
    return user;
}

/** Quick helpers */
export const requireEmployee = (h: Headers) => requireRole(h, "employee");
export const requireAdmin = (h: Headers) => requireRole(h, "admin");
export const requireAuth = (h: Headers) => requireRole(h, "user");
