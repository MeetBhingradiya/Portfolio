import { NextResponse } from 'next/server';
import { StaticPages } from './StaticPages';

const defaultPriority = 0.5;
const defaultFrequency = 'weekly';

const fetchDynamicPages = async () => {
    return [
        // { route: 'blog/some-article', priority: 0.5, frequency: 'weekly' },
        // { route: 'projects/some-project', priority: 0.3 }
    ];
};

const SitemapTemplate = 
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
@Pages
</urlset>
`

export async function GET() {
    const baseUrl = 'https://meetbhingradiya.vercel.app';
    const dynamicPages = await fetchDynamicPages();

    const allPages = [...StaticPages, ...dynamicPages];

    const generatedSitemap = SitemapTemplate.replace('@Pages', allPages.map((page) => {
        return `
    <url>
        <loc>${baseUrl}/${page.route? page.route : ""}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${page.frequency ? page.frequency : defaultFrequency}</changefreq>
        <priority>${page.priority ? page.priority : defaultPriority}</priority>
    </url>
        `;
    }).join(''));

    return new NextResponse(generatedSitemap, {
        headers: { 'Content-Type': 'text/xml' }
    });
}
