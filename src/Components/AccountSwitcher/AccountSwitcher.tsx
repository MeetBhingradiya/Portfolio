"use client";

import React, { useState, useRef, useEffect } from "react";
import {
	ChevronDownIcon,
	PlusIcon,
	TrashIcon,
	UserIcon,
	ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAccountSwitcher } from "@/Hooks/useAccountSwitcher";
import { StoredAccount } from "@/Utils/AccountManager";

export interface AccountSwitcherProps {
	variant?: "default" | "compact" | "minimal";
	showAddAccount?: boolean;
	onAccountChange?: (account: StoredAccount) => void;
	className?: string;
}

export interface AccountItemProps {
	account: StoredAccount;
	isActive: boolean;
	onClick: () => void;
	onDelete?: () => void;
	showDelete?: boolean;
}

const AccountItem: React.FC<AccountItemProps> = ({
	account,
	isActive,
	onClick,
	onDelete,
	showDelete = false,
}) => {
	return (
		<div
			className={`
        flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
        ${
			isActive
				? "bg-blue-50 border-2 border-blue-200 text-blue-700"
				: "hover:bg-gray-50 border border-gray-200"
		}
      `}
			onClick={onClick}
		>
			<div className="flex items-center space-x-3">
				<div className="relative">
					<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
						{account.username.charAt(0).toUpperCase()}
					</div>{" "}
					{account.profileData?.isAdmin && (
						<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
							<ShieldCheckIcon className="w-2.5 h-2.5 text-white" />
						</div>
					)}
					{account.profileData?.isEmailVerified && (
						<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
							<span className="text-white text-xs">✓</span>
						</div>
					)}
				</div>
				<div className="flex-1">
					<div className="flex items-center space-x-2">
						<span className="font-medium text-gray-900">
							{account.username}
						</span>
						{account.profileData?.isAdmin && (
							<span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
								Admin
							</span>
						)}
						{account.profileData?.isEmailVerified && (
							<span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
								Verified
							</span>
						)}
					</div>
					<p className="text-sm text-gray-500">{account.email}</p>
				</div>
			</div>
			{showDelete && onDelete && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="p-1 text-gray-400 hover:text-red-500 transition-colors"
					aria-label="Delete account"
				>
					<TrashIcon className="w-4 h-4" />
				</button>
			)}
		</div>
	);
};

