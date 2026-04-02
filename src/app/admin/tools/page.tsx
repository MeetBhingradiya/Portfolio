"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDesignTheme } from "@Hooks";
import { PAPERKNIFE_TOOLS, PAPERKNIFE_CATEGORIES } from "@/app/tools/paperknife/_lib/toolRegistry";

export default function AdminToolsPage() {
  const { palette, actualColorMode } = useDesignTheme();
  const isDark = actualColorMode === "dark";

  const grouped = useMemo(() => {
    return PAPERKNIFE_CATEGORIES.map((category) => ({
      category,
      tools: PAPERKNIFE_TOOLS.filter((tool) => tool.category === category),
    }));
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl border p-6" style={{ borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: palette.textPrimary }}>Admin Tools: PaperKnife</h1>
        <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
          Quick admin launcher for all integrated PaperKnife tools in this Next.js project.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/tools/paperknife" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest" style={{ background: palette.accent, color: "#fff" }}>
            Open User Hub
          </Link>
          <Link href="/admin/tool-settings" className="rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-widest" style={{ borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)", color: palette.textPrimary }}>
            Visibility Settings
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {grouped.map((section) => (
          <section key={section.category}>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider" style={{ color: palette.textSecondary }}>{section.category}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/paperknife/${tool.slug}`}
                  className="rounded-2xl border p-4 transition hover:-translate-y-0.5"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", background: isDark ? "rgba(255,255,255,0.02)" : "#fff" }}
                >
                  <h3 className="text-sm font-black" style={{ color: palette.textPrimary }}>{tool.title}</h3>
                  <p className="mt-1 text-xs" style={{ color: palette.textSecondary }}>{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
