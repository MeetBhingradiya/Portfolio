"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
    Send as SendIcon,
    VpnKey as VpnKeyIcon,
    RotateRight as RotateRightIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Axios } from "../../../Utils/Axios";
import { useDesignTheme } from "../../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIHeader, OneUIBadge } from "../../../Components/OneUI";

const steps = ["Enter Email", "Verify OTP", "Reset Password"];

function ForgotPasswordPageContent() {
    const router = useRouter();
    const { designTheme, palette, colorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = colorMode === "dark";
    
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form data
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSendOTP = async () => {
        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await Axios.post("/api/password/forgot", {
                email: email.toLowerCase().trim()
            });

            if (response.data.Status === 1) {
                setSuccess("OTP sent to your email address");
                setActiveStep(1);
            } else {
                setError(response.data.Message || "Failed to send OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };
    const handleVerifyOTP = async () => {
        if (!otp.trim() || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Use the password reset OTP verification endpoint
            const response = await Axios.put("/api/password/verify/otp", {
                email: email.toLowerCase().trim(),
                otp: otp.trim()
            });

            if (response.data.Status === 1) {
                setSuccess("OTP verified successfully");
                setActiveStep(2);
            } else {
                setError(response.data.Message || "Invalid OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };
    const handleResetPassword = async () => {
        if (!newPassword.trim() || newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await Axios.put("/api/password/reset", {
                email: email.toLowerCase().trim(),
                otp: otp.trim(),
                newPassword: newPassword.trim()
            });

            if (response.data.Status === 1) {
                setSuccess(
                    "Password reset successfully! Redirecting to login..."
                );
                setTimeout(() => {
                    router.push("/auth/signin");
                }, 2000);
            } else {
                setError(response.data.Message || "Failed to reset password");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
            setError("");
            setSuccess("");
        } else {
            router.push("/auth/signin");
        }
    };

    const renderStepContent = () => {
        const Card = isApple ? LiquidGlassCard : OneUICard;
        const Button = isApple ? LiquidGlassButton : OneUIButton;
        
        const inputBaseClass = `w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
            isDark 
                ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-accent-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-accent-500'
        } focus:outline-none focus:ring-2 focus:ring-accent-500/20`;

        switch (activeStep) {
            case 0:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center">
                            Enter your email address
                        </h3>
                        
                        <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            We&apos;ll send you an OTP to reset your password
                        </p>
                        
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <EmailIcon />
                            </div>
                            <input
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className={`${inputBaseClass} pl-12`}
                            />
                        </div>
                        
                        <Button
                            onClick={handleSendOTP}
                            disabled={loading || !email.trim()}
                            className="w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RotateRightIcon className="animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <SendIcon />
                                    Send OTP
                                </span>
                            )}
                        </Button>
                    </motion.div>
                );

            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center">
                            Verify OTP
                        </h3>
                        
                        <div className="text-center">
                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                                Enter the 6-digit code sent to
                            </p>
                            <p className="text-accent-500 font-semibold">{email}</p>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <VpnKeyIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(
                                        e.target.value
                                            .replace(/[^0-9]/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                disabled={loading}
                                maxLength={6}
                                className={`${inputBaseClass} pl-12 text-center text-2xl font-bold tracking-widest`}
                            />
                        </div>
                        
                        <Button
                            onClick={handleVerifyOTP}
                            disabled={loading || otp.length !== 6}
                            className="w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RotateRightIcon className="animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircleIcon />
                                    Verify OTP
                                </span>
                            )}
                        </Button>
                        
                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className={`w-full text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}
                        >
                            Didn&apos;t receive the code? Resend
                        </button>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center">
                            Set New Password
                        </h3>
                        
                        <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Choose a strong password for your account
                        </p>
                        
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <LockIcon />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                                className={`${inputBaseClass} pl-12 pr-12`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </button>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <LockIcon />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                className={`${inputBaseClass} pl-12 pr-12`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </button>
                        </div>
                        
                        {newPassword && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className={newPassword.length >= 8 ? 'text-green-500' : 'text-gray-500'}>
                                        At least 8 characters
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className={/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-gray-500'}>
                                        One uppercase letter
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className={/[0-9]/.test(newPassword) ? 'text-green-500' : 'text-gray-500'}>
                                        One number
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <Button
                            onClick={handleResetPassword}
                            disabled={
                                loading ||
                                !newPassword.trim() ||
                                !confirmPassword.trim() ||
                                newPassword !== confirmPassword
                            }
                            className="w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RotateRightIcon className="animate-spin" />
                                    Resetting...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircleIcon />
                                    Reset Password
                                </span>
                            )}
                        </Button>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    const Card = isApple ? LiquidGlassCard : OneUICard;

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
            isDark ? 'bg-gray-950' : 'bg-gray-50'
        } ${isApple ? 'apple-bg' : 'oneui-bg'}`}>
            {/* Background Effects */}
            {isApple && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>
            )}
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <Card intensity={isApple ? "medium" : undefined} className="p-8">
                    {/* Header */}
                    <div className="flex items-center mb-8">
                        <button
                            onClick={() => {
                                if (activeStep > 0) {
                                    setActiveStep(activeStep - 1);
                                    setError("");
                                    setSuccess("");
                                } else {
                                    router.push("/auth/signin");
                                }
                            }}
                            className={`p-2 rounded-xl transition-colors ${
                                isDark 
                                    ? 'hover:bg-gray-800' 
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            <ArrowBackIcon />
                        </button>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white ml-4">
                            Reset Password
                        </h2>
                    </div>

                    {/* Progress Stepper */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            {steps.map((step, index) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                                            index <= activeStep
                                                ? 'bg-accent-500 text-white scale-110'
                                                : isDark
                                                ? 'bg-gray-800 text-gray-400'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {index < activeStep ? <CheckCircleIcon /> : index + 1}
                                        </div>
                                        <span className={`text-xs mt-2 font-medium ${
                                            index <= activeStep 
                                                ? 'text-accent-500' 
                                                : isDark 
                                                ? 'text-gray-400' 
                                                : 'text-gray-600'
                                        }`}>
                                            {step}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-300 ${
                                            index < activeStep 
                                                ? 'bg-accent-500' 
                                                : isDark 
                                                ? 'bg-gray-800' 
                                                : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <div className="text-red-500 mt-0.5">⚠️</div>
                                    <div className="flex-1">
                                        <p className="text-red-500 text-sm font-medium">{error}</p>
                                    </div>
                                    <button
                                        onClick={() => setError("")}
                                        className="text-red-500/60 hover:text-red-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <CheckCircleIcon className="text-green-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-green-500 text-sm font-medium">{success}</p>
                                    </div>
                                    <button
                                        onClick={() => setSuccess("")}
                                        className="text-green-500/60 hover:text-green-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Remember your password?{" "}
                            <button
                                onClick={() => router.push("/auth/signin")}
                                className="text-accent-500 hover:text-accent-600 font-semibold transition-colors"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordPageContent />;
}
