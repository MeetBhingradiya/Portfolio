/**
 *  @FileID          app\api\(seo)\robots\route.ts
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

export async function GET() {
    const content = `
        User-agent: *
        Allow: /
        Sitemap: https://meetbhingradiya.vercel.app/api/sitemap
    `;

    return NextResponse.json(content, { headers: { 'Content-Type': 'text/plain' } });
}
