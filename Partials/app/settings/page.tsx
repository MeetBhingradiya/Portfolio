"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Lib/auth-client";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Switch,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Select,
    SelectItem,
    Chip,
    Progress
} from "@heroui/react";
import {
    FaShieldAlt,
    FaKey,
    FaEye,
    FaEyeSlash,
    FaBell,
    FaPalette,
    FaGlobe,
    FaClock,
    FaSave,
    FaTimes,
    FaTrash,
    FaExclamationTriangle
} from "react-icons/fa";
import { Axios } from "../../Utils/Axios";

interface SecuritySettings {
    isMFAEnabled: boolean;
    lastPasswordChange?: string;
    loginAttempts: number;
}

interface NotificationSettings {
    email: boolean;
    push: boolean;
    marketing: boolean;
}

interface PreferenceSettings {
    theme: "light" | "dark" | "system";
    language: string;
    timezone: string;
    notifications: NotificationSettings;
}

export default function SettingsPage() {
    const { session, user, isLoading: status, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Password change
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    
    // Settings
    const [security, setSecurity] = useState<SecuritySettings>({
        isMFAEnabled: false,
        loginAttempts: 0
    });
    const [preferences, setPreferences] = useState<PreferenceSettings>({
        theme: "system",
        language: "en",
        timezone: "UTC",
        notifications: {
            email: true,
            push: true,
            marketing: false
        }
    });

    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

    // Redirect if not authenticated
    useEffect(() => {
        if (status) return; // Loading
        if (!isAuthenticated) {
            router.push("/auth/signin");
            return;
        }
    }, [status, isAuthenticated, router]);

    // Fetch settings data
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const response = await Axios.get("/api/dashboard");
                
                if (response.data.Status === 1) {
                    setSecurity(response.data.Data.security || {});
                    setPreferences(response.data.Data.user.preferences || preferences);
                } else {
                    setError(response.data.Message || "Failed to load settings");
                }
            } catch (error: any) {
                setError(error.response?.data?.Message || "Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [isAuthenticated]);

    // Password strength calculator
    useEffect(() => {
        const calculateStrength = (password: string) => {
            let strength = 0;
            if (password.length >= 8) strength += 25;
            if (/[a-z]/.test(password)) strength += 25;
            if (/[A-Z]/.test(password)) strength += 25;
            if (/\d/.test(password)) strength += 15;
            if (/[^a-zA-Z\d]/.test(password)) strength += 10;
            return Math.min(strength, 100);
        };
        
        setPasswordStrength(calculateStrength(newPassword));
    }, [newPassword]);

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (passwordStrength < 50) {
            setError("Password is too weak. Please choose a stronger password.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await Axios.post("/api/auth/change-password", {
                currentPassword,
                newPassword
            });

            if (response.data.Status === 1) {
                setSuccess("Password changed successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setError(response.data.Message || "Failed to change password");
            }
        } catch (error: any) {
            setError(error.response?.data?.Message || "Failed to change password");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePreferences = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await Axios.put("/api/profile", {
                preferences
            });

            if (response.data.Status === 1) {
                setSuccess("Preferences saved successfully!");
            } else {
                setError(response.data.Message || "Failed to save preferences");
            }
        } catch (error: any) {
            setError(error.response?.data?.Message || "Failed to save preferences");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const response = await Axios.delete("/api/auth/delete-account");

            if (response.data.Status === 1) {
                router.push("/");
            } else {
                setError(response.data.Message || "Failed to delete account");
            }
        } catch (error: any) {
            setError(error.response?.data?.Message || "Failed to delete account");
        }
        onDeleteModalClose();
    };

    if (status || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <span className="text-white">Loading settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center space-x-4">
                        <Button
                            isIconOnly
                            variant="flat"
                            onClick={() => router.back()}
                        >
                            <FaTimes />
                        </Button>
                        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
                    </div>
                </motion.div>

                {/* Success/Error Messages */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-success/20 border border-success rounded-lg p-4"
                    >
                        <p className="text-success">{success}</p>
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-danger/20 border border-danger rounded-lg p-4"
                    >
                        <p className="text-danger">{error}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Security Settings */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Password Change */}
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <FaKey className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Change Password</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <Input
                                    label="Current Password"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    endContent={
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            size="sm"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    }
                                />
                                
                                <Input
                                    label="New Password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    endContent={
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            size="sm"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    }
                                />
                                
                                {newPassword && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Password Strength</span>
                                            <span className={`${
                                                passwordStrength < 30 ? 'text-danger' :
                                                passwordStrength < 70 ? 'text-warning' : 'text-success'
                                            }`}>
                                                {passwordStrength < 30 ? 'Weak' :
                                                 passwordStrength < 70 ? 'Medium' : 'Strong'}
                                            </span>
                                        </div>
                                        <Progress
                                            value={passwordStrength}
                                            color={
                                                passwordStrength < 30 ? 'danger' :
                                                passwordStrength < 70 ? 'warning' : 'success'
                                            }
                                            size="sm"
                                        />
                                    </div>
                                )}
                                
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                
                                <Button
                                    color="primary"
                                    onClick={handlePasswordChange}
                                    isLoading={isSaving}
                                    isDisabled={!currentPassword || !newPassword || !confirmPassword}
                                    fullWidth
                                >
                                    Change Password
                                </Button>
                            </CardBody>
                        </Card>

                        {/* Security Options */}
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <FaShieldAlt className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Security</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">Two-Factor Authentication</p>
                                        <p className="text-sm text-gray-400">Add an extra layer of security</p>
                                    </div>
                                    <Switch 
                                        size="sm"
                                        isSelected={security.isMFAEnabled}
                                        onValueChange={(isSelected) => setSecurity({...security, isMFAEnabled: isSelected})}
                                    />
                                </div>
                                
                                {security.lastPasswordChange && (
                                    <div className="text-sm text-gray-400">
                                        Last password change: {new Date(security.lastPasswordChange).toLocaleDateString()}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Preferences */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Appearance */}
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <FaPalette className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Appearance</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <Select
                                    label="Theme"
                                    selectedKeys={[preferences.theme]}
                                    onSelectionChange={(keys) => {
                                        const theme = Array.from(keys)[0] as string;
                                        setPreferences({...preferences, theme: theme as any});
                                    }}
                                >
                                    <SelectItem key="light">Light</SelectItem>
                                    <SelectItem key="dark">Dark</SelectItem>
                                    <SelectItem key="system">System</SelectItem>
                                </Select>
                            </CardBody>
                        </Card>

                        {/* Localization */}
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <FaGlobe className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Localization</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <Select
                                    label="Language"
                                    selectedKeys={[preferences.language]}
                                    onSelectionChange={(keys) => {
                                        const language = Array.from(keys)[0] as string;
                                        setPreferences({...preferences, language});
                                    }}
                                >
                                    <SelectItem key="en">English</SelectItem>
                                    <SelectItem key="es">Español</SelectItem>
                                    <SelectItem key="fr">Français</SelectItem>
                                    <SelectItem key="de">Deutsch</SelectItem>
                                </Select>
                                
                                <Select
                                    label="Timezone"
                                    selectedKeys={[preferences.timezone]}
                                    onSelectionChange={(keys) => {
                                        const timezone = Array.from(keys)[0] as string;
                                        setPreferences({...preferences, timezone});
                                    }}
                                >
                                    <SelectItem key="UTC">UTC</SelectItem>
                                    <SelectItem key="America/New_York">Eastern Time</SelectItem>
                                    <SelectItem key="America/Chicago">Central Time</SelectItem>
                                    <SelectItem key="America/Los_Angeles">Pacific Time</SelectItem>
                                    <SelectItem key="Europe/London">London</SelectItem>
                                    <SelectItem key="Europe/Paris">Paris</SelectItem>
                                    <SelectItem key="Asia/Tokyo">Tokyo</SelectItem>
                                </Select>
                            </CardBody>
                        </Card>

                        {/* Notifications */}
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <FaBell className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Notifications</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">Email Notifications</p>
                                        <p className="text-sm text-gray-400">Receive notifications via email</p>
                                    </div>
                                    <Switch 
                                        size="sm"
                                        isSelected={preferences.notifications.email}
                                        onValueChange={(isSelected) => setPreferences({
                                            ...preferences,
                                            notifications: { ...preferences.notifications, email: isSelected }
                                        })}
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">Push Notifications</p>
                                        <p className="text-sm text-gray-400">Receive push notifications</p>
                                    </div>
                                    <Switch 
                                        size="sm"
                                        isSelected={preferences.notifications.push}
                                        onValueChange={(isSelected) => setPreferences({
                                            ...preferences,
                                            notifications: { ...preferences.notifications, push: isSelected }
                                        })}
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">Marketing Emails</p>
                                        <p className="text-sm text-gray-400">Receive updates about new features</p>
                                    </div>
                                    <Switch 
                                        size="sm"
                                        isSelected={preferences.notifications.marketing}
                                        onValueChange={(isSelected) => setPreferences({
                                            ...preferences,
                                            notifications: { ...preferences.notifications, marketing: isSelected }
                                        })}
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        <Button
                            color="primary"
                            onClick={handleSavePreferences}
                            isLoading={isSaving}
                            fullWidth
                            startContent={<FaSave />}
                        >
                            Save Preferences
                        </Button>
                    </motion.div>
                </div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="bg-red-900/20 backdrop-blur-lg border border-red-500/30">
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <FaExclamationTriangle className="text-danger" />
                                <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white">Delete Account</p>
                                    <p className="text-sm text-gray-400">
                                        Permanently delete your account and all associated data
                                    </p>
                                </div>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onClick={onDeleteModalOpen}
                                    startContent={<FaTrash />}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* Delete Account Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
                <ModalContent>
                    <ModalHeader className="text-danger">Delete Account</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete your account?</p>
                        <p className="text-sm text-gray-500 mt-2">
                            This action cannot be undone. All your data will be permanently deleted.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onDeleteModalClose}>
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleDeleteAccount}
                        >
                            Delete Account
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
