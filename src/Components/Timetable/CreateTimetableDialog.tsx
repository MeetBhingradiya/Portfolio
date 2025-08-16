'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { 
    CreateTimetableRequest, 
    DayOfWeek, 
    Batch, 
    ProgramType
} from '@/Types/Timetable';
import { useTimetable } from './TimetableProvider';

interface CreateTimetableDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTimetableDialog: React.FC<CreateTimetableDialogProps> = ({
    open,
    onClose,
    onSuccess
}) => {
    const { createTimetable } = useTimetable();
    
    const [formData, setFormData] = useState<CreateTimetableRequest>({
        title: '',
        metadata: {
            academicYear: new Date().getFullYear().toString(),
            semester: 'Fall',
            batch: Batch.A,
            programName: '',
            programType: ProgramType.D2D,
            publishDate: new Date(),
            validFrom: new Date()
        },
        subjects: [],
        visibleDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
        timeSlots: [
            { startTime: '09:00', endTime: '10:00' },
            { startTime: '10:00', endTime: '11:00' },
            { startTime: '11:00', endTime: '12:00' },
            { startTime: '13:00', endTime: '14:00' },
            { startTime: '14:00', endTime: '15:00' },
            { startTime: '15:00', endTime: '16:00' },
            { startTime: '16:00', endTime: '17:00' }
        ]
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError('Please enter a timetable title');
            return;
        }
        
        if (!formData.metadata.programName.trim()) {
            setError('Please enter a program name');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            await createTimetable(formData);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Create New Timetable</DialogTitle>
            
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    {/* Basic Information */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Basic Information
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Timetable Title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g., Computer Engineering - Semester 5"
                            />
                            
                            <TextField
                                fullWidth
                                label="Program Name"
                                value={formData.metadata.programName}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    metadata: { ...prev.metadata, programName: e.target.value }
                                }))}
                                placeholder="e.g., Computer Engineering"
                            />
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Batch</InputLabel>
                                    <Select
                                        value={formData.metadata.batch}
                                        label="Batch"
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            metadata: { ...prev.metadata, batch: e.target.value as Batch }
                                        }))}
                                    >
                                        {Object.values(Batch).map(batch => (
                                            <MenuItem key={batch} value={batch}>{batch}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                
                                <FormControl fullWidth>
                                    <InputLabel>Program Type</InputLabel>
                                    <Select
                                        value={formData.metadata.programType}
                                        label="Program Type"
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            metadata: { ...prev.metadata, programType: e.target.value as ProgramType }
                                        }))}
                                    >
                                        {Object.values(ProgramType).map(type => (
                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                
                                <TextField
                                    fullWidth
                                    label="Academic Year"
                                    value={formData.metadata.academicYear}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        metadata: { ...prev.metadata, academicYear: e.target.value }
                                    }))}
                                />
                            </Box>
                            
                            <TextField
                                fullWidth
                                label="Semester"
                                value={formData.metadata.semester}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    metadata: { ...prev.metadata, semester: e.target.value }
                                }))}
                                placeholder="e.g., Fall 2024, Spring 2025"
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading}
                    startIcon={<Add />}
                >
                    {loading ? 'Creating...' : 'Create Timetable'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateTimetableDialog;
