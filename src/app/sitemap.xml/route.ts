/**
 * XML Sitemap — /sitemap.xml
 * Submit this URL to Google Search Console:
 *   https://meetbhingradiya.in/sitemap.xml
 */
import { NextResponse } from "next/server";
import { Config } from "@Config/Client";

const BASE_URL = Config.Origin;

const routes: { path: string; changefreq: string; priority: string }[] = [
    // Main
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/projects", changefreq: "weekly", priority: "0.9" },
    { path: "/blogs", changefreq: "daily", priority: "0.9" },
    { path: "/timeline", changefreq: "monthly", priority: "0.7" },
    { path: "/experience", changefreq: "monthly", priority: "0.7" },
    { path: "/contact", changefreq: "yearly", priority: "0.7" },
    { path: "/dashboard", changefreq: "weekly", priority: "0.6" },
    { path: "/profile", changefreq: "weekly", priority: "0.6" },
    { path: "/sitemap", changefreq: "monthly", priority: "0.4" },

    // Tools
    { path: "/tools", changefreq: "weekly", priority: "0.8" },
    { path: "/tools/colour", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/encrypt", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/image", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/json", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/jwt", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/markdown", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/password", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/pdf", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/qr", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/regexp", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/todo", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/uuid", changefreq: "yearly", priority: "0.5" },
    { path: "/tools/instagram", changefreq: "yearly", priority: "0.5" },

    // Productivity Tools
    { path: "/tools/productivity", changefreq: "weekly", priority: "0.7" },
    {
        path: "/tools/productivity/tasks",
        changefreq: "weekly",
        priority: "0.6"
    },
    {
        path: "/tools/productivity/habits",
        changefreq: "weekly",
        priority: "0.6"
    },
    {
        path: "/tools/productivity/goals",
        changefreq: "weekly",
        priority: "0.6"
    },
    {
        path: "/tools/productivity/reminders",
        changefreq: "weekly",
        priority: "0.6"
    },

    // Trade Journal
    { path: "/trade-journal", changefreq: "weekly", priority: "0.7" },
    { path: "/trade-journal/new", changefreq: "weekly", priority: "0.6" },
    { path: "/trade-journal/analytics", changefreq: "weekly", priority: "0.6" },

    // Shop / Commerce
    { path: "/shop", changefreq: "weekly", priority: "0.8" },
    { path: "/shop/cart", changefreq: "weekly", priority: "0.6" },
    { path: "/shop/checkout", changefreq: "weekly", priority: "0.6" },
    { path: "/shop/orders", changefreq: "weekly", priority: "0.6" },
    { path: "/shop/refunds", changefreq: "weekly", priority: "0.6" },

    // Support
    { path: "/support", changefreq: "weekly", priority: "0.7" },
    { path: "/support/tickets", changefreq: "weekly", priority: "0.6" },
    { path: "/support/tickets/new", changefreq: "weekly", priority: "0.6" },

    // Employee
    { path: "/employee", changefreq: "weekly", priority: "0.6" },

    // Settings
    { path: "/settings", changefreq: "monthly", priority: "0.6" },
    { path: "/settings/profile", changefreq: "monthly", priority: "0.6" },
    {
        path: "/settings/linked-accounts",
        changefreq: "monthly",
        priority: "0.6"
    },
    { path: "/settings/security", changefreq: "monthly", priority: "0.6" },
    {
        path: "/settings/security/passkeys",
        changefreq: "monthly",
        priority: "0.5"
    },
    {
        path: "/settings/security/sessions",
        changefreq: "monthly",
        priority: "0.5"
    },
    {
        path: "/settings/security/two-factor",
        changefreq: "monthly",
        priority: "0.5"
    },
    { path: "/settings/cdn", changefreq: "monthly", priority: "0.5" },

    // Legal
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
    { path: "/agreements/security", changefreq: "yearly", priority: "0.3" },
    {
        path: "/agreements/covered-products-privacy",
        changefreq: "yearly",
        priority: "0.3"
    },
    {
        path: "/agreements/covered-products-terms",
        changefreq: "yearly",
        priority: "0.3"
    },

    // System
    { path: "/maintenance", changefreq: "yearly", priority: "0.2" },
    { path: "/immich-sso", changefreq: "yearly", priority: "0.2" }
];

export const dynamic = "force-dynamic";

export async function GET() {
    const now = new Date().toISOString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
    .map(
        ({ path, changefreq, priority }) => `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n")}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"
        }
    });
}
