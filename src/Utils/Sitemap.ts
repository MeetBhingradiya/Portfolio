/**
 *  @file        Utils\Sitemap.ts
 *  @description No description available for Utils\Sitemap.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */

/**
 * Generates the XML header for the sitemap.
 * @param data - The XML content to wrap.
 * @returns The XML-wrapped string.
 */
export function XMLWrap(data: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${data}`;
}

/**
 * Wraps a set of URLs in a sitemap `<urlset>` tag.
 * @param data - The combined URL items as a string.
 * @returns The `<urlset>` wrapped string.
 */
export function SitemapURLSetWrap(data: string): string {
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
export function SitemapIndexWrap(data: string): string {
    return `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${data}
</sitemapindex>`;
}

/**
 * Generates a single sitemap index item.
 * @param endpoint - The URL of the sitemap index item.
 * @returns The generated `<sitemap>` string.
 */
export function SitemapIndexItemWrap(endpoint: string): string {
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
export function SitemapItemWrap({
    endpoint,
    lastmod = new Date().toISOString(),
    frequency = 'weekly',
    priority = 0.5,
    alternates = []
}: {
    endpoint: string;
    lastmod?: string | Date;
    frequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
    alternates?: { lang: string; url: string }[];
}): string {
    if (!endpoint) throw new Error('Endpoint is required for SitemapItemWrap.');

    const alternateLinks = alternates
        .map(
            ({ lang, url }) =>
                `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`
        )
        .join('\n');

    return `<url>
<loc>${endpoint}</loc>
<lastmod>${lastmod instanceof Date ? lastmod.toISOString() : lastmod}</lastmod>
<changefreq>${frequency}</changefreq>
<priority>${priority}</priority>
${alternateLinks}
</url>`;
}

/**
 * Combines multiple sitemap items into a single sitemap URL set.
 * @param items - Array of sitemap items as strings.
 * @returns The complete `<urlset>` wrapped sitemap.
 */
export function generateSitemap(items: string[]): string {
    const content = items.join('\n');
    return XMLWrap(SitemapURLSetWrap(content));
}

/**
 * Combines multiple sitemap index items into a single sitemap index.
 * @param items - Array of sitemap index items as strings.
 * @returns The complete `<sitemapindex>` wrapped sitemap index.
 */
export function generateSitemapIndex(items: string[]): string {
    const content = items.join('\n');
    return XMLWrap(SitemapIndexWrap(content));
}