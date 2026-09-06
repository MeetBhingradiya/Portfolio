"use client";

import { useEffect, useMemo, useState } from "react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { useAdminSession } from "@Hooks/useAdminSession";

type SyncMode = "copy" | "sync";

interface DbStatus {
    label: "source" | "target";
    uri: string;
    connected: boolean;
    collections: string[];
    error?: string;
    hint?: string;
}

interface StatusResponse {
    success: boolean;
    source?: DbStatus;
    target?: DbStatus;
    sourceCollections?: string[];
    targetCollections?: string[];
    error?: string;
}

export default function DbSyncAdminClient() {
    const { palette, actualColorMode } = useDesignTheme();
    const { session, loading, hasPermission } = useAdminSession();
    const isDark = actualColorMode === "dark";

    const [status, setStatus] = useState<StatusResponse | null>(null);
    const [mode, setMode] = useState<SyncMode>("copy");
    const [selected, setSelected] = useState<string[]>([]);
    const [clearTargetCollection, setClearTargetCollection] = useState(false);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<string>("No sync executed yet.");

    const canAccess = useMemo(() => {
        if (!session) return false;
        if (session.isAdmin) return true;
        return hasPermission("admin.site.settings");
    }, [session, hasPermission]);

    const sourceCollections = status?.sourceCollections ?? [];

    const toggleCollection = (name: string) => {
        setSelected((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
    };

    const loadStatus = async () => {
        setBusy(true);
        try {
            const res = await fetch("/api/admin/db-sync", { method: "GET" });
            const json = (await res.json()) as StatusResponse;
            setStatus(json);

            if (!res.ok || !json.success) {
                setResult(
                    JSON.stringify(
                        {
                            message: json.error ?? "Database status check failed",
                            source: json.source,
                            target: json.target
                        },
                        null,
                        2
                    )
                );
            }
        } catch (error) {
            setResult(
                JSON.stringify(
                    {
                        message: error instanceof Error ? error.message : String(error)
                    },
                    null,
                    2
                )
            );
        } finally {
            setBusy(false);
        }
    };

    const runSync = async () => {
        setBusy(true);
        setResult("Sync in progress...");

        try {
            const res = await fetch("/api/admin/db-sync", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    mode,
                    collections: selected,
                    clearTargetCollection
                })
            });
            const json = await res.json();
            setResult(JSON.stringify(json, null, 2));
            await loadStatus();
        } catch (error) {
            setResult(
                JSON.stringify(
                    {
                        message: error instanceof Error ? error.message : String(error)
                    },
                    null,
                    2
                )
            );
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        if (!loading && canAccess) {
            loadStatus();
        }
    }, [loading, canAccess]);

    if (loading) {
        return (
            <div
                className="p-6"
                style={{ color: palette.textSecondary }}>
                Loading...
            </div>
        );
    }

    if (!canAccess) {
        return (
            <div className="p-6">
                <div
                    className="rounded-2xl border p-5"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                        color: palette.textSecondary
                    }}>
                    You do not have permission to access DB Sync. Required permission: admin.site.settings.
                </div>
            </div>
        );
    }

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <section
                className="rounded-3xl border p-6"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                }}>
                <h1
                    className="text-2xl font-black"
                    style={{ color: palette.textPrimary }}>
                    DB Sync (Atlas -&gt; Local)
                </h1>
                <p
                    className="mt-1 text-sm"
                    style={{ color: palette.textSecondary }}>
                    Fast copy/sync utility for local debugging and testing. Disabled automatically in production.
                </p>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-2">
                {[status?.source, status?.target].map((db, index) => (
                    <article
                        key={db?.label ?? index}
                        className="rounded-2xl border p-4"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                            background: isDark ? "rgba(255,255,255,0.02)" : "#fff"
                        }}>
                        <p
                            className="text-xs font-black uppercase"
                            style={{ color: palette.textSecondary }}>
                            {db?.label ?? "Unknown"}
                        </p>
                        <p
                            className="mt-1 break-all text-xs"
                            style={{ color: palette.textSecondary }}>
                            {db?.uri ?? "Not available"}
                        </p>
                        <p
                            className="mt-2 text-xs font-bold"
                            style={{
                                color: db?.connected ? "#16a34a" : "#ef4444"
                            }}>
                            {db?.connected ? "Connected" : "Disconnected"}
                        </p>
                        {!!db?.error && (
                            <p
                                className="mt-2 text-xs"
                                style={{ color: "#f97316" }}>
                                Error: {db.error}
                            </p>
                        )}
                        {!!db?.hint && (
                            <p
                                className="mt-1 text-xs"
                                style={{ color: palette.textSecondary }}>
                                Hint: {db.hint}
                            </p>
                        )}
                    </article>
                ))}
            </section>

            <section
                className="mt-5 rounded-2xl border p-4"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fff"
                }}>
                <div className="flex flex-wrap items-center gap-3">
                    <label
                        className="text-sm font-semibold"
                        style={{ color: palette.textPrimary }}>
                        Mode
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as SyncMode)}
                            className="ml-2 rounded-lg border px-2 py-1 text-sm"
                            style={{
                                borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)",
                                background: "transparent",
                                color: palette.textPrimary
                            }}>
                            <option value="copy">Copy (replace target collection)</option>
                            <option value="sync">Sync (upsert by _id)</option>
                        </select>
                    </label>

                    <label
                        className="flex items-center gap-2 text-sm"
                        style={{ color: palette.textSecondary }}>
                        <input
                            type="checkbox"
                            checked={clearTargetCollection}
                            onChange={(e) => setClearTargetCollection(e.target.checked)}
                        />
                        Clear target before sync mode
                    </label>

                    <button
                        onClick={loadStatus}
                        disabled={busy}
                        className="rounded-xl border px-3 py-1.5 text-xs font-black uppercase"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                            color: palette.textPrimary
                        }}>
                        Refresh
                    </button>

                    <button
                        onClick={runSync}
                        disabled={busy || !(status?.source?.connected && status?.target?.connected)}
                        className="rounded-xl px-3 py-1.5 text-xs font-black uppercase"
                        style={{
                            background: palette.accent,
                            color: "#fff",
                            opacity: busy ? 0.7 : 1
                        }}>
                        {busy ? "Running..." : "Run Sync"}
                    </button>
                </div>

                <div className="mt-4">
                    <p
                        className="text-xs font-black uppercase"
                        style={{ color: palette.textSecondary }}>
                        Collections
                    </p>
                    <p
                        className="mt-1 text-xs"
                        style={{ color: palette.textSecondary }}>
                        Leave all unchecked to process all source collections.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {sourceCollections.length === 0 && (
                            <span
                                className="text-xs"
                                style={{ color: palette.textSecondary }}>
                                No source collections found.
                            </span>
                        )}
                        {sourceCollections.map((name) => (
                            <label
                                key={name}
                                className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                                    color: palette.textPrimary
                                }}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(name)}
                                    onChange={() => toggleCollection(name)}
                                />
                                {name}
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            <section
                className="mt-5 rounded-2xl border p-4"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                    background: "#081018"
                }}>
                <p
                    className="mb-2 text-xs font-black uppercase"
                    style={{ color: "#93c5fd" }}>
                    Result
                </p>
                <pre
                    className="overflow-auto text-xs"
                    style={{ color: "#dbeafe" }}>
                    {result}
                </pre>
            </section>
        </main>
    );
}
