import { NextResponse } from 'next/server';

export async function GET() {
    const content = `
        User-agent: *
        Allow: /
        Sitemap: https://meetbhingradiya.vercel.app/api/sitemap
    `;

    return NextResponse.json(content, { headers: { 'Content-Type': 'text/plain' } });
}
