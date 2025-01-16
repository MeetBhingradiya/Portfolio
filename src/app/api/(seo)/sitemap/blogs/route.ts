import { NextRequest, NextResponse } from "next/server";
import { StaticPages } from "../StaticPages";

const Default_sitemap_Settings = {
    priority: 0.5,
    frequency: 'weekly'
}

const SitemapTemplate =
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
@Pages
</urlset>
`

const SitemapIndexTemplate =
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@Sitemaps
</sitemapindex>
`

const SitemapIndexItemTemplate =
    `
<sitemap>
<loc>@Endpoint</loc>
</sitemap>
`

const SitemapItemTemplate =
    `
<url>
<loc>@Endpoint</loc>
<lastmod>@Timestemp</lastmod>
<changefreq>@Frequency</changefreq>
<priority>@Priority</priority>
</url>
`

const SitemapTemplates = {
    SitemapTemplate,
    SitemapIndexTemplate,
    SitemapIndexItemTemplate,
    SitemapItemTemplate
}

export async function GET(req: NextRequest) {
    const URL_ = req.headers.get('x-url');
    const baseUrl = new URL(URL_ as string).origin;

    const allPages = [...StaticPages];

    const generatedSitemap = SitemapTemplates.SitemapTemplate.replace('@Pages', allPages.map((page) => {
        return `
    <url>
        <loc>${baseUrl}/${page.route ? page.route : ""}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${page.frequency ? page.frequency : Default_sitemap_Settings.frequency}</changefreq>
        <priority>${page.priority ? page.priority : Default_sitemap_Settings.priority}</priority>
    </url>
        `;
    }).join(''));

    return new NextResponse(generatedSitemap, {
        headers: { 'Content-Type': 'text/xml' }
    });
}