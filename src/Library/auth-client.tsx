/**
 * Better Auth Client
 * Client-side authentication utilities and hooks
 */

"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient, multiSessionClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { phoneNumberClient } from "better-auth/client/plugins";
import { Config } from "@Config/Client";

function resolveAuthBaseURL(): string {
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
    }
    return Config.Origin;
}

const authClientPlugins = [usernameClient(), twoFactorClient(), passkeyClient(), phoneNumberClient(), multiSessionClient()];

export const authClient = createAuthClient({
    baseURL: resolveAuthBaseURL(),
    plugins: authClientPlugins
});

// Export all auth methods for easy access
export const {
    signIn,
    signUp,
    signOut,
    useSession,
    updateUser,
    changePassword,
    sendVerificationEmail,
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
    phoneNumber
} = authClient;

export async function setPassword(input: { newPassword: string }) {
    return authClient.$fetch("/set-password", {
        method: "POST",
        body: input
    });
}

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
        setPassword,
        changePassword,
        sendVerificationEmail,
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
        phoneNumber
    };
}
