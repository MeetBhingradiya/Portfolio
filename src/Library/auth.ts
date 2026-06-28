/**
 * Better Auth Configuration
 * Authentication setup for the portfolio application
 */

import { betterAuth } from "better-auth";
import type { GoogleOptions } from "better-auth/social-providers";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username, multiSession } from "better-auth/plugins";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { passkey } from "@better-auth/passkey";
import { MongoClient } from "mongodb";
import { sendEmail, loginNotificationEmail, verificationEmailTemplate, deleteAccountVerificationEmail, VerificationEmailforChangeEmail } from "@Utils/Email";
import { sendPhoneOtpSms } from "@Utils/SMS";
import { UserAgent } from "@Library/UserAgent";
import { IPData } from "@Utils/IPData";
import { getSiteSettings } from "@Models/SiteSettings";
import { getClientIp } from "@Library/IP";
import { Config as SConfig } from "@Config/Server";
import { getPrimaryMongoUri, isLocalMongoUri } from "@Utils/mongoEnv";
import { getPrimaryOrigin, getTrustedOrigins } from "@Utils/origin";

const verificationEmailRateLimitStore = new Map<string, number[]>();
const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const PORTFOLIO_NAME = "Meet Bhingradiya Portfolio";
const PORTFOLIO_ISSUER = "Meet Bhingradiya's Portfolio";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";
const DEFAULT_EMAIL_VERIFICATION_WINDOW_MINUTES = 720;
const DEFAULT_EMAIL_VERIFICATION_MAX_PER_WINDOW = 3;
const VERIFICATION_EMAIL_SUBJECT = `Verify your email - ${PORTFOLIO_NAME}`;
const CHANGE_EMAIL_SUBJECT = `Confirm your new email - ${PORTFOLIO_NAME}`;
const DELETE_ACCOUNT_SUBJECT = `Confirm account deletion - ${PORTFOLIO_NAME}`;
const primaryOrigin = getPrimaryOrigin();
const trustedOrigins = getTrustedOrigins();
const passkeyRpId = (() => {
    try {
        return new URL(primaryOrigin).hostname;
    } catch {
        return "meetbhingradiya.in";
    }
})();

class SignupDisabledError extends Error {
    constructor() {
        super("User registration is currently disabled. Please contact the site administrator for assistance.");
        this.name = "SignupDisabledError";
    }
}

type IpDataResult = {
    ip?: string;
    city?: string;
    region_code?: string;
    region?: string;
    country_name?: string;
    isERROR?: boolean;
};

