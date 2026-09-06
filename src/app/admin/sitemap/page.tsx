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
                    msg: json.message ?? "Seeded all static & new pages successfully."
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

    const bannerBg = isApple
        ? isDark
            ? "linear-gradient(135deg, rgba(36, 36, 40, 0.75) 0%, rgba(28, 28, 30, 0.8) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(245, 245, 247, 0.75) 100%)"
        : isDark
          ? "rgba(24,24,28,0.95)"
          : "#fff";

    const borderColor = isApple
        ? isDark
            ? "rgba(255, 255, 255, 0.15)"
            : "rgba(255, 255, 255, 0.8)"
        : isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.08)";

    const shadowStyle = isApple
        ? isDark
            ? "0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 8px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
        : "0 4px 16px rgba(0,0,0,0.04)";

    return (
        <div
            className="flex items-center justify-between gap-4 flex-wrap px-6 py-5 rounded-2xl mb-6 transition-all"
            style={{
                background: bannerBg,
                border: `1px solid ${borderColor}`,
                boxShadow: shadowStyle,
                backdropFilter: isApple ? "blur(30px) saturate(190%)" : "none",
                WebkitBackdropFilter: isApple ? "blur(30px) saturate(190%)" : "none",
                borderRadius: isApple ? "20px" : "16px"
            }}>
            <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold tracking-tight" style={{ color: palette.textPrimary }}>
                        Seed Static & New Pages
                    </span>
                    <span
                        className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full"
                        style={{
                            background: isApple ? "rgba(0, 122, 255, 0.12)" : `${palette.accent}20`,
                            color: palette.accent
                        }}>
                        Apple Theme Ready
                    </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: palette.textSecondary }}>
                    One-click bulk sync of all system routes (Shop, Support, Trade Journal, Productivity & Paperknife Tools, Auth, Settings, Main pages).
                </p>
                {seed.msg && (
                    <div
                        className="text-xs mt-2 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg inline-flex"
                        style={{
                            background: seed.status === "success" ? "rgba(52,199,89,0.12)" : "rgba(255,59,48,0.12)",
                            color: seed.status === "success" ? "#34C759" : "#FF3B30"
                        }}>
                        {seed.status === "success" ? <CheckCircle style={{ fontSize: 14 }} /> : <ErrorOutline style={{ fontSize: 14 }} />}
                        <span>{seed.msg}</span>
                    </div>
                )}
            </div>
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={seed.status === "loading"}
                onClick={handleSeed}
                className="flex items-center gap-2.5 px-5 py-3 text-sm font-bold shrink-0 transition-all"
                style={{
                    background: isApple
                        ? seed.status === "success"
                            ? "linear-gradient(135deg, #34C759 0%, #28A745 100%)"
                            : seed.status === "error"
                              ? "linear-gradient(135deg, #FF3B30 0%, #D70015 100%)"
                              : "linear-gradient(135deg, #007AFF 0%, #0051A8 100%)"
                        : seed.status === "success"
                          ? "#34C759"
                          : seed.status === "error"
                            ? "#FF3B30"
                            : palette.accent,
                    color: "#FFFFFF",
                    boxShadow: isApple
                        ? seed.status === "success"
                            ? "0 4px 16px rgba(52, 199, 89, 0.35)"
                            : seed.status === "error"
                              ? "0 4px 16px rgba(255, 59, 48, 0.35)"
                              : "0 4px 16px rgba(0, 122, 255, 0.35)"
                        : "none",
                    borderRadius: isApple ? "9999px" : "12px",
                    opacity: seed.status === "loading" ? 0.7 : 1,
                    cursor: seed.status === "loading" ? "not-allowed" : "pointer"
                }}>
                {seed.status === "loading" ? (
                    <Downloading fontSize="small" className="animate-spin" />
                ) : seed.status === "success" ? (
                    <CheckCircle fontSize="small" />
                ) : seed.status === "error" ? (
                    <ErrorOutline fontSize="small" />
                ) : (
                    <Downloading fontSize="small" />
                )}
                {seed.status === "loading"
                    ? "Seeding New Pages…"
                    : seed.status === "success"
                      ? "Seeded All Pages!"
                      : seed.status === "error"
                        ? "Retry Seeding"
                        : "Seed New Pages"}
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
