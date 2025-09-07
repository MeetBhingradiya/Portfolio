"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "motion/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@contexts/NextAuthContext";
import { useSession, signOut } from "next-auth/react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Avatar,
    Chip,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Switch,
    Badge,
    Alert
} from "@heroui/react";
import {
    Dashboard as DashboardIcon,
    Person,
    Security,
    Settings,
    ExitToApp,
    AdminPanelSettings,
    Verified,
    Shield,
    DeviceHub,
    LocationOn,
    Schedule,
    Warning,
    CheckCircle,
    Language,
    GitHub,
    Facebook,
    Microsoft,
    LinkedIn,
    Instagram,
    X as TwitterIcon,
    Delete,
    Add,
    Key,
    Fingerprint,
    AccountBalance as BanknotesIcon,
    Wallet as WalletIcon
} from "@mui/icons-material";
import { 
    FaDiscord, 
    FaInstagram as FaInstagramIcon, 
    FaPatreon, 
    FaPinterest, 
    FaReddit, 
    FaSlack, 
    FaSpotify, 
    FaGitlab 
} from "react-icons/fa";
import { Config } from "@Config";
import { Axios } from "@Utils/Axios";

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 10
        }
    }
};

// Provider Icons
const providerIcons: Record<string, React.ReactNode> = {
    google: <Language className="text-red-500" />,
    github: <GitHub className="text-gray-700 dark:text-gray-300" />,
    discord: <FaDiscord className="text-indigo-500" />,
    facebook: <Facebook className="text-blue-600" />,
    linkedin: <LinkedIn className="text-blue-700" />,
    microsoft: <Microsoft className="text-blue-500" />,
    instagram: <FaInstagramIcon className="text-pink-500" />,
    patreon: <FaPatreon className="text-orange-500" />,
    pinterest: <FaPinterest className="text-red-600" />,
    reddit: <FaReddit className="text-orange-600" />,
    slack: <FaSlack className="text-purple-500" />,
    spotify: <FaSpotify className="text-green-500" />,
    twitter: <TwitterIcon className="text-black dark:text-white" />,
    gitlab: <FaGitlab className="text-orange-500" />
};

interface ConnectedAccount {
    provider: string;
    providerAccountId: string;
    connectedAt: string;
    lastUsed?: string;
    email?: string;
}

interface SessionInfo {
    id: string;
    platform: string;
    browser: string;
    location?: {
        city?: string;
        country?: string;
        region?: string;
    };
    createdAt: string;
    lastActivity: string;
    isCurrent: boolean;
}

