"use client";

import React from "react";
import {
	Card,
	CardBody,
	CardHeader,
	Button,
	Chip,
	Divider,
	Spinner,
	Avatar,
	Input,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
	Tabs,
	Tab,
	Tooltip,
	Badge,
	Switch,
	Progress,
} from "@heroui/react";
import {
	Dashboard as DashboardIcon,
	Person,
	Security,
	ExitToApp,
	Computer,
	Smartphone,
	AccessTime,
	Verified,
	Warning,
	Edit,
	Add,
	Delete,
	Key,
	Email,
	Save,
	Cancel,
	AdminPanelSettings,
	VpnKey,
	PhoneAndroid,
	Logout,
	DeleteForever,
	Visibility,
	VisibilityOff,
	CheckCircle,
	Error as ErrorIcon,
	LocationOn,
	Language,
	Schedule,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Axios } from "@Utils/Axios";
import { AccountSwitcher } from "@Components/AccountSwitcher";
import { useAccount } from "@contexts/AccountContext";

interface User {
	UserID: string;
	Username: string;
	FirstName: string;
	LastName: string;
	Emails: Array<{
		Email: string;
		isPrimary: boolean;
		isVerified: boolean;
	}>;
	isAdmin: boolean;
	isEmailVerified: boolean;
	isMFA: boolean;
	createdAt: string;
	lastLoginAt: string;
}

interface Session {
	SessionID: string;
	Platform: string;
	Browser: string;
	ExpiresAt: string;
	IPDataMappedResponse?: {
		city?: string;
		country?: string;
		region?: string;
	};
	createdAt: string;
	lastActivity: string;
	isCurrent?: boolean;
}

interface DashboardData {
	user: User;
	currentSession: Session;
	activeSessions: Session[];
	security: {
		totalActiveSessions: number;
		lastPasswordChange?: string;
	};
}

interface EditProfileData {
	FirstName: string;
	LastName: string;
	Username: string;
}

interface PasswordChangeData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

interface NewEmailData {
	email: string;
}

interface EmailVerificationData {
	email: string;
	otp: string;
	verificationLoading: boolean;
}

