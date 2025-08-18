import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import { Lock, LockOpen, Security } from '@mui/icons-material';
import Axios from 'axios';

const TimetableLockAdmin: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [unlockCode, setUnlockCode] = useState('admin123');
    const [customLockCode, setCustomLockCode] = useState('demo123');

    const handleLockAll = async () => {
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await Axios.post('/api/timetable/demo-lock', {
                action: 'lock-all',
                lockCode: unlockCode
            });

            setMessage(`${response.data.message}. Unlock code: ${response.data.unlockCode}`);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to lock timetables');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlockAll = async () => {
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await Axios.post('/api/timetable/demo-lock', {
                action: 'unlock-all'
            });

            setMessage(response.data.message);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to unlock timetables');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <Security color="primary" />
                    <Typography variant="h5" fontWeight="600">
                        Timetable Lock Administration
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={3}>
                    This admin panel allows you to demonstrate the timetable locking functionality.
                    In a production environment, this would be secured and only accessible to administrators.
                </Typography>

                {message && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {message}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                        label="Master Unlock Code"
                        value={unlockCode}
                        onChange={(e) => setUnlockCode(e.target.value)}
                        placeholder="admin123"
                        helperText="This code will be required to unlock all timetables"
                    />

                    <Box display="flex" gap={2}>
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
                            onClick={handleLockAll}
                            disabled={loading || !unlockCode.trim()}
                            fullWidth
                        >
                            {loading ? 'Locking...' : 'Lock All Timetables'}
                        </Button>

                        <Button
                            variant="contained"
                            color="success"
                            startIcon={loading ? <CircularProgress size={20} /> : <LockOpen />}
                            onClick={handleUnlockAll}
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? 'Unlocking...' : 'Unlock All Timetables'}
                        </Button>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" color="text.secondary">
                        How to Use Lock System:
                    </Typography>
                    
                    <Typography variant="body2" component="div">
                        <ol>
                            <li><strong>Lock a timetable:</strong> Use the lock button in the timetable list or view page</li>
                            <li><strong>Unlock a timetable:</strong> Click the unlock button and enter the unlock code</li>
                            <li><strong>Locked behavior:</strong> 
                                <ul>
                                    <li>Edit and Delete buttons are disabled</li>
                                    <li>API calls return 403 error for unauthorized changes</li>
                                    <li>Lock status is visible in the UI</li>
                                </ul>
                            </li>
                            <li><strong>Demo unlock codes:</strong>
                                <ul>
                                    <li>Master unlock: <code>{unlockCode}</code></li>
                                    <li>Demo timetables: <code>demo123</code></li>
                                </ul>
                            </li>
                        </ol>
                    </Typography>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Note:</strong> In a real production environment, you would integrate this with your 
                            authentication system to control who can lock/unlock timetables. The current implementation 
                            is designed for demonstration in a public system.
                        </Typography>
                    </Alert>
                </Box>
            </Paper>
        </Box>
    );
};

export default TimetableLockAdmin;
