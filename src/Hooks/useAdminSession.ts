/**
 * Hook for managing admin permissions on client side
 * Fetches user permissions from /api/admin/is-admin endpoint
 */

"use client";

import { useState, useEffect } from "react";

export interface AdminSession {
    isAdmin: boolean;
    canAccessAdmin?: boolean;
    email: string;
    roles: string[];
    permissions: string[];
}

export function useAdminSession() {
    const [session, setSession] = useState<AdminSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSession() {
            try {
                setLoading(true);
                const res = await fetch("/api/admin/is-admin");

                if (!res.ok) {
                    setError("Unauthorized");
                    setSession(null);
                    return;
                }

                const data = await res.json();
                setSession(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch admin session");
                setSession(null);
            } finally {
                setLoading(false);
            }
        }

        fetchSession();
    }, []);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: string): boolean => {
        if (!session) return false;
        if (session.isAdmin) return true; // Admins have all permissions
        return session.permissions.includes(permission);
    };

    /**
     * Check if user has ANY of the given permissions
     */
    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!session) return false;
        if (session.isAdmin) return true;
        return permissions.some(p => session.permissions.includes(p));
    };

    /**
     * Check if user has ALL of the given permissions
     */
    const hasAllPermissions = (permissions: string[]): boolean => {
        if (!session) return false;
        if (session.isAdmin) return true;
        return permissions.every(p => session.permissions.includes(p));
    };

    /**
     * Check if user has a specific role
     */
    const hasRole = (role: string): boolean => {
        return session?.roles.includes(role) || false;
    };

    return {
        session,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
    };
}
