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
	Divider,
	Spinner,
} from "@heroui/react";
import {
	Person,
	Add,
	ExitToApp,
	AdminPanelSettings,
	Verified,
	AccountCircle,
	Settings,
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
	onAccountChange,
}: AccountSwitcherProps) {
	const { accounts, currentAccount, switchAccount, removeAccount } =
		useAccountSwitcher();
	const router = useRouter();
	const [isLoading, setIsLoading] = React.useState(false);

	const handleAccountSwitch = async (account: Account) => {
		setIsLoading(true);
		try {
			switchAccount(account);
			onAccountChange?.(account);
			// Small delay to show loading state
			await new Promise(resolve => setTimeout(resolve, 500));
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
		if (currentAccount) {
			removeAccount(currentAccount.userID);
			router.push("/auth/signin");
		}
	};

	// Don't render if compact mode and no accounts
	if (variant === "compact" && !currentAccount && accounts.length === 0) {
		return null;
	}

	// Get other accounts
	const otherAccounts = accounts.filter(
		(acc) => acc.userID !== currentAccount?.userID
	);

	return (
		<Dropdown placement="bottom-end">
			<DropdownTrigger>
				<Button
					variant="bordered"
					className="gap-2 min-w-fit"
					startContent={
						isLoading ? (
							<Spinner size="sm" />
						) : currentAccount ? (
							<Avatar
								size="sm"
								name={`${currentAccount.firstName} ${currentAccount.lastName}`}
								className="w-6 h-6"
								isBordered
								color="primary"
							/>
						) : (
							<Person className="w-4 h-4" />
						)
					}
					isLoading={isLoading}
				>
					{currentAccount
						? `${currentAccount.firstName} ${currentAccount.lastName}`
						: "Select Account"}
				</Button>
			</DropdownTrigger>
					<DropdownMenu
				aria-label="Account switcher"
				className="w-80"
				disallowEmptySelection
			>
				{[
					// Current Account Header
					...(currentAccount ? [
						<DropdownItem
							key="current-header"
							className="h-16 gap-3 cursor-default"
							textValue={`Current: ${currentAccount.username}`}
							isReadOnly
						>
							<div className="flex items-center gap-3 w-full">
								<Avatar
									name={`${currentAccount.firstName} ${currentAccount.lastName}`}
									size="md"
									isBordered
									color="primary"
								/>
								<div className="flex flex-col flex-1">
									<span className="text-small font-semibold">
										{currentAccount.firstName} {currentAccount.lastName}
									</span>
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-tiny text-default-500">
											@{currentAccount.username}
										</span>
										{currentAccount.profileData?.isAdmin && (
											<Chip
												size="sm"
												color="warning"
												variant="flat"
												startContent={<AdminPanelSettings className="w-3 h-3" />}
											>
												Admin
											</Chip>
										)}
										{currentAccount.profileData?.isEmailVerified && (
											<Verified className="w-3 h-3 text-success" />
										)}
									</div>
									<span className="text-tiny text-default-400">
										{currentAccount.email}
									</span>
								</div>
							</div>
						</DropdownItem>
					] : []),

					// Account Management
					...(currentAccount ? [
						<DropdownItem
							key="manage-account"
							startContent={<Settings className="w-4 h-4" />}
							onPress={handleManageAccount}
						>
							Manage Account
						</DropdownItem>
					] : []),

					// Other Accounts Section
					...(otherAccounts.length > 0 ? [
						<DropdownItem
							key="switch-header"
							className="text-tiny text-default-500 cursor-default"
							textValue="Switch Account"
							isReadOnly
						>
							Switch Account
						</DropdownItem>
					] : []),

					// Render Other Accounts
					...otherAccounts.map((account) => (
						<DropdownItem
							key={`account-${account.userID}`}
							className="h-12 gap-3"
							textValue={`Switch to ${account.username}`}
							onPress={() => handleAccountSwitch(account)}
						>
							<div className="flex items-center gap-3 w-full">
								<Avatar
									name={`${account.firstName} ${account.lastName}`}
									size="sm"
								/>
								<div className="flex flex-col flex-1">
									<span className="text-small">
										{account.firstName} {account.lastName}
									</span>
									<div className="flex items-center gap-2">
										<span className="text-tiny text-default-500">
											@{account.username}
										</span>
										{account.profileData?.isAdmin && (
											<AdminPanelSettings className="w-3 h-3 text-warning" />
										)}
										{account.profileData?.isEmailVerified && (
											<Verified className="w-3 h-3 text-success" />
										)}
									</div>
								</div>
							</div>
						</DropdownItem>
					)),

					// Add Account
					...(showAddAccount ? [
						<DropdownItem
							key="add-account"
							startContent={<Add className="w-4 h-4" />}
							onPress={handleAddAccount}
							className="text-primary"
						>
							Add Another Account
						</DropdownItem>
					] : []),

					// Sign Out
					...(currentAccount ? [
						<DropdownItem
							key="logout"
							color="danger"
							startContent={<ExitToApp className="w-4 h-4" />}
							onPress={handleSignOut}
						>
							Sign Out
						</DropdownItem>
					] : []),

					// Fallback when no account
					...(!currentAccount ? [
						<DropdownItem
							key="no-account"
							startContent={<AccountCircle className="w-4 h-4" />}
							onPress={handleAddAccount}
						>
							Sign In to Your Account
						</DropdownItem>
					] : [])
				]}
			</DropdownMenu>
		</Dropdown>
	);
}