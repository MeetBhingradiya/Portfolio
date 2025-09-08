"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn, getSession } from "next-auth/react";
import {
    Card,
    CardBody,
    Button,
    Input,
    Divider,
    Spinner,
    Alert,
    Chip
} from "@heroui/react";
import {
    Visibility,
    VisibilityOff,
    Login,
    ErrorOutline,
    CheckCircle,
    Security,
    Fingerprint,
    Google as GoogleIcon,
    GitHub,
    Facebook,
    Microsoft,
    LinkedIn,
    Apple,
    X as TwitterIcon,
    Email,
    Key,
    Home,
    ArrowBack
} from "@mui/icons-material";
import { FaDiscord, FaInstagram, FaPatreon, FaPinterest, FaReddit, FaSlack, FaSpotify, FaGitlab } from "react-icons/fa";
import { Config } from "@Config";
import { useAuth } from "@contexts/NextAuthContext";
import Link from "next/link";

// Provider Icons Mapping
const providerIcons: Record<string, React.ReactNode> = {
    google: <GoogleIcon className="text-red-500" />,
    github: <GitHub className="text-gray-700 dark:text-gray-300" />,
    discord: <FaDiscord className="text-indigo-500" />,
    apple: <Apple className="text-gray-800 dark:text-white" />,
    facebook: <Facebook className="text-blue-600" />,
    linkedin: <LinkedIn className="text-blue-700" />,
    microsoft: <Microsoft className="text-blue-500" />,
    instagram: <FaInstagram className="text-pink-500" />,
    patreon: <FaPatreon className="text-orange-500" />,
    pinterest: <FaPinterest className="text-red-600" />,
    reddit: <FaReddit className="text-orange-600" />,
    slack: <FaSlack className="text-purple-500" />,
    spotify: <FaSpotify className="text-green-500" />,
    twitter: <TwitterIcon className="text-black dark:text-white" />,
    gitlab: <FaGitlab className="text-orange-500" />,
    email: <Email className="text-blue-500" />,
    credentials: <Key className="text-gray-600" />
};

// Provider Colors
const providerColors: Record<string, string> = {
    google: "border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-900/20",
    github: "border-gray-200 hover:bg-gray-50 dark:border-gray-500/30 dark:hover:bg-gray-800/20",
    discord: "border-indigo-200 hover:bg-indigo-50 dark:border-indigo-500/30 dark:hover:bg-indigo-900/20",
    apple: "border-gray-200 hover:bg-gray-50 dark:border-gray-500/30 dark:hover:bg-gray-800/20",
    facebook: "border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20",
    linkedin: "border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20",
    microsoft: "border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20",
    instagram: "border-pink-200 hover:bg-pink-50 dark:border-pink-500/30 dark:hover:bg-pink-900/20",
    patreon: "border-orange-200 hover:bg-orange-50 dark:border-orange-500/30 dark:hover:bg-orange-900/20",
    pinterest: "border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-900/20",
    reddit: "border-orange-200 hover:bg-orange-50 dark:border-orange-500/30 dark:hover:bg-orange-900/20",
    slack: "border-purple-200 hover:bg-purple-50 dark:border-purple-500/30 dark:hover:bg-purple-900/20",
    spotify: "border-green-200 hover:bg-green-50 dark:border-green-500/30 dark:hover:bg-green-900/20",
    twitter: "border-gray-200 hover:bg-gray-50 dark:border-gray-500/30 dark:hover:bg-gray-800/20",
    gitlab: "border-orange-200 hover:bg-orange-50 dark:border-orange-500/30 dark:hover:bg-orange-900/20",
    email: "border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20",
    credentials: "border-gray-200 hover:bg-gray-50 dark:border-gray-500/30 dark:hover:bg-gray-800/20"
};

