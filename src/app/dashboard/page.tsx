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
}

interface Session {
	SessionID: string;
	Platform: string;
	Browser: string;
	ExpiresAt: string;
}

interface DashboardData {
	user: User;
	currentSession: Session;
	activeSessions: Array<{
		SessionID: string;
		Platform: string;
		Browser: string;
		LastActivity: string;
		CreatedAt: string;
		Location: string;
	}>;
	security: {
		totalActiveSessions: number;
		lastPasswordChange?: string;
	};
}

export default function Dashboard() {
	const router = useRouter();
	const { accounts, currentAccount, switchAccount, removeAccount, clearAllAccounts } = useAccountSwitcher();
	const [isLoading, setIsLoading] = React.useState(true);
	const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
	const [error, setError] = React.useState("");

	React.useEffect(() => {
		fetchDashboardData();
	}, []);

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
				// Token expired or invalid
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
				// Call logout API
				await Axios.delete("/api/session", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
			}
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			// Try to auto-switch to another account first
			if (currentAccount) {
				// Find other available accounts (excluding current one)
				const otherAccounts = accounts.filter(acc => acc.userID !== currentAccount.userID);
				
				if (otherAccounts.length > 0) {
					// Switch to the most recently used account
					const mostRecentAccount = otherAccounts.sort((a, b) => 
						new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime()
					)[0];
					
					switchAccount(mostRecentAccount);
					// Successfully switched to another account, reload dashboard
					window.location.reload();
					return;
				}
			}

			// No other accounts available, clear session and redirect to signin
			clearAllAccounts();
			router.push("/auth/signin");
		}
	};

	const handleDeactivateOtherSessions = async () => {
		try {
			const token = localStorage.getItem("auth-token");
			const response = await Axios.delete("/api/dashboard", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data.Status === 1) {
				// Refresh dashboard data
				fetchDashboardData();
			}
		} catch (error) {
			console.error("Deactivate sessions error:", error);
		}
	};

	const getPlatformIcon = (platform: string) => {
		switch (platform?.toLowerCase()) {
			case "windows":
			case "linux":
			case "macos":
				return <Computer />;
			case "android":
			case "ios":
				return <Smartphone />;
			default:
				return <Computer />;
		}
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
						variant="compact"
						showAddAccount={true}
						onAccountChange={() => {
							window.location.reload();
						}}
					/>
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
					<div className="flex flex-col">
						<p className="text-md font-semibold">
							{dashboardData.user.FirstName}{" "}
							{dashboardData.user.LastName}
						</p>
						<p className="text-small text-default-500">
							@{dashboardData.user.Username}
						</p>
					</div>
					<div className="flex gap-2 ml-auto">
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
					</div>
				</CardHeader>
				<Divider />
				<CardBody>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p className="text-small text-default-500 mb-1">
								Email
							</p>
							<p className="font-medium">
								{dashboardData.user.Emails.find(
									(email) => email.isPrimary
								)?.Email ||
									dashboardData.user.Emails[0]?.Email ||
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
					</div>
				</CardBody>
			</Card>

			{/* Current Session Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<Security />
						<div>
							<p className="text-md font-semibold">
								Current Session
							</p>
							<p className="text-small text-default-500">
								Your active session details
							</p>
						</div>
					</div>
				</CardHeader>
				<Divider />
				<CardBody>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center gap-2">
							{getPlatformIcon(
								dashboardData.currentSession?.Platform
							)}
							<div>
								<p className="text-small text-default-500">
									Platform
								</p>
								<p className="font-medium">
									{dashboardData.currentSession?.Platform}
								</p>
							</div>
						</div>
						<div>
							<p className="text-small text-default-500">
								Browser
							</p>
							<p className="font-medium">
								{dashboardData.currentSession?.Browser ?? "Chrome"}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<AccessTime />
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

			{/* Active Sessions Card */}
			{dashboardData.activeSessions?.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex justify-between items-center w-full">
							<div className="flex items-center gap-3">
								<Security />
								<div>
									<p className="text-md font-semibold">
										Other Active Sessions
									</p>
									<p className="text-small text-default-500">
										{dashboardData.activeSessions?.length}{" "}
										other session(s)
									</p>
								</div>
							</div>
							<Button
								color="warning"
								variant="flat"
								size="sm"
								onPress={handleDeactivateOtherSessions}
							>
								Deactivate All Others
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
											{getPlatformIcon(session.Platform)}
											<div>
												<p className="font-medium">
													{session.Platform} •{" "}
													{session.Browser}
												</p>
												<p className="text-small text-default-500">
													{session.Location} • Last
													active:{" "}
													{new Date(
														session.LastActivity
													).toLocaleString()}
												</p>
											</div>
										</div>
									</div>
								)
							)}
						</div>
					</CardBody>
				</Card>
			)}

			{/* Security Stats */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<Security />
						<div>
							<p className="text-md font-semibold">
								Security Overview
							</p>
							<p className="text-small text-default-500">
								Account security information
							</p>
						</div>
					</div>
				</CardHeader>
				<Divider />
				<CardBody>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p className="text-small text-default-500 mb-1">
								Total Active Sessions
							</p>
							<p className="text-2xl font-bold">
								{dashboardData.security?.totalActiveSessions}
							</p>
						</div>
						{dashboardData.security?.lastPasswordChange && (
							<div>
								<p className="text-small text-default-500 mb-1">
									Last Password Change
								</p>
								<p className="font-medium">
									{new Date(
										dashboardData.security?.lastPasswordChange
									).toLocaleDateString()}
								</p>
							</div>
						)}
					</div>
				</CardBody>
			</Card>
		</div>
	);
}
