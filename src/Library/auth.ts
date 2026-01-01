/**
 * Better Auth Configuration
 * Authentication setup for the portfolio application
 */

import { betterAuth } from "better-auth";
import { GoogleOptions } from "better-auth/social-providers";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username, multiSession } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
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

    // Plugins configuration
    plugins: [
        username({
            minUsernameLength: 3,
            maxUsernameLength: 30,
        }),
        twoFactor({
            issuer: "Meet Bhingradiya Portfolio",
        }),
        passkey({
            rpName: "Meet Bhingradiya Portfolio",
            rpID: process.env.NODE_ENV === "production"
                ? "meetbhingradiya.shop"
                : "localhost",
            origin: process.env.NODE_ENV === "production"
                ? process.env.BETTER_AUTH_URL || "https://meetbhingradiya.shop"
                : "http://localhost:3000",
        }),
        multiSession(),
    ],

    // Social providers configuration
    socialProviders: {
        google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                prompt: "select_account",
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                mapProfileToUser: (profile) => {
                    console.log("🔵 Google profile mapping:", profile);
                    console.log("🔵 Extracted image:", profile.picture);
                    return {
                        name: profile.name,
                        email: profile.email,
                        image: profile.picture,
                        emailVerified: profile.email_verified,
                    };
                },
                // Capture profile data during linking too
                scope: ["email", "profile"],
                // Update user profile on every sign-in
                updateUserOnSignIn: true,
            } as GoogleOptions
            : undefined,

        github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
            ? {
                clientId: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                mapProfileToUser: (profile) => ({
                    name: profile.name || profile.login,
                    image: profile.avatar_url,
                }),
            }
            : undefined,

        microsoft: process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
            ? {
                clientId: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                mapProfileToUser: (profile) => ({
                    name: profile.displayName || profile.name,
                    image: profile.picture,
                }),
            }
            : undefined,

        apple: process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
            ? {
                clientId: process.env.APPLE_CLIENT_ID,
                clientSecret: process.env.APPLE_CLIENT_SECRET,
                mapProfileToUser: (profile: any) => ({
                    name: profile.name || profile.email?.split('@')[0] || "Trash",
                    image: undefined, // Apple doesn't provide profile images
                }),
            }
            : undefined,
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
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
        // Add sameSite settings to help with tracking prevention
        cookieSecure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
    },

    // Account settings
    account: {
        fields: {
            userId: "user_id",
        },
        updateAccountOnSignIn: true,
        encryptOAuthTokens: true,
        storeAccountCookie: true,
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github", "microsoft", "apple"],
            // CRITICAL SECURITY: Block OAuth sign-in if email exists but provider not linked
            // This prevents account takeover if someone's OAuth credentials are exposed
            allowDifferentEmails: false
        }
    },

    // User fields configuration - ensure image is stored
    user: {
        fields: {
            email: "email",
            name: "name",
            image: "image",
            emailVerified: "emailVerified",
        },
        changeEmail: {
            enabled: true,
        },
    },
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
