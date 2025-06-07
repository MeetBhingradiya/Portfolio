'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
    CardContent,
    InputAdornment,
    Chip
} from '@mui/material';
import {
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Axios } from '@Utils/Axios';

function CreateUsernameContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [username, setUsername] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [tempToken, setTempToken] = useState('');

    useEffect(() => {
        const token = searchParams.get('tempToken');
        if (token) {
            setTempToken(token);
        } else {
            // Redirect if no temp token
            router.push('/auth/signin');
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (username.length >= 3) {
            const timeoutId = setTimeout(() => {
                checkUsernameAvailability();
            }, 500); // Debounce for 500ms

            return () => clearTimeout(timeoutId);
        } else {
            setUsernameAvailable(null);
        }
    }, [username]);

    const checkUsernameAvailability = async () => {
        if (username.length < 3) return;

        setChecking(true);
        try {
            const response = await Axios.post('/api/username', {
                username: username.trim(),
                checkAvailability: true
            });

            if (response.data.Status === 1) {
                setUsernameAvailable(response.data.Data.available);
            } else {
                setUsernameAvailable(false);
            }
        } catch (err) {
            setUsernameAvailable(false);
        } finally {
            setChecking(false);
        }
    };

    const handleCreateUsername = async () => {
        if (!username.trim() || username.length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        if (!usernameAvailable) {
            setError('Please choose an available username');
            return;
        }

        if (!tempToken) {
            setError('Invalid session. Please try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await Axios.post('/api/username', {
                username: username.trim(),
                tempToken: tempToken
            });

            if (response.data.Status === 1) {
                setSuccess('Username created successfully! Redirecting to dashboard...');
                
                // Store session and redirect
                if (response.data.Data.sessionID) {
                    localStorage.setItem('sessionID', response.data.Data.sessionID);
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 1500);
                }
            } else {
                setError(response.data.Message || 'Failed to create username');
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || 'Failed to create username');
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only alphanumeric characters and underscores
        const cleanValue = value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
        setUsername(cleanValue);
        setUsernameAvailable(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && usernameAvailable && username.length >= 3) {
            handleCreateUsername();
        }
    };

    const getUsernameValidationStatus = () => {
        if (username.length === 0) return null;
        if (username.length < 3) return { color: 'error', message: 'Too short (min 3 characters)' };
        if (checking) return { color: 'info', message: 'Checking availability...' };
        if (usernameAvailable === true) return { color: 'success', message: 'Available!' };
        if (usernameAvailable === false) return { color: 'error', message: 'Not available' };
        return null;
    };

    const validationStatus = getUsernameValidationStatus();

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" mb={4}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/auth/signin')}
                        sx={{ mr: 2 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" fontWeight="bold">
                        Create Username
                    </Typography>
                </Box>

                {/* Alerts */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert 
                        severity="success" 
                        sx={{ mb: 3 }} 
                        icon={<CheckCircleIcon />}
                        onClose={() => setSuccess('')}
                    >
                        {success}
                    </Alert>
                )}

                {/* Username Creation Form */}
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Choose Your Username
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Your username will be used to identify your account. It must be unique and at least 3 characters long.
                        </Typography>
                        
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={handleUsernameChange}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: validationStatus && (
                                    <InputAdornment position="end">
                                        {checking ? (
                                            <CircularProgress size={20} />
                                        ) : usernameAvailable === true ? (
                                            <CheckCircleIcon color="success" />
                                        ) : usernameAvailable === false ? (
                                            <CancelIcon color="error" />
                                        ) : null}
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="Enter your username"
                            sx={{ mb: 2 }}
                        />

                        {/* Validation Status */}
                        {validationStatus && (
                            <Box sx={{ mb: 2 }}>
                                <Chip
                                    label={validationStatus.message}
                                    color={validationStatus.color as any}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                        )}

                        {/* Username Rules */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="textSecondary">
                                Username rules:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                <Typography component="li" variant="caption" color="textSecondary">
                                    3-20 characters long
                                </Typography>
                                <Typography component="li" variant="caption" color="textSecondary">
                                    Letters, numbers, and underscores only
                                </Typography>
                                <Typography component="li" variant="caption" color="textSecondary">
                                    Must be unique
                                </Typography>
                            </Box>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleCreateUsername}
                            disabled={loading || !usernameAvailable || username.length < 3}
                            sx={{ 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Create Username'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Help Text */}
                <Box textAlign="center" mt={3}>
                    <Typography variant="body2" color="textSecondary">
                        Need help?{' '}
                        <Button
                            variant="text"
                            onClick={() => router.push('/contact')}
                            sx={{ textTransform: 'none' }}
                        >
                            Contact Support
                        </Button>
                    </Typography>
                </Box>
            </Paper>        </Container>
    );
}

export default function CreateUsernamePage() {
    return (
        <Suspense fallback={
            <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Loading...
                    </Typography>
                </Paper>
            </Container>
        }>
            <CreateUsernameContent />
        </Suspense>
    );
}
