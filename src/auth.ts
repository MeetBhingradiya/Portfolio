import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
// import Microsoft from "next-auth/providers/microsoft";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import bcrypt from "bcrypt";
import { Config } from "@Config";
import { dbConnect } from "@Utils/dbConnect";

const client = new MongoClient(process.env.MONGODB_01 as string);
const clientPromise = client.connect();

// Provider configuration with enable/disable flags
interface ProviderConfig {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    [key: string]: any;
}

const providerConfigs: Record<string, ProviderConfig> = {
    google: {
        enabled: Config.AuthProviders?.google?.enabled || false,
        clientId: Config.AuthProviders?.google?.clientId,
        clientSecret: Config.AuthProviders?.google?.clientSecret,
    },
    github: {
        enabled: Config.AuthProviders?.github?.enabled || false,
        clientId: Config.AuthProviders?.github?.clientId,
        clientSecret: Config.AuthProviders?.github?.clientSecret,
    },
    discord: {
        enabled: Config.AuthProviders?.discord?.enabled || false,
        clientId: Config.AuthProviders?.discord?.clientId,
        clientSecret: Config.AuthProviders?.discord?.clientSecret,
    },
    apple: {
        enabled: Config.AuthProviders?.apple?.enabled || false,
        clientId: Config.AuthProviders?.apple?.clientId,
        clientSecret: Config.AuthProviders?.apple?.clientSecret,
    },
    facebook: {
        enabled: Config.AuthProviders?.facebook?.enabled || false,
        clientId: Config.AuthProviders?.facebook?.clientId,
        clientSecret: Config.AuthProviders?.facebook?.clientSecret,
    },
    linkedin: {
        enabled: Config.AuthProviders?.linkedin?.enabled || false,
        clientId: Config.AuthProviders?.linkedin?.clientId,
        clientSecret: Config.AuthProviders?.linkedin?.clientSecret,
    },
    // microsoft: {
    //     enabled: Config.AuthProviders?.microsoft?.enabled || false,
    //     clientId: Config.AuthProviders?.microsoft?.clientId,
    //     clientSecret: Config.AuthProviders?.microsoft?.clientSecret,
    // },
    credentials: {
        enabled: Config.AuthProviders?.credentials?.enabled || false,
    },
    email: {
        enabled: Config.AuthProviders?.email?.enabled || false,
        server: Config.AuthProviders?.email?.server || process.env.EMAIL_SERVER || `smtp://${process.env.SMTP_EMAIL}:${process.env.SMTP_APP_PASS}@${process.env.SMTP_HOST}:587`,
        from: Config.AuthProviders?.email?.from || process.env.EMAIL_FROM || process.env.SMTP_EMAIL,
    },
};