function toTitleCase(value: string): string {
    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

type EmailSecurityPolicies = {
    verificationRateLimitWindowMinutes: number;
    verificationRateLimitMax: number;
};

function getEmailPoliciesFromEnv(): EmailSecurityPolicies {
    return {
        verificationRateLimitWindowMinutes: Number(process.env.EMAIL_VERIFICATION_WINDOW_MINUTES || String(DEFAULT_EMAIL_VERIFICATION_WINDOW_MINUTES)),
        verificationRateLimitMax: Number(process.env.EMAIL_VERIFICATION_MAX_PER_WINDOW || String(DEFAULT_EMAIL_VERIFICATION_MAX_PER_WINDOW))
    };
}

async function getEmailSecurityPolicies(): Promise<EmailSecurityPolicies> {
    const fallback = getEmailPoliciesFromEnv();
    try {
        const settings = await getSiteSettings();
        return {
            verificationRateLimitWindowMinutes:
                settings.Limits?.Email_Verification.Limit_Window_in_Minutes ?? fallback.verificationRateLimitWindowMinutes,
            verificationRateLimitMax: settings.Limits?.Email_Verification.Limit_Max_Attempts ?? fallback.verificationRateLimitMax
        };
    } catch {
        return fallback;
    }
}

function consumeVerificationRateLimit(email: string, policies: EmailSecurityPolicies): { allowed: boolean; retryAfterSeconds: number } {
    const windowMs = Math.max(1, policies.verificationRateLimitWindowMinutes) * 60 * 1000;
    const maxPerWindow = Math.max(1, policies.verificationRateLimitMax);

    const now = Date.now();
    const key = email.toLowerCase();
    const existing = verificationEmailRateLimitStore.get(key) ?? [];
    const fresh = existing.filter((ts) => now - ts < windowMs);

    if (fresh.length >= maxPerWindow) {
        const retryAfterMs = Math.max(0, windowMs - (now - fresh[0]));
        return {
            allowed: false,
            retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
        };
    }

    fresh.push(now);
    verificationEmailRateLimitStore.set(key, fresh);
    return { allowed: true, retryAfterSeconds: 0 };
}

function getDeviceContext(userAgentSource: string): {
    platform: string;
    deviceType: string;
    browser: string;
} {
    if (!userAgentSource) {
        return {
            platform: "Unknown Platform",
            deviceType: "Unknown Device",
            browser: "Unknown Browser"
        };
    }

    const parsed = new UserAgent(userAgentSource).parse();
    const platform = parsed.platform !== "unknown" ? parsed.platform : parsed.os !== "unknown" ? parsed.os : "Unknown Platform";
    const browser = parsed.browser !== "unknown" ? parsed.browser : "Unknown Browser";

    const deviceType = parsed.isTablet ? "Tablet" : parsed.isMobile ? "Mobile" : parsed.isDesktop ? "Desktop" : "Unknown Device";

    return {
        platform: toTitleCase(String(platform)),
        deviceType,
        browser: toTitleCase(String(browser))
    };
}

async function resolveLocation(ipAddress: string): Promise<string> {
    if (!ipAddress || ipAddress === "Unknown") {
        return "Unknown location";
    }

    const data = (await IPData(ipAddress)) as IpDataResult;
    if (!data || data.isERROR) {
        return "Unknown location";
    }

    const parts = [data.city, data.region_code || data.region, data.country_name].filter(Boolean);
    return parts.length ? parts.join(", ") : "Unknown location";
}

async function sendTemplatedEmail(input: { to: string; subject: string; html: string }) {
    await sendEmail(input);
}

async function sendLoginNotificationEmail(input: {
    email: string;
    name?: string;
    userAgent: string;
    ipAddress: string;
    eventPath?: string;
}) {
    const location = await resolveLocation(input.ipAddress);
    const device = getDeviceContext(input.userAgent);

    await sendTemplatedEmail({
        to: input.email,
        subject: `New login detected on ${device.deviceType}`,
        html: loginNotificationEmail({
            name: input.name,
            ipAddress: input.ipAddress,
            location,
            platform: device.platform,
            deviceType: device.deviceType,
            browser: device.browser,
            loginAt: new Date().toISOString(),
            eventPath: input.eventPath
        })
    });
}

// Skip database initialization during build time
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
const mongoUri = getPrimaryMongoUri();

declare global {
    var _authMongoClient: MongoClient | undefined;
}

// MongoDB client setup
let dbAdapter: any = undefined;
if (!isBuildTime && mongoUri) {
    try {
        if (!global._authMongoClient) {
            global._authMongoClient = new MongoClient(mongoUri, {
                maxPoolSize: 2,
                maxIdleTimeMS: 10000,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
        }
        const client = global._authMongoClient;
        const db = client.db(SConfig.Database.Name);

        // Compatibility migration for older account documents that used `user_id`.
        // Better Auth credential sign-in queries by `userId`.
        db.collection("account")
            .updateMany(
                {
                    userId: { $exists: false },
                    user_id: { $exists: true }
                },
                [
                    {
                        $set: {
                            userId: "$user_id"
                        }
                    }
                ]
            )
            .then((res) => {
                if (res.modifiedCount > 0) {
                    console.log(`[Auth] Migrated ${res.modifiedCount} legacy account documents to userId.`);
                }
            })
            .catch((error) => {
                console.warn("[Auth] Legacy account migration skipped:", error);
            });

        // Disable transactions for standalone MongoDB (local dev).
        // Transactions require a replica set; Atlas in production supports them.
        const isLocalMongo = isLocalMongoUri(mongoUri);
        dbAdapter = mongodbAdapter(db, { client, transaction: !isLocalMongo });
        console.log("✅ MongoDB adapter initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize MongoDB adapter:", error);
        throw new Error("Database connection failed. Please ensure MongoDB is running.");
    }
} else if (!isBuildTime) {
    console.warn("⚠️ MongoDB environment variable not set (expected MONGODB_<number>)");
}

function createGoogleProvider(): GoogleOptions | undefined {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return undefined;
    }

    return {
        prompt: "select_account",
        clientId,
        clientSecret,
        scope: ["email", "profile", "openid"],
        // Override getUserInfo to always fetch from the userinfo endpoint.
        // Decoding the id_token alone omits `picture` in some flows.
        getUserInfo: async (token) => {
            let profile: Record<string, any> | null = null;

            if (token.accessToken) {
                try {
                    const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
                        headers: {
                            Authorization: `Bearer ${token.accessToken}`
                        }
                    });
                    if (res.ok) profile = await res.json();
                } catch (error) {
                    console.error("[Google] Failed to fetch userinfo:", error);
                }
            }

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
                    image: picture ?? undefined,
                    emailVerified: profile.email_verified as boolean,
                    googleAvatar: picture
                },
                data: profile
            };
        }
    };
}

