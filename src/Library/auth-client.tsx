/**
 * Better Auth Client
 * Client-side authentication utilities and hooks
 */

"use client";

import React from "react";
import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient, multiSessionClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
    baseURL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    plugins: [
        usernameClient(),
        twoFactorClient(),
        passkeyClient(),
        multiSessionClient()
    ],
});

// Export all auth methods for easy access
export const {
    signIn,
    signUp,
    signOut,
    useSession,
    updateUser,
    changePassword,
    listSessions,
    revokeSession,
    revokeOtherSessions,
    revokeSessions,
    linkSocial,
    unlinkAccount,
    listAccounts,
    isUsernameAvailable,
    twoFactor,
    passkey,
} = authClient;

// Custom hooks
export function useAuth() {
    const session = useSession();

    return {
        session: session.data,
        user: session.data?.user,
        isLoading: session.isPending,
        isAuthenticated: !!session.data,
        signIn,
        signUp,
        signOut,
        updateUser,
        changePassword,
        listSessions,
        revokeSession,
        revokeOtherSessions,
        revokeSessions,
        linkSocial,
        unlinkAccount,
        listAccounts,
        isUsernameAvailable,
        twoFactor,
        passkey,
    };
}