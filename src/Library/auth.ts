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
import { Config } from "@Config/Client";

// Skip database initialization during build time
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

// MongoDB client setup
let dbAdapter: any = undefined;
if (!isBuildTime && process.env.MONGODB_01) {
    try {
        const client = new MongoClient(process.env.MONGODB_01);
        const db = client.db("PRODUCTION_MeetBhingradiya");

        // Disable transactions for standalone MongoDB (local dev).
        // Transactions require a replica set; Atlas in production supports them.
        const isLocalMongo = process.env.MONGODB_01.includes("localhost") || process.env.MONGODB_01.includes("127.0.0.1");
        dbAdapter = mongodbAdapter(db, { client, transaction: !isLocalMongo });
        console.log("✅ MongoDB adapter initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize MongoDB adapter:", error);
        throw new Error("Database connection failed. Please ensure MongoDB is running.");
    }
} else if (!isBuildTime) {
    console.warn("⚠️ MONGODB_01 environment variable not set");
}

export const auth = betterAuth({
    database: dbAdapter,

    // Email and password authentication
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to false for OAuth compatibility
        // OAuth users are auto-verified via their provider
        disableSignUp: false, // Allow sign-up for email/password users
        autoSignIn: true, // Auto sign-in after sign-up
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
            rpID: "meetbhingradiya.shop",
            origin: Config.Origin,
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
                scope: ["email", "profile", "openid"],
                // Override getUserInfo to always fetch from the userinfo endpoint.
                // Decoding the id_token alone omits `picture` in some flows.
                getUserInfo: async (token) => {
                    let profile: Record<string, any> | null = null;

                    // 1. Prefer the userinfo endpoint (always includes `picture`)
                    if (token.accessToken) {
                        try {
                            const res = await fetch(
                                "https://www.googleapis.com/oauth2/v3/userinfo",
                                { headers: { Authorization: `Bearer ${token.accessToken}` } }
                            );
                            if (res.ok) profile = await res.json();
                        } catch (e) {
                            console.error("[Google] Failed to fetch userinfo:", e);
                        }
                    }

                    // 2. Fallback: decode id_token
                    if (!profile && token.idToken) {
                        const { decodeJwt } = await import("jose");
                        profile = decodeJwt(token.idToken) as Record<string, any>;
                    }

                    if (!profile) return null;

                    const picture: string | null = profile.picture ?? null;
                    return {
                        user: {
                            id: profile.sub as string,
                            name: profile.name as string,
                            email: profile.email as string,
                            image: picture,
                            emailVerified: profile.email_verified as boolean,
                            googleAvatar: picture,
                        },
                        data: profile,
                    };
                },
            } as GoogleOptions
            : undefined,

        github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
            ? {
                clientId: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                scope: ["user:email"],
                mapProfileToUser: (profile) => ({
                    name: profile.name || profile.login,
                    email: profile.email,
                    image: profile.avatar_url || undefined,
                    emailVerified: true,
                    githubAvatar: profile.avatar_url || null,
                }),
            }
            : undefined,

        microsoft: process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
            ? {
                clientId: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                // Microsoft's built-in getUserInfo already fetches the profile photo
                // from Graph API as a base64 data URL and sets profile.picture.
                // We capture it into microsoftAvatar via mapProfileToUser.
                mapProfileToUser: (profile) => {
                    const pic: string | undefined = (profile as any).picture || undefined;
                    return {
                        name: (profile as any).displayName || profile.name,
                        image: pic,
                        microsoftAvatar: pic ?? null,
                    };
                },
            }
            : undefined,

        apple: process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
            ? {
                clientId: process.env.APPLE_CLIENT_ID,
                clientSecret: process.env.APPLE_CLIENT_SECRET,
                // Apple provides name only on first sign-in; no profile picture.
                mapProfileToUser: (profile) => ({
                    name: profile.name || profile.email?.split('@')[0] || "User",
                    image: undefined, // Apple does not provide profile images
                }),
            }
            : undefined,
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
    },

    // Base URL and secret
    baseURL: Config.Origin,
    secret: process.env.BETTER_AUTH_SECRET!,

    // CORS and trusted origins configuration
    trustedOrigins: [
        Config.Origin,
    ].filter(Boolean) as string[],

    // Advanced security options
    advanced: {
        crossSubDomainCookies: {
            enabled: false
        },
        useSecureCookies: process.env.NODE_ENV === "production",
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

    // User fields + per-provider avatar storage
    user: {
        fields: {
            email: "email",
            name: "name",
            image: "image",
            emailVerified: "emailVerified",
        },
        additionalFields: {
            // Stores the avatar URL fetched from each provider at sign-in time.
            // Used by AvatarSelector to let the user pick their preferred avatar.
            googleAvatar: {
                type: "string",
                required: false,
                defaultValue: null,
                input: false,  // not directly settable by the client
            },
            githubAvatar: {
                type: "string",
                required: false,
                defaultValue: null,
                input: false,
            },
            // Microsoft profile photo (base64 data URL from Graph API)
            microsoftAvatar: {
                type: "string",
                required: false,
                defaultValue: null,
                input: false,
            },
        },
        changeEmail: {
            enabled: true,
            updateEmailWithoutVerification: false,
        },
        deleteUser: {
            enabled: true,
        }
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

/** Only the email set in ADMIN_EMAIL env var can access admin endpoints */
export const requireAdmin = async (headers: Headers) => {
    const session = await requireAuth(headers);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || session.user?.email !== adminEmail) {
        throw new Error("Forbidden: Admin only");
    }
    return session;
};

export default auth;
