/**
 * Sign Up Page
 * Redesigned with dual-theme support and multi-step form
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIBadge } from "../../../Components/OneUI";
import {
    Email,
    Lock,
    Person,
    Visibility,
    VisibilityOff,
    ArrowBack,
    ArrowForward,
    CheckCircle,
    Error as ErrorIcon,
    Google,
    GitHub,
    Check
} from "@mui/icons-material";
import { signIn } from "../../../Lib/auth-client";
import { useRouter } from "next/navigation";
import { Axios } from "../../../Utils/Axios";
import Link from "next/link";

interface SignUpFormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    username: string;
    agreeToTerms: boolean;
}

function SignUpContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<SignUpFormData>({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        username: "",
        agreeToTerms: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const totalSteps = 3;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        setError("");
    };

    const validateStep = () => {
        setError("");

        if (currentStep === 1) {
            if (!formData.email) {
                setError("Email is required");
                return false;
            }
            if (!/\S+@\S+\.\S+/.test(formData.email)) {
                setError("Please enter a valid email");
                return false;
            }
        }

        if (currentStep === 2) {
            if (!formData.password) {
                setError("Password is required");
                return false;
            }
            if (formData.password.length < 8) {
                setError("Password must be at least 8 characters");
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match");
                return false;
            }
        }

        if (currentStep === 3) {
            if (!formData.firstName || !formData.lastName) {
                setError("First and last name are required");
                return false;
            }
            if (!formData.username) {
                setError("Username is required");
                return false;
            }
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
                setError("Username must be 3-20 characters (letters, numbers, underscore only)");
                return false;
            }
            if (!formData.agreeToTerms) {
                setError("You must agree to the Terms of Service");
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError("");
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        setError("");

        try {
            const response = await Axios.post("/api/auth/signup", {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username
            });

            if (response.data.Status === 1) {
                setSuccess("Account created successfully! Redirecting to login...");
                setTimeout(() => router.push("/auth/signin"), 2000);
            } else {
                setError(response.data.Message || "Failed to create account");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "An error occurred during registration");
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthSignUp = async (provider: string) => {
        setLoading(true);
        try {
            await signIn.social({
                provider: provider as any,
                callbackURL: "/dashboard"
            });
        } catch (err: any) {
            setError(`Failed to sign up with ${provider}`);
            setLoading(false);
        }
    };

    const oauthProviders = [
        { name: "Google", icon: <Google />, id: "google" },
        { name: "GitHub", icon: <GitHub />, id: "github" }
    ];

    const passwordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: 0, label: "", color: palette.border };
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
        const colors = ["#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e"];
        
        return {
            strength: (strength / 5) * 100,
            label: labels[strength - 1] || "Weak",
            color: colors[strength - 1] || "#ef4444"
        };
    };

    const strength = passwordStrength();

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
                            Create Account
                        </h1>
                        <p
                            className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                            style={{ color: palette.textSecondary }}
                        >
                            Sign up to get started
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div
                                    className={`${isApple ? "w-10 h-10 rounded-xl" : "w-12 h-12 rounded-2xl"} flex items-center justify-center transition-all`}
                                    style={{
                                        background: step <= currentStep ? palette.accent : palette.surfaceSecondary,
                                        color: step <= currentStep ? "#ffffff" : palette.textTertiary
                                    }}
                                >
                                    {step < currentStep ? (
                                        <Check />
                                    ) : (
                                        <span className={isApple ? "font-bold" : "font-black"}>{step}</span>
                                    )}
                                </div>
                                {step < 3 && (
                                    <div
                                        className="flex-1 h-1 mx-2"
                                        style={{
                                            background: step < currentStep ? palette.accent : palette.border
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* OAuth Providers (Step 1 only) */}
                    {currentStep === 1 && (
                        <div className="space-y-3 mb-6">
                            {oauthProviders.map((provider) => (
                                <Button
                                    key={provider.id}
                                    onClick={() => handleOAuthSignUp(provider.id)}
                                    disabled={loading}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center gap-3"
                                >
                                    {provider.icon}
                                    <span>Continue with {provider.name}</span>
                                </Button>
                            ))}

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
                                        }}
                                    >
                                        Or sign up with email
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {/* Form Steps */}
                    <AnimatePresence mode="wait">
                        {/* Step 1: Email */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
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

                                <Button
                                    onClick={handleNext}
                                    disabled={loading}
                                    variant="primary"
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    <span>Continue</span>
                                    <ArrowForward />
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 2: Password */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
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
                                            placeholder="Create a strong password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                        >
                                            {showPassword ? (
                                                <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                            ) : (
                                                <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Password Strength */}
                                    {formData.password && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span
                                                    className={isApple ? "text-xs" : "text-sm font-semibold"}
                                                    style={{ color: strength.color }}
                                                >
                                                    {strength.label}
                                                </span>
                                                <span
                                                    className={isApple ? "text-xs" : "text-sm"}
                                                    style={{ color: palette.textTertiary }}
                                                >
                                                    {Math.round(strength.strength)}%
                                                </span>
                                            </div>
                                            <div
                                                className="h-2 rounded-full overflow-hidden"
                                                style={{ background: palette.surfaceSecondary }}
                                            >
                                                <div
                                                    className="h-full transition-all duration-300 rounded-full"
                                                    style={{
                                                        width: `${strength.strength}%`,
                                                        background: strength.color
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label
                                        className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-4 top-1/2 -translate-y-1/2"
                                            style={{ color: palette.textTertiary }}
                                            fontSize="small"
                                        />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                            className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="Re-enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                        >
                                            {showConfirmPassword ? (
                                                <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                            ) : (
                                                <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleBack}
                                        disabled={loading}
                                        variant="secondary"
                                        className="flex-1 flex items-center justify-center gap-2"
                                    >
                                        <ArrowBack />
                                        <span>Back</span>
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={loading}
                                        variant="primary"
                                        className="flex-1 flex items-center justify-center gap-2"
                                    >
                                        <span>Continue</span>
                                        <ArrowForward />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Profile Details */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Username
                                    </label>
                                    <div className="relative">
                                        <Person
                                            className="absolute left-4 top-1/2 -translate-y-1/2"
                                            style={{ color: palette.textTertiary }}
                                            fontSize="small"
                                        />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                            className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-xl" : "pl-14 pr-5 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="johndoe"
                                        />
                                    </div>
                                </div>

                                {/* Terms Checkbox */}
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        name="agreeToTerms"
                                        checked={formData.agreeToTerms}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 ${isApple ? "w-4 h-4" : "w-5 h-5"} cursor-pointer`}
                                        style={{ accentColor: palette.accent }}
                                    />
                                    <label
                                        className={`${isApple ? "text-xs" : "text-sm font-medium"}`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        I agree to the{" "}
                                        <Link href="/terms" className="font-bold hover:underline" style={{ color: palette.accent }}>
                                            Terms of Service
                                        </Link>
                                        {" "}and{" "}
                                        <Link href="/privacy" className="font-bold hover:underline" style={{ color: palette.accent }}>
                                            Privacy Policy
                                        </Link>
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleBack}
                                        disabled={loading}
                                        variant="secondary"
                                        className="flex-1 flex items-center justify-center gap-2"
                                    >
                                        <ArrowBack />
                                        <span>Back</span>
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        variant="primary"
                                        className="flex-1 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div 
                                                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                                                    style={{ borderColor: "#ffffff" }}
                                                />
                                                <span>Creating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle />
                                                <span>Create Account</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sign In Link */}
                    <div className="mt-6 text-center">
                        <p
                            className={isApple ? "text-sm" : "text-base font-medium"}
                            style={{ color: palette.textSecondary }}
                        >
                            Already have an account?{" "}
                            <Link
                                href="/auth/signin"
                                className="font-bold hover:underline"
                                style={{ color: palette.accent }}
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}

export default function SignUpPage() {
    return <SignUpContent />;
}
