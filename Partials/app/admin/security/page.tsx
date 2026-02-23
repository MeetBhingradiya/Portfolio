"use client";

import React, { useState, useCallback } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Switch,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Textarea,
    Progress,
    Tabs,
    Tab,
    Code
} from "@heroui/react";
import {
    Security,
    VpnKey,
    Shield,
    Warning,
    CheckCircle,
    Error,
    Info,
    Refresh,
    Visibility,
    VisibilityOff,
    Computer,
    Smartphone,
    LocationOn,
    AccessTime,
    Block,
    AdminPanelSettings,
    VerifiedUser,
    Key,
    Lock
} from "@mui/icons-material";
import { AdminLayout, StatsGrid } from "../../../Components/Admin";
import { useAccountSwitcher } from "../../../Hooks/useAccountSwitcher";

interface SecurityEvent {
    id: string;
    type:
        | "login"
        | "failed_login"
        | "password_change"
        | "2fa_enabled"
        | "2fa_disabled"
        | "suspicious_activity"
        | "admin_access";
    description: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location: string;
    severity: "low" | "medium" | "high" | "critical";
    userId?: string;
    username?: string;
}

interface ActiveSession {
    id: string;
    userId: string;
    username: string;
    ipAddress: string;
    location: string;
    device: string;
    browser: string;
    loginTime: Date;
    lastActivity: Date;
    isCurrent: boolean;
}

interface SecuritySetting {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: "authentication" | "monitoring" | "access" | "data";
    level: "basic" | "advanced" | "enterprise";
}

// Mock data
const mockSecurityEvents: SecurityEvent[] = [
    {
        id: "1",
        type: "login",
        description: "Successful admin login",
        timestamp: new Date("2024-06-17T10:30:00"),
        ipAddress: "192.168.1.100",
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        location: "New York, NY",
        severity: "low",
        userId: "admin1",
        username: "admin@example.com"
    },
    {
        id: "2",
        type: "failed_login",
        description: "Failed login attempt - invalid password",
        timestamp: new Date("2024-06-17T09:15:00"),
        ipAddress: "203.0.113.45",
        userAgent: "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
        location: "Unknown",
        severity: "medium",
        username: "unknown@attacker.com"
    },
    {
        id: "3",
        type: "suspicious_activity",
        description: "Multiple login attempts from different countries",
        timestamp: new Date("2024-06-17T08:45:00"),
        ipAddress: "198.51.100.22",
        userAgent: "curl/7.68.0",
        location: "Romania",
        severity: "high"
    },
    {
        id: "4",
        type: "2fa_enabled",
        description: "Two-factor authentication enabled",
        timestamp: new Date("2024-06-16T16:20:00"),
        ipAddress: "192.168.1.100",
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        location: "New York, NY",
        severity: "low",
        userId: "user123",
        username: "john.doe@example.com"
    }
];

const mockActiveSessions: ActiveSession[] = [
    {
        id: "1",
        userId: "admin1",
        username: "admin@example.com",
        ipAddress: "192.168.1.100",
        location: "New York, NY",
        device: "Desktop",
        browser: "Chrome 125",
        loginTime: new Date("2024-06-17T08:00:00"),
        lastActivity: new Date("2024-06-17T10:30:00"),
        isCurrent: true
    },
    {
        id: "2",
        userId: "user123",
        username: "john.doe@example.com",
        ipAddress: "192.168.1.105",
        location: "New York, NY",
        device: "Mobile",
        browser: "Safari 17",
        loginTime: new Date("2024-06-17T09:30:00"),
        lastActivity: new Date("2024-06-17T10:15:00"),
        isCurrent: false
    }
];

const mockSecuritySettings: SecuritySetting[] = [
    {
        id: "1",
        name: "Two-Factor Authentication",
        description: "Require 2FA for all admin accounts",
        enabled: true,
        category: "authentication",
        level: "basic"
    },
    {
        id: "2",
        name: "Session Timeout",
        description: "Automatically log out inactive users after 30 minutes",
        enabled: true,
        category: "authentication",
        level: "basic"
    },
    {
        id: "3",
        name: "IP Whitelist",
        description: "Only allow admin access from approved IP addresses",
        enabled: false,
        category: "access",
        level: "advanced"
    },
    {
        id: "4",
        name: "Failed Login Monitoring",
        description: "Monitor and alert on failed login attempts",
        enabled: true,
        category: "monitoring",
        level: "basic"
    },
    {
        id: "5",
        name: "Suspicious Activity Detection",
        description: "AI-powered detection of unusual user behavior",
        enabled: true,
        category: "monitoring",
        level: "enterprise"
    },
    {
        id: "6",
        name: "Data Encryption at Rest",
        description: "Encrypt sensitive data in the database",
        enabled: true,
        category: "data",
        level: "advanced"
    }
];

