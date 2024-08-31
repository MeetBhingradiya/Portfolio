import { NextResponse } from 'next/server';

export async function GET() {
    const baseUrl = 'https://meetbhingradiya.vercel.app';

    // List your static and dynamic routes here
    const staticPages = ['', 'about', 'blog', 'projects'].map((route) => {
        return `${baseUrl}/${route}`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticPages
            .map((url) => {
                return `
            <url>
                <loc>${url}</loc>
                <lastmod>${new Date().toISOString()}</lastmod>
                <changefreq>daily</changefreq>
                <priority>0.7</priority>
            </url>
        `;
            })
            .join('')}
    </urlset>`;

    return NextResponse.json(sitemap, { headers: { 'Content-Type': 'text/xml' } });
}
