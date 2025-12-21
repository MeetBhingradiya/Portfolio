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
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    IconButton,
    Chip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { 
    Add, 
    Delete, 
    ExpandMore 
} from '@mui/icons-material';
import { 
    CreateTimetableRequest, 
    DayOfWeek, 
    Batch, 
    ProgramType,
    SubjectSlotType,
    Subject,
    TimeSlot,
    SubjectOption,
    ClassroomOption,
    FacultyOption
} from '../../Types/Timetable';
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { createTimetable } = useTimetable();
    
    const [formData, setFormData] = useState<CreateTimetableRequest>({
        title: '',
        metadata: {
            academicYear: new Date().getFullYear().toString(),
            semester: '3',
            batch: Batch.A,
            programName: '',
            programType: ProgramType.D2D,
            publishDate: new Date(),
            validFrom: new Date()
        },
        subjects: [],
        visibleDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
        timeSlots: [
            { startTime: '09:00 AM', endTime: '10:00 AM' },
            { startTime: '10:00 AM', endTime: '11:00 AM' },
            { startTime: '11:00 AM', endTime: '12:00 PM' },
            { startTime: '01:00 PM', endTime: '02:00 PM' },
            { startTime: '02:00 PM', endTime: '03:00 PM' },
            { startTime: '03:00 PM', endTime: '04:00 PM' },
            { startTime: '04:00 PM', endTime: '05:00 PM' }
        ],
        availableSubjects: [],
        availableClassrooms: [],
        availableFaculty: []
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper functions for managing form data
    const updateMetadata = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [field]: value }
        }));
    };

    const handleAddTimeSlot = () => {
        setFormData(prev => ({
            ...prev,
            timeSlots: [...prev.timeSlots, { startTime: '09:00 AM', endTime: '10:00 AM' }]
        }));
    };

    const handleRemoveTimeSlot = (index: number) => {
        setFormData(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter((_, i) => i !== index)
        }));
    };

    const handleTimeSlotChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        setFormData(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.map((slot, i) => 
                i === index ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const handleAddSubject = () => {
        setFormData(prev => ({
            ...prev,
            subjects: [...prev.subjects, {
                code: '',
                name: '',
                type: SubjectSlotType.LECTURE,
                faculty: '',
                room: {
                    buildingCode: '',
                    floorNumber: 0,
                    roomNumber: ''
                },
                timeSlot: { startTime: '09:00 AM', endTime: '10:00 AM' },
                day: DayOfWeek.MONDAY,
                _isCustom: false,
                _isCustomFaculty: false,
                _isCustomClassroom: false
            } as any]
        }));
    };

    const handleRemoveSubject = (index: number) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.filter((_, i) => i !== index)
        }));
    };

    const handleSubjectChange = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map((subject, i) => {
                if (i !== index) return subject;
                
                // Special handling for type changes
                if (field === 'type') {
                    const newType = value as SubjectSlotType;
                    if (isSpecialSlotType(newType)) {
                        // If switching to a special slot type, set appropriate defaults
                        return {
                            ...subject,
                            type: newType,
                            code: newType, // Use the type as the code
                            name: newType, // Use the type as the name
                            faculty: '', // Clear faculty
                            room: { // Set default room values
                                buildingCode: '',
                                floorNumber: 0,
                                roomNumber: ''
                            }
                        };
                    } else {
                        return { ...subject, [field]: value };
                    }
                }
                
                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    if (parent === 'room') {
                        return {
                            ...subject,
                            room: { ...subject.room, [child]: value }
                        };
                    } else if (parent === 'timeSlot') {
                        return {
                            ...subject,
                            timeSlot: { ...subject.timeSlot, [child]: value }
                        };
                    }
                }
                return { ...subject, [field]: value };
            })
        }));
    };

    const handleVisibleDaysChange = (day: DayOfWeek) => {
        setFormData(prev => ({
            ...prev,
            visibleDays: prev.visibleDays.includes(day)
                ? prev.visibleDays.filter(d => d !== day)
                : [...prev.visibleDays, day]
        }));
    };

    const validateSubjects = () => {
        const errors: string[] = [];
        
        formData.subjects.forEach((subject, index) => {
            // Skip validation for special slot types (Break, Lunch, Short Break)
            if (isSpecialSlotType(subject.type)) {
                return;
            }
            
            // Check required fields for normal subject types
            if (!subject.code?.trim()) {
                errors.push(`Subject ${index + 1}: Subject code is required`);
            }
            
            if (!subject.name?.trim()) {
                errors.push(`Subject ${index + 1}: Subject name is required`);
            }
            
            if (!subject.faculty?.trim()) {
                errors.push(`Subject ${index + 1}: Faculty is required`);
            }
            
            // Check room fields (required for normal subject types)
            if (!subject.room?.buildingCode?.trim()) {
                errors.push(`Subject ${index + 1}: Building code is required`);
            }
            
            if (!subject.room?.roomNumber?.trim()) {
                errors.push(`Subject ${index + 1}: Room number is required`);
            }
        });
        
        return errors;
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError('Please enter a timetable title');
            return;
        }
        
        if (!formData.metadata.programName.trim()) {
            setError('Please enter a program name');
            return;
        }

        if (!formData.metadata.semester.trim()) {
            setError('Please enter a semester');
            return;
        }

        if (!formData.metadata.academicYear.trim()) {
            setError('Please enter an academic year');
            return;
        }

        // Validate subjects if any are added
        if (formData.subjects.length > 0) {
            const subjectErrors = validateSubjects();
            if (subjectErrors.length > 0) {
                setError(`Please fix the following errors:\n${subjectErrors.join('\n')}`);
                return;
            }
        }

        setLoading(true);
        setError(null);
        
        try {
            // Filter out empty subjects and pools before submitting
            const validSubjects = formData.subjects.filter(subject => {
                // Always include special slot types (Break, Lunch, Short Break)
                if (isSpecialSlotType(subject.type)) {
                    return subject.code?.trim() && subject.name?.trim();
                }
                
                // For regular subjects, require all fields
                return subject.code?.trim() && 
                    subject.name?.trim() && 
                    subject.faculty?.trim() && 
                    subject.room?.buildingCode?.trim() && 
                    subject.room?.roomNumber?.trim();
            });

            const timetableData = {
                ...formData,
                title: formData.title.trim(),
                metadata: {
                    ...formData.metadata,
                    programName: formData.metadata.programName.trim(),
                    semester: formData.metadata.semester.trim(),
                    academicYear: formData.metadata.academicYear.trim()
                },
                subjects: validSubjects,
                availableSubjects: formData.availableSubjects.filter(s => s.code?.trim() && s.name?.trim()),
                availableClassrooms: formData.availableClassrooms.filter(c => 
                    c.buildingCode?.trim() && 
                    c.roomNumber?.trim() && 
                    c.displayName?.trim()
                ),
                availableFaculty: formData.availableFaculty.filter(f => f.shortName?.trim())
            };

            await createTimetable(timetableData);
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

    // Helper function to check if subject type is a special slot (Break, Lunch, Short Break)
    const isSpecialSlotType = (type: SubjectSlotType): boolean => {
        return type === SubjectSlotType.BREAK || 
               type === SubjectSlotType.LUNCH || 
               type === SubjectSlotType.SHORT_BREAK;
    };

    // Helper functions to convert between 12-hour and 24-hour time formats
    const convertTo24Hour = (time12h: string): string => {
        if (!time12h) return '';
        
        // If already in 24-hour format, return as is
        if (!time12h.includes('AM') && !time12h.includes('PM')) {
            return time12h;
        }
        
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12 + '';
        }
        
        return `${hours.padStart(2, '0')}:${minutes}`;
    };

    const convertToAMPM = (time24h: string): string => {
        if (!time24h) return '';
        
        const [hours, minutes] = time24h.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
            <DialogTitle>Create New Timetable</DialogTitle>
            
            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Basic Information */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">Basic Information</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Timetable Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}

                                    required
                                />
                                
                                <TextField
                                    fullWidth
                                    label="Program Name"
                                    value={formData.metadata.programName}
                                    onChange={(e) => updateMetadata('programName', e.target.value)}

                                    required
                                />
                                
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Batch</InputLabel>
                                        <Select
                                            value={formData.metadata.batch}
                                            label="Batch"
                                            onChange={(e) => updateMetadata('batch', e.target.value as Batch)}
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
                                            onChange={(e) => updateMetadata('programType', e.target.value as ProgramType)}
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
                                        onChange={(e) => updateMetadata('academicYear', e.target.value)}

                                    />
                                </Box>
                                
                                <TextField
                                    fullWidth
                                    label="Semester"
                                    value={formData.metadata.semester}
                                    onChange={(e) => updateMetadata('semester', e.target.value)}

                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Visible Days */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">Visible Days</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {Object.values(DayOfWeek).map(day => (
                                    <Chip
                                        key={day}
                                        label={day}
                                        onClick={() => handleVisibleDaysChange(day)}
                                        color={formData.visibleDays.includes(day) ? 'primary' : 'default'}
                                        variant={formData.visibleDays.includes(day) ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Time Slots */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">Time Slots ({formData.timeSlots.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                <Button
                                    startIcon={<Add />}
                                    onClick={handleAddTimeSlot}
                                    variant="outlined"
                                    sx={{ mb: 2 }}
                                >
                                    Add Time Slot
                                </Button>
                                
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {formData.timeSlots.map((slot, index) => (
                                        <Card variant="outlined" key={index}>
                                            <CardContent>
                                                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                                    <TextField
                                                        type="time"
                                                        label="Start Time"
                                                        value={convertTo24Hour(slot.startTime)}
                                                        onChange={(e) => handleTimeSlotChange(index, 'startTime', convertToAMPM(e.target.value))}
                                                        size="small"
                                                        sx={{ 
                                                            minWidth: '150px',
                                                            '& .MuiInputLabel-root': {
                                                                backgroundColor: 'background.paper',
                                                                paddingX: 1
                                                            }
                                                        }}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        type="time"
                                                        label="End Time"
                                                        value={convertTo24Hour(slot.endTime)}
                                                        onChange={(e) => handleTimeSlotChange(index, 'endTime', convertToAMPM(e.target.value))}
                                                        size="small"
                                                        sx={{ 
                                                            minWidth: '150px',
                                                            '& .MuiInputLabel-root': {
                                                                backgroundColor: 'background.paper',
                                                                paddingX: 1
                                                            }
                                                        }}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <IconButton
                                                        onClick={() => handleRemoveTimeSlot(index)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Subjects */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">Subjects ({formData.subjects.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                <Button
                                    startIcon={<Add />}
                                    onClick={handleAddSubject}
                                    variant="outlined"
                                    sx={{ mb: 2 }}
                                >
                                    Add Subject
                                </Button>
                                
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {formData.subjects.map((subject, index) => (
                                        <Card variant="outlined" key={index}>
                                            <CardContent>
                                                <Box display="flex" flexDirection="column" gap={2}>
                                                    {/* Basic subject info */}
                                                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                                                        <Box flex="1" minWidth="120px">
                                                            <TextField
                                                                fullWidth
                                                                label="Subject Code *"
                                                                value={subject.code}
                                                                onChange={(e) => handleSubjectChange(index, 'code', e.target.value)}
                                                                size="small"
                                                                required
                                                                error={!subject.code?.trim()}
                                                                disabled={isSpecialSlotType(subject.type)}
                                                            />
                                                        </Box>
                                                        <Box flex="2" minWidth="200px">
                                                            <TextField
                                                                fullWidth
                                                                label="Subject Name *"
                                                                value={subject.name}
                                                                onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                                                                size="small"
                                                                required
                                                                error={!subject.name?.trim()}
                                                                disabled={isSpecialSlotType(subject.type)}
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="120px">
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Type</InputLabel>
                                                                <Select
                                                                    value={subject.type}
                                                                    onChange={(e) => handleSubjectChange(index, 'type', e.target.value)}
                                                                    label="Type"
                                                                >
                                                                    {Object.values(SubjectSlotType).map(type => (
                                                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                        <Box flex="1" minWidth="120px">
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Day</InputLabel>
                                                                <Select
                                                                    value={subject.day}
                                                                    onChange={(e) => handleSubjectChange(index, 'day', e.target.value)}
                                                                    label="Day"
                                                                >
                                                                    {formData.visibleDays.length > 0 ? (
                                                                        formData.visibleDays.map(day => (
                                                                            <MenuItem key={day} value={day}>{day}</MenuItem>
                                                                        ))
                                                                    ) : (
                                                                        Object.values(DayOfWeek).map(day => (
                                                                            <MenuItem key={day} value={day}>{day}</MenuItem>
                                                                        ))
                                                                    )}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                        <IconButton
                                                            onClick={() => handleRemoveSubject(index)}
                                                            color="error"
                                                            size="small"
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </Box>
                                                    
                                                    {/* Faculty and classroom info */}
                                                    <Box display="flex" gap={2} flexWrap="wrap">
                                                        <Box flex="2" minWidth="150px">
                                                            <TextField
                                                                fullWidth
                                                                label="Faculty *"
                                                                value={subject.faculty}
                                                                onChange={(e) => handleSubjectChange(index, 'faculty', e.target.value)}
                                                                size="small"
                                                                required
                                                                error={!subject.faculty?.trim()}
                                                                disabled={isSpecialSlotType(subject.type)}
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="100px">
                                                            <TextField
                                                                fullWidth
                                                                label="Building *"
                                                                value={subject.room.buildingCode}
                                                                onChange={(e) => handleSubjectChange(index, 'room.buildingCode', e.target.value)}
                                                                size="small"
                                                                required
                                                                error={!subject.room.buildingCode?.trim()}
                                                                disabled={isSpecialSlotType(subject.type)}
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="80px">
                                                            <TextField
                                                                fullWidth
                                                                label="Floor"
                                                                type="number"
                                                                value={subject.room.floorNumber}
                                                                onChange={(e) => handleSubjectChange(index, 'room.floorNumber', parseInt(e.target.value) || 0)}
                                                                size="small"
                                                                disabled={isSpecialSlotType(subject.type)}
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="100px">
                                                            <TextField
                                                                fullWidth
                                                                label="Room *"
                                                                value={subject.room.roomNumber}
                                                                onChange={(e) => handleSubjectChange(index, 'room.roomNumber', e.target.value)}
                                                                size="small"
                                                                required
                                                                error={!subject.room.roomNumber?.trim()}
                                                                disabled={isSpecialSlotType(subject.type)}
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="120px">
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Start Time</InputLabel>
                                                                <Select
                                                                    value={subject.timeSlot.startTime}
                                                                    onChange={(e) => {
                                                                        const selectedSlot = formData.timeSlots.find(slot => slot.startTime === e.target.value);
                                                                        if (selectedSlot) {
                                                                            handleSubjectChange(index, 'timeSlot.startTime', selectedSlot.startTime);
                                                                            handleSubjectChange(index, 'timeSlot.endTime', selectedSlot.endTime);
                                                                        }
                                                                    }}
                                                                    label="Start Time"
                                                                >
                                                                    {formData.timeSlots.map((slot, slotIndex) => (
                                                                        <MenuItem key={slotIndex} value={slot.startTime}>
                                                                            {slot.startTime} - {slot.endTime}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                        <Box flex="1" minWidth="120px">
                                                            <TextField
                                                                label="End Time"
                                                                value={subject.timeSlot.endTime}
                                                                size="small"
                                                                fullWidth
                                                                disabled
                                                                helperText="Auto-filled"
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading || !formData.title.trim()}
                    startIcon={<Add />}
                >
                    {loading ? 'Creating...' : 'Create Timetable'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateTimetableDialog;
