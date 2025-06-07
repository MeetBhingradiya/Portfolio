"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box, Typography } from '@mui/material';

export default function SignInRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new login page
        router.replace('/auth/signin');
    }, [router]);

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                gap: 2
            }}
        >
            <CircularProgress />
            <Typography>Redirecting to sign in...</Typography>
        </Box>
    );
}