interface DashboardData {
    connectedAccounts: ConnectedAccount[];
    activeSessions: SessionInfo[];
    security: {
        mfaEnabled: boolean;
        passkeyEnabled: boolean;
        lastPasswordChange?: string;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { data: session } = useSession();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");
    
    const { 
        isOpen: isSignOutOpen, 
        onOpen: onSignOutOpen, 
        onClose: onSignOutClose 
    } = useDisclosure();

    // Fetch dashboard data
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const response = await Axios.get("/api/dashboard");
                
                if (response.data.Status === 1) {
                    setDashboardData(response.data.Data);
                } else {
                    setError(response.data.Message || "Failed to load dashboard data");
                }
            } catch (error: any) {
                setError(error.response?.data?.Message || "Failed to load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [isAuthenticated, user]);

    const handleSignOut = async () => {
        try {
            await logout();
            router.push("/");
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            onSignOutClose();
        }
    };

    const handleDisconnectProvider = async (provider: string) => {
        try {
            const response = await Axios.post("/api/auth/disconnect", {
                provider
            });

            if (response.data.Status === 1) {
                // Refresh dashboard data
                window.location.reload();
            } else {
                setError(response.data.Message || "Failed to disconnect provider");
            }
        } catch (error: any) {
            setError(error.response?.data?.Message || "Failed to disconnect provider");
        }
    };

    const handleConnectProvider = (provider: string) => {
        window.location.href = `/api/auth/connect/${provider}?callbackUrl=${encodeURIComponent("/dashboard")}`;
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        router.push("/auth/signin");
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/30">
            <motion.div
                className="max-w-7xl mx-auto px-6 py-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={user.image}
                                alt={user.name}
                                size="lg"
                                fallback={<Person />}
                                className="ring-2 ring-gray-200 dark:ring-gray-700"
                            />
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                    Welcome, {user.firstName || user.name?.split(" ")[0] || user.username}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        @{user.username}
                                    </p>
                                    {user.isEmailVerified && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="success"
                                            startContent={<Verified className="w-3 h-3" />}
                                            className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                        >
                                            Verified
                                        </Chip>
                                    )}
                                    {user.isAdmin && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="warning"
                                            startContent={<AdminPanelSettings className="w-3 h-3" />}
                                            className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                        >
                                            Admin
                                        </Chip>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            color="danger"
                            variant="ghost"
                            onPress={onSignOutOpen}
                            startContent={<ExitToApp />}
                            className="hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            Sign Out
                        </Button>
                    </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div variants={itemVariants} className="mb-6">
                        <Alert
                            color="danger"
                            variant="flat"
                            title="Error"
                            description={error}
                            onClose={() => setError("")}
                        />
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Information */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Person className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4 pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            First Name
                                        </label>
                                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                                            {user.firstName || "Not set"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Last Name
                                        </label>
                                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                                            {user.lastName || "Not set"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Email
                                        </label>
                                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Username
                                        </label>
                                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                                            @{user.username}
                                        </p>
                                    </div>
                                </div>
                                <Divider className="bg-gray-200 dark:bg-gray-700" />
                                <div className="flex justify-end">
                                    <div className="flex gap-2">
                                        <Button
                                            color="primary"
                                            variant="ghost"
                                            size="sm"
                                            startContent={<Settings className="w-4 h-4" />}
                                            onPress={() => router.push("/profile")}
                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        >
                                            Edit Profile
                                        </Button>
                                        <Button
                                            color="secondary"
                                            variant="ghost"
                                            size="sm"
                                            startContent={<Settings className="w-4 h-4" />}
                                            onPress={() => router.push("/settings")}
                                            className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                        >
                                            Settings
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Security Overview */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Security className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Security</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4 pt-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Auth</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Extra security layer
                                        </p>
                                    </div>
                                    <Switch
                                        isSelected={user.isMFAEnabled}
                                        color="success"
                                        size="sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Passkey</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Biometric authentication
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color="primary"
                                        startContent={<Fingerprint className="w-4 h-4" />}
                                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    >
                                        Setup
                                    </Button>
                                </div>
                                <Divider className="bg-gray-200 dark:bg-gray-700" />
                                <Button
                                    color="primary"
                                    variant="ghost"
                                    size="sm"
                                    fullWidth
                                    startContent={<Shield className="w-4 h-4" />}
                                    onPress={() => router.push("/dashboard/security")}
                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 justify-center"
                                >
                                    Security Settings
                                </Button>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Connected Accounts */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <DeviceHub className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Connected Accounts</h2>
                                    </div>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="ghost"
                                        startContent={<Add className="w-4 h-4" />}
                                        onPress={() => router.push("/dashboard/connect")}
                                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    >
                                        Connect More
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody>
                                {dashboardData?.connectedAccounts?.length ? (
                                    <div className="space-y-3">
                                        {dashboardData.connectedAccounts.map((account, index) => (
                                            <div
                                                key={`${account.provider}-${index}`}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {providerIcons[account.provider] || <Key />}
                                                    <div>
                                                        <p className="font-medium capitalize">
                                                            {account.provider}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Connected {new Date(account.connectedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="light"
                                                    startContent={<Delete />}
                                                    onPress={() => handleDisconnectProvider(account.provider)}
                                                >
                                                    Disconnect
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <DeviceHub className="mx-auto text-gray-400 mb-4" fontSize="large" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            No connected accounts
                                        </p>
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            className="mt-4"
                                            onPress={() => router.push("/dashboard/connect")}
                                        >
                                            Connect an Account
                                        </Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Active Sessions */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Schedule className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Sessions</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                {dashboardData?.activeSessions?.length ? (
                                    <div className="space-y-3">
                                        {dashboardData.activeSessions.slice(0, 3).map((session, index) => (
                                            <div
                                                key={session.id}
                                                className={`p-3 border rounded-lg ${
                                                    session.isCurrent ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {session.browser} on {session.platform}
                                                        </p>
                                                        {session.location && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                <LocationOn className="w-3 h-3 inline mr-1" />
                                                                {session.location.city}, {session.location.country}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {session.isCurrent ? 'Current session' : `Last active: ${new Date(session.lastActivity).toLocaleDateString()}`}
                                                        </p>
                                                    </div>
                                                    {session.isCurrent && (
                                                        <Chip size="sm" color="success" variant="flat">
                                                            Current
                                                        </Chip>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Schedule className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            No active sessions
                                        </p>
                                    </div>
                                )}
                                
                                {dashboardData?.activeSessions && dashboardData.activeSessions.length > 3 && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        fullWidth
                                        className="mt-3"
                                        onPress={() => router.push("/dashboard/sessions")}
                                    >
                                        View All Sessions
                                    </Button>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="mt-12">
                    <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
                        </CardHeader>
                        <CardBody className="pt-0">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <Button
                                    variant="ghost"
                                    className="h-20 flex-col hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    onPress={() => router.push("/profile")}
                                >
                                    <Person className="mb-2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">Edit Profile</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-20 flex-col hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    onPress={() => router.push("/wallet")}
                                >
                                    <WalletIcon className="mb-2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">Wallets</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-20 flex-col hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    onPress={() => router.push("/financial")}
                                >
                                    <BanknotesIcon className="mb-2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">Financial</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-20 flex-col hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    onPress={() => router.push("/dashboard/security")}
                                >
                                    <Security className="mb-2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">Security</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-20 flex-col hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    onPress={() => router.push("/dashboard/connect")}
                                >
                                    <DeviceHub className="mb-2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">Connect Apps</span>
                                </Button>
                                {user.isAdmin && (
                                    <Button
                                        variant="ghost"
                                        className="h-20 flex-col hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        onPress={() => router.push("/admin")}
                                    >
                                        <AdminPanelSettings className="mb-2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        <span className="text-xs text-gray-700 dark:text-gray-300">Admin Panel</span>
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Sign Out Confirmation Modal */}
            <Modal isOpen={isSignOutOpen} onClose={onSignOutClose}>
                <ModalContent>
                    <ModalHeader>
                        <h3>Confirm Sign Out</h3>
                    </ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to sign out? You&apos;ll need to sign in again to access your account.</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onSignOutClose}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleSignOut}>
                            Sign Out
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
