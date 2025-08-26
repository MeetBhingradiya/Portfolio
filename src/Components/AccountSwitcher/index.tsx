"use client";

import React from "react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Button,
    Chip,
    Spinner
} from "@heroui/react";
import {
    Person,
    Add,
    ExitToApp,
    AdminPanelSettings,
    Verified,
    AccountCircle,
    Settings
} from "@mui/icons-material";
import { useAccountSwitcher, Account } from "@Hooks/useAccountSwitcher";
import { useRouter } from "next/navigation";

interface AccountSwitcherProps {
    variant?: "full" | "compact";
    showAddAccount?: boolean;
    onAccountChange?: (account: Account) => void;
}

export function AccountSwitcher({
    variant = "full",
    showAddAccount = true,
    onAccountChange
}: AccountSwitcherProps) {
    const {
        accounts,
        activeAccount,
        switchAccount,
        removeAccount,
        isLoading: hookIsLoading
    } = useAccountSwitcher();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    // Handle keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle when Alt + number is pressed and we have accounts
            if (event.altKey && accounts.length > 0) {
                const num = parseInt(event.key);
                if (num >= 1 && num <= Math.min(accounts.length, 9)) {
                    event.preventDefault();
                    const targetIndex = num - 1;
                    if (targetIndex < accounts.length) {
                        handleAccountSwitch(accounts[targetIndex]);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [accounts]);

    const handleAccountSwitch = async (account: Account) => {
        setIsLoading(true);
        try {
            await switchAccount(account.id);
            onAccountChange?.(account);
            // Small delay to show loading state
            await new Promise((resolve) => setTimeout(resolve, 500));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAccount = () => {
        router.push("/auth/signin?acs=1");
    };

    const handleManageAccount = () => {
        router.push("/dashboard");
    };

    const handleSignOut = () => {
        if (activeAccount) {
            removeAccount(activeAccount.id);
            router.push("/auth/signin");
        }
    };

    // Don't render if compact mode and no accounts
    if (variant === "compact" && !activeAccount && accounts.length === 0) {
        return null;
    }

    // Get other accounts (for single-user NextAuth, this will typically be empty)
    const otherAccounts = accounts.filter(
        (acc: Account) => acc.id !== activeAccount?.id
    );

    // Create all dropdown items as an array to avoid conditional rendering type issues
    const menuItems = [];

    // Current account header
    menuItems.push(
        <DropdownItem
            key="current-header"
            className={
                activeAccount ? "h-16 gap-3 cursor-default" : "h-12 gap-3"
            }
            textValue={
                activeAccount
                    ? `Current: ${activeAccount.Username}`
                    : "Sign In to Your Account"
            }
            onPress={activeAccount ? undefined : handleAddAccount}
            startContent={
                activeAccount ? undefined : (
                    <AccountCircle className="w-4 h-4" />
                )
            }
            isReadOnly={activeAccount ? true : false}>
            {activeAccount ? (
                <div className="flex items-center gap-3 w-full">
                    <Avatar
                        name={`${activeAccount.FName} ${activeAccount.LName}`}
                        size="md"
                        isBordered
                        color="primary"
                    />
                    <div className="flex flex-col flex-1">
                        <span className="text-small font-semibold">
                            {activeAccount.FName} {activeAccount.LName}
                        </span>
                        <span className="text-tiny text-default-500">
                            @{activeAccount.Username}
                        </span>
                        <div className="flex gap-1 mt-1">
                            {activeAccount.isAdmin && (
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color="warning"
                                    startContent={
                                        <AdminPanelSettings className="w-3 h-3" />
                                    }>
                                    Admin
                                </Chip>
                            )}
                            {activeAccount.isVerified_forCurrentSession && (
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color="success"
                                    startContent={
                                        <Verified className="w-3 h-3" />
                                    }>
                                    Verified
                                </Chip>
                            )}
                        </div>
                        <span className="text-tiny text-default-400">
                            {activeAccount.PrimaryEmail}
                        </span>
                    </div>
                </div>
            ) : (
                <span>Sign In to Your Account</span>
            )}
        </DropdownItem>
    );

    // Account settings
    if (activeAccount) {
        menuItems.push(
            <DropdownItem
                key="profile"
                onPress={handleManageAccount}
                startContent={<Settings className="w-4 h-4" />}>
                Account Settings
            </DropdownItem>
        );
    }

    // Switch accounts section
    if (activeAccount && otherAccounts.length > 0) {
        menuItems.push(
            <DropdownItem
                key="divider"
                className="p-0 opacity-0 cursor-default h-1"
                isReadOnly
                textValue="divider">
                <div className="h-px bg-divider mx-1" />
            </DropdownItem>
        );

        menuItems.push(
            <DropdownItem
                key="switch-header"
                className="text-tiny text-default-500 opacity-60 cursor-default"
                isReadOnly
                textValue="Switch Accounts">
                Switch Accounts
            </DropdownItem>
        );

        otherAccounts.forEach((account: Account) => {
            const actualIndex = accounts.findIndex(
                (acc) => acc.id === account.id
            );
            const displayIndex = actualIndex + 1;

            menuItems.push(
                <DropdownItem
                    key={`account-${account.id}`}
                    onPress={() => handleAccountSwitch(account)}
                    className="gap-3"
                    description={
                        <div className="flex items-center gap-1">
                            <span className="text-tiny text-default-500">
                                @{account.Username}
                            </span>
                            {account.isAdmin && (
                                <AdminPanelSettings className="w-3 h-3 text-warning" />
                            )}
                            {account.isVerified_forCurrentSession && (
                                <Verified className="w-3 h-3 text-success" />
                            )}
                        </div>
                    }
                    textValue={`${account.FName} ${account.LName}`}
                    startContent={
                        <Avatar
                            name={`${account.FName} ${account.LName}`}
                            size="sm"
                            isBordered
                        />
                    }
                    endContent={
                        <div className="flex items-center gap-1">
                            <Chip
                                size="sm"
                                variant="flat"
                                color="primary">
                                Alt+{displayIndex}
                            </Chip>
                        </div>
                    }>
                    <div className="flex flex-col">
                        <span className="text-small">
                            {account.FName} {account.LName}
                        </span>
                    </div>
                </DropdownItem>
            );
        });
    }

    // Add account section
    if (showAddAccount && activeAccount) {
        menuItems.push(
            <DropdownItem
                key="divider-add"
                className="p-0 opacity-0 cursor-default h-1"
                isReadOnly
                textValue="divider">
                <div className="h-px bg-divider mx-1" />
            </DropdownItem>
        );

        menuItems.push(
            <DropdownItem
                key="add"
                onPress={handleAddAccount}
                startContent={<Add className="w-4 h-4" />}>
                Add Account
            </DropdownItem>
        );
    }

    // Sign out section
    if (activeAccount) {
        menuItems.push(
            <DropdownItem
                key="divider-signout"
                className="p-0 opacity-0 cursor-default h-1"
                isReadOnly
                textValue="divider">
                <div className="h-px bg-divider mx-1" />
            </DropdownItem>
        );

        menuItems.push(
            <DropdownItem
                key="signout"
                color="danger"
                onPress={handleSignOut}
                startContent={<ExitToApp className="w-4 h-4" />}>
                Sign Out
            </DropdownItem>
        );
    }

    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger>
                <Button
                    variant="bordered"
                    className="gap-2 min-w-fit"
                    startContent={
                        isLoading ? (
                            <Spinner size="sm" />
                        ) : activeAccount ? (
                            <Avatar
                                size="sm"
                                name={`${activeAccount.FName} ${activeAccount.LName}`}
                                className="w-6 h-6"
                                isBordered
                                color="primary"
                            />
                        ) : (
                            <Person className="w-4 h-4" />
                        )
                    }
                    isLoading={isLoading}>
                    {activeAccount
                        ? `${activeAccount.FName} ${activeAccount.LName}`
                        : "Select Account"}
                </Button>
            </DropdownTrigger>

            <DropdownMenu
                aria-label="Account switcher"
                className="w-80"
                disallowEmptySelection>
                {menuItems}
            </DropdownMenu>
        </Dropdown>
    );
}
