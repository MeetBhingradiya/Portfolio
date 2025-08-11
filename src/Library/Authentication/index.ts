// @ Libraries
import { MongoClient } from "mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcrypt";
import { AuthOptions } from "next-auth";

// @ Providers
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Instagram from "next-auth/providers/instagram";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Linkedin from "next-auth/providers/linkedin";
import Spotify from "next-auth/providers/spotify";
import Pinterest from "next-auth/providers/pinterest";
import CredentialsProvider from "next-auth/providers/credentials";

// @ Local Imports
import { dbConnect, MONGODB_URIs } from "@Utils/dbConnect";
import { Config } from "@Config";

const client = new MongoClient(MONGODB_URIs[0] as string);
const clientPromise = client.connect();

export const authOptions: AuthOptions = {
    adapter: MongoDBAdapter(clientPromise, {
        databaseName: Config.DBName
    }),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }),
        GitHub({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || ""
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                await dbConnect();

                const User = (await import("@Models/NewUsers")).Users_Model;

                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password || ""
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user?._id?.toString() || "",
                    email: user.email,
                    name: user.name
                };
            }
        })
    ],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        signIn: async ({ user, account, profile }) => {
            if (account?.provider === "credentials") {
                // Handle credentials sign-in
                return true;
            } else {
                // Handle other providers
                if (user && user.email) {
                    await dbConnect();
                    const User = (await import("@Models/NewUsers")).Users_Model;
                    const existingUser = await User.findOne({
                        email: user.email
                    });
                        
                    if (!existingUser) {
                        const newUser = new User({
                            UserID: user.id,
                            name: user.name || "",
                            email: user.email,
                            image: user.image || "",
                            provider: account?.provider,
                            providerId: account?.providerAccountId,
                            emailVerified: new Date(),
                            role: "user"
                        });
                        await newUser.save();
                    }
                    return true;
                }
                return false;
            }
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        // async session({ session, token }) {
        //     if (token) {
        //         session.user
        //     }
        //     return session;
        // }
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error"
    },
    secret: process.env.NEXTAUTH_SECRET
};

export default authOptions;
