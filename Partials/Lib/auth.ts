/**
 * Better Auth Configuration
 * Simplified working configuration for migration
 */

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { Config } from "../Config";

// Skip database initialization during build time
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

// MongoDB client setup
let dbAdapter: any = undefined;
if (!isBuildTime && process.env.MONGODB_01) {
    const client = new MongoClient(process.env.MONGODB_01);
    const db = client.db();
    dbAdapter = mongodbAdapter(db, { client });
}

export const auth = betterAuth({
    database: dbAdapter,

    // Email and password authentication
    emailAndPassword: {
        enabled: Config.AuthProviders?.credentials?.enabled !== false,
    },

    // Social providers configuration
    socialProviders: {
        google: Config.AuthProviders?.google?.enabled
            ? {
                clientId: Config.AuthProviders.google.clientId || process.env.GOOGLE_CLIENT_ID!,
                clientSecret: Config.AuthProviders.google.clientSecret || process.env.GOOGLE_CLIENT_SECRET!,
            }
            : undefined,

        github: Config.AuthProviders?.github?.enabled
            ? {
                clientId: Config.AuthProviders.github.clientId || process.env.GITHUB_CLIENT_ID!,
                clientSecret: Config.AuthProviders.github.clientSecret || process.env.GITHUB_CLIENT_SECRET!,
            }
            : undefined,

        discord: Config.AuthProviders?.discord?.enabled
            ? {
                clientId: Config.AuthProviders.discord.clientId || process.env.DISCORD_CLIENT_ID!,
                clientSecret: Config.AuthProviders.discord.clientSecret || process.env.DISCORD_CLIENT_SECRET!,
            }
            : undefined,

        facebook: Config.AuthProviders?.facebook?.enabled
            ? {
                clientId: Config.AuthProviders.facebook.clientId || process.env.FACEBOOK_CLIENT_ID!,
                clientSecret: Config.AuthProviders.facebook.clientSecret || process.env.FACEBOOK_CLIENT_SECRET!,
            }
            : undefined,

        linkedin: Config.AuthProviders?.linkedin?.enabled
            ? {
                clientId: Config.AuthProviders.linkedin.clientId || process.env.LINKEDIN_CLIENT_ID!,
                clientSecret: Config.AuthProviders.linkedin.clientSecret || process.env.LINKEDIN_CLIENT_SECRET!,
            }
            : undefined,
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
    },

    // Base URL and secret
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET!,
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