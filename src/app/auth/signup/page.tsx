"use client";

import React, { Suspense, useState, useEffect } from "react";
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
	Divider,
	Progress,
	RadioGroup,
	Radio,
	InputOtp,
	CircularProgress,
} from "@heroui/react";
import {
	PersonAdd,
	Email,
	Person,
	Shield,
	Verified,
	AlternateEmail,
	Visibility,
	VisibilityOff,
	Male,
	Female,
	Transgender,
	ArrowBack,
	ArrowForward,
	CheckCircle,
	ErrorOutline,
	Security,
	Send,
	Check,
	Password,
	Fingerprint,
} from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers-pro";
import { AdapterLuxon } from "@mui/x-date-pickers-pro/AdapterLuxon";
import { motion, AnimatePresence } from "framer-motion";
import { Axios } from "@Utils/Axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import { AccountSwitcher } from "@Components/AccountSwitcher";
import { IGender } from "@Types/Gender";
import { Config } from "@Config/index";
import { DateTime } from "luxon";

// Animation variants for framer-motion
const containerVariants = {
	hidden: { opacity: 0, y: 50 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			ease: "easeOut",
			staggerChildren: 0.1,
		},
	},
	exit: {
		opacity: 0,
		y: -50,
		transition: { duration: 0.3 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, x: -20 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.4 },
	},
};

const stepVariants = {
	enter: {
		x: 300,
		opacity: 0,
	},
	center: {
		zIndex: 1,
		x: 0,
		opacity: 1,
	},
	exit: {
		zIndex: 0,
		x: -300,
		opacity: 0,
	},
};

// Step progress component
const StepProgress = ({
	currentStep,
	totalSteps,
}: {
	currentStep: number;
	totalSteps: number;
}) => {
	const progress = ((currentStep + 1) / totalSteps) * 100;

	return (
		<div className="w-full mb-6">
			<div className="flex justify-between items-center mb-2">
				<span className="text-sm font-medium text-default-600">
					Step {currentStep + 1} of {totalSteps}
				</span>
				<span className="text-sm font-medium text-primary">
					{Math.round(progress)}%
				</span>
			</div>
			<Progress
				value={progress}
				className="h-2"
				color="primary"
				classNames={{
					track: "bg-default-200/50 backdrop-blur-sm",
					indicator: "bg-gradient-to-r from-primary to-secondary",
				}}
			/>
		</div>
	);
};

// Steps configuration
const steps = [
	{
		key: "email",
		title: "Email Verification",
		description: "Enter your email address",
		icon: <Email />,
	},
	{
		key: "basic",
		title: "Basic Information",
		description: "Tell us about yourself",
		icon: <Person />,
	},
	{
		key: "auth",
		title: "Security Setup",
		description: "Create your password",
		icon: <Shield />,
	},
	{
		key: "verify",
		title: "Email Verification",
		description: "Verify your email address",
		icon: <Verified />,
	},
	{
		key: "username",
		title: "Choose Username",
		description: "Pick your unique username",
		icon: <AlternateEmail />,
	},
];

interface IState {
	// Step 1: Email
	Email: string;
	S2_isERROR: boolean;
	S2_Message: string;

	// Step 2: Basic Info
	Fname: string;
	Lname: string;
	Gender: IGender;
	DOB: DateTime | null;

	// Step 3: Create Password
	Password: string;
	Visible: boolean;
	S3_isERROR: boolean;
	S3_Message: string;

	// Step 4: Verify Email
	Otp: string;
	OtpTrys: number;
	S4_isERROR: boolean;
	S4_Message: string;

	// Step 5: Create Username
	Username: string;
	S5_isERROR: boolean;
	S5_Message: string;

	// Additional states for enhanced features
	isPasskeySupported: boolean;
	usePasskey: boolean;
	isLoading: boolean;
	successMessage: string;
}

const Genders = [
	{ key: IGender.MALE, label: "Male", icon: <Male /> },
	{ key: IGender.FEMALE, label: "Female", icon: <Female /> },
	{ key: IGender.TRANSGENDER, label: "Transgender", icon: <Transgender /> },
];

function SignUpForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { Accounts } = useAccountSwitcher();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const [inProgress, setInProgress] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);

	const [State, setState] = useState<IState>({
		Fname: "",
		Lname: "",
		Gender: IGender.FEMALE,
		DOB: DateTime.now(),

		Email: "",
		S2_isERROR: false,
		S2_Message: "",

		Password: "",
		Visible: false,
		S3_isERROR: false,
		S3_Message: "",

		Otp: "",
		OtpTrys: 0,
		S4_isERROR: false,
		S4_Message: "",

		Username: "",
		S5_isERROR: false,
		S5_Message: "",

		isPasskeySupported: false,
		usePasskey: false,
		isLoading: false,
		successMessage: "",
	});

	// Check for passkey support
	useEffect(() => {
		if (typeof window !== "undefined" && window.PublicKeyCredential) {
			setState((prev) => ({ ...prev, isPasskeySupported: true }));
		}
	}, []);

	useEffect(() => {
		onOpen();
	}, [onOpen]);

	// Utility functions
	const togglePasswordVisibility = () => {
		setState((prev) => ({ ...prev, Visible: !prev.Visible }));
	};

	const clearErrors = () => {
		setState((prev) => ({
			...prev,
			S2_isERROR: false,
			S2_Message: "",
			S3_isERROR: false,
			S3_Message: "",
			S4_isERROR: false,
			S4_Message: "",
			S5_isERROR: false,
			S5_Message: "",
		}));
	};

	const updateField = (field: string, value: any) => {
		setState((prev) => ({ ...prev, [field]: value }));
		clearErrors();
	};

	// Enhanced validation functions
	const validateStep1 = async (): Promise<boolean> => {
		if (inProgress) return false;
		setInProgress(true);
		clearErrors();

		// Email validation
		if (!State.Email.trim()) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message: "Email is required",
			}));
			setInProgress(false);
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(State.Email)) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message: "Please enter a valid email address",
			}));
			setInProgress(false);
			return false;
		}

		// Check for whitelisted domains
		const domain = State.Email.split("@")[1].toLowerCase();
		const allowedDomains = [
			"gmail.com",
			"outlook.com",
			"yahoo.com",
			"hotmail.com",
		];
		if (!allowedDomains.includes(domain)) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message:
					"Please use a supported email provider (Gmail, Outlook, Yahoo)",
			}));
			setInProgress(false);
			return false;
		}

		// Check email availability with server
		try {
			const response = await Axios.post("/api/email", {
				email: State.Email,
			});

			if (response.data.Status === 1) {
				if (
					response.data.StatusCode ===
					Config.StatusCodes.UsernameRequired
				) {
					setCurrentStep(4);
					setState((prev) => ({
						...prev,
						S2_isERROR: true,
						S2_Message: response.data.Message,
					}));
					setInProgress(false);
					return false;
				}

				if (
					response.data.StatusCode ===
					Config.StatusCodes.VerificationRequired
				) {
					setCurrentStep(3);
					setState((prev) => ({
						...prev,
						S2_isERROR: true,
						S2_Message: response.data.Message,
					}));
					setInProgress(false);
					return false;
				}

				if (response.data.StatusCode === 200) {
					setInProgress(false);
					return true;
				}
			}

			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message: response.data.Message || "Email validation failed",
			}));
			setInProgress(false);
			return false;
		} catch (error: any) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message:
					error?.response?.data?.Message || "Server error occurred",
			}));
			setInProgress(false);
			return false;
		}
	};

	const validateStep2 = async (): Promise<boolean> => {
		if (inProgress) return false;
		setInProgress(true);
		clearErrors();

		if (!State.Fname.trim()) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message: "First name is required",
			}));
			setInProgress(false);
			return false;
		}

		if (!State.Lname.trim()) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message: "Last name is required",
			}));
			setInProgress(false);
			return false;
		}

		if (State.Gender === IGender.UNSPECIFIED) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message: "Please select your gender",
			}));
			setInProgress(false);
			return false;
		}

		if (!State.DOB) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message: "Date of birth is required",
			}));
			setInProgress(false);
			return false;
		}

		// Check if user is at least 13 years old
		const age = Math.floor(DateTime.now().diff(State.DOB!, "years").years);
		if (age < 13) {
			setState((prev) => ({
				...prev,
				S2_isERROR: true,
				S2_Message:
					"You must be at least 13 years old to create an account",
			}));
			setInProgress(false);
			return false;
		}

		setInProgress(false);
		return true;
	};

	const validateStep3 = async (): Promise<boolean> => {
		if (inProgress) return false;
		setInProgress(true);
		clearErrors();

		if (!State.Password) {
			setState((prev) => ({
				...prev,
				S3_isERROR: true,
				S3_Message: "Password is required",
			}));
			setInProgress(false);
			return false;
		}

		// Password strength validation
		const passwordChecks = [
			{
				test: State.Password.length >= 8,
				message: "at least 8 characters",
			},
			{
				test: /[a-z]/.test(State.Password),
				message: "a lowercase letter",
			},
			{
				test: /[A-Z]/.test(State.Password),
				message: "an uppercase letter",
			},
			{ test: /[0-9]/.test(State.Password), message: "a number" },
			{
				test: /[!@#$%^&*(),.?":{}|<>]/.test(State.Password),
				message: "a special character",
			},
		];

		for (const check of passwordChecks) {
			if (!check.test) {
				setState((prev) => ({
					...prev,
					S3_isERROR: true,
					S3_Message: `Password must contain ${check.message}`,
				}));
				setInProgress(false);
				return false;
			}
		}

		// Create account on server
		try {
			const response = await Axios.post("/api/signup", {
				email: State.Email,
				password: State.Password,
				firstname: State.Fname,
				lastname: State.Lname,
				dateofbirth: State.DOB?.toFormat("yyyy-MM-dd"),
				gender: State.Gender,
			});

			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					successMessage:
						"Account created successfully! Please verify your email.",
				}));
				setInProgress(false);
				return true;
			}

			setState((prev) => ({
				...prev,
				S3_isERROR: true,
				S3_Message: response.data.Message || "Failed to create account",
			}));
			setInProgress(false);
			return false;
		} catch (error: any) {
			setState((prev) => ({
				...prev,
				S3_isERROR: true,
				S3_Message:
					error?.response?.data?.Message ||
					"Failed to create account",
			}));
			setInProgress(false);
			return false;
		}
	};

	const validateStep4 = async (): Promise<boolean> => {
		if (inProgress) return false;
		setInProgress(true);
		clearErrors();

		if (!State.Otp || State.Otp.length !== 6) {
			setState((prev) => ({
				...prev,
				S4_isERROR: true,
				S4_Message: "Please enter the 6-digit verification code",
			}));
			setInProgress(false);
			return false;
		}

		try {
			const response = await Axios.put("/api/email/verify/otp", {
				email: State.Email,
				otp: State.Otp,
			});

			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					successMessage: "Email verified successfully!",
				}));
				setInProgress(false);
				return true;
			}

			setState((prev) => ({
				...prev,
				S4_isERROR: true,
				S4_Message:
					response.data.Message || "Invalid verification code",
				OtpTrys: prev.OtpTrys + 1,
			}));
			setInProgress(false);
			return false;
		} catch (error: any) {
			setState((prev) => ({
				...prev,
				S4_isERROR: true,
				S4_Message:
					error?.response?.data?.Message || "Verification failed",
				OtpTrys: prev.OtpTrys + 1,
			}));
			setInProgress(false);
			return false;
		}
	};

	const validateStep5 = async (): Promise<boolean> => {
		if (inProgress) return false;
		setInProgress(true);
		clearErrors();

		if (!State.Username.trim()) {
			setState((prev) => ({
				...prev,
				S5_isERROR: true,
				S5_Message: "Username is required",
			}));
			setInProgress(false);
			return false;
		}

		if (State.Username.length < 3) {
			setState((prev) => ({
				...prev,
				S5_isERROR: true,
				S5_Message: "Username must be at least 3 characters",
			}));
			setInProgress(false);
			return false;
		}

		if (State.Username.length > 20) {
			setState((prev) => ({
				...prev,
				S5_isERROR: true,
				S5_Message: "Username must be less than 20 characters",
			}));
			setInProgress(false);
			return false;
		}

		if (!/^[a-zA-Z0-9_]+$/.test(State.Username)) {
			setState((prev) => ({
				...prev,
				S5_isERROR: true,
				S5_Message:
					"Username can only contain letters, numbers, and underscores",
			}));
			setInProgress(false);
			return false;
		}

		try {
			const response = await Axios.post("/api/username", {
				email: State.Email,
				username: State.Username,
			});

			if (response.data.Status === 1) {
				setState((prev) => ({
					...prev,
					successMessage: "Account created successfully!",
				}));

				// Redirect to signin page with success message
				setTimeout(() => {
					router.push(
						"/auth/signin?message=Account created successfully! Please sign in."
					);
				}, 1500);

				setInProgress(false);
				return true;
			}

			setState((prev) => ({
				...prev,
				S5_isERROR: true,
				S5_Message:
					response.data.Message || "Username is not available",
			}));
			setInProgress(false);
			return false;
		} catch (error: any) {
			setState((prev) => ({
				...prev,
				S5_isERROR: true,
				S5_Message:
					error?.response?.data?.Message ||
					"Failed to create username",
			}));
			setInProgress(false);
			return false;
		}
	};

	const handleNextStep = async () => {
		setState((prev) => ({ ...prev, isLoading: true }));

		let isValid = false;
		switch (currentStep) {
			case 0:
				isValid = await validateStep1();
				break;
			case 1:
				isValid = await validateStep2();
				break;
			case 2:
				isValid = await validateStep3();
				break;
			case 3:
				isValid = await validateStep4();
				break;
			case 4:
				isValid = await validateStep5();
				break;
		}

		if (isValid && currentStep < steps.length - 1) {
			setCompletedSteps((prev) => [...prev, currentStep]);
			setCurrentStep((prev) => prev + 1);
		}

		setState((prev) => ({ ...prev, isLoading: false }));
	};

	const handlePreviousStep = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
			clearErrors();
		}
	};

	const redirectUrl = React.useMemo(() => {
		const ref = searchParams.get("ref");
		return ref ? decodeURIComponent(ref) : "/dashboard";
	}, [searchParams]);

	const shouldShowAccountSwitcher = React.useMemo(() => {
		const acsParam = searchParams.get("acs");
		return acsParam === "1" || Accounts.length > 0;
	}, [searchParams, Accounts.length]);

	// Render step content
	const renderStepContent = () => {
		const currentStepData = steps[currentStep];
		const hasError =
			State.S2_isERROR ||
			State.S3_isERROR ||
			State.S4_isERROR ||
			State.S5_isERROR;
		const errorMessage =
			State.S2_Message ||
			State.S3_Message ||
			State.S4_Message ||
			State.S5_Message;

		return (
			<AnimatePresence mode="wait">
				<motion.div
					key={currentStep}
					variants={stepVariants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{
						x: { type: "spring", stiffness: 300, damping: 30 },
						opacity: { duration: 0.2 },
					}}
					className="w-full"
				>
					<div className="text-center mb-6">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, type: "spring" }}
							className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4 shadow-lg"
						>
							{currentStepData.icon}
						</motion.div>
						<motion.h3
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="text-xl font-semibold text-foreground mb-2"
						>
							{currentStepData.title}
						</motion.h3>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							className="text-default-500"
						>
							{currentStepData.description}
						</motion.p>
					</div>

					{/* Error Message */}
					{hasError && (
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							className="mb-4"
						>
							<Alert
								title="Error"
								description={errorMessage}
								color="danger"
								variant="flat"
								startContent={<ErrorOutline />}
							/>
						</motion.div>
					)}

					{/* Success Message */}
					{State.successMessage && (
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							className="mb-4"
						>
							<Alert
								title="Success"
								description={State.successMessage}
								color="success"
								variant="flat"
								startContent={<CheckCircle />}
							/>
						</motion.div>
					)}

					{/* Step Content */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className="space-y-4"
					>
						{currentStep === 0 && (
							<>
								{shouldShowAccountSwitcher && (
									<div className="flex flex-col gap-2 mb-4">
										<div className="text-small text-default-500 text-center">
											Or use an existing account:
										</div>
										<div className="flex justify-center">
											<AccountSwitcher
												variant="compact"
												showAddAccount={false}
												onAccountChange={(account) => {
													router.push(redirectUrl);
												}}
											/>
										</div>
										<Divider />
									</div>
								)}

								<Input
									label="Email Address"
									type="email"
									placeholder="Enter your email address"
									startContent={<Email />}
									value={State.Email}
									onChange={(e) =>
										updateField("Email", e.target.value)
									}
									variant="bordered"
									size="lg"
									isDisabled={State.isLoading}
									autoComplete="email"
									classNames={{
										input: "bg-transparent",
										inputWrapper:
											"backdrop-blur-sm bg-white/20 border-white/20",
									}}
								/>

								<div className="text-xs text-default-500 mt-2">
									We support Gmail, Outlook, and Yahoo email
									addresses
								</div>
							</>
						)}

						{currentStep === 1 && (
							<>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Input
										label="First Name"
										placeholder="Enter your first name"
										startContent={<Person />}
										value={State.Fname}
										onChange={(e) =>
											updateField("Fname", e.target.value)
										}
										variant="bordered"
										size="lg"
										isDisabled={State.isLoading}
										autoComplete="given-name"
										classNames={{
											input: "bg-transparent",
											inputWrapper:
												"backdrop-blur-sm bg-white/20 border-white/20",
										}}
									/>

									<Input
										label="Last Name"
										placeholder="Enter your last name"
										startContent={<Person />}
										value={State.Lname}
										onChange={(e) =>
											updateField("Lname", e.target.value)
										}
										variant="bordered"
										size="lg"
										isDisabled={State.isLoading}
										autoComplete="family-name"
										classNames={{
											input: "bg-transparent",
											inputWrapper:
												"backdrop-blur-sm bg-white/20 border-white/20",
										}}
									/>
								</div>

								<RadioGroup
									label="Gender"
									value={State.Gender}
									onValueChange={(value) =>
										updateField("Gender", value as IGender)
									}
									orientation="horizontal"
									className="flex justify-center"
									isDisabled={State.isLoading}
								>
									{Genders.map((gender) => (
										<Radio
											key={gender.key}
											value={gender.key}
											className="mr-4"
										>
											<div className="flex items-center gap-2">
												{gender.icon}
												{gender.label}
											</div>
										</Radio>
									))}
								</RadioGroup>

								<LocalizationProvider
									dateAdapter={AdapterLuxon}
								>
									<DatePicker
										label="Date of Birth"
										value={State.DOB}
										onChange={(newValue: DateTime | null) =>
											updateField("DOB", newValue)
										}
										disabled={State.isLoading}
										slotProps={{
											textField: {
												variant: "outlined",
												fullWidth: true,
												size: "medium",
												autoComplete: "bday",
											},
										}}
										maxDate={DateTime.now().minus({
											years: 13,
										})}
									/>
								</LocalizationProvider>
							</>
						)}

						{currentStep === 2 && (
							<>
								<Input
									label="Password"
									type={State.Visible ? "text" : "password"}
									placeholder="Create a strong password"
									startContent={<Shield />}
									endContent={
										<button
											className="focus:outline-none"
											type="button"
											onClick={togglePasswordVisibility}
											disabled={State.isLoading}
										>
											{State.Visible ? (
												<VisibilityOff className="text-2xl text-default-400 pointer-events-none" />
											) : (
												<Visibility className="text-2xl text-default-400 pointer-events-none" />
											)}
										</button>
									}
									value={State.Password}
									onChange={(e) =>
										updateField("Password", e.target.value)
									}
									variant="bordered"
									size="lg"
									isDisabled={State.isLoading}
									autoComplete="new-password"
									classNames={{
										input: "bg-transparent",
										inputWrapper:
											"backdrop-blur-sm bg-white/20 border-white/20",
									}}
								/>

								{State.isPasskeySupported && (
									<div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
										<Fingerprint className="text-primary" />
										<div className="flex-1 text-sm">
											<div className="font-medium">
												Passkey Available
											</div>
											<div className="text-default-500">
												You can set up a passkey after
												creating your account
											</div>
										</div>
									</div>
								)}

								<div className="text-xs text-default-500 space-y-1">
									<div>Password requirements:</div>
									<ul className="list-disc list-inside space-y-1 ml-2">
										<li>At least 8 characters long</li>
										<li>
											Contains uppercase and lowercase
											letters
										</li>
										<li>Contains at least one number</li>
										<li>
											Contains at least one special
											character
										</li>
									</ul>
								</div>
							</>
						)}

						{currentStep === 3 && (
							<>
								<div className="text-center mb-6">
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{
											delay: 0.3,
											type: "spring",
										}}
										className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4"
									>
										<Send className="text-primary" />
									</motion.div>
									<p className="text-default-600">
										We&apos;ve sent a verification code to{" "}
										<strong>{State.Email}</strong>
									</p>
									<p className="text-sm text-default-500 mt-2">
										Please check your email and enter the
										6-digit code below
									</p>
								</div>

								<div className="flex justify-center">
									<InputOtp
										length={6}
										size="lg"
										value={State.Otp}
										onValueChange={(value) =>
											updateField("Otp", value)
										}
										className="w-full max-w-md"
										isDisabled={State.isLoading}
									/>
								</div>

								{State.OtpTrys > 0 && (
									<div className="text-center text-sm text-warning">
										{State.OtpTrys >= 3
											? "Too many attempts. Please try again later."
											: `Attempt ${State.OtpTrys} of 3`}
									</div>
								)}

								<div className="text-center">
									<Button
										variant="light"
										size="sm"
										onPress={() => {
											// Resend OTP logic here
											console.log("Resend OTP");
										}}
										isDisabled={
											State.isLoading ||
											State.OtpTrys >= 3
										}
									>
										Didn&apos;t receive the code? Resend
									</Button>
								</div>
							</>
						)}

						{currentStep === 4 && (
							<>
								<Input
									label="Username"
									placeholder="Choose your unique username"
									startContent={<AlternateEmail />}
									value={State.Username}
									onChange={(e) =>
										updateField("Username", e.target.value)
									}
									variant="bordered"
									size="lg"
									isDisabled={State.isLoading}
									autoComplete="username"
									classNames={{
										input: "bg-transparent",
										inputWrapper:
											"backdrop-blur-sm bg-white/20 border-white/20",
									}}
								/>

								<div className="text-xs text-default-500 space-y-1">
									<div>Username requirements:</div>
									<ul className="list-disc list-inside space-y-1 ml-2">
										<li>3-20 characters long</li>
										<li>
											Letters, numbers, and underscores
											only
										</li>
										<li>Must be unique</li>
									</ul>
								</div>
							</>
						)}
					</motion.div>
				</motion.div>
			</AnimatePresence>
		);
	};

	return (
		<div
			className="Page CENTER"
			style={{
				background: `
					radial-gradient(ellipse at top, rgba(120, 119, 198, 0.3), transparent 50%),
					radial-gradient(ellipse at bottom, rgba(255, 45, 83, 0.3), transparent 50%),
					radial-gradient(ellipse at left, rgba(74, 222, 128, 0.3), transparent 50%),
					radial-gradient(ellipse at right, rgba(251, 191, 36, 0.3), transparent 50%),
					linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)
				`,
				minHeight: "100vh",
			}}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md"
			>
				<Modal
					isOpen={isOpen}
					onOpenChange={onOpenChange}
					size="2xl"
					scrollBehavior="inside"
					classNames={{
						base: "bg-transparent",
						wrapper: "bg-transparent",
						backdrop: "bg-black/50 backdrop-blur-sm",
					}}
					isDismissable={false}
					isKeyboardDismissDisabled={false}
					hideCloseButton={true}
				>
					<ModalContent className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
						{(onClose) => (
							<>
								<ModalHeader className="flex flex-col gap-1 items-center text-center">
									<motion.div
										initial={{ opacity: 0, y: -20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="flex items-center gap-3"
									>
										<PersonAdd className="text-2xl text-primary" />
										<span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
											Create New Account
										</span>
									</motion.div>

									{/* Step Progress */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 }}
										className="w-full mt-4"
									>
										<StepProgress
											currentStep={currentStep}
											totalSteps={steps.length}
										/>
									</motion.div>
								</ModalHeader>

								<ModalBody className="px-6 py-4">
									{renderStepContent()}
								</ModalBody>

								<ModalFooter className="flex justify-between px-6 py-4">
									<motion.div
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.6 }}
									>
										{currentStep > 0 && (
											<Button
												variant="light"
												onPress={handlePreviousStep}
												isDisabled={State.isLoading}
												startContent={<ArrowBack />}
											>
												Previous
											</Button>
										)}
									</motion.div>

									<motion.div
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.6 }}
									>
										{currentStep < steps.length - 1 ? (
											<Button
												color="primary"
												onPress={handleNextStep}
												isLoading={State.isLoading}
												isDisabled={State.isLoading}
												endContent={
													!State.isLoading && (
														<ArrowForward />
													)
												}
												className="bg-gradient-to-r from-primary to-secondary"
											>
												{State.isLoading
													? "Processing..."
													: "Next"}
											</Button>
										) : (
											<Button
												color="success"
												onPress={handleNextStep}
												isLoading={State.isLoading}
												isDisabled={State.isLoading}
												endContent={
													!State.isLoading && (
														<Check />
													)
												}
												className="bg-gradient-to-r from-success to-success-600"
											>
												{State.isLoading
													? "Creating Account..."
													: "Create Account"}
											</Button>
										)}
									</motion.div>
								</ModalFooter>

								{/* Sign In Link */}
								<div className="text-center pb-4 px-6">
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.7 }}
									>
										<span className="text-sm text-default-500">
											Already have an account?{" "}
										</span>
										<Button
											variant="light"
											color="primary"
											size="sm"
											onPress={() => {
												const signinUrl = new URL(
													"/auth/signin",
													window.location.origin
												);
												if (searchParams.get("ref")) {
													signinUrl.searchParams.set(
														"ref",
														searchParams.get("ref")!
													);
												}
												router.push(
													signinUrl.toString()
												);
											}}
											isDisabled={State.isLoading}
											className="text-primary hover:text-primary-600"
										>
											Sign In
										</Button>
									</motion.div>
								</div>
							</>
						)}
					</ModalContent>
				</Modal>
			</motion.div>
		</div>
	);
}

