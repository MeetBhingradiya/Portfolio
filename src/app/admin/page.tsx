"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Progress,
    Chip,
    Avatar,
    Divider
} from "@heroui/react";
import {
    Dashboard,
    Article,
    People,
    TrendingUp,
    Schedule,
    Notifications,
    Security,
    Analytics,
    Storage,
    CloudUpload,
    BugReport,
    CheckCircle,
    Warning,
    Error as ErrorIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import AdminLayout from "@Components/Admin/Layout/AdminLayout";
import StatsGrid from "@Components/Admin/Widgets/StatsGrid";

interface QuickAction {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: "primary" | "secondary" | "success" | "warning" | "danger";
    badge?: string;
}

interface RecentActivity {
    id: string;
    type: "blog" | "user" | "ticket" | "system";
    title: string;
    description: string;
    timestamp: string;
    user?: {
        name: string;
        avatar?: string;
    };
}

export default function AdminDashboard() {
    const router = useRouter();
    const { currentAccount } = useAccountSwitcher();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const quickActions: QuickAction[] = [
        {
            title: "Create Blog Post",
            description: "Write and publish new content",
            icon: <Article />,
            href: "/admin/blog/create",
            color: "primary"
        },
        {
            title: "Manage Users",
            description: "View and manage user accounts",
            icon: <People />,
            href: "/admin/users",
            color: "secondary"
        },
        {
            title: "Support Tickets",
            description: "Handle customer support",
            icon: <Notifications />,
            href: "/admin/tickets",
            color: "warning",
            badge: "5"
        },
        {
            title: "Analytics",
            description: "View site performance metrics",
            icon: <Analytics />,
            href: "/admin/analytics",
            color: "success"
        },
        {
            title: "Media Library",
            description: "Upload and organize files",
            icon: <CloudUpload />,
            href: "/admin/media",
            color: "primary"
        },
        {
            title: "System Settings",
            description: "Configure application settings",
            icon: <Security />,
            href: "/admin/settings",
            color: "danger"
        }
    ];

    const recentActivities: RecentActivity[] = [
        {
            id: "1",
            type: "blog",
            title: "New blog post published",
            description: "Getting Started with Next.js 15",
            timestamp: "2 minutes ago",
            user: {
                name: "Meet Bhingradiya"
            }
        },
        {
            id: "2",
            type: "user",
            title: "New user registration",
            description: "john.doe@example.com joined the platform",
            timestamp: "15 minutes ago"
        },
        {
            id: "3",
            type: "ticket",
            title: "Support ticket resolved",
            description: "Login issue fixed for user #1234",
            timestamp: "1 hour ago",
            user: {
                name: "Support Team"
            }
        },
        {
            id: "4",
            type: "system",
            title: "Database backup completed",
            description: "Scheduled backup completed successfully",
            timestamp: "2 hours ago"
        }
    ];

    const statsData = [
        {
            title: "Total Users",
            value: "2,547",
            icon: <People className="text-xl" />,
            color: "primary" as const,
            change: {
                value: "+12%",
                type: "increase" as const,
                period: "last month"
            }
        },
        {
            title: "Published Posts",
            value: "89",
            icon: <Article className="text-xl" />,
            color: "success" as const,
            change: {
                value: "+8%",
                type: "increase" as const,
                period: "last month"
            }
        },
        {
            title: "Page Views",
            value: "156.2K",
            icon: <TrendingUp className="text-xl" />,
            color: "secondary" as const,
            change: {
                value: "+25%",
                type: "increase" as const,
                period: "last month"
            }
        },
        {
            title: "Storage Used",
            value: "68%",
            icon: <Storage className="text-xl" />,
            color: "warning" as const,
            description: "34.2 GB of 50 GB"
        }
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "blog":
                return <Article className="text-primary" />;
            case "user":
                return <People className="text-secondary" />;
            case "ticket":
                return <Notifications className="text-warning" />;
            case "system":
                return <Security className="text-success" />;
            default:
                return <Dashboard className="text-default" />;
        }
    };

    return (
        <AdminLayout
            currentAccount={currentAccount}
            pageTitle="Dashboard"
            pageDescription="Admin panel overview and quick actions"
            breadcrumbs={[{ label: "Dashboard" }]}>
            <div className="p-6 space-y-6">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome back, {currentAccount?.FName}! 👋
                        </h1>
                        <p className="text-foreground-500">
                            Here&apos;s what&apos;s happening with your platform
                            today.
                        </p>
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}>
                    <StatsGrid
                        stats={statsData}
                        columns={4}
                    />
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <h2 className="text-xl font-semibold text-foreground">
                                Quick Actions
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {quickActions.map((action, index) => (
                                    <motion.div
                                        key={action.title}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.3 + index * 0.1
                                        }}
                                        whileHover={{ scale: 1.02 }}>
                                        <Card
                                            isPressable
                                            onPress={() =>
                                                router.push(action.href)
                                            }
                                            className="h-full hover:shadow-md transition-all duration-200">
                                            <CardBody className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`p-2 rounded-lg bg-${action.color}/10 text-${action.color}`}>
                                                        {action.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-foreground text-sm">
                                                                {action.title}
                                                            </h3>
                                                            {action.badge && (
                                                                <Chip
                                                                    size="sm"
                                                                    color={
                                                                        action.color
                                                                    }
                                                                    variant="flat">
                                                                    {
                                                                        action.badge
                                                                    }
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-foreground-500">
                                                            {action.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <h2 className="text-xl font-semibold text-foreground">
                                Recent Activity
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => (
                                    <div key={activity.id}>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-foreground text-sm mb-1">
                                                    {activity.title}
                                                </h4>
                                                <p className="text-xs text-foreground-500 mb-2">
                                                    {activity.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {activity.user && (
                                                        <>
                                                            <Avatar
                                                                size="sm"
                                                                name={
                                                                    activity
                                                                        .user
                                                                        .name
                                                                }
                                                                src={
                                                                    activity
                                                                        .user
                                                                        .avatar
                                                                }
                                                                className="w-4 h-4 text-xs"
                                                            />
                                                            <span className="text-xs text-foreground-400">
                                                                {
                                                                    activity
                                                                        .user
                                                                        .name
                                                                }
                                                            </span>
                                                            <span className="text-xs text-foreground-300">
                                                                •
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-xs text-foreground-400">
                                                        {activity.timestamp}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {index <
                                            recentActivities.length - 1 && (
                                            <Divider className="my-3" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-divider">
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="w-full"
                                    onClick={() =>
                                        router.push("/admin/activity")
                                    }>
                                    View All Activity
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* System Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <h2 className="text-xl font-semibold text-foreground">
                                System Status
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="text-success text-sm" />
                                        <span className="text-sm text-foreground">
                                            All systems operational
                                        </span>
                                    </div>
                                    <Chip
                                        color="success"
                                        variant="flat"
                                        size="sm">
                                        Healthy
                                    </Chip>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-foreground-500">
                                            Server Performance
                                        </span>
                                        <span className="text-sm text-foreground">
                                            98%
                                        </span>
                                    </div>
                                    <Progress
                                        value={98}
                                        color="success"
                                        size="sm"
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-foreground-500">
                                            Database Health
                                        </span>
                                        <span className="text-sm text-foreground">
                                            95%
                                        </span>
                                    </div>
                                    <Progress
                                        value={95}
                                        color="success"
                                        size="sm"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
