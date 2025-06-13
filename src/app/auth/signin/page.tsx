"use client";

import React from "react";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	useDisclosure,
	Input,
	Alert,
	Chip,
	Divider,
} from "@heroui/react";
import {
	PersonAdd,
	AlternateEmail,
	Visibility,
	VisibilityOff,
	Lock,
	Security,
	Login,
	ErrorOutline,
	CheckCircle,
} from "@mui/icons-material";
import { Axios } from "@Utils/Axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import { AccountSwitcher } from "@Components/AccountSwitcher";

interface SigninState {
	username: string;
	password: string;
	isLoading: boolean;
	showPassword: boolean;
	error: string;
	success: string;
}

export default function SignIn() {
	const { isOpen, onOpen } = useDisclosure();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { addAccount, accounts } = useAccountSwitcher();
	const [state, setState] = React.useState<SigninState>({
		username: "",
		password: "",
		isLoading: false,
		showPassword: false,
		error: "",
		success: "",
	});

	// Check if AccountSwitcher should be shown
	const shouldShowAccountSwitcher = React.useMemo(() => {
		const acsParam = searchParams.get("acs");
		return acsParam === "1" && accounts.length > 0;
	}, [searchParams, accounts.length]);

	React.useEffect(() => {
		onOpen();
	}, []);

	const handleInputChange = (field: keyof SigninState, value: string) => {
		setState((prev) => ({
			...prev,
			[field]: value,
			error: "", // Clear error when user types
			success: "",
		}));
	};

	const validateForm = (): boolean => {
		if (!state.username.trim()) {
			setState((prev) => ({ ...prev, error: "Username is required" }));
			return false;
		}

		if (!state.password.trim()) {
			setState((prev) => ({ ...prev, error: "Password is required" }));
			return false;
		}

		if (state.password.length < 6) {
			setState((prev) => ({
				...prev,
				error: "Password must be at least 6 characters",
			}));
			return false;
		}

		return true;
	};

	const handleSignin = async () => {
		if (!validateForm()) return;

		setState((prev) => ({
			...prev,
			isLoading: true,
			error: "",
			success: "",
		}));

		try {
			// Prepare signin request
			const signinData = {
				username: state.username.trim(),
				password: state.password,
			};

			// Send signin request
			const response = await Axios.post("/api/signin", signinData);

			if (response.data.Status === 1) {
				// Success - store the encrypted token
				const encryptedToken = response.data.Data.AuthorisedToken;

				// Store token in localStorage and cookies
				localStorage.setItem("auth-token", encryptedToken);
				document.cookie = `auth-token=${encryptedToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;

				// Get user data for account switcher
				try {
					const dashboardResponse = await Axios.get(
						"/api/dashboard",
						{
							headers: {
								Authorization: `Bearer ${encryptedToken}`,
							},
						}
					);

					if (dashboardResponse.data.Status === 1) {
						const userData = dashboardResponse.data.Data.user;

						// Add account to account switcher
						await addAccount({
							userID: userData.UserID,
							username: userData.Username,
							firstName: userData.FirstName,
							lastName: userData.LastName,
							email:
								userData.Emails?.find(
									(email: any) => email.isPrimary
								)?.Email ||
								userData.Emails?.[0]?.Email ||
								"",
							encryptedToken: encryptedToken,
							profileData: {
								isAdmin:
									userData.isAdmin ||
									userData.Username === "nidhibhingradiya" ||
									false,
								isEmailVerified:
									userData.isEmailVerified || false,
							},
						});
					}
				} catch (accountError) {
					console.warn(
						"Failed to add account to switcher:",
						accountError
					);
					// Continue with signin even if account switcher fails
				}

				setState((prev) => ({
					...prev,
					success: "Signin successful! Redirecting to dashboard...",
					isLoading: false,
				}));

				// Redirect to dashboard after a short delay
				setTimeout(() => {
					router.push("/dashboard");
				}, 1500);
			} else {
				setState((prev) => ({
					...prev,
					error: response.data.Message || "Signin failed",
					isLoading: false,
				}));
			}
		} catch (error: any) {
			console.error("Signin error:", error);

			let errorMessage = "An unexpected error occurred";

			if (error.response?.data?.Message) {
				errorMessage = error.response.data.Message;
			} else if (error.message) {
				errorMessage = error.message;
			}

			setState((prev) => ({
				...prev,
				error: errorMessage,
				isLoading: false,
			}));
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !state.isLoading) {
			handleSignin();
		}
	};

	return (
		<div className="Page CENTER">
			<Modal
				isOpen={isOpen}
				size={"md"}
				onClose={() => {}}
				isDismissable={false}
				isKeyboardDismissDisabled={false}
				closeButton={false}
			>
				<ModalContent>
					<ModalHeader className="flex flex-row items-center gap-4 justify-center">
						<Login />
						Sign In to Your Account
					</ModalHeader>

					<ModalBody className="flex flex-col gap-5 p-6">
						{/* Error Alert */}
						{state.error && (
							<Alert
								description={state.error}
								title="Error"
								color="danger"
								variant="flat"
								startContent={<ErrorOutline />}
							/>
						)}
						{/* Success Alert */}
						{state.success && (
							<Alert
								description={state.success}
								title="Success"
								color="success"
								variant="flat"
								startContent={<CheckCircle />}
							/>
						)}{" "}
						{/* Account Switcher */}
						{shouldShowAccountSwitcher && (
							<div className="flex flex-col gap-2">
								<div className="text-small text-default-500 text-center">
									Or switch to an existing account:
								</div>
								<div className="flex justify-center">
									<AccountSwitcher
										variant="compact"
										showAddAccount={false}
										onAccountChange={(account) => {
											router.push("/dashboard");
										}}
									/>
								</div>
								<Divider />
							</div>
						)}
						{/* Username Input */}
						<Input
							label="Username"
							placeholder="Enter your username"
							startContent={<AlternateEmail />}
							value={state.username}
							onChange={(e) =>
								handleInputChange("username", e.target.value)
							}
							onKeyPress={handleKeyPress}
							isDisabled={state.isLoading}
							variant="bordered"
							size="lg"
						/>
						{/* Password Input */}
						<Input
							label="Password"
							placeholder="Enter your password"
							type={state.showPassword ? "text" : "password"}
							startContent={<Lock />}
							endContent={
								<button
									className="focus:outline-none"
									type="button"
									onClick={() =>
										setState((prev) => ({
											...prev,
											showPassword: !prev.showPassword,
										}))
									}
									disabled={state.isLoading}
								>
									{state.showPassword ? (
										<VisibilityOff className="text-2xl text-default-400 pointer-events-none" />
									) : (
										<Visibility className="text-2xl text-default-400 pointer-events-none" />
									)}
								</button>
							}
							value={state.password}
							onChange={(e) =>
								handleInputChange("password", e.target.value)
							}
							onKeyPress={handleKeyPress}
							isDisabled={state.isLoading}
							variant="bordered"
							size="lg"
						/>
						{/* Security Notice */}
						<div className="flex items-center gap-2 text-small text-default-500">
							<Security className="text-lg" />
							<span>
								Your password is encrypted before transmission
							</span>
						</div>
						{/* Sign Up Link */}
						<div className="text-center text-small">
							<span className="text-default-500">
								Don&apos;t have an account?{" "}
							</span>
							<Button
								variant="light"
								color="primary"
								size="sm"
								onPress={() => router.push("/auth/signup")}
								isDisabled={state.isLoading}
							>
								Sign Up
							</Button>
						</div>
					</ModalBody>

					<ModalFooter className="flex justify-center">
						<Button
							color="primary"
							size="lg"
							onPress={handleSignin}
							isLoading={state.isLoading}
							isDisabled={
								state.isLoading ||
								!state.username.trim() ||
								!state.password.trim()
							}
							className="w-full"
							startContent={!state.isLoading && <PersonAdd />}
						>
							{state.isLoading ? "Signing In..." : "Sign In"}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}
