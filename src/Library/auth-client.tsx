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
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [usernameClient(), twoFactorClient(), passkeyClient(), multiSessionClient()],
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

// Provider component for the app
// Better Auth doesn't need a provider - it works out of the box
// This is exported for backward compatibility with code that uses SessionProvider
export function SessionProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
