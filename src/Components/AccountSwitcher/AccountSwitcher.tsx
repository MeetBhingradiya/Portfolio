"use client";

import React, { useState, useRef, useEffect } from "react";
import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Avatar,
	Chip,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Card,
	CardBody,
	CardHeader,
	Divider,
	Spinner,
	useDisclosure,
	Popover,
	PopoverTrigger,
	PopoverContent,
	cn,
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { TRANSITION_EASINGS } from "@heroui/framer-utils";
import {
	ChevronDownIcon,
	PlusIcon,
	TrashIcon,
	UserIcon,
	ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import { StoredAccount } from "@Utils/AccountManager";
import "@Styles/adminStyles.css";

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
		<motion.div
			whileHover={{
				scale: account.profileData?.isAdmin ? 1.03 : 1.02,
				y: account.profileData?.isAdmin ? -3 : -2,
			}}
			className={account.profileData?.isAdmin ? "hover:shadow-admin" : ""}
			transition={{
				type: "spring",
				stiffness: account.profileData?.isAdmin ? 350 : 260,
				damping: account.profileData?.isAdmin ? 13 : 20,
				mass: account.profileData?.isAdmin ? 1.2 : 1,
			}}
		>
			<Card
				className={`cursor-pointer transition-all duration-200 ${
					isActive
						? "border-primary-500 bg-primary-50"
						: account.profileData?.isAdmin
							? "relative overflow-hidden admin-gradient-border bg-background/60 hover:bg-danger-50/10"
							: "border hover:bg-default-100"
				}`}
				isPressable
				onPress={onClick}
			>
				<CardBody className="flex flex-row items-center justify-between p-3">
					<div className="flex items-center gap-3">
						<div
							className={`relative ${account.profileData?.isAdmin ? "admin-avatar" : ""}`}
						>
							<Avatar
								name={account.username.charAt(0).toUpperCase()}
								size="sm"
								classNames={{
									base: account.profileData?.isAdmin
										? "bg-gradient-to-br from-danger-400 to-danger-600 shadow-sm hover:shadow-md transition-shadow duration-200"
										: "bg-gradient-to-br from-blue-500 to-purple-600",
									name: "text-white font-semibold",
								}}
							/>
							{account.profileData?.isAdmin && (
								<motion.div
									className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center admin-badge-pulse overflow-hidden shadow-sm"
									animate={{
										scale: [1, 1.15, 1],
										opacity: [0.9, 1, 0.9],
									}}
									transition={{
										repeat: Infinity,
										duration: 2,
										ease: "easeInOut",
									}}
								>
									<ShieldCheckIcon className="w-2.5 h-2.5 text-white" />
									<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
								</motion.div>
							)}
							{account.profileData?.isEmailVerified && (
								<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
									<span className="text-white text-xs">
										✓
									</span>
								</div>
							)}
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<span className="font-medium text-foreground">
									{account.username}
								</span>
								{account.profileData?.isAdmin && (
									<Chip
										color="danger"
										size="sm"
										variant="flat"
										className="text-xs bg-danger-50/70 backdrop-blur-sm relative overflow-hidden admin-gradient-border"
									>
										<span className="relative z-10">
											Admin
										</span>
										<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
									</Chip>
								)}
								{account.profileData?.isEmailVerified && (
									<Chip
										color="success"
										size="sm"
										variant="flat"
									>
										Verified
									</Chip>
								)}
							</div>
							<p className="text-sm text-default-500">
								{account.email}
							</p>
						</div>
					</div>
					{showDelete && onDelete && (
						<Button
							isIconOnly
							size="sm"
							variant="light"
							color="danger"
							onPress={() => {
								onDelete();
							}}
							aria-label="Delete account"
						>
							<TrashIcon className="w-4 h-4" />
						</Button>
					)}
				</CardBody>
			</Card>
		</motion.div>
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

	const {
		isOpen: isModalOpen,
		onOpen: onModalOpen,
		onClose: onModalClose,
	} = useDisclosure();

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	const handleAccountSwitch = async (account: StoredAccount) => {
		try {
			await switchAccount(account.userID);
			setIsDropdownOpen(false);
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
		<Dropdown
			backdrop="blur"
			className="relative"
		>
			<DropdownTrigger>
				<Button
					variant="bordered"
					className={`flex items-center gap-2 ${className}`}
					isDisabled={isLoading}
					startContent={
						currentAccount ? (
							<div
								className={`relative ${currentAccount.profileData?.isAdmin ? "admin-avatar" : ""}`}
							>
								<Avatar
									size="sm"
									name={currentAccount.username
										.charAt(0)
										.toUpperCase()}
									classNames={{
										base: currentAccount.profileData
											?.isAdmin
											? "bg-gradient-to-br from-danger-400 to-danger-600 shadow-sm hover:shadow-md transition-shadow duration-200"
											: "bg-gradient-to-br from-blue-500 to-purple-600",
										name: "text-white font-semibold",
									}}
								/>
								{currentAccount.profileData?.isAdmin && (
									<motion.div
										className="absolute -bottom-1 -right-1 w-3 h-3 bg-danger rounded-full flex items-center justify-center overflow-hidden admin-badge-pulse"
										animate={{
											scale: [1, 1.2, 1],
											opacity: [0.9, 1, 0.9],
										}}
										transition={{
											repeat: Infinity,
											duration: 2,
											ease: "easeInOut",
										}}
									>
										<ShieldCheckIcon className="w-2 h-2 text-white" />
										<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
									</motion.div>
								)}
							</div>
						) : (
							<UserIcon className="w-5 h-5 text-default-400" />
						)
					}
					endContent={
						<ChevronDownIcon className="w-4 h-4 text-default-400" />
					}
				>
					{currentAccount ? (
						<span className="text-sm font-medium text-foreground truncate max-w-20">
							{currentAccount.username}
						</span>
					) : (
						"Select Account"
					)}
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				aria-label="Account selection"
				className="w-64"
				disallowEmptySelection
				selectionMode="single"
			>
				{[
					...accounts.map((account) => (
						<DropdownItem
							key={account.userID}
							className={`gap-2 transition-all duration-300 ${account.profileData?.isAdmin ? "hover:bg-danger-50/20 admin-hover-effect relative overflow-hidden" : ""}`}
							startContent={
								<div
									className={`relative ${account.profileData?.isAdmin ? "admin-avatar" : ""}`}
								>
									<Avatar
										size="sm"
										name={account.username
											.charAt(0)
											.toUpperCase()}
										classNames={{
											base: account.profileData?.isAdmin
												? "bg-gradient-to-br from-danger-400 to-danger-600 shadow-sm hover:shadow-md transition-shadow duration-200"
												: "bg-gradient-to-br from-blue-500 to-purple-600",
											name: "text-white font-semibold",
										}}
									/>
									{account.profileData?.isAdmin && (
										<motion.div
											className="absolute -bottom-1 -right-1 w-3 h-3 bg-danger rounded-full flex items-center justify-center overflow-hidden admin-badge-pulse"
											animate={{
												scale: [1, 1.2, 1],
												opacity: [0.9, 1, 0.9],
											}}
											transition={{
												repeat: Infinity,
												duration: 2,
												ease: "easeInOut",
											}}
										>
											<ShieldCheckIcon className="w-2 h-2 text-white" />
											<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
										</motion.div>
									)}
								</div>
							}
							description={account.email}
							onPress={() => handleAccountSwitch(account)}
						>
							<div className="flex items-center gap-2">
								<span className="font-medium">
									{account.username}
								</span>
								{account.profileData?.isAdmin && (
									<Chip
										color="danger"
										size="sm"
										variant="flat"
										className="text-xs bg-danger-50/70 backdrop-blur-sm relative overflow-hidden admin-gradient-border"
									>
										<span className="relative z-10">
											Admin
										</span>
										<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
									</Chip>
								)}
								{account.profileData?.isEmailVerified && (
									<Chip
										color="success"
										size="sm"
										variant="flat"
									>
										Verified
									</Chip>
								)}
							</div>
						</DropdownItem>
					)),
					...(showAddAccount || accounts.length > 1
						? [
								<DropdownItem
									key="divider"
									isReadOnly
								>
									<Divider />
								</DropdownItem>,
							]
						: []),
					...(showAddAccount
						? [
								<DropdownItem
									key="add-account"
									startContent={
										<PlusIcon className="w-4 h-4" />
									}
									onPress={() => {
										window.location.href = "/auth/signin";
									}}
								>
									Add Account
								</DropdownItem>,
							]
						: []),
					...(accounts.length > 1
						? [
								<DropdownItem
									key="manage-accounts"
									startContent={
										<UserIcon className="w-4 h-4" />
									}
									onPress={onModalOpen}
								>
									Manage Accounts
								</DropdownItem>,
							]
						: []),
				]}
			</DropdownMenu>
		</Dropdown>
	);

	const renderMinimalView = () => (
		<Dropdown
			backdrop="blur"
			placement="bottom-end"
		>
			<DropdownTrigger>
				<Button
					isIconOnly
					variant="light"
					className={`w-8 h-8 rounded-full ${
						currentAccount?.profileData?.isAdmin
							? "bg-gradient-to-br from-danger-400 to-danger-600 shadow-sm hover:shadow-md relative overflow-hidden"
							: "bg-gradient-to-br from-blue-500 to-purple-600"
					} text-white ${className}`}
					isDisabled={isLoading}
				>
					{currentAccount?.profileData?.isAdmin && (
						<>
							<div className="absolute inset-0 rounded-full animate-admin-pulse opacity-70"></div>
							<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
						</>
					)}
					{currentAccount
						? currentAccount.username.charAt(0).toUpperCase()
						: "?"}
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				aria-label="Account selection"
				className="w-56"
				disallowEmptySelection
				selectionMode="single"
			>
				{accounts.map((account) => (
					<DropdownItem
						key={account.userID}
						className={`gap-2 ${account.profileData?.isAdmin ? "hover:bg-danger-50/20" : ""}`}
						startContent={
							<div
								className={`relative ${account.profileData?.isAdmin ? "admin-avatar" : ""}`}
							>
								<Avatar
									size="sm"
									name={account.username
										.charAt(0)
										.toUpperCase()}
									classNames={{
										base: account.profileData?.isAdmin
											? "bg-gradient-to-br from-danger-400 to-danger-600 shadow-sm hover:shadow-md transition-shadow duration-200"
											: "bg-gradient-to-br from-blue-500 to-purple-600",
										name: "text-white font-semibold",
									}}
								/>
								{account.profileData?.isAdmin && (
									<motion.div
										className="absolute -bottom-1 -right-1 w-3 h-3 bg-danger rounded-full flex items-center justify-center overflow-hidden admin-badge-pulse"
										animate={{
											scale: [1, 1.2, 1],
											opacity: [0.9, 1, 0.9],
										}}
										transition={{
											repeat: Infinity,
											duration: 2,
											ease: "easeInOut",
										}}
									>
										<ShieldCheckIcon className="w-2 h-2 text-white" />
										<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
									</motion.div>
								)}
							</div>
						}
						description={account.email}
						onPress={() => handleAccountSwitch(account)}
					>
						<div className="flex items-center gap-2">
							<span className="font-medium">
								{account.username}
							</span>
							{account.profileData?.isAdmin && (
								<Chip
									color="danger"
									size="sm"
									variant="flat"
									className="text-xs bg-danger-50/70 backdrop-blur-sm relative overflow-hidden admin-gradient-border"
								>
									<span className="relative z-10">Admin</span>
									<div className="absolute inset-0 bg-gradient-to-r from-danger-200/30 via-danger-400/30 to-danger-200/30 animate-admin-shimmer"></div>
								</Chip>
							)}
							{account.profileData?.isEmailVerified && (
								<Chip
									color="success"
									size="sm"
									variant="flat"
								>
									Verified
								</Chip>
							)}
						</div>
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);

	const renderDefaultView = () => (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-foreground">
					Account Switcher
				</h3>
				{showAddAccount && (
					<Button
						color="primary"
						startContent={<PlusIcon className="w-4 h-4" />}
						onPress={() => (window.location.href = "/auth/signin")}
					>
						Add Account
					</Button>
				)}
			</CardHeader>
			<CardBody className="gap-2">
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
				{accounts.length === 0 && (
					<div className="text-center py-8">
						<UserIcon className="mx-auto h-12 w-12 text-default-300" />
						<h3 className="mt-2 text-sm font-medium text-foreground">
							No accounts
						</h3>
						<p className="mt-1 text-sm text-default-500">
							Get started by adding your first account.
						</p>
						{showAddAccount && (
							<div className="mt-6">
								<Button
									color="primary"
									startContent={
										<PlusIcon className="w-4 h-4" />
									}
									onPress={() =>
										(window.location.href = "/auth/signin")
									}
								>
									Add Account
								</Button>
							</div>
						)}
					</div>
				)}
			</CardBody>
		</Card>
	);

	const renderManageModal = () => (
		<Modal
			isOpen={isModalOpen}
			onClose={onModalClose}
			isDismissable={true}
			closeButton={false}
			size="2xl"
			scrollBehavior="inside"
			motionProps={{
				variants: {
					enter: {
						scale: 1,
						y: "var(--slide-enter)",
						opacity: 1,
						transition: {
							scale: {
								duration: 0.4,
								ease: TRANSITION_EASINGS.ease,
							},
							opacity: {
								duration: 0.4,
								ease: TRANSITION_EASINGS.ease,
							},
							y: {
								type: "spring",
								bounce: 0,
								duration: 0.6,
							},
						},
					},
					exit: {
						scale: 1.1,
						y: "var(--slide-exit)",
						opacity: 0,
						transition: {
							duration: 0.3,
							ease: TRANSITION_EASINGS.ease,
						},
					},
				},
			}}
			classNames={{
				backdrop:
					"bg-gradient-to-t from-zinc-900/60 to-zinc-900/20 backdrop-blur-md backdrop-opacity-30",
			}}
		>
			<ModalContent
				className="backdrop-blur-xl shadow-lg overflow-hidden"
				style={{
					padding: "0",
					transition: "all 0.5s ease",
					borderRadius: "var(--border-radius, 10px)",
					background: "rgba(var(--content1-50), 0.5)",
					backdropFilter: "blur(20px)",
					border: "1px solid rgba(var(--content3), 0.15)",
				}}
			>
				<ModalHeader className="flex flex-col gap-2 pb-4 border-b border-divider bg-background/5 backdrop-blur-md">
					<div className="flex items-center justify-between w-full">
						<div>
							<h3 className="text-xl font-bold text-foreground">
								Manage Accounts
							</h3>
							<p className="text-sm text-default-500 mt-1">
								Switch between accounts or manage your saved
								accounts
							</p>
						</div>
						<Chip
							color="primary"
							variant="flat"
							size="sm"
							className="backdrop-blur-sm bg-primary-50/30"
						>
							{accounts.length}
							{accounts.length === 1 ? "Account" : "Accounts"}
						</Chip>
					</div>
				</ModalHeader>
				<ModalBody className="p-0 overflow-hidden">
					<div className="space-y-4 max-h-[55vh] overflow-y-auto overflow-x-hidden px-6 py-4 custom-scrollbar">
						{accounts.map((account, index) => (
							<motion.div
								key={account.userID}
								className={cn(
									"p-4 rounded-lg transition-all duration-300 cursor-pointer group",
									"border border-divider hover:border-primary-300",
									account.profileData?.isAdmin
										? "hover:border-danger-300 bg-background/40 relative overflow-hidden shadow-lg admin-modal-item admin-hover-effect"
										: "bg-background/40"
								)}
								onClick={() => {
									handleAccountSwitch(account);
									onModalClose();
								}}
								whileHover={{
									scale: account.profileData?.isAdmin
										? 1.025
										: 1.015,
									y: account.profileData?.isAdmin ? -4 : -2,
									rotateY: account.profileData?.isAdmin
										? 2
										: 0,
									boxShadow: account.profileData?.isAdmin
										? "0 20px 35px -10px rgba(243, 18, 96, 0.25), 0 0 30px -5px rgba(243, 18, 96, 0.15)"
										: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
								}}
								whileTap={{
									scale: 0.98,
									y: account.profileData?.isAdmin ? -1 : 0,
								}}
								initial={{ opacity: 0, y: 30, rotateX: -10 }}
								animate={{ opacity: 1, y: 0, rotateX: 0 }}
								transition={{
									duration: 0.4,
									delay: index * 0.08,
									type: "spring",
									stiffness: account.profileData?.isAdmin
										? 300
										: 250,
									damping: account.profileData?.isAdmin
										? 15
										: 20,
									mass: account.profileData?.isAdmin
										? 1.1
										: 1,
								}}
								style={{
									transformStyle: "preserve-3d",
									perspective: "1000px",
								}}
							>
								{account.profileData?.isAdmin && (
									<>
										{/* Primary admin background animation */}
										<motion.div
											className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden rounded-lg"
											animate={{
												background: [
													"linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(244, 63, 94, 0.15))",
													"linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(239, 68, 68, 0.1))",
													"linear-gradient(225deg, rgba(239, 68, 68, 0.1), rgba(244, 63, 94, 0.15))",
													"linear-gradient(315deg, rgba(244, 63, 94, 0.15), rgba(239, 68, 68, 0.1))",
												],
											}}
											transition={{
												duration: 6,
												repeat: Infinity,
												ease: "easeInOut",
											}}
										/>

										{/* Secondary shimmer effect */}
										<div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-lg">
											<div className="absolute inset-0 bg-gradient-to-r from-transparent via-danger-300/30 to-transparent animate-admin-shimmer"></div>
										</div>

										{/* Tertiary glow pulse */}
										<motion.div
											className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-lg"
											animate={{
												opacity: [0.05, 0.15, 0.05],
												scale: [1, 1.02, 1],
											}}
											transition={{
												duration: 3,
												repeat: Infinity,
												ease: "easeInOut",
											}}
										>
											<div className="absolute inset-0 bg-gradient-to-tr from-danger-500/20 to-danger-300/10 animate-slow-spin"></div>
										</motion.div>

										{/* Border glow effect */}
										<div className="absolute inset-0 rounded-lg admin-gradient-border opacity-60"></div>
									</>
								)}
								<div className="flex items-center justify-between relative z-10">
									<div className="flex items-center gap-4">
										<div
											className={`relative ${account.profileData?.isAdmin ? "admin-avatar admin-modal-avatar admin-double-border" : ""}`}
										>
											<Avatar
												name={account.username
													.charAt(0)
													.toUpperCase()}
												size="lg"
												classNames={{
													base: account.profileData
														?.isAdmin
														? "bg-gradient-to-br from-danger-400 to-danger-600 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden z-20"
														: "bg-gradient-to-br from-blue-500 to-purple-600 shadow-md hover:shadow-lg transition-shadow duration-300",
													name: "text-white font-bold text-lg relative z-30",
													icon: "z-30",
												}}
											/>

											{/* Admin avatar special effects */}
											{account.profileData?.isAdmin && (
												<>
													{/* Inner glow animation */}
													<motion.div
														className="absolute inset-0 rounded-full z-10"
														animate={{
															background: [
																"radial-gradient(circle at center, rgba(243, 18, 96, 0.3) 0%, transparent 70%)",
																"radial-gradient(circle at center, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
																"radial-gradient(circle at center, rgba(243, 18, 96, 0.3) 0%, transparent 70%)",
															],
														}}
														transition={{
															duration: 2.5,
															repeat: Infinity,
															ease: "easeInOut",
														}}
													/>

													{/* Rotating border effect */}
													<motion.div
														className="absolute inset-0 rounded-full border-2 border-transparent"
														style={{
															background:
																"linear-gradient(45deg, rgba(243, 18, 96, 0.8), rgba(239, 68, 68, 0.6), rgba(244, 63, 94, 0.8)) border-box",
															mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
															maskComposite:
																"exclude",
														}}
														animate={{
															rotate: 360,
														}}
														transition={{
															duration: 8,
															repeat: Infinity,
															ease: "linear",
														}}
													/>
												</>
											)}

											{currentAccount?.userID ===
												account.userID && (
												<motion.div
													className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center shadow-sm"
													initial={{
														scale: 0,
														rotate: -180,
													}}
													animate={{
														scale: 1,
														rotate: 0,
													}}
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 15,
														delay: 0.2,
													}}
													whileHover={{ scale: 1.2 }}
												>
													<span className="text-white text-xs font-bold">
														✓
													</span>
												</motion.div>
											)}

											{account.profileData?.isAdmin && (
												<motion.div
													className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
													initial={{
														scale: 0,
														rotate: 180,
													}}
													animate={{
														scale: 1,
														rotate: 0,
													}}
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 15,
														delay: 0.3,
													}}
													whileHover={{
														scale: 1.3,
														rotate: 360,
													}}
												>
													{/* Multi-layered background */}
													<div className="absolute inset-0 bg-gradient-to-tr from-danger-600 to-danger-400"></div>
													<motion.div
														className="absolute inset-0 bg-gradient-to-r from-danger-200/60 via-danger-400/60 to-danger-200/60"
														animate={{
															x: [
																"-100%",
																"200%",
															],
														}}
														transition={{
															duration: 3,
															repeat: Infinity,
															ease: "easeInOut",
														}}
													/>
													<div className="absolute inset-0 shadow-inner"></div>

													<ShieldCheckIcon className="w-4 h-4 text-white relative z-10 drop-shadow-md" />
												</motion.div>
											)}
										</div>
										<div className="flex-1">
											<div className="flex flex-wrap items-center gap-2 mb-1.5">
												<h4 className="font-semibold text-foreground text-lg">
													{account.username}
												</h4>
												{currentAccount?.userID ===
													account.userID && (
													<Chip
														color="success"
														size="sm"
														variant="flat"
														className="text-xs bg-success-50/50 backdrop-blur-sm"
													>
														Active
													</Chip>
												)}
												{account.profileData
													?.isAdmin && (
													<Chip
														color="danger"
														size="sm"
														variant="flat"
														className="text-xs bg-danger-50/80 backdrop-blur-sm relative overflow-hidden admin-gradient-border group-hover:shadow-md transition-all duration-300"
													>
														<span className="relative z-10 font-medium">
															Admin
														</span>
														<div className="absolute inset-0 bg-gradient-to-r from-danger-200/40 via-danger-400/50 to-danger-200/40 animate-admin-shimmer"></div>
													</Chip>
												)}
												{/* {account.profileData
													?.isEmailVerified && (
													<Chip
														color="primary"
														size="sm"
														variant="flat"
														className="text-xs bg-primary-50/50 backdrop-blur-sm"
													>
														Verified
													</Chip>
												)} */}
											</div>
											<p className="text-default-600 text-sm">
												{account.email}
											</p>
										</div>
									</div>
									{accounts.length > 1 && (
										<Button
											isIconOnly
											size="sm"
											variant="light"
											color="danger"
											className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-danger-50/30 backdrop-blur-sm hover:bg-danger-100/50"
											onClick={(e) => {
												e.stopPropagation();
											}}
											onPress={() => {
												handleRemoveAccount(
													account.userID
												);
											}}
											aria-label="Remove account"
										>
											<TrashIcon className="w-4 h-4" />
										</Button>
									)}
								</div>
							</motion.div>
						))}
					</div>
					{accounts.length === 0 && (
						<motion.div
							className="text-center py-12 px-6"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.4, type: "spring" }}
						>
							<div className="relative mx-auto">
								<div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-300 to-secondary-300 blur-xl opacity-20"></div>
								<div className="relative rounded-full bg-background/40 backdrop-blur-sm w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-divider">
									<UserIcon className="h-10 w-10 text-default-500" />
								</div>
							</div>
							<h3 className="text-xl font-medium text-foreground mb-3">
								No accounts found
							</h3>
							<p className="text-default-500 max-w-md mx-auto mb-8 text-sm">
								You haven't added any accounts yet. Add an
								account to get started with the full experience.
							</p>
							{showAddAccount && (
								<Button
									color="primary"
									size="lg"
									startContent={
										<PlusIcon className="w-5 h-5" />
									}
									onPress={() => {
										onModalClose();
										window.location.href =
											"/auth/signin?acs=1";
									}}
									className="font-medium shadow-md hover:shadow-xl transition-shadow"
								>
									Add Your First Account
								</Button>
							)}
						</motion.div>
					)}

					{showAddAccount && accounts.length > 0 && (
						<motion.div
							className="py-2 px-6 backdrop-blur-md"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.4 }}
						>
							<Button
								variant="flat"
								color="primary"
								size="lg"
								startContent={<PlusIcon className="w-5 h-5" />}
								onPress={() => {
									onModalClose();
									window.location.href = "/auth/signin?acs=1";
								}}
								className="w-full h-12 font-medium hover:shadow-md transition-all bg-primary-50/40 backdrop-blur-sm"
							>
								Add New Account
							</Button>
							<p className="text-xs text-default-400 text-center mt-2">
								You'll be redirected to the sign-in page to add
								a new account
							</p>
						</motion.div>
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-4 gap-2">
				<Spinner
					size="sm"
					color="primary"
				/>
				<span className="text-sm text-default-500">
					Loading accounts...
				</span>
			</div>
		);
	}
	
	return (
		<div className={className}>
			{error && (
				<Card className="mb-4 border-danger-200 bg-danger-50">
					<CardBody className="p-3">
						<p className="text-sm text-danger-700">{error}</p>
					</CardBody>
				</Card>
			)}
			{variant === "compact" && renderCompactView()}
			{variant === "minimal" && renderMinimalView()}
			{variant === "default" && renderDefaultView()}
			{renderManageModal()}
		</div>
	);
};

export default AccountSwitcher;
export { AccountSwitcher };
