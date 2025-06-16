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
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";

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

export default function Dashboard() {
	const router = useRouter();
	const {
		accounts,
		currentAccount,
		switchAccount,
		removeAccount,
		clearAllAccounts,
	} = useAccountSwitcher();

	// State management
	const [isLoading, setIsLoading] = React.useState(true);
	const [dashboardData, setDashboardData] =
		React.useState<DashboardData | null>(null);
	const [error, setError] = React.useState("");
	const [activeTab, setActiveTab] = React.useState("overview");

	// Edit profile state
	const [editProfileData, setEditProfileData] =
		React.useState<EditProfileData>({
			FirstName: "",
			LastName: "",
			Username: "",
		});
	const [isEditingProfile, setIsEditingProfile] = React.useState(false);
	const [profileSaveLoading, setProfileSaveLoading] = React.useState(false);

	// Password change state
	const [passwordData, setPasswordData] = React.useState<PasswordChangeData>({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showPasswords, setShowPasswords] = React.useState({
		current: false,
		new: false,
		confirm: false,
	});
	const [passwordChangeLoading, setPasswordChangeLoading] =
		React.useState(false);

	// Email management state
	const [newEmailData, setNewEmailData] = React.useState<NewEmailData>({
		email: "",
	});
	const [emailActionLoading, setEmailActionLoading] = React.useState("");

	// Session management state
	const [sessionActionLoading, setSessionActionLoading] = React.useState("");

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

	React.useEffect(() => {
		fetchDashboardData();
	}, []);

	React.useEffect(() => {
		if (dashboardData?.user) {
			setEditProfileData({
				FirstName: dashboardData.user.FirstName,
				LastName: dashboardData.user.LastName,
				Username: dashboardData.user.Username,
			});
		}
	}, [dashboardData]);

	const fetchDashboardData = async () => {
		try {
			const token = localStorage.getItem("auth-token");
			if (!token) {
				router.push("/auth/signin");
				return;
			}

			const response = await Axios.get("/api/dashboard", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data.Status === 1) {
				setDashboardData(response.data.Data);
			} else {
				setError(response.data.Message || "Failed to load dashboard");
			}
		} catch (error: any) {
			console.error("Dashboard fetch error:", error);
			if (error.response?.status === 401) {
				localStorage.removeItem("auth-token");
				router.push("/auth/signin");
			} else {
				setError("Failed to load dashboard data");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignOut = async () => {
		try {
			const token = localStorage.getItem("auth-token");
			if (token) {
				await Axios.delete("/api/session", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
			}
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			if (currentAccount) {
				const otherAccounts = accounts.filter(
					(acc) => acc.userID !== currentAccount.userID
				);

				if (otherAccounts.length > 0) {
					const mostRecentAccount = otherAccounts.sort(
						(a, b) =>
							new Date(b.lastUsed || 0).getTime() -
							new Date(a.lastUsed || 0).getTime()
					)[0];

					switchAccount(mostRecentAccount);
					window.location.reload();
					return;
				}
			}

			clearAllAccounts();
			router.push("/auth/signin");
		}
	};

	const handleUpdateProfile = async () => {
		setProfileSaveLoading(true);
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.patch(
				"/api/profile",
				editProfileData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.Status === 1) {
				setIsEditingProfile(false);
				fetchDashboardData(); // Refresh data
			} else {
				setError(response.data.Message || "Failed to update profile");
			}
		} catch (error: any) {
			setError(
				error?.response?.data?.Message || "Failed to update profile"
			);
		} finally {
			setProfileSaveLoading(false);
		}
	};

	const handleChangePassword = async () => {
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setError("New passwords don't match");
			return;
		}

		if (passwordData.newPassword.length < 8) {
			setError("Password must be at least 8 characters long");
			return;
		}

		setPasswordChangeLoading(true);
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.patch(
				"/api/password",
				{
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.Status === 1) {
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
				onPasswordModalClose();
				// Show success message or refresh data
			} else {
				setError(response.data.Message || "Failed to change password");
			}
		} catch (error: any) {
			setError(
				error?.response?.data?.Message || "Failed to change password"
			);
		} finally {
			setPasswordChangeLoading(false);
		}
	};

	const handleAddEmail = async () => {
		setEmailActionLoading("add");
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.post(
				"/api/emails",
				{
					email: newEmailData.email,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.Status === 1) {
				setNewEmailData({ email: "" });
				onEmailModalClose();
				fetchDashboardData();
			} else {
				setError(response.data.Message || "Failed to add email");
			}
		} catch (error: any) {
			setError(error?.response?.data?.Message || "Failed to add email");
		} finally {
			setEmailActionLoading("");
		}
	};

	const handleRemoveEmail = async (email: string) => {
		setEmailActionLoading(email);
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.delete(
				`/api/emails?email=${encodeURIComponent(email)}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setError(response.data.Message || "Failed to remove email");
			}
		} catch (error: any) {
			setError(
				error?.response?.data?.Message || "Failed to remove email"
			);
		} finally {
			setEmailActionLoading("");
		}
	};

	const handleSetPrimaryEmail = async (email: string) => {
		setEmailActionLoading(email);
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.patch(
				"/api/emails",
				{
					email,
					setPrimary: true,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setError(
					response.data.Message || "Failed to set primary email"
				);
			}
		} catch (error: any) {
			setError(
				error?.response?.data?.Message || "Failed to set primary email"
			);
		} finally {
			setEmailActionLoading("");
		}
	};

	const handleTerminateSession = async (sessionID: string) => {
		setSessionActionLoading(sessionID);
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.delete(`/api/session/${sessionID}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setError(
					response.data.Message || "Failed to terminate session"
				);
			}
		} catch (error: any) {
			setError(
				error?.response?.data?.Message || "Failed to terminate session"
			);
		} finally {
			setSessionActionLoading("");
		}
	};

	const handleTerminateAllSessions = async () => {
		setSessionActionLoading("all");
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.delete("/api/session", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data.Status === 1) {
				fetchDashboardData();
			} else {
				setError(
					response.data.Message || "Failed to terminate sessions"
				);
			}
		} catch (error: any) {
			setError(
				error?.response?.data?.Message || "Failed to terminate sessions"
			);
		} finally {
			setSessionActionLoading("");
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Spinner size="lg" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<Warning className="text-6xl text-danger" />
				<p className="text-lg text-danger">{error}</p>
				<Button
					color="primary"
					onPress={() => fetchDashboardData()}
				>
					Try Again
				</Button>
			</div>
		);
	}

	if (!dashboardData) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p>No data available</p>
			</div>
		);
	}

	const passwordStrength = getPasswordStrength(passwordData.newPassword);

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header with Account Switcher */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-4">
					<DashboardIcon sx={{ fontSize: "2rem" }} />
					<div>
						<h1 className="text-3xl font-bold">Dashboard</h1>
						<p className="text-default-500">
							Welcome back, {dashboardData.user.FirstName}!
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
					{dashboardData.user.isAdmin && (
						<Tooltip content="Admin Panel">
							<Button
								color="secondary"
								variant="flat"
								isIconOnly
								onPress={() => router.push("/admin/tickets")}
							>
								<AdminPanelSettings />
							</Button>
						</Tooltip>
					)}
					<Button
						color="danger"
						variant="flat"
						startContent={<ExitToApp />}
						onPress={handleSignOut}
					>
						Sign Out
					</Button>
				</div>
			</div>

			{/* Error Alert */}
			{error && (
				<Card className="border-danger bg-danger-50">
					<CardBody className="flex flex-row items-center gap-3">
						<ErrorIcon className="text-danger" />
						<p className="text-danger font-medium">{error}</p>
						<Button
							size="sm"
							variant="light"
							color="danger"
							onPress={() => setError("")}
						>
							Dismiss
						</Button>
					</CardBody>
				</Card>
			)}

			{/* Main Content Tabs */}
			<div className="w-full">
				<Tabs
					selectedKey={activeTab}
					onSelectionChange={(key) => setActiveTab(key.toString())}
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
									/>
									<div className="flex flex-col flex-grow">
										{isEditingProfile ? (
											<div className="flex gap-2 flex-wrap">
												<Input
													size="sm"
													value={
														editProfileData.FirstName
													}
													onChange={(e) =>
														setEditProfileData(
															(prev) => ({
																...prev,
																FirstName:
																	e.target
																		.value,
															})
														)
													}
													placeholder="First Name"
													className="max-w-32"
												/>
												<Input
													size="sm"
													value={
														editProfileData.LastName
													}
													onChange={(e) =>
														setEditProfileData(
															(prev) => ({
																...prev,
																LastName:
																	e.target
																		.value,
															})
														)
													}
													placeholder="Last Name"
													className="max-w-32"
												/>
												<Input
													size="sm"
													value={
														editProfileData.Username
													}
													onChange={(e) =>
														setEditProfileData(
															(prev) => ({
																...prev,
																Username:
																	e.target
																		.value,
															})
														)
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
														dashboardData.user
															.FirstName
													}{" "}
													{
														dashboardData.user
															.LastName
													}
												</p>
												<p className="text-small text-default-500">
													@
													{
														dashboardData.user
															.Username
													}
												</p>
											</>
										)}
									</div>
									<div className="flex gap-2 items-center">
										{dashboardData.user.isAdmin && (
											<Chip
												color="warning"
												variant="flat"
												size="sm"
											>
												Admin
											</Chip>
										)}
										{dashboardData.user.isEmailVerified ? (
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
										)}
										{isEditingProfile ? (
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
														profileSaveLoading
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
														setIsEditingProfile(
															false
														);
														setEditProfileData({
															FirstName:
																dashboardData
																	.user
																	.FirstName,
															LastName:
																dashboardData
																	.user
																	.LastName,
															Username:
																dashboardData
																	.user
																	.Username,
														});
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
													setIsEditingProfile(true)
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
											</p>
											<p className="font-medium">
												{dashboardData.user.Emails.find(
													(email) => email.isPrimary
												)?.Email ||
													dashboardData.user.Emails[0]
														?.Email ||
													"No email"}
											</p>
										</div>
										<div>
											<p className="text-small text-default-500 mb-1">
												User ID
											</p>
											<p className="font-mono text-small">
												{dashboardData.user.UserID}
											</p>
										</div>
										<div>
											<p className="text-small text-default-500 mb-1">
												Member Since
											</p>
											<p className="font-medium">
												{new Date(
													dashboardData.user.createdAt
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
										</div>
										<p className="text-2xl font-bold">
											{
												dashboardData.security
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
											{dashboardData.user.Emails.length}
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
												dashboardData.user.lastLoginAt
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
												className={`text-2xl ${dashboardData.user.isMFA ? "text-success" : "text-danger"}`}
											/>
										</div>
										<p className="text-small font-bold">
											{dashboardData.user.isMFA
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
							</div>

							<div className="space-y-3">
								{dashboardData.user.Emails.map(
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
															)}
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
													{!email.isPrimary && (
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
																emailActionLoading ===
																email.Email
															}
														>
															Set Primary
														</Button>
													)}
													{dashboardData.user.Emails
														.length > 1 && (
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
																emailActionLoading ===
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
										<div className="flex items-center gap-2">
											{getPlatformIcon(
												dashboardData.currentSession
													?.Platform
											)}
											<div>
												<p className="text-small text-default-500">
													Platform
												</p>
												<p className="font-medium">
													{
														dashboardData
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
												{dashboardData.currentSession
													?.Browser || "Chrome"}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<LocationOn className="text-default-400" />
											<div>
												<p className="text-small text-default-500">
													Location
												</p>
												<p className="font-medium">
													{dashboardData
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
														dashboardData.currentSession?.ExpiresAt
													).toLocaleDateString()}
												</p>
											</div>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Other Active Sessions */}
							{dashboardData.activeSessions?.length > 0 && (
								<Card>
									<CardHeader>
										<div className="flex justify-between items-center w-full">
											<div className="flex items-center gap-3">
												<Security className="text-warning" />
												<div>
													<p className="text-md font-semibold">
														Other Active Sessions
													</p>
													<p className="text-small text-default-500">
														{
															dashboardData
																.activeSessions
																?.length
														}{" "}
														other session(s)
													</p>
												</div>
											</div>
											<Button
												color="danger"
												variant="flat"
												onPress={
													handleTerminateAllSessions
												}
												isLoading={
													sessionActionLoading ===
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
											{dashboardData.activeSessions.map(
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
														</div>
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
																sessionActionLoading ===
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
									<div className="bg-danger-50 p-4 rounded-lg mb-4">
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
							<Input
								label="Current Password"
								type={
									showPasswords.current ? "text" : "password"
								}
								value={passwordData.currentPassword}
								onChange={(e) =>
									setPasswordData((prev) => ({
										...prev,
										currentPassword: e.target.value,
									}))
								}
								endContent={
									<button
										onClick={() =>
											setShowPasswords((prev) => ({
												...prev,
												current: !prev.current,
											}))
										}
									>
										{showPasswords.current ? (
											<VisibilityOff />
										) : (
											<Visibility />
										)}
									</button>
								}
							/>
							<Input
								label="New Password"
								type={showPasswords.new ? "text" : "password"}
								value={passwordData.newPassword}
								onChange={(e) =>
									setPasswordData((prev) => ({
										...prev,
										newPassword: e.target.value,
									}))
								}
								endContent={
									<button
										onClick={() =>
											setShowPasswords((prev) => ({
												...prev,
												new: !prev.new,
											}))
										}
									>
										{showPasswords.new ? (
											<VisibilityOff />
										) : (
											<Visibility />
										)}
									</button>
								}
							/>
							{passwordData.newPassword && (
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
							)}
							<Input
								label="Confirm New Password"
								type={
									showPasswords.confirm ? "text" : "password"
								}
								value={passwordData.confirmPassword}
								onChange={(e) =>
									setPasswordData((prev) => ({
										...prev,
										confirmPassword: e.target.value,
									}))
								}
								endContent={
									<button
										onClick={() =>
											setShowPasswords((prev) => ({
												...prev,
												confirm: !prev.confirm,
											}))
										}
									>
										{showPasswords.confirm ? (
											<VisibilityOff />
										) : (
											<Visibility />
										)}
									</button>
								}
								color={
									passwordData.confirmPassword &&
									passwordData.newPassword !==
										passwordData.confirmPassword
										? "danger"
										: "default"
								}
								errorMessage={
									passwordData.confirmPassword &&
									passwordData.newPassword !==
										passwordData.confirmPassword
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
						</Button>
						<Button
							color="warning"
							onPress={handleChangePassword}
							isLoading={passwordChangeLoading}
							isDisabled={
								!passwordData.currentPassword ||
								!passwordData.newPassword ||
								passwordData.newPassword !==
									passwordData.confirmPassword ||
								passwordData.newPassword.length < 8
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
						<Input
							label="Email Address"
							type="email"
							value={newEmailData.email}
							onChange={(e) =>
								setNewEmailData({ email: e.target.value })
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
						</Button>
						<Button
							color="primary"
							onPress={handleAddEmail}
							isLoading={emailActionLoading === "add"}
							isDisabled={
								!newEmailData.email ||
								!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
									newEmailData.email
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
		</div>
	);
}
