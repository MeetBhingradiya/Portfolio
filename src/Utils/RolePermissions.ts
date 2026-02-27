/**
 * Role & Permission Utilities
 * Server-side helpers for resolving effective user roles and permissions.
 *
 * Role hierarchy (highest to lowest):
 *   admin > employee > paid_customer > user
 *
 * The admin role is determined solely by the ADMIN_EMAIL env var.
 * All other roles are stored in the UserRole collection.
 */

import { getSession } from "@/Library/auth";
import dbConnect from "@Utils/dbConnect";
import { UserRole, IUserRole } from "@Models/UserRole";

export type AppRole = "admin" | "employee" | "paid_customer" | "user" | string;

export interface ResolvedUser {
    userId: string;
    email: string;
    name: string;
    image?: string;
    roles: AppRole[];
    permissions: { key: string; granted: boolean }[];
    isAdmin: boolean;
    isEmployee: boolean;
    isPaidCustomer: boolean;
}

/** Resolve the full role object for a given userId/email combo from the DB */
export async function getUserRoleRecord(userId: string): Promise<IUserRole | null> {
    await dbConnect();
    return UserRole.findOne({ userId }).lean() as any;
}

/** Get effective roles & permissions for the current session user */
export async function getResolvedUser(headers: Headers): Promise<ResolvedUser | null> {
    const session = await getSession(headers);
    if (!session?.user) return null;

    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = !!adminEmail && session.user.email === adminEmail;

    const dbRecord = await getUserRoleRecord(session.user.id);
    const roles: AppRole[] = isAdmin
        ? ["admin", "employee", "paid_customer", "user"]
        : (dbRecord?.roles ?? ["user"]);

    const permissions = isAdmin
        ? []
        : (dbRecord?.permissions ?? []);

    return {
        userId: session.user.id,
        email: session.user.email!,
        name: session.user.name ?? "User",
        image: session.user.image ?? undefined,
        roles,
        permissions,
        isAdmin,
        isEmployee: isAdmin || roles.includes("employee"),
        isPaidCustomer: isAdmin || roles.includes("paid_customer"),
    };
}

/** Require a specific role, throws if not satisfied */
export async function requireRole(headers: Headers, role: AppRole): Promise<ResolvedUser> {
    const user = await getResolvedUser(headers);
    if (!user) throw new Error("Unauthorized");

    const hierarchy: Record<string, number> = {
        user: 0,
        paid_customer: 1,
        employee: 2,
        admin: 3,
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