function createGitHubProvider() {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return undefined;
    }

    return {
        clientId,
        clientSecret,
        scope: ["user:email"],
        mapProfileToUser: (profile: { name?: string; login?: string; email?: string; avatar_url?: string | null }) => ({
            name: profile.name || profile.login,
            email: profile.email,
            image: profile.avatar_url || undefined,
            emailVerified: true,
            githubAvatar: profile.avatar_url || null
        })
    };
}

function createMicrosoftProvider() {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return undefined;
    }

    return {
        clientId,
        clientSecret,
        // Microsoft's built-in getUserInfo already fetches the profile photo
        // from Graph API as a base64 data URL and sets profile.picture.
        // We capture it into microsoftAvatar via mapProfileToUser.
        mapProfileToUser: (profile: Record<string, any>) => {
            const picture: string | undefined = profile.picture || undefined;
            return {
                name: profile.displayName || profile.name,
                image: picture,
                microsoftAvatar: picture ?? null
            };
        }
    };
}

function createAppleProvider() {
    const clientId = process.env.APPLE_CLIENT_ID;
    const clientSecret = process.env.APPLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return undefined;
    }

    return {
        clientId,
        clientSecret,
        // Apple provides name only on first sign-in; no profile picture.
        mapProfileToUser: (profile: { name?: string; email?: string }) => ({
            name: profile.name || profile.email?.split("@")[0] || "User",
            image: undefined
        })
    };
}

function buildSocialProviders() {
    return {
        google: createGoogleProvider(),
        github: createGitHubProvider(),
        microsoft: createMicrosoftProvider(),
        apple: createAppleProvider()
    };
}

