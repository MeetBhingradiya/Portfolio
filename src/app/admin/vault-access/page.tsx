/**
 * Admin — Vault Access Management
 * /admin/vault-access
 *
 * Grant or revoke per-user access to the Private Vault feature,
 * and configure storage limits.
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Add,
    Delete,
    Edit,
    Check,
    Close,
    Search,
    Refresh,
    Lock,
    ToggleOn,
    ToggleOff,
    Storage,
    Warning,
    CheckCircle
} from "@mui/icons-material";
import Image from "next/image";

const ACCENT = "#6366F1";
const DEFAULT_LIMIT_MB = 500;

interface VaultEntry {
    _id: string;
    userId: string;
    email: string;
    label: string;
    note?: string;
    enabled: boolean;
    storageLimitBytes: number;
    grantedBy: string;
    grantedAt: string;
    lastActivity?: string;
    fileCount: number;
    usedBytes: number;
    account?: {
        _id: string;
        name?: string;
        email?: string;
        image?: string;
        googleAvatar?: string;
        githubAvatar?: string;
        microsoftAvatar?: string;
    } | null;
}

interface BAUser {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    googleAvatar?: string;
    githubAvatar?: string;
    microsoftAvatar?: string;
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function VaultAccessPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [entries, setEntries] = useState<VaultEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    // Add form state
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({
        email: "",
        label: "",
        note: "",
        limitMb: DEFAULT_LIMIT_MB,
        saving: false,
        error: "",
        selectedUser: null as BAUser | null
    });

    // User suggestions
    const [userSearch, setUserSearch] = useState("");
    const [userLoading, setUserLoading] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState<BAUser[]>([]);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Edit state
    const [editId, setEditId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ label: "", note: "", limitMb: DEFAULT_LIMIT_MB, saving: false });

    const card = {
        background: isApple ? (isDark ? "rgba(38,38,42,0.7)" : "rgba(255,255,255,0.7)") : palette.surface,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
    };

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const r = await fetch("/api/admin/vault-access");
            const j = await r.json();
            if (j.success) setEntries(j.data);
            else setError(j.error || "Failed to load");
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const searchUsers = useCallback((query: string) => {
        setUserSearch(query);
        if (searchTimer.current) clearTimeout(searchTimer.current);

        if (!query.trim()) {
            setUserSuggestions([]);
            setUserLoading(false);
            return;
        }

        searchTimer.current = setTimeout(async () => {
            try {
                setUserLoading(true);
                const r = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=8`);
                const j = await r.json();
                setUserSuggestions(j.data ?? []);
            } catch {
                setUserSuggestions([]);
            } finally {
                setUserLoading(false);
                searchTimer.current = null;
            }
        }, 250);
    }, []);

    useEffect(() => {
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, []);

    async function handleGrant() {
        const { email, label, limitMb } = addForm;
        if (!email || !label) {
            setAddForm((p) => ({ ...p, error: "Email and label are required" }));
            return;
        }
        setAddForm((p) => ({ ...p, saving: true, error: "" }));
        const r = await fetch("/api/admin/vault-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                label,
                note: addForm.note,
                storageLimitBytes: limitMb * 1024 * 1024,
                enabled: true
            })
        });
        const j = await r.json();
        setAddForm((p) => ({ ...p, saving: false }));
        if (j.success) {
            showToast("Access granted");
            setShowAdd(false);
            setAddForm({ email: "", label: "", note: "", limitMb: DEFAULT_LIMIT_MB, saving: false, error: "", selectedUser: null });
            setUserSearch("");
            setUserSuggestions([]);
            fetchEntries();
        } else {
            setAddForm((p) => ({ ...p, error: j.error || "Failed to grant access" }));
        }
    }

    async function handleToggle(entry: VaultEntry) {
        const r = await fetch(`/api/admin/vault-access/${entry._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: !entry.enabled })
        });
        if (r.ok) {
            showToast(entry.enabled ? "Access disabled" : "Access enabled");
            fetchEntries();
        } else {
            showToast("Failed to update", false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Revoke vault access for this user?")) return;
        const r = await fetch(`/api/admin/vault-access/${id}`, { method: "DELETE" });
        if (r.ok) { showToast("Access revoked"); fetchEntries(); }
        else showToast("Failed to revoke", false);
    }

    async function handleSaveEdit(id: string) {
        setEditForm((p) => ({ ...p, saving: true }));
        const r = await fetch(`/api/admin/vault-access/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                label: editForm.label,
                note: editForm.note,
                storageLimitBytes: editForm.limitMb * 1024 * 1024
            })
        });
        setEditForm((p) => ({ ...p, saving: false }));
        if (r.ok) { showToast("Updated"); setEditId(null); fetchEntries(); }
        else showToast("Failed to update", false);
    }

    const filtered = entries.filter((e) => {
        const q = search.toLowerCase();
        return (
            !q ||
            e.email.toLowerCase().includes(q) ||
            e.label.toLowerCase().includes(q) ||
            e.account?.name?.toLowerCase().includes(q)
        );
    });

    return (
        <div
            className="p-6 md:p-8 max-w-5xl mx-auto"
            style={{ color: palette.textPrimary }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-xl"
                        style={{ background: `${ACCENT}18` }}>
                        <Lock style={{ color: ACCENT, fontSize: 24 }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>
                            Vault Access
                        </h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Manage who can use the Private Vault and their storage limits
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        className="p-2 rounded-xl"
                        style={card}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchEntries}
                        title="Refresh">
                        <Refresh fontSize="small" style={{ color: palette.textSecondary }} />
                    </motion.button>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: ACCENT, color: "#fff" }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowAdd(true)}>
                        <Add fontSize="small" />
                        Grant Access
                    </motion.button>
                </div>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total Users", value: entries.length },
                    { label: "Active", value: entries.filter((e) => e.enabled).length },
                    { label: "Total Files", value: entries.reduce((s, e) => s + e.fileCount, 0) }
                ].map((s) => (
                    <div
                        key={s.label}
                        className="p-4 rounded-2xl"
                        style={card}>
                        <p className="text-2xl font-bold" style={{ color: ACCENT }}>{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5"
                style={card}>
                <Search fontSize="small" style={{ color: palette.textTertiary }} />
                <input
                    type="text"
                    placeholder="Search by email or name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: palette.textPrimary }}
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>
                    <Warning fontSize="small" />{error}
                </div>
            )}

            {/* Entries list */}
            {loading ? (
                <div className="text-center py-12" style={{ color: palette.textTertiary }}>Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <Lock style={{ fontSize: 48, color: palette.textTertiary, marginBottom: 8 }} />
                    <p style={{ color: palette.textSecondary }}>No vault access entries yet</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((entry) => {
                        const pct = Math.min(100, (entry.usedBytes / entry.storageLimitBytes) * 100);
                        const barColor = pct > 90 ? "#EF4444" : pct > 70 ? "#F59E0B" : ACCENT;
                        const isEditing = editId === entry._id;

                        return (
                            <motion.div
                                key={entry._id}
                                className="p-4 rounded-2xl"
                                style={{ ...card, opacity: entry.enabled ? 1 : 0.6 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: entry.enabled ? 1 : 0.6 }}>
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: `${ACCENT}18` }}>
                                        {entry.account?.image || entry.account?.googleAvatar || entry.account?.githubAvatar || entry.account?.microsoftAvatar ? (
                                            <Image
                                                src={entry.account.image || entry.account.googleAvatar || entry.account.githubAvatar || entry.account.microsoftAvatar || ""}
                                                alt={entry.account?.name || entry.label}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold" style={{ color: ACCENT }}>
                                                {(entry.account?.name || entry.label || entry.email || "?").charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                                                    style={{
                                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                                        color: palette.textPrimary,
                                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`
                                                    }}
                                                    value={editForm.label}
                                                    onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))}
                                                    placeholder="Label"
                                                />
                                                <input
                                                    className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                                                    style={{
                                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                                        color: palette.textPrimary,
                                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`
                                                    }}
                                                    value={editForm.note}
                                                    onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
                                                    placeholder="Note (optional)"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Storage fontSize="small" style={{ color: palette.textTertiary }} />
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="w-28 px-3 py-1.5 rounded-lg text-sm outline-none"
                                                        style={{
                                                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                                            color: palette.textPrimary,
                                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`
                                                        }}
                                                        value={editForm.limitMb}
                                                        onChange={(e) => setEditForm((p) => ({ ...p, limitMb: Number(e.target.value) }))}
                                                    />
                                                    <span className="text-xs" style={{ color: palette.textSecondary }}>MB</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                        style={{ background: `${ACCENT}18`, color: ACCENT }}
                                                        whileHover={{ scale: 1.04 }}
                                                        disabled={editForm.saving}
                                                        onClick={() => handleSaveEdit(entry._id)}>
                                                        <Check fontSize="small" />
                                                        {editForm.saving ? "Saving…" : "Save"}
                                                    </motion.button>
                                                    <motion.button
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                                                        style={{ color: palette.textTertiary }}
                                                        whileHover={{ scale: 1.04 }}
                                                        onClick={() => setEditId(null)}>
                                                        <Close fontSize="small" />
                                                        Cancel
                                                    </motion.button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-sm" style={{ color: palette.textPrimary }}>
                                                        {entry.label}
                                                    </p>
                                                    <span
                                                        className="px-2 py-0.5 text-xs rounded-full"
                                                        style={{
                                                            background: entry.enabled ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                                            color: entry.enabled ? "#16a34a" : "#EF4444"
                                                        }}>
                                                        {entry.enabled ? "Active" : "Disabled"}
                                                    </span>
                                                </div>
                                                <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                                                    {entry.account?.email || entry.email}
                                                </p>
                                                {entry.note && (
                                                    <p className="text-xs mt-1 italic" style={{ color: palette.textTertiary }}>
                                                        {entry.note}
                                                    </p>
                                                )}
                                                {/* Storage bar */}
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs mb-1" style={{ color: palette.textTertiary }}>
                                                        <span>{formatBytes(entry.usedBytes)} · {entry.fileCount} file{entry.fileCount !== 1 ? "s" : ""}</span>
                                                        <span>Limit: {formatBytes(entry.storageLimitBytes)}</span>
                                                    </div>
                                                    <div
                                                        className="h-1.5 rounded-full overflow-hidden"
                                                        style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%`, background: barColor }}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {!isEditing && (
                                        <div className="flex gap-1 shrink-0">
                                            <motion.button
                                                className="p-1.5 rounded-lg"
                                                style={{ color: palette.textTertiary }}
                                                whileHover={{ scale: 1.1, color: entry.enabled ? "#F59E0B" : "#16a34a" }}
                                                whileTap={{ scale: 0.9 }}
                                                title={entry.enabled ? "Disable access" : "Enable access"}
                                                onClick={() => handleToggle(entry)}>
                                                {entry.enabled ? <ToggleOn /> : <ToggleOff />}
                                            </motion.button>
                                            <motion.button
                                                className="p-1.5 rounded-lg"
                                                style={{ color: palette.textTertiary }}
                                                whileHover={{ scale: 1.1, color: ACCENT }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Edit"
                                                onClick={() => {
                                                    setEditId(entry._id);
                                                    setEditForm({
                                                        label: entry.label,
                                                        note: entry.note ?? "",
                                                        limitMb: Math.round(entry.storageLimitBytes / (1024 * 1024)),
                                                        saving: false
                                                    });
                                                }}>
                                                <Edit fontSize="small" />
                                            </motion.button>
                                            <motion.button
                                                className="p-1.5 rounded-lg"
                                                style={{ color: palette.textTertiary }}
                                                whileHover={{ scale: 1.1, color: "#EF4444" }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Revoke access"
                                                onClick={() => handleDelete(entry._id)}>
                                                <Delete fontSize="small" />
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Grant access modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAdd(false)}>
                        <motion.div
                            className="p-6 rounded-2xl w-full max-w-md"
                            style={card}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-lg" style={{ color: palette.textPrimary }}>
                                    Grant Vault Access
                                </h2>
                                <motion.button
                                    className="p-1.5 rounded-lg"
                                    style={{ color: palette.textTertiary }}
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => setShowAdd(false)}>
                                    <Close fontSize="small" />
                                </motion.button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {/* User search */}
                                <div className="relative">
                                    <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
                                        style={{ color: palette.textSecondary }}>
                                        Search User
                                    </label>
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => searchUsers(e.target.value)}
                                        placeholder="Type name or email…"
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                            color: palette.textPrimary,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                        }}
                                    />
                                    {(userLoading || userSuggestions.length > 0) && (
                                        <div
                                            className="absolute left-0 right-0 mt-1 rounded-xl z-10 overflow-hidden shadow-xl"
                                            style={card}>
                                            {userLoading && (
                                                <div className="px-3 py-2 text-xs" style={{ color: palette.textTertiary }}>
                                                    Searching accounts…
                                                </div>
                                            )}
                                            {userSuggestions.map((u) => (
                                                <button
                                                    key={u._id}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:opacity-80"
                                                    style={{ color: palette.textPrimary }}
                                                    onClick={() => {
                                                        setAddForm((p) => ({
                                                            ...p,
                                                            email: u.email ?? "",
                                                            label: u.name ?? u.email ?? "",
                                                            selectedUser: u
                                                        }));
                                                        setUserSearch(u.email ?? "");
                                                        setUserSuggestions([]);
                                                    }}>
                                                    <span className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: `${ACCENT}20` }}>
                                                        {u.image || u.googleAvatar || u.githubAvatar || u.microsoftAvatar ? (
                                                            <Image
                                                                src={u.image || u.googleAvatar || u.githubAvatar || u.microsoftAvatar || ""}
                                                                alt={u.name || u.email || "user"}
                                                                width={28}
                                                                height={28}
                                                                className="w-7 h-7 object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-semibold" style={{ color: ACCENT }}>
                                                                {(u.name || u.email || "?").charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span>{u.name ?? u.email}</span>
                                                    {u.name && (
                                                        <span className="text-xs ml-auto" style={{ color: palette.textTertiary }}>
                                                            {u.email}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {addForm.selectedUser && (
                                    <div className="text-xs px-3 py-2 rounded-xl" style={{ background: `${ACCENT}12`, color: palette.textSecondary }}>
                                        Selected account: <span style={{ color: palette.textPrimary }}>{addForm.selectedUser.name || addForm.selectedUser.email}</span>
                                    </div>
                                )}

                                {/* Manual fields */}
                                {[
                                    { key: "email", label: "Email", placeholder: "user@example.com" },
                                    { key: "label", label: "Label / Name", placeholder: "Friendly display name" },
                                    { key: "note", label: "Note (optional)", placeholder: "Admin note" }
                                ].map(({ key, label, placeholder }) => (
                                    <div key={key}>
                                        <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
                                            style={{ color: palette.textSecondary }}>
                                            {label}
                                        </label>
                                        <input
                                            type="text"
                                            value={(addForm as any)[key]}
                                            onChange={(e) => setAddForm((p) => ({ ...p, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                            }}
                                        />
                                    </div>
                                ))}

                                {/* Limit */}
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
                                        style={{ color: palette.textSecondary }}>
                                        Storage Limit (MB)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={10240}
                                            value={addForm.limitMb}
                                            onChange={(e) => setAddForm((p) => ({ ...p, limitMb: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                                            }}
                                        />
                                        <div className="flex gap-1">
                                            {[500, 1024, 2048].map((mb) => (
                                                <motion.button
                                                    key={mb}
                                                    className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                                                    style={{
                                                        background: addForm.limitMb === mb ? `${ACCENT}20` : "transparent",
                                                        color: addForm.limitMb === mb ? ACCENT : palette.textTertiary,
                                                        border: `1px solid ${addForm.limitMb === mb ? ACCENT : "transparent"}`
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    onClick={() => setAddForm((p) => ({ ...p, limitMb: mb }))}>
                                                    {mb === 1024 ? "1 GB" : mb === 2048 ? "2 GB" : "500 MB"}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {addForm.error && (
                                    <p className="text-xs text-red-500">{addForm.error}</p>
                                )}

                                <motion.button
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2"
                                    style={{ background: ACCENT, color: "#fff" }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={addForm.saving}
                                    onClick={handleGrant}>
                                    {addForm.saving ? "Granting…" : "Grant Access"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold"
                        style={{ background: toast.ok ? "#16a34a" : "#EF4444", color: "#fff" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}>
                        {toast.ok ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
