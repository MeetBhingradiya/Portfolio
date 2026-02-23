/**
 * Sign In Page
 * Redesigned with dual-theme support
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../../Components/LiquidGlass";
import { OneUICard, OneUIButton } from "../../../Components/OneUI";
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
    ArrowBack
} from "@mui/icons-material";
import { signIn, useSession } from "../../../Lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
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
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        if (!isPending && session) {
            const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
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
                password: formData.password,
            });

            if (result?.error) {
                setError(result.error.message || "Invalid email or password");
            } else {
                setSuccess("Login successful! Redirecting...");
                const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
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
                callbackURL: searchParams.get("callbackUrl") || "/dashboard"
            });
        } catch (err: any) {
            setError(`Failed to sign in with ${provider}`);
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const oauthProviders = [
        { name: "Google", icon: <Google />, id: "google" },
        { name: "GitHub", icon: <GitHub />, id: "github" }
    ];

    if (isPending) {
        return (
            <div 
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}
            >
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
            style={{ background: palette.background }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* Back Button */}
                <Link href="/">
                    <button
                        className={`flex items-center gap-2 mb-6 ${isApple ? "text-sm" : "text-base font-semibold"} transition-opacity hover:opacity-70`}
                        style={{ color: palette.textSecondary }}
                    >
                        <ArrowBack fontSize="small" />
                        <span>Back to Home</span>
                    </button>
                </Link>

                <Card
                    className={isApple ? "p-8" : "p-10"}
                    intensity={isApple ? "strong" : undefined}
                    elevated={!isApple}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1
                            className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-2`}
                            style={{ color: palette.textPrimary }}
                        >
                            Welcome Back
                        </h1>
                        <p
                            className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                            style={{ color: palette.textSecondary }}
                        >
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* OAuth Providers */}
                    <div className="space-y-3 mb-6">
                        {oauthProviders.map((provider) => (
                            <Button
                                key={provider.id}
                                onClick={() => handleOAuthSignIn(provider.id)}
                                disabled={loading}
                                variant="secondary"
                                className="w-full flex items-center justify-center gap-3"
                            >
                                {provider.icon}
                                <span>Continue with {provider.name}</span>
                            </Button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div
                            className="absolute inset-0 flex items-center"
                        >
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
                                }}
                            >
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Status Messages */}
                    <AnimatePresence>
                        {(error || success) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                <div
                                    className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex items-center gap-3`}
                                    style={{
                                        background: error 
                                            ? "rgba(239, 68, 68, 0.1)" 
                                            : "rgba(34, 197, 94, 0.1)",
                                        border: `1px solid ${error 
                                            ? "rgba(239, 68, 68, 0.3)" 
                                            : "rgba(34, 197, 94, 0.3)"}`
                                    }}
                                >
                                    {error ? (
                                        <ErrorIcon style={{ color: "rgb(239, 68, 68)" }} />
                                    ) : (
                                        <CheckCircle style={{ color: "rgb(34, 197, 94)" }} />
                                    )}
                                    <span
                                        className={isApple ? "text-sm" : "text-base font-semibold"}
                                        style={{
                                            color: error 
                                                ? "rgb(239, 68, 68)" 
                                                : "rgb(34, 197, 94)"
                                        }}
                                    >
                                        {error || success}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" id="signin-form">
                        {/* Email */}
                        <div>
                            <label
                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                style={{ color: palette.textSecondary }}
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <Email
                                    className="absolute left-4 top-1/2 -translate-y-1/2"
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
                                    className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-xl" : "pl-14 pr-5 py-4 rounded-2xl"} outline-none transition-all`}
                                    style={{
                                        background: palette.surfaceSecondary,
                                        color: palette.textPrimary,
                                        border: `2px solid ${palette.border}`
                                    }}
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                style={{ color: palette.textSecondary }}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2"
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
                                    className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all`}
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <VisibilityOff 
                                            style={{ color: palette.textTertiary }}
                                            fontSize="small"
                                        />
                                    ) : (
                                        <Visibility 
                                            style={{ color: palette.textTertiary }}
                                            fontSize="small"
                                        />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className={`${isApple ? "text-sm" : "text-base font-semibold"} hover:underline`}
                                style={{ color: palette.accent }}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={() => {
                                const form = document.getElementById('signin-form') as HTMLFormElement;
                                if (form) {
                                    const event = new Event('submit', { cancelable: true, bubbles: true });
                                    form.dispatchEvent(event);
                                }
                            }}
                            disabled={loading}
                            variant="primary"
                            className="w-full flex items-center justify-center gap-2"
                        >
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
                        </Button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p
                            className={isApple ? "text-sm" : "text-base font-medium"}
                            style={{ color: palette.textSecondary }}
                        >
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/auth/signup"
                                className="font-bold hover:underline"
                                style={{ color: palette.accent }}
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </Card>

                {/* Terms & Privacy */}
                <p
                    className={`text-center mt-6 ${isApple ? "text-xs" : "text-sm font-medium"}`}
                    style={{ color: palette.textTertiary }}
                >
                    By signing in, you agree to our{" "}
                    <Link href="/terms" className="underline hover:opacity-70">
                        Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="underline hover:opacity-70">
                        Privacy Policy
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function SignInPage() {
    return <SignInContent />;
}