interface SignInState {
    email: string;
    password: string;
    isLoading: boolean;
    showPassword: boolean;
    error: string;
    success: string;
    isPasskeySupported: boolean;
}

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { credentialLogin, isAuthenticated, loading: authLoading } = useAuth();

    const [providers, setProviders] = useState<any>(null);
    const [state, setState] = useState<SignInState>({
        email: "",
        password: "",
        isLoading: false,
        showPassword: false,
        error: "",
        success: "",
        isPasskeySupported: false
    });

    const redirectUrl = React.useMemo(() => {
        const ref = searchParams.get("ref");
        return ref ? decodeURIComponent(ref) : "/dashboard";
    }, [searchParams]);

    // Get available providers
    useEffect(() => {
        getProviders().then((providerData) => {
            console.log("Available providers:", providerData);
            setProviders(providerData);
        });
    }, []);

    // Check for passkey support
    useEffect(() => {
        const checkPasskeySupport = async () => {
            try {
                const isSupported =
                    typeof window !== "undefined" &&
                    window.PublicKeyCredential &&
                    typeof window.PublicKeyCredential
                        .isUserVerifyingPlatformAuthenticatorAvailable === "function";

                if (isSupported) {
                    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    setState((prev) => ({
                        ...prev,
                        isPasskeySupported: available
                    }));
                }
            } catch (error) {
                console.warn("Passkey support check failed:", error);
            }
        };

        checkPasskeySupport();
    }, []);

    // Check authentication status
    useEffect(() => {
        if (isAuthenticated) {
            setState((prev) => ({
                ...prev,
                success: "Already signed in! Redirecting..."
            }));
            setTimeout(() => {
                router.push(redirectUrl);
            }, 1000);
        }
    }, [isAuthenticated, router, redirectUrl]);

    // Check for error in URL
    useEffect(() => {
        const error = searchParams.get("error");
        if (error) {
            setState(prev => ({
                ...prev,
                error: getErrorMessage(error)
            }));
        }
    }, [searchParams]);

    const getErrorMessage = (error: string): string => {
        switch (error) {
            case "CredentialsSignin":
                return "Invalid email or password";
            case "OAuthCallback":
                return "OAuth provider error. Please try again.";
            case "OAuthSignin":
                return "OAuth signin error. Please try again.";
            case "EmailCreateAccount":
                return "Email already in use with different provider";
            case "Callback":
                return "Authentication callback error";
            case "OAuthAccountNotLinked":
                return "Account already exists with different provider";
            case "EmailSignin":
                return "Email signin error";
            case "SessionRequired":
                return "Please sign in to continue";
            default:
                return "Authentication error occurred";
        }
    };

    const handleCredentialSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!state.email || !state.password) {
            setState(prev => ({
                ...prev,
                error: "Email and password are required"
            }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: "" }));

        try {
            const result = await credentialLogin(state.email, state.password);

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    success: "Sign in successful! Redirecting..."
                }));
                setTimeout(() => {
                    router.push(redirectUrl);
                }, 1000);
            } else {
                setState(prev => ({
                    ...prev,
                    error: result.error || "Sign in failed"
                }));
            }
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message || "Sign in failed"
            }));
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleProviderSignIn = async (providerId: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: "" }));

        try {
            // For email provider, prompt for email address
            if (providerId === "email") {
                const email = prompt("Enter your email address for the magic link:");
                if (!email) {
                    setState(prev => ({ ...prev, isLoading: false }));
                    return;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    setState(prev => ({
                        ...prev,
                        error: "Please enter a valid email address",
                        isLoading: false
                    }));
                    return;
                }
                
                const result = await signIn(providerId, {
                    email: email,
                    callbackUrl: redirectUrl,
                    redirect: false
                });

                if (result?.error) {
                    setState(prev => ({
                        ...prev,
                        error: result.error || "Failed to send magic link",
                        isLoading: false
                    }));
                } else {
                    setState(prev => ({
                        ...prev,
                        success: "Magic link sent! Check your email to continue.",
                        isLoading: false
                    }));
                }
                return;
            }

            // For other OAuth providers
            const result = await signIn(providerId, {
                callbackUrl: redirectUrl,
                redirect: false
            });

            if (result?.error) {
                setState(prev => ({
                    ...prev,
                    error: getErrorMessage(result.error || "Unknown error"),
                    isLoading: false
                }));
            } else if (result?.url) {
                window.location.href = result.url;
            } else {
                router.push(redirectUrl);
            }
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message || "Provider sign in failed",
                isLoading: false
            }));
        }
    };

    const handlePasskeySignIn = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: "" }));

        try {
            console.log("Passkey signin not yet implemented");
            setState(prev => ({
                ...prev,
                error: "Passkey signin coming soon",
                isLoading: false
            }));
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message || "Passkey signin failed",
                isLoading: false
            }));
        }
    };

    // Filter enabled providers
    const enabledProviders = providers ? Object.values(providers).filter((provider: any) => {
        const configProvider = Config.AuthProviders[provider.id];
        return configProvider?.enabled && provider.id !== "credentials" && provider.id !== "email";
    }) : [];

    // Check if device is iOS/macOS for Apple provider
    const isAppleDevice = typeof window !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.userAgent.includes("Mac") && "ontouchend" in document));

    const filteredProviders = enabledProviders.filter((provider: any) => {
        if (provider.id === "apple") {
            return isAppleDevice;
        }
        return true;
    });

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] pb-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800 mb-6">
                            <Security className="h-4 w-4" />
                            <span>Currently only for Admins</span>
                        </div>

                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3">
                            Welcome back
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Sign in to your account to continue
                        </p>
                    </motion.div>

                    {/* Sign In Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                            <CardBody className="p-8">
                                <div className="space-y-6">
                                    {/* Error/Success Messages */}
                                    <AnimatePresence>
                                        {state.error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <Alert
                                                    color="danger"
                                                    variant="flat"
                                                    startContent={<ErrorOutline />}
                                                    title="Error"
                                                    description={state.error}
                                                />
                                            </motion.div>
                                        )}

                                        {state.success && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <Alert
                                                    color="success"
                                                    variant="flat"
                                                    startContent={<CheckCircle />}
                                                    title="Success"
                                                    description={state.success}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* OAuth Providers */}
                                    {filteredProviders.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 gap-3">
                                                {filteredProviders.map((provider: any) => (
                                                    <Button
                                                        key={provider.id}
                                                        variant="bordered"
                                                        className={`h-12 justify-start text-left transition-all hover:scale-[1.02] ${providerColors[provider.id] || 'border-gray-200 hover:bg-gray-50'}`}
                                                        onPress={() => handleProviderSignIn(provider.id)}
                                                        isDisabled={state.isLoading}
                                                        startContent={providerIcons[provider.id]}
                                                    >
                                                        Continue with {provider.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-x-3">
                                        {/* Passkey Option */}
                                        {state.isPasskeySupported && Config.AuthProviders.Passkeys?.enabled && (
                                            <>
                                                <Button
                                                    variant="bordered"
                                                    className="h-12 justify-start text-left border-purple-200 hover:bg-purple-50 dark:border-purple-500/30 dark:hover:bg-purple-900/20 transition-all hover:scale-[1.02]"
                                                    onPress={handlePasskeySignIn}
                                                    isDisabled={state.isLoading}
                                                    startContent={<Fingerprint className="text-purple-500" />}
                                                >
                                                    Passkey
                                                </Button>
                                            </>
                                        )}

                                        {/* Email Magic Link Button */}
                                        {Config.AuthProviders.email?.enabled && (
                                            <>
                                                <Button
                                                    variant="bordered"
                                                    className="h-12 justify-start text-left border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20 transition-all hover:scale-[1.02]"
                                                    onPress={() => {
                                                        console.log("Magic link clicked, email config:", Config.AuthProviders.email);
                                                        handleProviderSignIn("email");
                                                    }}
                                                    isDisabled={state.isLoading}
                                                    startContent={<Email className="text-blue-500" />}
                                                >
                                                    Magic Link
                                                </Button>
                                            </>
                                        )}

                                    </div>

                                    {/* Credentials Form */}
                                    {Config.AuthProviders.credentials?.enabled && (
                                        <>
                                            <Divider />
                                            <form onSubmit={handleCredentialSignIn} className="space-y-4">
                                                <Input
                                                    type="email"
                                                    label="Email"
                                                    placeholder="Enter your email"
                                                    value={state.email}
                                                    onChange={(e) => setState(prev => ({
                                                        ...prev,
                                                        email: e.target.value
                                                    }))}
                                                    isRequired
                                                    startContent={<Email className="text-gray-400" />}
                                                    classNames={{
                                                        input: "transition-all",
                                                        inputWrapper: "hover:border-blue-300 focus-within:border-blue-500"
                                                    }}
                                                />

                                                <Input
                                                    type={state.showPassword ? "text" : "password"}
                                                    label="Password"
                                                    placeholder="Enter your password"
                                                    value={state.password}
                                                    onChange={(e) => setState(prev => ({
                                                        ...prev,
                                                        password: e.target.value
                                                    }))}
                                                    isRequired
                                                    startContent={<Key className="text-gray-400" />}
                                                    endContent={
                                                        <button
                                                            type="button"
                                                            onClick={() => setState(prev => ({
                                                                ...prev,
                                                                showPassword: !prev.showPassword
                                                            }))}
                                                            className="focus:outline-none"
                                                        >
                                                            {state.showPassword ?
                                                                <VisibilityOff className="text-gray-400 hover:text-gray-600" /> :
                                                                <Visibility className="text-gray-400 hover:text-gray-600" />
                                                            }
                                                        </button>
                                                    }
                                                    classNames={{
                                                        input: "transition-all",
                                                        inputWrapper: "hover:border-blue-300 focus-within:border-blue-500"
                                                    }}
                                                />

                                                <Button
                                                    type="submit"
                                                    color="primary"
                                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-[1.02]"
                                                    isLoading={state.isLoading}
                                                    startContent={!state.isLoading && <Login />}
                                                >
                                                    {state.isLoading ? "Signing in..." : "Sign in"}
                                                </Button>
                                            </form>
                                        </>
                                    )}

                                    {/* Footer Links */}
                                    <div className="text-center space-y-3 pt-4">
                                        <Button
                                            variant="light"
                                            size="sm"
                                            onPress={() => router.push("/auth/forgot-password")}
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Forgot your password?
                                        </Button>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Don&apos;t have an account?{" "}
                                            <Button
                                                variant="light"
                                                size="sm"
                                                onPress={() => router.push("/auth/signup")}
                                                className="p-0 h-auto text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                            >
                                                Sign up
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
                <Spinner size="lg" />
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
}
