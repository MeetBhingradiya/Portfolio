import { Protocols } from "./Protocols";

export * from "./RedirectProtocols";

interface IConfig {
    Name: string; // ? vX.X.X Stage | Beta
    DBName?: string;
    version: `v${number}.${number}.${number}${" Stage" | " Beta" | "" | " Alpha"}`; // ? DD/MM/YYYY
    releasedate: `${number}/${number}/${number}`;

    visiblebranch: "Release" | "Development";
    isHomeReleased: boolean;
    Environment: "development" | "production" | "test";
    GoogleADS: boolean;
    VercelSpeedInsight: boolean;
    ReactScan: boolean;
    WhiteListedDomains: string[];
    WhiteListedPlatforms: Array<
        "Microsoft Windows" | "Linux" | "Android" | "iOS" | "MacOS"
    >;
    WhiteListedBrowsers: Array<
        "Chrome" | "Edge" | "Safari" | "Firefox" | "Opera" | "Arc" | "Brave"
    >;
    ThreatIntelligence: Array<
        | "TOR"
        | "VPN"
        | "ICloud-Relay"
        | "Proxy"
        | "Datacenter"
        | "Anonymous"
        | "KnownAttacker"
        | "KnownAbuser"
        | "Threat"
        | "Bogon"
    >;
    Cookie_Prefix: string;
    CORS: {
        Useragent: string;
    };
    DatabaseBydefualt: {
        SignupUsername: string;
    };
    StatusCodes: typeof Protocols;
    Env: {
        ADMIN_SIGNATURE?: string;
        TRACE_SIGNATURE?: string;
        JWT_SECRET?: string;
        NODE_ENV?: "development" | "production" | "test";
        CONTACT_EMAIL?: string;
        IPDATA_WEBSITE_KEY?: string;
        STATE_SIGNATURE?: string;
        APPLICATION_ID?: string;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
        GITHUB_CLIENT_ID?: string;
        GITHUB_CLIENT_SECRET?: string;
        MICROSOFT_CLIENT_ID?: string;
        MICROSOFT_CLIENT_SECRET?: string;
        LINKEDIN_CLIENT_ID?: string;
        LINKEDIN_CLIENT_SECRET?: string;
        FACEBOOK_CLIENT_ID?: string;
        FACEBOOK_CLIENT_SECRET?: string;
        INSTAGRAM_CLIENT_ID?: string;
        INSTAGRAM_CLIENT_SECRET?: string;
        DISCORD_CLIENT_ID?: string;
        DISCORD_CLIENT_SECRET?: string;
    };
    DigitalResume: {
        ExcludingPhone: string;
        IncludingPhone: string;
    };
    ContactOptions: {
        Email: boolean
        Tickets: boolean
        LinkedIn: boolean
        GitHub: boolean
        Resume: boolean
        Calendly: boolean
        Location: boolean
        RSS: boolean
        Timeline: boolean
    }
}

const Config: IConfig = {
    Name: "Meet Bhingradiya",
    version: "v0.0.2 Alpha",
    DBName: `${process.env.NODE_ENV === "production" ? "prod" : "dev"}_meetbhingradiya`,
    releasedate: "19/06/2025",
    visiblebranch: "Release",
    isHomeReleased: true,
    Environment: process.env.NODE_ENV,
    GoogleADS: true,
    VercelSpeedInsight: true,
    ReactScan: false,
    WhiteListedDomains: [
        "meetbhingradiya.tech",
        // "meetbhingradiya.vercel.app",
        // "admin.meetbhingradiya.tech",
        "stage.meetbhingradiya.tech",
        "dev.meetbhingradiya.tech"
        // "dev-meetbhingradiya.vercel.app",
        // "stage-meetbhingradiya.vercel.app",
        // "admin-meetbhingradiya.vercel.app"
    ],
    WhiteListedPlatforms: ["Microsoft Windows", "Linux", "Android", "iOS"],
    WhiteListedBrowsers: ["Chrome", "Edge", "Opera"],
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
        "Bogon"
    ],
    CORS: {
        Useragent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    },
    Cookie_Prefix: "smnetwork_",
    DatabaseBydefualt: {
        SignupUsername: "Anonymous"
    },
    StatusCodes: Protocols,
    Env: {
        ADMIN_SIGNATURE: process.env.ADMIN_SIGNATURE,
        TRACE_SIGNATURE: process.env.TRACE_SIGNATURE,
        JWT_SECRET: process.env.STATE_SIGNATURE,
        NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",
        CONTACT_EMAIL: process.env.CONTACT_EMAIL,
        IPDATA_WEBSITE_KEY: process.env.IPDATA_WEBSITE_KEY,
        STATE_SIGNATURE: process.env.STATE_SIGNATURE,
        APPLICATION_ID: process.env.APPLICATION_ID,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
        MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
        LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
        LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
        FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
        FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
        INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
        INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET
    },
    DigitalResume: {
        ExcludingPhone: "https://rxresu.me/meetbhingradiya/resume",
        IncludingPhone: "https://rxresu.me/meetbhingradiya/resumePlus"
    },
    ContactOptions: {
        Email: true,
        Tickets: true,
        LinkedIn: true,
        GitHub: true,
        Resume: true,
        Calendly: true,
        Location: false,
        RSS: false,
        Timeline: false
    }
};

export { Config };
