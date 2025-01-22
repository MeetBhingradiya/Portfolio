/**
 *  @FileID          app\api\(seo)\sitemap\route.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last sUpdated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 22/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */


import { NextResponse, NextRequest } from 'next/server';
import { StaticPages } from './StaticPages';
import { Sitemap_Model } from '@Models/Sitemap';
import dbConnect from '@Utils/dbConnect';
import { Config } from '@Config/index';
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
