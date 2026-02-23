/**
 * Admin — Immich Access Control
 * /admin/immich-access
 *
 * Manage the email whitelist that gates access to your Immich instance.
 * Supports two entry modes:
 *  • Linked Account — pick an existing Better Auth user (preferred, matched by userId)
 *  • Email Only — for people who do not have a portfolio account yet
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Add, Delete, Edit, Check, Close, Search, Refresh,
    PhotoCamera, ToggleOn, ToggleOff, AccessTime, ContentCopy,
    Info, Email, Link as LinkIcon, Key,
} from "@mui/icons-material";
import Image from "next/image";

/* --- Types --------------------------------------------------------------- */
interface BAUser {
    _id: string;  // BA stores its own UUID as _id (string, not ObjectId)
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
    account?: { _id: string; name?: string; image?: string; email?: string; emailVerified?: boolean } | null;
}

type AddMode = "account" | "email";
const ISSUER_PATH = "/api/immich-sso";

/* --- Component ------------------------------------------------------------ */
export default function ImmichAccessPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [entries, setEntries] = useState<WhitelistEntry[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /* add modal */
    const [showAdd, setShowAdd] = useState(false);
    const [addMode, setAddMode] = useState<AddMode>("account");
    const [addLoading, setAddLoading] = useState(false);
    const [accountSearch, setAccountSearch] = useState("");
    const [accountResults, setAccountResults] = useState<BAUser[]>([]);
    const [accountLoading, setAccountLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<BAUser | null>(null);
    const [addEmail, setAddEmail] = useState("");
    const [addLabel, setAddLabel] = useState("");
    const [addNote, setAddNote] = useState("");

    /* edit */
    const [editId, setEditId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editNote, setEditNote] = useState("");

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showSetup, setShowSetup] = useState(false);
    const [generatedKey, setGeneratedKey] = useState("");
    const [keyGenLoading, setKeyGenLoading] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* styles */
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
    const subtleBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

    const flash = (msg: string, isError = false) => {
        if (isError) { setError(msg); setTimeout(() => setError(""), 4000); }
        else { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
    };

    const resetAdd = () => {
        setSelectedUser(null); setAccountSearch(""); setAccountResults([]);
        setAddEmail(""); setAddLabel(""); setAddNote(""); setAddMode("account");
    };

    /* fetch whitelist --------------------------------------------------- */
    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/immich-whitelist?search=${encodeURIComponent(search)}`);
            const json = await res.json();
            if (json.success) setEntries(json.data);
            else flash(json.error || "Failed to load", true);
        } catch { flash("Network error", true); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    /* search BA accounts ------------------------------------------------ */
    const searchAccounts = (q: string) => {
        setAccountSearch(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setAccountLoading(true);
            try {
                const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=8`);
                const json = await res.json();
                setAccountResults(json.success ? json.data : []);
            } catch { /* ignore */ }
            finally { setAccountLoading(false); }
        }, 300);
    };

    /* add --------------------------------------------------------------- */
    const handleAdd = async () => {
        if (addMode === "account" && !selectedUser) return;
        if (addMode === "email" && !addEmail) return;
        if (!addLabel) return;
        setAddLoading(true);
        try {
            const body: Record<string, string> = { label: addLabel, note: addNote };
            if (addMode === "account" && selectedUser) {
                // BA adapter stores its UUID as `_id` (string) in MongoDB.
                // Cast to any to also pick up `id` if the adapter version uses that field.
                const u = selectedUser as any;
                body.userId = u.id ?? u._id;
            } else body.email = addEmail;
            const res = await fetch("/api/admin/immich-whitelist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.success) {
                flash("Added to whitelist");
                setShowAdd(false); resetAdd(); fetchEntries();
            } else flash(json.error || "Failed to add", true);
        } catch { flash("Network error", true); }
        finally { setAddLoading(false); }
    };

    const handleToggle = async (entry: WhitelistEntry) => {
        try {
            const res = await fetch(`/api/admin/immich-whitelist/${entry._id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !entry.enabled }),
            });
            const json = await res.json();
            if (json.success) fetchEntries(); else flash(json.error || "Failed", true);
        } catch { flash("Network error", true); }
    };

    const handleEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/immich-whitelist/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: editLabel, note: editNote }),
            });
            const json = await res.json();
            if (json.success) { setEditId(null); fetchEntries(); flash("Updated"); }
            else flash(json.error || "Failed", true);
        } catch { flash("Network error", true); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/immich-whitelist/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) { setDeleteConfirm(null); fetchEntries(); flash("Removed"); }
            else flash(json.error || "Failed", true);
        } catch { flash("Network error", true); }
    };

    const copy = (text: string) => { navigator.clipboard.writeText(text); flash("Copied"); };

    const generateKey = async () => {
        setKeyGenLoading(true);
        try {
            const res = await fetch("/api/admin/immich-sso/generate-key", { method: "POST" });
            const json = await res.json();
            if (json.success) { setGeneratedKey(json.jwk); flash("RSA key generated — copy it to .env.local"); }
            else flash(json.error || "Failed to generate key", true);
        } catch { flash("Network error", true); }
        finally { setKeyGenLoading(false); }
    };

    const issuerUrl = typeof window !== "undefined"
        ? `${window.location.origin}${ISSUER_PATH}` : `https://your-domain.com${ISSUER_PATH}`;

    const canAdd = addLabel && (addMode === "account" ? !!selectedUser : !!addEmail);

    /* --- render --------------------------------------------------------- */
    return (
        <div className="p-6" style={{ minHeight: "100vh", background: palette.background }}>

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: `${palette.accent}18` }}>
                        <PhotoCamera style={{ color: palette.accent, fontSize: 20 }} />
                    </div>
                    <div>
                        <h1 className={isApple ? "text-xl font-bold" : "text-2xl font-black"}
                            style={{ color: palette.textPrimary }}>
                            Immich Access Control
                        </h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Grant Immich access to portfolio accounts or standalone emails
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSetup(!showSetup)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textPrimary }}>
                        <Info fontSize="small" /> Setup Guide
                    </button>
                    <button onClick={() => { setShowAdd(true); resetAdd(); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: palette.accent, color: "#fff" }}>
                        <Add fontSize="small" /> Add Access
                    </button>
                </div>
            </div>

            {/* Flash */}
            <AnimatePresence>
                {(error || success) && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{
                            background: error ? "#ff3b3018" : "#34c75918",
                            border: `1px solid ${error ? "#ff3b3040" : "#34c75940"}`,
                            color: error ? "#ff3b30" : "#34c759",
                        }}>
                        {error || success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Setup Guide */}
            <AnimatePresence>
                {showSetup && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                        <div className="rounded-2xl p-5"
                            style={{ background: cardBg, border: `1px solid ${borderColor}`, backdropFilter: isApple ? "blur(20px)" : "none" }}>
                            <h2 className="font-bold text-base mb-3" style={{ color: palette.textPrimary }}>
                                Immich OIDC Configuration
                            </h2>
                            <p className="text-sm mb-4" style={{ color: palette.textSecondary }}>
                                In <strong>Immich Admin → Administration → Settings → OAuth</strong>, set:
                            </p>
                            <div className="space-y-2">
                                {([
                                    { key: "Issuer URL", value: issuerUrl },
                                    { key: "Client ID", value: "immich" },
                                    { key: "Client Secret", value: "(set IMMICH_SSO_CLIENT_SECRET env var)" },
                                    { key: "Scope", value: "openid email profile" },
                                    { key: "Button Text", value: "Login with Portfolio SSO" },
                                    { key: "Auto Register", value: "true" },
                                ] as { key: string; value: string }[]).map(({ key, value }) => (
                                    <div key={key} className="flex items-center gap-3 text-sm">
                                        <span className="w-32 flex-shrink-0 font-medium" style={{ color: palette.textSecondary }}>{key}</span>
                                        <code className="flex-1 px-2 py-1 rounded-lg font-mono text-xs"
                                            style={{ background: inputBg, color: palette.textPrimary }}>{value}</code>
                                        <button onClick={() => copy(value)}>
                                            <ContentCopy style={{ fontSize: 14, color: palette.textTertiary }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs mt-4" style={{ color: palette.textTertiary }}>
                                Set <code className="px-1 rounded" style={{ background: inputBg }}>IMMICH_SSO_REDIRECT_URIS</code> to your
                                Immich redirect URIs (comma-separated), e.g.{" "}
                                <code className="px-1 rounded" style={{ background: inputBg }}>http://nas:2283/auth/login,app.immich:///oauth-callback</code>
                            </p>

                            {/* RSA Key Generator */}
                            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                        <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: palette.textPrimary }}>
                                            <Key style={{ fontSize: 15 }} /> RSA Signing Key
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                                            Generate a persistent RS256 private key so tokens survive server restarts.
                                            Paste the result into <code className="px-1 rounded" style={{ background: inputBg }}>IMMICH_SSO_PRIVATE_KEY_JWK</code> in your .env.local.
                                        </p>
                                    </div>
                                    <button
                                        onClick={generateKey}
                                        disabled={keyGenLoading}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-opacity"
                                        style={{
                                            background: `${palette.accent}18`,
                                            color: palette.accent,
                                            opacity: keyGenLoading ? 0.6 : 1,
                                        }}>
                                        <Key style={{ fontSize: 15 }} />
                                        {keyGenLoading ? "Generating…" : "Generate Key"}
                                    </button>
                                </div>
                                {generatedKey && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-mono font-medium" style={{ color: palette.textSecondary }}>
                                                IMMICH_SSO_PRIVATE_KEY_JWK=
                                            </span>
                                            <button onClick={() => copy(generatedKey)}
                                                className="flex items-center gap-1 text-xs font-semibold"
                                                style={{ color: palette.accent }}>
                                                <ContentCopy style={{ fontSize: 13 }} /> Copy
                                            </button>
                                        </div>
                                        <textarea readOnly value={generatedKey} rows={5}
                                            className="w-full font-mono text-xs rounded-xl px-3 py-2 resize-none"
                                            style={{
                                                background: inputBg,
                                                color: palette.textPrimary,
                                                border: `1px solid ${borderColor}`,
                                                outline: "none",
                                            }} />
                                        <p className="text-xs mt-1.5" style={{ color: "#f59e0b" }}>
                                            ⚠ Keep this secret — do not commit to git. Changing the key invalidates all active tokens.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)" }}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-md rounded-3xl p-6"
                            style={{ background: isDark ? "#1c1c20" : "#fff", border: `1px solid ${borderColor}` }}>

                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-lg" style={{ color: palette.textPrimary }}>Add Immich Access</h2>
                                <button onClick={() => setShowAdd(false)}><Close style={{ color: palette.textTertiary }} /></button>
                            </div>

                            {/* Mode toggle */}
                            <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: subtleBg }}>
                                {(["account", "email"] as AddMode[]).map((m) => (
                                    <button key={m} onClick={() => { setAddMode(m); setSelectedUser(null); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all"
                                        style={{
                                            background: addMode === m ? (isDark ? "rgba(255,255,255,0.12)" : "#fff") : "transparent",
                                            color: addMode === m ? palette.accent : palette.textTertiary,
                                            boxShadow: addMode === m ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                                        }}>
                                        {m === "account"
                                            ? <><LinkIcon style={{ fontSize: 15 }} /> Portfolio Account</>
                                            : <><Email style={{ fontSize: 15 }} /> Email Only</>}
                                    </button>
                                ))}
                            </div>

                            {/* Account picker */}
                            {addMode === "account" && (
                                <div className="mb-3">
                                    {selectedUser ? (
                                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
                                            style={{ background: `${palette.accent}12`, border: `1px solid ${palette.accent}30` }}>
                                            {selectedUser.image ? (
                                                <Image src={selectedUser.image} alt={selectedUser.name || ""} width={36} height={36}
                                                    className="rounded-full flex-shrink-0" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                                                    style={{ background: `${palette.accent}25`, color: palette.accent }}>
                                                    {(selectedUser.name || selectedUser.email || "?").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: palette.textPrimary }}>
                                                    {selectedUser.name || "No name"}
                                                </p>
                                                <p className="text-xs truncate" style={{ color: palette.textSecondary }}>{selectedUser.email}</p>
                                            </div>
                                            <button onClick={() => { setSelectedUser(null); setAccountSearch(""); setAddLabel(""); }}
                                                className="p-1 rounded-lg" style={{ color: palette.textTertiary }}>
                                                <Close style={{ fontSize: 16 }} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <label className="block text-xs font-medium mb-1" style={{ color: palette.textSecondary }}>
                                                Search Portfolio Accounts *
                                            </label>
                                            <div className="relative">
                                                <input type="text" value={accountSearch}
                                                    onChange={(e) => searchAccounts(e.target.value)}
                                                    placeholder="Name or email…"
                                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                                    style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }}
                                                    autoFocus />
                                                {accountLoading && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                                                        style={{ borderColor: palette.accent, borderTopColor: "transparent" }} />
                                                )}
                                            </div>
                                            {accountResults.length > 0 && (
                                                <div className="mt-1 rounded-xl overflow-hidden"
                                                    style={{ border: `1px solid ${borderColor}`, background: isDark ? "#1c1c20" : "#fff" }}>
                                                    {accountResults.map((u) => (
                                                        <button key={u._id}
                                                            onClick={() => { setSelectedUser(u); setAddLabel(u.name || u.email?.split("@")[0] || ""); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                                                            style={{ borderBottom: `1px solid ${borderColor}` }}>
                                                            {u.image ? (
                                                                <Image src={u.image} alt={u.name || ""} width={30} height={30}
                                                                    className="rounded-full flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                                                    style={{ background: `${palette.accent}20`, color: palette.accent }}>
                                                                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate" style={{ color: palette.textPrimary }}>
                                                                    {u.name || "No name"}
                                                                </p>
                                                                <p className="text-xs truncate" style={{ color: palette.textSecondary }}>{u.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {accountSearch && !accountLoading && accountResults.length === 0 && (
                                                <p className="mt-2 text-xs text-center" style={{ color: palette.textTertiary }}>
                                                    No accounts found — use Email Only mode instead
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Email-only */}
                            {addMode === "email" && (
                                <div className="mb-3">
                                    <label className="block text-xs font-medium mb-1" style={{ color: palette.textSecondary }}>
                                        Email Address *
                                    </label>
                                    <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                                        placeholder="user@example.com"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                    <p className="text-xs mt-1.5" style={{ color: palette.textTertiary }}>
                                        Matched by email when they sign in. Upgrades to a linked account automatically.
                                    </p>
                                </div>
                            )}

                            {/* Shared fields */}
                            <div className="space-y-3 mb-5">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: palette.textSecondary }}>Label *</label>
                                    <input type="text" value={addLabel} onChange={(e) => setAddLabel(e.target.value)}
                                        placeholder="e.g. Family member, Friend"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: palette.textSecondary }}>Note (optional)</label>
                                    <input type="text" value={addNote} onChange={(e) => setAddNote(e.target.value)}
                                        placeholder="e.g. View-only access"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => setShowAdd(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                                    style={{ background: inputBg, color: palette.textPrimary }}>Cancel</button>
                                <button onClick={handleAdd} disabled={!canAdd || addLoading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                    style={{ background: canAdd ? palette.accent : `${palette.accent}50`, color: "#fff" }}>
                                    {addLoading ? "Adding…" : "Grant Access"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search + stats */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2.5 rounded-xl"
                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                    <Search style={{ fontSize: 18, color: palette.textTertiary }} />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search emails or labels…"
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: palette.textPrimary }} />
                </div>
                <button onClick={fetchEntries} className="p-2.5 rounded-xl"
                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                    <Refresh style={{ fontSize: 18, color: palette.textTertiary }} />
                </button>
                <div className="flex items-center gap-3 text-xs" style={{ color: palette.textTertiary }}>
                    <span style={{ color: palette.accent }}>{entries.filter((e) => e.linkedAccount).length} linked</span>
                    <span>·</span>
                    <span>{entries.filter((e) => !e.linkedAccount).length} email-only</span>
                </div>
            </div>

            {/* Empty */}
            {!loading && entries.length === 0 && (
                <div className="rounded-2xl p-12 text-center"
                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                    <PhotoCamera style={{ fontSize: 40, color: palette.textTertiary, marginBottom: 12 }} />
                    <p className="font-semibold" style={{ color: palette.textPrimary }}>No entries yet</p>
                    <p className="text-sm mt-1" style={{ color: palette.textTertiary }}>
                        Grant a portfolio account or email access to Immich
                    </p>
                    <button onClick={() => { setShowAdd(true); resetAdd(); }}
                        className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: palette.accent, color: "#fff" }}>
                        Add First Entry
                    </button>
                </div>
            )}

            {/* List */}
            <div className="space-y-2">
                {entries.map((entry) => {
                    const avatarSrc = entry.account?.image;
                    const displayEmail = entry.account?.email || entry.email;
                    const initial = (entry.account?.name || entry.label || entry.email || "?").charAt(0).toUpperCase();

                    return (
                        <motion.div key={entry._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl"
                            style={{
                                background: cardBg,
                                border: `1px solid ${borderColor}`,
                                backdropFilter: isApple ? "blur(20px)" : "none",
                                opacity: entry.enabled ? 1 : 0.58,
                            }}>

                            {editId === entry._id ? (
                                <div className="p-4 space-y-2">
                                    <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                                        placeholder="Label"
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                    <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)}
                                        placeholder="Note (optional)"
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditId(null)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                                            style={{ background: inputBg, color: palette.textPrimary }}>
                                            <Close fontSize="small" /> Cancel
                                        </button>
                                        <button onClick={() => handleEdit(entry._id)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                            style={{ background: palette.accent, color: "#fff" }}>
                                            <Check fontSize="small" /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 p-4">
                                    {/* Avatar + link badge */}
                                    <div className="relative flex-shrink-0">
                                        {avatarSrc ? (
                                            <Image src={avatarSrc} alt={entry.label} width={40} height={40}
                                                className="rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                                style={{ background: `${palette.accent}20`, color: palette.accent }}>
                                                {initial}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                            style={{
                                                background: entry.linkedAccount ? palette.accent : (isDark ? "#555" : "#bbb"),
                                                border: `2px solid ${isDark ? "#1c1c20" : "#fff"}`,
                                            }}
                                            title={entry.linkedAccount ? "Linked portfolio account" : "Email-only entry"}>
                                            {entry.linkedAccount
                                                ? <LinkIcon style={{ fontSize: 9, color: "#fff" }} />
                                                : <Email style={{ fontSize: 9, color: "#fff" }} />}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm truncate" style={{ color: palette.textPrimary }}>
                                                {entry.label}
                                            </span>
                                            {entry.linkedAccount && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                    style={{ background: `${palette.accent}18`, color: palette.accent }}>
                                                    Linked Account
                                                </span>
                                            )}
                                            {!entry.enabled && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full"
                                                    style={{ background: "#ff3b3020", color: "#ff3b30" }}>Disabled</span>
                                            )}
                                        </div>
                                        <p className="text-xs truncate" style={{ color: palette.textSecondary }}>{displayEmail}</p>
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                            {entry.note && (
                                                <span className="text-xs" style={{ color: palette.textTertiary }}>{entry.note}</span>
                                            )}
                                            {entry.lastAccess && (
                                                <span className="flex items-center gap-0.5 text-xs" style={{ color: palette.textTertiary }}>
                                                    <AccessTime style={{ fontSize: 11 }} />
                                                    {new Date(entry.lastAccess).toLocaleDateString()}
                                                </span>
                                            )}
                                            {entry.accessCount > 0 && (
                                                <span className="text-xs" style={{ color: palette.textTertiary }}>
                                                    {entry.accessCount} sign-in{entry.accessCount !== 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleToggle(entry)}
                                            title={entry.enabled ? "Disable" : "Enable"}
                                            className="p-1.5 rounded-lg"
                                            style={{ color: entry.enabled ? "#34c759" : palette.textTertiary }}>
                                            {entry.enabled ? <ToggleOn /> : <ToggleOff />}
                                        </button>
                                        <button onClick={() => { setEditId(entry._id); setEditLabel(entry.label); setEditNote(entry.note || ""); }}
                                            className="p-1.5 rounded-lg" style={{ color: palette.textTertiary }}>
                                            <Edit style={{ fontSize: 16 }} />
                                        </button>
                                        {deleteConfirm === entry._id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleDelete(entry._id)}
                                                    className="px-2 py-1 rounded-lg text-xs font-semibold"
                                                    style={{ background: "#ff3b30", color: "#fff" }}>Confirm</button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded-lg"
                                                    style={{ color: palette.textTertiary }}>
                                                    <Close style={{ fontSize: 14 }} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(entry._id)}
                                                className="p-1.5 rounded-lg" style={{ color: palette.textTertiary }}>
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
    );
}
