/**
 *  @FileID          app\api\(seo)\sitemap\route.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

import { NextResponse } from 'next/server';
import { StaticPages } from './StaticPages';
import { Sitemap_Model } from '@Models/Sitemap';
import dbConnect from '@Utils/dbConnect';
import { Config } from '@Config/index';

const Default_sitemap_Settings = {
    priority: 0.5,
    frequency: 'weekly'
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

function getSitemapIndex(){}
function getSitemap(){}

export async function GET() {
    const baseUrl = 'https://meetbhingradiya.vercel.app';
    const dynamicPages = await fetchDynamicPages();

    const allPages = [...StaticPages, ...dynamicPages];

    const generatedSitemap = SitemapTemplates.SitemapTemplate.replace('@Pages', allPages.map((page) => {
        return `
    <url>
        <loc>${baseUrl}/${page.route? page.route : ""}</loc>
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
