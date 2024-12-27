import { NextResponse } from 'next/server';
import { StaticPages } from './StaticPages';
import { Sitemap_Model } from '@Models/Sitemap';
import dbConnect from '@Utils/dbConnect';

const defaultPriority = 0.5;
const defaultFrequency = 'weekly';

const fetchDynamicPages = async () => {
    await dbConnect();
    const dynamicPages = await Sitemap_Model.find({ Enabled: true });
    return dynamicPages.map((page) => {
        return {
            route: page.Endpoint,
            priority: page.Priority,
            frequency: page.Frequency
        };
    });
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
