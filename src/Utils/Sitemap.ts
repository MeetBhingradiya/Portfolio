/**
 *  @FileID          Utils\Sitemap.ts
 *  @Description     utility functions for generating sitemaps.
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


import { config } from "process";

/**
 * Generates the XML header for the sitemap.
 * @param data - The XML content to wrap.
 * @returns The XML-wrapped string.
 */
function XMLWrap(data: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${data}`;
}

/**
 * Wraps a set of URLs in a sitemap `<urlset>` tag.
 * @param data - The combined URL items as a string.
 * @returns The `<urlset>` wrapped string.
 */
function SitemapURLSetWrap(data: string): string {
    return `<urlset 
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
    xmlns:xhtml="http://www.w3.org/1999/xhtml">
${data}
</urlset>`;
}

/**
 * Wraps a set of sitemap indices in a `<sitemapindex>` tag.
 * @param data - The combined sitemap index items as a string.
 * @returns The `<sitemapindex>` wrapped string.
 */
function SitemapIndexWrap(data: string): string {
    return `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${data}
</sitemapindex>`;
}

/**
 * Generates a single sitemap index item.
 * @param endpoint - The URL of the sitemap index item.
 * @returns The generated `<sitemap>` string.
 */
function SitemapIndexItemWrap(endpoint: string): string {
    if (!endpoint) throw new Error('Endpoint is required for SitemapIndexItemWrap.');
    return `<sitemap>
<loc>${endpoint}</loc>
</sitemap>`;
}

/**
 * Generates a single URL item for the sitemap.
 * @param params - The parameters for the URL item.
 * @returns The generated `<url>` string.
 */
function SitemapItemWrap({
    endpoint,
    lastmod,
    frequency,
    priority,
    alternates,
    config
}: {
    /**
     * The URL of the sitemap item.
     */
    endpoint: string;
    /**
     * The last modified date of the sitemap item.
     */
    lastmod?: string | Date;
    /**
     * The frequency of the sitemap item.
     * @example "always", "hourly", "daily", "weekly", "monthly", "yearly", "never"
     */
    frequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    /**
     * The priority of the sitemap item.
     */
    priority?: number;
    /**
     * The alternate links for the sitemap item.
     */
    alternates?: { lang: string; url: string }[];
    /**
     * Configuration options for the sitemap item.
     */
    config?: {
        /**
         * Automatically set the priority based on the frequency.
         * ! Requires the `frequency` parameter to be set.
         * ! Overrides the `priority` parameter.
         */
        autoPriority?: boolean;
    }
}): string {
    if (!endpoint) throw new Error("Endpoint is required for SitemapItemWrap.");

    const alternateLinks = alternates
        ?.map(
            ({ lang, url }) =>
                `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`
        )
        .join("\n");

    let sitemapItem = `<url>\n<loc>${endpoint}</loc>\n`;

    if (lastmod) {
        sitemapItem += `<lastmod>${lastmod instanceof Date ? lastmod.toISOString() : lastmod
            }</lastmod>\n`;
    }
    if (frequency) {
        sitemapItem += `<changefreq>${frequency}</changefreq>\n`;
    }
    if (priority !== undefined) {
        sitemapItem += `<priority>${priority}</priority>\n`;
    }
    if (config?.autoPriority) {
        sitemapItem += `<priority>${getPriority(frequency!)}</priority>\n`;
    }
    if (alternateLinks) {
        sitemapItem += `${alternateLinks}\n`;
    }

    sitemapItem += `</url>`;

    return sitemapItem;
}


/**
 * Combines multiple sitemap items into a single sitemap URL set.
 * @param items - Array of sitemap items as strings.
 * @returns The complete `<urlset>` wrapped sitemap.
 */
function generateSitemap(items: string[]): string {
    const content = items.join('\n');
    return XMLWrap(SitemapURLSetWrap(content));
}

/**
 * Combines multiple sitemap index items into a single sitemap index.
 * @param items - Array of sitemap index items as strings.
 * @returns The complete `<sitemapindex>` wrapped sitemap index.
 */
function generateSitemapIndex(items: string[]): string {
    const content = items.join('\n');
    return XMLWrap(SitemapIndexWrap(content));
}

type Frequency =
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";

function getPriority(frequency: Frequency): number {
    const priorityMap: Record<Frequency, number> = {
        always: 1.0,
        hourly: 0.9,
        daily: 0.8,
        weekly: 0.6,
        monthly: 0.4,
        yearly: 0.2,
        never: 0.0,
    };

    return priorityMap[frequency];
}

interface EndpointFrequency {
    route: string
    frequency: Frequency
}

interface RoutePriority {
    route: string
    priority: number
    frequency: Frequency
}

function mapEndpointsToPriorities(endpoints: EndpointFrequency[]): RoutePriority[] {
    return endpoints.map(({ route, frequency }) => ({
        route,
        priority: getPriority(frequency),
        frequency,
    }));
}

export {
    generateSitemap,
    generateSitemapIndex,
    SitemapItemWrap,
    SitemapIndexItemWrap,
    mapEndpointsToPriorities,
    getPriority,
}

export type {
    EndpointFrequency,
    RoutePriority,
    Frequency
}