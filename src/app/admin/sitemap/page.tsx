"use client";
import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Downloading, CheckCircle, ErrorOutline } from "@mui/icons-material";

const fields: FieldDef[] = [
    {
        key: "Endpoint",
        label: "Endpoint URL",
        type: "text",
        required: true,
        colSpan: 2,
        placeholder: "/projects/my-project"
    },
    { key: "Priority", label: "Priority (0–1)", type: "number" },
    {
        key: "Frequency",
        label: "Change Frequency",
        type: "select",
        required: true,
        options: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]
    },
    {
        key: "Group",
        label: "Group",
        type: "text",
        placeholder: "main / tools / legal / blogs / projects"
    },
    { key: "Enabled", label: "Enabled", type: "boolean" },
    {
        key: "LastModified",
        label: "Last Modified",
        type: "date",
        tableVisible: false
    }
];

function SeedBanner() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [seed, setSeed] = useState<{
        status: "idle" | "loading" | "success" | "error";
        msg: string;
    }>({
        status: "idle",
        msg: ""
    });
    const patchSeed = useCallback((p: Partial<typeof seed>) => setSeed((s) => ({ ...s, ...p })), []);

    const handleSeed = async () => {
        patchSeed({ status: "loading", msg: "" });
        try {
            const res = await fetch("/api/admin/sitemap/seed", {
                method: "POST"
            });
            const json = await res.json();
            if (json.success) {
                patchSeed({
                    status: "success",
                    msg: json.message ?? "Seeded successfully."
                });
            } else {
                patchSeed({
                    status: "error",
                    msg: json.error ?? "Seed failed."
                });
            }
        } catch {
            patchSeed({ status: "error", msg: "Network error." });
        }
    };

    const bannerBg = isApple ? (isDark ? "rgba(28,28,32,0.72)" : "rgba(255,255,255,0.72)") : isDark ? "rgba(24,24,28,0.95)" : "#fff";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    return (
        <div
            className="flex items-center justify-between gap-4 flex-wrap px-5 py-4 rounded-2xl mb-5"
            style={{
                background: bannerBg,
                border: `1px solid ${borderColor}`,
                backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none"
            }}>
            <div>
                <p
                    className="text-sm font-bold"
                    style={{ color: palette.textPrimary }}>
                    Seed Static Pages
                </p>
                <p
                    className="text-xs mt-0.5"
                    style={{ color: palette.textSecondary }}>
                    One-click import of all hard-coded static routes (main, tools, legal, auth, settings). Existing entries are left
                    unchanged.
                </p>
                {seed.msg && (
                    <p
                        className="text-xs mt-1 font-semibold"
                        style={{
                            color: seed.status === "success" ? "#34C759" : "#FF3B30"
                        }}>
                        {seed.msg}
                    </p>
                )}
            </div>
            <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                disabled={seed.status === "loading"}
                onClick={handleSeed}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
                style={{
                    background:
                        seed.status === "success"
                            ? "rgba(52,199,89,0.15)"
                            : seed.status === "error"
                              ? "rgba(255,59,48,0.15)"
                              : `${palette.accent}18`,
                    color: seed.status === "success" ? "#34C759" : seed.status === "error" ? "#FF3B30" : palette.accent,
                    opacity: seed.status === "loading" ? 0.7 : 1,
                    cursor: seed.status === "loading" ? "not-allowed" : "pointer"
                }}>
                {seed.status === "loading" ? (
                    <Downloading
                        fontSize="small"
                        className="animate-pulse"
                    />
                ) : seed.status === "success" ? (
                    <CheckCircle fontSize="small" />
                ) : seed.status === "error" ? (
                    <ErrorOutline fontSize="small" />
                ) : (
                    <Downloading fontSize="small" />
                )}
                {seed.status === "loading"
                    ? "Seeding\u2026"
                    : seed.status === "success"
                      ? "Seeded!"
                      : seed.status === "error"
                        ? "Retry"
                        : "Seed Static Pages"}
            </motion.button>
        </div>
    );
}

export default function SitemapPage() {
    return (
        <>
            <SeedBanner />
            <AdminCRUDPage
                title="Sitemap"
                subtitle="Manage sitemap entries for dynamic pages — profiles, projects, blogs, etc."
                apiBase="/api/admin/sitemap"
                idField="SitemapID"
                fields={fields}
                defaultValues={{
                    Priority: 0.5,
                    Frequency: "weekly",
                    Enabled: true
                }}
            />
        </>
    );
}
