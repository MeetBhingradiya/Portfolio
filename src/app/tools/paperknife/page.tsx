"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDesignTheme } from "@Hooks";
import { PAPERKNIFE_CATEGORIES, PAPERKNIFE_TOOLS } from "./_lib/toolRegistry";

type VisibilityEntry = {
    toolId: string;
    enabled: boolean;
    featured: boolean;
    publicAccess: boolean;
};

export default function PaperKnifeHomePage() {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const [visibility, setVisibility] = useState<VisibilityEntry[]>([]);

    useEffect(() => {
        fetch("/api/tools/visibility")
            .then((r) => r.json())
            .then((json) => {
                if (json.success && Array.isArray(json.visibility)) {
                    setVisibility(json.visibility);
                }
            })
            .catch(() => {
                // Keep all tools visible if visibility API fails.
            });
    }, []);

    const isVisible = (toolId: string) => {
        const found = visibility.find((v) => v.toolId === toolId);
        const vis = found ?? {
            enabled: true,
            featured: false,
            publicAccess: true
        };
        return vis.enabled && vis.publicAccess;
    };

    const rootVisible = isVisible("paperknife");

    const grouped = useMemo(() => {
        return PAPERKNIFE_CATEGORIES.map((category) => ({
            category,
            tools: PAPERKNIFE_TOOLS.filter((tool) => tool.category === category).filter((tool) => isVisible(`paperknife-${tool.slug}`))
        }));
    }, [visibility]);

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div
                className="mb-8 rounded-3xl border p-6"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                }}>
                <h1
                    className="text-3xl font-black tracking-tight"
                    style={{ color: palette.textPrimary }}>
                    PaperKnife Tools
                </h1>
                <p
                    className="mt-2 text-sm"
                    style={{ color: palette.textSecondary }}>
                    Full local PDF toolbox ported into this Next.js app. Files are processed client-side in your browser.
                </p>
            </div>

            {!rootVisible && (
                <div
                    className="mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                        color: palette.textSecondary
                    }}>
                    PaperKnife is currently disabled by admin settings.
                </div>
            )}

            {rootVisible && (
                <div className="space-y-8">
                    {grouped.map((section) => (
                        <section key={section.category}>
                            <h2
                                className="mb-3 text-lg font-black"
                                style={{ color: palette.textPrimary }}>
                                {section.category}
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {section.tools.map((tool) => {
                                    const Icon = tool.icon;
                                    return (
                                        <Link
                                            key={tool.slug}
                                            href={`/tools/paperknife/${tool.slug}`}
                                            className="rounded-2xl border p-4 transition hover:-translate-y-0.5"
                                            style={{
                                                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                                                background: isDark ? "rgba(255,255,255,0.02)" : "#fff"
                                            }}>
                                            <div
                                                className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                                                style={{
                                                    background: palette.accentSubtle,
                                                    color: palette.accent
                                                }}>
                                                <Icon size={18} />
                                            </div>
                                            <h3
                                                className="text-sm font-black"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {tool.title}
                                            </h3>
                                            <p
                                                className="mt-1 text-xs"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {tool.description}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </main>
    );
}
