/**
 * Admin — Roles & Permissions Manager
 * Grant/revoke roles (employee, paid_customer, custom) and fine-grained permissions per user.
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
} from "@mui/icons-material";

interface UserRole {
    _id: string;
    userId: string;
    email: string;
    roles: string[];
    permissions: { key: string; label: string; granted: boolean }[];
    notes?: string;
}

const BUILTIN_ROLES = ["employee", "paid_customer"];
const PERMISSION_PRESETS = [
    { key: "tickets.manage", label: "Manage Tickets" },
    { key: "tickets.assign", label: "Assign Tickets" },
    { key: "orders.view", label: "View All Orders" },
    { key: "orders.update", label: "Update Order Status" },
    { key: "refunds.review", label: "Review Refunds" },
    { key: "faq.manage", label: "Manage FAQ" },
    { key: "products.manage", label: "Manage Products" },
];

export default function AdminRolesPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [records, setRecords] = useState<UserRole[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [editTarget, setEditTarget] = useState<UserRole | null>(null);
    const [editRoles, setEditRoles] = useState<string[]>([]);
    const [editPerms, setEditPerms] = useState<{ key: string; label: string; granted: boolean }[]>([]);
    const [editNotes, setEditNotes] = useState("");
    const [showNewForm, setShowNewForm] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [saving, setSaving] = useState(false);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 16 : 20;

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/admin/roles");
        const json = await res.json();
        if (json.success) setRecords(json.data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const filtered = records.filter(r =>
        r.email.toLowerCase().includes(search.toLowerCase())
    );

    const openEdit = (r: UserRole) => {
        setEditTarget(r);
        setEditRoles([...r.roles]);
        setEditNotes(r.notes ?? "");
        const merged = PERMISSION_PRESETS.map(p => {
            const existing = r.permissions.find(ep => ep.key === p.key);
            return { key: p.key, label: p.label, granted: existing?.granted ?? false };
        });
        setEditPerms(merged);
    };

    const toggleRole = (role: string) => {
        setEditRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const togglePerm = (key: string) => {
        setEditPerms(prev =>
            prev.map(p => p.key === key ? { ...p, granted: !p.granted } : p)
        );
    };

    const saveEdit = async () => {
        if (!editTarget) return;
        setSaving(true);
        await fetch(`/api/admin/roles/${editTarget.userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roles: editRoles, permissions: editPerms, notes: editNotes }),
        });
        setSaving(false);
        setEditTarget(null);
        fetchRoles();
    };

    const deleteRole = async (userId: string) => {
        if (!confirm("Remove all custom roles for this user?")) return;
        await fetch(`/api/admin/roles/${userId}`, { method: "DELETE" });
        fetchRoles();
    };

    const createNew = async () => {
        if (!newEmail.trim()) return;
        setSaving(true);
        await fetch("/api/admin/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: newEmail.trim(), roles: [] }),
        });
        setSaving(false);
        setNewEmail("");
        setShowNewForm(false);
        fetchRoles();
    };

    const roleChip = (label: string, active: boolean, onClick?: () => void) => (
        <motion.button
            key={label}
            whileTap={{ scale: 0.94 }}
            onClick={onClick}
            className="px-3 py-1 rounded-full text-xs font-bold cursor-pointer"
            style={{
                background: active ? `${palette.accent}22` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                color: active ? palette.accent : palette.textSecondary,
                border: `1px solid ${active ? palette.accent + "44" : "transparent"}`,
            }}
        >
            {label}
        </motion.button>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ManageAccounts style={{ color: palette.accent, fontSize: 32 }} />
                    <div>
                        <h1 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>
                            Roles & Permissions
                        </h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Assign roles and fine-grained permissions to users.
                        </p>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowNewForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: palette.accent, color: "#fff" }}
                >
                    <PersonAdd fontSize="small" /> Add User
                </motion.button>
            </div>

            {/* New user form */}
            <AnimatePresence>
                {showNewForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="flex gap-3 p-4 rounded-2xl" style={{ background: cardBg, border }}>
                            <input
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="flex-1 bg-transparent outline-none text-sm"
                                style={{ color: palette.textPrimary }}
                                onKeyDown={e => e.key === "Enter" && createNew()}
                            />
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={createNew}
                                disabled={saving}
                                className="px-4 py-1.5 rounded-xl font-bold text-sm"
                                style={{ background: palette.accent, color: "#fff" }}
                            >
                                Create
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search */}
            <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-4"
                style={{ background: cardBg, border }}
            >
                <Search style={{ color: palette.textSecondary, fontSize: 18 }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter by email…"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: palette.textPrimary }}
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(r => (
                        <motion.div
                            key={r._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                            style={{ background: cardBg, border, borderRadius: br }}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate" style={{ color: palette.textPrimary }}>{r.email}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {r.roles.length === 0
                                        ? <span className="text-xs" style={{ color: palette.textTertiary }}>No special roles</span>
                                        : r.roles.map(role => roleChip(role, true))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => openEdit(r)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                                    style={{ background: `${palette.accent}16`, color: palette.accent }}
                                >
                                    Edit
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => deleteRole(r.userId)}
                                    className="p-1.5 rounded-xl"
                                    style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}
                                >
                                    <Delete fontSize="small" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-16" style={{ color: palette.textSecondary }}>
                            No role records found.
                        </div>
                    )}
                </div>
            )}

            {/* Edit Drawer */}
            <AnimatePresence>
                {editTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-40"
                            onClick={() => setEditTarget(null)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
                            style={{ background: isDark ? "#1c1c20" : "#f5f5f8" }}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <h2 className="font-black text-lg" style={{ color: palette.textPrimary }}>Edit Roles</h2>
                                <button onClick={() => setEditTarget(null)}><Close style={{ color: palette.textSecondary }} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <p className="text-sm font-bold mb-1" style={{ color: palette.textPrimary }}>{editTarget.email}</p>
                                </div>

                                {/* Roles */}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: palette.textTertiary }}>Roles</p>
                                    <div className="flex flex-wrap gap-2">
                                        {BUILTIN_ROLES.map(role => (
                                            <motion.button
                                                key={role}
                                                whileTap={{ scale: 0.94 }}
                                                onClick={() => toggleRole(role)}
                                                className="px-4 py-2 rounded-xl text-sm font-bold"
                                                style={{
                                                    background: editRoles.includes(role) ? `${palette.accent}22` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                    color: editRoles.includes(role) ? palette.accent : palette.textSecondary,
                                                    border: `1px solid ${editRoles.includes(role) ? palette.accent + "44" : "transparent"}`,
                                                }}
                                            >
                                                {editRoles.includes(role) ? <CheckBox fontSize="small" style={{ verticalAlign: "middle", marginRight: 4 }} /> : <CheckBoxOutlineBlank fontSize="small" style={{ verticalAlign: "middle", marginRight: 4 }} />}
                                                {role}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: palette.textTertiary }}>Permissions</p>
                                    <div className="space-y-2">
                                        {editPerms.map(p => (
                                            <motion.button
                                                key={p.key}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => togglePerm(p.key)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
                                                style={{
                                                    background: p.granted ? `${palette.accent}12` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                                    color: p.granted ? palette.accent : palette.textSecondary,
                                                }}
                                            >
                                                {p.granted
                                                    ? <CheckBox fontSize="small" style={{ color: palette.accent }} />
                                                    : <CheckBoxOutlineBlank fontSize="small" style={{ color: palette.textTertiary }} />}
                                                <span className="flex-1 text-left">{p.label}</span>
                                                <span className="text-xs opacity-50 font-mono">{p.key}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: palette.textTertiary }}>Admin Notes</p>
                                    <textarea
                                        value={editNotes}
                                        onChange={e => setEditNotes(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                            color: palette.textPrimary,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="px-6 pb-6 pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={saveEdit}
                                    disabled={saving}
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    style={{ background: palette.accent, color: "#fff" }}
                                >
                                    <Save fontSize="small" /> {saving ? "Saving…" : "Save Changes"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
