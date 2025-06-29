"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Switch,
    Select,
    SelectItem,
    Chip,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Tabs,
    Tab,
    Spinner,
    Progress
} from "@heroui/react";
import {
    Settings,
    Security,
    Analytics,
    Visibility,
    CloudSync,
    Save,
    RestartAlt,
    Warning,
    CheckCircle,
    Error as ErrorIcon,
    Sync,
    Shield,
    MonetizationOn,
    BugReport,
    Add
} from "@mui/icons-material";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import { Axios } from "@Utils/Axios";

interface StateSettings {
    Analytics: {
        Vercel: boolean;
    };
    Debugging: {
        ReactScan: boolean;
    };
    Monitization: {
        GoogleADS: boolean;
    };
    Authentication: {
        Whitelisted_Email_Domains: string[];
        Blocked_Threats: string[];
        Signup_Enabled: boolean;
        Signin_Enabled: boolean;
        Password_Strength: {
            Min_Length: number;
            Max_Length: number;
            Require_Uppercase: boolean;
            Require_Lowercase: boolean;
            Require_Numbers: boolean;
            Require_Special_Characters: boolean;
        };
    };
}

const threatOptions = [
    "TOR",
    "VPN",
    "ICloud-Relay",
    "Proxy",
    "Datacenter",
    "Anonymous",
    "KnownAttacker",
    "KnownAbuser",
    "Threat",
    "Bogon"
];

interface ComponentState {
    settings: StateSettings | null;
    ui: {
        isLoading: boolean;
        isSaving: boolean;
        isSyncing: boolean;
    };
    message: {
        type: "error" | "success" | null;
        text: string;
    };
    form: {
        newDomain: string;
    };
}

