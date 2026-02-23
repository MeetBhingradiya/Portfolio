/**
 * Two-Factor Authentication Setup Page
 * Allows users to enable/disable and manage 2FA methods
 */

"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth, twoFactor } from "@Library/auth-client";
import Link from "next/link";
import {
    Security,
    PhoneIphone,
    Email,
    QrCode2,
    ArrowBack,
    CheckCircle,
    Warning,
    Info
} from "@mui/icons-material";

export default function TwoFactorPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, session, isAuthenticated } = useAuth();
    const [activeMethod, setActiveMethod] = useState<"totp" | "sms" | "email" | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [verificationCode, setVerificationCode] = useState("");
    const [password, setPassword] = useState("");
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const twoFactorMethods = [
        {
            id: "totp",
            name: "Authenticator App",
            icon: <QrCode2 />,
            description: "Use an authenticator app like Google Authenticator or Authy",
            enabled: false, // TODO: Get from user settings
            recommended: true
        },
        {
            id: "sms",
            name: "SMS Verification",
            icon: <PhoneIphone />,
            description: "Receive verification codes via text message",
            enabled: false, // TODO: Get from user settings
            recommended: false
        },
        {
            id: "email",
            name: "Email Verification",
            icon: <Email />,
            description: "Receive verification codes via email",
            enabled: false, // TODO: Get from user settings
            recommended: false
        }
    ];

    const handleEnableMethod = async (method: "totp" | "sms" | "email") => {
        setActiveMethod(method);
        
        if (method === "totp") {
            // First prompt for password, then enable 2FA
            setShowPasswordPrompt(true);
        }
    };

    const handleGenerateTOTP = async () => {
        if (!password) {
            alert("Please enter your password");
            return;
        }

        try {
            // Enable 2FA and get TOTP URI
            const result = await twoFactor.enable({ password });
            if (result.data?.totpURI) {
                // Convert TOTP URI to QR code URL using a QR code API
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.data.totpURI)}`;
                setQrCode(qrUrl);
                setShowPasswordPrompt(false);
            }
        } catch (error) {
            console.error("Failed to generate TOTP:", error);
            alert("Failed to enable 2FA. Please check your password.");
        }
    };

    const handleVerifyAndEnable = async () => {
        if (!verificationCode || !activeMethod) return;
        
        try {
            if (activeMethod === "totp") {
                const result = await twoFactor.verifyTotp({
                    code: verificationCode,
                });
                
                // TODO: Backup codes may be in a different response
                // Check Better Auth docs for backup codes implementation
            }
            
            // Close modal and refresh
            setActiveMethod(null);
            setVerificationCode("");
        } catch (error) {
            console.error("Failed to verify 2FA:", error);
            alert("Invalid verification code. Please try again.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <Warning className="text-6xl mb-4" style={{ color: palette.accent }} />
                    <h1 className="text-2xl font-bold mb-2" style={{ color: palette.textPrimary }}>
                        Authentication Required
                    </h1>
                    <p className="mb-6" style={{ color: palette.textSecondary }}>
                        Please sign in to manage your security settings
                    </p>
                    <Link href="/auth/signin">
                        <motion.button
                            className="px-6 py-3 rounded-xl font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#ffffff"
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Sign In
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: palette.background }}>
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
                            }}
                        >
                            <ArrowBack />
                            <span>Back to Security</span>
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl" style={{ background: `${palette.accent}20` }}>
                            <Security className="text-3xl" style={{ color: palette.accent }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>
                                Two-Factor Authentication
                            </h1>
                            <p style={{ color: palette.textSecondary }}>
                                Add an extra layer of security to your account
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <motion.div
                    className="mb-6 p-4 rounded-2xl flex gap-3"
                    style={{
                        background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                        border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"}`
                    }}
                >
                    <Info style={{ color: "#3b82f6" }} />
                    <div>
                        <p className="font-semibold mb-1" style={{ color: "#3b82f6" }}>
                            Enhanced Security
                        </p>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Two-factor authentication adds an additional layer of security by requiring a verification code in addition to your password.
                        </p>
                    </div>
                </motion.div>

                {/* 2FA Methods */}
                <div className="space-y-4 mb-8">
                    {twoFactorMethods.map((method) => (
                        <motion.div
                            key={method.id}
                            className="p-6 rounded-2xl"
                            style={{
                                background: isApple
                                    ? isDark
                                        ? "rgba(38, 38, 42, 0.6)"
                                        : "rgba(255, 255, 255, 0.6)"
                                    : palette.surface,
                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                            }}
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4 flex-1">
                                    <div className="p-3 rounded-xl" style={{ background: `${palette.accent}15` }}>
                                        <div style={{ color: palette.accent }}>{method.icon}</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                                                {method.name}
                                            </h3>
                                            {method.recommended && (
                                                <span
                                                    className="px-2 py-0.5 text-xs font-semibold rounded-full"
                                                    style={{
                                                        background: `${palette.accent}20`,
                                                        color: palette.accent
                                                    }}
                                                >
                                                    Recommended
                                                </span>
                                            )}
                                            {method.enabled && (
                                                <CheckCircle className="text-sm" style={{ color: "#22c55e" }} />
                                            )}
                                        </div>
                                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                                            {method.description}
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    className="px-4 py-2 rounded-xl font-semibold"
                                    style={{
                                        background: method.enabled ? "transparent" : palette.accent,
                                        color: method.enabled ? palette.accent : "#ffffff",
                                        border: method.enabled ? `1px solid ${palette.accent}` : "none"
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEnableMethod(method.id as any)}
                                >
                                    {method.enabled ? "Disable" : "Enable"}
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Setup Modal (shown when activeMethod is set) */}
                {activeMethod && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0, 0, 0, 0.5)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className="w-full max-w-md p-6 rounded-2xl"
                            style={{ background: palette.surface }}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <h2 className="text-xl font-bold mb-4" style={{ color: palette.textPrimary }}>
                                Setup {twoFactorMethods.find(m => m.id === activeMethod)?.name}
                            </h2>
                            
                            {showPasswordPrompt && activeMethod === "totp" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: palette.textPrimary }}>
                                            Enter your password to continue
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl"
                                            style={{
                                                background: palette.background,
                                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                                                color: palette.textPrimary
                                            }}
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <motion.button
                                            className="flex-1 px-4 py-3 rounded-xl font-semibold"
                                            style={{
                                                background: "transparent",
                                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                                                color: palette.textPrimary
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setActiveMethod(null);
                                                setShowPasswordPrompt(false);
                                                setPassword("");
                                            }}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            className="flex-1 px-4 py-3 rounded-xl font-semibold"
                                            style={{
                                                background: palette.accent,
                                                color: "#ffffff"
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleGenerateTOTP}
                                        >
                                            Continue
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                            
                            {!showPasswordPrompt && activeMethod === "totp" && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl text-center" style={{ background: palette.background }}>
                                        {qrCode ? (
                                            <img 
                                                src={qrCode} 
                                                alt="QR Code" 
                                                className="w-48 h-48 mx-auto rounded-xl"
                                            />
                                        ) : (
                                            <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center">
                                                <QrCode2 className="text-6xl" style={{ color: "#000" }} />
                                            </div>
                                        )}
                                        <p className="mt-4 text-sm" style={{ color: palette.textSecondary }}>
                                            Scan this QR code with your authenticator app
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!showPasswordPrompt && (
                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-2" style={{ color: palette.textPrimary }}>
                                    Enter verification code
                                </label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl"
                                    style={{
                                        background: palette.background,
                                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                                        color: palette.textPrimary
                                    }}
                                    placeholder="000000"
                                />
                            </div>
                            )}

                            {!showPasswordPrompt && (
                            <div className="flex gap-3 mt-6">
                                <motion.button
                                    className="flex-1 px-4 py-3 rounded-xl font-semibold"
                                    style={{
                                        background: "transparent",
                                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                                        color: palette.textPrimary
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setActiveMethod(null);
                                        setQrCode(null);
                                        setPassword("");
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    className="flex-1 px-4 py-3 rounded-xl font-semibold"
                                    style={{
                                        background: palette.accent,
                                        color: "#ffffff"
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleVerifyAndEnable}
                                >
                                    Verify & Enable
                                </motion.button>
                            </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {/* Backup Codes Section */}
                <motion.div
                    className="p-6 rounded-2xl"
                    style={{
                        background: isApple
                            ? isDark
                                ? "rgba(38, 38, 42, 0.6)"
                                : "rgba(255, 255, 255, 0.6)"
                            : palette.surface,
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                    }}
                >
                    <h3 className="text-lg font-bold mb-2" style={{ color: palette.textPrimary }}>
                        Backup Codes
                    </h3>
                    <p className="text-sm mb-4" style={{ color: palette.textSecondary }}>
                        Save these backup codes in a secure place. Each code can be used once if you lose access to your 2FA method.
                    </p>
                    <motion.button
                        className="px-4 py-2 rounded-xl font-semibold"
                        style={{
                            background: palette.accent,
                            color: "#ffffff"
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Generate Backup Codes
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
