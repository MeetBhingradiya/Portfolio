/**
 *  @FileID          Config\index.ts
 *  @Description     configuration settings for the project.
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
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.9
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 */


const Config = {
    version: "v1.0.9",
    releasedate: "2025-2-16",
    visiblebranch: "Development",
    isHomeReleased: true,
    Environment: process.env.NODE_ENV,
    GoogleADS: false,
    WhiteListedDomains: [
        "meetbhingradiya.tech",
        // "meetbhingradiya.vercel.app",
        // "admin.meetbhingradiya.tech",
        "stage.meetbhingradiya.tech",
        "dev.meetbhingradiya.tech",
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
    ],
    VercelSpeedInsight: true
}

export { Config };