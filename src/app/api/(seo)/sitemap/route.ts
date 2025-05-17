import { NextResponse, NextRequest } from 'next/server';
import { StaticPages } from './StaticPages';
import { Sitemap_Model } from '@Models/Sitemap';
import dbConnect from '@Utils/dbConnect';
import { Config } from '@Config';
import { Frequency, generateSitemap, SitemapItemWrap } from '@Utils/Sitemap';

const Default_sitemap_Settings = {
    priority: 0.3,
    frequency: 'monthly'
}

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

export async function GET(req: NextRequest) {
    const URL_ = req.headers.get('x-url');
    const baseUrl = new URL(URL_ as string).origin;
    const dynamicPages = await fetchDynamicPages();

    const allPages = [...StaticPages, ...dynamicPages];

    const Items = allPages.map((page) => {
        return SitemapItemWrap({
            endpoint: `${baseUrl}/${page.route ? page.route : ""}`,
            lastmod: new Date().toISOString(),
            frequency: page.frequency ? page.frequency : Default_sitemap_Settings.frequency as Frequency,
            priority: page.priority ? page.priority : Default_sitemap_Settings.priority,
            alternates: []
        });
    })

    const generatedSitemap = generateSitemap(Items);

    return new NextResponse(generatedSitemap, {
        headers: { 'Content-Type': 'text/xml' }
    });
}