export default function SecurityPage() {
    const { currentAccount } = useAccountSwitcher();
    const [securityEvents, setSecurityEvents] =
        useState<SecurityEvent[]>(mockSecurityEvents);
    const [activeSessions, setActiveSessions] =
        useState<ActiveSession[]>(mockActiveSessions);
    const [securitySettings, setSecuritySettings] =
        useState<SecuritySetting[]>(mockSecuritySettings);
    const [selectedTab, setSelectedTab] = useState("overview");
    const [filterSeverity, setFilterSeverity] = useState("all");
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);

    const {
        isOpen: isApiKeyOpen,
        onOpen: onApiKeyOpen,
        onClose: onApiKeyClose
    } = useDisclosure();
    const {
        isOpen: isSessionKillOpen,
        onOpen: onSessionKillOpen,
        onClose: onSessionKillClose
    } = useDisclosure();

    // Security stats
    const statsData = [
        {
            title: "Security Score",
            value: "92%",
            icon: <Shield className="w-6 h-6" />,
            color: "success" as const,
            description: "Overall security rating"
        },
        {
            title: "Active Sessions",
            value: activeSessions.length.toString(),
            icon: <Computer className="w-6 h-6" />,
            color: "primary" as const
        },
        {
            title: "Recent Threats",
            value: securityEvents
                .filter(
                    (e) => e.severity === "high" || e.severity === "critical"
                )
                .length.toString(),
            icon: <Warning className="w-6 h-6" />,
            color: "danger" as const
        },
        {
            title: "2FA Enabled",
            value: "85%",
            icon: <VerifiedUser className="w-6 h-6" />,
            color: "warning" as const
        }
    ];

    function getSeverityColor(severity: string) {
        switch (severity) {
            case "critical":
                return "danger";
            case "high":
                return "danger";
            case "medium":
                return "warning";
            case "low":
                return "success";
            default:
                return "default";
        }
    }

    function getSeverityIcon(severity: string) {
        switch (severity) {
            case "critical":
                return <Error className="w-4 h-4" />;
            case "high":
                return <Warning className="w-4 h-4" />;
            case "medium":
                return <Info className="w-4 h-4" />;
            case "low":
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <Info className="w-4 h-4" />;
        }
    }

    function getEventTypeIcon(type: string) {
        switch (type) {
            case "login":
                return <VpnKey className="w-4 h-4" />;
            case "failed_login":
                return <Block className="w-4 h-4" />;
            case "password_change":
                return <Lock className="w-4 h-4" />;
            case "2fa_enabled":
                return <VerifiedUser className="w-4 h-4" />;
            case "2fa_disabled":
                return <Warning className="w-4 h-4" />;
            case "suspicious_activity":
                return <Error className="w-4 h-4" />;
            case "admin_access":
                return <AdminPanelSettings className="w-4 h-4" />;
            default:
                return <Info className="w-4 h-4" />;
        }
    }

    const generateApiKey = () => {
        const newKey =
            "sk_" +
            Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
        setApiKey(newKey);
    };

    const toggleSecuritySetting = (id: string) => {
        setSecuritySettings((prev) =>
            prev.map((setting) =>
                setting.id === id
                    ? { ...setting, enabled: !setting.enabled }
                    : setting
            )
        );
    };

    const killSession = (sessionId: string) => {
        setActiveSessions((prev) =>
            prev.filter((session) => session.id !== sessionId)
        );
        onSessionKillClose();
    };

    const filteredEvents = securityEvents.filter(
        (event) => filterSeverity === "all" || event.severity === filterSeverity
    );

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Security Center
                            </h1>
                            <p className="text-default-500">
                                Monitor and configure security settings
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                color="primary"
                                startContent={<Key />}
                                onPress={onApiKeyOpen}>
                                API Keys
                            </Button>
                            <Button
                                color="secondary"
                                startContent={<Refresh />}
                                onPress={() => window.location.reload()}>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <StatsGrid
                    stats={statsData}
                    columns={4}
                />

                {/* Security Tabs */}
                <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                    className="w-full">
                    <Tab
                        key="overview"
                        title="Overview">
                        <div className="space-y-6">
                            {/* Security Health */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-success" />
                                        <h3 className="text-lg font-semibold">
                                            Security Health
                                        </h3>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span>Overall Security Score</span>
                                            <div className="flex items-center gap-2">
                                                <Progress
                                                    value={92}
                                                    color="success"
                                                    className="w-32"
                                                />
                                                <span className="text-success font-semibold">
                                                    92%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">
                                                        Authentication
                                                    </span>
                                                    <Chip
                                                        size="sm"
                                                        color="success">
                                                        Strong
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">
                                                        Data Protection
                                                    </span>
                                                    <Chip
                                                        size="sm"
                                                        color="success">
                                                        Enabled
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">
                                                        Access Control
                                                    </span>
                                                    <Chip
                                                        size="sm"
                                                        color="warning">
                                                        Moderate
                                                    </Chip>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">
                                                        Monitoring
                                                    </span>
                                                    <Chip
                                                        size="sm"
                                                        color="success">
                                                        Active
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">
                                                        Incident Response
                                                    </span>
                                                    <Chip
                                                        size="sm"
                                                        color="primary">
                                                        Ready
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">
                                                        Compliance
                                                    </span>
                                                    <Chip
                                                        size="sm"
                                                        color="success">
                                                        Compliant
                                                    </Chip>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Recent Security Events */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Warning className="w-5 h-5 text-warning" />
                                            <h3 className="text-lg font-semibold">
                                                Recent Security Events
                                            </h3>
                                        </div>
                                        <Select
                                            placeholder="Filter by severity"
                                            selectedKeys={[filterSeverity]}
                                            onSelectionChange={(keys) =>
                                                setFilterSeverity(
                                                    Array.from(
                                                        keys
                                                    )[0] as string
                                                )
                                            }
                                            className="w-40"
                                            size="sm">
                                            <SelectItem key="all">
                                                All Severity
                                            </SelectItem>
                                            <SelectItem key="critical">
                                                Critical
                                            </SelectItem>
                                            <SelectItem key="high">
                                                High
                                            </SelectItem>
                                            <SelectItem key="medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem key="low">
                                                Low
                                            </SelectItem>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="space-y-3">
                                        {filteredEvents
                                            .slice(0, 5)
                                            .map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="flex items-center gap-3 p-3 border border-default-200 rounded-lg">
                                                    <div
                                                        className={`flex items-center justify-center w-8 h-8 rounded-full bg-${getSeverityColor(event.severity)}/10`}>
                                                        {getSeverityIcon(
                                                            event.severity
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            {getEventTypeIcon(
                                                                event.type
                                                            )}
                                                            <span className="font-medium">
                                                                {
                                                                    event.description
                                                                }
                                                            </span>
                                                            <Chip
                                                                size="sm"
                                                                color={getSeverityColor(
                                                                    event.severity
                                                                )}
                                                                variant="flat">
                                                                {event.severity}
                                                            </Chip>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-default-500 mt-1">
                                                            <span>
                                                                IP:{" "}
                                                                {
                                                                    event.ipAddress
                                                                }
                                                            </span>
                                                            <span>
                                                                Location:{" "}
                                                                {event.location}
                                                            </span>
                                                            <span>
                                                                {event.timestamp.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </Tab>

                    <Tab
                        key="events"
                        title="Security Events">
                        <Card>
                            <Table aria-label="Security events table">
                                <TableHeader>
                                    <TableColumn>EVENT</TableColumn>
                                    <TableColumn>SEVERITY</TableColumn>
                                    <TableColumn>USER</TableColumn>
                                    <TableColumn>LOCATION</TableColumn>
                                    <TableColumn>TIME</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {filteredEvents.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getEventTypeIcon(
                                                        event.type
                                                    )}
                                                    <div>
                                                        <p className="font-medium">
                                                            {event.description}
                                                        </p>
                                                        <p className="text-sm text-default-500">
                                                            IP:{" "}
                                                            {event.ipAddress}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    color={getSeverityColor(
                                                        event.severity
                                                    )}
                                                    variant="flat"
                                                    startContent={getSeverityIcon(
                                                        event.severity
                                                    )}>
                                                    {event.severity}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                {event.username || "Unknown"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <LocationOn className="w-4 h-4 text-default-400" />
                                                    {event.location}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <AccessTime className="w-4 h-4 text-default-400" />
                                                    {event.timestamp.toLocaleString()}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </Tab>

                    <Tab
                        key="sessions"
                        title="Active Sessions">
                        <Card>
                            <Table aria-label="Active sessions table">
                                <TableHeader>
                                    <TableColumn>USER</TableColumn>
                                    <TableColumn>DEVICE</TableColumn>
                                    <TableColumn>LOCATION</TableColumn>
                                    <TableColumn>LOGIN TIME</TableColumn>
                                    <TableColumn>LAST ACTIVITY</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {activeSessions.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {session.isCurrent ? (
                                                        <CheckCircle className="w-4 h-4 text-success" />
                                                    ) : (
                                                        <Computer className="w-4 h-4 text-default-400" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">
                                                            {session.username}
                                                        </p>
                                                        <p className="text-sm text-default-500">
                                                            ID: {session.userId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {session.device ===
                                                    "Mobile" ? (
                                                        <Smartphone className="w-4 h-4" />
                                                    ) : (
                                                        <Computer className="w-4 h-4" />
                                                    )}
                                                    <div>
                                                        <p>{session.device}</p>
                                                        <p className="text-sm text-default-500">
                                                            {session.browser}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <LocationOn className="w-4 h-4 text-default-400" />
                                                    <div>
                                                        <p>
                                                            {session.location}
                                                        </p>
                                                        <p className="text-sm text-default-500">
                                                            {session.ipAddress}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {session.loginTime.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {session.lastActivity.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {!session.isCurrent && (
                                                    <Button
                                                        size="sm"
                                                        color="danger"
                                                        variant="flat"
                                                        startContent={<Block />}
                                                        onPress={() =>
                                                            killSession(
                                                                session.id
                                                            )
                                                        }>
                                                        Kill Session
                                                    </Button>
                                                )}
                                                {session.isCurrent && (
                                                    <Chip
                                                        size="sm"
                                                        color="success"
                                                        variant="flat">
                                                        Current
                                                    </Chip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </Tab>

                    <Tab
                        key="settings"
                        title="Security Settings">
                        <div className="space-y-6">
                            {[
                                "authentication",
                                "monitoring",
                                "access",
                                "data"
                            ].map((category) => (
                                <Card key={category}>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold capitalize">
                                            {category} Settings
                                        </h3>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-4">
                                            {securitySettings
                                                .filter(
                                                    (setting) =>
                                                        setting.category ===
                                                        category
                                                )
                                                .map((setting) => (
                                                    <div
                                                        key={setting.id}
                                                        className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-medium">
                                                                    {
                                                                        setting.name
                                                                    }
                                                                </h4>
                                                                <Chip
                                                                    size="sm"
                                                                    color={
                                                                        setting.level ===
                                                                        "basic"
                                                                            ? "success"
                                                                            : setting.level ===
                                                                                "advanced"
                                                                              ? "warning"
                                                                              : "danger"
                                                                    }
                                                                    variant="flat">
                                                                    {
                                                                        setting.level
                                                                    }
                                                                </Chip>
                                                            </div>
                                                            <p className="text-sm text-default-500 mt-1">
                                                                {
                                                                    setting.description
                                                                }
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            isSelected={
                                                                setting.enabled
                                                            }
                                                            onValueChange={() =>
                                                                toggleSecuritySetting(
                                                                    setting.id
                                                                )
                                                            }
                                                            color="primary"
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </Tab>
                </Tabs>

                {/* API Key Modal */}
                <Modal
                    isOpen={isApiKeyOpen}
                    onClose={onApiKeyClose}
                    size="2xl">
                    <ModalContent>
                        <ModalHeader>API Key Management</ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Generate New API Key
                                    </h4>
                                    <p className="text-sm text-default-500 mb-4">
                                        API keys are used to authenticate
                                        external applications and services.
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            value={apiKey}
                                            type={
                                                showApiKey ? "text" : "password"
                                            }
                                            placeholder="Click 'Generate' to create a new API key"
                                            readOnly
                                            className="flex-1"
                                            endContent={
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() =>
                                                        setShowApiKey(
                                                            !showApiKey
                                                        )
                                                    }>
                                                    {showApiKey ? (
                                                        <VisibilityOff />
                                                    ) : (
                                                        <Visibility />
                                                    )}
                                                </Button>
                                            }
                                        />
                                        <Button
                                            color="primary"
                                            onPress={generateApiKey}>
                                            Generate
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Existing API Keys
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                                            <div>
                                                <p className="font-medium">
                                                    Production API Key
                                                </p>
                                                <p className="text-sm text-default-500">
                                                    Created on June 1, 2024
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Chip
                                                    size="sm"
                                                    color="success"
                                                    variant="flat">
                                                    Active
                                                </Chip>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat">
                                                    Revoke
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                                            <div>
                                                <p className="font-medium">
                                                    Development API Key
                                                </p>
                                                <p className="text-sm text-default-500">
                                                    Created on May 15, 2024
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Chip
                                                    size="sm"
                                                    color="warning"
                                                    variant="flat">
                                                    Limited
                                                </Chip>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat">
                                                    Revoke
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onApiKeyClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </AdminLayout>
    );
}
