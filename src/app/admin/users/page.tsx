/**
 * Admin Users Page
 * Read-only view of all Better Auth users with delete capability.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Search, Delete, Person, ChevronLeft, ChevronRight, Refresh } from "@mui/icons-material";

const PAGE_SIZE = 15;

interface User {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    emailVerified?: boolean;
    createdAt?: string;
}

export default function UsersPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), search });
            const res = await fetch(`/api/admin/users?${params}`);
            const json = await res.json();
            if (json.success) {
                setUsers(json.data ?? []);
                setTotal(json.pagination?.total ?? 0);
            } else {
                setError(json.error || "Failed to load users");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) fetchUsers();
            else setError(json.error || "Delete failed");
        } catch {
            setError("Network error");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)"
        : isDark ? "rgba(24,24,28,0.95)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="p-6" style={{ minHeight: "100vh", background: palette.background }}>
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: palette.textPrimary }}>Users</h1>
                    <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>All registered users</p>
                    <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>{total} users</p>
                </div>
                <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                    whileHover={{ scale: 1.03 }}
                    onClick={fetchUsers}
                >
                    <Refresh fontSize="small" /> Refresh
                </motion.button>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: palette.textTertiary, fontSize: 18 }} />
                <input
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${borderColor}`,
                        color: palette.textPrimary,
                    }}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232", border: "1px solid rgba(220,50,50,0.2)" }}>
                    {error}
                </div>
            )}

            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                            {["User", "Email", "Verified", "Joined", "Actions"].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide"
                                    style={{ color: palette.textTertiary }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-t" style={{ borderColor }}>
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div className="h-4 rounded animate-pulse"
                                                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", width: "70%" }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center" style={{ color: palette.textTertiary }}>
                                    No users found
                                </td>
                            </tr>
                        ) : users.map(user => (
                            <tr key={user._id} className="border-t" style={{ borderColor }}>
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
                                <td className="px-4 py-3 text-sm" style={{ color: palette.textSecondary }}>{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                        style={{
                                            background: user.emailVerified ? "rgba(52,199,89,0.15)" : "rgba(255,149,0,0.15)",
                                            color: user.emailVerified ? "#34C759" : "#FF9500"
                                        }}>
                                        {user.emailVerified ? "Verified" : "Unverified"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: palette.textTertiary }}>
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                                </td>
                                <td className="px-4 py-3">
                                    {deleteConfirm === user._id ? (
                                        <div className="flex gap-1">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                className="px-2 py-1 rounded-lg text-xs font-bold"
                                                style={{ background: "rgba(220,50,50,0.15)", color: "#DC3232" }}
                                                onClick={() => handleDelete(user._id)}
                                            >
                                                Confirm
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                className="px-2 py-1 rounded-lg text-xs"
                                                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                                                onClick={() => setDeleteConfirm(null)}
                                            >
                                                Cancel
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            className="p-1.5 rounded-lg"
                                            style={{ background: "rgba(220,50,50,0.1)", color: "#DC3232" }}
                                            onClick={() => setDeleteConfirm(user._id)}
                                            title="Delete user"
                                        >
                                            <Delete style={{ fontSize: 16 }} />
                                        </motion.button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor }}>
                        <p className="text-xs" style={{ color: palette.textTertiary }}>Page {page} of {pages}</p>
                        <div className="flex gap-2">
                            <motion.button disabled={page <= 1} whileHover={{ scale: page > 1 ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: page <= 1 ? palette.textTertiary : palette.textSecondary }}
                                onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <ChevronLeft fontSize="small" />
                            </motion.button>
                            <motion.button disabled={page >= pages} whileHover={{ scale: page < pages ? 1.05 : 1 }}
                                className="p-1.5 rounded-lg"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: page >= pages ? palette.textTertiary : palette.textSecondary }}
                                onClick={() => setPage(p => Math.min(pages, p + 1))}>
                                <ChevronRight fontSize="small" />
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
