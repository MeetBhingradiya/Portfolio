"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Card,
    CardBody,
    Button,
    Divider,
    Avatar,
    Chip,
    Tooltip
} from "@heroui/react";
import { motion } from "motion/react";
import {
    Home,
    Article,
    ContactSupport,
    Analytics,
    Settings,
    People,
    Security,
    Dashboard,
    Notifications,
    Storage,
    Code,
    BugReport,
    EventNote,
    Assignment,
    CloudUpload,
    AdminPanelSettings
} from "@mui/icons-material";

interface NavigationItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string | number;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    description?: string;
}

interface NavigationGroup {
    title: string;
    items: NavigationItem[];
}

interface AdminSidebarProps {
    currentAccount?: any;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

const navigationGroups: NavigationGroup[] = [
    {
        title: "Dashboard",
        items: [
            {
                label: "Overview",
                href: "/admin",
                icon: <Dashboard />,
                description: "Main dashboard overview"
            },
            {
                label: "Analytics",
                href: "/admin/analytics",
                icon: <Analytics />,
                description: "Site analytics and insights"
            }
        ]
    },
    {
        title: "Content Management",
        items: [
            {
                label: "Blog Posts",
                href: "/admin/blog",
                icon: <Article />,
                badge: "12",
                color: "primary",
                description: "Manage blog posts and articles"
            },
            {
                label: "Projects",
                href: "/admin/projects",
                icon: <Code />,
                description: "Manage portfolio projects"
            },
            {
                label: "Media Library",
                href: "/admin/media",
                icon: <CloudUpload />,
                description: "Upload and manage media files"
            }
        ]
    },
    {
        title: "User Management",
        items: [
            {
                label: "Users",
                href: "/admin/users",
                icon: <People />,
                description: "Manage user accounts"
            },
            {
                label: "Support Tickets",
                href: "/admin/tickets",
                icon: <ContactSupport />,
                badge: "3",
                color: "danger",
                description: "Customer support tickets"
            },
            {
                label: "Notifications",
                href: "/admin/notifications",
                icon: <Notifications />,
                badge: "8",
                color: "warning",
                description: "System notifications"
            }
        ]
    },
    {
        title: "System",
        items: [
            {
                label: "Settings",
                href: "/admin/settings",
                icon: <Settings />,
                description: "System configuration"
            },
            {
                label: "Security",
                href: "/admin/security",
                icon: <Security />,
                description: "Security settings and logs"
            },
            {
                label: "Database",
                href: "/admin/database",
                icon: <Storage />,
                description: "Database management"
            },
            {
                label: "Logs",
                href: "/admin/logs",
                icon: <BugReport />,
                description: "System logs and debugging"
            }
        ]
    }
];

export default function AdminSidebar({
    currentAccount,
    collapsed = false,
    onToggleCollapse
}: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isActiveRoute = (href: string) => {
        if (href === "/admin") {
            return pathname === "/admin";
        }
        return pathname.startsWith(href);
    };

    return (
        <motion.div
            className={`h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-divider transition-all duration-300 ${
                collapsed ? "w-16" : "w-72"
            }`}
            initial={false}
            animate={{ width: collapsed ? 64 : 288 }}>
            <div className="p-4 h-full flex flex-col">
                {/* Admin Header */}
                <div className="mb-6">
                    <motion.div
                        className="flex items-center gap-3"
                        animate={{
                            justifyContent: collapsed ? "center" : "flex-start"
                        }}>
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <AdminPanelSettings className="text-white text-lg" />
                        </div>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}>
                                <h1 className="text-lg font-bold text-foreground">
                                    Admin Panel
                                </h1>
                                <p className="text-xs text-foreground-500">
                                    Content Management
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* User Info */}
                {currentAccount && (
                    <Card className="mb-6 shadow-small">
                        <CardBody className="p-3">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={
                                        currentAccount.profileData
                                            ?.profilePicture
                                    }
                                    name={`${currentAccount.firstName} ${currentAccount.lastName}`}
                                    size="sm"
                                    className="flex-shrink-0"
                                />
                                {!collapsed && (
                                    <motion.div
                                        className="flex-1 min-w-0"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}>
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {`${currentAccount.firstName} ${currentAccount.lastName}`}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Chip
                                                size="sm"
                                                color="success"
                                                variant="flat"
                                                className="text-xs">
                                                Admin
                                            </Chip>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto space-y-6">
                    {navigationGroups.map((group, groupIndex) => (
                        <motion.div
                            key={group.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIndex * 0.1 }}>
                            {!collapsed && (
                                <h3 className="text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-3 px-2">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item, itemIndex) => {
                                    const isActive = isActiveRoute(item.href);

                                    const button = (
                                        <Button
                                            key={item.href}
                                            variant={
                                                isActive ? "flat" : "light"
                                            }
                                            color={
                                                isActive ? "primary" : "default"
                                            }
                                            className={`w-full ${
                                                collapsed
                                                    ? "px-2"
                                                    : "justify-start px-4"
                                            } h-12 transition-all duration-200 ${
                                                isActive
                                                    ? "bg-primary-50 dark:bg-primary-900/20 border-l-3 border-primary-500"
                                                    : "hover:bg-default-100 dark:hover:bg-default-50"
                                            }`}
                                            startContent={
                                                !collapsed ? (
                                                    <div className="text-lg">
                                                        {item.icon}
                                                    </div>
                                                ) : (
                                                    <div className="text-lg">
                                                        {item.icon}
                                                    </div>
                                                )
                                            }
                                            endContent={
                                                !collapsed && item.badge ? (
                                                    <Chip
                                                        size="sm"
                                                        color={
                                                            item.color ||
                                                            "default"
                                                        }
                                                        variant="solid"
                                                        className="text-xs min-w-unit-5 h-5">
                                                        {item.badge}
                                                    </Chip>
                                                ) : null
                                            }
                                            onClick={() =>
                                                router.push(item.href)
                                            }>
                                            {!collapsed && (
                                                <span className="flex-1 text-left">
                                                    {item.label}
                                                </span>
                                            )}
                                        </Button>
                                    );

                                    return collapsed ? (
                                        <Tooltip
                                            key={item.href}
                                            content={
                                                <div>
                                                    <p className="font-semibold">
                                                        {item.label}
                                                    </p>
                                                    {item.description && (
                                                        <p className="text-xs text-foreground-500">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            }
                                            placement="right"
                                            delay={0}
                                            closeDelay={0}>
                                            {button}
                                        </Tooltip>
                                    ) : (
                                        button
                                    );
                                })}
                            </div>
                            {groupIndex < navigationGroups.length - 1 && (
                                <Divider className="my-4" />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Back to Dashboard */}
                <div className="mt-auto pt-4">
                    <Divider className="mb-4" />
                    <Button
                        variant="light"
                        color="default"
                        className={`w-full ${collapsed ? "px-2" : "justify-start px-4"} h-12`}
                        startContent={<Home className="text-lg" />}
                        onClick={() => router.push("/dashboard")}>
                        {!collapsed && "Back to Dashboard"}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
