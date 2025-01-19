/**
 *  @FileID          Config\index.ts
 *  @Description     configuration settings for the project.
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
 *  @modified 19/01/25 9:44 AM IST (Kolkata +5:30 UTC)
 */

const Config = {
    version: "1.0.7",
    releasedate: "2025-1-30",
    visiblebranch: "Development",
    isHomeReleased: true,
    Environment: process.env.NODE_ENV,
    GoogleADS: false,
    WhiteListedDomains: [
        // "admin.meetbhingradiya.tech",
        "stage.meetbhingradiya.tech",
        "dev.meetbhingradiya.tech",
        "meetbhingradiya.tech",
        // "meetbhingradiya.vercel.app",
        // "dev-meetbhingradiya.vercel.app",
        // "stage-meetbhingradiya.vercel.app",
        // "admin-meetbhingradiya.vercel.app"
    ],
    WhiteListedPlatforms: [
        "Windows",
        "Linux",
        "Android",
        // "iOS",
        // "MacOS"
    ]
}

export { Config };