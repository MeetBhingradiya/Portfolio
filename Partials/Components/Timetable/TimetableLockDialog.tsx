import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Chip,
    IconButton
} from '@mui/material';
import { Lock, LockOpen, Security, Close } from '@mui/icons-material';
import { Timetable, TimetableLockRequest, TimetableUnlockRequest } from '../../Types/Timetable';
import Axios from 'axios';

interface TimetableLockDialogProps {
    open: boolean;
    onClose: () => void;
    timetable: Timetable | null;
    onSuccess: () => void;
}

const TimetableLockDialog: React.FC<TimetableLockDialogProps> = ({
    open,
    onClose,
    timetable,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Lock form state
    const [lockReason, setLockReason] = useState('');
    const [unlockCode, setUnlockCode] = useState('');
    const [useUnlockCode, setUseUnlockCode] = useState(false);
    const [allowedEditorsText, setAllowedEditorsText] = useState('');
    
    // Unlock form state
    const [unlockCodeInput, setUnlockCodeInput] = useState('');

    const handleClose = () => {
        setError(null);
        setLockReason('');
        setUnlockCode('');
        setUseUnlockCode(false);
        setAllowedEditorsText('');
        setUnlockCodeInput('');
        onClose();
    };

    const handleLock = async () => {
        if (!timetable) return;

        setLoading(true);
        setError(null);

        try {
            const allowedEditors = allowedEditorsText
                .split(',')
                .map(email => email.trim())
                .filter(email => email.length > 0);

            const lockData: TimetableLockRequest = {
                lockReason: lockReason.trim() || 'Locked for security',
                ...(useUnlockCode && unlockCode && { unlockCode }),
                ...(allowedEditors.length > 0 && { allowedEditors })
            };

            await Axios.post(`/api/timetable/${timetable._id}/lock`, lockData);
            
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to lock timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (!timetable) return;

        setLoading(true);
        setError(null);

        try {
            const unlockData: TimetableUnlockRequest = {
                ...(unlockCodeInput && { unlockCode: unlockCodeInput }),
                userId: 'system_admin' // In a real system, this would come from auth
            };

            await Axios.delete(`/api/timetable/${timetable._id}/lock`, { data: unlockData });
            
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to unlock timetable');
        } finally {
            setLoading(false);
        }
    };

    const isLocked = timetable?.isLocked || false;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isLocked ? (
                    <>
                        <LockOpen color="warning" />
                        Unlock Timetable
                    </>
                ) : (
                    <>
                        <Lock color="primary" />
                        Lock Timetable
                    </>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <IconButton onClick={handleClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {timetable && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {timetable.title}
                        </Typography>
                        
                        {isLocked && (
                            <Box sx={{ mb: 2 }}>
                                <Chip
                                    icon={<Lock />}
                                    label="Locked"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ mb: 1 }}
                                />
                                {timetable.lockReason && (
                                    <Typography variant="body2" color="text.secondary">
                                        Reason: {timetable.lockReason}
                                    </Typography>
                                )}
                                {timetable.lockedBy && (
                                    <Typography variant="body2" color="text.secondary">
                                        Locked by: {timetable.lockedBy}
                                    </Typography>
                                )}
                                {timetable.lockedAt && (
                                    <Typography variant="body2" color="text.secondary">
                                        Locked at: {new Date(timetable.lockedAt).toLocaleString()}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {isLocked ? (
                    // Unlock form
                    <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            This timetable is currently locked to prevent unauthorized modifications.
                            Enter the unlock code if you have permission to unlock it.
                        </Typography>
                        
                        <TextField
                            fullWidth
                            label="Unlock Code"
                            type="password"
                            value={unlockCodeInput}
                            onChange={(e) => setUnlockCodeInput(e.target.value)}
                            placeholder="Enter unlock code (if required)"
                            sx={{ mb: 2 }}
                        />
                        
                        <Alert severity="info">
                            <Typography variant="body2">
                                <strong>Note:</strong> Only authorized users can unlock this timetable.
                                If you don&apos;t have an unlock code, you may still be able to unlock it if you&apos;re the owner.
                            </Typography>
                        </Alert>
                    </Box>
                ) : (
                    // Lock form
                    <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Locking this timetable will prevent unauthorized users from editing or deleting it.
                            This is useful for protecting finalized timetables in a public system.
                        </Typography>
                        
                        <TextField
                            fullWidth
                            label="Lock Reason"
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            placeholder="e.g., Finalized for semester, Under review, etc."
                            sx={{ mb: 2 }}
                        />
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={useUnlockCode}
                                    onChange={(e) => setUseUnlockCode(e.target.checked)}
                                />
                            }
                            label="Require unlock code"
                            sx={{ mb: 2 }}
                        />
                        
                        {useUnlockCode && (
                            <TextField
                                fullWidth
                                label="Unlock Code"
                                type="password"
                                value={unlockCode}
                                onChange={(e) => setUnlockCode(e.target.value)}
                                placeholder="Create a secure unlock code"
                                sx={{ mb: 2 }}
                            />
                        )}
                        
                        <TextField
                            fullWidth
                            label="Allowed Editors (Optional)"
                            value={allowedEditorsText}
                            onChange={(e) => setAllowedEditorsText(e.target.value)}
                            placeholder="user1@example.com, user2@example.com"
                            helperText="Comma-separated list of user IDs who can edit even when locked"
                            sx={{ mb: 2 }}
                        />
                        
                        <Alert severity="warning" icon={<Security />}>
                            <Typography variant="body2">
                                <strong>Warning:</strong> Once locked, this timetable cannot be edited or deleted 
                                without proper authorization. Make sure you have the unlock code or administrative access.
                            </Typography>
                        </Alert>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={isLocked ? handleUnlock : handleLock}
                    variant="contained"
                    color={isLocked ? "warning" : "primary"}
                    disabled={loading || (!isLocked && !lockReason.trim())}
                    startIcon={loading ? <CircularProgress size={20} /> : (isLocked ? <LockOpen /> : <Lock />)}
                >
                    {loading ? 'Processing...' : (isLocked ? 'Unlock Timetable' : 'Lock Timetable')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TimetableLockDialog;
