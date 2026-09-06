/**
 * Sign In Page
 * Enhanced with dual-theme support and Better Auth integration
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIButton } from "@Components/Atoms/OneUI";
import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    Login,
    Google,
    GitHub,
    CheckCircle,
    Error as ErrorIcon,
    ArrowBack,
    Fingerprint,
    Info,
    Microsoft
} from "@mui/icons-material";
import { signIn, useSession, passkey } from "@Library/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CookieWarning } from "@Components/Common/CookieWarning";

function SignInContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, isPending } = useSession();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Redirect if already logged in (unless adding new account)
    useEffect(() => {
        const addingAccount = searchParams.get("addAccount") === "true";
        if (!isPending && session && !addingAccount) {
            const callbackUrl = searchParams.get("callbackUrl") || "/settings";
            router.push(callbackUrl);
        }
    }, [isPending, session, router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const result = await signIn.email({
                email: formData.email,
                password: formData.password
            });

            if (result?.error) {
                setError(result.error.message || "Invalid email or password");
            } else {
                setSuccess("Login successful! Redirecting...");
                const callbackUrl = searchParams.get("callbackUrl") || "/settings";
                setTimeout(() => router.push(callbackUrl), 1000);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthSignIn = async (provider: string) => {
        setLoading(true);
        setError("");

        try {
            await signIn.social({
                provider: provider as any,
                callbackURL: searchParams.get("callbackUrl") || "/settings"
            });
        } catch (err: any) {
            setError(`Failed to sign in with ${provider}`);
            setLoading(false);
        }
    };

    const handlePasskeySignIn = async () => {
        setPasskeyLoading(true);
        setError("");
        setSuccess("");

        try {
            const result = await signIn.passkey();

            if (result?.error) {
                setError(result.error.message || "Passkey authentication failed");
            } else {
                setSuccess("Signed in with passkey! Redirecting...");
                const callbackUrl = searchParams.get("callbackUrl") || "/settings";
                setTimeout(() => router.push(callbackUrl), 1000);
            }
        } catch (err: any) {
            setError(err.message || "No passkeys found on this device. Please use email/password or register a passkey on this device.");
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const oauthProviders = [
        { name: "Google", icon: <Google />, id: "google" },
        { name: "GitHub", icon: <GitHub />, id: "github" },
        { name: "Microsoft", icon: <Microsoft />, id: "microsoft" }
    ];

    if (isPending) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div
                    className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-6"
            style={{
                background:
                    isApple && isDark
                        ? `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)`
                        : palette.background
            }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md">
                {/* Back Button */}
                <Link href="/">
                    <motion.button
                        className={`flex items-center gap-2 mb-6 ${isApple ? "text-sm" : "text-base font-semibold"}`}
                        style={{ color: palette.textSecondary }}
                        whileHover={{ x: -4, opacity: 0.7 }}
                        transition={{ duration: 0.2 }}>
                        <ArrowBack fontSize="small" />
                        <span>Back to Home</span>
                    </motion.button>
                </Link>

                {/* Cookie blocked warning */}
                <CookieWarning />

                <Card
                    className={isApple ? "p-8" : "p-10"}
                    intensity={isApple ? "strong" : undefined}
                    elevated={!isApple}>
                    {/* Add Account Notice */}
                    {searchParams.get("addAccount") === "true" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl flex items-center gap-3"
                            style={{
                                background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                                border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"}`
                            }}>
                            <Info style={{ color: "#3b82f6" }} />
                            <div>
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: "#3b82f6" }}>
                                    Adding Another Account
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: palette.textSecondary }}>
                                    Sign in with a different account to switch between them
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-2`}
                            style={{ color: palette.textPrimary }}>
                            Welcome Back
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                            style={{ color: palette.textSecondary }}>
                            Sign in to your account to continue
                        </motion.p>
                    </div>

                    {/* OAuth Providers */}
                    <motion.div
                        className="space-y-3 mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}>
                        <div className="flex items-center justify-center gap-3">
                            {/* Passkey Button */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}>
                                <Button
                                    onClick={handlePasskeySignIn}
                                    disabled={passkeyLoading || loading}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center gap-3">
                                    {passkeyLoading ? (
                                        <>
                                            <div
                                                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                                                style={{
                                                    borderColor: palette.accent
                                                }}
                                            />
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Fingerprint />
                                        </>
                                    )}
                                </Button>
                            </motion.div>

                            {oauthProviders.map((provider, index) => (
                                <motion.div
                                    key={provider.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}>
                                    <Button
                                        onClick={() => handleOAuthSignIn(provider.id)}
                                        disabled={loading || passkeyLoading}
                                        variant="secondary"
                                        className="flex flex-row items-center justify-center gap-3">
                                        {provider.icon}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div
                                className="w-full border-t"
                                style={{ borderColor: palette.border }}
                            />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span
                                className={`px-4 ${isApple ? "text-xs" : "text-sm font-semibold"}`}
                                style={{
                                    background: palette.surface,
                                    color: palette.textTertiary
                                }}>
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Status Messages */}
                    <AnimatePresence>
                        {(error || success) && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    height: 0,
                                    marginBottom: 0
                                }}
                                animate={{
                                    opacity: 1,
                                    height: "auto",
                                    marginBottom: 24
                                }}
                                exit={{
                                    opacity: 0,
                                    height: 0,
                                    marginBottom: 0
                                }}>
                                <div
                                    className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex items-center gap-3`}
                                    style={{
                                        background: error ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                                        border: `1px solid ${error ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`
                                    }}>
                                    {error ? (
                                        <ErrorIcon
                                            style={{
                                                color: "rgb(239, 68, 68)"
                                            }}
                                        />
                                    ) : (
                                        <CheckCircle
                                            style={{
                                                color: "rgb(34, 197, 94)"
                                            }}
                                        />
                                    )}
                                    <span
                                        className={isApple ? "text-sm" : "text-base font-semibold"}
                                        style={{
                                            color: error ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"
                                        }}>
                                        {error || success}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5">
                        {/* Email */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}>
                            <label
                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                style={{ color: palette.textSecondary }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Email
                                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: palette.textTertiary }}
                                    fontSize="small"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-xl" : "pl-14 pr-5 py-4 rounded-2xl"} outline-none transition-all focus:ring-2`}
                                    style={{
                                        background: palette.surfaceSecondary,
                                        color: palette.textPrimary,
                                        border: `2px solid ${palette.border}`
                                    }}
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </motion.div>

                        {/* Password */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}>
                            <label
                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                style={{ color: palette.textSecondary }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: palette.textTertiary }}
                                    fontSize="small"
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all focus:ring-2`}
                                    style={{
                                        background: palette.surfaceSecondary,
                                        color: palette.textPrimary,
                                        border: `2px solid ${palette.border}`
                                    }}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                                    disabled={loading}>
                                    {showPassword ? (
                                        <VisibilityOff
                                            style={{
                                                color: palette.textTertiary
                                            }}
                                            fontSize="small"
                                        />
                                    ) : (
                                        <Visibility
                                            style={{
                                                color: palette.textTertiary
                                            }}
                                            fontSize="small"
                                        />
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className={`${isApple ? "text-sm" : "text-base font-semibold"} hover:underline transition-opacity hover:opacity-70`}
                                style={{ color: palette.accent }}>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex items-center justify-center gap-2 ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl"} font-semibold transition-all`}
                                style={{
                                    background: loading ? palette.textTertiary : palette.accent,
                                    color: palette.textOnAccent,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1
                                }}>
                                {loading ? (
                                    <>
                                        <div
                                            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                                            style={{ borderColor: "#ffffff" }}
                                        />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <Login />
                                        <span>Sign In</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    {/* Sign Up Link */}
                    <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}>
                        <p
                            className={isApple ? "text-sm" : "text-base font-medium"}
                            style={{ color: palette.textSecondary }}>
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/auth/signup"
                                className="font-bold hover:underline transition-opacity hover:opacity-70"
                                style={{ color: palette.accent }}>
                                Sign up
                            </Link>
                        </p>
                    </motion.div>
                </Card>

                {/* Terms & Privacy */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className={`text-center mt-6 ${isApple ? "text-xs" : "text-sm font-medium"}`}
                    style={{ color: palette.textTertiary }}>
                    By signing in, you agree to our{" "}
                    <Link
                        href="/terms"
                        className="underline hover:opacity-70">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy"
                        className="underline hover:opacity-70">
                        Privacy Policy
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse text-white text-xl">Loading...</div>
                </div>
            }>
            <SignInContent />
        </Suspense>
    );
}
