"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
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
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Pagination
} from "@heroui/react";
import {
    Search,
    Add,
    Edit,
    Delete,
    MoreVert,
    Person,
    Email,
    AdminPanelSettings,
    Block,
    CheckCircle,
    Warning
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "../../../Hooks/useAccountSwitcher";
import AdminLayout from "../../../Components/Admin/Layout/AdminLayout";
import StatsGrid from "../../../Components/Admin/Widgets/StatsGrid";

interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "moderator";
    status: "active" | "suspended" | "pending";
    avatar?: string;
    joinDate: string;
    lastActivity: string;
}

export default function UsersAdminPage() {
    const router = useRouter();
    const { currentAccount } = useAccountSwitcher();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [users, setUsers] = useState<User[]>([
        {
            id: "1",
            name: "John Doe",
            email: "john.doe@example.com",
            role: "user",
            status: "active",
            joinDate: "2024-01-15",
            lastActivity: "2 hours ago"
        },
        {
            id: "2",
            name: "Jane Smith",
            email: "jane.smith@example.com",
            role: "moderator",
            status: "active",
            joinDate: "2024-02-20",
            lastActivity: "1 day ago"
        },
        {
            id: "3",
            name: "Mike Johnson",
            email: "mike.johnson@example.com",
            role: "user",
            status: "suspended",
            joinDate: "2024-03-10",
            lastActivity: "1 week ago"
        }
    ]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const statsData = [
        {
            title: "Total Users",
            value: "2,547",
            icon: <Person className="text-xl" />,
            color: "primary" as const,
            change: {
                value: "+12%",
                type: "increase" as const,
                period: "last month"
            }
        },
        {
            title: "Active Users",
            value: "2,234",
            icon: <CheckCircle className="text-xl" />,
            color: "success" as const,
            change: {
                value: "+8%",
                type: "increase" as const,
                period: "last month"
            }
        },
        {
            title: "Suspended",
            value: "45",
            icon: <Block className="text-xl" />,
            color: "danger" as const
        },
        {
            title: "Pending Review",
            value: "268",
            icon: <Warning className="text-xl" />,
            color: "warning" as const
        }
    ];

    const getRoleColor = (role: string) => {
        switch (role) {
            case "admin":
                return "danger";
            case "moderator":
                return "warning";
            default:
                return "primary";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "success";
            case "suspended":
                return "danger";
            case "pending":
                return "warning";
            default:
                return "default";
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === "all" || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <AdminLayout
            currentAccount={currentAccount}
            pageTitle="User Management"
            pageDescription="Manage user accounts and permissions"
            breadcrumbs={[
                { label: "Admin", href: "/admin" },
                { label: "Users" }
            ]}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            User Management
                        </h1>
                        <p className="text-foreground-500 mt-1">
                            Manage user accounts, roles, and permissions
                        </p>
                    </div>

                    <Button
                        color="primary"
                        startContent={<Add />}
                        onPress={onOpen}>
                        Add User
                    </Button>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}>
                    <StatsGrid
                        stats={statsData}
                        columns={4}
                    />
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}>
                    <Card>
                        <CardBody>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Input
                                    placeholder="Search users..."
                                    startContent={<Search />}
                                    value={searchTerm}
                                    onValueChange={setSearchTerm}
                                    className="sm:max-w-xs"
                                />
                                <Select
                                    placeholder="Filter by status"
                                    selectedKeys={[statusFilter]}
                                    onSelectionChange={(keys) =>
                                        setStatusFilter(
                                            Array.from(keys)[0] as string
                                        )
                                    }
                                    className="sm:max-w-xs">
                                    <SelectItem key="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem key="active">Active</SelectItem>
                                    <SelectItem key="suspended">
                                        Suspended
                                    </SelectItem>
                                    <SelectItem key="pending">
                                        Pending
                                    </SelectItem>
                                </Select>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}>
                    <Card>
                        <CardBody className="p-0">
                            <Table aria-label="Users table">
                                <TableHeader>
                                    <TableColumn>User</TableColumn>
                                    <TableColumn>Role</TableColumn>
                                    <TableColumn>Status</TableColumn>
                                    <TableColumn>Join Date</TableColumn>
                                    <TableColumn>Last Activity</TableColumn>
                                    <TableColumn>Actions</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={user.avatar}
                                                        name={user.name}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="font-medium">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-sm text-foreground-500">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={
                                                        getRoleColor(
                                                            user.role
                                                        ) as any
                                                    }
                                                    variant="flat"
                                                    size="sm">
                                                    {user.role
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        user.role.slice(1)}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={
                                                        getStatusColor(
                                                            user.status
                                                        ) as any
                                                    }
                                                    variant="flat"
                                                    size="sm">
                                                    {user.status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        user.status.slice(1)}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    user.joinDate
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-foreground-500">
                                                {user.lastActivity}
                                            </TableCell>
                                            <TableCell>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button
                                                            isIconOnly
                                                            variant="light"
                                                            size="sm">
                                                            <MoreVert />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu>
                                                        <DropdownItem
                                                            key={"user-edit"}
                                                            startContent={
                                                                <Edit />
                                                            }>
                                                            Edit User
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key={
                                                                "user-change-role"
                                                            }
                                                            startContent={
                                                                <AdminPanelSettings />
                                                            }>
                                                            Change Role
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key={"user-suspend"}
                                                            startContent={
                                                                <Block />
                                                            }
                                                            className="text-warning">
                                                            Suspend User
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key={"user-delete"}
                                                            startContent={
                                                                <Delete />
                                                            }
                                                            className="text-danger">
                                                            Delete User
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-center p-4">
                                <Pagination
                                    total={10}
                                    initialPage={1}
                                />
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Add User Modal */}
                <Modal
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>Add New User</ModalHeader>
                                <ModalBody>
                                    <div className="space-y-4">
                                        <Input
                                            label="Full Name"
                                            placeholder="Enter user's full name"
                                            isRequired
                                        />
                                        <Input
                                            label="Email Address"
                                            placeholder="Enter email address"
                                            type="email"
                                            isRequired
                                        />
                                        <Select
                                            label="Role"
                                            placeholder="Select user role"
                                            isRequired>
                                            <SelectItem key="user">
                                                User
                                            </SelectItem>
                                            <SelectItem key="moderator">
                                                Moderator
                                            </SelectItem>
                                            <SelectItem key="admin">
                                                Admin
                                            </SelectItem>
                                        </Select>
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
                                        onPress={onClose}>
                                        Add User
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
