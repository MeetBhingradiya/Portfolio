"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Card,
    CardContent
} from "@mui/material";
import {
    Email as EmailIcon,
    CheckCircle as CheckCircleIcon,
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import { Axios } from "@Utils/Axios";

function EmailVerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        }
    }, [searchParams]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleVerifyOTP = async () => {
        if (!otp.trim() || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        if (!email.trim()) {
            setError("Email address is required");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await Axios.put("/api/email/verify/otp", {
                email: email.toLowerCase().trim(),
                otp: otp.trim()
            });

            if (response.data.Status === 1) {
                setSuccess("Email verified successfully! Redirecting...");

                // Check if username creation is required
                if (response.data.Data?.requiresUsername) {
                    setTimeout(() => {
                        router.push(
                            `/auth/create-username?tempToken=${response.data.Data.tempToken}`
                        );
                    }, 1500);
                } else {
                    setTimeout(() => {
                        router.push("/dashboard");
                    }, 1500);
                }
            } else {
                setError(response.data.Message || "Invalid OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!email.trim()) {
            setError("Email address is required");
            return;
        }

        setResending(true);
        setError("");

        try {
            const response = await Axios.post("/api/email/verify/otp", {
                email: email.toLowerCase().trim(),
                resend: true
            });

            if (response.data.Status === 1) {
                setSuccess("New OTP sent to your email address");
                setResendCooldown(60); // 60 second cooldown
            } else {
                setError(response.data.Message || "Failed to resend OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to resend OTP");
        } finally {
            setResending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && otp.length === 6) {
            handleVerifyOTP();
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
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push("/auth/signin")}
                        sx={{ mr: 2 }}>
                        Back
                    </Button>
                    <Typography
                        variant="h4"
                        fontWeight="bold">
                        Verify Email
                    </Typography>
                </Box>

                {/* Email Display */}
                {email && (
                    <Card
                        variant="outlined"
                        sx={{ mb: 3 }}>
                        <CardContent>
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={2}>
                                <EmailIcon color="primary" />
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="textSecondary">
                                        Verification email sent to:
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontWeight="bold">
                                        {email}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}

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

                {/* OTP Input */}
                <Card variant="outlined">
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom>
                            Enter Verification Code
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 3 }}>
                            Please enter the 6-digit code we sent to your email
                            address
                        </Typography>

                        <TextField
                            fullWidth
                            label="Verification Code"
                            value={otp}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value
                                        .replace(/[^0-9]/g, "")
                                        .slice(0, 6)
                                )
                            }
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            inputProps={{
                                maxLength: 6,
                                style: {
                                    textAlign: "center",
                                    letterSpacing: "0.5em",
                                    fontSize: "1.2em"
                                }
                            }}
                            placeholder="000000"
                            sx={{ mb: 3 }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleVerifyOTP}
                            disabled={loading || otp.length !== 6}
                            sx={{
                                "mb": 2,
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
                                "Verify Email"
                            )}
                        </Button>

                        <Box textAlign="center">
                            <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ mb: 1 }}>
                                Didn&apos;t receive the code?
                            </Typography>
                            <Button
                                variant="text"
                                onClick={handleResendOTP}
                                disabled={resending || resendCooldown > 0}
                                startIcon={
                                    resending ? (
                                        <CircularProgress size={16} />
                                    ) : (
                                        <RefreshIcon />
                                    )
                                }
                                sx={{ textTransform: "none" }}>
                                {resendCooldown > 0
                                    ? `Resend in ${resendCooldown}s`
                                    : resending
                                      ? "Sending..."
                                      : "Resend Code"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Help Text */}
                <Box
                    textAlign="center"
                    mt={3}>
                    <Typography
                        variant="body2"
                        color="textSecondary">
                        Having trouble? Check your spam folder or{" "}
                        <Button
                            variant="text"
                            onClick={() => router.push("/contact")}
                            sx={{ textTransform: "none" }}>
                            contact support
                        </Button>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}

export default function EmailVerificationPage() {
    return (
        <Suspense
            fallback={
                <Container
                    maxWidth="sm"
                    sx={{ mt: 8, mb: 4 }}>
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <CircularProgress />
                        <Typography
                            variant="body1"
                            sx={{ mt: 2 }}>
                            Loading...
                        </Typography>
                    </Paper>
                </Container>
            }>
            <EmailVerificationContent />
        </Suspense>
    );
}