export default function StateSettingsComponent() {
    const { currentAccount } = useAccountSwitcher();
    const {
        isOpen: isSyncModalOpen,
        onOpen: onSyncModalOpen,
        onOpenChange: onSyncModalOpenChange
    } = useDisclosure();

    const [state, setState] = useState<ComponentState>({
        settings: null,
        ui: {
            isLoading: true,
            isSaving: false,
            isSyncing: false
        },
        message: {
            type: null,
            text: ""
        },
        form: {
            newDomain: ""
        }
    });

    // Helper functions to update state
    const updateUI = (updates: Partial<ComponentState["ui"]>) => {
        setState((prev) => ({
            ...prev,
            ui: { ...prev.ui, ...updates }
        }));
    };

    const setMessage = (
        type: "error" | "success" | null,
        text: string = ""
    ) => {
        setState((prev) => ({
            ...prev,
            message: { type, text }
        }));
        if (type && text) {
            setTimeout(() => setMessage(null), 3000);
        }
    };
    const updateSettings = (updates: Partial<StateSettings>) => {
        setState((prev) => {
            if (!prev.settings) return prev;

            return {
                ...prev,
                settings: {
                    ...prev.settings,
                    ...updates
                }
            };
        });
    };

    const updateForm = (updates: Partial<ComponentState["form"]>) => {
        setState((prev) => ({
            ...prev,
            form: { ...prev.form, ...updates }
        }));
    }; 
    const fetchSettings = async () => {
        try {
            updateUI({ isLoading: true });
            const response = await Axios.get("/api/admin/state");
            const data = response.data;

            if (data.Status === 1) {
                setState((prev) => ({ ...prev, settings: data.Data }));
                setMessage(null);
            } else {
                setMessage("error", data.Message);
            }
        } catch (err) {
            setMessage("error", "Failed to fetch settings");
        } finally {
            updateUI({ isLoading: false });
        }
    };

    // Save settings
    const saveSettings = async () => {
        if (!state.settings) return;

        try {
            updateUI({ isSaving: true });
            const response = await Axios.put("/api/admin/state", {
                data: state.settings
            });

            const data = await response.data;

            if (data.Status === 1) {
                setMessage("success", "Settings saved successfully");
            } else {
                setMessage("error", data.Message);
            }
        } catch (err) {
            setMessage("error", "Failed to save settings");
        } finally {
            updateUI({ isSaving: false });
        }
    }; // Sync with remote state
    const syncWithRemote = async () => {
        try {
            updateUI({ isSyncing: true });
            const response = await Axios.post("/api/admin/state", {
                action: "sync"
            });

            const data = response.data;

            if (data.Status === 1) {
                setState((prev) => ({ ...prev, settings: data.Data }));
                setMessage("success", "Settings synced with remote repository");
            } else {
                setMessage("error", data.Message);
            }
        } catch (err) {
            setMessage("error", "Failed to sync with remote state");
        } finally {
            updateUI({ isSyncing: false });
            onSyncModalOpenChange();
        }
    }; // Add domain to whitelist
    const addDomain = () => {
        if (!state.form.newDomain.trim() || !state.settings) return;

        const domains = [
            ...state.settings.Authentication.Whitelisted_Email_Domains
        ];
        const newDomain = state.form.newDomain.trim().toLowerCase();

        if (!domains.includes(newDomain)) {
            domains.push(newDomain);
            updateSettings({
                Authentication: {
                    ...state.settings.Authentication,
                    Whitelisted_Email_Domains: domains
                }
            });
        }
        updateForm({ newDomain: "" });
    };

    // Remove domain from whitelist
    const removeDomain = (domain: string) => {
        if (!state.settings) return;

        const domains =
            state.settings.Authentication.Whitelisted_Email_Domains.filter(
                (d) => d !== domain
            );
        updateSettings({
            Authentication: {
                ...state.settings.Authentication,
                Whitelisted_Email_Domains: domains
            }
        });
    };

    // Toggle threat blocking
    const toggleThreat = (threat: string) => {
        if (!state.settings) return;

        const threats = [...state.settings.Authentication.Blocked_Threats];
        const index = threats.indexOf(threat);

        if (index > -1) {
            threats.splice(index, 1);
        } else {
            threats.push(threat);
        }

        updateSettings({
            Authentication: {
                ...state.settings.Authentication,
                Blocked_Threats: threats
            }
        });
    };
    useEffect(() => {
        fetchSettings();
    }, []);

    if (state.ui.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!state.settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="p-8">
                    <CardBody className="text-center">
                        <ErrorIcon
                            className="mx-auto mb-4 text-danger"
                            sx={{ fontSize: 48 }}
                        />
                        <h2 className="text-xl font-bold mb-2">
                            Failed to Load Settings
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {state.message.text}
                        </p>
                        <Button
                            color="primary"
                            onPress={fetchSettings}>
                            Retry
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">State Management</h3>
                    <p className="text-sm text-default-500">
                        Manage site configuration and remote state
                        synchronization
                    </p>
                </div>
                <div className="flex gap-2">
                    {" "}
                    <Button
                        color="secondary"
                        variant="bordered"
                        startContent={<Sync />}
                        onPress={onSyncModalOpen}
                        isDisabled={state.ui.isSyncing}
                        size="sm">
                        Sync Remote
                    </Button>
                    <Button
                        color="primary"
                        startContent={<Save />}
                        onPress={saveSettings}
                        isLoading={state.ui.isSaving}
                        isDisabled={state.ui.isSaving}
                        size="sm">
                        Save Changes
                    </Button>
                </div>
            </div>{" "}
            {/* Status Messages */}
            {state.message.type === "error" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <ErrorIcon className="text-danger mr-2" />
                        <span className="text-danger-700">
                            {state.message.text}
                        </span>
                    </div>
                </motion.div>
            )}
            {state.message.type === "success" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <CheckCircle className="text-success mr-2" />
                        <span className="text-success-700">
                            {state.message.text}
                        </span>
                    </div>
                </motion.div>
            )}
            {/* Settings Tabs */}
            <Tabs
                aria-label="State Settings"
                variant="bordered"
                className="w-full">
                {/* Analytics & Monitoring */}
                <Tab
                    key="analytics"
                    title={
                        <div className="flex items-center space-x-2">
                            <Analytics />
                            <span>Analytics</span>
                        </div>
                    }>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold">
                                    Analytics & Monitoring
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            Vercel Analytics
                                        </div>
                                        <div className="text-sm text-default-500">
                                            Enable Vercel web analytics tracking
                                        </div>
                                    </div>{" "}
                                    <Switch
                                        isSelected={
                                            state.settings!.Analytics.Vercel
                                        }
                                        onValueChange={(value) =>
                                            updateSettings({
                                                Analytics: {
                                                    ...state.settings!
                                                        .Analytics,
                                                    Vercel: value
                                                }
                                            })
                                        }
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold">Debugging</h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {" "}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            React Scan
                                        </div>
                                        <div className="text-sm text-default-500">
                                            Enable React component scanning and
                                            debugging
                                        </div>
                                    </div>{" "}
                                    <Switch
                                        isSelected={
                                            state.settings!.Debugging.ReactScan
                                        }
                                        onValueChange={(value) =>
                                            updateSettings({
                                                Debugging: {
                                                    ...state.settings!
                                                        .Debugging,
                                                    ReactScan: value
                                                }
                                            })
                                        }
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold">Monetization</h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            Google Ads
                                        </div>
                                        <div className="text-sm text-default-500">
                                            Enable Google AdSense advertising
                                        </div>
                                    </div>{" "}
                                    <Switch
                                        isSelected={
                                            state.settings!.Monitization
                                                .GoogleADS
                                        }
                                        onValueChange={(value) =>
                                            updateSettings({
                                                Monitization: {
                                                    ...state.settings!
                                                        .Monitization,
                                                    GoogleADS: value
                                                }
                                            })
                                        }
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </Tab>

                {/* Authentication */}
                <Tab
                    key="authentication"
                    title={
                        <div className="flex items-center space-x-2">
                            <Security />
                            <span>Authentication</span>
                        </div>
                    }>
                    <div className="space-y-6">
                        {/* Auth Controls */}
                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold">
                                    Authentication Controls
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            User Signup
                                        </div>
                                        <div className="text-sm text-default-500">
                                            Allow new users to create accounts
                                        </div>
                                    </div>{" "}
                                    <Switch
                                        isSelected={
                                            state.settings!.Authentication
                                                .Signup_Enabled
                                        }
                                        onValueChange={(value) =>
                                            updateSettings({
                                                Authentication: {
                                                    ...state.settings!
                                                        .Authentication,
                                                    Signup_Enabled: value
                                                }
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            User Signin
                                        </div>
                                        <div className="text-sm text-default-500">
                                            Allow users to sign into their
                                            accounts
                                        </div>
                                    </div>{" "}
                                    <Switch
                                        isSelected={
                                            state.settings!.Authentication
                                                .Signin_Enabled
                                        }
                                        onValueChange={(value) =>
                                            updateSettings({
                                                Authentication: {
                                                    ...state.settings!
                                                        .Authentication,
                                                    Signin_Enabled: value
                                                }
                                            })
                                        }
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Email Domain Whitelist */}
                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold">
                                    Whitelisted Email Domains
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {" "}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter domain (e.g., gmail.com)"
                                        value={state.form.newDomain}
                                        onValueChange={(value) =>
                                            updateForm({ newDomain: value })
                                        }
                                        onKeyPress={(e) =>
                                            e.key === "Enter" && addDomain()
                                        }
                                        size="sm"
                                    />
                                    <Button
                                        color="primary"
                                        startContent={<Add />}
                                        onPress={addDomain}
                                        isDisabled={
                                            !state.form.newDomain.trim()
                                        }
                                        size="sm">
                                        Add
                                    </Button>
                                </div>{" "}
                                <div className="flex flex-wrap gap-2">
                                    {state.settings!.Authentication.Whitelisted_Email_Domains.map(
                                        (domain, index) => (
                                            <Chip
                                                key={index}
                                                onClose={() =>
                                                    removeDomain(domain)
                                                }
                                                variant="flat"
                                                color="primary">
                                                {domain}
                                            </Chip>
                                        )
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Threat Intelligence */}
                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold">
                                    Blocked Threats
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <p className="text-sm text-default-500">
                                    Block access from these threat categories
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {threatOptions.map((threat) => (
                                        <div
                                            key={threat}
                                            className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                                            <span className="text-sm font-medium">
                                                {threat}
                                            </span>{" "}
                                            <Switch
                                                isSelected={state.settings!.Authentication.Blocked_Threats.includes(
                                                    threat
                                                )}
                                                onValueChange={() =>
                                                    toggleThreat(threat)
                                                }
                                                size="sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Password Strength */}
                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold">
                                    Password Requirements
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {" "}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {" "}
                                    <Input
                                        label="Minimum Length"
                                        type="number"
                                        value={state.settings!.Authentication.Password_Strength.Min_Length.toString()}
                                        onChange={(e) =>
                                            updateSettings({
                                                Authentication: {
                                                    ...state.settings!
                                                        .Authentication,
                                                    Password_Strength: {
                                                        ...state.settings!
                                                            .Authentication
                                                            .Password_Strength,
                                                        Min_Length:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 8
                                                    }
                                                }
                                            })
                                        }
                                        size="sm"
                                    />
                                    <Input
                                        label="Maximum Length"
                                        type="number"
                                        value={state.settings!.Authentication.Password_Strength.Max_Length.toString()}
                                        onChange={(e) =>
                                            updateSettings({
                                                Authentication: {
                                                    ...state.settings!
                                                        .Authentication,
                                                    Password_Strength: {
                                                        ...state.settings!
                                                            .Authentication
                                                            .Password_Strength,
                                                        Max_Length:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 128
                                                    }
                                                }
                                            })
                                        }
                                        size="sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Require Uppercase
                                        </span>{" "}
                                        <Switch
                                            isSelected={
                                                state.settings!.Authentication
                                                    .Password_Strength
                                                    .Require_Uppercase
                                            }
                                            onValueChange={(value) =>
                                                updateSettings({
                                                    Authentication: {
                                                        ...state.settings!
                                                            .Authentication,
                                                        Password_Strength: {
                                                            ...state.settings!
                                                                .Authentication
                                                                .Password_Strength,
                                                            Require_Uppercase:
                                                                value
                                                        }
                                                    }
                                                })
                                            }
                                            size="sm"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Require Lowercase
                                        </span>{" "}
                                        <Switch
                                            isSelected={
                                                state.settings!.Authentication
                                                    .Password_Strength
                                                    .Require_Lowercase
                                            }
                                            onValueChange={(value) =>
                                                updateSettings({
                                                    Authentication: {
                                                        ...state.settings!
                                                            .Authentication,
                                                        Password_Strength: {
                                                            ...state.settings!
                                                                .Authentication
                                                                .Password_Strength,
                                                            Require_Lowercase:
                                                                value
                                                        }
                                                    }
                                                })
                                            }
                                            size="sm"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Require Numbers
                                        </span>{" "}
                                        <Switch
                                            isSelected={
                                                state.settings!.Authentication
                                                    .Password_Strength
                                                    .Require_Numbers
                                            }
                                            onValueChange={(value) =>
                                                updateSettings({
                                                    Authentication: {
                                                        ...state.settings!
                                                            .Authentication,
                                                        Password_Strength: {
                                                            ...state.settings!
                                                                .Authentication
                                                                .Password_Strength,
                                                            Require_Numbers:
                                                                value
                                                        }
                                                    }
                                                })
                                            }
                                            size="sm"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Require Special Characters
                                        </span>{" "}
                                        <Switch
                                            isSelected={
                                                state.settings!.Authentication
                                                    .Password_Strength
                                                    .Require_Special_Characters
                                            }
                                            onValueChange={(value) =>
                                                updateSettings({
                                                    Authentication: {
                                                        ...state.settings!
                                                            .Authentication,
                                                        Password_Strength: {
                                                            ...state.settings!
                                                                .Authentication
                                                                .Password_Strength,
                                                            Require_Special_Characters:
                                                                value
                                                        }
                                                    }
                                                })
                                            }
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </Tab>
            </Tabs>
            {/* Sync Confirmation Modal */}
            <Modal
                isOpen={isSyncModalOpen}
                onOpenChange={onSyncModalOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Sync with Remote State
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-default-600">
                                    This will fetch the latest configuration
                                    from the remote repository and may overwrite
                                    your current local settings. Are you sure
                                    you want to continue?
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="light"
                                    onPress={onClose}>
                                    Cancel
                                </Button>{" "}
                                <Button
                                    color="primary"
                                    onPress={syncWithRemote}
                                    isLoading={state.ui.isSyncing}>
                                    Sync Now
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
