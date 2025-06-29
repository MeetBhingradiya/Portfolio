"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Chip,
    Divider,
    Spinner
} from "@heroui/react";
import {
    AdminPanelSettings,
    Person,
    CheckCircle,
    Error as ErrorIcon,
    Warning,
    Security,
    LockClock,
    Visibility,
    VisibilityOff
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Axios } from "@Utils/Axios";
import { useAccount } from "@contexts/AccountContext";

interface AdminStatus {
    userID: string;
    username: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    hasDbAdminFlag: boolean;
    hasSpecialUsername: boolean;
    needsSignature?: boolean;
}

interface AdminSignatureState {
    isFetching: boolean;
    isError: boolean;
    Message: string;
    TryCount: number;
    isVisible: boolean;
    isBlocked: boolean;
    blockExpiry: number;
    remainingTime: string;
    isVerified: boolean;
    AdminSignatureToken: string;
}

export default function AdminSetupPage() {
    const router = useRouter();
    const {
        activeAccount,
        isLoading: accountSwitcherLoading,
        removeAccount
    } = useAccount();
    const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [userIdentifierToPromote, setUserIdentifierToPromote] = useState("");
    const [promoting, setPromoting] = useState(false);
    const [adminActions, setAdminActions] = useState<
        Array<{
            id: string;
            action: string;
            targetUser: string;
            timestamp: string;
            method: string;
        }>
    >([]);

    // Admin Signature Verification State
    const [adminSignature, setAdminSignature] = useState("");
    const [signatureState, setSignatureState] = useState<AdminSignatureState>({
        isFetching: false,
        isError: false,
        Message: "",
        TryCount: 0,
        isVisible: false,
        isBlocked: false,
        blockExpiry: 0,
        remainingTime: "",
        isVerified: false,
        AdminSignatureToken: ""
    });

    const fetchAdminStatus = useCallback(async () => {
        try {
            setLoading(true);
            // First check current user admin status
            const response = await Axios("/api/admin/check-current-user");
            const data = response.data;

            if (data.Status === 1) {
                setAdminStatus(data.Data);
                setError(null);

                // If user is already admin, automatically set verified state
                if (data.Data.isAdmin) {
                    setSignatureState((prev) => ({
                        ...prev,
                        isVerified: false,
                        Message: "You already have admin access",
                        AdminSignatureToken: "" // Placeholder token
                    }));
                }
            } else {
                setError(data.Message);
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                if (activeAccount) {
                    removeAccount(activeAccount.UserID);
                }
                router.push("/auth/signin");
            } else {
                setError("Failed to fetch admin status");
            }
        } finally {
            setLoading(false);
        }
    }, [activeAccount, removeAccount, router]);
    const promoteToAdmin = async () => {
        if (!userIdentifierToPromote.trim()) return;

        try {
            setPromoting(true);

            // Prepare request data
            const requestData = {
                userIdentifier: userIdentifierToPromote.trim(),
                makeAdmin: true
            };

            // Prepare request config with admin signature token if available
            const requestConfig: any = {};

            // Include admin signature token in headers if available
            if (
                signatureState.AdminSignatureToken &&
                signatureState.AdminSignatureToken !== "admin_already"
            ) {
                requestConfig.headers = {
                    "Admin-Signature": signatureState.AdminSignatureToken
                };
            }

            const response = await Axios.put(
                "/api/admin/promote-user",
                requestData,
                requestConfig
            );

            const data = response.data;
            if (data.Status === 1) {
                // Enhanced success response with more details
                const promotedUser = data.Data;
                setSuccess(
                    `✅ Admin Access Granted Successfully!\n` +
                        `User: ${promotedUser.username}\n` +
                        `Email: ${promotedUser.email}\n` +
                        `User ID: ${promotedUser.userID}\n` +
                        `Status: ${promotedUser.isAdmin ? "Admin" : "User"}\n` +
                        `Promoted by: ${activeAccount?.Username || "System"}\n` +
                        `Time: ${new Date().toLocaleString()}`
                );
                setError(null);
                setUserIdentifierToPromote("");
                // Log admin action for audit trail
                console.log("Admin Action Log:", {
                    action: "PROMOTE_USER",
                    promotedUser: {
                        id: promotedUser.userID,
                        username: promotedUser.username,
                        email: promotedUser.email
                    },
                    promotedBy: {
                        id: activeAccount?.UserID,
                        username: activeAccount?.Username
                    },
                    timestamp: new Date().toISOString(),
                    method:
                        signatureState.AdminSignatureToken !== "admin_already"
                            ? "signature_verification"
                            : "admin_privileges"
                });

                // Add to admin actions history
                setAdminActions((prev) => [
                    {
                        id: Date.now().toString(),
                        action: `Promoted ${promotedUser.username} to Admin`,
                        targetUser: promotedUser.username,
                        timestamp: new Date().toLocaleString(),
                        method:
                            signatureState.AdminSignatureToken !==
                            "admin_already"
                                ? "Signature Verification"
                                : "Admin Privileges"
                    },
                    ...prev.slice(0, 4)
                ]); // Keep only last 5 actions

                // Show detailed success notification
                setTimeout(() => {
                    setSuccess(
                        `🎉 ${promotedUser.username} is now an admin! They can access the admin panel and promote other users.`
                    );
                }, 3000);

                setTimeout(() => setSuccess(null), 10000);
            } else {
                setError(data.Message);
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.Message ||
                    "Failed to promote user to admin"
            );
        } finally {
            setPromoting(false);
        }
    };

    // Admin Signature Verification Functions
    const handleSignatureInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setAdminSignature(e.target.value);
    };
    const fetchAdminSignature = async () => {
        if (signatureState.isBlocked) {
            return;
        }

        if (signatureState.TryCount >= 3) {
            blockUser();
            return;
        }

        // Check if user is already admin
        if (adminStatus?.isAdmin) {
            setSuccess(
                "You already have admin access! No signature verification needed."
            );
            setSignatureState((prev) => ({
                ...prev,
                isVerified: true,
                AdminSignatureToken: "admin_already"
            }));
            return;
        }

        try {
            setSignatureState((prev) => ({ ...prev, isFetching: true }));

            // First verify the signature and promote current user
            const response = await Axios.post(
                "/api/admin/promote-current-user",
                {
                    signature: adminSignature
                }
            );

            setSignatureState((prev) => ({
                ...prev,
                AdminSignatureToken: response.data.Data.token,
                isError: false,
                Message: "Verified Successfully - You are now an admin!",
                isVerified: true,
                isFetching: false,
                TryCount: prev.TryCount + 1
            }));
            setSuccess(
                `Admin signature verified successfully! ${response.data.Data.isAlreadyAdmin ? "You already have admin access." : "You have been promoted to admin!"} Welcome ${response.data.Data.username || activeAccount?.Username || "User"}.`
            );
            setError(null);

            // Refresh admin status after successful verification
            setTimeout(() => {
                fetchAdminStatus();
            }, 1000);
        } catch (error: any) {
            setSignatureState((prev) => ({
                ...prev,
                isError: true,
                Message: error?.response?.data?.Message || "Invalid signature",
                isFetching: false,
                TryCount: prev.TryCount + 1
            }));
        }
    };

    const blockUser = () => {
        const blockExpiry = Date.now() + 24 * 60 * 60 * 1000;

        localStorage.setItem("adminAccessBlocked", "true");
        localStorage.setItem("adminAccessBlockExpiry", blockExpiry.toString());
        localStorage.setItem(
            "adminAccessTryCount",
            signatureState.TryCount.toString()
        );

        setSignatureState((prev) => ({
            ...prev,
            isBlocked: true,
            blockExpiry: blockExpiry,
            isError: true,
            Message:
                "You have exceeded the maximum number of attempts. You are blocked for 24 hours."
        }));
    };

    const checkIfBlocked = () => {
        const isBlocked = localStorage.getItem("adminAccessBlocked") === "true";
        const blockedUntil = localStorage.getItem("adminAccessBlockExpiry");

        if (isBlocked || blockedUntil) {
            if (!blockedUntil) {
                blockUser();
                return true;
            }

            const expiryTime = parseInt(blockedUntil);
            const now = Date.now();

            if (now < expiryTime) {
                setSignatureState((prev) => ({
                    ...prev,
                    isBlocked: true,
                    blockExpiry: expiryTime,
                    isError: true,
                    Message:
                        "You have been blocked due to too many failed attempts."
                }));
                return true;
            } else {
                unblockUser();
                return false;
            }
        }
        return false;
    };

    const unblockUser = () => {
        localStorage.removeItem("adminAccessBlocked");
        localStorage.removeItem("adminAccessBlockExpiry");
        localStorage.setItem("adminAccessTryCount", "0");

        setSignatureState((prev) => ({
            ...prev,
            isBlocked: false,
            blockExpiry: 0,
            remainingTime: "",
            TryCount: 0,
            isError: false,
            Message: ""
        }));
    };

    const updateRemainingTime = () => {
        const isBlocked = localStorage.getItem("adminAccessBlocked") === "true";
        const blockedUntil = localStorage.getItem("adminAccessBlockExpiry");

        if (isBlocked && blockedUntil) {
            const expiryTime = parseInt(blockedUntil);
            const now = Date.now();
            const timeLeft = expiryTime - now;

            if (timeLeft <= 0) {
                unblockUser();
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor(
                (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

            setSignatureState((prev) => ({
                ...prev,
                isBlocked: true,
                remainingTime: formattedTime,
                blockExpiry: expiryTime
            }));
        }
    };
    useEffect(() => {
        // Check authentication first - follow dashboard pattern
        if (accountSwitcherLoading) return;
        if (!activeAccount) {
            router.push("/auth/signin");
            return;
        }

        // Only proceed if authenticated
        fetchAdminStatus();

        // Initialize admin signature verification
        checkIfBlocked();
        updateRemainingTime();

        const timer = setInterval(() => {
            updateRemainingTime();
        }, 1000);

        const savedTryCount = localStorage.getItem("adminAccessTryCount");
        if (savedTryCount && !signatureState.isBlocked) {
            setSignatureState((prev) => ({
                ...prev,
                TryCount: parseInt(savedTryCount)
            }));
        }

        return () => clearInterval(timer);
    }, [
        activeAccount?.UserID,
        accountSwitcherLoading,
        router,
        fetchAdminStatus
    ]);

    useEffect(() => {
        if (signatureState.TryCount >= 3 && !signatureState.isBlocked) {
            blockUser();
        } else if (signatureState.TryCount < 3) {
            localStorage.setItem(
                "adminAccessTryCount",
                signatureState.TryCount.toString()
            );
        }
    }, [signatureState.TryCount, signatureState.isBlocked]);

    if (accountSwitcherLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    // Don't render anything if not authenticated (redirect will handle it)
    if (!activeAccount) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}{" "}
                <div className="text-center">
                    <AdminPanelSettings
                        className="mx-auto mb-4 text-primary"
                        sx={{ fontSize: 48 }}
                    />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Admin Setup
                    </h1>{" "}
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {signatureState.isVerified || adminStatus?.isAdmin
                            ? "Admin access confirmed - Configure admin access for other accounts"
                            : adminStatus?.needsSignature === false
                              ? "You already have admin access"
                              : "Verify admin signature to promote your account to admin"}
                    </p>
                    {activeAccount && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Logged in as: {activeAccount.Username} ({activeAccount.PrimaryEmail})
                        </p>
                    )}
                    {signatureState.isVerified && (
                        <Chip
                            color="success"
                            variant="flat"
                            className="mt-2">
                            <CheckCircle
                                sx={{ fontSize: 16 }}
                                className="mr-1"
                            />
                            Signature Verified
                        </Chip>
                    )}
                </div>{" "}
                {/* Error Message */}
                {error && (
                    <Card className="bg-danger-50 dark:bg-danger-950/50 border border-danger-200 dark:border-danger-700">
                        <CardBody className="flex flex-row items-center space-x-3">
                            <ErrorIcon className="text-danger dark:text-danger-400" />
                            <p className="text-danger-700 dark:text-danger-300">
                                {error}
                            </p>
                        </CardBody>
                    </Card>
                )}{" "}
                {/* Success Message */}{" "}
                {success && (
                    <Card className="bg-success-50 dark:bg-success-950/50 border border-success-200 dark:border-success-700">
                        <CardBody className="flex flex-row items-start space-x-3">
                            <CheckCircle className="text-success dark:text-success-400 mt-1" />
                            <div className="flex-1">
                                <p className="text-success-700 dark:text-success-300 font-semibold">
                                    Admin Operation Successful!
                                </p>
                                <pre className="text-success-600 dark:text-success-400 text-sm mt-2 whitespace-pre-wrap font-mono bg-success-100 dark:bg-success-900/30 p-2 rounded border border-success-200 dark:border-success-800">
                                    {success}
                                </pre>
                            </div>
                        </CardBody>
                    </Card>
                )}
                {/* Current Status */}
                {adminStatus && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">
                                Current Account Status
                            </h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        User ID
                                    </p>
                                    <p className="font-mono text-sm">
                                        {adminStatus.userID}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Username
                                    </p>
                                    <p>{adminStatus.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Name
                                    </p>
                                    <p>
                                        {adminStatus.firstName}{" "}
                                        {adminStatus.lastName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Admin Status
                                    </p>
                                    <Chip
                                        color={
                                            adminStatus.isAdmin
                                                ? "success"
                                                : "danger"
                                        }
                                        variant="flat">
                                        {adminStatus.isAdmin
                                            ? "Admin"
                                            : "Regular User"}
                                    </Chip>
                                </div>
                            </div>

                            <Divider />

                            <div className="space-y-2">
                                <h3 className="font-semibold">
                                    Admin Access Details:
                                </h3>
                                <div className="flex items-center space-x-2">
                                    {adminStatus.hasDbAdminFlag ? (
                                        <CheckCircle
                                            className="text-success"
                                            sx={{ fontSize: 20 }}
                                        />
                                    ) : (
                                        <ErrorIcon
                                            className="text-danger"
                                            sx={{ fontSize: 20 }}
                                        />
                                    )}
                                    <span className="text-sm">
                                        Database admin flag:{" "}
                                        {adminStatus.hasDbAdminFlag
                                            ? "Enabled"
                                            : "Disabled"}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {adminStatus.hasSpecialUsername ? (
                                        <CheckCircle
                                            className="text-success"
                                            sx={{ fontSize: 20 }}
                                        />
                                    ) : (
                                        <ErrorIcon
                                            className="text-danger"
                                            sx={{ fontSize: 20 }}
                                        />
                                    )}
                                    <span className="text-sm">
                                        Special username access:{" "}
                                        {adminStatus.hasSpecialUsername
                                            ? "Enabled"
                                            : "Disabled"}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}{" "}
                {/* Admin Signature Verification */}
                {!adminStatus?.isAdmin &&
                    !signatureState.isVerified &&
                    adminStatus?.needsSignature !== false && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    {signatureState.isBlocked ? (
                                        <LockClock className="text-danger" />
                                    ) : (
                                        <Security className="text-primary" />
                                    )}
                                    Admin Signature Verification
                                </h2>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {" "}
                                <div className="text-center">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {signatureState.isBlocked
                                            ? "Your access has been temporarily blocked"
                                            : `Enter your admin signature to promote ${activeAccount?.Username || "your account"} to admin`}
                                    </p>
                                    {activeAccount && !signatureState.isBlocked && (
                                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                <strong>
                                                    Account to promote:
                                                </strong>{" "}
                                                {activeAccount.Username}
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                User ID: {activeAccount.UserID}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {signatureState.isError && (
                                    <div className="text-red-500 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm p-3 rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
                                        {signatureState.Message}
                                    </div>
                                )}
                                {signatureState.isBlocked && (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-red-50/90 dark:bg-red-950/50 backdrop-blur-md border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-5 rounded-lg shadow-sm w-full max-w-md mb-3">
                                            <div className="text-center bg-white/30 dark:bg-black/20 p-3 rounded-md backdrop-blur-sm">
                                                <span className="font-mono text-2xl font-semibold tracking-wider">
                                                    {
                                                        signatureState.remainingTime
                                                    }
                                                </span>
                                                <p className="text-sm mt-1 opacity-70">
                                                    Time remaining
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!signatureState.isBlocked && (
                                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                                        <Input
                                            name="AdminSignature"
                                            value={adminSignature}
                                            onChange={
                                                handleSignatureInputChange
                                            }
                                            isClearable
                                            onClear={() =>
                                                setAdminSignature("")
                                            }
                                            placeholder="Enter Admin Signature"
                                            type={
                                                signatureState.isVisible
                                                    ? "text"
                                                    : "password"
                                            }
                                            startContent={
                                                <IconButton
                                                    onClick={() => {
                                                        setSignatureState(
                                                            (prev) => ({
                                                                ...prev,
                                                                isVisible:
                                                                    !prev.isVisible
                                                            })
                                                        );
                                                    }}
                                                    size="small">
                                                    {signatureState.isVisible ? (
                                                        <Visibility fontSize="small" />
                                                    ) : (
                                                        <VisibilityOff fontSize="small" />
                                                    )}
                                                </IconButton>
                                            }
                                            classNames={{
                                                base: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700",
                                                inputWrapper:
                                                    "shadow-sm hover:shadow-md transition-shadow duration-200"
                                            }}
                                        />
                                        <Button
                                            onPress={fetchAdminSignature}
                                            isLoading={
                                                signatureState.isFetching
                                            }
                                            isDisabled={
                                                !adminSignature.trim() ||
                                                signatureState.isFetching
                                            }
                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                                            startContent={<Security />}>
                                            {signatureState.isFetching
                                                ? "Promoting Account..."
                                                : "Verify & Promote"}
                                        </Button>

                                        <div className="text-xs text-gray-500 text-center">
                                            Attempts remaining:{" "}
                                            {Math.max(
                                                0,
                                                3 - signatureState.TryCount
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                {adminStatus?.isAdmin && !signatureState.isVerified && (
                    <Card className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-700">
                        <CardBody className="flex flex-row items-center space-x-3">
                            <CheckCircle className="text-blue-600 dark:text-blue-400" />
                            <div>
                                <p className="text-blue-700 dark:text-blue-300 font-semibold">
                                    Admin Access Confirmed!
                                </p>
                                <p className="text-blue-600 dark:text-blue-400 text-sm">
                                    {activeAccount?.Username &&
                                        `Welcome ${activeAccount.Username}! `}
                                    You already have admin privileges and can
                                    promote other users.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                )}
                {signatureState.isVerified && (
                    <Card className="bg-success-50 dark:bg-success-950/50 border border-success-200 dark:border-success-700">
                        <CardBody className="flex flex-row items-center space-x-3">
                            <CheckCircle className="text-success dark:text-success-400" />
                            <div>
                                <p className="text-success-700 dark:text-success-300 font-semibold">
                                    Admin Access Granted!
                                </p>
                                <p className="text-success-600 dark:text-success-400 text-sm">
                                    {activeAccount?.Username &&
                                        `Welcome ${activeAccount.Username}! `}
                                    You can now promote users to admin using
                                    email or username.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                )}
                {(adminStatus?.isAdmin || signatureState.isVerified) && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">
                                Give Others to Admin Access
                            </h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                                    Promote Another User{" "}
                                    {signatureState.isVerified
                                        ? "(Signature Verified)"
                                        : "(Admin Only)"}
                                </h3>{" "}
                                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                                    {signatureState.isVerified
                                        ? "You have verified your admin signature and can now promote other users by email or username:"
                                        : "You can promote another user to admin since you have admin access:"}
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter Email or Username to promote"
                                        value={userIdentifierToPromote}
                                        onValueChange={
                                            setUserIdentifierToPromote
                                        }
                                        className="flex-1"
                                    />
                                    <Button
                                        color="primary"
                                        onPress={promoteToAdmin}
                                        isLoading={promoting}
                                        isDisabled={
                                            !userIdentifierToPromote.trim() ||
                                            promoting
                                        }>
                                        Promote to Admin
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}
                {/* Recent Admin Actions */}
                {(adminStatus?.isAdmin || signatureState.isVerified) &&
                    adminActions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <AdminPanelSettings className="text-primary" />
                                    Recent Admin Actions
                                </h2>
                            </CardHeader>
                            <CardBody className="space-y-3">
                                {" "}
                                {adminActions.map((action) => (
                                    <div
                                        key={action.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {action.action}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Method: {action.method} •{" "}
                                                {action.timestamp}
                                            </p>
                                        </div>
                                        <Chip
                                            color="success"
                                            variant="flat"
                                            size="sm">
                                            Success
                                        </Chip>
                                    </div>
                                ))}
                                {adminActions.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                        No recent admin actions
                                    </p>
                                )}
                            </CardBody>
                        </Card>
                    )}
                {/* Actions */}
                <div className="pl-3 text-center gap-2 flex flex-row">
                    <Button
                        color="primary"
                        onPress={fetchAdminStatus}
                        startContent={<AdminPanelSettings />}>
                        Refresh Status
                    </Button>
                    {(adminStatus?.isAdmin || signatureState.isVerified) && (
                        <div>
                            <Button
                                color="success"
                                variant="bordered"
                                onPress={() =>
                                    (window.location.href = "/admin")
                                }
                                startContent={<AdminPanelSettings />}>
                                Go to Admin Panel
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
