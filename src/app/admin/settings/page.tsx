"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    Switch,
    Select,
    SelectItem,
    Chip,
    Divider,
    Avatar,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Tabs,
    Tab
} from "@heroui/react";
import {
    Settings,
    Security,
    Notifications,
    Palette,
    Language,
    Storage,
    Email,
    Shield,
    Key,
    Backup,
    CloudUpload,
    Save,
    RestartAlt,
    Warning,
    CheckCircle
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import AdminLayout from "@Components/Admin/Layout/AdminLayout";

interface SiteSettings {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    theme: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    enableComments: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
    enableMaintenance: boolean;
    maintenanceMessage: string;
}

interface SecuritySettings {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
    enableCaptcha: boolean;
    trustedDomains: string[];
}

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    newUserNotifications: boolean;
    commentNotifications: boolean;
    systemAlerts: boolean;
    marketingEmails: boolean;
}

const mockSiteSettings: SiteSettings = {
    siteName: "Portfolio Site",
    siteDescription: "Personal portfolio and blog website",
    siteUrl: "https://example.com",
    adminEmail: "admin@example.com",
    timezone: "UTC",
    language: "en",
    theme: "auto",
    allowRegistration: true,
    requireEmailVerification: true,
    enableComments: true,
    enableNotifications: true,
    enableAnalytics: true,
    enableMaintenance: false,
    maintenanceMessage: "Site is under maintenance. Please check back later."
};

const mockSecuritySettings: SecuritySettings = {
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPasswords: true,
    enableCaptcha: true,
    trustedDomains: ["example.com", "subdomain.example.com"]
};

const mockNotificationSettings: NotificationSettings = {
    emailNotifications: true,
    pushNotifications: false,
    newUserNotifications: true,
    commentNotifications: true,
    systemAlerts: true,
    marketingEmails: false
};