const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
	variant = "default",
	showAddAccount = true,
	onAccountChange,
	className = "",
}) => {
	const {
		accounts,
		currentAccount,
		isLoading,
		error,
		switchAccount,
		removeAccount,
	} = useAccountSwitcher();

	const [isOpen, setIsOpen] = useState(false);
	const [showManageModal, setShowManageModal] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				// Error will auto-clear after 5 seconds
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error]);
	const handleAccountSwitch = async (account: StoredAccount) => {
		try {
			await switchAccount(account.userID);
			setIsOpen(false);
			onAccountChange?.(account);
		} catch (err) {
			console.error("Failed to switch account:", err);
		}
	};

	const handleRemoveAccount = async (accountId: string) => {
		try {
			await removeAccount(accountId);
		} catch (err) {
			console.error("Failed to remove account:", err);
		}
	};

	const renderCompactView = () => (
		<div
			className="relative"
			ref={dropdownRef}
		>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`
          flex items-center space-x-2 p-2 rounded-lg border border-gray-200 
          hover:border-gray-300 transition-colors ${className}
        `}
				disabled={isLoading}
			>
				{currentAccount ? (
					<>
						<div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
							{currentAccount.username.charAt(0).toUpperCase()}
						</div>
						<span className="text-sm font-medium text-gray-700 truncate max-w-20">
							{currentAccount.username}
						</span>
					</>
				) : (
					<UserIcon className="w-5 h-5 text-gray-400" />
				)}
				<ChevronDownIcon className="w-4 h-4 text-gray-400" />
			</button>{" "}
			{isOpen && (
				<div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
					<div className="p-2 space-y-1">
						{accounts.map((account) => (
							<AccountItem
								key={account.userID}
								account={account}
								isActive={
									currentAccount?.userID === account.userID
								}
								onClick={() => handleAccountSwitch(account)}
							/>
						))}
					</div>

					{(showAddAccount || accounts.length > 1) && (
						<div className="border-t border-gray-200 p-2">
							{showAddAccount && (
								<button
									onClick={() => {
										setIsOpen(false);
										window.location.href = "/auth/signin";
									}}
									className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
								>
									<PlusIcon className="w-4 h-4 text-gray-400" />
									<span className="text-sm text-gray-600">
										Add Account
									</span>
								</button>
							)}

							{accounts.length > 1 && (
								<button
									onClick={() => {
										setIsOpen(false);
										setShowManageModal(true);
									}}
									className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
								>
									<UserIcon className="w-4 h-4 text-gray-400" />
									<span className="text-sm text-gray-600">
										Manage Accounts
									</span>
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);

	const renderMinimalView = () => (
		<div
			className="relative"
			ref={dropdownRef}
		>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`
          flex items-center justify-center w-8 h-8 rounded-full 
          bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold
          hover:shadow-md transition-shadow ${className}
        `}
				disabled={isLoading}
			>
				{currentAccount
					? currentAccount.username.charAt(0).toUpperCase()
					: "?"}
			</button>{" "}
			{isOpen && (
				<div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
					<div className="p-2 space-y-1">
						{accounts.map((account) => (
							<AccountItem
								key={account.userID}
								account={account}
								isActive={
									currentAccount?.userID === account.userID
								}
								onClick={() => handleAccountSwitch(account)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);

	const renderDefaultView = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">
					Account Switcher
				</h3>
				{showAddAccount && (
					<button
						onClick={() => (window.location.href = "/auth/signin")}
						className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						<PlusIcon className="w-4 h-4" />
						<span>Add Account</span>
					</button>
				)}
			</div>{" "}
			<div className="space-y-2">
				{accounts.map((account) => (
					<AccountItem
						key={account.userID}
						account={account}
						isActive={currentAccount?.userID === account.userID}
						onClick={() => handleAccountSwitch(account)}
						onDelete={() => handleRemoveAccount(account.userID)}
						showDelete={accounts.length > 1}
					/>
				))}
			</div>
			{accounts.length === 0 && (
				<div className="text-center py-8">
					<UserIcon className="mx-auto h-12 w-12 text-gray-300" />
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						No accounts
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Get started by adding your first account.
					</p>
					{showAddAccount && (
						<div className="mt-6">
							<button
								onClick={() =>
									(window.location.href = "/auth/signin")
								}
								className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
							>
								<PlusIcon className="w-4 h-4 mr-2" />
								Add Account
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);

	const renderManageModal = () => (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						Manage Accounts
					</h3>
					<button
						onClick={() => setShowManageModal(false)}
						className="text-gray-400 hover:text-gray-600"
					>
						<span className="sr-only">Close</span>
						<svg
							className="w-6 h-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>{" "}
				<div className="space-y-2 max-h-96 overflow-y-auto">
					{accounts.map((account) => (
						<AccountItem
							key={account.userID}
							account={account}
							isActive={currentAccount?.userID === account.userID}
							onClick={() => {
								handleAccountSwitch(account);
								setShowManageModal(false);
							}}
							onDelete={() => handleRemoveAccount(account.userID)}
							showDelete={accounts.length > 1}
						/>
					))}
				</div>
				{showAddAccount && (
					<div className="mt-4 pt-4 border-t border-gray-200">
						<button
							onClick={() => {
								setShowManageModal(false);
								window.location.href = "/auth/signin";
							}}
							className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
						>
							<PlusIcon className="w-5 h-5" />
							<span>Add New Account</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-4">
				<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-sm text-gray-600">
					Loading accounts...
				</span>
			</div>
		);
	}

	return (
		<div className={className}>
			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}

			{variant === "compact" && renderCompactView()}
			{variant === "minimal" && renderMinimalView()}
			{variant === "default" && renderDefaultView()}

			{showManageModal && renderManageModal()}		</div>
	);
};

export default AccountSwitcher;
export { AccountSwitcher };
