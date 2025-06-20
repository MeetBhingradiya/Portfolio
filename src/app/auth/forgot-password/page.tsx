"use client";

import React, { useState } from "react";
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    InputAdornment,
    IconButton
} from "@mui/material";
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Axios } from "@Utils/Axios";

const steps = ["Enter Email", "Verify OTP", "Reset Password"];

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form data
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSendOTP = async () => {
        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await Axios.post("/api/password/forgot", {
                email: email.toLowerCase().trim()
            });

            if (response.data.Status === 1) {
                setSuccess("OTP sent to your email address");
                setActiveStep(1);
            } else {
                setError(response.data.Message || "Failed to send OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };
    const handleVerifyOTP = async () => {
        if (!otp.trim() || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Use the password reset OTP verification endpoint
            const response = await Axios.put("/api/password/verify/otp", {
                email: email.toLowerCase().trim(),
                otp: otp.trim()
            });

            if (response.data.Status === 1) {
                setSuccess("OTP verified successfully");
                setActiveStep(2);
            } else {
                setError(response.data.Message || "Invalid OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };
    const handleResetPassword = async () => {
        if (!newPassword.trim() || newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await Axios.put("/api/password/reset", {
                email: email.toLowerCase().trim(),
                otp: otp.trim(),
                newPassword: newPassword.trim()
            });

            if (response.data.Status === 1) {
                setSuccess(
                    "Password reset successfully! Redirecting to login..."
                );
                setTimeout(() => {
                    router.push("/auth/signin");
                }, 2000);
            } else {
                setError(response.data.Message || "Failed to reset password");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
            setError("");
            setSuccess("");
        } else {
            router.push("/auth/signin");
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box>
                        <Typography
                            variant="h6"
                            gutterBottom>
                            Enter your email address
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 3 }}>
                            We&apos;ll send you an OTP to reset your password
                        </Typography>
                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSendOTP}
                            disabled={loading || !email.trim()}
                            sx={{
                                "background":
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                "&:hover": {
                                    background:
                                        "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                                }
                            }}>
                            {loading ? (
                                <CircularProgress size={24} />
                            ) : (
                                "Send OTP"
                            )}
                        </Button>
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography
                            variant="h6"
                            gutterBottom>
                            Verify OTP
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 3 }}>
                            Enter the 6-digit code sent to {email}
                        </Typography>
                        <TextField
                            fullWidth
                            label="OTP Code"
                            value={otp}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value
                                        .replace(/[^0-9]/g, "")
                                        .slice(0, 6)
                                )
                            }
                            disabled={loading}
                            inputProps={{
                                maxLength: 6,
                                style: {
                                    textAlign: "center",
                                    letterSpacing: "0.5em"
                                }
                            }}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleVerifyOTP}
                            disabled={loading || otp.length !== 6}
                            sx={{
                                "background":
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                "&:hover": {
                                    background:
                                        "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                                }
                            }}>
                            {loading ? (
                                <CircularProgress size={24} />
                            ) : (
                                "Verify OTP"
                            )}
                        </Button>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography
                            variant="h6"
                            gutterBottom>
                            Set New Password
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 3 }}>
                            Choose a strong password for your account
                        </Typography>
                        <TextField
                            fullWidth
                            label="New Password"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            edge="end">
                                            {showPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                            edge="end">
                                            {showConfirmPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleResetPassword}
                            disabled={
                                loading ||
                                !newPassword.trim() ||
                                !confirmPassword.trim()
                            }
                            sx={{
                                "background":
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                "&:hover": {
                                    background:
                                        "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                                }
                            }}>
                            {loading ? (
                                <CircularProgress size={24} />
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Container
            maxWidth="sm"
            sx={{ mt: 8, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                {/* Header */}
                <Box
                    display="flex"
                    alignItems="center"
                    mb={4}>
                    <IconButton
                        onClick={handleBack}
                        sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography
                        variant="h4"
                        fontWeight="bold">
                        Reset Password
                    </Typography>
                </Box>

                {/* Stepper */}
                <Stepper
                    activeStep={activeStep}
                    sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Alerts */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{ mb: 3 }}
                        icon={<CheckCircleIcon />}
                        onClose={() => setSuccess("")}>
                        {success}
                    </Alert>
                )}

                {/* Step Content */}
                <Card variant="outlined">
                    <CardContent>{renderStepContent()}</CardContent>
                </Card>

                {/* Footer */}
                <Box
                    textAlign="center"
                    mt={3}>
                    <Typography
                        variant="body2"
                        color="textSecondary">
                        Remember your password?{" "}
                        <Button
                            variant="text"
                            onClick={() => router.push("/auth/signin")}
                            sx={{ textTransform: "none" }}>
                            Sign In
                        </Button>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
