"use client";

import React from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Divider,
    Spinner,
    Avatar,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Tabs,
    Tab,
    Tooltip,
    Badge,
    Switch,
    Progress
} from "@heroui/react";
import {
    Dashboard as DashboardIcon,
    Person,
    Security,
    ExitToApp,
    Computer,
    Smartphone,
    AccessTime,
    Verified,
    Warning,
    Edit,
    Add,
    Delete,
    Key,
    Email,
    Save,
    Cancel,
    AdminPanelSettings,
    VpnKey,
    PhoneAndroid,
    Logout,
    DeleteForever,
    Visibility,
    VisibilityOff,
    CheckCircle,
    Error as ErrorIcon,
    LocationOn,
    Language,
    Schedule,
    ConnectWithoutContact,
    AccountCircle,
    LinkedIn,
    Facebook,
    Instagram,
    GitHub,
    Microsoft
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Axios } from "@Utils/Axios";
import { AccountSwitcher } from "@Components/AccountSwitcher";
import { useAccount } from "@contexts/AccountContext";

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 10
        }
    }
};

// Third-party providers configuration
const thirdPartyProviders = [
    {
        id: "google",
        name: "Google",
        icon: <Language className="text-red-500" />,
        color: "border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-900/20",
        connectUrl: "/api/auth/connect/google"
    },
    {
        id: "github",
        name: "GitHub",
        icon: <GitHub className="text-gray-700 dark:text-gray-300" />,
        color: "border-gray-200 hover:bg-gray-50 dark:border-gray-500/30 dark:hover:bg-gray-800/20",
        connectUrl: "/api/auth/connect/github"
    },
    {
        id: "microsoft",
        name: "Microsoft",
        icon: <Microsoft className="text-blue-500" />,
        color: "border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20",
        connectUrl: "/api/auth/connect/microsoft"
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        icon: <LinkedIn className="text-blue-600" />,
        color: "border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20",
        connectUrl: "/api/auth/connect/linkedin"
    },
    {
        id: "facebook",
        name: "Facebook",
        icon: <Facebook className="text-blue-700" />,
        color: "border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-900/20",
        connectUrl: "/api/auth/connect/facebook"
    },
    {
        id: "instagram",
        name: "Instagram",
        icon: <Instagram className="text-pink-500" />,
        color: "border-pink-200 hover:bg-pink-50 dark:border-pink-500/30 dark:hover:bg-pink-900/20",
        connectUrl: "/api/auth/connect/instagram"
    },
    {
        id: "discord",
        name: "Discord",
        icon: <ConnectWithoutContact className="text-indigo-500" />,
        color: "border-indigo-200 hover:bg-indigo-50 dark:border-indigo-500/30 dark:hover:bg-indigo-900/20",
        connectUrl: "/api/auth/connect/discord"
    }
];

interface ThirdPartyConnection {
    provider: string;
    providerId: string;
    email?: string;
    connectedAt: string;
    lastUsed?: string;
}

interface User {
    UserID: string;
    Username: string;
    FirstName: string;
    LastName: string;
    Emails: Array<{
        Email: string;
        isPrimary: boolean;
        isVerified: boolean;
    }>;
    isAdmin: boolean;
    isEmailVerified: boolean;
    isMFA: boolean;
    createdAt: string;
    lastLoginAt: string;
    thirdPartyConnections?: ThirdPartyConnection[];
}

interface Session {
    SessionID: string;
    Platform: string;
    Browser: string;
    ExpiresAt: string;
    IPDataMappedResponse?: {
        city?: string;
        country?: string;
        region?: string;
    };
    createdAt: string;
    lastActivity: string;
    isCurrent?: boolean;
}

interface DashboardData {
    user: User;
    currentSession: Session;
    activeSessions: Session[];
    security: {
        totalActiveSessions: number;
        lastPasswordChange?: string;
    };
}

