"use client";

import React, { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
    Alert,
    Divider,
    Card,
    CardBody,
    Spinner,
    CircularProgress
} from "@heroui/react";
import {
    PersonAdd,
    AlternateEmail,
    Visibility,
    VisibilityOff,
    Lock,
    Security,
    Login,
    ErrorOutline,
    CheckCircle,
    ArrowBack,
    AccountBox,
    Key,
    Shield,
    Fingerprint,
    FaceRetouchingNatural,
    CloudSync,
    Warning,
    Block,
    Pause
} from "@mui/icons-material";
import { Axios } from "@Utils/Axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import { AccountSwitcher } from "@Components/AccountSwitcher";

interface SigninState {
    username: string;
    password: string;
    isLoading: boolean;
    showPassword: boolean;
    error: string;
    success: string;
    accountStatus: "active" | "suspended" | "blocked" | null;
    rememberMe: boolean;
    isPasskeySupported: boolean;
    usePasskey: boolean;
}

function SignInForm() {
    const { isOpen, onOpen } = useDisclosure();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { AddAccount, Accounts, ActiveAccount } = useAccountSwitcher();
    const [state, setState] = React.useState<SigninState>({
        username: "",
        password: "",
        isLoading: false,
        showPassword: false,
        error: "",
        success: "",
        accountStatus: null,
        rememberMe: false,
        isPasskeySupported: false,
        usePasskey: false
    });

    const shouldShowAccountSwitcher = React.useMemo(() => {
        const acsParam = searchParams.get("acs");
        return acsParam === "1" || Accounts.length > 0;
    }, [searchParams, Accounts.length]);

    const redirectUrl = React.useMemo(() => {
        const ref = searchParams.get("ref");
        return ref ? decodeURIComponent(ref) : "/dashboard";
    }, [searchParams]);

    const shouldShowBackButton = React.useMemo(() => {
        return Accounts.length > 0;
    }, [Accounts.length]);

    // Check for passkey support
    React.useEffect(() => {
        const checkPasskeySupport = async () => {
            try {
                const isSupported =
                    typeof window !== "undefined" &&
                    window.PublicKeyCredential &&
                    typeof window.PublicKeyCredential
                        .isUserVerifyingPlatformAuthenticatorAvailable ===
                        "function";

                if (isSupported) {
                    const available =
                        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
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

    // Check for existing authentication and auto-redirect
    React.useEffect(() => {
        const checkExistingAuth = async () => {
            // Skip auto-redirect if user is explicitly adding another account
            if (searchParams.get("acs") === "1") {
                onOpen();
                return;
            }

            // If user already has an active account, redirect immediately
            if (ActiveAccount) {
                setState((prev) => ({
                    ...prev,
                    success: "Already signed in! Redirecting..."
                }));
                setTimeout(() => {
                    router.push(redirectUrl);
                }, 1000);
                return;
            }

            // Check if there's a valid token in storage
            try {
                const token = localStorage.getItem("auth-token");
                if (token) {
                    // Verify token validity with dashboard endpoint
                    const response = await Axios.get("/api/dashboard");

                    if (response.data.Status === 1) {
                        // Token is valid, try to restore the session
                        const userData = response.data.Data.user;

                        await AddAccount({
                            UserID: userData.UserID,
                            Username: userData.Username,
                            FName: userData.FirstName,
                            LName: userData.LastName,
                            PrimaryEmail:
                                userData.Emails?.find(
                                    (email: any) => email.isPrimary
                                )?.Email || "",
                            Session: {
                                Token: token,
                                ID: userData.sessionID || ""
                            },
                            isAdmin: userData.isAdmin || false,
                            isVerified_forCurrentSession: true,
                            Avatar: userData.Avatar || ""
                        });

                        setState((prev) => ({
                            ...prev,
                            success: "Session restored! Redirecting..."
                        }));

                        setTimeout(() => {
                            router.push(redirectUrl);
                        }, 1000);
                        return;
                    }
                }
            } catch (error) {
                // Token is invalid or expired, clear it
                localStorage.removeItem("auth-token");
                document.cookie =
                    "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            }

            // No valid authentication found, show login form
            onOpen();
        };

        checkExistingAuth();
    }, [searchParams, ActiveAccount, AddAccount, router, redirectUrl, onOpen]);

    React.useEffect(() => {
        // Check for success message from signup
        const message = searchParams.get("message");
        if (message) {
            setState((prev) => ({ ...prev, success: message }));
        }
    }, [searchParams]);

    const handleInputChange = (field: keyof SigninState, value: string) => {
        setState((prev) => ({
            ...prev,
            [field]: value,
            error: "", // Clear error when user types
            success: ""
        }));
    };

    const validateForm = (): boolean => {
        if (!state.username.trim()) {
            setState((prev) => ({ ...prev, error: "Username is required" }));
            return false;
        }

        if (!state.password.trim()) {
            setState((prev) => ({ ...prev, error: "Password is required" }));
            return false;
        }

        if (state.password.length < 6) {
            setState((prev) => ({
                ...prev,
                error: "Password must be at least 6 characters"
            }));
            return false;
        }

        return true;
    };
    const handleSignin = async () => {
        if (!validateForm()) return;

        setState((prev) => ({
            ...prev,
            isLoading: true,
            error: "",
            success: "",
            accountStatus: null
        }));

        try {
            // Prepare signin request
            const signinData = {
                username: state.username.trim(),
                password: state.password,
                rememberMe: state.rememberMe,
                usePasskey: state.usePasskey
            };

            // Send signin request
            const response = await Axios.post("/api/signin", signinData);

            if (response.data.Status === 1) {
                // Success - store the encrypted token
                const encryptedToken = response.data.Data.AuthorisedToken;
                const sessionData = response.data.Data.SessionID;

                // Store token in localStorage and cookies
                localStorage.setItem("auth-token", encryptedToken);
                const maxAge = state.rememberMe
                    ? 30 * 24 * 60 * 60
                    : 24 * 60 * 60; // 30 days or 1 day
                document.cookie = `auth-token=${encryptedToken}; path=/; max-age=${maxAge}; secure; samesite=strict`;

                // Get user data for account switcher
                try {
                    const dashboardResponse = await Axios.get(
                        "/api/dashboard",
                        {
                            headers: {
                                Authorization: `Bearer ${encryptedToken}`
                            }
                        }
                    );

                    if (dashboardResponse.data.Status === 1) {
                        const userData = dashboardResponse.data.Data.user;

                        // Add account to account switcher
                        await AddAccount({
                            UserID: userData.UserID,
                            Username: userData.Username,
                            FName: userData.FirstName,
                            LName: userData.LastName,
                            PrimaryEmail:
                                userData.Emails?.find(
                                    (email: any) => email.isPrimary
                                )?.Email || "",
                            Session: {
                                Token: encryptedToken,
                                ID: sessionData
                            },
                            isAdmin: userData.isAdmin || false,
                            isVerified_forCurrentSession: true,
                            Avatar: userData.Avatar || ""
                        });
                    }
                } catch (accountError) {
                    console.warn(
                        "Failed to add account to switcher:",
                        accountError
                    );
                    // Continue with signin even if account switcher fails
                }
                setState((prev) => ({
                    ...prev,
                    success: "Signin successful! Redirecting...",
                    isLoading: false
                }));

                // Redirect to specified URL or dashboard after a short delay
                setTimeout(() => {
                    router.push(redirectUrl);
                }, 1500);
            } else {
                // Handle specific error codes for account status
                let errorMessage = response.data.Message || "Signin failed";
                let accountStatus: "active" | "suspended" | "blocked" | null =
                    null;

                // Check for specific status codes
                if (response.data.StatusCode === 403) {
                    if (
                        response.data.Message.toLowerCase().includes(
                            "suspended"
                        )
                    ) {
                        accountStatus = "suspended";
                        errorMessage =
                            "Your account has been suspended. Please contact support for assistance.";
                    } else if (
                        response.data.Message.toLowerCase().includes("blocked")
                    ) {
                        accountStatus = "blocked";
                        errorMessage =
                            "Your account has been blocked due to security concerns. Please contact support.";
                    }
                }

                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    accountStatus: accountStatus,
                    isLoading: false
                }));
            }
        } catch (error: any) {
            console.error("Signin error:", error);
            let errorMessage = "An unexpected error occurred";
            let accountStatus: "active" | "suspended" | "blocked" | null = null;

            if (error.response?.data?.Message) {
                errorMessage = error.response.data.Message;

                // Check for account status in error response
                if (error.response.status === 403) {
                    if (errorMessage.toLowerCase().includes("suspended")) {
                        accountStatus = "suspended";
                    } else if (errorMessage.toLowerCase().includes("blocked")) {
                        accountStatus = "blocked";
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            setState((prev) => ({
                ...prev,
                error: errorMessage,
                accountStatus: accountStatus,
                isLoading: false
            }));
        }
    };
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !state.isLoading) {
            handleSignin();
        }
    };

    const handleBackToDashboard = () => {
        if (ActiveAccount) {
            router.push("/dashboard");
        } else if (Accounts.length > 0) {
            // Switch to the most recent account if no active account
            const mostRecentAccount = Accounts.sort(
                (a, b) =>
                    new Date(b.LastUsed || 0).getTime() -
                    new Date(a.LastUsed || 0).getTime()
            )[0];
            router.push("/dashboard");
        }
    };
    const getErrorIcon = () => {
        switch (state.accountStatus) {
            case "suspended":
                return <Pause className="text-warning text-xl" />;
            case "blocked":
                return <Block className="text-danger text-xl" />;
            default:
                return <ErrorOutline className="text-danger text-xl" />;
        }
    };

    const getErrorColor = () => {
        switch (state.accountStatus) {
            case "suspended":
                return "warning";
            case "blocked":
                return "danger";
            default:
                return "danger";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
            </div>

            {/* Floating Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none w-full h-full">
                <motion.div
                    className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"
                    animate={{
                        y: [0, -20, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute top-40 right-20 w-24 h-24 bg-purple-400/10 rounded-full blur-xl"
                    animate={{
                        y: [0, 15, 0],
                        scale: [1, 0.9, 1]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />
                <motion.div
                    className="absolute bottom-20 left-1/4 w-40 h-40 bg-pink-400/10 rounded-full blur-xl"
                    animate={{
                        y: [0, -25, 0],
                        x: [0, 10, 0]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                />
            </div>

            <Modal
                isOpen={isOpen}
                size="lg"
                onClose={() => {}}
                isDismissable={false}
                isKeyboardDismissDisabled={false}
                closeButton={false}
                classNames={{
                    backdrop:
                        "bg-gradient-to-t from-zinc-900/50 to-zinc-900/50 backdrop-blur-sm",
                    base: "border-[1px] border-white/20 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md"
                }}>
                <ModalContent>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            duration: 0.5
                        }}>
                        <ModalHeader className="flex flex-row items-center gap-4 justify-center relative bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm rounded-t-lg border-b border-white/10">
                            {shouldShowBackButton && (
                                <motion.div
                                    className="absolute left-4"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}>
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        onPress={handleBackToDashboard}
                                        isDisabled={state.isLoading}
                                        className="hover:bg-white/20 dark:hover:bg-gray-800/50">
                                        <ArrowBack />
                                    </Button>
                                </motion.div>
                            )}
                            <motion.div
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}>
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                    <Login className="text-white text-xl" />
                                </div>
                                <div className="text-center">
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Welcome Back
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Sign in to your account
                                    </p>
                                </div>
                            </motion.div>
                        </ModalHeader>

                        <ModalBody className="flex flex-col gap-6 p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                            {/* Error Messages with Enhanced Styling */}
                            <AnimatePresence>
                                {state.error && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: -20,
                                            height: 0
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            height: "auto"
                                        }}
                                        exit={{ opacity: 0, y: -20, height: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        <Alert
                                            description={
                                                <div className="flex items-center gap-2">
                                                    {getErrorIcon()}
                                                    <span>{state.error}</span>
                                                </div>
                                            }
                                            title={
                                                state.accountStatus ===
                                                "suspended"
                                                    ? "Account Suspended"
                                                    : state.accountStatus ===
                                                        "blocked"
                                                      ? "Account Blocked"
                                                      : "Sign In Error"
                                            }
                                            color={getErrorColor()}
                                            variant="bordered"
                                            className="border-l-4"
                                        />
                                        {state.accountStatus && (
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    Need help? Contact our{" "}
                                                    <a
                                                        href="/contact"
                                                        className="text-blue-600 hover:underline">
                                                        support team
                                                    </a>{" "}
                                                    for assistance.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Success Messages */}
                            <AnimatePresence>
                                {state.success && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: -20,
                                            height: 0
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            height: "auto"
                                        }}
                                        exit={{ opacity: 0, y: -20, height: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        <Alert
                                            description={
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="text-success text-xl" />
                                                    <span>{state.success}</span>
                                                </div>
                                            }
                                            title="Success"
                                            color="success"
                                            variant="bordered"
                                            className="border-l-4"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Account Switcher Section */}
                            {shouldShowAccountSwitcher && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                                    <div className="text-center mb-3">
                                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                                            <AccountBox className="text-lg" />
                                            <span className="text-sm font-medium">
                                                Quick Access
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Switch to an existing account
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <AccountSwitcher
                                            variant="compact"
                                            showAddAccount={false}
                                            onAccountChange={(account) => {
                                                router.push(redirectUrl);
                                            }}
                                        />
                                    </div>
                                    <Divider className="my-4" />
                                </motion.div>
                            )}

                            {/* Authentication Options */}
                            {state.isPasskeySupported && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                                                <Fingerprint className="text-white text-sm" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Use Passkey
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Secure biometric
                                                    authentication
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={
                                                state.usePasskey
                                                    ? "solid"
                                                    : "bordered"
                                            }
                                            color="primary"
                                            onPress={() =>
                                                setState((prev) => ({
                                                    ...prev,
                                                    usePasskey: !prev.usePasskey
                                                }))
                                            }
                                            startContent={
                                                state.usePasskey ? (
                                                    <FaceRetouchingNatural />
                                                ) : (
                                                    <Fingerprint />
                                                )
                                            }>
                                            {state.usePasskey
                                                ? "Enabled"
                                                : "Enable"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Username Input */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}>
                                <Input
                                    label="Username or Email"
                                    placeholder="Enter your username or email"
                                    startContent={
                                        <AlternateEmail className="text-gray-400 text-xl" />
                                    }
                                    value={state.username}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "username",
                                            e.target.value
                                        )
                                    }
                                    onKeyPress={handleKeyPress}
                                    isDisabled={state.isLoading}
                                    variant="bordered"
                                    size="lg"
                                    className="text-base"
                                    classNames={{
                                        input: "text-base",
                                        inputWrapper:
                                            "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                                    }}
                                    autoComplete="username"
                                />
                            </motion.div>

                            {/* Password Input */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}>
                                <Input
                                    label="Password"
                                    placeholder="Enter your password"
                                    type={
                                        state.showPassword ? "text" : "password"
                                    }
                                    startContent={
                                        <Lock className="text-gray-400 text-xl" />
                                    }
                                    endContent={
                                        <motion.button
                                            className="focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            type="button"
                                            onClick={() =>
                                                setState((prev) => ({
                                                    ...prev,
                                                    showPassword:
                                                        !prev.showPassword
                                                }))
                                            }
                                            disabled={state.isLoading}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}>
                                            {state.showPassword ? (
                                                <VisibilityOff className="text-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                            ) : (
                                                <Visibility className="text-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                            )}
                                        </motion.button>
                                    }
                                    value={state.password}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "password",
                                            e.target.value
                                        )
                                    }
                                    onKeyPress={handleKeyPress}
                                    isDisabled={state.isLoading}
                                    variant="bordered"
                                    size="lg"
                                    className="text-base"
                                    classNames={{
                                        input: "text-base",
                                        inputWrapper:
                                            "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                                    }}
                                    autoComplete="current-password"
                                />
                            </motion.div>

                            {/* Additional Options */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={state.rememberMe}
                                        onChange={(e) =>
                                            setState((prev) => ({
                                                ...prev,
                                                rememberMe: e.target.checked
                                            }))
                                        }
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                                        Remember me for 30 days
                                    </span>
                                </label>
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    onPress={() =>
                                        router.push("/auth/forgot-password")
                                    }>
                                    Forgot password?
                                </Button>
                            </motion.div>

                            {/* Sign Up Link */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="text-center">
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Don&apos;t have an account?</span>
                                    <Button
                                        variant="light"
                                        color="primary"
                                        size="sm"
                                        onPress={() => {
                                            const signupUrl = new URL(
                                                "/auth/signup",
                                                window.location.origin
                                            );
                                            if (searchParams.get("ref")) {
                                                signupUrl.searchParams.set(
                                                    "ref",
                                                    searchParams.get("ref")!
                                                );
                                            }
                                            router.push(signupUrl.toString());
                                        }}
                                        isDisabled={state.isLoading}
                                        className="font-medium">
                                        Create account
                                    </Button>
                                </div>
                            </motion.div>
                        </ModalBody>

                        <ModalFooter className="flex justify-center p-6 bg-gradient-to-r from-blue-600/5 to-purple-600/5 backdrop-blur-sm rounded-b-lg border-t border-white/10">
                            <motion.div
                                className="w-full"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}>
                                <Button
                                    color="primary"
                                    size="lg"
                                    onPress={handleSignin}
                                    isLoading={state.isLoading}
                                    isDisabled={
                                        state.isLoading ||
                                        !state.username.trim() ||
                                        (!state.usePasskey &&
                                            !state.password.trim())
                                    }
                                    className="w-full font-medium text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                                    startContent={
                                        !state.isLoading &&
                                        (state.usePasskey ? (
                                            <Fingerprint />
                                        ) : (
                                            <PersonAdd />
                                        ))
                                    }
                                    spinner={
                                        <CircularProgress
                                            size="sm"
                                            color="primary"
                                        />
                                    }>
                                    {state.isLoading
                                        ? state.usePasskey
                                            ? "Authenticating..."
                                            : "Signing In..."
                                        : state.usePasskey
                                          ? "Sign In with Passkey"
                                          : "Sign In"}
                                </Button>
                            </motion.div>
                        </ModalFooter>
                    </motion.div>
                </ModalContent>
            </Modal>
        </div>
    );
}

// Loading component for Suspense fallback
function SignInLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 relative overflow-hidden flex items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative">
                <Card className="w-[400px] bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20">
                    <CardBody className="flex flex-col items-center gap-6 p-8">
                        <motion.div
                            className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                            }}>
                            <Login className="text-white text-2xl" />
                        </motion.div>

                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Welcome Back
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Loading sign in page...
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Spinner
                                size="sm"
                                color="primary"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Preparing authentication
                            </span>
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<SignInLoading />}>
            <SignInForm />
        </Suspense>
    );
}