export default function Dashboard() {
	const router = useRouter();
	const {
		accounts,
		activeAccount,
		isLoading: accountSwitcherLoading,
		switchAccount,
		removeAccount,
	} = useAccount();
	const [State, setState] = React.useState({
		isLoading: true,
		DashboardData: null as DashboardData | null,
		error: "",
		activeTab: "overview",
		editProfileData: {
			FirstName: "",
			LastName: "",
			Username: "",
		} as EditProfileData,
		isEditingProfile: false,
		profileSaveLoading: false,
		signOutLoading: false,
		passwordData: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		} as PasswordChangeData,
		showPasswords: {
			current: false,
			new: false,
			confirm: false,
		},
		passwordChangeLoading: false,
		newEmailData: {
			email: "",
		} as NewEmailData,
		emailActionLoading: "",
		emailVerificationData: {
			email: "",
			otp: "",
			verificationLoading: false,
		} as EmailVerificationData,
		sessionActionLoading: "",
	});

	// Modals
	const {
		isOpen: isPasswordModalOpen,
		onOpen: onPasswordModalOpen,
		onClose: onPasswordModalClose,
	} = useDisclosure();

	const {
		isOpen: isEmailModalOpen,
		onOpen: onEmailModalOpen,
		onClose: onEmailModalClose,
	} = useDisclosure();

	const {
		isOpen: isDeleteAccountModalOpen,
		onOpen: onDeleteAccountModalOpen,
		onClose: onDeleteAccountModalClose,
	} = useDisclosure();

	const {
		isOpen: isEmailVerificationModalOpen,
		onOpen: onEmailVerificationModalOpen,
		onClose: onEmailVerificationModalClose,
	} = useDisclosure();
	// Memoize fetchDashboardData to prevent unnecessary re-renders
	const fetchDashboardData = React.useCallback(async () => {
		console.log(
			"fetchDashboardData called for account:",
			activeAccount?.UserID
		);

		try {
			setState((prev) => ({ ...prev, isLoading: true, error: "" }));

			const response = await Axios.get("/api/dashboard");
			console.log("Dashboard API response:", response.data);

			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					DashboardData: response.data.Data,
					error: "",
				}));
			} else {
				setState((prev) => ({
					...prev,
					error: response.data.Message || "Failed to load dashboard",
				}));
			}
		} catch (error: any) {
			console.error("Dashboard fetch error:", error);
			if (error.response?.status === 401) {
				// Session expired, remove current account and redirect
				if (activeAccount) {
					console.log(
						"Session expired, removing account:",
						activeAccount.UserID
					);
					removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to load dashboard data",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, isLoading: false }));
		}
	}, [activeAccount, removeAccount, router]); // Handle initial load and account changes
	React.useEffect(() => {
		console.log("Dashboard useEffect triggered:", {
			accountSwitcherLoading,
			ActiveAccount: activeAccount?.UserID,
			accounts: accounts.length,
		});

		// Wait for account switcher to finish loading
		if (accountSwitcherLoading) {
			console.log("Account switcher still loading, waiting...");
			return;
		}

		if (!activeAccount) {
			console.log("No active account found, redirecting to signin");
			router.push("/auth/signin");
			return;
		}

		console.log(
			"Fetching dashboard data for account:",
			activeAccount.UserID
		);
		fetchDashboardData();
	}, [
		activeAccount?.UserID,
		accountSwitcherLoading,
		fetchDashboardData,
		router,
	]);
	// Update edit profile data when dashboard data changes
	React.useEffect(() => {
		if (State.DashboardData?.user) {
			setState((prev) => ({
				...prev,
				editProfileData: {
					FirstName: State.DashboardData!.user.FirstName,
					LastName: State.DashboardData!.user.LastName,
					Username: State.DashboardData!.user.Username,
				},
			}));
		}
	}, [State.DashboardData?.user]);
		const handleSignOut = React.useCallback(async () => {
		setState((prev) => ({ ...prev, signOutLoading: true }));

		try {
			console.log("Starting sign out process...");
			
			// Get the current auth token to verify it exists
			const currentToken = localStorage.getItem("auth-token");
			if (!currentToken) {
				console.warn("No auth token found, proceeding with local cleanup");
			} else {
				console.log("Found auth token, attempting server session deletion");
				
				try {
					// Delete the session on the server with explicit headers
					const response = await Axios.delete("/api/session", {
						headers: {
							Authorization: `Bearer ${currentToken}`,
						},
					});
					
					console.log("Session deletion response:", response.data);
					
					if (response.data.Status === 1) {
						console.log("Server session deleted successfully");
					} else {
						console.warn("Server session deletion failed:", response.data.Message);
					}
				} catch (sessionError: any) {
					console.error("Failed to delete session on server:", {
						status: sessionError.response?.status,
						statusText: sessionError.response?.statusText,
						message: sessionError.response?.data?.Message || sessionError.message,
						data: sessionError.response?.data
					});
					
					// If it's a 401, the session is already invalid
					if (sessionError.response?.status === 401) {
						console.log("Session already invalid (401), proceeding with cleanup");
					}
				}
			}
		} catch (error) {
			console.error("Unexpected error during session deletion:", error);
		}

		try {
			if (activeAccount) {
				console.log("Processing account cleanup for:", activeAccount.UserID);
				
				// Check if there are other accounts available
				const otherAccounts = accounts.filter(
					(acc) => acc.UserID !== activeAccount.UserID
				);

				if (otherAccounts.length > 0) {
					console.log(`Found ${otherAccounts.length} other accounts, switching to most recent`);
					
					// Switch to the most recently used account
					const mostRecentAccount = otherAccounts.sort(
						(a, b) =>
							new Date(b.LastUsed || 0).getTime() -
							new Date(a.LastUsed || 0).getTime()
					)[0];

					console.log("Switching to account:", mostRecentAccount.UserID);

					// Remove current account and switch to the most recent one
					await removeAccount(activeAccount.UserID);
					await switchAccount(mostRecentAccount.UserID);

					// Reload to refresh the dashboard with new account data
					console.log("Reloading page with new account");
					window.location.reload();
					return;
				} else {
					console.log("No other accounts found, removing current account");
					// No other accounts, remove current account and redirect to signin
					await removeAccount(activeAccount.UserID);
				}
			}

			console.log("Clearing auth tokens and redirecting to signin");
			
			// Clear any remaining auth tokens
			localStorage.removeItem("auth-token");
			document.cookie =
				"auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

			// Redirect to signin page
			router.push("/auth/signin");
		} catch (error) {
			console.error("Error during account cleanup:", error);
			// Force redirect to signin even if cleanup fails
			router.push("/auth/signin");
		} finally {
			setState((prev) => ({ ...prev, signOutLoading: false }));
		}
	}, [activeAccount, accounts, switchAccount, removeAccount, router]);

	const handleUpdateProfile = async () => {
		setState((prev) => ({ ...prev, profileSaveLoading: true }));
		try {
			const response = await Axios.patch(
				"/api/profile",
				State.editProfileData
			);

			if (response.data.Status === 1) {
				setState((prev) => ({ ...prev, isEditingProfile: false }));
				fetchDashboardData(); // Refresh data
			} else {
				setState((prev) => ({
					...prev,
					error: response.data.Message || "Failed to update profile",
				}));
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to update profile",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, profileSaveLoading: false }));
		}
	};
	const handleChangePassword = async () => {
		if (
			State.passwordData.newPassword !==
			State.passwordData.confirmPassword
		) {
			setState((prev) => ({
				...prev,
				error: "New passwords don't match",
			}));
			return;
		}

		if (State.passwordData.newPassword.length < 8) {
			setState((prev) => ({
				...prev,
				error: "Password must be at least 8 characters long",
			}));
			return;
		}

		setState((prev) => ({ ...prev, passwordChangeLoading: true }));
		try {
			const response = await Axios.patch("/api/password", {
				currentPassword: State.passwordData.currentPassword,
				newPassword: State.passwordData.newPassword,
			});

			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					passwordData: {
						currentPassword: "",
						newPassword: "",
						confirmPassword: "",
					},
				}));
				onPasswordModalClose();
				// Show success message or refresh data
			} else {
				setState((prev) => ({
					...prev,
					error: response.data.Message || "Failed to change password",
				}));
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to change password",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, passwordChangeLoading: false }));
		}
	};
	const handleAddEmail = async () => {
		setState((prev) => ({ ...prev, emailActionLoading: "add" }));
		try {
			const response = await Axios.post("/api/emails", {
				email: State.newEmailData.email,
			});

			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					newEmailData: { email: "" },
				}));
				onEmailModalClose();
				fetchDashboardData();
			} else {
				setState((prev) => ({
					...prev,
					error: response.data.Message || "Failed to add email",
				}));
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message || "Failed to add email",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, emailActionLoading: "" }));
		}
	};
	const handleRemoveEmail = async (email: string) => {
		setState((prev) => ({ ...prev, emailActionLoading: email }));
		try {
			const response = await Axios.delete(
				`/api/emails?email=${encodeURIComponent(email)}`
			);

			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setState((prev) => ({
					...prev,
					error: response.data.Message || "Failed to remove email",
				}));
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to remove email",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, emailActionLoading: "" }));
		}
	};
	const handleSetPrimaryEmail = async (email: string) => {
		setState((prev) => ({ ...prev, emailActionLoading: email }));
		try {
			const response = await Axios.patch("/api/emails", {
				email,
				setPrimary: true,
			});

			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setState((prev) => ({
					...prev,
					error:
						response.data.Message || "Failed to set primary email",
				}));
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to set primary email",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, emailActionLoading: "" }));
		}
	};
	const handleTerminateSession = async (sessionID: string) => {
		setState((prev) => ({ ...prev, sessionActionLoading: sessionID }));
		try {
			const response = await Axios.delete(`/api/session/${sessionID}`);

			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setState((prev) => ({
					...prev,
					error:
						response.data.Message || "Failed to terminate session",
				}));
			}
		} catch (error: any) {
			// If session termination fails due to auth error, the session might already be invalid
			if (error?.response?.status === 401) {
				// Session is already invalid, clean up locally
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to terminate session",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, sessionActionLoading: "" }));
		}
	};
	const handleTerminateAllSessions = async () => {
		setState((prev) => ({ ...prev, sessionActionLoading: "all" }));
		try {
			const response = await Axios.delete("/api/session");
			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setState((prev) => ({
					...prev,
					error:
						response.data.Message || "Failed to terminate sessions",
				}));
			}
		} catch (error: any) {
			// If termination fails due to auth error, sessions might already be invalid
			if (error?.response?.status === 401) {
				// Sessions are already invalid, clean up locally
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to terminate sessions",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, sessionActionLoading: "" }));
		}
	};

	const getPlatformIcon = (platform: string) => {
		switch (platform?.toLowerCase()) {
			case "windows":
			case "linux":
			case "macos":
				return <Computer className="text-blue-500" />;
			case "android":
			case "ios":
				return <Smartphone className="text-green-500" />;
			default:
				return <Computer className="text-gray-500" />;
		}
	};
	const getPasswordStrength = (password: string) => {
		let strength = 0;
		if (password.length >= 8) strength += 25;
		if (/[a-z]/.test(password)) strength += 25;
		if (/[A-Z]/.test(password)) strength += 25;
		if (/[0-9]/.test(password)) strength += 25;

		const getColor = (): "danger" | "warning" | "success" => {
			if (strength < 50) return "danger";
			if (strength < 75) return "warning";
			return "success";
		};

		return {
			score: strength,
			label: strength < 50 ? "Weak" : strength < 75 ? "Medium" : "Strong",
			color: getColor(),
		};
	};
	const handleSendVerificationOTP = async (email: string) => {
		setState((prev) => ({ ...prev, emailActionLoading: email }));
		try {
			const response = await Axios.post("/api/emails/verify", {
				email: email,
			});
			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					emailVerificationData: {
						email,
						otp: "",
						verificationLoading: false,
					},
				}));
				onEmailVerificationModalOpen();
			} else {
				setState((prev) => ({
					...prev,
					error:
						response.data.Message ||
						"Failed to send verification code",
				}));
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to send verification code",
				}));
			}
		} finally {
			setState((prev) => ({ ...prev, emailActionLoading: "" }));
		}
	};
	const handleVerifyEmail = async () => {
		setState((prev) => ({
			...prev,
			emailVerificationData: {
				...prev.emailVerificationData,
				verificationLoading: true,
			},
		}));
		try {
			const response = await Axios.put("/api/emails/verify", {
				email: State.emailVerificationData.email,
				otp: State.emailVerificationData.otp,
			});
			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					emailVerificationData: {
						email: "",
						otp: "",
						verificationLoading: false,
					},
				}));
				onEmailVerificationModalClose();
				fetchDashboardData(); // Refresh data
			} else {
				setState((prev) => ({
					...prev,
					error: response.data.Message || "Failed to verify email",
				}));
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				if (activeAccount) {
					await removeAccount(activeAccount.UserID);
				}
				router.push("/auth/signin");
			} else {
				setState((prev) => ({
					...prev,
					error:
						error.response?.data?.Message ||
						"Failed to verify email",
				}));
			}
		} finally {
			setState((prev) => ({
				...prev,
				emailVerificationData: {
					...prev.emailVerificationData,
					verificationLoading: false,
				},
			}));
		}
	};
	if (accountSwitcherLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<Spinner size="lg" />
				<div className="text-center">
					<p className="text-lg">Loading Account...</p>
				</div>
			</div>
		);
	}

	if (State.isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<Spinner size="lg" />
				<div className="text-center">
					<p className="text-lg">Loading Dashboard...</p>
				</div>
			</div>
		);
	}

	if (State.error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<Warning className="text-6xl text-danger" />
				<div className="text-center">
					<p className="text-lg text-danger">{State.error}</p>
				</div>
				<Button
					color="primary"
					onPress={() => fetchDashboardData()}
					isLoading={State.isLoading}
				>
					Try Again
				</Button>
			</div>
		);
	}

	if (!State.DashboardData) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p>No data available</p>
			</div>
		);
	}

	const passwordStrength = getPasswordStrength(
		State.passwordData.newPassword
	);

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header with Account Switcher */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-4">
					<DashboardIcon sx={{ fontSize: "2rem" }} />
					<div>
						<h1 className="text-3xl font-bold">Dashboard</h1>{" "}
						<p className="text-default-500">
							Welcome back, {State.DashboardData.user.FirstName}!
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<AccountSwitcher
						variant="full"
						showAddAccount={true}
						onAccountChange={() => {
							window.location.reload();
						}}
					/>
					{State.DashboardData.user.isAdmin && (
						<Tooltip content="Admin Panel">
							<Button
								color="secondary"
								variant="flat"
								isIconOnly
								onPress={() => router.push("/admin")}
							>
								<AdminPanelSettings />
							</Button>
						</Tooltip>
					)}{" "}
					<Button
						color="danger"
						variant="flat"
						startContent={<ExitToApp />}
						onPress={handleSignOut}
						isLoading={State.signOutLoading}
						isDisabled={State.signOutLoading}
					>
						{State.signOutLoading ? "Signing Out..." : "Sign Out"}
					</Button>
				</div>
			</div>{" "}
			{/* Error Alert */}
			{State.error && (
				<Card className="border-danger bg-danger-50">
					<CardBody className="flex flex-row items-center gap-3">
						<ErrorIcon className="text-danger" />
						<p className="text-danger font-medium">{State.error}</p>
						<Button
							size="sm"
							variant="light"
							color="danger"
							onPress={() =>
								setState((prev) => ({ ...prev, error: "" }))
							}
						>
							Dismiss
						</Button>
					</CardBody>
				</Card>
			)}
			{/* Main Content Tabs */}
			<div className="w-full">
				<Tabs
					selectedKey={State.activeTab}
					onSelectionChange={(key) =>
						setState((prev) => ({
							...prev,
							activeTab: key.toString(),
						}))
					}
					aria-label="Dashboard sections"
					variant="bordered"
					className="w-full"
				>
					<Tab
						key="overview"
						title="Overview"
					>
						<div className="space-y-6 mt-6">
							{/* User Profile Card */}
							<Card>
								<CardHeader className="flex gap-3">
									<Avatar
										icon={<Person />}
										classNames={{
											base: "bg-gradient-to-br from-indigo-500 to-pink-500",
											icon: "text-white/80",
										}}
									/>{" "}
									<div className="flex flex-col flex-grow">
										{State.isEditingProfile ? (
											<div className="flex gap-2 flex-wrap">
												<Input
													size="sm"
													value={
														State.editProfileData
															.FirstName
													}
													onChange={(e) =>
														setState((prev) => ({
															...prev,
															editProfileData: {
																...prev.editProfileData,
																FirstName:
																	e.target
																		.value,
															},
														}))
													}
													placeholder="First Name"
													className="max-w-32"
												/>
												<Input
													size="sm"
													value={
														State.editProfileData
															.LastName
													}
													onChange={(e) =>
														setState((prev) => ({
															...prev,
															editProfileData: {
																...prev.editProfileData,
																LastName:
																	e.target
																		.value,
															},
														}))
													}
													placeholder="Last Name"
													className="max-w-32"
												/>
												<Input
													size="sm"
													value={
														State.editProfileData
															.Username
													}
													onChange={(e) =>
														setState((prev) => ({
															...prev,
															editProfileData: {
																...prev.editProfileData,
																Username:
																	e.target
																		.value,
															},
														}))
													}
													placeholder="Username"
													startContent="@"
													className="max-w-40"
												/>
											</div>
										) : (
											<>
												<p className="text-md font-semibold">
													{
														State.DashboardData.user
															.FirstName
													}{" "}
													{
														State.DashboardData.user
															.LastName
													}
												</p>
												<p className="text-small text-default-500">
													@
													{
														State.DashboardData.user
															.Username
													}
												</p>
											</>
										)}
									</div>{" "}
									<div className="flex gap-2 items-center">
										{State.DashboardData.user.isAdmin && (
											<Chip
												color="warning"
												variant="flat"
												size="sm"
											>
												Admin
											</Chip>
										)}
										{State.DashboardData.user
											.isEmailVerified ? (
											<Chip
												color="success"
												variant="flat"
												size="sm"
												startContent={<Verified />}
											>
												Verified
											</Chip>
										) : (
											<Chip
												color="danger"
												variant="flat"
												size="sm"
											>
												Unverified
											</Chip>
										)}{" "}
										{State.isEditingProfile ? (
											<div className="flex gap-1">
												<Button
													size="sm"
													color="success"
													variant="flat"
													isIconOnly
													onPress={
														handleUpdateProfile
													}
													isLoading={
														State.profileSaveLoading
													}
												>
													<Save />
												</Button>
												<Button
													size="sm"
													color="danger"
													variant="flat"
													isIconOnly
													onPress={() => {
														setState((prev) => ({
															...prev,
															isEditingProfile:
																false,
															editProfileData: {
																FirstName:
																	State
																		.DashboardData!
																		.user
																		.FirstName,
																LastName:
																	State
																		.DashboardData!
																		.user
																		.LastName,
																Username:
																	State
																		.DashboardData!
																		.user
																		.Username,
															},
														}));
													}}
												>
													<Cancel />
												</Button>
											</div>
										) : (
											<Button
												size="sm"
												color="primary"
												variant="flat"
												isIconOnly
												onPress={() =>
													setState((prev) => ({
														...prev,
														isEditingProfile: true,
													}))
												}
											>
												<Edit />
											</Button>
										)}
									</div>
								</CardHeader>
								<Divider />
								<CardBody>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<p className="text-small text-default-500 mb-1">
												Primary Email
											</p>{" "}
											<p className="font-medium">
												{State.DashboardData.user.Emails.find(
													(email) => email.isPrimary
												)?.Email ||
													State.DashboardData.user
														.Emails[0]?.Email ||
													"No email"}
											</p>
										</div>
										<div>
											<p className="text-small text-default-500 mb-1">
												User ID
											</p>{" "}
											<p className="font-mono text-small">
												{
													State.DashboardData.user
														.UserID
												}
											</p>
										</div>
										<div>
											<p className="text-small text-default-500 mb-1">
												Member Since
											</p>
											<p className="font-medium">
												{new Date(
													State.DashboardData.user.createdAt
												).toLocaleDateString()}
											</p>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Quick Stats */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<Card>
									<CardBody className="text-center">
										<div className="flex items-center justify-center mb-2">
											<Security className="text-primary text-2xl" />
										</div>{" "}
										<p className="text-2xl font-bold">
											{
												State.DashboardData.security
													.totalActiveSessions
											}
										</p>
										<p className="text-small text-default-500">
											Active Sessions
										</p>
									</CardBody>
								</Card>
								<Card>
									<CardBody className="text-center">
										<div className="flex items-center justify-center mb-2">
											<Email className="text-success text-2xl" />
										</div>
										<p className="text-2xl font-bold">
											{
												State.DashboardData.user.Emails
													.length
											}
										</p>
										<p className="text-small text-default-500">
											Email Addresses
										</p>
									</CardBody>
								</Card>
								<Card>
									<CardBody className="text-center">
										<div className="flex items-center justify-center mb-2">
											<AccessTime className="text-warning text-2xl" />
										</div>
										<p className="text-small font-bold">
											{new Date(
												State.DashboardData.user.lastLoginAt
											).toLocaleDateString()}
										</p>
										<p className="text-small text-default-500">
											Last Login
										</p>
									</CardBody>
								</Card>
								<Card>
									<CardBody className="text-center">
										<div className="flex items-center justify-center mb-2">
											<VpnKey
												className={`text-2xl ${State.DashboardData.user.isMFA ? "text-success" : "text-danger"}`}
											/>
										</div>
										<p className="text-small font-bold">
											{State.DashboardData.user.isMFA
												? "Enabled"
												: "Disabled"}
										</p>
										<p className="text-small text-default-500">
											Two-Factor Auth
										</p>
									</CardBody>
								</Card>
							</div>
						</div>
					</Tab>

					<Tab
						key="emails"
						title="Email Management"
					>
						<div className="space-y-6 mt-6">
							<div className="flex justify-between items-center">
								<div>
									<h2 className="text-xl font-semibold">
										Email Addresses
									</h2>
									<p className="text-default-500">
										Manage your email addresses and
										verification status
									</p>
								</div>
								<Button
									color="primary"
									startContent={<Add />}
									onPress={onEmailModalOpen}
								>
									Add Email
								</Button>
							</div>{" "}
							<div className="space-y-3">
								{State.DashboardData.user.Emails.map(
									(email, index) => (
										<Card key={index}>
											<CardBody className="flex flex-row items-center justify-between">
												<div className="flex items-center gap-3">
													<Email className="text-default-400" />
													<div>
														<p className="font-medium">
															{email.Email}
														</p>
														<div className="flex gap-2 mt-1">
															{email.isPrimary && (
																<Chip
																	size="sm"
																	color="primary"
																	variant="flat"
																>
																	Primary
																</Chip>
															)}{" "}
															{email.isVerified ? (
																<Chip
																	size="sm"
																	color="success"
																	variant="flat"
																	startContent={
																		<CheckCircle />
																	}
																>
																	Verified
																</Chip>
															) : (
																<Chip
																	size="sm"
																	color="warning"
																	variant="flat"
																>
																	Unverified
																</Chip>
															)}
														</div>
													</div>
												</div>
												<div className="flex gap-2">
													{!email.isVerified && (
														<Button
															size="sm"
															variant="flat"
															color="success"
															onPress={() =>
																handleSendVerificationOTP(
																	email.Email
																)
															}
															isLoading={
																State.emailActionLoading ===
																email.Email
															}
														>
															Verify
														</Button>
													)}{" "}
													{!email.isPrimary &&
														email.isVerified && (
															<Button
																size="sm"
																variant="flat"
																color="primary"
																onPress={() =>
																	handleSetPrimaryEmail(
																		email.Email
																	)
																}
																isLoading={
																	State.emailActionLoading ===
																	email.Email
																}
															>
																Set Primary
															</Button>
														)}{" "}
													{State.DashboardData!.user
														.Emails.length > 1 && (
														<Button
															size="sm"
															variant="flat"
															color="danger"
															isIconOnly
															onPress={() =>
																handleRemoveEmail(
																	email.Email
																)
															}
															isLoading={
																State.emailActionLoading ===
																email.Email
															}
														>
															<Delete />
														</Button>
													)}
												</div>
											</CardBody>
										</Card>
									)
								)}
							</div>
						</div>
					</Tab>

					<Tab
						key="security"
						title="Security & Sessions"
					>
						<div className="space-y-6 mt-6">
							{/* Password Change Section */}
							<Card>
								<CardHeader className="flex justify-between">
									<div className="flex items-center gap-3">
										<Key className="text-warning" />
										<div>
											<p className="text-md font-semibold">
												Password
											</p>
											<p className="text-small text-default-500">
												Change your account password
											</p>
										</div>
									</div>
									<Button
										color="warning"
										variant="flat"
										onPress={onPasswordModalOpen}
									>
										Change Password
									</Button>
								</CardHeader>
							</Card>

							{/* Current Session */}
							<Card>
								<CardHeader>
									<div className="flex items-center gap-3">
										<Security className="text-success" />
										<div>
											<p className="text-md font-semibold">
												Current Session
											</p>
											<p className="text-small text-default-500">
												This device and session
											</p>
										</div>
										<Badge
											color="success"
											variant="flat"
											content="Current"
										>
											<span></span>
										</Badge>
									</div>
								</CardHeader>
								<Divider />
								<CardBody>
									<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
										{" "}
										<div className="flex items-center gap-2">
											{getPlatformIcon(
												State.DashboardData
													.currentSession?.Platform
											)}
											<div>
												<p className="text-small text-default-500">
													Platform
												</p>
												<p className="font-medium">
													{
														State.DashboardData
															.currentSession
															?.Platform
													}
												</p>
											</div>
										</div>
										<div>
											<p className="text-small text-default-500">
												Browser
											</p>
											<p className="font-medium">
												{State.DashboardData
													.currentSession?.Browser ||
													"Chrome"}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<LocationOn className="text-default-400" />
											<div>
												<p className="text-small text-default-500">
													Location
												</p>
												<p className="font-medium">
													{State.DashboardData
														.currentSession
														?.IPDataMappedResponse
														?.city || "Unknown"}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Schedule className="text-default-400" />
											<div>
												<p className="text-small text-default-500">
													Expires
												</p>
												<p className="font-medium">
													{new Date(
														State.DashboardData.currentSession?.ExpiresAt
													).toLocaleDateString()}
												</p>
											</div>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Other Active Sessions */}
							{State.DashboardData.activeSessions?.length > 0 && (
								<Card>
									<CardHeader>
										<div className="flex justify-between items-center w-full">
											<div className="flex items-center gap-3">
												<Security className="text-warning" />
												<div>
													<p className="text-md font-semibold">
														Other Active Sessions
													</p>{" "}
													<p className="text-small text-default-500">
														{
															State.DashboardData
																.activeSessions
																?.length
														}{" "}
														other session(s)
													</p>
												</div>
											</div>{" "}
											<Button
												color="danger"
												variant="flat"
												onPress={
													handleTerminateAllSessions
												}
												isLoading={
													State.sessionActionLoading ===
													"all"
												}
											>
												Terminate All
											</Button>
										</div>
									</CardHeader>
									<Divider />
									<CardBody>
										<div className="space-y-3">
											{State.DashboardData.activeSessions.map(
												(session, index) => (
													<div
														key={session.SessionID}
														className="flex items-center justify-between p-3 border rounded-lg"
													>
														<div className="flex items-center gap-3">
															{getPlatformIcon(
																session.Platform
															)}
															<div>
																{" "}
																<p className="font-medium">
																	{
																		session.Platform
																	}{" "}
																	•{" "}
																	{
																		session.Browser
																	}
																</p>
																<p className="text-small text-default-500">
																	{session
																		.IPDataMappedResponse
																		?.city ||
																		"Unknown location"}{" "}
																	• Last
																	active:{" "}
																	{new Date(
																		session.lastActivity
																	).toLocaleString()}
																</p>
															</div>
														</div>{" "}
														<Button
															size="sm"
															color="danger"
															variant="flat"
															startContent={
																<Logout />
															}
															onPress={() =>
																handleTerminateSession(
																	session.SessionID
																)
															}
															isLoading={
																State.sessionActionLoading ===
																session.SessionID
															}
														>
															Terminate
														</Button>
													</div>
												)
											)}
										</div>
									</CardBody>
								</Card>
							)}
						</div>
					</Tab>

					<Tab
						key="danger"
						title="Danger Zone"
					>
						<div className="space-y-6 mt-6">
							<Card className="border-danger">
								<CardHeader>
									<div className="flex items-center gap-3">
										<DeleteForever className="text-danger" />
										<div>
											<p className="text-md font-semibold text-danger">
												Delete Account
											</p>
											<p className="text-small text-default-500">
												Permanently delete your account
												and all associated data
											</p>
										</div>
									</div>
								</CardHeader>
								<Divider />
								<CardBody>
									<div className="p-4 rounded-lg mb-4">
										<p className="text-danger font-medium mb-2">
											⚠️ Warning
										</p>
										<p className="text-small text-danger">
											This action cannot be undone. This
											will permanently delete your
											account, remove all your data, and
											you will not be able to recover it.
										</p>
									</div>
									<Button
										color="danger"
										variant="solid"
										startContent={<DeleteForever />}
										onPress={onDeleteAccountModalOpen}
									>
										Delete My Account
									</Button>
								</CardBody>
							</Card>
						</div>
					</Tab>
				</Tabs>
			</div>
			{/* Password Change Modal */}
			<Modal
				isOpen={isPasswordModalOpen}
				onClose={onPasswordModalClose}
				size="lg"
			>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Key className="text-warning" />
							Change Password
						</div>
					</ModalHeader>
					<ModalBody>
						<div className="space-y-4">
							{" "}
							<Input
								label="Current Password"
								type={
									State.showPasswords.current
										? "text"
										: "password"
								}
								value={State.passwordData.currentPassword}
								onChange={(e) =>
									setState((prev) => ({
										...prev,
										passwordData: {
											...prev.passwordData,
											currentPassword: e.target.value,
										},
									}))
								}
								endContent={
									<button
										onClick={() =>
											setState((prev) => ({
												...prev,
												showPasswords: {
													...prev.showPasswords,
													current:
														!prev.showPasswords
															.current,
												},
											}))
										}
									>
										{State.showPasswords.current ? (
											<VisibilityOff />
										) : (
											<Visibility />
										)}
									</button>
								}
							/>
							<Input
								label="New Password"
								type={
									State.showPasswords.new
										? "text"
										: "password"
								}
								value={State.passwordData.newPassword}
								onChange={(e) =>
									setState((prev) => ({
										...prev,
										passwordData: {
											...prev.passwordData,
											newPassword: e.target.value,
										},
									}))
								}
								endContent={
									<button
										onClick={() =>
											setState((prev) => ({
												...prev,
												showPasswords: {
													...prev.showPasswords,
													new: !prev.showPasswords
														.new,
												},
											}))
										}
									>
										{State.showPasswords.new ? (
											<VisibilityOff />
										) : (
											<Visibility />
										)}
									</button>
								}
							/>
							{State.passwordData.newPassword && (
								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-small">
											Password strength:
										</span>
										<span
											className={`text-small font-medium ${
												passwordStrength.color ===
												"danger"
													? "text-danger"
													: passwordStrength.color ===
														  "warning"
														? "text-warning"
														: "text-success"
											}`}
										>
											{passwordStrength.label}
										</span>
									</div>
									<Progress
										value={passwordStrength.score}
										color={passwordStrength.color}
										size="sm"
									/>
								</div>
							)}{" "}
							<Input
								label="Confirm New Password"
								type={
									State.showPasswords.confirm
										? "text"
										: "password"
								}
								value={State.passwordData.confirmPassword}
								onChange={(e) =>
									setState((prev) => ({
										...prev,
										passwordData: {
											...prev.passwordData,
											confirmPassword: e.target.value,
										},
									}))
								}
								endContent={
									<button
										onClick={() =>
											setState((prev) => ({
												...prev,
												showPasswords: {
													...prev.showPasswords,
													confirm:
														!prev.showPasswords
															.confirm,
												},
											}))
										}
									>
										{State.showPasswords.confirm ? (
											<VisibilityOff />
										) : (
											<Visibility />
										)}
									</button>
								}
								color={
									State.passwordData.confirmPassword &&
									State.passwordData.newPassword !==
										State.passwordData.confirmPassword
										? "danger"
										: "default"
								}
								errorMessage={
									State.passwordData.confirmPassword &&
									State.passwordData.newPassword !==
										State.passwordData.confirmPassword
										? "Passwords don't match"
										: ""
								}
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="light"
							onPress={onPasswordModalClose}
						>
							Cancel
						</Button>{" "}
						<Button
							color="warning"
							onPress={handleChangePassword}
							isLoading={State.passwordChangeLoading}
							isDisabled={
								!State.passwordData.currentPassword ||
								!State.passwordData.newPassword ||
								State.passwordData.newPassword !==
									State.passwordData.confirmPassword ||
								State.passwordData.newPassword.length < 8
							}
						>
							Change Password
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			{/* Add Email Modal */}
			<Modal
				isOpen={isEmailModalOpen}
				onClose={onEmailModalClose}
			>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Email className="text-primary" />
							Add Email Address
						</div>
					</ModalHeader>
					<ModalBody>
						{" "}
						<Input
							label="Email Address"
							type="email"
							value={State.newEmailData.email}
							onChange={(e) =>
								setState((prev) => ({
									...prev,
									newEmailData: { email: e.target.value },
								}))
							}
							placeholder="Enter new email address"
						/>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="light"
							onPress={onEmailModalClose}
						>
							Cancel
						</Button>{" "}
						<Button
							color="primary"
							onPress={handleAddEmail}
							isLoading={State.emailActionLoading === "add"}
							isDisabled={
								!State.newEmailData.email ||
								!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
									State.newEmailData.email
								)
							}
						>
							Add Email
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			{/* Delete Account Modal */}
			<Modal
				isOpen={isDeleteAccountModalOpen}
				onClose={onDeleteAccountModalClose}
			>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<DeleteForever className="text-danger" />
							Delete Account
						</div>
					</ModalHeader>
					<ModalBody>
						<div className="space-y-4">
							<div className="bg-danger-50 p-4 rounded-lg">
								<p className="text-danger font-medium mb-2">
									⚠️ This action cannot be undone!
								</p>
								<p className="text-small text-danger">
									Deleting your account will permanently
									remove all your data including:
								</p>
								<ul className="text-small text-danger mt-2 ml-4 list-disc">
									<li>Profile information</li>
									<li>Email addresses</li>
									<li>Active sessions</li>
									<li>All associated data</li>
								</ul>
							</div>
							<p className="text-small">
								Type <strong>DELETE</strong> to confirm account
								deletion:
							</p>
							<Input
								placeholder="Type DELETE to confirm"
								color="danger"
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="light"
							onPress={onDeleteAccountModalClose}
						>
							Cancel
						</Button>
						<Button
							color="danger"
							variant="solid"
						>
							Delete Account
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			{/* Email Verification Modal */}
			<Modal
				isOpen={isEmailVerificationModalOpen}
				onClose={onEmailVerificationModalClose}
				size="lg"
			>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Verified className="text-success" />
							Email Verification
						</div>
					</ModalHeader>
					<ModalBody>
						<div className="space-y-4">
							{" "}
							<p className="text-default-500">
								A verification code has been sent to{" "}
								<span className="font-medium">
									{State.emailVerificationData.email}
								</span>
								. Please enter the code below to verify your
								email address.
							</p>
							<Input
								label="Verification Code"
								value={State.emailVerificationData.otp}
								onChange={(e) =>
									setState((prev) => ({
										...prev,
										emailVerificationData: {
											...prev.emailVerificationData,
											otp: e.target.value,
										},
									}))
								}
								placeholder="Enter the verification code"
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="light"
							onPress={onEmailVerificationModalClose}
						>
							Cancel
						</Button>{" "}
						<Button
							color="success"
							onPress={handleVerifyEmail}
							isLoading={
								State.emailVerificationData.verificationLoading
							}
							isDisabled={
								!State.emailVerificationData.otp ||
								State.emailVerificationData.otp.length !== 6
							}
						>
							Verify Email
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}
