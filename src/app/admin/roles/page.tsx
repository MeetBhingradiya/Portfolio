/**
 * Admin — Roles & Permissions Manager (v2)
 *
 * Tab 1 — Role Definitions
 *   • List all roles fetched from /api/admin/role-definitions
 *   • "Create Role" form (key, label, description, color)
 *   • Click any role → right drawer with permission toggles grouped by category
 *   • Save (PATCH) / Delete (DELETE, blocked for built-ins)
 *
 * Tab 2 — User Assignments
 *   • List UserRole records from /api/admin/roles
 *   • "Add User" → email lookup → POST /api/admin/roles
 *   • Click user row → right drawer: assign roles (checkboxes) + per-user overrides + notes
 *   • Save (PATCH) / Remove (DELETE)
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    ManageAccounts,
    Add,
    Delete,
    Save,
    Close,
    Search,
    CheckBox,
    CheckBoxOutlineBlank,
    PersonAdd,
    Tune,
    Shield,
    Circle,
} from "@mui/icons-material";
import {
    PERMISSION_CATEGORIES,
    PERMISSIONS,
    permissionsByCategory,
    type PermissionDef,
} from "@Config/Permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleDef {
    _id: string;
    key: string;
    label: string;
    description?: string;
    permissions: string[];
    isBuiltin: boolean;
    color: string;
    order: number;
}

interface UserRoleRecord {
    _id: string;
    userId: string;
    email: string;
    roles: string[];
    permissions: { key: string; label: string; granted: boolean }[];
    notes?: string;
    grantedBy?: string;
}

type Tab = "definitions" | "assignments";

const PRESET_COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
    "#22c55e", "#ef4444", "#06b6d4", "#f97316",
];

// ─── Permission Category Row (needs own state for expand/collapse) ───────────

interface PermCategoryRowProps {
    catKey: string;
    perms: PermissionDef[];
    editUserPerms: { key: string; label: string; granted: boolean }[];
    toggleUserPerm: (key: string) => void;
    isDark: boolean;
    palette: ReturnType<typeof import("@Hooks/useDesignTheme").useDesignTheme>["palette"];
}

function PermCategoryRow({ catKey, perms, editUserPerms, toggleUserPerm, isDark, palette }: PermCategoryRowProps) {
    const catMeta = PERMISSION_CATEGORIES[catKey];
    const activeOverrides = editUserPerms.filter(p => perms.find((cp: PermissionDef) => cp.key === p.key) && p.granted);
    const [expanded, setExpanded] = React.useState(activeOverrides.length > 0);
    return (
        <div className="mb-2">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center gap-2 py-1.5 text-left"
            >
                <span className="w-2 h-2 rounded-full" style={{ background: catMeta.color }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: catMeta.color }}>{catMeta.label}</span>
                {activeOverrides.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${catMeta.color}18`, color: catMeta.color }}>
                        {activeOverrides.length}
                    </span>
                )}
            </button>
            {expanded && (
                <div className="space-y-1 pl-4 mt-1">
                    {perms.map((p: PermissionDef) => {
                        const override = editUserPerms.find(ep => ep.key === p.key);
                        const on = override?.granted ?? false;
                        return (
                            <motion.button
                                key={p.key}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => toggleUserPerm(p.key)}
                                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-left"
                                style={{
                                    background: on ? `${catMeta.color}12` : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                    color: on ? catMeta.color : palette.textSecondary,
                                }}
                            >
                                {on
                                    ? <CheckBox fontSize="small" style={{ color: catMeta.color, flexShrink: 0 }} />
                                    : <CheckBoxOutlineBlank fontSize="small" style={{ color: palette.textTertiary, flexShrink: 0 }} />}
                                <span className="flex-1">{p.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRolesPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark  = actualColorMode === "dark";

    const cardBg  = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border  = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const drawerBg = isDark ? "#1c1c20" : "#f5f5f8";
    const br      = isApple ? 16 : 20;

    // ── Shared state ──────────────────────────────────────────────────────────
    const [tab, setTab]             = useState<Tab>("definitions");
    const [roleDefs, setRoleDefs]   = useState<RoleDef[]>([]);
    const [userRoles, setUserRoles] = useState<UserRoleRecord[]>([]);
    const [loadingDefs, setLoadingDefs] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // ── Tab 1 state ───────────────────────────────────────────────────────────
    const [activeRole, setActiveRole]       = useState<RoleDef | null>(null);
    const [editPermsSet, setEditPermsSet]   = useState<Set<string>>(new Set());
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [newRole, setNewRole] = useState({ key: "", label: "", description: "", color: PRESET_COLORS[0] });
    const [savingDef, setSavingDef]         = useState(false);
    const [defSearch, setDefSearch]         = useState("");

    // ── Tab 2 state ───────────────────────────────────────────────────────────
    const [activeUser, setActiveUser]         = useState<UserRoleRecord | null>(null);
    const [editUserRoles, setEditUserRoles]   = useState<string[]>([]);
    const [editUserPerms, setEditUserPerms]   = useState<{ key: string; label: string; granted: boolean }[]>([]);
    const [editUserNotes, setEditUserNotes]   = useState("");
    const [showAddUser, setShowAddUser]       = useState(false);
    const [addEmail, setAddEmail]             = useState("");
    const [addLoading, setAddLoading]         = useState(false);
    const [addError, setAddError]             = useState("");
    const [savingUser, setSavingUser]         = useState(false);
    const [saveUserError, setSaveUserError]   = useState("");
    const [userSearch, setUserSearch]         = useState("");

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchDefs = useCallback(async () => {
        setLoadingDefs(true);
        try {
            const res = await fetch("/api/admin/role-definitions");
            const json = await res.json();
            if (json.success && Array.isArray(json.roles)) setRoleDefs(json.roles);
        } catch { /* network error — keep [] */ }
        setLoadingDefs(false);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch("/api/admin/roles?limit=100");
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) setUserRoles(json.data);
        } catch { /* network error — keep [] */ }
        setLoadingUsers(false);
    }, []);

    useEffect(() => { fetchDefs(); fetchUsers(); }, [fetchDefs, fetchUsers]);

    // ── Tab 1 helpers ─────────────────────────────────────────────────────────
    const openRoleDef = (r: RoleDef) => {
        setActiveRole(r);
        setEditPermsSet(new Set(r.permissions));
    };

    const toggleDefPerm = (key: string) => {
        setEditPermsSet(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const saveRoleDef = async () => {
        if (!activeRole) return;
        setSavingDef(true);
        await fetch(`/api/admin/role-definitions/${activeRole.key}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permissions: Array.from(editPermsSet) }),
        });
        setSavingDef(false);
        setActiveRole(null);
        fetchDefs();
    };

    const deleteRoleDef = async () => {
        if (!activeRole || activeRole.isBuiltin) return;
        if (!confirm(`Delete role "${activeRole.label}"? This cannot be undone.`)) return;
        await fetch(`/api/admin/role-definitions/${activeRole.key}`, { method: "DELETE" });
        setActiveRole(null);
        fetchDefs();
    };

    const createRoleDef = async () => {
        if (!newRole.key.trim() || !newRole.label.trim()) return;
        setSavingDef(true);
        await fetch("/api/admin/role-definitions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRole),
        });
        setSavingDef(false);
        setNewRole({ key: "", label: "", description: "", color: PRESET_COLORS[0] });
        setShowCreateRole(false);
        fetchDefs();
    };

    // ── Tab 2 helpers ─────────────────────────────────────────────────────────
    const openUserRecord = (r: UserRoleRecord) => {
        setActiveUser(r);
        setSaveUserError("");
        setEditUserRoles([...r.roles]);
        setEditUserNotes(r.notes ?? "");
        setEditUserPerms(
            PERMISSIONS.map(p => {
                const existing = r.permissions.find(ep => ep.key === p.key);
                return { key: p.key, label: p.label, granted: existing?.granted ?? false };
            })
        );
    };

    const toggleUserRole = (key: string) => {
        setEditUserRoles(prev =>
            prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
        );
    };

    const toggleUserPerm = (key: string) => {
        setEditUserPerms(prev =>
            prev.map(p => p.key === key ? { ...p, granted: !p.granted } : p)
        );
    };

    const saveUserRecord = async () => {
        if (!activeUser) return;
        setSavingUser(true);
        setSaveUserError("");
        try {
            const res = await fetch(`/api/admin/roles/${activeUser.userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roles: editUserRoles.length > 0 ? editUserRoles : ["user"],
                    permissions: editUserPerms.filter(p => p.granted),
                    notes: editUserNotes,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
            setActiveUser(null);
            fetchUsers();
        } catch (e: any) {
            setSaveUserError(e.message || "Save failed");
        }
        setSavingUser(false);
    };

    const deleteUserRecord = async () => {
        if (!activeUser) return;
        if (!confirm("Remove all role assignments for this user?")) return;
        await fetch(`/api/admin/roles/${activeUser.userId}`, { method: "DELETE" });
        setActiveUser(null);
        fetchUsers();
    };

    const addUserByEmail = async () => {
        if (!addEmail.trim()) return;
        setAddLoading(true);
        setAddError("");
        try {
            // Lookup existing BA user
            const lookupRes = await fetch(`/api/admin/users/lookup?email=${encodeURIComponent(addEmail.trim())}`);
            const lookupJson = await lookupRes.json();
            if (!lookupJson.success) throw new Error(lookupJson.error || "User not found");

            const { id, email } = lookupJson.data;
            await fetch("/api/admin/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id, email, roles: ["user"], permissions: [] }),
            });
            setAddEmail("");
            setShowAddUser(false);
            await fetchUsers();
        } catch (e: any) {
            setAddError(e.message);
        }
        setAddLoading(false);
    };

    const filteredDefs  = roleDefs.filter(r => r.label.toLowerCase().includes(defSearch.toLowerCase()) || r.key.toLowerCase().includes(defSearch.toLowerCase()));
    const filteredUsers = userRoles.filter(r => r.email.toLowerCase().includes(userSearch.toLowerCase()));

    const permCats = permissionsByCategory();

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <ManageAccounts style={{ color: palette.accent, fontSize: 32 }} />
                <div>
                    <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                        Roles & Permissions
                    </h1>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Define role bundles and assign them to users.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                {(["definitions", "assignments"] as Tab[]).map(t => (
                    <motion.button
                        key={t}
                        onClick={() => setTab(t)}
                        className="px-5 py-2 rounded-xl text-sm font-bold capitalize"
                        style={{
                            background: tab === t ? (isDark ? "#2c2c30" : "#fff") : "transparent",
                            color: tab === t ? palette.textPrimary : palette.textSecondary,
                            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                        }}
                    >
                        {t === "definitions" ? "Role Definitions" : "User Assignments"}
                    </motion.button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 1 — Role Definitions
            ════════════════════════════════════════════════════════════════════ */}
            {tab === "definitions" && (
                <div>
                    {/* Toolbar */}
                    <div className="flex gap-3 mb-4">
                        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: cardBg, border }}>
                            <Search style={{ color: palette.textSecondary, fontSize: 18 }} />
                            <input
                                value={defSearch}
                                onChange={e => setDefSearch(e.target.value)}
                                placeholder="Search roles…"
                                className="flex-1 bg-transparent outline-none text-sm"
                                style={{ color: palette.textPrimary }}
                            />
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setShowCreateRole(v => !v)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                            style={{ background: palette.accent, color: "#fff" }}
                        >
                            <Add fontSize="small" /> Create Role
                        </motion.button>
                    </div>

                    {/* Create Role Form */}
                    <AnimatePresence>
                        {showCreateRole && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 overflow-hidden"
                            >
                                <div className="p-5 rounded-2xl space-y-3" style={{ background: cardBg, border }}>
                                    <p className="text-sm font-black" style={{ color: palette.textPrimary }}>New Role</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            value={newRole.key}
                                            onChange={e => setNewRole(p => ({ ...p, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                                            placeholder="role_key (slug)"
                                            className="px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}
                                        />
                                        <input
                                            value={newRole.label}
                                            onChange={e => setNewRole(p => ({ ...p, label: e.target.value }))}
                                            placeholder="Display Label"
                                            className="px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}
                                        />
                                    </div>
                                    <input
                                        value={newRole.description}
                                        onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Description (optional)"
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}
                                    />
                                    <div>
                                        <p className="text-xs mb-2" style={{ color: palette.textSecondary }}>Color</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNewRole(p => ({ ...p, color: c }))}
                                                    className="w-7 h-7 rounded-full border-2 transition-all"
                                                    style={{ background: c, borderColor: newRole.color === c ? "#fff" : "transparent" }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button onClick={() => setShowCreateRole(false)} className="px-4 py-1.5 rounded-xl text-sm font-bold" style={{ color: palette.textSecondary }}>Cancel</button>
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={createRoleDef}
                                            disabled={savingDef || !newRole.key || !newRole.label}
                                            className="px-4 py-1.5 rounded-xl text-sm font-bold"
                                            style={{ background: palette.accent, color: "#fff", opacity: (!newRole.key || !newRole.label) ? 0.5 : 1 }}
                                        >
                                            {savingDef ? "Creating…" : "Create"}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Role Cards */}
                    {loadingDefs ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredDefs.map(role => (
                                <motion.button
                                    key={role._id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => openRoleDef(role)}
                                    className="text-left p-5 rounded-2xl group transition-all"
                                    style={{ background: cardBg, border, borderRadius: br }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <Circle style={{ color: role.color, fontSize: 12 }} />
                                            <div>
                                                <p className="font-black text-sm" style={{ color: palette.textPrimary }}>{role.label}</p>
                                                <p className="text-xs font-mono opacity-60 mt-0.5" style={{ color: palette.textSecondary }}>{role.key}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {role.isBuiltin && (
                                                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                                    Built-in
                                                </span>
                                            )}
                                            <span className="text-xs" style={{ color: palette.textTertiary }}>
                                                {role.permissions.length} perm{role.permissions.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>
                                    {role.description && (
                                        <p className="text-xs mt-2 line-clamp-2" style={{ color: palette.textSecondary }}>{role.description}</p>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 2 — User Assignments
            ════════════════════════════════════════════════════════════════════ */}
            {tab === "assignments" && (
                <div>
                    {/* Toolbar */}
                    <div className="flex gap-3 mb-4">
                        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: cardBg, border }}>
                            <Search style={{ color: palette.textSecondary, fontSize: 18 }} />
                            <input
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder="Filter by email…"
                                className="flex-1 bg-transparent outline-none text-sm"
                                style={{ color: palette.textPrimary }}
                            />
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => { setShowAddUser(v => !v); setAddError(""); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                            style={{ background: palette.accent, color: "#fff" }}
                        >
                            <PersonAdd fontSize="small" /> Add User
                        </motion.button>
                    </div>

                    {/* Add User Form */}
                    <AnimatePresence>
                        {showAddUser && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 overflow-hidden"
                            >
                                <div className="p-4 rounded-2xl space-y-2" style={{ background: cardBg, border }}>
                                    <p className="text-sm font-black" style={{ color: palette.textPrimary }}>Add user by email</p>
                                    <div className="flex gap-2">
                                        <input
                                            value={addEmail}
                                            onChange={e => setAddEmail(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && addUserByEmail()}
                                            placeholder="user@example.com"
                                            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}
                                        />
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={addUserByEmail}
                                            disabled={addLoading}
                                            className="px-4 py-2 rounded-xl text-sm font-bold"
                                            style={{ background: palette.accent, color: "#fff" }}
                                        >
                                            {addLoading ? "Looking up…" : "Add"}
                                        </motion.button>
                                    </div>
                                    {addError && <p className="text-xs" style={{ color: "#ef4444" }}>{addError}</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* User List */}
                    {loadingUsers ? (
                        <div className="space-y-3">
                            {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />)}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map(record => {
                                const resolvedRoles = roleDefs.filter(rd => record.roles.includes(rd.key));
                                return (
                                    <motion.div
                                        key={record._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                                        style={{ background: cardBg, border, borderRadius: br }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate" style={{ color: palette.textPrimary }}>{record.email}</p>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {resolvedRoles.length === 0
                                                    ? <span className="text-xs" style={{ color: palette.textTertiary }}>No roles assigned</span>
                                                    : resolvedRoles.map(rd => (
                                                        <span key={rd.key} className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: `${rd.color}22`, color: rd.color }}>
                                                            {rd.label}
                                                        </span>
                                                    ))}
                                                {record.roles.filter(r => !roleDefs.find(rd => rd.key === r)).map(r => (
                                                    <span key={r} className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}>
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openUserRecord(record)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold"
                                            style={{ background: `${palette.accent}18`, color: palette.accent }}
                                        >
                                            Edit
                                        </button>
                                    </motion.div>
                                );
                            })}

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-16" style={{ color: palette.textSecondary }}>
                                    No user assignments found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                DRAWER — Role Definition
            ════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {activeRole && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setActiveRole(null)} />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{ background: drawerBg }}
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <Circle style={{ color: activeRole.color, fontSize: 14 }} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-base leading-tight" style={{ color: palette.textPrimary }}>{activeRole.label}</p>
                                    <p className="text-xs font-mono opacity-50 mt-0.5" style={{ color: palette.textSecondary }}>{activeRole.key}</p>
                                </div>
                                {activeRole.isBuiltin && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: `${palette.accent}18`, color: palette.accent }}>Built-in</span>
                                )}
                                <button onClick={() => setActiveRole(null)}><Close style={{ color: palette.textSecondary }} /></button>
                            </div>

                            {/* Permissions by category */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textTertiary }}>
                                    Permissions — {editPermsSet.size} selected
                                </p>
                                {Object.entries(permCats).map(([catKey, perms]) => {
                                    const catMeta = PERMISSION_CATEGORIES[catKey];
                                    return (
                                        <div key={catKey}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-2 h-2 rounded-full" style={{ background: catMeta.color }} />
                                                <p className="text-xs font-black uppercase tracking-wider" style={{ color: catMeta.color }}>{catMeta.label}</p>
                                            </div>
                                            <div className="space-y-1">
                                                {perms.map((p: PermissionDef) => {
                                                    const on = editPermsSet.has(p.key);
                                                    return (
                                                        <motion.button
                                                            key={p.key}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => toggleDefPerm(p.key)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left"
                                                            style={{
                                                                background: on ? `${catMeta.color}15` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                                                color: on ? catMeta.color : palette.textSecondary,
                                                            }}
                                                        >
                                                            {on
                                                                ? <CheckBox fontSize="small" style={{ color: catMeta.color, flexShrink: 0 }} />
                                                                : <CheckBoxOutlineBlank fontSize="small" style={{ color: palette.textTertiary, flexShrink: 0 }} />}
                                                            <span className="flex-1 font-medium">{p.label}</span>
                                                            <span className="text-xs font-mono opacity-40">{p.key}</span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 pt-3 space-y-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={saveRoleDef}
                                    disabled={savingDef}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{ background: palette.accent, color: "#fff" }}
                                >
                                    <Save fontSize="small" /> {savingDef ? "Saving…" : "Save Permissions"}
                                </motion.button>
                                {!activeRole.isBuiltin && (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={deleteRoleDef}
                                        className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                                        style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}
                                    >
                                        <Delete fontSize="small" /> Delete Role
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════════
                DRAWER — User Assignment
            ════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {activeUser && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setActiveUser(null)} />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{ background: drawerBg }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <div>
                                    <p className="font-black text-base" style={{ color: palette.textPrimary }}>Edit User</p>
                                    <p className="text-xs opacity-50 mt-0.5" style={{ color: palette.textSecondary }}>{activeUser.email}</p>
                                </div>
                                <button onClick={() => setActiveUser(null)}><Close style={{ color: palette.textSecondary }} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Role Assignment */}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: palette.textTertiary }}>Assigned Roles</p>
                                    {roleDefs.length === 0
                                        ? <p className="text-sm" style={{ color: palette.textSecondary }}>No roles defined yet.</p>
                                        : (
                                            <div className="space-y-1">
                                                {roleDefs.map(rd => {
                                                    const on = editUserRoles.includes(rd.key);
                                                    return (
                                                        <motion.button
                                                            key={rd.key}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => toggleUserRole(rd.key)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left"
                                                            style={{
                                                                background: on ? `${rd.color}18` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                                            }}
                                                        >
                                                            {on
                                                                ? <CheckBox fontSize="small" style={{ color: rd.color, flexShrink: 0 }} />
                                                                : <CheckBoxOutlineBlank fontSize="small" style={{ color: palette.textTertiary, flexShrink: 0 }} />}
                                                            <Circle style={{ color: rd.color, fontSize: 10, flexShrink: 0 }} />
                                                            <span className="flex-1 font-medium" style={{ color: on ? rd.color : palette.textSecondary }}>{rd.label}</span>
                                                            <span className="text-xs opacity-40 font-mono" style={{ color: palette.textSecondary }}>{rd.permissions.length}p</span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                </div>

                                {/* Per-user Permission Overrides */}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: palette.textTertiary }}>Per-user Overrides</p>
                                    <p className="text-xs mb-3" style={{ color: palette.textSecondary }}>Grant extra permissions beyond what the roles provide.</p>
                                    {Object.entries(permCats).map(([catKey, perms]) => (
                                        <PermCategoryRow
                                            key={catKey}
                                            catKey={catKey}
                                            perms={perms as PermissionDef[]}
                                            editUserPerms={editUserPerms}
                                            toggleUserPerm={toggleUserPerm}
                                            isDark={isDark}
                                            palette={palette}
                                        />
                                    ))}
                                </div>

                                {/* Notes */}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>Admin Notes</p>
                                    <textarea
                                        value={editUserNotes}
                                        onChange={e => setEditUserNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Internal notes about this user's access…"
                                        className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                                        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 pt-3 space-y-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                {saveUserError && (
                                    <p className="text-xs px-3 py-2 rounded-xl font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                        {saveUserError}
                                    </p>
                                )}
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={saveUserRecord}
                                    disabled={savingUser}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{ background: palette.accent, color: "#fff" }}
                                >
                                    <Save fontSize="small" /> {savingUser ? "Saving…" : "Save Changes"}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={deleteUserRecord}
                                    className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                                    style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}
                                >
                                    <Delete fontSize="small" /> Remove User
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
