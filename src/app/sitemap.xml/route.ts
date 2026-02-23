/**
 * XML Sitemap — /sitemap.xml
 * Submit this URL to Google Search Console:
 *   https://meetbhingradiya.shop/sitemap.xml
 */
import { NextResponse } from "next/server";

const BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://meetbhingradiya.shop");

const routes: { path: string; changefreq: string; priority: string }[] = [
    // Main
    { path: "/",                                     changefreq: "weekly",  priority: "1.0" },
    { path: "/projects",                             changefreq: "weekly",  priority: "0.9" },
    { path: "/blogs",                                changefreq: "daily",   priority: "0.9" },
    { path: "/timeline",                             changefreq: "monthly", priority: "0.7" },
    { path: "/experience",                           changefreq: "monthly", priority: "0.7" },
    { path: "/contact",                              changefreq: "yearly",  priority: "0.7" },
    { path: "/dashboard",                            changefreq: "weekly",  priority: "0.6" },
    { path: "/sitemap",                              changefreq: "monthly", priority: "0.4" },
    // Tools
    { path: "/tools",                                changefreq: "weekly",  priority: "0.8" },
    { path: "/tools/colour",                         changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/encrypt",                        changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/image",                          changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/json",                           changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/jwt",                            changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/markdown",                       changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/password",                       changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/pdf",                            changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/qr",                             changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/regexp",                         changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/todo",                           changefreq: "yearly",  priority: "0.5" },
    { path: "/tools/uuid",                           changefreq: "yearly",  priority: "0.5" },
    // Legal
    { path: "/privacy",                              changefreq: "yearly",  priority: "0.3" },
    { path: "/terms",                                changefreq: "yearly",  priority: "0.3" },
    { path: "/agreements/security",                  changefreq: "yearly",  priority: "0.3" },
    { path: "/agreements/covered-products-privacy",  changefreq: "yearly",  priority: "0.3" },
    { path: "/agreements/covered-products-terms",    changefreq: "yearly",  priority: "0.3" },
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
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        },
    });
}
