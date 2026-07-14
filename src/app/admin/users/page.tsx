/**
 * Admin Users Page
 * All Better Auth users with role badges, role filter,
 * inline role assignment modal, and delete capability.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PERMISSIONS, PERMISSION_CATEGORIES } from "@Config/Permissions";
import type { PermissionDef } from "@Config/Permissions";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { useAdminSession } from "@Hooks/useAdminSession";
import { Search, Delete, Person, ChevronLeft, ChevronRight, Refresh, ManageAccounts, Shield, Close, Save, Visibility, VisibilityOff } from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

const PAGE_SIZE = 15;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    admin: { bg: "rgba(175,82,222,0.18)", text: "#AF52DE" },
    employee: { bg: "rgba(0,122,255,0.15)", text: "#007AFF" },
    paid_customer: { bg: "rgba(52,199,89,0.15)", text: "#34C759" },
    user: { bg: "rgba(142,142,147,0.15)", text: "#8E8E93" }
};

function getRoleStyle(role: string) {
    return ROLE_COLORS[role] ?? { bg: "rgba(255,149,0,0.15)", text: "#FF9500" };
}

interface User {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    emailVerified?: boolean;
    createdAt?: string;
    roles?: string[];
    permissions?: { key: string; label?: string; granted?: boolean }[];
    hasRoleRecord?: boolean;
}

interface RoleDef {
    key: string;
    label: string;
    description?: string;
    color?: string;
    isBuiltin?: boolean;
}

interface RoleModal {
    user: User;
    roles: string[];
    saving: boolean;
    error: string;
    newRole: string;
    permissions?: { key: string; label: string; granted?: boolean }[];
    permissionQuery?: string;
}

export default function UsersPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { session } = useAdminSession();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [table, setTable] = useState({
        users: [] as User[],
        total: 0,
        page: 1,
        search: "",
        roleFilter: "",
        loading: false,
        error: "",
        deleteConfirm: null as string | null
    });
    const patchTable = useCallback((p: Partial<typeof table>) => setTable((s) => ({ ...s, ...p })), []);

    const [modal, setModal] = useState<RoleModal | null>(null);
    const [roleDefs, setRoleDefs] = useState<RoleDef[]>([]);
    const [visibleEmails, setVisibleEmails] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetch("/api/admin/role-definitions")
            .then((r) => r.json())
            .then((j) => {
                if (j.success) setRoleDefs(j.roles ?? []);
            })
            .catch(() => {});
    }, []);

    const fetchUsers = useCallback(async () => {
        patchTable({ loading: true, error: "" });
        try {
            const params = new URLSearchParams({
                page: String(table.page),
                limit: String(PAGE_SIZE),
                search: table.search,
                ...(table.roleFilter ? { role: table.roleFilter } : {})
            });
            const res = await fetch(`/api/admin/users?${params}`);
            const json = await res.json();
            if (json.success) {
                patchTable({
                    users: json.data ?? [],
                    total: json.pagination?.total ?? 0
                });
            } else {
                patchTable({ error: json.error || "Failed to load users" });
            }
        } catch {
            patchTable({ error: "Network error" });
        } finally {
            patchTable({ loading: false });
        }
    }, [table.page, table.search, table.roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE"
            });
            const json = await res.json();
            if (json.success) fetchUsers();
            else patchTable({ error: json.error || "Delete failed" });
        } catch {
            patchTable({ error: "Network error" });
        } finally {
            patchTable({ deleteConfirm: null });
        }
    };

    const toggleUserEmailVisibility = (userId: string) => {
        setVisibleEmails((prev) => ({ ...prev, [userId]: !prev[userId] }));
    };

    const maskEmail = (email?: string) => {
        if (!email) return "—";
        const [localPart = "", domainPart = ""] = email.split("@");
        if (!domainPart) return email;
        const [host = "", ...rest] = domainPart.split(".");
        const localMasked = localPart ? `${localPart.slice(0, 1)}${"*".repeat(Math.max(3, localPart.length - 1))}` : "***";
        const hostMasked = host ? `${host.slice(0, 1)}${"*".repeat(Math.max(3, host.length - 1))}` : "***";
        return `${localMasked}@${hostMasked}${rest.length ? `.${rest.join(".")}` : ""}`;
    };

    const openRoleModal = (user: User) => {
        setModal({
            user,
            roles: [...(user.roles ?? ["user"])],
            saving: false,
            error: "",
            newRole: "",
            permissions: (user.permissions ?? [])
                .filter((p) => p?.granted !== false && typeof p?.key === "string" && p.key.length > 0)
                .map((p) => ({
                    key: p.key,
                    label: p.label || PERMISSIONS.find((def) => def.key === p.key)?.label || p.key,
                    granted: true
                })),
            permissionQuery: ""
        });
    };

    const togglePermission = (key: string, label?: string) => {
        if (!modal) return;
        setModal((m) => {
            if (!m) return m;
            const exists = (m.permissions ?? []).find((p) => p.key === key);
            if (exists) return { ...m, permissions: (m.permissions ?? []).filter((p) => p.key !== key) };
            return { ...m, permissions: [...(m.permissions ?? []), { key, label: label ?? key, granted: true }] };
        });
    };

    const suggestedPermsForQuery = (query: string | undefined): PermissionDef[] => {
        const q = (query ?? "").trim().toLowerCase();
        if (!q) return [] as PermissionDef[];
        return PERMISSIONS.filter((p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)).slice(0, 8) as PermissionDef[];
    };

    const toggleRole = (role: string) => {
        if (!modal) return;
        setModal((m) => {
            if (!m) return m;
            const has = m.roles.includes(role);
            const next = has ? m.roles.filter((r) => r !== role) : [...m.roles, role];
            return { ...m, roles: next.length ? next : ["user"] };
        });
    };

    const addCustomRole = () => {
        if (!modal || !modal.newRole.trim()) return;
        const r = modal.newRole.trim().toLowerCase().replace(/\s+/g, "_");
        if (!modal.roles.includes(r)) {
            setModal((m) => (m ? { ...m, roles: [...m.roles, r], newRole: "" } : m));
        } else {
            setModal((m) => (m ? { ...m, newRole: "" } : m));
        }
    };

    const saveRoles = async () => {
        if (!modal) return;

        const isSelfTarget =
            !!session?.email &&
            !!modal.user.email &&
            session.email.toLowerCase() === modal.user.email.toLowerCase();
        const removesAdminFromSelf = isSelfTarget && !modal.roles.includes("admin");

        if (removesAdminFromSelf) {
            const ok = window.confirm(
                "You are removing your own admin role. This can lock you out of admin access. Continue?"
            );
            if (!ok) return;
        }

        setModal((m) => (m ? { ...m, saving: true, error: "" } : m));
        try {
            const res = await fetch("/api/admin/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: modal.user._id,
                    email: modal.user.email,
                    roles: modal.roles,
                    permissions: modal.permissions ?? [],
                    confirmSelfRoleChange: removesAdminFromSelf
                })
            });
            const json = await res.json();
            if (json.success) {
                setModal(null);
                fetchUsers();
            } else {
                setModal((m) =>
                    m
                        ? {
                              ...m,
                              saving: false,
                              error: json.error ?? "Save failed"
                          }
                        : m
                );
            }
        } catch {
            setModal((m) => (m ? { ...m, saving: false, error: "Network error" } : m));
        }
    };

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)") : isDark ? "rgba(24,24,28,0.95)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const pages = Math.max(1, Math.ceil(table.total / PAGE_SIZE));
    const builtinRoleDefs = roleDefs.filter((d) => d.isBuiltin);
    const builtinRoleKeys = builtinRoleDefs.map((d) => d.key);
    const suggestedRoles = roleDefs.filter((d) => !d.isBuiltin);
    const suggestedPerms = PERMISSIONS.slice(0, 10);
    const defaultPermissionQueryResults = modal ? suggestedPermsForQuery(modal.permissionQuery) : [];

    return (
        <div
            className="p-6"
            style={{ minHeight: "100vh", background: palette.background }}>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1
                        className="text-2xl font-black"
                        style={{ color: palette.textPrimary }}>
                        Users
                    </h1>
                    <p
                        className="text-sm mt-0.5"
                        style={{ color: palette.textSecondary }}>
                        All registered users with role assignments
                    </p>
                    <p
                        className="text-xs mt-1"
                        style={{ color: palette.textTertiary }}>
                        {table.total} users
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/roles">
                        <motion.div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                            style={{
                                background: `${palette.accent}15`,
                                color: palette.accent
                            }}
                            whileHover={{ scale: 1.03 }}>
                            <ManageAccounts fontSize="small" /> Manage Roles
                        </motion.div>
                    </Link>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: palette.textSecondary
                        }}
                        whileHover={{ scale: 1.03 }}
                        onClick={fetchUsers}>
                        <Refresh fontSize="small" /> Refresh
                    </motion.button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: palette.textTertiary, fontSize: 18 }}
                    />
                    <input
                        placeholder="Search by name or email…"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            border: `1px solid ${borderColor}`,
                            color: palette.textPrimary
                        }}
                        onChange={(e) => {
                            patchTable({ search: e.target.value, page: 1 });
                        }}
                    />
                </div>
                <CustomSelect
                    value={table.roleFilter}
                    onChange={(v) => {
                        patchTable({ roleFilter: v, page: 1 });
                    }}
                    options={[
                        { value: "", label: "All Roles" },
                        { value: "admin", label: "Admin" },
                        { value: "employee", label: "Employee" },
                        { value: "paid_customer", label: "Paid Customer" },
                        { value: "user", label: "User (default)" }
                    ]}
                    placeholder="All Roles"
                />
            </div>

            {table.error && (
                <div
                    className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center justify-between"
                    style={{
                        background: "rgba(220,50,50,0.1)",
                        color: "#DC3232",
                        border: "1px solid rgba(220,50,50,0.2)"
                    }}>
                    <span>{table.error}</span>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="ml-2 p-1 rounded"
                        style={{ color: "#DC3232" }}
                        onClick={() => patchTable({ error: "" })}>
                        <Close style={{ fontSize: 16 }} />
                    </motion.button>
                </div>
            )}

            {/* Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`
                }}>
                <table className="w-full text-sm">
                    <thead>
                        <tr
                            style={{
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
                            }}>
                            {["User", "Email", "Roles", "Verified", "Joined", "Actions"].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide"
                                    style={{ color: palette.textTertiary }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr
                                    key={i}
                                    className="border-t"
                                    style={{ borderColor }}>
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td
                                            key={j}
                                            className="px-4 py-3">
                                            <div
                                                className="h-4 rounded animate-pulse"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                                                    width: "70%"
                                                }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : table.users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-12 text-center"
                                    style={{ color: palette.textTertiary }}>
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            table.users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="border-t"
                                    style={{ borderColor }}>
                                    {/* Avatar + Name */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {user.image ? (
                                                <img
                                                    src={user.image}
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{
                                                        background: `${palette.accent}20`
                                                    }}>
                                                    <Person
                                                        style={{
                                                            fontSize: 16,
                                                            color: palette.accent
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <span
                                                className="font-semibold"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {user.name || "—"}
                                            </span>
                                        </div>
                                    </td>
                                    {/* Email */}
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="truncate"
                                                style={{ color: palette.textSecondary }}>
                                                {visibleEmails[user._id] ? user.email : maskEmail(user.email)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => toggleUserEmailVisibility(user._id)}
                                                className="p-1 rounded-md shrink-0"
                                                title={visibleEmails[user._id] ? "Hide email" : "Show email"}
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                    color: palette.textTertiary
                                                }}>
                                                {visibleEmails[user._id] ? <VisibilityOff style={{ fontSize: 14 }} /> : <Visibility style={{ fontSize: 14 }} />}
                                            </button>
                                        </div>
                                    </td>
                                    {/* Roles */}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1 items-center">
                                            {(user.roles ?? ["user"]).map((role) => {
                                                const s = getRoleStyle(role);
                                                return (
                                                    <span
                                                        key={role}
                                                        className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                        style={{
                                                            background: s.bg,
                                                            color: s.text
                                                        }}>
                                                        {role}
                                                    </span>
                                                );
                                            })}
                                            <motion.button
                                                whileHover={{ scale: 1.15 }}
                                                title="Edit roles"
                                                onClick={() => openRoleModal(user)}
                                                className="p-1 rounded-lg"
                                                style={{
                                                    color: palette.textTertiary
                                                }}>
                                                <Shield style={{ fontSize: 14 }} />
                                            </motion.button>
                                        </div>
                                    </td>
                                    {/* Verified */}
                                    <td className="px-4 py-3">
                                        <span
                                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                            style={{
                                                background: user.emailVerified ? "rgba(52,199,89,0.15)" : "rgba(255,149,0,0.15)",
                                                color: user.emailVerified ? "#34C759" : "#FF9500"
                                            }}>
                                            {user.emailVerified ? "Verified" : "Unverified"}
                                        </span>
                                    </td>
                                    {/* Joined */}
                                    <td
                                        className="px-4 py-3 text-sm"
                                        style={{ color: palette.textTertiary }}>
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            {table.deleteConfirm === user._id ? (
                                                <>
                                                    <motion.button
                                                        whileHover={{
                                                            scale: 1.05
                                                        }}
                                                        className="px-2 py-1 rounded-lg text-xs font-bold"
                                                        style={{
                                                            background: "rgba(220,50,50,0.15)",
                                                            color: "#DC3232"
                                                        }}
                                                        onClick={() => handleDelete(user._id)}>
                                                        Confirm
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{
                                                            scale: 1.05
                                                        }}
                                                        className="px-2 py-1 rounded-lg text-xs"
                                                        style={{
                                                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                            color: palette.textSecondary
                                                        }}
                                                        onClick={() =>
                                                            patchTable({
                                                                deleteConfirm: null
                                                            })
                                                        }>
                                                        Cancel
                                                    </motion.button>
                                                </>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    className="p-1.5 rounded-lg"
                                                    style={{
                                                        background: "rgba(220,50,50,0.1)",
                                                        color: "#DC3232"
                                                    }}
                                                    onClick={() =>
                                                        patchTable({
                                                            deleteConfirm: user._id
                                                        })
                                                    }
                                                    title="Delete user">
                                                    <Delete style={{ fontSize: 16 }} />
                                                </motion.button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {pages > 1 && (
                    <div
                        className="flex items-center justify-between px-4 py-3 border-t"
                        style={{ borderColor }}>
                        <p
                            className="text-xs"
                            style={{ color: palette.textTertiary }}>
                            Page {table.page} of {pages}
                        </p>
                        <div className="flex gap-2">
                            <motion.button
                                disabled={table.page <= 1}
                                whileHover={{
                                    scale: table.page > 1 ? 1.05 : 1
                                }}
                                className="p-1.5 rounded-lg"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: table.page <= 1 ? palette.textTertiary : palette.textSecondary
                                }}
                                onClick={() =>
                                    patchTable({
                                        page: Math.max(1, table.page - 1)
                                    })
                                }>
                                <ChevronLeft fontSize="small" />
                            </motion.button>
                            <motion.button
                                disabled={table.page >= pages}
                                whileHover={{
                                    scale: table.page < pages ? 1.05 : 1
                                }}
                                className="p-1.5 rounded-lg"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: table.page >= pages ? palette.textTertiary : palette.textSecondary
                                }}
                                onClick={() =>
                                    patchTable({
                                        page: Math.min(pages, table.page + 1)
                                    })
                                }>
                                <ChevronRight fontSize="small" />
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Role Edit Modal ── */}
            <AnimatePresence>
                {modal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)"
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setModal(null);
                        }}>
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl p-6"
                            style={{
                                background: isDark ? "rgba(28,28,32,0.98)" : "#fff",
                                border: `1px solid ${borderColor}`,
                                boxShadow: "0 24px 64px rgba(0,0,0,0.4)"
                            }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="min-w-0">
                                    <p className="font-black text-base" style={{ color: palette.textPrimary }}>
                                        Assign Roles
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2 min-w-0">
                                        <p className="text-xs truncate" style={{ color: palette.textSecondary }}>
                                            {visibleEmails[modal.user._id] ? modal.user.email : maskEmail(modal.user.email)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => toggleUserEmailVisibility(modal.user._id)}
                                            className="p-1 rounded-md shrink-0"
                                            title={visibleEmails[modal.user._id] ? "Hide email" : "Show email"}
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                                color: palette.textTertiary
                                            }}>
                                            {visibleEmails[modal.user._id] ? <VisibilityOff style={{ fontSize: 14 }} /> : <Visibility style={{ fontSize: 14 }} />}
                                        </button>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => setModal(null)}
                                    className="p-1.5 rounded-lg"
                                    style={{
                                        color: palette.textTertiary,
                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"
                                    }}>
                                    <Close fontSize="small" />
                                </motion.button>
                            </div>

                            <div
                                className="mb-4 rounded-2xl border p-3"
                                style={{
                                    borderColor,
                                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
                                }}>
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: palette.textTertiary }}>
                                        Suggestions
                                    </p>
                                    <p className="text-[11px]" style={{ color: palette.textSecondary }}>
                                        Roles and permissions in one place
                                    </p>
                                </div>

                                <input
                                    placeholder="Add permission (type to search)…"
                                    value={modal.permissionQuery ?? ""}
                                    onChange={(e) => setModal((m) => (m ? { ...m, permissionQuery: e.target.value } : m))}
                                    className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                        border: `1px solid ${borderColor}`,
                                        color: palette.textPrimary
                                    }}
                                />

                                {suggestedRoles.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>
                                            Roles
                                        </p>
                                        <div className="space-y-2">
                                            {suggestedRoles.map((def) => {
                                                const active = modal.roles.includes(def.key);
                                                return (
                                                    <motion.button
                                                        key={def.key}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        onClick={() => toggleRole(def.key)}
                                                        className="w-full flex items-start justify-between gap-3 px-3 py-2 rounded-xl text-left border transition-all"
                                                        style={{
                                                            background: active ? "rgba(255,149,0,0.12)" : "transparent",
                                                            color: active ? "#FF9500" : palette.textPrimary,
                                                            borderColor: active ? "#FF950044" : borderColor
                                                        }}>
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-bold truncate">{def.label || def.key}</span>
                                                            <span className="block text-[11px] mt-0.5 break-words" style={{ color: palette.textSecondary }}>
                                                                {def.description || def.key}
                                                            </span>
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-mono px-2 py-1 rounded-lg shrink-0"
                                                            style={{
                                                                background: active ? "rgba(255,149,0,0.15)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                                color: active ? "#FF9500" : palette.textTertiary
                                                            }}>
                                                            {def.key}
                                                        </span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {modal.permissionQuery && modal.permissionQuery.trim().length > 0 && (
                                    <div className="mt-2 space-y-1 max-h-44 overflow-auto">
                                        {defaultPermissionQueryResults.map((p) => {
                                            const active = (modal.permissions ?? []).some((pp) => pp.key === p.key);
                                            return (
                                                <button
                                                    key={p.key}
                                                    type="button"
                                                    onClick={() => {
                                                        togglePermission(p.key, p.label);
                                                        setModal((m) => (m ? { ...m, permissionQuery: "" } : m));
                                                    }}
                                                    className="w-full text-left px-3 py-2 rounded-lg"
                                                    style={{
                                                        background: active ? "rgba(255,149,0,0.08)" : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                                                        color: palette.textPrimary
                                                    }}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="font-medium truncate">{p.label}</div>
                                                            <div className="text-[11px] mt-0.5 break-words" style={{ color: palette.textSecondary }}>
                                                                {p.description}
                                                            </div>
                                                        </div>
                                                        <div className="text-[11px] font-mono opacity-70 shrink-0">{p.key}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* {suggestedPerms.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>
                                            Permissions
                                        </p>
                                        <div className="space-y-2">
                                            {suggestedPerms.map((p) => {
                                                const active = (modal.permissions ?? []).some((pp) => pp.key === p.key);
                                                return (
                                                    <motion.button
                                                        key={p.key}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        onClick={() => togglePermission(p.key, p.label)}
                                                        className="w-full flex items-start justify-between gap-3 px-3 py-2 rounded-xl text-left border transition-all"
                                                        style={{
                                                            background: active ? "rgba(255,149,0,0.12)" : "transparent",
                                                            color: active ? "#FF9500" : palette.textPrimary,
                                                            borderColor: active ? "rgba(255,149,0,0.12)" : borderColor
                                                        }}>
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-bold truncate">{p.label}</span>
                                                            <span className="block text-[11px] mt-0.5 break-words" style={{ color: palette.textSecondary }}>
                                                                {p.description}
                                                            </span>
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-mono px-2 py-1 rounded-lg shrink-0"
                                                            style={{
                                                                background: active ? "rgba(255,149,0,0.15)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                                color: active ? "#FF9500" : palette.textTertiary
                                                            }}>
                                                            {p.key}
                                                        </span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )} */}

                                {(modal.permissions ?? []).length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>
                                            Assigned Permission Overrides
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(modal.permissions ?? []).map((perm) => (
                                                <span
                                                    key={perm.key}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                                                    style={{
                                                        background: "rgba(255,149,0,0.12)",
                                                        color: "#FF9500",
                                                        border: "1px solid #FF950033"
                                                    }}>
                                                    {perm.label || perm.key}
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePermission(perm.key, perm.label)}
                                                        className="ml-0.5 opacity-70 hover:opacity-100"
                                                        title="Remove permission override">
                                                        <Close style={{ fontSize: 12 }} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mb-5">
                                <input
                                    placeholder="Ad-hoc role key…"
                                    value={modal.newRole}
                                    onChange={(e) =>
                                        setModal((m) =>
                                            m
                                                ? {
                                                      ...m,
                                                      newRole: e.target.value
                                                  }
                                                : m
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addCustomRole();
                                    }}
                                    className="flex-1 px-3 py-2 text-sm rounded-xl outline-none"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                        border: `1px solid ${borderColor}`,
                                        color: palette.textPrimary
                                    }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    onClick={addCustomRole}
                                    className="px-3 py-2 rounded-xl text-sm font-bold"
                                    style={{
                                        background: `${palette.accent}18`,
                                        color: palette.accent
                                    }}>
                                    Add
                                </motion.button>
                            </div>

                            {modal.error && (
                                <p className="text-xs mb-3 font-medium" style={{ color: "#FF3B30" }}>
                                    {modal.error}
                                </p>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={saveRoles}
                                disabled={modal.saving}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black"
                                style={{
                                    background: palette.accent,
                                    color: "#fff",
                                    opacity: modal.saving ? 0.7 : 1
                                }}>
                                <Save fontSize="small" />
                                {modal.saving ? "Saving…" : "Save Roles"}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