// Loading component for Suspense fallback
function SignUpLoading() {
	return (
		<div
			className="Page CENTER"
			style={{
				background: `
					radial-gradient(ellipse at top, rgba(120, 119, 198, 0.3), transparent 50%),
					radial-gradient(ellipse at bottom, rgba(255, 45, 83, 0.3), transparent 50%),
					radial-gradient(ellipse at left, rgba(74, 222, 128, 0.3), transparent 50%),
					radial-gradient(ellipse at right, rgba(251, 191, 36, 0.3), transparent 50%),
					linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)
				`,
				minHeight: "100vh",
			}}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
			>
				<Modal
					isOpen={true}
					size="2xl"
					classNames={{
						base: "bg-transparent",
						backdrop: "bg-black/50 backdrop-blur-sm",
					}}
					isDismissable={false}
				>
					<ModalContent className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
						<ModalHeader className="flex flex-col gap-1 items-center text-center">
							<div className="flex items-center gap-3">
								<PersonAdd className="text-2xl text-primary" />
								<span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
									Create New Account
								</span>
							</div>
						</ModalHeader>
						<ModalBody className="flex justify-center items-center py-12">
							<div className="flex flex-col items-center gap-4">
								<CircularProgress
									size="lg"
									color="primary"
									classNames={{
										svg: "w-16 h-16",
									}}
								/>
								<p className="text-default-500">
									Loading signup form...
								</p>
							</div>
						</ModalBody>
					</ModalContent>
				</Modal>
			</motion.div>
		</div>
	);
}

export default function SignUp() {
	return (
		<Suspense fallback={<SignUpLoading />}>
			<SignUpForm />
		</Suspense>
	);
}