export const auth = betterAuth({
    database: dbAdapter,

    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        expiresIn: 60 * 10, // 10 minutes
        sendVerificationEmail: async ({ user, url }) => {
            const policies = await getEmailSecurityPolicies();
            const limit = consumeVerificationRateLimit(user.email, policies);
            if (!limit.allowed) {
                console.warn(`[Auth] Verification email rate-limited for ${user.email}. Retry in ${limit.retryAfterSeconds}s.`);
                return;
            }

            try {
                await sendTemplatedEmail({
                    to: user.email,
                    subject: VERIFICATION_EMAIL_SUBJECT,
                    html: verificationEmailTemplate({
                        name: user.name,
                        verificationUrl: url,
                        expiresInMinutes: 60
                    })
                });
                console.log(`[Auth] Verification email sent to ${user.email}`);
            } catch (error) {
                // Never block sign-up flow on mail delivery issues.
                console.error(`[Auth] Failed to send verification email to ${user.email}:`, error);
            }
        }
    },

    // Email and password authentication
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        // OAuth users are auto-verified via their provider
        disableSignUp: false, // Allow sign-up for email/password users
        autoSignIn: true // Auto sign-in after sign-up
    },

    // Plugins configuration
    plugins: [
        username({
            minUsernameLength: 3,
            maxUsernameLength: 30
        }),
        twoFactor({
            issuer: PORTFOLIO_ISSUER
        }),
        passkey({
            rpName: PORTFOLIO_ISSUER,
            rpID: passkeyRpId,
            origin: primaryOrigin
        }),
        phoneNumber({
            expiresIn: 5 * 60,
            otpLength: 6,
            requireVerification: true,
            phoneNumberValidator: (phone) => E164_PHONE_REGEX.test(phone),
            sendOTP: async ({ phoneNumber: phone, code }) => {
                await sendPhoneOtpSms(phone, code);
            }
        }),
        multiSession()
    ],

    // Social providers configuration
    socialProviders: buildSocialProviders(),

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 3 // 3 days
    },

    // Base URL and secret
    baseURL: primaryOrigin,
    secret: process.env.BETTER_AUTH_SECRET!,

    // CORS and trusted origins configuration
    trustedOrigins: trustedOrigins.filter(Boolean) as string[],

    // Advanced security options
    advanced: {
        crossSubDomainCookies: {
            enabled: false
        },
        useSecureCookies: process.env.NODE_ENV === "production"
    },

    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    try {
                        const settings = await getSiteSettings();
                        if (settings.Policy?.Allow_New_Signups !== true) {
                            throw new SignupDisabledError();
                        }
                    } catch (err: unknown) {
                        if (err instanceof SignupDisabledError) {
                            throw err;
                        }
                        // If we can't read settings, fail open (allow) to avoid breaking auth on DB errors
                        console.error("[Auth] Failed to read site settings for signup check:", err);
                    }
                    return { data: user };
                },
                after: async (user) => {
                    console.log(`[Auth] User created: ${user.email}`);
                }
            }
        },
        account: {
            create: {
                after: async (account) => {
                    console.log(`[Auth] Account created: provider=${account.providerId}, accountId=${account.accountId}`);
                }
            }
        },
        session: {
            create: {
                after: async (session, context) => {
                    try {
                        const path = context?.path ?? "";
                        if (path.startsWith("/sign-up")) {
                            return;
                        }

                        const user = await context?.context.internalAdapter.findUserById(session.userId);
                        if (!user?.email) {
                            return;
                        }

                        const request = context?.request;
                        const derivedIp = request ? getClientIp(request) : null;
                        const ipAddress = session.ipAddress || (Array.isArray(derivedIp) ? derivedIp[0] : derivedIp) || "Unknown";
                        const userAgent = session.userAgent || request?.headers.get("user-agent") || "";

                        await sendLoginNotificationEmail({
                            email: user.email,
                            name: user.name,
                            userAgent,
                            ipAddress,
                            eventPath: path || undefined
                        });
                    } catch (error) {
                        console.error("[Auth] Failed to send login notification email:", error);
                    }
                }
            }
        }
    },

    // Account settings
    account: {
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
            emailVerified: "emailVerified"
        },
        additionalFields: {
            // Stores the avatar URL fetched from each provider at sign-in time.
            // Used by AvatarSelector to let the user pick their preferred avatar.
            googleAvatar: {
                type: "string",
                required: false,
                defaultValue: null,
                input: false // not directly settable by the client
            },
            githubAvatar: {
                type: "string",
                required: false,
                defaultValue: null,
                input: false
            },
            // Microsoft profile photo (base64 data URL from Graph API)
            microsoftAvatar: {
                type: "string",
                required: false,
                defaultValue: null,
                input: false
            }
        },
        changeEmail: {
            enabled: true,
            updateEmailWithoutVerification: false,
            sendChangeEmailConfirmation: async ({ user, url }: { user: any; url: string }) => {
                await sendTemplatedEmail({
                    to: user.email,
                    subject: CHANGE_EMAIL_SUBJECT,
                    html: VerificationEmailforChangeEmail({
                        name: user.name,
                        verificationUrl: url,
                        expiresInMinutes: 60
                    })
                });
            }
        },
        deleteUser: {
            enabled: true,
            sendDeleteAccountVerification: async ({ user, url }: { user: any; url: string }) => {
                await sendTemplatedEmail({
                    to: user.email,
                    subject: DELETE_ACCOUNT_SUBJECT,
                    html: deleteAccountVerificationEmail({
                        name: user.name,
                        verificationUrl: url,
                        expiresInHours: 24
                    })
                });
            }
        }
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
