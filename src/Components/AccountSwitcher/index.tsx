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
} from "@heroui/react";
import {
	Person,
	Add,
	ExitToApp,
	AdminPanelSettings,
	Verified,
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

	const handleAccountSwitch = (account: Account) => {
		switchAccount(account);
		onAccountChange?.(account);
	};

	const handleAddAccount = () => {
		router.push("/auth/signin?acs=1");
	};

	if (variant === "compact" && accounts.length === 0) {
		return null;
	}

	return (
		<Dropdown placement="bottom-end">
			<DropdownTrigger>
				<Button
					variant="bordered"
					className="gap-2"
					startContent={
						currentAccount ? (
							<Avatar
								size="sm"
								name={`${currentAccount.firstName} ${currentAccount.lastName}`}
								className="w-6 h-6"
							/>
						) : (
							<Person className="w-4 h-4" />
						)
					}
				>
					{currentAccount
						? `${currentAccount.firstName} ${currentAccount.lastName}`
						: "Select Account"}
				</Button>
			</DropdownTrigger>{" "}
			<DropdownMenu
				aria-label="Account switcher"
				className="w-80"
			>
				{(() => {
					const items = [];

					// Current account header
					if (currentAccount) {
						items.push(
							<DropdownItem
								key="current-header"
								className="h-14 gap-2"
								textValue={`Current: ${currentAccount.username}`}
							>
								<div className="flex items-center gap-3">
									<Avatar
										name={`${currentAccount.firstName} ${currentAccount.lastName}`}
										size="sm"
									/>
									<div className="flex flex-col">
										<span className="text-small font-semibold">
											{currentAccount.firstName}{" "}
											{currentAccount.lastName}
										</span>
										<div className="flex items-center gap-2">
											<span className="text-tiny text-default-500">
												@{currentAccount.username}
											</span>
											{currentAccount.profileData
												.isAdmin && (
												<Chip
													size="sm"
													color="warning"
													variant="flat"
													startContent={
														<AdminPanelSettings className="w-3 h-3" />
													}
												>
													Admin
												</Chip>
											)}
											{currentAccount.profileData
												.isEmailVerified && (
												<Verified className="w-3 h-3 text-blue-500" />
											)}
										</div>
									</div>
								</div>
							</DropdownItem>
						);

						items.push(<Divider key="divider-1" />);
					}

					// Other accounts
					const otherAccounts = accounts.filter(
						(acc) => acc.userID !== currentAccount?.userID
					);
					otherAccounts.forEach((account) => {
						items.push(
							<DropdownItem
								key={account.userID}
								className="h-12 gap-2"
								textValue={`Switch to ${account.username}`}
								onPress={() => handleAccountSwitch(account)}
							>
								<div className="flex items-center gap-3">
									<Avatar
										name={`${account.firstName} ${account.lastName}`}
										size="sm"
									/>
									<div className="flex flex-col">
										<span className="text-small">
											{account.firstName}{" "}
											{account.lastName}
										</span>
										<div className="flex items-center gap-2">
											<span className="text-tiny text-default-500">
												@{account.username}
											</span>
											{account.profileData.isAdmin && (
												<AdminPanelSettings className="w-3 h-3 text-orange-500" />
											)}
										</div>
									</div>
								</div>
							</DropdownItem>
						);
					});

					// Add account section
					if (showAddAccount) {
						items.push(<Divider key="divider-2" />);
						items.push(
							<DropdownItem
								key="add-account"
								startContent={<Add className="w-4 h-4" />}
								onPress={handleAddAccount}
							>
								Add Another Account
							</DropdownItem>
						);
					}

					// Logout section
					if (currentAccount) {
						items.push(<Divider key="divider-3" />);
						items.push(
							<DropdownItem
								key="logout"
								color="danger"
								startContent={<ExitToApp className="w-4 h-4" />}
								onPress={() => {
									removeAccount(currentAccount.userID);
									router.push("/auth/signin");
								}}
							>
								Sign Out
							</DropdownItem>
						);
					}

					return items;
				})()}
			</DropdownMenu>
		</Dropdown>
	);
}
