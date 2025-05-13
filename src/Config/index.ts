/**
 *  @FileID          Config/index.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 11/04/25 4:27 PM IST (Kolkata +5:30 UTC)
 */

import { Protocols } from "./Protocols";

export * from "./RedirectProtocols";

interface IConfig {
    Name: string;

    // ? vX.X.X Stage | Beta
    version: `v${number}.${number}.${number}${" Stage" | " Beta" | ""}`;

    // ? YYYY-MM-DD
    releasedate: `${number}-${number}-${number}`;

    visiblebranch: "Release" | "Development";
    isHomeReleased: boolean;
    Environment: "development" | "production" | "test";
    GoogleADS: boolean;
    VercelSpeedInsight: boolean;
    ReactScan: boolean;
    WhiteListedDomains: string[];
    WhiteListedPlatforms: Array<"Windows" | "Linux" | "Android" | "iOS" | "MacOS">;
    WhiteListedBrowsers: Array<"Chrome" | "Edge" | "Safari" | "Firefox" | "Opera" | "Arc" | "Brave">;
    ThreatIntelligence: Array<"TOR" | "VPN" | "ICloud-Relay" | "Proxy" | "Datacenter" | "Anonymous" | "KnownAttacker" | "KnownAbuser" | "Threat" | "Bogon">;
    Cookie_Prefix: string;
    CORS: {
        Useragent: string;
    }
    DatabaseBydefualt: {
        SignupUsername: string
    }
    StatusCodes: typeof Protocols
    Env: {
        ADMIN_SIGNATURE?: string
        TRACE_SIGNATURE?: string
        NODE_ENV?: "development" | "production" | "test"
        CONTACT_EMAIL?: string
        IPDATA_WEBSITE_KEY?: string
        STATE_SIGNATURE?: string
        APPLICATION_ID?: string
    };
}


const Config: IConfig = {
    Name: "Meet Bhingradiya",
    version: "v1.1.0",
    releasedate: "2025-04-01",
    visiblebranch: "Release",
    isHomeReleased: true,
    Environment: process.env.NODE_ENV,
    GoogleADS: false,
    VercelSpeedInsight: false,
    ReactScan: false,
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
        "Android"
    ],
    WhiteListedBrowsers: [
        "Chrome",
        "Edge",
        "Opera"
    ],
    ThreatIntelligence: [
        "TOR",
        "VPN",
        "ICloud-Relay",
        // "Proxy",
        // "Datacenter",
        // "Anonymous",
        "KnownAttacker",
        "KnownAbuser",
        "Threat",
        "Bogon",
    ],
    CORS: {
        Useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    },
    Cookie_Prefix: "smnetwork_",
    DatabaseBydefualt: {
        SignupUsername: "Anonymous"
    },
    StatusCodes: Protocols,
    Env: {
        ADMIN_SIGNATURE: process.env.ADMIN_SIGNATURE,
        TRACE_SIGNATURE: process.env.TRACE_SIGNATURE,
        NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",
        CONTACT_EMAIL: process.env.CONTACT_EMAIL,
        IPDATA_WEBSITE_KEY: process.env.IPDATA_WEBSITE_KEY,
        STATE_SIGNATURE: process.env.STATE_SIGNATURE
    }
}

export { Config };