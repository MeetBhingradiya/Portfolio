"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDesignTheme } from "@Hooks/useDesignTheme";

interface SyncResult {
    collection: string;
    sourceCount: number;
    targetCountBefore: number;
    targetCountAfter: number;
    inserted: number;
    updated: number;
    durationMs: number;
    mode: "upsert" | "replace";
}

export default function AdminDbSyncPage() {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    const [collections, setCollections] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [mode, setMode] = useState<"upsert" | "replace">("upsert");
    const [clearTarget, setClearTarget] = useState(false);
    const [batchSize, setBatchSize] = useState(200);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [sourceDb, setSourceDb] = useState("");
    const [targetDb, setTargetDb] = useState("");
    const [results, setResults] = useState<SyncResult[]>([]);

    const allSelected = collections.length > 0 && selected.length === collections.length;

    const fetchCollections = useCallback(async () => {
        setLoadingCollections(true);
        setError("");
        try {
            const res = await fetch("/api/admin/db-sync", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to load collections");
            setCollections(data.collections || []);
            setSelected(data.collections || []);
            setSourceDb(data.sourceDb || "");
            setTargetDb(data.targetDb || "");
        } catch (e: any) {
            setError(e.message || "Failed to load collections");
        } finally {
            setLoadingCollections(false);
        }
    }, []);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const toggleCollection = (name: string) => {
        setSelected((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
    };

    const toggleSelectAll = () => {
        setSelected(allSelected ? [] : [...collections]);
    };

    const syncNow = async () => {
        if (selected.length === 0) {
            setError("Select at least one collection to sync.");
            return;
        }

        setSyncing(true);
        setError("");
        setMessage("");
        try {
            const res = await fetch("/api/admin/db-sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    collections: selected,
                    mode,
                    clearTarget,
                    batchSize,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Sync failed");
            setResults(data.results || []);
            setMessage(`Sync complete: ${data.syncedCollections} collections copied from ${data.sourceDb} to ${data.targetDb}.`);
        } catch (e: any) {
            setError(e.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const totals = useMemo(() => {
        return results.reduce(
            (acc, r) => {
                acc.source += r.sourceCount;
                acc.before += r.targetCountBefore;
                acc.after += r.targetCountAfter;
                acc.inserted += r.inserted;
                acc.updated += r.updated;
                acc.duration += r.durationMs;
                return acc;
            },
            { source: 0, before: 0, after: 0, inserted: 0, updated: 0, duration: 0 }
        );
    }, [results]);

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div
                className="mb-6 rounded-3xl border p-6"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                }}
            >
                <h1 className="text-2xl font-black tracking-tight" style={{ color: palette.textPrimary }}>
                    MongoDB Atlas to Local Sync
                </h1>
                <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
                    One-click copy/sync of collections from cloud database to local database for debugging and testing.
                </p>
                <p className="mt-1 text-xs" style={{ color: palette.textTertiary }}>
                    Security: Source/target Mongo URIs are read only on server from environment variables and are never sent from browser payloads.
                </p>
                <p className="mt-1 text-xs" style={{ color: palette.textTertiary }}>
                    Transport security uses HTTPS/TLS between browser and server.
                </p>
                <p className="mt-2 text-xs" style={{ color: palette.textTertiary }}>
                    Source DB: {sourceDb || "-"} | Target DB: {targetDb || "-"}
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section
                    className="rounded-2xl border p-4"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                        background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                    }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: palette.textSecondary }}>
                            Collections
                        </h2>
                        <button
                            onClick={toggleSelectAll}
                            className="rounded-lg border px-3 py-1 text-xs font-bold"
                            style={{
                                borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)",
                                color: palette.textPrimary,
                            }}
                        >
                            {allSelected ? "Clear All" : "Select All"}
                        </button>
                    </div>

                    {loadingCollections ? (
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Loading collections...
                        </p>
                    ) : (
                        <div className="grid max-h-[480px] grid-cols-1 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                            {collections.map((name) => {
                                const checked = selected.includes(name);
                                return (
                                    <label
                                        key={name}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                                        style={{
                                            borderColor: checked
                                                ? palette.accent
                                                : isDark
                                                    ? "rgba(255,255,255,0.1)"
                                                    : "rgba(0,0,0,0.08)",
                                            background: checked
                                                ? `${palette.accent}14`
                                                : isDark
                                                    ? "rgba(255,255,255,0.02)"
                                                    : "rgba(0,0,0,0.01)",
                                            color: palette.textPrimary,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleCollection(name)}
                                        />
                                        <span className="truncate">{name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section
                    className="rounded-2xl border p-4"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                        background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                    }}
                >
                    <h2 className="mb-3 text-sm font-black uppercase tracking-wider" style={{ color: palette.textSecondary }}>
                        Sync Options
                    </h2>

                    <div className="space-y-3 text-sm" style={{ color: palette.textPrimary }}>
                        <label className="flex items-center justify-between gap-2">
                            <span>Mode</span>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as "upsert" | "replace")}
                                className="rounded-lg border px-2 py-1"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)",
                                    background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                                }}
                            >
                                <option value="upsert">Upsert (safe)</option>
                                <option value="replace">Replace (full copy)</option>
                            </select>
                        </label>

                        <label className="flex items-center justify-between gap-2">
                            <span>Clear target first</span>
                            <input
                                type="checkbox"
                                checked={clearTarget}
                                onChange={(e) => setClearTarget(e.target.checked)}
                            />
                        </label>

                        <label className="flex items-center justify-between gap-2">
                            <span>Batch size</span>
                            <input
                                type="number"
                                min={50}
                                max={500}
                                value={batchSize}
                                onChange={(e) => setBatchSize(Number(e.target.value || 200))}
                                className="w-24 rounded-lg border px-2 py-1"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)",
                                    background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                                }}
                            />
                        </label>
                    </div>

                    <button
                        onClick={syncNow}
                        disabled={syncing || loadingCollections || selected.length === 0}
                        className="mt-5 w-full rounded-xl px-4 py-2 text-sm font-black"
                        style={{
                            background: syncing ? palette.textTertiary : palette.accent,
                            color: "#fff",
                        }}
                    >
                        {syncing ? "Syncing..." : `Sync ${selected.length} Collection${selected.length !== 1 ? "s" : ""}`}
                    </button>

                    <button
                        onClick={fetchCollections}
                        disabled={loadingCollections || syncing}
                        className="mt-2 w-full rounded-xl border px-4 py-2 text-xs font-bold"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)",
                            color: palette.textPrimary,
                        }}
                    >
                        Refresh Collections
                    </button>
                </section>
            </div>

            {error && (
                <div
                    className="mt-5 rounded-xl border px-4 py-3 text-sm"
                    style={{
                        borderColor: "rgba(239,68,68,0.45)",
                        background: "rgba(239,68,68,0.12)",
                        color: "#ef4444",
                    }}
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    className="mt-5 rounded-xl border px-4 py-3 text-sm"
                    style={{
                        borderColor: "rgba(34,197,94,0.45)",
                        background: "rgba(34,197,94,0.12)",
                        color: "#22c55e",
                    }}
                >
                    {message}
                </div>
            )}

            {results.length > 0 && (
                <section
                    className="mt-6 rounded-2xl border p-4"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                        background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                    }}
                >
                    <h2 className="mb-3 text-sm font-black uppercase tracking-wider" style={{ color: palette.textSecondary }}>
                        Last Sync Result
                    </h2>

                    <div className="overflow-auto">
                        <table className="min-w-full text-left text-xs">
                            <thead>
                                <tr style={{ color: palette.textTertiary }}>
                                    <th className="px-2 py-2">Collection</th>
                                    <th className="px-2 py-2">Source</th>
                                    <th className="px-2 py-2">Before</th>
                                    <th className="px-2 py-2">After</th>
                                    <th className="px-2 py-2">Inserted</th>
                                    <th className="px-2 py-2">Updated</th>
                                    <th className="px-2 py-2">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r) => (
                                    <tr key={r.collection} style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
                                        <td className="px-2 py-2 font-semibold" style={{ color: palette.textPrimary }}>{r.collection}</td>
                                        <td className="px-2 py-2">{r.sourceCount}</td>
                                        <td className="px-2 py-2">{r.targetCountBefore}</td>
                                        <td className="px-2 py-2">{r.targetCountAfter}</td>
                                        <td className="px-2 py-2">{r.inserted}</td>
                                        <td className="px-2 py-2">{r.updated}</td>
                                        <td className="px-2 py-2">{r.durationMs}ms</td>
                                    </tr>
                                ))}
                                <tr style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)"}` }}>
                                    <td className="px-2 py-2 font-black" style={{ color: palette.textPrimary }}>TOTAL</td>
                                    <td className="px-2 py-2 font-bold">{totals.source}</td>
                                    <td className="px-2 py-2 font-bold">{totals.before}</td>
                                    <td className="px-2 py-2 font-bold">{totals.after}</td>
                                    <td className="px-2 py-2 font-bold">{totals.inserted}</td>
                                    <td className="px-2 py-2 font-bold">{totals.updated}</td>
                                    <td className="px-2 py-2 font-bold">{totals.duration}ms</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </main>
    );
}