// Build providers array based on configuration
const buildProviders = () => {
    const providers: any[] = [];

    // Google
    if (providerConfigs.google.enabled && providerConfigs.google.clientId) {
        providers.push(
            Google({
                clientId: providerConfigs.google.clientId!,
                clientSecret: providerConfigs.google.clientSecret!,
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code"
                    }
                }
            })
        );
    }

    // GitHub
    if (providerConfigs.github.enabled && providerConfigs.github.clientId) {
        providers.push(
            GitHub({
                clientId: providerConfigs.github.clientId!,
                clientSecret: providerConfigs.github.clientSecret!,
            })
        );
    }

    // Discord
    if (providerConfigs.discord.enabled && providerConfigs.discord.clientId) {
        providers.push(
            Discord({
                clientId: providerConfigs.discord.clientId!,
                clientSecret: providerConfigs.discord.clientSecret!,
            })
        );
    }

    // Apple (conditionally enabled for iOS/macOS)
    if (providerConfigs.apple.enabled && providerConfigs.apple.clientId) {
        providers.push(
            Apple({
                clientId: providerConfigs.apple.clientId!,
                clientSecret: providerConfigs.apple.clientSecret!,
            })
        );
    }

    // Facebook
    if (providerConfigs.facebook.enabled && providerConfigs.facebook.clientId) {
        providers.push(
            Facebook({
                clientId: providerConfigs.facebook.clientId!,
                clientSecret: providerConfigs.facebook.clientSecret!,
            })
        );
    }

    // LinkedIn
    if (providerConfigs.linkedin.enabled && providerConfigs.linkedin.clientId) {
        providers.push(
            LinkedIn({
                clientId: providerConfigs.linkedin.clientId!,
                clientSecret: providerConfigs.linkedin.clientSecret!,
                authorization: {
                    params: {
                        scope: "openid profile email"
                    }
                }
            })
        );
    }

    // Microsoft
    // if (providerConfigs.microsoft.enabled && providerConfigs.microsoft.clientId) {
    //     providers.push(
    //         Microsoft({
    //             clientId: providerConfigs.microsoft.clientId!,
    //             clientSecret: providerConfigs.microsoft.clientSecret!,
    //             authorization: {
    //                 params: {
    //                     scope: "openid profile email User.Read"
    //                 }
    //             }
    //         })
    //     );
    // }

    // Credentials (Username & Password)
    if (providerConfigs.credentials.enabled) {
        providers.push(
            Credentials({
                name: "credentials",
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" }
                },
                async authorize(credentials) {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    try {
                        await dbConnect();
                        const { Users_Model } = await import("@Models/EnhancedUsers");

                        const user = await Users_Model.findOne({
                            email: (credentials.email as string).toLowerCase(),
                            // isDeleted: { $ne: true } // Not needed in new model
                        });

                        if (!user) {
                            return null;
                        }

                        // Check password if exists (for credentials provider)
                        if (user.password) {
                            const isPasswordValid = await bcrypt.compare(
                                credentials.password as string,
                                user.password
                            );

                            if (!isPasswordValid) {
                                return null;
                            }
                        } else {
                            // User might have signed up with OAuth only
                            return null;
                        }

                        return {
                            id: user.UserID || user._id?.toString(),
                            email: user.email,
                            name: user.profile?.displayName || user.email.split('@')[0],
                            image: user.profile?.avatar || null,
                            username: user.profile?.username || user.profile?.displayName?.replace(/\s+/g, '').toLowerCase() || user.email.split('@')[0],
                            firstName: user.profile?.firstName || '',
                            lastName: user.profile?.lastName || '',
                            isAdmin: user.role === 'admin',
                            isEmailVerified: !!user.emailVerified,
                            isMFAEnabled: user.security?.isMFAEnabled || false
                        };
                    } catch (error) {
                        console.error("Credentials authorization error:", error);
                        return null;
                    }
                }
            })
        );
    }

    // Email (Magic Links & OTP)
    if (providerConfigs.email.enabled && (providerConfigs.email.server || process.env.SMTP_EMAIL)) {
        providers.push(
            Nodemailer({
                server: providerConfigs.email.server || `smtp://${process.env.SMTP_EMAIL}:${process.env.SMTP_APP_PASS}@${process.env.SMTP_HOST || 'smtp.gmail.com'}:587`,
                from: providerConfigs.email.from || process.env.SMTP_EMAIL,
                sendVerificationRequest: async ({ identifier, url, provider }) => {
                    try {
                        console.log("Sending verification email to:", identifier);
                        console.log("Magic link URL:", url);
                        
                        const { createTransport } = await import("nodemailer");
                        
                        const transport = createTransport({
                            host: process.env.SMTP_HOST || 'smtp.gmail.com',
                            port: 587,
                            secure: false,
                            auth: {
                                user: process.env.SMTP_EMAIL,
                                pass: process.env.SMTP_APP_PASS,
                            },
                        });

                        const emailHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Sign in to ${Config.Name}</title>
                        </head>
                        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                                        Welcome back!
                                    </h1>
                                    <p style="color: #e6efff; margin: 10px 0 0 0; font-size: 16px;">
                                        Sign in to your ${Config.Name} account
                                    </p>
                                </div>
                                
                                <div style="padding: 40px 30px;">
                                    <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                                        Click the button below to sign in to your account. This link will expire in 24 hours for security reasons.
                                    </p>
                                    
                                    <div style="text-align: center; margin: 40px 0;">
                                        <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                                            Sign In
                                        </a>
                                    </div>
                                    
                                    <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                                        If you didn't request this email, you can safely ignore it. If you're having trouble clicking the button, copy and paste this link into your browser:
                                    </p>
                                    
                                    <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0; word-break: break-all;">
                                        <code style="color: #495057; font-size: 14px;">${url}</code>
                                    </div>
                                </div>
                                
                                <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
                                    <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">
                                        This email was sent to ${identifier} for ${Config.Name}.
                                        <br>
                                        If you have any questions, please contact our support team.
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                        `;

                        const emailText = `
                        Sign in to ${Config.Name}
                        
                        Click this link to sign in to your account:
                        ${url}
                        
                        This link will expire in 24 hours for security reasons.
                        
                        If you didn't request this email, you can safely ignore it.
                        
                        This email was sent to ${identifier} for ${Config.Name}.
                        `;

                        const result = await transport.sendMail({
                            to: identifier,
                            from: providerConfigs.email.from || process.env.SMTP_EMAIL,
                            subject: `Sign in to ${Config.Name}`,
                            text: emailText,
                            html: emailHtml,
                        });

                        console.log("Email sent successfully:", result.messageId);
                        // Don't return result - NextAuth expects void
                    } catch (error) {
                        console.error("Failed to send verification email:", error);
                        throw error;
                    }
                }
            })
        );
    }

    return providers;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(clientPromise, {
        databaseName: Config.DBName,
        collections: {
            Users: "users",
            Accounts: "accounts", 
            Sessions: "sessions",
            VerificationTokens: "verification_tokens"
        }
    }),
    providers: buildProviders(),
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
        verifyRequest: "/auth/verify-request",
        newUser: "/auth/create-username"
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user?.email) {
                return false;
            }

            try {
                await dbConnect();
                const { Users_Model } = await import("@Models/EnhancedUsers");

                // Check if user exists
                let existingUser = await Users_Model.findOne({
                    email: user.email.toLowerCase()
                });

                if (existingUser) {
                    // User exists, update connected accounts if it's OAuth
                    if (account && account.provider !== "credentials") {
                        const existingAccount = existingUser.connectedAccounts?.find(
                            acc => acc.provider === account.provider
                        );

                        if (!existingAccount) {
                            // Add new connected account
                            await existingUser.addConnectedAccount({
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                accessToken: account.access_token,
                                refreshToken: account.refresh_token,
                                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
                                scope: account.scope,
                                email: user.email,
                                name: user.name,
                                image: user.image
                            });
                        }
                        
                        // Update email verification if OAuth
                        if (!existingUser.emailVerified) {
                            existingUser.emailVerified = new Date();
                            existingUser.isEmailVerified = true;
                            await existingUser.save();
                        }
                    }
                } else if (account && account.provider !== "credentials") {
                    // Create new user for OAuth sign-in
                    const { v4: uuidv4 } = await import("uuid");
                    
                    const newUser = new Users_Model({
                        UserID: uuidv4(),
                        email: user.email.toLowerCase(),
                        profile: {
                            displayName: user.name || user.email.split("@")[0],
                            firstName: user.name?.split(" ")[0] || "",
                            lastName: user.name?.split(" ").slice(1).join(" ") || "",
                            avatar: user.image
                        },
                        emailVerified: new Date(),
                        isEmailVerified: true,
                        role: "user",
                        accountType: "personal",
                        connectedAccounts: [{
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            accessToken: account.access_token,
                            refreshToken: account.refresh_token,
                            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
                            scope: account.scope,
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            connectedAt: new Date(),
                            lastUsed: new Date(),
                            isActive: true
                        }]
                    });

                    await newUser.save();
                }

                return true;
            } catch (error) {
                console.error("SignIn callback error:", error);
                return false;
            }
        },

        async jwt({ token, user }) {
            if (user) {
                // First time user signs in
                token.userId = user.id || "";
                token.username = user.username;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.isAdmin = user.isAdmin;
                token.isEmailVerified = user.isEmailVerified;
                token.isMFAEnabled = user.isMFAEnabled;
            }

            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.userId as string;
                session.user.username = token.username as string;
                session.user.firstName = token.firstName as string;
                session.user.lastName = token.lastName as string;
                session.user.isAdmin = token.isAdmin as boolean;
                session.user.isEmailVerified = token.isEmailVerified as boolean;
                session.user.isMFAEnabled = token.isMFAEnabled as boolean;
            }

            return session;
        },

        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        }
    },
    events: {
        async signIn({ user, account }) {
            console.log(`User ${user.email} signed in with ${account?.provider}`);
        },
        async signOut() {
            console.log(`User signed out`);
        }
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET,
});

// Export provider configurations for dynamic UI
export { providerConfigs };