export default function SettingsAdminPage() {
    const router = useRouter();
    const { currentAccount } = useAccountSwitcher();
    const [siteSettings, setSiteSettings] =
        useState<SiteSettings>(mockSiteSettings);
    const [securitySettings, setSecuritySettings] =
        useState<SecuritySettings>(mockSecuritySettings);
    const [notificationSettings, setNotificationSettings] =
        useState<NotificationSettings>(mockNotificationSettings);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<
        "idle" | "saving" | "saved" | "error"
    >("idle");
    const [activeTab, setActiveTab] = useState("general");

    const {
        isOpen: isBackupOpen,
        onOpen: onBackupOpen,
        onClose: onBackupClose
    } = useDisclosure();
    const {
        isOpen: isResetOpen,
        onOpen: onResetOpen,
        onClose: onResetClose
    } = useDisclosure();

    const handleSaveSettings = async () => {
        setLoading(true);
        setSaveStatus("saving");

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Here you would make actual API calls to save settings
            console.log("Saving settings:", {
                siteSettings,
                securitySettings,
                notificationSettings
            });

            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (error) {
            console.error("Failed to save settings:", error);
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setLoading(true);
        try {
            // Simulate backup creation
            await new Promise((resolve) => setTimeout(resolve, 2000));
            console.log("Backup created successfully");
            onBackupClose();
        } catch (error) {
            console.error("Failed to create backup:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFactoryReset = async () => {
        setLoading(true);
        try {
            // Simulate factory reset
            await new Promise((resolve) => setTimeout(resolve, 1500));
            console.log("Factory reset completed");
            onResetClose();
        } catch (error) {
            console.error("Failed to perform factory reset:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSaveButtonColor = () => {
        switch (saveStatus) {
            case "saving":
                return "warning";
            case "saved":
                return "success";
            case "error":
                return "danger";
            default:
                return "primary";
        }
    };

    const getSaveButtonText = () => {
        switch (saveStatus) {
            case "saving":
                return "Saving...";
            case "saved":
                return "Saved!";
            case "error":
                return "Error";
            default:
                return "Save Changes";
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Settings
                            </h1>
                            <p className="text-default-500">
                                Configure your site settings and preferences
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="light"
                                startContent={<Backup />}
                                onPress={onBackupOpen}>
                                Create Backup
                            </Button>
                            <Button
                                color={getSaveButtonColor()}
                                startContent={
                                    saveStatus === "saved" ? (
                                        <CheckCircle />
                                    ) : (
                                        <Save />
                                    )
                                }
                                onPress={handleSaveSettings}
                                isLoading={saveStatus === "saving"}>
                                {getSaveButtonText()}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Settings Tabs */}
                <Card>
                    <CardBody className="p-0">
                        <Tabs
                            selectedKey={activeTab}
                            onSelectionChange={(key) =>
                                setActiveTab(key as string)
                            }
                            variant="underlined"
                            classNames={{
                                tabList:
                                    "w-full relative rounded-none p-0 border-b border-divider",
                                cursor: "w-full bg-primary",
                                tab: "max-w-fit px-6 h-12",
                                tabContent:
                                    "group-data-[selected=true]:text-primary"
                            }}>
                            {/* General Settings */}
                            <Tab
                                key="general"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <Settings className="w-4 h-4" />
                                        <span>General</span>
                                    </div>
                                }>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Site Name"
                                            value={siteSettings.siteName}
                                            onChange={(e) =>
                                                setSiteSettings({
                                                    ...siteSettings,
                                                    siteName: e.target.value
                                                })
                                            }
                                            placeholder="Enter site name"
                                        />
                                        <Input
                                            label="Admin Email"
                                            value={siteSettings.adminEmail}
                                            onChange={(e) =>
                                                setSiteSettings({
                                                    ...siteSettings,
                                                    adminEmail: e.target.value
                                                })
                                            }
                                            placeholder="admin@example.com"
                                            type="email"
                                        />
                                    </div>

                                    <Textarea
                                        label="Site Description"
                                        value={siteSettings.siteDescription}
                                        onChange={(e) =>
                                            setSiteSettings({
                                                ...siteSettings,
                                                siteDescription: e.target.value
                                            })
                                        }
                                        placeholder="Describe your site"
                                        maxRows={3}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Input
                                            label="Site URL"
                                            value={siteSettings.siteUrl}
                                            onChange={(e) =>
                                                setSiteSettings({
                                                    ...siteSettings,
                                                    siteUrl: e.target.value
                                                })
                                            }
                                            placeholder="https://example.com"
                                            type="url"
                                        />
                                        <Select
                                            label="Timezone"
                                            selectedKeys={[
                                                siteSettings.timezone
                                            ]}
                                            onSelectionChange={(keys) =>
                                                setSiteSettings({
                                                    ...siteSettings,
                                                    timezone: Array.from(
                                                        keys
                                                    )[0] as string
                                                })
                                            }>
                                            <SelectItem key="UTC">
                                                UTC
                                            </SelectItem>
                                            <SelectItem key="EST">
                                                Eastern Time
                                            </SelectItem>
                                            <SelectItem key="PST">
                                                Pacific Time
                                            </SelectItem>
                                            <SelectItem key="GMT">
                                                Greenwich Mean Time
                                            </SelectItem>
                                        </Select>
                                        <Select
                                            label="Language"
                                            selectedKeys={[
                                                siteSettings.language
                                            ]}
                                            onSelectionChange={(keys) =>
                                                setSiteSettings({
                                                    ...siteSettings,
                                                    language: Array.from(
                                                        keys
                                                    )[0] as string
                                                })
                                            }>
                                            <SelectItem key="en">
                                                English
                                            </SelectItem>
                                            <SelectItem key="es">
                                                Spanish
                                            </SelectItem>
                                            <SelectItem key="fr">
                                                French
                                            </SelectItem>
                                            <SelectItem key="de">
                                                German
                                            </SelectItem>
                                        </Select>
                                    </div>

                                    <Divider />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">
                                            Site Features
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        User Registration
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Allow new users to
                                                        register
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        siteSettings.allowRegistration
                                                    }
                                                    onValueChange={(value) =>
                                                        setSiteSettings({
                                                            ...siteSettings,
                                                            allowRegistration:
                                                                value
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        Email Verification
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Require email
                                                        verification for new
                                                        users
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        siteSettings.requireEmailVerification
                                                    }
                                                    onValueChange={(value) =>
                                                        setSiteSettings({
                                                            ...siteSettings,
                                                            requireEmailVerification:
                                                                value
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        Comments
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Enable commenting system
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        siteSettings.enableComments
                                                    }
                                                    onValueChange={(value) =>
                                                        setSiteSettings({
                                                            ...siteSettings,
                                                            enableComments:
                                                                value
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        Analytics
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Enable site analytics
                                                        tracking
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        siteSettings.enableAnalytics
                                                    }
                                                    onValueChange={(value) =>
                                                        setSiteSettings({
                                                            ...siteSettings,
                                                            enableAnalytics:
                                                                value
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Divider />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">
                                            Maintenance Mode
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border border-warning-200 rounded-lg bg-warning-50">
                                                <div className="flex items-center gap-3">
                                                    <Warning className="w-5 h-5 text-warning" />
                                                    <div>
                                                        <div className="font-medium">
                                                            Maintenance Mode
                                                        </div>
                                                        <div className="text-sm text-default-500">
                                                            Put the site in
                                                            maintenance mode
                                                        </div>
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        siteSettings.enableMaintenance
                                                    }
                                                    onValueChange={(value) =>
                                                        setSiteSettings({
                                                            ...siteSettings,
                                                            enableMaintenance:
                                                                value
                                                        })
                                                    }
                                                    color="warning"
                                                />
                                            </div>
                                            {siteSettings.enableMaintenance && (
                                                <Textarea
                                                    label="Maintenance Message"
                                                    value={
                                                        siteSettings.maintenanceMessage
                                                    }
                                                    onChange={(e) =>
                                                        setSiteSettings({
                                                            ...siteSettings,
                                                            maintenanceMessage:
                                                                e.target.value
                                                        })
                                                    }
                                                    placeholder="Enter maintenance message"
                                                    maxRows={3}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Tab>

                            {/* Security Settings */}
                            <Tab
                                key="security"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <Security className="w-4 h-4" />
                                        <span>Security</span>
                                    </div>
                                }>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">
                                            Authentication
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        Two-Factor
                                                        Authentication
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Require 2FA for admin
                                                        accounts
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        securitySettings.twoFactorAuth
                                                    }
                                                    onValueChange={(value) =>
                                                        setSecuritySettings({
                                                            ...securitySettings,
                                                            twoFactorAuth: value
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        CAPTCHA
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Enable CAPTCHA for forms
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        securitySettings.enableCaptcha
                                                    }
                                                    onValueChange={(value) =>
                                                        setSecuritySettings({
                                                            ...securitySettings,
                                                            enableCaptcha: value
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <Input
                                            label="Session Timeout (minutes)"
                                            value={securitySettings.sessionTimeout.toString()}
                                            onChange={(e) =>
                                                setSecuritySettings({
                                                    ...securitySettings,
                                                    sessionTimeout:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 60
                                                })
                                            }
                                            type="number"
                                            min="5"
                                            max="1440"
                                        />
                                        <Input
                                            label="Max Login Attempts"
                                            value={securitySettings.maxLoginAttempts.toString()}
                                            onChange={(e) =>
                                                setSecuritySettings({
                                                    ...securitySettings,
                                                    maxLoginAttempts:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 5
                                                })
                                            }
                                            type="number"
                                            min="1"
                                            max="20"
                                        />
                                        <Input
                                            label="Min Password Length"
                                            value={securitySettings.passwordMinLength.toString()}
                                            onChange={(e) =>
                                                setSecuritySettings({
                                                    ...securitySettings,
                                                    passwordMinLength:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 8
                                                })
                                            }
                                            type="number"
                                            min="4"
                                            max="50"
                                        />
                                        <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                            <div>
                                                <div className="text-sm font-medium">
                                                    Strong Passwords
                                                </div>
                                                <div className="text-xs text-default-500">
                                                    Require complex passwords
                                                </div>
                                            </div>
                                            <Switch
                                                isSelected={
                                                    securitySettings.requireStrongPasswords
                                                }
                                                onValueChange={(value) =>
                                                    setSecuritySettings({
                                                        ...securitySettings,
                                                        requireStrongPasswords:
                                                            value
                                                    })
                                                }
                                                size="sm"
                                            />
                                        </div>
                                    </div>

                                    <Divider />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">
                                            Trusted Domains
                                        </h3>
                                        <div className="space-y-2">
                                            {securitySettings.trustedDomains.map(
                                                (domain, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2">
                                                        <Input
                                                            value={domain}
                                                            onChange={(e) => {
                                                                const newDomains =
                                                                    [
                                                                        ...securitySettings.trustedDomains
                                                                    ];
                                                                newDomains[
                                                                    index
                                                                ] =
                                                                    e.target.value;
                                                                setSecuritySettings(
                                                                    {
                                                                        ...securitySettings,
                                                                        trustedDomains:
                                                                            newDomains
                                                                    }
                                                                );
                                                            }}
                                                            placeholder="example.com"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            variant="light"
                                                            onPress={() => {
                                                                const newDomains =
                                                                    securitySettings.trustedDomains.filter(
                                                                        (
                                                                            _,
                                                                            i
                                                                        ) =>
                                                                            i !==
                                                                            index
                                                                    );
                                                                setSecuritySettings(
                                                                    {
                                                                        ...securitySettings,
                                                                        trustedDomains:
                                                                            newDomains
                                                                    }
                                                                );
                                                            }}>
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                onPress={() =>
                                                    setSecuritySettings({
                                                        ...securitySettings,
                                                        trustedDomains: [
                                                            ...securitySettings.trustedDomains,
                                                            ""
                                                        ]
                                                    })
                                                }>
                                                Add Domain
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Tab>

                            {/* Notification Settings */}
                            <Tab
                                key="notifications"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <Notifications className="w-4 h-4" />
                                        <span>Notifications</span>
                                    </div>
                                }>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">
                                            Notification Preferences
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Email className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <div className="font-medium">
                                                            Email Notifications
                                                        </div>
                                                        <div className="text-sm text-default-500">
                                                            Receive
                                                            notifications via
                                                            email
                                                        </div>
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        notificationSettings.emailNotifications
                                                    }
                                                    onValueChange={(value) =>
                                                        setNotificationSettings(
                                                            {
                                                                ...notificationSettings,
                                                                emailNotifications:
                                                                    value
                                                            }
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Notifications className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <div className="font-medium">
                                                            Push Notifications
                                                        </div>
                                                        <div className="text-sm text-default-500">
                                                            Receive browser push
                                                            notifications
                                                        </div>
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        notificationSettings.pushNotifications
                                                    }
                                                    onValueChange={(value) =>
                                                        setNotificationSettings(
                                                            {
                                                                ...notificationSettings,
                                                                pushNotifications:
                                                                    value
                                                            }
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Divider />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">
                                            Event Notifications
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        New User Registrations
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Get notified when users
                                                        register
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        notificationSettings.newUserNotifications
                                                    }
                                                    onValueChange={(value) =>
                                                        setNotificationSettings(
                                                            {
                                                                ...notificationSettings,
                                                                newUserNotifications:
                                                                    value
                                                            }
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        New Comments
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Get notified about new
                                                        comments
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        notificationSettings.commentNotifications
                                                    }
                                                    onValueChange={(value) =>
                                                        setNotificationSettings(
                                                            {
                                                                ...notificationSettings,
                                                                commentNotifications:
                                                                    value
                                                            }
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        System Alerts
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Get notified about
                                                        system issues
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        notificationSettings.systemAlerts
                                                    }
                                                    onValueChange={(value) =>
                                                        setNotificationSettings(
                                                            {
                                                                ...notificationSettings,
                                                                systemAlerts:
                                                                    value
                                                            }
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        Marketing Emails
                                                    </div>
                                                    <div className="text-sm text-default-500">
                                                        Receive marketing and
                                                        promotional emails
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={
                                                        notificationSettings.marketingEmails
                                                    }
                                                    onValueChange={(value) =>
                                                        setNotificationSettings(
                                                            {
                                                                ...notificationSettings,
                                                                marketingEmails:
                                                                    value
                                                            }
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Tab>

                            {/* System Settings */}
                            <Tab
                                key="system"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <Storage className="w-4 h-4" />
                                        <span>System</span>
                                    </div>
                                }>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* System Info */}
                                        <Card>
                                            <CardHeader>
                                                <h3 className="text-lg font-semibold">
                                                    System Information
                                                </h3>
                                            </CardHeader>
                                            <CardBody className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-default-500">
                                                        Version:
                                                    </span>
                                                    <span className="font-medium">
                                                        1.0.0
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-default-500">
                                                        Last Updated:
                                                    </span>
                                                    <span className="font-medium">
                                                        2024-01-15
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-default-500">
                                                        Database Size:
                                                    </span>
                                                    <span className="font-medium">
                                                        45.2 MB
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-default-500">
                                                        Storage Used:
                                                    </span>
                                                    <span className="font-medium">
                                                        2.1 GB
                                                    </span>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Quick Actions */}
                                        <Card>
                                            <CardHeader>
                                                <h3 className="text-lg font-semibold">
                                                    Quick Actions
                                                </h3>
                                            </CardHeader>
                                            <CardBody className="space-y-3">
                                                <Button
                                                    color="primary"
                                                    variant="flat"
                                                    startContent={<Backup />}
                                                    onPress={onBackupOpen}
                                                    className="w-full justify-start">
                                                    Create System Backup
                                                </Button>
                                                <Button
                                                    color="warning"
                                                    variant="flat"
                                                    startContent={
                                                        <CloudUpload />
                                                    }
                                                    className="w-full justify-start">
                                                    Check for Updates
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    variant="flat"
                                                    startContent={
                                                        <RestartAlt />
                                                    }
                                                    onPress={onResetOpen}
                                                    className="w-full justify-start">
                                                    Factory Reset
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* Cache Management */}
                                    <Card>
                                        <CardHeader>
                                            <h3 className="text-lg font-semibold">
                                                Cache Management
                                            </h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Button
                                                    color="primary"
                                                    variant="flat">
                                                    Clear Page Cache
                                                </Button>
                                                <Button
                                                    color="primary"
                                                    variant="flat">
                                                    Clear Database Cache
                                                </Button>
                                                <Button
                                                    color="primary"
                                                    variant="flat">
                                                    Clear All Caches
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Logs */}
                                    <Card>
                                        <CardHeader>
                                            <h3 className="text-lg font-semibold">
                                                System Logs
                                            </h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <Button variant="flat">
                                                    Error Logs
                                                </Button>
                                                <Button variant="flat">
                                                    Access Logs
                                                </Button>
                                                <Button variant="flat">
                                                    Security Logs
                                                </Button>
                                                <Button variant="flat">
                                                    Download All
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>

                {/* Backup Modal */}
                <Modal
                    isOpen={isBackupOpen}
                    onClose={onBackupClose}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h3 className="text-lg font-semibold">
                                        Create System Backup
                                    </h3>
                                    <p className="text-sm text-default-500">
                                        This will create a complete backup of
                                        your site data and settings.
                                    </p>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="space-y-4">
                                        <div className="p-4 border border-warning-200 rounded-lg bg-warning-50">
                                            <div className="flex items-center gap-2">
                                                <Warning className="w-5 h-5 text-warning" />
                                                <span className="text-sm font-medium text-warning-800">
                                                    This process may take
                                                    several minutes depending on
                                                    your data size.
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="rounded"
                                                />
                                                <span className="text-sm">
                                                    Include database
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="rounded"
                                                />
                                                <span className="text-sm">
                                                    Include uploaded files
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="rounded"
                                                />
                                                <span className="text-sm">
                                                    Include configuration
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        variant="light"
                                        onPress={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={handleCreateBackup}
                                        isLoading={loading}>
                                        Create Backup
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Factory Reset Modal */}
                <Modal
                    isOpen={isResetOpen}
                    onClose={onResetClose}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h3 className="text-lg font-semibold text-danger">
                                        Factory Reset
                                    </h3>
                                    <p className="text-sm text-default-500">
                                        This will permanently delete all data
                                        and restore default settings.
                                    </p>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="space-y-4">
                                        <div className="p-4 border border-danger-200 rounded-lg bg-danger-50">
                                            <div className="flex items-center gap-2">
                                                <Warning className="w-5 h-5 text-danger" />
                                                <span className="text-sm font-medium text-danger-800">
                                                    This action cannot be
                                                    undone. Make sure you have a
                                                    backup!
                                                </span>
                                            </div>
                                        </div>
                                        <Input
                                            label="Type 'RESET' to confirm"
                                            placeholder="RESET"
                                            variant="bordered"
                                        />
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        variant="light"
                                        onPress={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="danger"
                                        onPress={handleFactoryReset}
                                        isLoading={loading}>
                                        Factory Reset
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </AdminLayout>
    );
}
