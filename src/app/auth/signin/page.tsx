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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure
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
    Key
} from "@mui/icons-material";
import { FaDiscord, FaInstagram, FaPatreon, FaPinterest, FaReddit, FaSlack, FaSpotify, FaGitlab } from "react-icons/fa";
import { Config } from "@Config";
import { useAuth } from "@contexts/NextAuthContext";

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
    magicLinkEmail: string;
    isLoading: boolean;
    showPassword: boolean;
    error: string;
    success: string;
    rememberMe: boolean;
    isPasskeySupported: boolean;
    usePasskey: boolean;
}

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { credentialLogin, isAuthenticated, loading: authLoading } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [providers, setProviders] = useState<any>(null);
    const [state, setState] = useState<SignInState>({
        email: "",
        password: "",
        magicLinkEmail: "",
        isLoading: false,
        showPassword: false,
        error: "",
        success: "",
        rememberMe: false,
        isPasskeySupported: false,
        usePasskey: false
    });

    const redirectUrl = React.useMemo(() => {
        const ref = searchParams.get("ref");
        return ref ? decodeURIComponent(ref) : "/dashboard";
    }, [searchParams]);

    // Get available providers
    useEffect(() => {
        getProviders().then(setProviders);
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

    // Auto-open modal if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            onOpen();
        }
    }, [authLoading, isAuthenticated, onOpen]);

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
            const result = await signIn(providerId, {
                callbackUrl: redirectUrl,
                redirect: false, // Don't redirect immediately, handle response
                // For email provider, pass the email as identifier
                ...(providerId === "email" && { email: state.magicLinkEmail })
            });

            if (result?.error) {
                setState(prev => ({
                    ...prev,
                    error: getErrorMessage(result.error || "Unknown error"),
                    isLoading: false
                }));
            } else if (result?.url) {
                // Successful signin, redirect
                window.location.href = result.url;
            } else {
                // For email provider, show success message
                if (providerId === "email") {
                    setState(prev => ({
                        ...prev,
                        success: "Magic link sent! Check your email.",
                        isLoading: false
                    }));
                } else {
                    // Fallback redirect
                    router.push(redirectUrl);
                }
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
            // Implement WebAuthn/Passkey logic here
            // This would integrate with your existing passkey implementation
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

    // Filter enabled providers (exclude credentials and email as they have separate forms)
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
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            classNames={{
                backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
            }}
            hideCloseButton
            isDismissable={false}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sign in to your account to continue
                    </p>
                </ModalHeader>
                <ModalBody className="pb-6">
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
                                            className={`h-12 justify-start text-left ${providerColors[provider.id] || 'border-gray-200 hover:bg-gray-50'}`}
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

                        {/* Passkey Option */}
                        {state.isPasskeySupported && Config.AuthProviders.Passkeys?.enabled && (
                            <>
                                <Divider />
                                <Button
                                    variant="bordered"
                                    className="h-12 justify-start text-left border-purple-200 hover:bg-purple-50 dark:border-purple-500/30 dark:hover:bg-purple-900/20"
                                    onPress={handlePasskeySignIn}
                                    isDisabled={state.isLoading}
                                    startContent={<Fingerprint className="text-purple-500" />}
                                >
                                    Sign in with Passkey
                                </Button>
                            </>
                        )}

                        {/* Email Magic Link Form */}
                        {Config.AuthProviders.email?.enabled && (
                            <>
                                <Divider />
                                <div className="space-y-4">
                                    <Input
                                        type="email"
                                        label="Email"
                                        placeholder="Enter your email for magic link"
                                        value={state.magicLinkEmail}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            magicLinkEmail: e.target.value
                                        }))}
                                        isRequired
                                        startContent={<Email className="text-gray-400" />}
                                    />
                                    <Button
                                        color="primary"
                                        className="w-full h-12"
                                        isDisabled={!state.magicLinkEmail || state.isLoading}
                                        onPress={() => handleProviderSignIn("email")}
                                        startContent={<Email />}
                                    >
                                        Send Magic Link
                                    </Button>
                                </div>
                            </>
                        )}

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
                                            >
                                                {state.showPassword ?
                                                    <VisibilityOff className="text-gray-400" /> :
                                                    <Visibility className="text-gray-400" />
                                                }
                                            </button>
                                        }
                                    />

                                    <Button
                                        type="submit"
                                        color="primary"
                                        className="w-full h-12"
                                        isLoading={state.isLoading}
                                        startContent={!state.isLoading && <Login />}
                                    >
                                        {state.isLoading ? "Signing in..." : "Sign in"}
                                    </Button>
                                </form>
                            </>
                        )}

                        <div className="text-center space-y-2">
                            <Button
                                variant="light"
                                size="sm"
                                onPress={() => router.push("/auth/forgot-password")}
                            >
                                Forgot your password?
                            </Button>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Don&apos;t have an account?{" "}
                                <Button
                                    variant="light"
                                    size="sm"
                                    onPress={() => router.push("/auth/signup")}
                                    className="p-0 h-auto text-primary"
                                >
                                    Sign up
                                </Button>
                            </div>
                        </div>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
}
