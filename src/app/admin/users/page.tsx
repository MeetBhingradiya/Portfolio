/**
 * Admin Users Page
 * All Better Auth users with role badges, role filter,
 * inline role assignment modal, and delete capability.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Search, Delete, Person, ChevronLeft, ChevronRight, Refresh,
    ManageAccounts, Shield, Close, Save,
} from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

const PAGE_SIZE = 15;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    admin:         { bg: "rgba(175,82,222,0.18)", text: "#AF52DE" },
    employee:      { bg: "rgba(0,122,255,0.15)",  text: "#007AFF" },
    paid_customer: { bg: "rgba(52,199,89,0.15)",  text: "#34C759" },
    user:          { bg: "rgba(142,142,147,0.15)", text: "#8E8E93" },
};

const BUILTIN_ROLES = ["user", "employee", "paid_customer"];

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
    hasRoleRecord?: boolean;
}

interface RoleDef {
    key: string;
    label: string;
    color?: string;
}

interface RoleModal {
    user: User;
    roles: string[];
    saving: boolean;
    error: string;
    newRole: string;
}

export default function UsersPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
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
        deleteConfirm: null as string | null,
    });
    const patchTable = useCallback((p: Partial<typeof table>) => setTable(s => ({ ...s, ...p })), []);

    const [modal, setModal] = useState<RoleModal | null>(null);
    const [roleDefs, setRoleDefs] = useState<RoleDef[]>([]);

    useEffect(() => {
        fetch("/api/admin/role-definitions")
            .then(r => r.json())
            .then(j => { if (j.success) setRoleDefs(j.roles ?? []); })
            .catch(() => {});
    }, []);

    const fetchUsers = useCallback(async () => {
        patchTable({ loading: true, error: "" });
        try {
            const params = new URLSearchParams({
                page: String(table.page),
                limit: String(PAGE_SIZE),
                search: table.search,
                ...(table.roleFilter ? { role: table.roleFilter } : {}),
            });
            const res = await fetch(`/api/admin/users?${params}`);
            const json = await res.json();
            if (json.success) {
                patchTable({ users: json.data ?? [], total: json.pagination?.total ?? 0 });
            } else {
                patchTable({ error: json.error || "Failed to load users" });
            }
        } catch {
            patchTable({ error: "Network error" });
        } finally {
            patchTable({ loading: false });
        }
    }, [table.page, table.search, table.roleFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) fetchUsers();
            else patchTable({ error: json.error || "Delete failed" });
        } catch {
            patchTable({ error: "Network error" });
        } finally {
            patchTable({ deleteConfirm: null });
        }
    };

    const openRoleModal = (user: User) => {
        setModal({ user, roles: [...(user.roles ?? ["user"])], saving: false, error: "", newRole: "" });
    };

    const toggleRole = (role: string) => {
        if (!modal) return;
        setModal(m => {
            if (!m) return m;
            const has = m.roles.includes(role);
            const next = has ? m.roles.filter(r => r !== role) : [...m.roles, role];
            return { ...m, roles: next.length ? next : ["user"] };
        });
    };

    const addCustomRole = () => {
        if (!modal || !modal.newRole.trim()) return;
        const r = modal.newRole.trim().toLowerCase().replace(/\s+/g, "_");
        if (!modal.roles.includes(r)) {
            setModal(m => m ? { ...m, roles: [...m.roles, r], newRole: "" } : m);
        } else {
            setModal(m => m ? { ...m, newRole: "" } : m);
        }
    };

    const saveRoles = async () => {
        if (!modal) return;
        setModal(m => m ? { ...m, saving: true, error: "" } : m);
        try {
            const res = await fetch("/api/admin/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: modal.user._id,
                    email: modal.user.email,
                    roles: modal.roles,
                    permissions: [],
                }),
            });
            const json = await res.json();
            if (json.success) {
                setModal(null);
                fetchUsers();
            } else {
                setModal(m => m ? { ...m, saving: false, error: json.error ?? "Save failed" } : m);
            }
        } catch {
            setModal(m => m ? { ...m, saving: false, error: "Network error" } : m);
        }
    };

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)"
        : isDark ? "rgba(24,24,28,0.95)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const pages = Math.max(1, Math.ceil(table.total / PAGE_SIZE));

    return (
        <div className="p-6" style={{ minHeight: "100vh", background: palette.background }}>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: palette.textPrimary }}>Users</h1>
                    <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>All registered users with role assignments</p>
                    <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>{table.total} users</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/roles">
                        <motion.div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                            style={{ background: `${palette.accent}15`, color: palette.accent }}
                            whileHover={{ scale: 1.03 }}
                        >
                            <ManageAccounts fontSize="small" /> Manage Roles
                        </motion.div>
                    </Link>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                        whileHover={{ scale: 1.03 }}
                        onClick={fetchUsers}
                    >
                        <Refresh fontSize="small" /> Refresh
                    </motion.button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: palette.textTertiary, fontSize: 18 }} />
                    <input
                        placeholder="Search by name or email…"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            border: `1px solid ${borderColor}`,
                            color: palette.textPrimary,
                        }}
                        onChange={e => { patchTable({ search: e.target.value, page: 1 }); }}
                    />
                </div>
                <CustomSelect
                    value={table.roleFilter}
                    onChange={v => { patchTable({ roleFilter: v, page: 1 }); }}
                    options={[
                        { value: "", label: "All Roles" },
                        { value: "admin", label: "Admin" },
                        { value: "employee", label: "Employee" },
                        { value: "paid_customer", label: "Paid Customer" },
                        { value: "user", label: "User (default)" },
                    ]}
                    placeholder="All Roles"
                />
            </div>

            {table.error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center justify-between"
                    style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232", border: "1px solid rgba(220,50,50,0.2)" }}>
                    <span>{table.error}</span>
                    <motion.button whileHover={{ scale: 1.1 }} className="ml-2 p-1 rounded" style={{ color: "#DC3232" }}
                        onClick={() => patchTable({ error: "" })}>
                        <Close style={{ fontSize: 16 }} />
                    </motion.button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                            {["User", "Email", "Roles", "Verified", "Joined", "Actions"].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide"
                                    style={{ color: palette.textTertiary }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-t" style={{ borderColor }}>
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div className="h-4 rounded animate-pulse"
                                                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", width: "70%" }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : table.users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center" style={{ color: palette.textTertiary }}>
                                    No users found
                                </td>
                            </tr>
                        ) : table.users.map(user => (
                            <tr key={user._id} className="border-t" style={{ borderColor }}>
                                {/* Avatar + Name */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                                style={{ background: `${palette.accent}20` }}>
                                                <Person style={{ fontSize: 16, color: palette.accent }} />
                                            </div>
                                        )}
                                        <span className="font-semibold" style={{ color: palette.textPrimary }}>
                                            {user.name || "—"}
                                        </span>
                                    </div>
                                </td>
                                {/* Email */}
                                <td className="px-4 py-3 text-sm" style={{ color: palette.textSecondary }}>{user.email}</td>
                                {/* Roles */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1 items-center">
                                        {(user.roles ?? ["user"]).map(role => {
                                            const s = getRoleStyle(role);
                                            return (
                                                <span key={role}
                                                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                    style={{ background: s.bg, color: s.text }}>
                                                    {role}
                                                </span>
                                            );
                                        })}
                                        <motion.button
                                            whileHover={{ scale: 1.15 }}
                                            title="Edit roles"
                                            onClick={() => openRoleModal(user)}
                                            className="p-1 rounded-lg"
                                            style={{ color: palette.textTertiary }}
                                        >
                                            <Shield style={{ fontSize: 14 }} />
                                        </motion.button>
                                    </div>
                                </td>
                                {/* Verified */}
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                        style={{
                                            background: user.emailVerified ? "rgba(52,199,89,0.15)" : "rgba(255,149,0,0.15)",
                                            color: user.emailVerified ? "#34C759" : "#FF9500"
                                        }}>
                                        {user.emailVerified ? "Verified" : "Unverified"}
                                    </span>
                                </td>
                                {/* Joined */}
                                <td className="px-4 py-3 text-sm" style={{ color: palette.textTertiary }}>
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                                </td>
                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        {table.deleteConfirm === user._id ? (
                                            <>
                                                <motion.button whileHover={{ scale: 1.05 }}
                                                    className="px-2 py-1 rounded-lg text-xs font-bold"
                                                    style={{ background: "rgba(220,50,50,0.15)", color: "#DC3232" }}
                                                    onClick={() => handleDelete(user._id)}>
                                                    Confirm
                                                </motion.button>
                                                <motion.button whileHover={{ scale: 1.05 }}
                                                    className="px-2 py-1 rounded-lg text-xs"
                                                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                                    onClick={() => patchTable({ deleteConfirm: null })}>
                                                    Cancel
                                                </motion.button>
                                            </>
                                        ) : (
                                            <motion.button whileHover={{ scale: 1.1 }}
                                                className="p-1.5 rounded-lg"
                                                style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232" }}
                                                onClick={() => patchTable({ deleteConfirm: user._id })}
                                                title="Delete user">
                                                <Delete style={{ fontSize: 16 }} />
                                            </motion.button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor }}>
                        <p className="text-xs" style={{ color: palette.textTertiary }}>Page {table.page} of {pages}</p>
                        <div className="flex gap-2">
                            <motion.button disabled={table.page <= 1} whileHover={{ scale: table.page > 1 ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: table.page <= 1 ? palette.textTertiary : palette.textSecondary }}
                                onClick={() => patchTable({ page: Math.max(1, table.page - 1) })}>
                                <ChevronLeft fontSize="small" />
                            </motion.button>
                            <motion.button disabled={table.page >= pages} whileHover={{ scale: table.page < pages ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: table.page >= pages ? palette.textTertiary : palette.textSecondary }}
                                onClick={() => patchTable({ page: Math.min(pages, table.page + 1) })}>
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
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl p-6"
                            style={{
                                background: isDark ? "rgba(28,28,32,0.98)" : "#fff",
                                border: `1px solid ${borderColor}`,
                                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-black text-base" style={{ color: palette.textPrimary }}>Assign Roles</p>
                                    <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>{modal.user.email}</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setModal(null)}
                                    className="p-1.5 rounded-lg"
                                    style={{ color: palette.textTertiary, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}>
                                    <Close fontSize="small" />
                                </motion.button>
                            </div>

                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>
                                Built-in Roles
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {BUILTIN_ROLES.map(role => {
                                    const active = modal.roles.includes(role);
                                    const s = getRoleStyle(role);
                                    return (
                                        <motion.button key={role} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => toggleRole(role)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                                            style={{
                                                background: active ? s.bg : "transparent",
                                                color: active ? s.text : palette.textTertiary,
                                                borderColor: active ? s.text + "44" : borderColor,
                                            }}>
                                            {role}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {roleDefs.filter(d => !BUILTIN_ROLES.includes(d.key)).length > 0 && (
                                <>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>
                                        Custom Roles
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {roleDefs.filter(d => !BUILTIN_ROLES.includes(d.key)).map(def => {
                                            const active = modal.roles.includes(def.key);
                                            return (
                                                <motion.button key={def.key} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                                    onClick={() => toggleRole(def.key)}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                                                    style={{
                                                        background: active ? "rgba(255,149,0,0.18)" : "transparent",
                                                        color: active ? "#FF9500" : palette.textTertiary,
                                                        borderColor: active ? "#FF950044" : borderColor,
                                                    }}>
                                                    {def.label || def.key}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Ad-hoc roles not in definitions */}
                            {modal.roles.filter(r => !BUILTIN_ROLES.includes(r) && !roleDefs.some(d => d.key === r)).length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {modal.roles.filter(r => !BUILTIN_ROLES.includes(r) && !roleDefs.some(d => d.key === r)).map(role => (
                                        <span key={role}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                                            style={{ background: "rgba(255,149,0,0.12)", color: "#FF9500", border: "1px solid #FF950033" }}>
                                            {role}
                                            <button onClick={() => toggleRole(role)} className="ml-0.5 opacity-70 hover:opacity-100">
                                                <Close style={{ fontSize: 12 }} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 mb-5">
                                <input
                                    placeholder="Ad-hoc role key…"
                                    value={modal.newRole}
                                    onChange={e => setModal(m => m ? { ...m, newRole: e.target.value } : m)}
                                    onKeyDown={e => { if (e.key === "Enter") addCustomRole(); }}
                                    className="flex-1 px-3 py-2 text-sm rounded-xl outline-none"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                        border: `1px solid ${borderColor}`,
                                        color: palette.textPrimary,
                                    }}
                                />
                                <motion.button whileHover={{ scale: 1.04 }} onClick={addCustomRole}
                                    className="px-3 py-2 rounded-xl text-sm font-bold"
                                    style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                    Add
                                </motion.button>
                            </div>

                            {modal.error && (
                                <p className="text-xs mb-3 font-medium" style={{ color: "#FF3B30" }}>{modal.error}</p>
                            )}

                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={saveRoles} disabled={modal.saving}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black"
                                style={{ background: palette.accent, color: "#fff", opacity: modal.saving ? 0.7 : 1 }}>
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