export default function Dashboard() {
    const router = useRouter();
    const {
        accounts,
        activeAccount,
        isLoading: accountSwitcherLoading,
        switchAccount,
        removeAccount
    } = useAccount();

    const [State, setState] = React.useState({
        isLoading: true,
        DashboardData: null as DashboardData | null,
        error: "",
        activeTab: "overview",
        editProfileData: {
            FirstName: "",
            LastName: "",
            Username: ""
        },
        isEditingProfile: false,
        profileSaveLoading: false,
        signOutLoading: false,
        passwordData: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        },
        showPasswords: {
            current: false,
            new: false,
            confirm: false
        },
        passwordChangeLoading: false,
        newEmailData: {
            email: ""
        },
        emailActionLoading: "",
        emailVerificationData: {
            email: "",
            otp: "",
            verificationLoading: false
        },
        sessionActionLoading: "",
        thirdPartyConnectionLoading: ""
    });

    // Modals
    const {
        isOpen: isPasswordModalOpen,
        onOpen: onPasswordModalOpen,
        onClose: onPasswordModalClose
    } = useDisclosure();

    const {
        isOpen: isEmailModalOpen,
        onOpen: onEmailModalOpen,
        onClose: onEmailModalClose
    } = useDisclosure();

    // Data fetching
    const fetchDashboardData = React.useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: "" }));
            const response = await Axios.get("/api/dashboard");

            if (response.data.Status === 1) {
                setState((prev) => ({
                    ...prev,
                    DashboardData: response.data.Data,
                    error: ""
                }));
            } else {
                setState((prev) => ({
                    ...prev,
                    error: response.data.Message || "Failed to load dashboard"
                }));
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                if (activeAccount) {
                    removeAccount(activeAccount.UserID);
                }
                router.push("/auth/signin");
            } else {
                setState((prev) => ({
                    ...prev,
                    error:
                        error.response?.data?.Message ||
                        "Failed to load dashboard data"
                }));
            }
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [activeAccount, removeAccount, router]);

    // Effects
    React.useEffect(() => {
        if (accountSwitcherLoading) return;
        if (!activeAccount) {
            router.push("/auth/signin");
            return;
        }
        fetchDashboardData();
    }, [
        activeAccount?.UserID,
        accountSwitcherLoading,
        fetchDashboardData,
        router
    ]);

    React.useEffect(() => {
        if (State.DashboardData?.user) {
            setState((prev) => ({
                ...prev,
                editProfileData: {
                    FirstName: State.DashboardData!.user.FirstName,
                    LastName: State.DashboardData!.user.LastName,
                    Username: State.DashboardData!.user.Username
                }
            }));
        }
    }, [State.DashboardData?.user]);

    // Sign out handler
    const handleSignOut = React.useCallback(async () => {
        setState((prev) => ({ ...prev, signOutLoading: true }));
        try {
            if (activeAccount) {
                const otherAccounts = accounts.filter(
                    (acc) => acc.UserID !== activeAccount.UserID
                );
                if (otherAccounts.length > 0) {
                    const mostRecentAccount = otherAccounts.sort(
                        (a, b) =>
                            new Date(b.LastUsed || 0).getTime() -
                            new Date(a.LastUsed || 0).getTime()
                    )[0];
                    await removeAccount(activeAccount.UserID);
                    await switchAccount(mostRecentAccount.UserID);
                    window.location.reload();
                    return;
                } else {
                    await removeAccount(activeAccount.UserID);
                }
            }

            localStorage.removeItem("auth-token");
            router.push("/auth/signin");
        } catch (error) {
            router.push("/auth/signin");
        } finally {
            setState((prev) => ({ ...prev, signOutLoading: false }));
        }
    }, [activeAccount, accounts, switchAccount, removeAccount, router]);

    // Third-party connection handlers
    const handleConnectThirdParty = async (providerId: string) => {
        setState((prev) => ({
            ...prev,
            thirdPartyConnectionLoading: providerId
        }));
        try {
            const provider = thirdPartyProviders.find(
                (p) => p.id === providerId
            );
            if (provider) {
                // Open OAuth popup
                const width = 500;
                const height = 600;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                const popup = window.open(
                    provider.connectUrl,
                    "oauth",
                    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
                );

                // Listen for popup completion
                const checkClosed = setInterval(() => {
                    if (popup?.closed) {
                        clearInterval(checkClosed);
                        fetchDashboardData(); // Refresh data after connection
                    }
                }, 1000);
            }
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                error:
                    error.response?.data?.Message ||
                    `Failed to connect to ${providerId}`
            }));
        } finally {
            setState((prev) => ({ ...prev, thirdPartyConnectionLoading: "" }));
        }
    };

    const handleDisconnectThirdParty = async (providerId: string) => {
        setState((prev) => ({
            ...prev,
            thirdPartyConnectionLoading: providerId
        }));
        try {
            const response = await Axios.delete(
                `/api/auth/disconnect/${providerId}`
            );
            if (response.data.Status === 1) {
                fetchDashboardData();
            } else {
                setState((prev) => ({
                    ...prev,
                    error:
                        response.data.Message ||
                        `Failed to disconnect from ${providerId}`
                }));
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                if (activeAccount) await removeAccount(activeAccount.UserID);
                router.push("/auth/signin");
            } else {
                setState((prev) => ({
                    ...prev,
                    error:
                        error.response?.data?.Message ||
                        `Failed to disconnect from ${providerId}`
                }));
            }
        } finally {
            setState((prev) => ({ ...prev, thirdPartyConnectionLoading: "" }));
        }
    };

    // Loading states
    if (accountSwitcherLoading || State.isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}>
                    <Spinner size="lg" />
                </motion.div>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center">
                    <p className="text-lg font-medium">
                        {accountSwitcherLoading
                            ? "Loading Account..."
                            : "Loading Dashboard..."}
                    </p>
                </motion.div>
            </div>
        );
    }

    if (State.error && !State.DashboardData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
                <Warning className="text-6xl text-danger" />
                <p className="text-lg text-danger font-medium">{State.error}</p>
                <Button
                    color="primary"
                    onPress={() => fetchDashboardData()}
                    isLoading={State.isLoading}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (!State.DashboardData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
                <p className="text-lg font-medium">No data available</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 relative overflow-x-hidden">
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
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"
                    animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute top-40 right-20 w-24 h-24 bg-purple-400/10 rounded-full blur-xl"
                    animate={{ y: [0, 20, 0], scale: [1, 0.9, 1] }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-40 left-1/4 w-20 h-20 bg-pink-400/10 rounded-full blur-xl"
                    animate={{ y: [0, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>
            {/* Main Content Container */}
            <motion.div
                className="relative z-10 h-screen overflow-y-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible">
                <div className="container mx-auto p-6 space-y-6">
                    {/* Header with Account Switcher */}
                    <motion.div
                        className="flex justify-between items-center"
                        variants={itemVariants}>
                        <div className="flex items-center gap-4">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}>
                                <DashboardIcon
                                    sx={{ fontSize: "2rem" }}
                                    className="text-primary"
                                />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Dashboard
                                </h1>
                                <p className="text-default-500">
                                    Welcome back,{" "}
                                    {State.DashboardData.user.FirstName}!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <AccountSwitcher
                                variant="full"
                                showAddAccount={true}
                                onAccountChange={() => window.location.reload()}
                            />
                            {State.DashboardData.user.isAdmin && (
                                <Tooltip content="Admin Panel">
                                    <Button
                                        color="secondary"
                                        variant="bordered"
                                        isIconOnly
                                        onPress={() => router.push("/admin")}
                                        className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                        {" "}
                                        <AdminPanelSettings />
                                    </Button>
                                </Tooltip>
                            )}
                            {" "}
                            <Button
                                color="danger"
                                variant="bordered"
                                startContent={<ExitToApp />}
                                onPress={handleSignOut}
                                isLoading={State.signOutLoading}
                                isDisabled={State.signOutLoading}
                                className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                {State.signOutLoading
                                    ? "Signing Out..."
                                    : "Sign Out"}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Error Alert */}
                    <AnimatePresence>
                        {State.error && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}>
                                <Card className="border-danger bg-danger-50/80 dark:bg-danger-900/30 backdrop-blur-md">
                                    <CardBody className="flex flex-row items-center gap-3">
                                        <ErrorIcon className="text-danger" />
                                        <p className="text-danger font-medium flex-grow">
                                            {State.error}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() =>
                                                setState((prev) => ({
                                                    ...prev,
                                                    error: ""
                                                }))
                                            }>
                                            Dismiss
                                        </Button>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Content Tabs */}
                    <motion.div
                        className="w-full"
                        variants={itemVariants}>
                        <Tabs
                            selectedKey={State.activeTab}
                            onSelectionChange={(key) =>
                                setState((prev) => ({
                                    ...prev,
                                    activeTab: key.toString()
                                }))
                            }
                            aria-label="Dashboard sections"
                            variant="bordered"
                            className="w-full"
                            classNames={{
                                tabList:
                                    "backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30",
                                tab: "data-[selected=true]:bg-white/30 dark:data-[selected=true]:bg-gray-700/50",
                                panel: "pt-6"
                            }}>
                            <Tab
                                key="overview"
                                title="Overview">
                                {" "}
                                <div className="space-y-6">
                                    {/* User Profile Card */}
                                    <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                        <CardHeader className="flex gap-3">
                                            <Avatar
                                                icon={<Person />}
                                                classNames={{
                                                    base: "bg-gradient-to-br from-indigo-500 to-pink-500",
                                                    icon: "text-white/80"
                                                }}
                                            />
                                            <div className="flex flex-col flex-grow">
                                                <p className="text-md font-semibold">
                                                    {
                                                        State.DashboardData.user
                                                            .FirstName
                                                    }{" "}
                                                    {
                                                        State.DashboardData.user
                                                            .LastName
                                                    }
                                                </p>
                                                <p className="text-small text-default-500">
                                                    @
                                                    {
                                                        State.DashboardData.user
                                                            .Username
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                {State.DashboardData.user
                                                    .isAdmin && (
                                                    <Chip
                                                        color="warning"
                                                        variant="flat"
                                                        size="sm">
                                                        Admin
                                                    </Chip>
                                                )}
                                                {State.DashboardData.user
                                                    .isEmailVerified ? (
                                                    <Chip
                                                        color="success"
                                                        variant="flat"
                                                        size="sm"
                                                        startContent={
                                                            <Verified />
                                                        }>
                                                        Verified
                                                    </Chip>
                                                ) : (
                                                    <Chip
                                                        color="danger"
                                                        variant="flat"
                                                        size="sm">
                                                        Unverified
                                                    </Chip>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-small text-default-500 mb-1">
                                                        Primary Email
                                                    </p>
                                                    <p className="font-medium">
                                                        {State.DashboardData.user.Emails.find(
                                                            (email) =>
                                                                email.isPrimary
                                                        )?.Email ||
                                                            State.DashboardData
                                                                .user.Emails[0]
                                                                ?.Email ||
                                                            "No email"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-small text-default-500 mb-1">
                                                        User ID
                                                    </p>
                                                    <p className="font-mono text-small">
                                                        {
                                                            State.DashboardData
                                                                .user.UserID
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-small text-default-500 mb-1">
                                                        Member Since
                                                    </p>
                                                    <p className="font-medium">
                                                        {new Date(
                                                            State.DashboardData.user.createdAt
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>{" "}
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                            <CardBody className="text-center">
                                                <div className="flex items-center justify-center mb-2">
                                                    <Security className="text-primary text-2xl" />
                                                </div>
                                                <p className="text-2xl font-bold">
                                                    {
                                                        State.DashboardData
                                                            .security
                                                            .totalActiveSessions
                                                    }
                                                </p>
                                                <p className="text-small text-default-500">
                                                    Active Sessions
                                                </p>
                                            </CardBody>
                                        </Card>{" "}
                                        <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                            <CardBody className="text-center">
                                                <div className="flex items-center justify-center mb-2">
                                                    <Email className="text-success text-2xl" />
                                                </div>
                                                <p className="text-2xl font-bold">
                                                    {
                                                        State.DashboardData.user
                                                            .Emails.length
                                                    }
                                                </p>
                                                <p className="text-small text-default-500">
                                                    Email Addresses
                                                </p>
                                            </CardBody>
                                        </Card>{" "}
                                        <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                            <CardBody className="text-center">
                                                <div className="flex items-center justify-center mb-2">
                                                    <AccessTime className="text-warning text-2xl" />
                                                </div>
                                                <p className="text-small font-bold">
                                                    {new Date(
                                                        State.DashboardData.user.lastLoginAt
                                                    ).toLocaleDateString()}
                                                </p>
                                                <p className="text-small text-default-500">
                                                    Last Login
                                                </p>
                                            </CardBody>
                                        </Card>{" "}
                                        <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                            <CardBody className="text-center">
                                                <div className="flex items-center justify-center mb-2">
                                                    <VpnKey
                                                        className={`text-2xl ${
                                                            State.DashboardData
                                                                .user.isMFA
                                                                ? "text-success"
                                                                : "text-danger"
                                                        }`}
                                                    />
                                                </div>
                                                <p className="text-small font-bold">
                                                    {State.DashboardData.user
                                                        .isMFA
                                                        ? "Enabled"
                                                        : "Disabled"}
                                                </p>
                                                <p className="text-small text-default-500">
                                                    Two-Factor Auth
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </div>
                            </Tab>

                            <Tab
                                key="connections"
                                title="Third-Party Connections">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                Connected Accounts
                                            </h2>
                                            <p className="text-default-500">
                                                Manage your connected
                                                third-party accounts
                                            </p>
                                        </div>
                                    </div>
                                    {/* Third-party providers grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {thirdPartyProviders.map((provider) => {
                                            const isConnected =
                                                State.DashboardData?.user.thirdPartyConnections?.some(
                                                    (conn) =>
                                                        conn.provider ===
                                                        provider.id
                                                );
                                            const connectionData =
                                                State.DashboardData?.user.thirdPartyConnections?.find(
                                                    (conn) =>
                                                        conn.provider ===
                                                        provider.id
                                                );

                                            return (
                                                <motion.div
                                                    key={provider.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 400,
                                                        damping: 25
                                                    }}>
                                                    {" "}
                                                    <Card
                                                        className={`backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30 ${provider.color} transition-all duration-300`}>
                                                        <CardBody className="p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-lg bg-white/30 dark:bg-gray-700/50">
                                                                        {
                                                                            provider.icon
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold">
                                                                            {
                                                                                provider.name
                                                                            }
                                                                        </p>
                                                                        {isConnected &&
                                                                            connectionData?.email && (
                                                                                <p className="text-sm text-default-500">
                                                                                    {
                                                                                        connectionData.email
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                    </div>
                                                                </div>
                                                                <Chip
                                                                    color={
                                                                        isConnected
                                                                            ? "success"
                                                                            : "default"
                                                                    }
                                                                    variant="flat"
                                                                    size="sm">
                                                                    {isConnected
                                                                        ? "Connected"
                                                                        : "Not Connected"}
                                                                </Chip>
                                                            </div>{" "}
                                                            {isConnected &&
                                                                connectionData && (
                                                                    <div className="mb-3 p-3 rounded-lg bg-white/20 dark:bg-gray-700/30">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-default-500">
                                                                                Connected:
                                                                            </span>
                                                                            <span>
                                                                                {new Date(
                                                                                    connectionData.connectedAt
                                                                                ).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        {connectionData.lastUsed && (
                                                                            <div className="flex justify-between text-sm mt-1">
                                                                                <span className="text-default-500">
                                                                                    Last
                                                                                    used:
                                                                                </span>
                                                                                <span>
                                                                                    {new Date(
                                                                                        connectionData.lastUsed
                                                                                    ).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            <div className="flex gap-2">
                                                                {isConnected ? (
                                                                    <Button
                                                                        color="danger"
                                                                        variant="flat"
                                                                        size="sm"
                                                                        fullWidth
                                                                        startContent={
                                                                            <Delete />
                                                                        }
                                                                        onPress={() =>
                                                                            handleDisconnectThirdParty(
                                                                                provider.id
                                                                            )
                                                                        }
                                                                        isLoading={
                                                                            State.thirdPartyConnectionLoading ===
                                                                            provider.id
                                                                        }>
                                                                        Disconnect
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        color="primary"
                                                                        variant="flat"
                                                                        size="sm"
                                                                        fullWidth
                                                                        startContent={
                                                                            <ConnectWithoutContact />
                                                                        }
                                                                        onPress={() =>
                                                                            handleConnectThirdParty(
                                                                                provider.id
                                                                            )
                                                                        }
                                                                        isLoading={
                                                                            State.thirdPartyConnectionLoading ===
                                                                            provider.id
                                                                        }>
                                                                        Connect
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                    </div>{" "}
                                    {/* Connection benefits info */}
                                    <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <ConnectWithoutContact className="text-primary" />
                                                <div>
                                                    <p className="text-md font-semibold">
                                                        Why Connect Third-Party
                                                        Accounts?
                                                    </p>
                                                    <p className="text-small text-default-500">
                                                        Benefits of linking your
                                                        accounts
                                                    </p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex gap-3">
                                                    <CheckCircle className="text-success mt-1" />
                                                    <div>
                                                        <p className="font-medium">
                                                            Quick Sign-In
                                                        </p>
                                                        <p className="text-small text-default-500">
                                                            Use any connected
                                                            account to sign in
                                                            instantly
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Security className="text-primary mt-1" />
                                                    <div>
                                                        <p className="font-medium">
                                                            Enhanced Security
                                                        </p>
                                                        <p className="text-small text-default-500">
                                                            Additional
                                                            authentication
                                                            methods for better
                                                            security
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </Tab>

                            <Tab
                                key="emails"
                                title="Email Management">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                Email Addresses
                                            </h2>
                                            <p className="text-default-500">
                                                Manage your email addresses and
                                                verification status
                                            </p>
                                        </div>
                                        <Button
                                            color="primary"
                                            startContent={<Add />}
                                            onPress={onEmailModalOpen}>
                                            Add Email
                                        </Button>
                                    </div>{" "}
                                    <div className="space-y-3">
                                        {State.DashboardData.user.Emails.map(
                                            (email, index) => (
                                                <Card
                                                    key={index}
                                                    className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                                    <CardBody className="flex flex-row items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Email className="text-default-400" />
                                                            <div>
                                                                <p className="font-medium">
                                                                    {
                                                                        email.Email
                                                                    }
                                                                </p>
                                                                <div className="flex gap-2 mt-1">
                                                                    {email.isPrimary && (
                                                                        <Chip
                                                                            size="sm"
                                                                            color="primary"
                                                                            variant="flat">
                                                                            Primary
                                                                        </Chip>
                                                                    )}
                                                                    {email.isVerified ? (
                                                                        <Chip
                                                                            size="sm"
                                                                            color="success"
                                                                            variant="flat"
                                                                            startContent={
                                                                                <CheckCircle />
                                                                            }>
                                                                            Verified
                                                                        </Chip>
                                                                    ) : (
                                                                        <Chip
                                                                            size="sm"
                                                                            color="warning"
                                                                            variant="flat">
                                                                            Unverified
                                                                        </Chip>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {!email.isVerified && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="flat"
                                                                    color="success"
                                                                    isLoading={
                                                                        State.emailActionLoading ===
                                                                        email.Email
                                                                    }>
                                                                    Verify
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            )
                                        )}
                                    </div>
                                </div>
                            </Tab>

                            <Tab
                                key="security"
                                title="Security & Sessions">
                                {" "}
                                <div className="space-y-6">
                                    {/* Password Change Section */}
                                    <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                        <CardHeader className="flex justify-between">
                                            <div className="flex items-center gap-3">
                                                <Key className="text-warning" />
                                                <div>
                                                    <p className="text-md font-semibold">
                                                        Password
                                                    </p>
                                                    <p className="text-small text-default-500">
                                                        Change your account
                                                        password
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                color="warning"
                                                variant="flat"
                                                onPress={onPasswordModalOpen}>
                                                Change Password
                                            </Button>
                                        </CardHeader>
                                    </Card>{" "}
                                    {/* Current Session */}
                                    <Card className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <Security className="text-success" />
                                                <div>
                                                    <p className="text-md font-semibold">
                                                        Current Session
                                                    </p>
                                                    <p className="text-small text-default-500">
                                                        This device and session
                                                    </p>
                                                </div>
                                                <Badge
                                                    color="success"
                                                    variant="flat"
                                                    content="Current">
                                                    <span></span>
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Computer className="text-blue-500" />
                                                    <div>
                                                        <p className="text-small text-default-500">
                                                            Platform
                                                        </p>
                                                        <p className="font-medium">
                                                            {
                                                                State
                                                                    .DashboardData
                                                                    .currentSession
                                                                    ?.Platform
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-small text-default-500">
                                                        Browser
                                                    </p>
                                                    <p className="font-medium">
                                                        {State.DashboardData
                                                            .currentSession
                                                            ?.Browser ||
                                                            "Chrome"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <LocationOn className="text-default-400" />
                                                    <div>
                                                        <p className="text-small text-default-500">
                                                            Location
                                                        </p>
                                                        <p className="font-medium">
                                                            {State.DashboardData
                                                                .currentSession
                                                                ?.IPDataMappedResponse
                                                                ?.city ||
                                                                "Unknown"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Schedule className="text-default-400" />
                                                    <div>
                                                        <p className="text-small text-default-500">
                                                            Expires
                                                        </p>
                                                        <p className="font-medium">
                                                            {new Date(
                                                                State.DashboardData.currentSession?.ExpiresAt
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </Tab>
                        </Tabs>
                    </motion.div>
                </div>
            </motion.div>
            {/* Password Change Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={onPasswordModalClose}
                size="lg">
                <ModalContent className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/30">
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Key className="text-warning" />
                            Change Password
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="Current Password"
                                type={
                                    State.showPasswords.current
                                        ? "text"
                                        : "password"
                                }
                                value={State.passwordData.currentPassword}
                                onChange={(e) =>
                                    setState((prev) => ({
                                        ...prev,
                                        passwordData: {
                                            ...prev.passwordData,
                                            currentPassword: e.target.value
                                        }
                                    }))
                                }
                                endContent={
                                    <button
                                        onClick={() =>
                                            setState((prev) => ({
                                                ...prev,
                                                showPasswords: {
                                                    ...prev.showPasswords,
                                                    current:
                                                        !prev.showPasswords
                                                            .current
                                                }
                                            }))
                                        }>
                                        {State.showPasswords.current ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </button>
                                }
                            />
                            <Input
                                label="New Password"
                                type={
                                    State.showPasswords.new
                                        ? "text"
                                        : "password"
                                }
                                value={State.passwordData.newPassword}
                                onChange={(e) =>
                                    setState((prev) => ({
                                        ...prev,
                                        passwordData: {
                                            ...prev.passwordData,
                                            newPassword: e.target.value
                                        }
                                    }))
                                }
                                endContent={
                                    <button
                                        onClick={() =>
                                            setState((prev) => ({
                                                ...prev,
                                                showPasswords: {
                                                    ...prev.showPasswords,
                                                    new: !prev.showPasswords.new
                                                }
                                            }))
                                        }>
                                        {State.showPasswords.new ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </button>
                                }
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={onPasswordModalClose}>
                            Cancel
                        </Button>
                        <Button
                            color="warning"
                            isLoading={State.passwordChangeLoading}
                            isDisabled={
                                !State.passwordData.currentPassword ||
                                !State.passwordData.newPassword ||
                                State.passwordData.newPassword.length < 8
                            }>
                            Change Password
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>{" "}
            {/* Add Email Modal */}
            <Modal
                isOpen={isEmailModalOpen}
                onClose={onEmailModalClose}>
                <ModalContent className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/30">
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Email className="text-primary" />
                            Add Email Address
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            label="Email Address"
                            type="email"
                            value={State.newEmailData.email}
                            onChange={(e) =>
                                setState((prev) => ({
                                    ...prev,
                                    newEmailData: { email: e.target.value }
                                }))
                            }
                            placeholder="Enter new email address"
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={onEmailModalClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            isDisabled={
                                !State.newEmailData.email ||
                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                    State.newEmailData.email
                                )
                            }>
                            Add Email
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
