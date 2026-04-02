/**
 * Passkey Management Page
 * Allows users to register and manage passkeys (WebAuthn)
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth, passkey } from "@Library/auth-client";
import Link from "next/link";
import { Fingerprint, ArrowBack, Add, Delete, Warning, Info, Laptop, PhoneIphone, Key, CheckCircle } from "@mui/icons-material";

interface Passkey {
    id: string;
    name: string;
    deviceType: "desktop" | "mobile" | "security-key";
    createdAt: string;
    lastUsed: string | null;
}

export default function PasskeyPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, session, isAuthenticated } = useAuth();
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [isRegistering, setIsRegistering] = useState(false);
    const [newPasskeyName, setNewPasskeyName] = useState("");
    const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    useEffect(() => {
        if (isAuthenticated) {
            loadPasskeys();
        }

        // Check WebAuthn support
        if (window.PublicKeyCredential) {
            setSupportsWebAuthn(true);
        }
    }, [isAuthenticated]);

    const loadPasskeys = async () => {
        try {
            const result = await passkey.listUserPasskeys();
            if (result.data) {
                setPasskeys(result.data as any);
            }
        } catch (error) {
            console.error("Failed to load passkeys:", error);
        }
    };

    const handleRegisterPasskey = async () => {
        if (!newPasskeyName) return;

        if (!supportsWebAuthn) {
            alert("WebAuthn is not supported in your browser. Please use a modern browser with passkey support.");
            return;
        }

        setIsRegistering(true);

        try {
            const result = await passkey.addPasskey({
                name: newPasskeyName
            });

            if (result.data) {
                await loadPasskeys();
                setNewPasskeyName("");
            }
        } catch (error: any) {
            console.error("Passkey registration failed:", error);
            const errorMessage = error?.message || "Failed to register passkey";
            alert(errorMessage);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDeletePasskey = async (passkeyId: string) => {
        if (!confirm("Are you sure you want to remove this passkey?")) return;

        try {
            await passkey.deletePasskey({ id: passkeyId });
            await loadPasskeys();
        } catch (error) {
            console.error("Failed to delete passkey:", error);
            alert("Failed to delete passkey. Please try again.");
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case "desktop":
                return <Laptop />;
            case "mobile":
                return <PhoneIphone />;
            case "security-key":
                return <Key />;
            default:
                return <Fingerprint />;
        }
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
                        Please sign in to manage your passkeys
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
                    <Link href="/settings/security">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                                color: palette.textPrimary
                            }}>
                            <ArrowBack />
                            <span>Back to Security</span>
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div
                            className="p-3 rounded-2xl"
                            style={{ background: `${palette.accent}20` }}>
                            <Fingerprint
                                className="text-3xl"
                                style={{ color: palette.accent }}
                            />
                        </div>
                        <div>
                            <h1
                                className="text-3xl font-bold"
                                style={{ color: palette.textPrimary }}>
                                Passkeys
                            </h1>
                            <p style={{ color: palette.textSecondary }}>Secure, passwordless authentication for your account</p>
                        </div>
                    </div>
                </div>

                {/* Password Manager Info Banner */}
                <motion.div
                    className="mb-6 p-4 rounded-2xl flex gap-3"
                    style={{
                        background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                        border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"}`
                    }}>
                    <Info style={{ color: "#3b82f6" }} />
                    <div>
                        <p
                            className="font-semibold mb-1"
                            style={{ color: "#3b82f6" }}>
                            What are Passkeys?
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            Passkeys use biometrics (Face ID, Touch ID, Windows Hello, Samsung Pass) or your device PIN for secure,
                            passwordless sign-in. They work with any browser that supports WebAuthn.
                        </p>
                    </div>
                </motion.div>

                {/* Blocked Authenticators Warning */}
                <motion.div
                    className="mb-6 p-4 rounded-2xl flex gap-3"
                    style={{
                        background: isDark ? "rgba(251, 191, 36, 0.1)" : "rgba(251, 191, 36, 0.08)",
                        border: `1px solid ${isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.15)"}`
                    }}>
                    <Warning style={{ color: "#f59e0b" }} />
                    <div>
                        <p
                            className="font-semibold mb-1"
                            style={{ color: "#f59e0b" }}>
                            Third-Party Password Managers Blocked
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            For security, we block passkeys from 1Password, Bitwarden, LastPass, Dashlane, Keeper, and NordPass. Please use
                            platform authenticators like Windows Hello, Face ID, Touch ID, or Samsung Pass instead.
                        </p>
                    </div>
                </motion.div>

                {/* Register New Passkey */}
                <motion.div
                    className="mb-6 p-6 rounded-2xl"
                    style={{
                        background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                    }}>
                    <h3
                        className="text-lg font-bold mb-4"
                        style={{ color: palette.textPrimary }}>
                        Register New Passkey
                    </h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newPasskeyName}
                            onChange={(e) => setNewPasskeyName(e.target.value)}
                            placeholder="Device name (e.g., My iPhone)"
                            className="flex-1 px-4 py-3 rounded-xl"
                            style={{
                                background: palette.background,
                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                                color: palette.textPrimary
                            }}
                        />
                        <motion.button
                            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                            style={{
                                background:
                                    !newPasskeyName || isRegistering || !supportsWebAuthn
                                        ? isDark
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.1)"
                                        : palette.accent,
                                color: !newPasskeyName || isRegistering || !supportsWebAuthn ? palette.textTertiary : "#ffffff",
                                cursor: !newPasskeyName || isRegistering || !supportsWebAuthn ? "not-allowed" : "pointer"
                            }}
                            whileHover={supportsWebAuthn && newPasskeyName && !isRegistering ? { scale: 1.02 } : {}}
                            whileTap={supportsWebAuthn && newPasskeyName && !isRegistering ? { scale: 0.98 } : {}}
                            onClick={handleRegisterPasskey}
                            disabled={!supportsWebAuthn || !newPasskeyName || isRegistering}>
                            <Add />
                            {isRegistering ? "Registering..." : "Add Passkey"}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Registered Passkeys */}
                <div className="space-y-4">
                    <h3
                        className="text-lg font-bold"
                        style={{ color: palette.textPrimary }}>
                        Your Passkeys ({passkeys.length})
                    </h3>

                    {passkeys.length === 0 ? (
                        <motion.div
                            className="p-8 rounded-2xl text-center"
                            style={{
                                background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                            }}>
                            <Fingerprint
                                className="text-5xl mb-3"
                                style={{ color: palette.textTertiary }}
                            />
                            <p
                                className="font-semibold mb-1"
                                style={{ color: palette.textSecondary }}>
                                No passkeys registered
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: palette.textTertiary }}>
                                Add a passkey to enable secure, passwordless sign-in
                            </p>
                        </motion.div>
                    ) : (
                        passkeys.map((passkey) => (
                            <motion.div
                                key={passkey.id}
                                className="p-6 rounded-2xl"
                                style={{
                                    background: isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface,
                                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                                }}
                                whileHover={{ scale: 1.01 }}>
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div
                                            className="p-3 rounded-xl"
                                            style={{
                                                background: `${palette.accent}15`
                                            }}>
                                            <div
                                                style={{
                                                    color: palette.accent
                                                }}>
                                                {getDeviceIcon(passkey.deviceType)}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4
                                                    className="text-lg font-bold"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {passkey.name}
                                                </h4>
                                                <CheckCircle
                                                    className="text-sm"
                                                    style={{ color: "#22c55e" }}
                                                />
                                            </div>
                                            <p
                                                className="text-sm"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                Added {new Date(passkey.createdAt).toLocaleDateString()}
                                            </p>
                                            {passkey.lastUsed && (
                                                <p
                                                    className="text-xs mt-1"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    Last used {new Date(passkey.lastUsed).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <motion.button
                                        className="p-2 rounded-xl"
                                        style={{
                                            color: "#ef4444",
                                            background: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)"
                                        }}
                                        whileHover={{
                                            scale: 1.1,
                                            background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.12)"
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDeletePasskey(passkey.id)}>
                                        <Delete />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Platform Authenticators Info */}
                <motion.div
                    className="mt-8 p-4 rounded-2xl"
                    style={{
                        background: isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.08)",
                        border: `1px solid ${isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.15)"}`
                    }}>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        <strong style={{ color: "#22c55e" }}>✓ Supported Authenticators:</strong> Windows Hello, Face ID, Touch ID, Samsung
                        Pass, and other platform authenticators. Works on Chrome, Edge, Firefox, Safari, and Samsung Internet.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
