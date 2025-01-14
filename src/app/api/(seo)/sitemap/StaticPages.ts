/**
 *  @FileID          app\api\(seo)\sitemap\StaticPages.ts
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

export const StaticPages: Array<{
    route: string;
    priority?: number;
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
}> = [
    {
        route: '',
        priority: 1.0,
        frequency: "daily",
    },
    {
        route: 'Tools',
        priority: 0.8,
        frequency: "weekly",
    },
    {
        route: 'Tools/QR',
        priority: 0.8,
        frequency: "weekly",
    }
];