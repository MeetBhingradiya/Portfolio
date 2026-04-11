/**
 * Admin - Immich Access Control
 * /admin/immich-access
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    AccessTime,
    Add,
    Check,
    Close,
    ContentCopy,
    Delete,
    Edit,
    Email,
    Info,
    Key,
    Link as LinkIcon,
    PhotoCamera,
    Refresh,
    Search,
    ToggleOff,
    ToggleOn
} from "@mui/icons-material";
import Image from "next/image";

interface BAUser {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    emailVerified?: boolean;
}

interface WhitelistEntry {
    _id: string;
    email: string;
    label: string;
    note?: string;
    enabled: boolean;
    addedBy: string;
    addedAt: string;
    lastAccess?: string;
    accessCount: number;
    userId?: string;
    linkedAccount: boolean;
    subOverride?: string;
    lastIssuedSub?: string;
    account?: {
        _id: string;
        name?: string;
        image?: string;
        email?: string;
        emailVerified?: boolean;
        googleAvatar?: string;
        githubAvatar?: string;
        microsoftAvatar?: string;
    } | null;
}

const ISSUER_PATH = "/api/immich-sso";

export default function ImmichAccessPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [list, setList] = useState({
        entries: [] as WhitelistEntry[],
        search: "",
        loading: false,
        error: "",
        success: "",
        deleteConfirm: null as string | null
    });
    const patchList = useCallback((p: Partial<typeof list>) => setList((s) => ({ ...s, ...p })), []);

    const [addModal, setAddModal] = useState({
        open: false,
        loading: false,
        accountSearch: "",
        accountResults: [] as BAUser[],
        accountLoading: false,
        selectedUser: null as BAUser | null,
        email: "",
        label: "",
        note: ""
    });
    const patchAdd = useCallback((p: Partial<typeof addModal>) => setAddModal((s) => ({ ...s, ...p })), []);

    const [editModal, setEditModal] = useState({
        id: null as string | null,
        label: "",
        note: "",
        subOverride: ""
    });
    const patchEdit = useCallback((p: Partial<typeof editModal>) => setEditModal((s) => ({ ...s, ...p })), []);

    const [setup, setSetup] = useState({
        open: false,
        key: "",
        loading: false
    });
    const patchSetup = useCallback((p: Partial<typeof setup>) => setSetup((s) => ({ ...s, ...p })), []);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cardBg = isApple
        ? isDark
            ? "linear-gradient(150deg, rgba(35,35,40,0.85), rgba(22,22,26,0.80))"
            : "linear-gradient(150deg, rgba(255,255,255,0.88), rgba(245,247,250,0.82))"
        : isDark
          ? "linear-gradient(180deg, rgba(27,27,33,0.98), rgba(18,18,22,0.98))"
          : "linear-gradient(180deg, #ffffff, #f7f8fb)";
    const shellBg = isDark
        ? `radial-gradient(1200px 420px at 5% -10%, ${palette.accent}20, transparent 60%), radial-gradient(900px 300px at 100% 0%, rgba(69,130,255,0.12), transparent 60%), ${palette.background}`
        : `radial-gradient(1200px 420px at 5% -10%, ${palette.accent}16, transparent 60%), radial-gradient(900px 300px at 100% 0%, rgba(69,130,255,0.08), transparent 60%), ${palette.background}`;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

    const flash = (msg: string, isError = false) => {
        if (isError) {
            patchList({ error: msg, success: "" });
            setTimeout(() => patchList({ error: "" }), 4000);
        } else {
            patchList({ success: msg, error: "" });
            setTimeout(() => patchList({ success: "" }), 3000);
        }
    };

    const resetAdd = () => {
        patchAdd({
            accountSearch: "",
            accountResults: [],
            selectedUser: null,
            email: "",
            label: "",
            note: ""
        });
    };

    const fetchEntries = useCallback(async () => {
        patchList({ loading: true });
        try {
            const res = await fetch(`/api/admin/immich-whitelist?search=${encodeURIComponent(list.search)}`);
            const json = await res.json();
            if (json.success) patchList({ entries: json.data });
            else flash(json.error || "Failed to load", true);
        } catch {
            flash("Network error", true);
        } finally {
            patchList({ loading: false });
        }
    }, [list.search]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const searchAccounts = (q: string) => {
        patchAdd({ accountSearch: q });
        if (searchTimer.current) clearTimeout(searchTimer.current);

        if (!q.trim()) {
            patchAdd({
                accountResults: [],
                accountLoading: false,
                selectedUser: null
            });
            return;
        }

        searchTimer.current = setTimeout(async () => {
            patchAdd({ accountLoading: true });
            try {
                const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=8`);
                const json = await res.json();
                patchAdd({ accountResults: json.success ? json.data : [] });
            } catch {
            } finally {
                patchAdd({ accountLoading: false });
            }
        }, 300);
    };

    const handleAdd = async () => {
        if (!addModal.email || !addModal.label) return;
        patchAdd({ loading: true });
        try {
            const body: Record<string, string> = {
                label: addModal.label,
                note: addModal.note,
                email: addModal.email
            };
            const res = await fetch("/api/admin/immich-whitelist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (json.success) {
                flash("Added to whitelist");
                patchAdd({ open: false });
                resetAdd();
                fetchEntries();
            } else {
                flash(json.error || "Failed to add", true);
            }
        } catch {
            flash("Network error", true);
        } finally {
            patchAdd({ loading: false });
        }
    };

    const handleToggle = async (entry: WhitelistEntry) => {
        try {
            const res = await fetch(`/api/admin/immich-whitelist/${entry._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !entry.enabled })
            });
            const json = await res.json();
            if (json.success) fetchEntries();
            else flash(json.error || "Failed", true);
        } catch {
            flash("Network error", true);
        }
    };

    const handleEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/immich-whitelist/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: editModal.label,
                    note: editModal.note,
                    subOverride: editModal.subOverride
                })
            });
            const json = await res.json();
            if (json.success) {
                patchEdit({ id: null });
                fetchEntries();
                flash("Updated");
            } else {
                flash(json.error || "Failed", true);
            }
        } catch {
            flash("Network error", true);
        }
    };

    const startEdit = (entry: WhitelistEntry) => {
        patchEdit({
            id: entry._id,
            label: entry.label,
            note: entry.note || "",
            subOverride: entry.subOverride || entry.lastIssuedSub || ""
        });
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/immich-whitelist/${id}`, {
                method: "DELETE"
            });
            const json = await res.json();
            if (json.success) {
                patchList({ deleteConfirm: null });
                fetchEntries();
                flash("Removed");
            } else {
                flash(json.error || "Failed", true);
            }
        } catch {
            flash("Network error", true);
        }
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        flash("Copied");
    };

    const generateKey = async () => {
        patchSetup({ loading: true });
        try {
            const res = await fetch("/api/admin/immich-sso/generate-key", { method: "POST" });
            const json = await res.json();
            if (json.success) {
                patchSetup({ key: json.jwk });
                flash("RSA key generated - copy it to .env.local");
            } else {
                flash(json.error || "Failed to generate key", true);
            }
        } catch {
            flash("Network error", true);
        } finally {
            patchSetup({ loading: false });
        }
    };

    const issuerUrl = typeof window !== "undefined" ? `${window.location.origin}${ISSUER_PATH}` : `https://your-domain.com${ISSUER_PATH}`;
    const canAdd = !!addModal.label && !!addModal.email;

    return (
        <div
            className="min-h-screen p-4 sm:p-6"
            style={{ background: shellBg }}>
            <div className="mx-auto w-full max-w-7xl">
                <div
                    className="relative overflow-hidden rounded-[30px] p-5 sm:p-7"
                    style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                        backdropFilter: isApple ? "blur(24px) saturate(130%)" : "none",
                        boxShadow: isDark ? "0 16px 52px rgba(0,0,0,0.35)" : "0 16px 42px rgba(0,0,0,0.08)"
                    }}>
                    <div
                        className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full"
                        style={{ background: `${palette.accent}1f`, filter: "blur(52px)" }}
                    />
                    <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div
                                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                                style={{ background: `${palette.accent}22`, color: palette.accent }}>
                                <PhotoCamera style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <h1
                                    className={isApple ? "text-2xl font-semibold" : "text-3xl font-black"}
                                    style={{ color: palette.textPrimary }}>
                                    Immich Access Control
                                </h1>
                                <p
                                    className="text-sm mt-1"
                                    style={{ color: palette.textSecondary }}>
                                    Minimal, clean whitelist management for Immich SSO.
                                </p>
                                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                                    <span className="px-2 py-1 rounded-full" style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                        {list.entries.length} total
                                    </span>
                                    <span className="px-2 py-1 rounded-full" style={{ background: "rgba(52,199,89,0.16)", color: "#34c759" }}>
                                        {list.entries.filter((entry) => entry.enabled).length} enabled
                                    </span>
                                    <span className="px-2 py-1 rounded-full" style={{ background: inputBg, color: palette.textSecondary }}>
                                        {list.entries.filter((entry) => !entry.linkedAccount).length} email-only
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => patchSetup({ open: !setup.open })}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}>
                                <Info fontSize="small" /> Setup
                            </button>
                            <button
                                onClick={() => {
                                    patchAdd({ open: true });
                                    resetAdd();
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: palette.accent, color: "#fff" }}>
                                <Add fontSize="small" /> Add Access
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {(list.error || list.success) && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 px-4 py-3 rounded-2xl text-sm font-medium"
                            style={{
                                background: list.error ? "rgba(255,59,48,0.14)" : "rgba(52,199,89,0.14)",
                                border: `1px solid ${list.error ? "rgba(255,59,48,0.30)" : "rgba(52,199,89,0.30)"}`,
                                color: list.error ? "#ff3b30" : "#34c759"
                            }}>
                            {list.error || list.success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {setup.open && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-hidden">
                            <div
                                className="rounded-3xl p-5 sm:p-6"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${borderColor}`,
                                    backdropFilter: isApple ? "blur(20px) saturate(130%)" : "none"
                                }}>
                                <h2 className={isApple ? "text-lg font-semibold" : "text-lg font-black"} style={{ color: palette.textPrimary }}>
                                    Immich OIDC Configuration
                                </h2>
                                <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                                    In Immich Admin, open Administration, then Settings, then OAuth and set the following values.
                                </p>
                                <div className="mt-4 space-y-2">
                                    {(
                                        [
                                            { key: "Issuer URL", value: issuerUrl },
                                            { key: "Client ID", value: "immich" },
                                            { key: "Client Secret", value: "(set IMMICH_SSO_CLIENT_SECRET env var)" },
                                            { key: "Scope", value: "openid email profile" },
                                            { key: "Button Text", value: "Login with Portfolio SSO" },
                                            { key: "Auto Register", value: "true" }
                                        ] as { key: string; value: string }[]
                                    ).map(({ key, value }) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2"
                                            style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                                            <span className="w-28 sm:w-32 text-xs sm:text-sm font-semibold" style={{ color: palette.textSecondary }}>
                                                {key}
                                            </span>
                                            <code className="flex-1 text-xs font-mono break-all" style={{ color: palette.textPrimary }}>
                                                {value}
                                            </code>
                                            <button onClick={() => copy(value)} className="p-1 rounded-lg" style={{ color: palette.textTertiary }}>
                                                <ContentCopy style={{ fontSize: 14 }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-2xl p-4" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: palette.textPrimary }}>
                                                <Key style={{ fontSize: 15 }} /> RSA Signing Key
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                                                Generate IMMICH_SSO_PRIVATE_KEY_JWK for persistent signing.
                                            </p>
                                        </div>
                                        <button
                                            onClick={generateKey}
                                            disabled={setup.loading}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                                            style={{ background: `${palette.accent}18`, color: palette.accent, opacity: setup.loading ? 0.6 : 1 }}>
                                            <Key style={{ fontSize: 15 }} /> {setup.loading ? "Generating..." : "Generate"}
                                        </button>
                                    </div>

                                    {setup.key && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-mono font-medium" style={{ color: palette.textSecondary }}>
                                                    IMMICH_SSO_PRIVATE_KEY_JWK=
                                                </span>
                                                <button
                                                    onClick={() => copy(setup.key)}
                                                    className="flex items-center gap-1 text-xs font-semibold"
                                                    style={{ color: palette.accent }}>
                                                    <ContentCopy style={{ fontSize: 13 }} /> Copy
                                                </button>
                                            </div>
                                            <textarea
                                                readOnly
                                                value={setup.key}
                                                rows={5}
                                                className="w-full font-mono text-xs rounded-xl px-3 py-2 resize-none"
                                                style={{
                                                    background: isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.60)",
                                                    color: palette.textPrimary,
                                                    border: `1px solid ${borderColor}`,
                                                    outline: "none"
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {addModal.open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)" }}>
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95 }}
                                className="w-full max-w-md rounded-3xl p-6"
                                style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-semibold text-lg" style={{ color: palette.textPrimary }}>
                                        Add Immich Access
                                    </h2>
                                    <button onClick={() => patchAdd({ open: false })} className="p-1 rounded-lg" style={{ color: palette.textTertiary }}>
                                        <Close />
                                    </button>
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs font-semibold mb-1" style={{ color: palette.textSecondary }}>
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={addModal.email}
                                            onChange={(e) => {
                                                const nextEmail = e.target.value;
                                                patchAdd({
                                                    email: nextEmail,
                                                    selectedUser:
                                                        addModal.selectedUser?.email?.toLowerCase() === nextEmail.toLowerCase()
                                                            ? addModal.selectedUser
                                                            : null
                                                });
                                                searchAccounts(nextEmail);
                                            }}
                                            placeholder="user@example.com"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                                            autoFocus
                                        />
                                        {addModal.accountLoading && (
                                            <div
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                                                style={{ borderColor: palette.accent, borderTopColor: "transparent" }}
                                            />
                                        )}
                                    </div>

                                    {addModal.selectedUser && (
                                        <div className="mt-2 flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: `${palette.accent}12`, border: `1px solid ${palette.accent}30` }}>
                                            {addModal.selectedUser.image ? (
                                                <Image src={addModal.selectedUser.image} alt={addModal.selectedUser.name || ""} width={36} height={36} className="rounded-full" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${palette.accent}25`, color: palette.accent }}>
                                                    {(addModal.selectedUser.name || addModal.selectedUser.email || "?").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: palette.textPrimary }}>
                                                    {addModal.selectedUser.name || "No name"}
                                                </p>
                                                <p className="text-xs truncate" style={{ color: palette.textSecondary }}>
                                                    {addModal.selectedUser.email}
                                                </p>
                                            </div>
                                            <button onClick={() => patchAdd({ selectedUser: null })} className="p-1 rounded-lg" style={{ color: palette.textTertiary }}>
                                                <Close style={{ fontSize: 16 }} />
                                            </button>
                                        </div>
                                    )}

                                    {addModal.accountResults.length > 0 && (
                                        <div className="mt-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}`, background: isDark ? "#1c1c20" : "#fff" }}>
                                            {addModal.accountResults.map((user, index) => (
                                                <button
                                                    key={user._id}
                                                    onClick={() => {
                                                        patchAdd({
                                                            email: user.email || "",
                                                            accountSearch: "",
                                                            accountResults: [],
                                                            selectedUser: user,
                                                            label: addModal.label || user.name || user.email?.split("@")[0] || ""
                                                        });
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                                                    style={{ borderBottom: index < addModal.accountResults.length - 1 ? `1px solid ${borderColor}` : "none" }}>
                                                    {user.image ? (
                                                        <Image src={user.image} alt={user.name || ""} width={30} height={30} className="rounded-full" />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${palette.accent}20`, color: palette.accent }}>
                                                            {(user.name || user.email || "?").charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate" style={{ color: palette.textPrimary }}>
                                                            {user.name || "No name"}
                                                        </p>
                                                        <p className="text-xs truncate" style={{ color: palette.textSecondary }}>
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-5">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: palette.textSecondary }}>
                                            Label *
                                        </label>
                                        <input
                                            type="text"
                                            value={addModal.label}
                                            onChange={(e) => patchAdd({ label: e.target.value })}
                                            placeholder="e.g. Family member"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: palette.textSecondary }}>
                                            Note (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={addModal.note}
                                            onChange={(e) => patchAdd({ note: e.target.value })}
                                            placeholder="e.g. View-only access"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => patchAdd({ open: false })}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}>
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={!canAdd || addModal.loading}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                        style={{ background: canAdd ? palette.accent : `${palette.accent}55`, color: "#fff" }}>
                                        {addModal.loading ? "Adding..." : "Grant Access"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className="mt-5 rounded-3xl p-3 sm:p-4 flex items-center gap-3 flex-wrap"
                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                    <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2.5 rounded-xl" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                        <Search style={{ fontSize: 18, color: palette.textTertiary }} />
                        <input
                            type="text"
                            value={list.search}
                            onChange={(e) => patchList({ search: e.target.value })}
                            placeholder="Search emails or labels"
                            className="flex-1 bg-transparent text-sm outline-none"
                            style={{ color: palette.textPrimary }}
                        />
                    </div>
                    <button onClick={fetchEntries} className="p-2.5 rounded-xl" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                        <Refresh style={{ fontSize: 18, color: palette.textTertiary }} />
                    </button>
                </div>

                {!list.loading && list.entries.length === 0 && (
                    <div className="mt-5 rounded-3xl p-10 text-center" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <PhotoCamera style={{ fontSize: 40, color: palette.textTertiary, marginBottom: 12 }} />
                        <p className={isApple ? "font-semibold" : "font-black"} style={{ color: palette.textPrimary }}>
                            No entries yet
                        </p>
                        <p className="text-sm mt-1" style={{ color: palette.textTertiary }}>
                            Add an email entry to grant Immich access.
                        </p>
                        <button
                            onClick={() => {
                                patchAdd({ open: true });
                                resetAdd();
                            }}
                            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold"
                            style={{ background: palette.accent, color: "#fff" }}>
                            Add First Entry
                        </button>
                    </div>
                )}

                <div className="mt-5 space-y-3">
                    {list.entries.map((entry) => {
                        const avatarSrc =
                            entry.account?.image || entry.account?.googleAvatar || entry.account?.githubAvatar || entry.account?.microsoftAvatar || undefined;
                        const displayName = entry.account?.name || entry.label;
                        const displayEmail = entry.account?.email || entry.email;
                        const initial = (entry.account?.name || entry.label || entry.email || "?").charAt(0).toUpperCase();

                        return (
                            <motion.div
                                key={entry._id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${borderColor}`,
                                    backdropFilter: isApple ? "blur(18px) saturate(130%)" : "none",
                                    opacity: entry.enabled ? 1 : 0.62
                                }}>
                                {editModal.id === entry._id ? (
                                    <div className="p-4 sm:p-5 space-y-2.5">
                                        <input
                                            type="text"
                                            value={editModal.label}
                                            onChange={(e) => patchEdit({ label: e.target.value })}
                                            placeholder="Label"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                                        />
                                        <input
                                            type="text"
                                            value={editModal.note}
                                            onChange={(e) => patchEdit({ note: e.target.value })}
                                            placeholder="Note (optional)"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                                        />
                                        <input
                                            type="text"
                                            value={editModal.subOverride}
                                            onChange={(e) => patchEdit({ subOverride: e.target.value })}
                                            placeholder="Immich oauthId override (sub) - leave blank for auto"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                                        />
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => patchEdit({ id: null })}
                                                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
                                                style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }}>
                                                <Close fontSize="small" /> Cancel
                                            </button>
                                            <button
                                                onClick={() => handleEdit(entry._id)}
                                                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
                                                style={{ background: palette.accent, color: "#fff" }}>
                                                <Check fontSize="small" /> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4 p-4 sm:p-5 flex-wrap sm:flex-nowrap">
                                        <div className="relative flex-shrink-0">
                                            {avatarSrc ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={avatarSrc}
                                                    alt={entry.label}
                                                    width={44}
                                                    height={44}
                                                    className="rounded-xl object-cover w-11 h-11"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `${palette.accent}20`, color: palette.accent }}>
                                                    {initial}
                                                </div>
                                            )}
                                            <div
                                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                                style={{
                                                    background: entry.linkedAccount ? palette.accent : isDark ? "#555" : "#bbb",
                                                    border: `2px solid ${isDark ? "#1c1c20" : "#fff"}`
                                                }}
                                                title={entry.linkedAccount ? "Linked portfolio account" : "Email-only entry"}>
                                                {entry.linkedAccount ? <LinkIcon style={{ fontSize: 9, color: "#fff" }} /> : <Email style={{ fontSize: 9, color: "#fff" }} />}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={isApple ? "font-semibold text-sm truncate" : "font-bold text-sm truncate"} style={{ color: palette.textPrimary }}>
                                                    {displayName}
                                                </span>
                                                {entry.linkedAccount && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                                        Linked
                                                    </span>
                                                )}
                                                {!entry.enabled && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,59,48,0.18)", color: "#ff3b30" }}>
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs mt-0.5 truncate" style={{ color: palette.textSecondary }}>
                                                {displayEmail}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs" style={{ color: palette.textTertiary }}>
                                                {entry.note && <span className="px-2 py-1 rounded-full" style={{ background: inputBg }}>{entry.note}</span>}
                                                {entry.subOverride && (
                                                    <span className="flex items-center gap-1 px-2 py-1 rounded-full font-mono" style={{ background: `${palette.accent}12` }} title={`sub override: ${entry.subOverride}`}>
                                                        <Key style={{ fontSize: 10 }} />
                                                        {entry.subOverride.length > 16 ? `${entry.subOverride.slice(0, 16)}...` : entry.subOverride}
                                                    </span>
                                                )}
                                                {entry.lastIssuedSub && !entry.subOverride && (
                                                    <button
                                                        onClick={() => copy(entry.lastIssuedSub!)}
                                                        title={`Last issued sub: ${entry.lastIssuedSub} - click to copy`}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-full font-mono hover:opacity-80"
                                                        style={{ background: inputBg, color: palette.textTertiary }}>
                                                        <Key style={{ fontSize: 10 }} />
                                                        {entry.lastIssuedSub.length > 16 ? `${entry.lastIssuedSub.slice(0, 16)}...` : entry.lastIssuedSub}
                                                    </button>
                                                )}
                                                {entry.lastAccess && (
                                                    <span className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: inputBg }}>
                                                        <AccessTime style={{ fontSize: 12 }} />
                                                        {new Date(entry.lastAccess).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {entry.accessCount > 0 && (
                                                    <span className="px-2 py-1 rounded-full" style={{ background: inputBg }}>
                                                        {entry.accessCount} sign-in{entry.accessCount !== 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="ml-auto flex items-center gap-1.5 self-center">
                                            <button
                                                onClick={() => handleToggle(entry)}
                                                title={entry.enabled ? "Disable" : "Enable"}
                                                className="p-2 rounded-xl"
                                                style={{ background: inputBg, color: entry.enabled ? "#34c759" : palette.textTertiary, border: `1px solid ${borderColor}` }}>
                                                {entry.enabled ? <ToggleOn /> : <ToggleOff />}
                                            </button>
                                            <button
                                                onClick={() => startEdit(entry)}
                                                className="p-2 rounded-xl"
                                                style={{ background: inputBg, color: palette.textTertiary, border: `1px solid ${borderColor}` }}>
                                                <Edit style={{ fontSize: 16 }} />
                                            </button>
                                            {list.deleteConfirm === entry._id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleDelete(entry._id)} className="px-2.5 py-2 rounded-xl text-xs font-semibold" style={{ background: "#ff3b30", color: "#fff" }}>
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => patchList({ deleteConfirm: null })}
                                                        className="p-2 rounded-xl"
                                                        style={{ background: inputBg, color: palette.textTertiary, border: `1px solid ${borderColor}` }}>
                                                        <Close style={{ fontSize: 14 }} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => patchList({ deleteConfirm: entry._id })}
                                                    className="p-2 rounded-xl"
                                                    style={{ background: inputBg, color: palette.textTertiary, border: `1px solid ${borderColor}` }}>
                                                    <Delete style={{ fontSize: 16 }} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
