"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Badge,
    Input,
    Tooltip,
    Chip,
    Switch
} from "@heroui/react";
import { motion } from "framer-motion";
import {
    Search,
    Notifications,
    Settings,
    Logout,
    DarkMode,
    LightMode,
    Menu,
    Refresh,
    Help,
    BugReport,
    Feedback,
    AccountCircle,
    Dashboard,
    Security
} from "@mui/icons-material";

interface AdminTopBarProps {
    currentAccount?: any;
    onToggleSidebar?: () => void;
    sidebarCollapsed?: boolean;
    showSearchBar?: boolean;
    onRefresh?: () => void;
    isLoading?: boolean;
    pageTitle?: string;
    pageDescription?: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AdminTopBar({
    currentAccount,
    onToggleSidebar,
    sidebarCollapsed = false,
    showSearchBar = true,
    onRefresh,
    isLoading = false,
    pageTitle,
    pageDescription,
    breadcrumbs = []
}: AdminTopBarProps) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("auth-token");
        router.push("/auth/signin");
    };

    const notificationCount = 5; // This would come from your state/API

    return (
        <div className="w-full">
            {/* Main Navigation Bar */}
            <Navbar
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-divider"
                maxWidth="full"
                height="4rem">
                {/* Left Side */}
                <NavbarBrand className="gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onClick={onToggleSidebar}
                        className="lg:flex">
                        <Menu />
                    </Button>

                    {pageTitle && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden md:block">
                            <h1 className="text-lg font-bold text-foreground">
                                {pageTitle}
                            </h1>
                            {pageDescription && (
                                <p className="text-xs text-foreground-500">
                                    {pageDescription}
                                </p>
                            )}
                        </motion.div>
                    )}
                </NavbarBrand>
                {/* Center - Search Bar */}
                {showSearchBar && (
                    <NavbarContent
                        className="hidden sm:flex"
                        justify="center">
                        <NavbarItem className="w-full max-w-md">
                            <Input
                                placeholder="Search across admin panel..."
                                startContent={
                                    <Search className="text-foreground-400" />
                                }
                                variant="bordered"
                                size="sm"
                                className="w-full"
                                classNames={{
                                    input: "text-sm",
                                    inputWrapper:
                                        "bg-default-50 dark:bg-default-100/50"
                                }}
                            />
                        </NavbarItem>
                    </NavbarContent>
                )}{" "}
                {/* Right Side */}
                <NavbarContent
                    justify="end"
                    className="gap-2">
                    {/* Refresh Button */}
                    {onRefresh && (
                        <NavbarItem>
                            <Tooltip content="Refresh data">
                                <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    onClick={onRefresh}
                                    isLoading={isLoading}>
                                    <Refresh />
                                </Button>
                            </Tooltip>
                        </NavbarItem>
                    )}

                    {/* Notifications */}
                    <NavbarItem>
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm">
                                    <Badge
                                        content={notificationCount}
                                        color="danger"
                                        size="sm"
                                        showOutline={false}>
                                        <Notifications />
                                    </Badge>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Notifications"
                                className="w-80"
                                itemClasses={{
                                    base: "gap-4"
                                }}>
                                <DropdownItem
                                    key="header"
                                    className="h-14 gap-2"
                                    textValue="Notifications">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">
                                            Notifications
                                        </p>
                                        <Chip
                                            size="sm"
                                            color="danger"
                                            variant="flat">
                                            {notificationCount} new
                                        </Chip>
                                    </div>
                                </DropdownItem>
                                <DropdownItem
                                    key="notification1"
                                    textValue="New blog post published">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-medium">
                                            New blog post published
                                        </p>
                                        <p className="text-xs text-foreground-500">
                                            &quot;Getting Started with
                                            Next.js&quot; is now live
                                        </p>
                                    </div>
                                </DropdownItem>
                                <DropdownItem
                                    key="notification2"
                                    textValue="Support ticket created">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-medium">
                                            Support ticket created
                                        </p>
                                        <p className="text-xs text-foreground-500">
                                            User reported login issues
                                        </p>
                                    </div>
                                </DropdownItem>
                                <DropdownItem
                                    key="view-all"
                                    textValue="View all notifications">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        className="w-full"
                                        onClick={() =>
                                            router.push("/admin/notifications")
                                        }>
                                        View All Notifications
                                    </Button>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarItem>

                    {/* Help Menu */}
                    <NavbarItem>
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm">
                                    <Help />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Help">
                                <DropdownItem
                                    key="documentation"
                                    startContent={<Help />}
                                    onClick={() =>
                                        window.open("/docs", "_blank")
                                    }>
                                    Documentation
                                </DropdownItem>
                                <DropdownItem
                                    key="support"
                                    startContent={<Feedback />}
                                    onClick={() =>
                                        router.push("/admin/support")
                                    }>
                                    Contact Support
                                </DropdownItem>
                                <DropdownItem
                                    key="bug-report"
                                    startContent={<BugReport />}
                                    onClick={() =>
                                        router.push("/admin/bug-report")
                                    }>
                                    Report Bug
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarItem>

                    {/* User Menu */}
                    <NavbarItem>
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Avatar
                                    src={
                                        currentAccount?.profileData
                                            ?.profilePicture
                                    }
                                    name={`${currentAccount?.firstName || ""} ${currentAccount?.lastName || ""}`}
                                    size="sm"
                                    className="cursor-pointer transition-transform hover:scale-110"
                                />
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="User Actions"
                                variant="flat"
                                disabledKeys={[]}>
                                <DropdownItem
                                    key="profile"
                                    className="h-14 gap-2"
                                    textValue="Profile">
                                    <div className="flex flex-col">
                                        <p className="font-semibold">
                                            {`${currentAccount?.firstName || ""} ${currentAccount?.lastName || ""}`}
                                        </p>
                                        <p className="text-xs text-foreground-500">
                                            {currentAccount?.email}
                                        </p>
                                    </div>
                                </DropdownItem>
                                <DropdownItem
                                    key="dashboard"
                                    startContent={<Dashboard />}
                                    onClick={() => router.push("/dashboard")}>
                                    User Dashboard
                                </DropdownItem>
                                <DropdownItem
                                    key="account"
                                    startContent={<AccountCircle />}
                                    onClick={() => router.push("/account")}>
                                    Account Settings
                                </DropdownItem>
                                <DropdownItem
                                    key="admin-settings"
                                    startContent={<Settings />}
                                    onClick={() =>
                                        router.push("/admin/settings")
                                    }>
                                    Admin Settings
                                </DropdownItem>
                                <DropdownItem
                                    key="security"
                                    startContent={<Security />}
                                    onClick={() =>
                                        router.push("/admin/security")
                                    }>
                                    Security
                                </DropdownItem>
                                <DropdownItem
                                    key="logout"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Logout />}
                                    onClick={handleLogout}>
                                    Sign Out
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarItem>
                </NavbarContent>
            </Navbar>

            {/* Breadcrumbs Bar (if breadcrumbs provided) */}
            {breadcrumbs.length > 0 && (
                <div className="bg-default-50 dark:bg-default-100/20 border-b border-divider px-6 py-2">
                    <div className="flex items-center gap-2 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && (
                                    <span className="text-foreground-400">
                                        /
                                    </span>
                                )}
                                {crumb.href ? (
                                    <Button
                                        variant="light"
                                        size="sm"
                                        className="h-auto p-1 min-w-auto font-normal"
                                        onClick={() =>
                                            router.push(crumb.href!)
                                        }>
                                        {crumb.label}
                                    </Button>
                                ) : (
                                    <span className="text-foreground-500 px-1">
                                        {crumb.label}
                                    </span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
