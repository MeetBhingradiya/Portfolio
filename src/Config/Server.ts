import { Server_Config_Type } from "./type";

const FALLBACK_DATABASE_NAME = "app";

function resolveDatabaseName(): string {
    const explicit = process.env.DATABASE_NAME?.trim();
    if (explicit) return explicit;

    const rawUri = process.env.MONGODB_01?.trim().replace(/^['\"]|['\"]$/g, "");
    if (!rawUri) return FALLBACK_DATABASE_NAME;

    try {
        const parsed = new URL(rawUri);
        const fromPath = parsed.pathname.replace(/^\/+/, "").trim();
        if (fromPath) return decodeURIComponent(fromPath);
    } catch {
        // Keep fallback when URI parsing fails.
    }

    return FALLBACK_DATABASE_NAME;
}

export const Config: Server_Config_Type = {
    Environment: process.env.NODE_ENV === "production" ? "production" : "development",
    Database: {
        Name: resolveDatabaseName()
    },
    Immich_Endpoints: {
        Mobile_Redirect: "/api/oauth/mobile-redirect",
        Authorization: "/auth/login",
        User_Settings: "/user-settings"
    },
    Immich_Origins: [
        "https://photos.meetbhingradiya.in",
        "https://photos.meetbhingradiya.shop",
        "https://home-desktop.tail1c91d0.ts.net",
        "http://bfamily.myftp.org:2283"
    ]
};
