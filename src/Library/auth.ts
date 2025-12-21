/**
 * Better Auth Configuration
 * Authentication setup for the portfolio application
 */

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// Skip database initialization during build time
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

// MongoDB client setup
let dbAdapter: any = undefined;
if (!isBuildTime && process.env.MONGODB_01) {
    const client = new MongoClient(process.env.MONGODB_01);
    const db = client.db("PRODUCTION_MeetBhingradiya");
    dbAdapter = mongodbAdapter(db, { client });
}

export const auth = betterAuth({
    database: dbAdapter,

    // Email and password authentication
    emailAndPassword: {
        enabled: true,
    },

    // Social providers configuration
    socialProviders: {
        google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            }
            : undefined,

        github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
            ? {
                clientId: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
            }
            : undefined,

        discord: process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
            ? {
                clientId: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET,
            }
            : undefined,
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
    },

    // Base URL and secret
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET!,

    // CORS and trusted origins configuration
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        process.env.BETTER_AUTH_URL,
        process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean) as string[],

    // Advanced security options
    advanced: {
        crossSubDomainCookies: {
            enabled: false
        },
        useSecureCookies: process.env.NODE_ENV === "production",
    }
});

// Export helper functions
export const getSession = async (headers: Headers) => {
    return await auth.api.getSession({ headers });
};

export const requireAuth = async (headers: Headers) => {
    const session = await getSession(headers);
    if (!session) {
        throw new Error("Unauthorized");
    }
    return session;
};

export default auth;
