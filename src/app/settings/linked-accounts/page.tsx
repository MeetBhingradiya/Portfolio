/**
 * Linked Accounts Management Page
 * Manage OAuth provider connections securely
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth, linkSocial, unlinkAccount, listAccounts } from "@Library/auth-client";
import Link from "next/link";
import {
    Link as LinkIcon,
    ArrowBack,
    Warning,
    CheckCircle,
    Add,
    LinkOff,
    Info,
    Google,
    GitHub as GitHubIcon,
    Apple as AppleIcon,
    Sync,
    Window as MicrosoftIcon
} from "@mui/icons-material";

interface LinkedAccount {
    id: string;
    accountId: string;
    provider: string;
    providerId: string;
    email?: string;
    name?: string;
    createdAt: string;
    isPrimary: boolean;
}

export default function LinkedAccountsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, isAuthenticated, session } = useAuth();
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<Record<string, { ok: boolean; message: string } | null>>({});

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const availableProviders = [
        {
            id: "google",
            name: "Google",
            icon: <Google />,
            description: "Sign in with your Google account",
            color: "#4285F4"
        },
        {
            id: "github",
            name: "GitHub",
            icon: <GitHubIcon />,
            description: "Sign in with your GitHub account",
            color: isDark ? "#fff" : "#24292e"
        },
        {
            id: "microsoft",
            name: "Microsoft",
            icon: <MicrosoftIcon />,
            description: "Sign in with your Microsoft account",
            color: "#00A4EF"
        },
        {
            id: "apple",
            name: "Apple",
            icon: <AppleIcon />,
            description: "Sign in with your Apple ID",
            color: isDark ? "#fff" : "#000"
        }
    ];

    useEffect(() => {
        if (isAuthenticated) {
            loadAccounts();
        }
    }, [isAuthenticated]);

    // Check for successful OAuth callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthCallback = urlParams.has("code") || urlParams.has("state");

        if (hasOAuthCallback && isAuthenticated) {
            console.log("🔄 Detected OAuth callback, waiting for account to sync...");

            // Wait for the database to sync the newly linked account
            setTimeout(async () => {
                try {
                    // Reload accounts first to get the newly linked one
                    console.log("🔄 Reloading accounts after OAuth...");
                    await loadAccounts();

                    // Small delay to ensure loadAccounts completed
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    // Try GitHub first (works reliably)
                    const githubSync = await fetch("/api/auth/post-link-sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ providerId: "github" })
                    });

                    const githubResult = await githubSync.json();
                    if (githubSync.ok && githubResult.image) {
                        console.log("✅ GitHub profile picture synced!");
                        alert("✅ GitHub account linked and profile picture updated! Refreshing...");
                        window.history.replaceState({}, "", "/settings/linked-accounts");
                        window.location.reload();
                        return;
                    }

                    // Try Google (usually requires re-signin)
                    const googleSync = await fetch("/api/auth/post-link-sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ providerId: "google" })
                    });

                    const googleResult = await googleSync.json();
                    if (googleResult.error === "GOOGLE_REQUIRES_SIGNIN") {
                        // Google linked but avatar needs re-signin
                        alert(
                            "✅ Google account linked!\n\n⚠️ To get your Google profile picture:\n1. Sign out\n2. Sign in with 'Continue with Google'\n3. Your avatar will be automatically set"
                        );
                        window.history.replaceState({}, "", "/settings/linked-accounts");
                        window.location.reload();
                    } else if (googleSync.ok && googleResult.image) {
                        console.log("✅ Google profile picture synced!");
                        alert("✅ Google account linked and profile picture updated! Refreshing...");
                        window.history.replaceState({}, "", "/settings/linked-accounts");
                        window.location.reload();
                        return;
                    }

                    // If neither worked, just reload accounts and clean URL
                    await loadAccounts();
                    window.history.replaceState({}, "", "/settings/linked-accounts");
                } catch (error) {
                    console.error("Post-OAuth sync failed:", error);
                    // Still clean URL and reload accounts
                    await loadAccounts();
                    window.history.replaceState({}, "", "/settings/linked-accounts");
                }
            }, 1500); // Wait 1.5 seconds for account to be fully written to DB
        }
    }, [isAuthenticated]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            // Use custom endpoint that queries DB directly
            const response = await fetch("/api/auth/list-linked-accounts");
            const result = await response.json();

            console.log("📋 Raw listAccounts result:", result);

            if (result.success && result.data) {
                console.log("📋 Linked accounts found:", result.data);
                setAccounts(result.data as any);
            } else {
                console.log("⚠️ No accounts data in result");
                setAccounts([]);
            }
        } catch (error) {
            console.error("❌ Failed to load accounts:", error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkAccount = async (provider: string) => {
        try {
            console.log(`🔗 Starting link process for ${provider}...`);
            console.log("Current user:", user);
            console.log("Current session:", session);

            // linkSocial triggers an OAuth redirect, it doesn't return immediately
            // The user will be redirected to the OAuth provider and back
            const result = await linkSocial({
                provider: provider as any,
                callbackURL: "/settings/linked-accounts"
            });

            console.log("🔗 Link result:", result);

            // This code won't run immediately - the redirect happens first
            // After OAuth callback, the page reloads
        } catch (error: any) {
            console.error("❌ Failed to link account:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack,
                response: error.response
            });
            alert(`Failed to link account: ${error.message || "Please try again."}`);
        }
    };

    const handleUnlinkAccount = async (accountId: string, provider: string, providerId: string) => {
        console.log("Unlinking account:", { accountId, providerId, provider });
        console.log("All accounts:", accounts);

        const account = accounts.find((acc) => acc.id === accountId);
        console.log("Found account to unlink:", account);

        if (!confirm(`Unlink your ${provider} account? You'll no longer be able to sign in with it.`)) {
            return;
        }

        try {
            // Use our secure server-side API endpoint
            const response = await fetch("/api/auth/unlink-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    accountId: account?.accountId || accountId,
                    providerId: account?.providerId || providerId
                })
            });

            const result = await response.json();
            console.log("Unlink result:", result);

            if (!response.ok) {
                if (result.error === "LAST_AUTH_METHOD") {
                    alert(
                        "Cannot unlink your last sign-in method!\n\n" +
                            result.message +
                            "\n\n" +
                            "This is enforced server-side for security."
                    );
                } else {
                    alert(`Failed to unlink account: ${result.message || result.error || "Unknown error"}`);
                }
            } else {
                await loadAccounts();
            }
        } catch (error: any) {
            console.error("Failed to unlink account:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleSyncAvatar = async (providerId: string) => {
        setSyncingProvider(providerId);
        setSyncStatus((prev) => ({ ...prev, [providerId]: null }));
        try {
            const response = await fetch("/api/auth/sync-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ providerId })
            });

            const result = await response.json();

            if (response.ok) {
                setSyncStatus((prev) => ({
                    ...prev,
                    [providerId]: {
                        ok: true,
                        message: "Avatar synced! Refreshing…"
                    }
                }));
                setTimeout(() => window.location.reload(), 1200);
            } else {
                const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
                let msg = result.message || result.error || "Failed to sync profile picture";
                if (result.error === "GOOGLE_TOKEN_EXPIRED" || result.error === "MICROSOFT_TOKEN_EXPIRED") {
                    msg = `Your ${providerName} token expired. Sign out and sign back in with ${providerName} to refresh it.`;
                }
                setSyncStatus((prev) => ({
                    ...prev,
                    [providerId]: { ok: false, message: msg }
                }));
            }
        } catch (error: any) {
            console.error("Failed to sync avatar:", error);
            setSyncStatus((prev) => ({
                ...prev,
                [providerId]: {
                    ok: false,
                    message: error.message || "Network error. Please try again."
                }
            }));
        } finally {
            setSyncingProvider(null);
        }
    };

    const isProviderLinked = (provider: string) => {
        return accounts.some((acc) => acc.providerId?.toLowerCase() === provider.toLowerCase());
    };

    const getLinkedAccount = (provider: string) => {
        return accounts.find((acc) => acc.providerId?.toLowerCase() === provider.toLowerCase());
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <Warning
                        className="text-6xl mb-4"
                        style={{ color: palette.accent }}
                    />
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: palette.textPrimary }}>
                        Authentication Required
                    </h1>
                    <p
                        className="mb-6"
                        style={{ color: palette.textSecondary }}>
                        Please sign in to manage linked accounts
                    </p>
                    <Link href="/auth/signin">
                        <motion.button
                            className="px-6 py-3 rounded-xl font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#ffffff"
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            Sign In
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen"
            style={{ background: palette.background }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/settings">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                                color: palette.textPrimary
                            }}>
                            <ArrowBack />
                            <span>Back to Settings</span>
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div
                            className="p-3 rounded-2xl"
                            style={{ background: `${palette.accent}20` }}>
                            <LinkIcon
                                className="text-3xl"
                                style={{ color: palette.accent }}
                            />
                        </div>
                        <div>
                            <h1
                                className="text-3xl font-bold"
                                style={{ color: palette.textPrimary }}>
                                Linked Accounts
                            </h1>
                            <p style={{ color: palette.textSecondary }}>Connect and manage OAuth providers</p>
                        </div>
                    </div>
                </div>

                {/* Security Warning */}
                <motion.div
                    className="mb-6 p-4 rounded-2xl flex gap-3"
                    style={{
                        background: isDark ? "rgba(251, 191, 36, 0.1)" : "rgba(251, 191, 36, 0.08)",
                        border: `1px solid ${isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.15)"}`
                    }}>
                    <Info style={{ color: "#f59e0b" }} />
                    <div>
                        <p
                            className="font-semibold mb-1"
                            style={{ color: "#f59e0b" }}>
                            Security Notice
                        </p>
                        <p
                            className="text-sm mb-2"
                            style={{ color: palette.textSecondary }}>
                            <strong>
                                Do NOT directly sign in with OAuth providers (Google, GitHub, Microsoft, Apple) if you already have an
                                account!
                            </strong>{" "}
                            You must first link them here while signed in. This prevents unauthorized access if someone else's OAuth account
                            uses the same email.
                        </p>
                        <p
                            className="text-sm mb-2"
                            style={{ color: palette.textSecondary }}>
                            To add a new OAuth provider:
                        </p>
                        <ol
                            className="text-sm space-y-1 ml-4 list-decimal"
                            style={{ color: palette.textSecondary }}>
                            <li>Sign in to your account with email/password or existing OAuth provider</li>
                            <li>Come to this page (Linked Accounts)</li>
                            <li>Click "Link" button next to the provider you want to add</li>
                            <li>Authorize the connection in the OAuth popup</li>
                        </ol>
                        <p
                            className="text-sm mt-2"
                            style={{ color: palette.textSecondary }}>
                            <strong>Important:</strong> You must have at least one sign-in method (password OR OAuth account). To unlink
                            your last OAuth account, set a password first in{" "}
                            <Link
                                href="/settings/security"
                                className="underline"
                                style={{ color: "#f59e0b" }}>
                                Security Settings
                            </Link>
                            .
                        </p>
                    </div>
                </motion.div>

                {/* Available Providers */}
                <div className="space-y-4 mb-8">
                    <h3
                        className="text-lg font-bold"
                        style={{ color: palette.textPrimary }}>
                        Available Providers
                    </h3>

                    {loading ? (
                        <div
                            className="text-center py-8"
                            style={{ color: palette.textSecondary }}>
                            Loading accounts...
                        </div>
                    ) : (
                        availableProviders.map((provider) => {
                            const linked = isProviderLinked(provider.id);
                            const account = getLinkedAccount(provider.id);

                            return (
                                <motion.div
                                    key={provider.id}
                                    className="p-6 rounded-2xl"
                                    style={{
                                        background: isApple
                                            ? isDark
                                                ? "rgba(38, 38, 42, 0.6)"
                                                : "rgba(255, 255, 255, 0.6)"
                                            : palette.surface,
                                        border: linked
                                            ? `2px solid ${palette.accent}`
                                            : `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                                    }}
                                    whileHover={{ scale: 1.01 }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 flex-1">
                                            <div
                                                className="p-3 rounded-xl"
                                                style={{
                                                    background: `${provider.color}15`
                                                }}>
                                                <div
                                                    style={{
                                                        color: provider.color
                                                    }}>
                                                    {provider.icon}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4
                                                        className="text-lg font-bold"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {provider.name}
                                                    </h4>
                                                    {linked && (
                                                        <CheckCircle
                                                            className="text-sm"
                                                            style={{
                                                                color: "#22c55e"
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <p
                                                    className="text-sm"
                                                    style={{
                                                        color: palette.textSecondary
                                                    }}>
                                                    {linked
                                                        ? `Connected as ${user?.email || user?.name || "Your Account"}`
                                                        : provider.description}
                                                </p>
                                                {linked && account?.createdAt && (
                                                    <p
                                                        className="text-xs mt-1"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        Linked on {new Date(account.createdAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                                {syncStatus[provider.id] && (
                                                    <p
                                                        className="text-xs mt-2 font-medium"
                                                        style={{
                                                            color: syncStatus[provider.id]!.ok ? "#22c55e" : "#ef4444"
                                                        }}>
                                                        {syncStatus[provider.id]!.ok ? "✅" : "❌"} {syncStatus[provider.id]!.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {linked &&
                                                (provider.id === "google" || provider.id === "github" || provider.id === "microsoft") && (
                                                    <motion.button
                                                        className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                                                        style={{
                                                            background: "transparent",
                                                            color: palette.accent,
                                                            border: `1px solid ${palette.accent}40`
                                                        }}
                                                        whileHover={{
                                                            scale: 1.05
                                                        }}
                                                        whileTap={{
                                                            scale: 0.95
                                                        }}
                                                        onClick={() => handleSyncAvatar(provider.id)}
                                                        disabled={syncingProvider === provider.id}>
                                                        <Sync
                                                            className="text-sm"
                                                            style={
                                                                syncingProvider === provider.id
                                                                    ? {
                                                                          animation: "spin 1s linear infinite"
                                                                      }
                                                                    : {}
                                                            }
                                                        />
                                                        {syncingProvider === provider.id ? "Syncing…" : "Sync Avatar"}
                                                    </motion.button>
                                                )}
                                            {linked ? (
                                                <motion.button
                                                    className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                                                    style={{
                                                        background: "transparent",
                                                        color: "#ef4444",
                                                        border: `1px solid rgba(239, 68, 68, 0.3)`
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleUnlinkAccount(account!.id, provider.name, provider.id)}>
                                                    <LinkOff className="text-sm" />
                                                    Unlink
                                                </motion.button>
                                            ) : (
                                                <motion.button
                                                    className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                                                    style={{
                                                        background: palette.accent,
                                                        color: "#ffffff"
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleLinkAccount(provider.id)}>
                                                    <Add />
                                                    Link
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Info Box */}
                <motion.div
                    className="p-4 rounded-2xl"
                    style={{
                        background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                        border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"}`
                    }}>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        <strong style={{ color: "#3b82f6" }}>💡 Tip:</strong> You must keep at least one account linked to maintain access
                        to your account. We recommend linking multiple providers for backup access.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
