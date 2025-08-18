import React, { useState, useEffect, useCallback } from 'react';
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
    Chip,
    IconButton,
    Card,
    CardContent,
    CardActions,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    useTheme,
    useMediaQuery,
    CircularProgress
} from '@mui/material';
import {
    Add,
    Delete,
    ExpandMore,
    School,
    AccessTime,
    LocationOn,
    Person,
    Lock
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useTimetable } from './TimetableProvider';
import { Axios } from '@Utils/Axios';
import { TimetableUtility } from '@/Utils/TimetableUtility';
import {
    Timetable,
    Subject,
    TimeSlot,
    DayOfWeek,
    Batch,
    ProgramType,
    SubjectSlotType,
    SubjectOption,
    ClassroomOption,
    FacultyOption
} from '@/Types/Timetable';

interface EditTimetableDialogProps {
    open: boolean;
    timetable: Timetable | null;
    onClose: () => void;
    onSuccess: () => void;
}

const EditTimetableDialog: React.FC<EditTimetableDialogProps> = ({
    open,
    timetable,
    onClose,
    onSuccess
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { updateTimetable } = useTimetable();

    // Form state
    const [title, setTitle] = useState('');
    const [programName, setProgramName] = useState('');
    const [semester, setSemester] = useState('');
    const [batch, setBatch] = useState<Batch>(Batch.A);
    const [programType, setProgramType] = useState<ProgramType>(ProgramType.D2D);
    const [academicYear, setAcademicYear] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [visibleDays, setVisibleDays] = useState<DayOfWeek[]>([]);
    const [isActive, setIsActive] = useState(true);

    // Dropdown options
    const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
    const [availableClassrooms, setAvailableClassrooms] = useState<ClassroomOption[]>([]);
    const [availableFaculty, setAvailableFaculty] = useState<FacultyOption[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchingData, setFetchingData] = useState(false);

    // Initialize form with timetable data
    useEffect(() => {
        const fetchTimetableData = async () => {
            if (!timetable?._id || !TimetableUtility.isValidTimetableId(timetable._id)) {
                console.log('EditTimetableDialog: Invalid or demo timetable ID:', timetable?._id);

                // Set basic data without API call for demo or invalid IDs
                setTitle(timetable?.title || '');
                setProgramName(timetable?.metadata?.programName || '');
                setSemester(timetable?.metadata?.semester || '');
                setBatch(timetable?.metadata?.batch || Batch.A);
                setProgramType(timetable?.metadata?.programType || ProgramType.D2D);
                setAcademicYear(timetable?.metadata?.academicYear || '');
                setPublishDate(timetable?.metadata?.publishDate ? dayjs(timetable.metadata.publishDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
                setValidFrom(timetable?.metadata?.validFrom ? dayjs(timetable.metadata.validFrom).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
                setValidTo(timetable?.metadata?.validTo ? dayjs(timetable.metadata.validTo).format('YYYY-MM-DD') : '');
                setSubjects(timetable?.subjects || []);
                setTimeSlots(timetable?.timeSlots || []);
                setVisibleDays(timetable?.visibleDays || []);
                setIsActive(timetable?.isActive ?? true);
                setAvailableSubjects(timetable?.availableSubjects || []);
                setAvailableClassrooms(timetable?.availableClassrooms || []);
                setAvailableFaculty(timetable?.availableFaculty || []);
                return;
            }

            try {
                setFetchingData(true);
                setError(null);

                console.log('EditTimetableDialog: Making API call for ID:', timetable._id);

                // Fetch complete timetable data including subjects and timeSlots
                const response = await Axios.get(`/api/timetable/${timetable._id}`);

                if (response.status !== 200 || !response.data?.timetable) {
                    throw new Error('Invalid response from server');
                }

                const fullTimetable = response.data.timetable;
                console.log('EditTimetableDialog: API response received:', fullTimetable);

                // Initialize form with complete data
                setTitle(fullTimetable.title || '');
                setProgramName(fullTimetable.metadata?.programName || '');
                setSemester(fullTimetable.metadata?.semester || '');
                setBatch(fullTimetable.metadata?.batch || Batch.A);
                setProgramType(fullTimetable.metadata?.programType || ProgramType.D2D);
                setAcademicYear(fullTimetable.metadata?.academicYear || '');
                setPublishDate(fullTimetable.metadata?.publishDate ? dayjs(fullTimetable.metadata.publishDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
                setValidFrom(fullTimetable.metadata?.validFrom ? dayjs(fullTimetable.metadata.validFrom).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
                setValidTo(fullTimetable.metadata?.validTo ? dayjs(fullTimetable.metadata.validTo).format('YYYY-MM-DD') : '');
                setSubjects(fullTimetable.subjects || []);
                setTimeSlots(fullTimetable.timeSlots || []);
                setVisibleDays(fullTimetable.visibleDays || []);
                setIsActive(fullTimetable.isActive ?? true);

                // Set dropdown options
                setAvailableSubjects(fullTimetable.availableSubjects || []);
                setAvailableClassrooms(fullTimetable.availableClassrooms || []);
                setAvailableFaculty(fullTimetable.availableFaculty || []);

            } catch (err: any) {
                console.error('EditTimetableDialog: API error:', err);

                if (err.response?.status === 404) {
                    console.warn('Timetable not found (404) for ID:', timetable._id, '- using fallback data');
                } else {
                    setError('Failed to load complete timetable data. Using basic data.');
                }

                // Fallback to basic data if API fails
                if (timetable) {
                    setTitle(timetable.title || '');
                    setProgramName(timetable.metadata?.programName || '');
                    setSemester(timetable.metadata?.semester || '');
                    setBatch(timetable.metadata?.batch || Batch.A);
                    setProgramType(timetable.metadata?.programType || ProgramType.D2D);
                    setAcademicYear(timetable.metadata?.academicYear || '');
                    setPublishDate(timetable.metadata?.publishDate ? dayjs(timetable.metadata.publishDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
                    setValidFrom(timetable.metadata?.validFrom ? dayjs(timetable.metadata.validFrom).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
                    setValidTo(timetable.metadata?.validTo ? dayjs(timetable.metadata.validTo).format('YYYY-MM-DD') : '');
                    setSubjects(timetable.subjects || []);
                    setTimeSlots(timetable.timeSlots || []);
                    setVisibleDays(timetable.visibleDays || []);
                    setIsActive(timetable.isActive ?? true);
                    setAvailableSubjects(timetable.availableSubjects || []);
                    setAvailableClassrooms(timetable.availableClassrooms || []);
                    setAvailableFaculty(timetable.availableFaculty || []);
                }
            } finally {
                setFetchingData(false);
            }
        };

        // Only fetch if we have a valid timetable and open dialog
        if (timetable && open && timetable._id) {
            fetchTimetableData();
        }
    }, [timetable?._id, open]); // Only depend on ID and open state

    const handleClose = () => {
        setError(null);
        setFetchingData(false);

        // Clear form state to prevent stale data
        setTitle('');
        setProgramName('');
        setSemester('');
        setBatch(Batch.A);
        setProgramType(ProgramType.D2D);
        setAcademicYear('');
        setPublishDate('');
        setValidFrom('');
        setValidTo('');
        setSubjects([]);
        setTimeSlots([]);
        setVisibleDays([]);
        setIsActive(true);
        setAvailableSubjects([]);
        setAvailableClassrooms([]);
        setAvailableFaculty([]);

        onClose();
    };

    const validateSubjects = () => {
        const errors: string[] = [];

        subjects.forEach((subject, index) => {
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
        if (!timetable) return;

        // Check if timetable is locked
        if (timetable.isLocked) {
            setError('This timetable is locked and cannot be edited. Please unlock it first to make changes.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Validate required fields
            if (!title.trim()) {
                throw new Error('Timetable title is required');
            }

            if (!programName.trim()) {
                throw new Error('Program name is required');
            }

            if (!semester.trim()) {
                throw new Error('Semester is required');
            }

            if (!academicYear.trim()) {
                throw new Error('Academic year is required');
            }

            // Validate subjects
            const subjectErrors = validateSubjects();
            if (subjectErrors.length > 0) {
                throw new Error(`Please fix the following errors:\n${subjectErrors.join('\n')}`);
            }

            // Filter out empty subjects and ensure all required fields are present
            const validSubjects = subjects.filter(subject => {
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

            const updatedData = {
                title: title.trim(),
                metadata: {
                    programName: programName.trim(),
                    semester: semester.trim(),
                    batch,
                    programType,
                    academicYear: academicYear.trim(),
                    publishDate: publishDate ? new Date(publishDate) : new Date(),
                    validFrom: validFrom ? new Date(validFrom) : new Date(),
                    validTo: validTo ? new Date(validTo) : null
                },
                subjects: validSubjects,
                timeSlots,
                visibleDays,
                isActive,
                availableSubjects: availableSubjects.filter(s => s.code?.trim() && s.name?.trim()),
                availableClassrooms: availableClassrooms.filter(c =>
                    c.buildingCode?.trim() &&
                    c.roomNumber?.trim() &&
                    c.displayName?.trim()
                ),
                availableFaculty: availableFaculty.filter(f => f.shortName?.trim())
            };

            await updateTimetable(timetable._id, updatedData);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to update timetable');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check if subject type is a special slot (Break, Lunch, Short Break)
    const isSpecialSlotType = React.useCallback((type: SubjectSlotType): boolean => {
        return type === SubjectSlotType.BREAK ||
            type === SubjectSlotType.LUNCH ||
            type === SubjectSlotType.SHORT_BREAK;
    }, []);

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
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle>
                Edit Timetable
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ minHeight: '60vh' }}>
                    {fetchingData && (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                            <Box textAlign="center">
                                <CircularProgress sx={{ mb: 2 }} />
                                <Typography color="text.secondary">Loading timetable data...</Typography>
                            </Box>
                        </Box>
                    )}

                    {timetable?.isLocked && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Lock color="warning" />
                                <Typography color="warning.dark" fontWeight="600">
                                    Timetable Locked
                                </Typography>
                            </Box>
                            <Typography color="warning.dark" variant="body2" sx={{ mt: 1 }}>
                                {timetable.lockReason || 'This timetable is locked and cannot be edited.'}
                                {timetable.lockedBy && ` Locked by: ${timetable.lockedBy}`}
                                {timetable.lockedAt && ` on ${new Date(timetable.lockedAt).toLocaleString()}`}
                            </Typography>
                        </Box>
                    )}

                    {error && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}

                    {!fetchingData && (
                        <>
                            {/* Basic Information */}
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">Basic Information</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <TextField
                                            fullWidth
                                            label="Timetable Title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />

                                        <Box display="flex" gap={2} flexWrap="wrap">
                                            <Box flex="1" minWidth="250px">
                                                <TextField
                                                    fullWidth
                                                    label="Program Name"
                                                    value={programName}
                                                    onChange={(e) => setProgramName(e.target.value)}
                                                    required
                                                />
                                            </Box>
                                            <Box flex="1" minWidth="250px">
                                                <TextField
                                                    fullWidth
                                                    label="Semester"
                                                    value={semester}
                                                    onChange={(e) => setSemester(e.target.value)}
                                                    required
                                                />
                                            </Box>
                                        </Box>

                                        <Box display="flex" gap={2} flexWrap="wrap">
                                            <Box flex="1" minWidth="150px">
                                                <FormControl fullWidth>
                                                    <InputLabel>Batch</InputLabel>
                                                    <Select
                                                        value={batch}
                                                        onChange={(e) => setBatch(e.target.value as Batch)}
                                                        label="Batch"
                                                    >
                                                        {Object.values(Batch).map(b => (
                                                            <MenuItem key={b} value={b}>{b}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                            <Box flex="1" minWidth="150px">
                                                <FormControl fullWidth>
                                                    <InputLabel>Program Type</InputLabel>
                                                    <Select
                                                        value={programType}
                                                        onChange={(e) => setProgramType(e.target.value as ProgramType)}
                                                        label="Program Type"
                                                    >
                                                        {Object.values(ProgramType).map(pt => (
                                                            <MenuItem key={pt} value={pt}>{pt}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                            <Box flex="1" minWidth="150px">
                                                <TextField
                                                    fullWidth
                                                    label="Academic Year"
                                                    value={academicYear}
                                                    onChange={(e) => setAcademicYear(e.target.value)}
                                                    required
                                                />
                                            </Box>
                                        </Box>

                                        <Box display="flex" gap={2} flexWrap="wrap">
                                            <Box flex="1" minWidth="200px">
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    label="Publish Date"
                                                    value={publishDate}
                                                    onChange={(e) => setPublishDate(e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Box>
                                            <Box flex="1" minWidth="200px">
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    label="Valid From"
                                                    value={validFrom}
                                                    onChange={(e) => setValidFrom(e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Box>
                                            <Box flex="1" minWidth="200px">
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    label="Valid To (Optional)"
                                                    value={validTo}
                                                    onChange={(e) => setValidTo(e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Box>
                                        </Box>

                                        <FormControl fullWidth>
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={isActive ? 'active' : 'inactive'}
                                                onChange={(e) => setIsActive(e.target.value === 'active')}
                                                label="Status"
                                            >
                                                <MenuItem value="active">Active</MenuItem>
                                                <MenuItem value="inactive">Inactive</MenuItem>
                                            </Select>
                                        </FormControl>
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
                                                onClick={() => {
                                                    if (visibleDays.includes(day)) {
                                                        setVisibleDays(visibleDays.filter(d => d !== day));
                                                    } else {
                                                        setVisibleDays([...visibleDays, day]);
                                                    }
                                                }}
                                                color={visibleDays.includes(day) ? 'primary' : 'default'}
                                                variant={visibleDays.includes(day) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>

                            {/* Time Slots */}
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">Time Slots ({timeSlots.length})</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box>
                                        <Button
                                            startIcon={<Add />}
                                            onClick={() => setTimeSlots([...timeSlots, { startTime: '09:00 AM', endTime: '10:00 AM' }])}
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        >
                                            Add Time Slot
                                        </Button>

                                        <Box display="flex" flexDirection="column" gap={2}>
                                            {timeSlots.map((slot, index) => (
                                                <Card variant="outlined" key={index}>
                                                    <CardContent>
                                                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                                            <TextField
                                                                type="time"
                                                                label="Start Time"
                                                                value={convertTo24Hour(slot.startTime)}
                                                                onChange={(e) => {
                                                                    const updated = [...timeSlots];
                                                                    updated[index] = { ...updated[index], startTime: convertToAMPM(e.target.value) };
                                                                    setTimeSlots(updated);
                                                                }}
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
                                                                onChange={(e) => {
                                                                    const updated = [...timeSlots];
                                                                    updated[index] = { ...updated[index], endTime: convertToAMPM(e.target.value) };
                                                                    setTimeSlots(updated);
                                                                }}
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
                                                                onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}
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

                            {/* Available Subjects */}
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">Available Subjects ({availableSubjects.length})</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box>
                                        <Button
                                            startIcon={<Add />}
                                            onClick={() => setAvailableSubjects([...availableSubjects, { code: '', name: '' }])}
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        >
                                            Add Subject
                                        </Button>

                                        <Box display="flex" flexDirection="column" gap={2}>
                                            {availableSubjects.map((subject, index) => (
                                                <Card variant="outlined" key={index}>
                                                    <CardContent>
                                                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                                            <TextField
                                                                label="Subject Code *"
                                                                value={subject.code}
                                                                onChange={(e) => {
                                                                    const updated = [...availableSubjects];
                                                                    updated[index] = { ...updated[index], code: e.target.value };
                                                                    setAvailableSubjects(updated);
                                                                }}
                                                                size="small"
                                                                sx={{ minWidth: '120px' }}

                                                                required
                                                                error={!subject.code?.trim()}
                                                            />
                                                            <TextField
                                                                label="Subject Name *"
                                                                value={subject.name}
                                                                onChange={(e) => {
                                                                    const updated = [...availableSubjects];
                                                                    updated[index] = { ...updated[index], name: e.target.value };
                                                                    setAvailableSubjects(updated);
                                                                }}
                                                                size="small"
                                                                sx={{ minWidth: '200px', flex: 1 }}

                                                                required
                                                                error={!subject.name?.trim()}
                                                            />
                                                            <IconButton
                                                                onClick={() => setAvailableSubjects(availableSubjects.filter((_, i) => i !== index))}
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

                            {/* Available Classrooms */}
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">Available Classrooms ({availableClassrooms.length})</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box>
                                        <Button
                                            startIcon={<Add />}
                                            onClick={() => setAvailableClassrooms([...availableClassrooms, { buildingCode: '', floorNumber: 0, roomNumber: '', displayName: '' }])}
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        >
                                            Add Classroom
                                        </Button>

                                        <Box display="flex" flexDirection="column" gap={2}>
                                            {availableClassrooms.map((classroom, index) => (
                                                <Card variant="outlined" key={index}>
                                                    <CardContent>
                                                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                                            <TextField
                                                                label="Building Code *"
                                                                value={classroom.buildingCode}
                                                                onChange={(e) => {
                                                                    const updated = [...availableClassrooms];
                                                                    const buildingCode = e.target.value;
                                                                    updated[index] = {
                                                                        ...updated[index],
                                                                        buildingCode,
                                                                        displayName: `${buildingCode}${updated[index].floorNumber}${updated[index].roomNumber}`
                                                                    };
                                                                    setAvailableClassrooms(updated);
                                                                }}
                                                                size="small"
                                                                sx={{ minWidth: '100px' }}

                                                                required
                                                                error={!classroom.buildingCode?.trim()}
                                                            />
                                                            <TextField
                                                                label="Floor"
                                                                type="number"
                                                                value={classroom.floorNumber}
                                                                onChange={(e) => {
                                                                    const updated = [...availableClassrooms];
                                                                    const floorNumber = parseInt(e.target.value) || 0;
                                                                    updated[index] = {
                                                                        ...updated[index],
                                                                        floorNumber,
                                                                        displayName: `${updated[index].buildingCode}${floorNumber}${updated[index].roomNumber}`
                                                                    };
                                                                    setAvailableClassrooms(updated);
                                                                }}
                                                                size="small"
                                                                sx={{ minWidth: '80px' }}

                                                            />
                                                            <TextField
                                                                label="Room Number *"
                                                                value={classroom.roomNumber}
                                                                onChange={(e) => {
                                                                    const updated = [...availableClassrooms];
                                                                    const roomNumber = e.target.value;
                                                                    updated[index] = {
                                                                        ...updated[index],
                                                                        roomNumber,
                                                                        displayName: `${updated[index].buildingCode}${updated[index].floorNumber}${roomNumber}`
                                                                    };
                                                                    setAvailableClassrooms(updated);
                                                                }}
                                                                size="small"
                                                                sx={{ minWidth: '100px' }}

                                                                required
                                                                error={!classroom.roomNumber?.trim()}
                                                            />
                                                            <TextField
                                                                label="Display Name"
                                                                value={classroom.displayName}
                                                                size="small"
                                                                disabled
                                                                sx={{ minWidth: '150px', flex: 1 }}
                                                                helperText="Auto-generated"
                                                            />
                                                            <IconButton
                                                                onClick={() => setAvailableClassrooms(availableClassrooms.filter((_, i) => i !== index))}
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

                            {/* Available Faculty */}
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">Available Faculty ({availableFaculty.length})</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box>
                                        <Button
                                            startIcon={<Add />}
                                            onClick={() => setAvailableFaculty([...availableFaculty, { shortName: '', longName: '' }])}
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        >
                                            Add Faculty
                                        </Button>

                                        <Box display="flex" flexDirection="column" gap={2}>
                                            {availableFaculty.map((faculty, index) => (
                                                <Card variant="outlined" key={index}>
                                                    <CardContent>
                                                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                                            <TextField
                                                                label="Short Name *"
                                                                value={faculty.shortName}
                                                                onChange={(e) => {
                                                                    const updated = [...availableFaculty];
                                                                    updated[index] = { ...updated[index], shortName: e.target.value };
                                                                    setAvailableFaculty(updated);
                                                                }}
                                                                size="small"
                                                                sx={{ minWidth: '120px' }}

                                                                required
                                                                error={!faculty.shortName?.trim()}
                                                            />
                                                            <TextField
                                                                label="Full Name"
                                                                value={faculty.longName}
                                                                onChange={(e) => {
                                                                    const updated = [...availableFaculty];
                                                                    updated[index] = { ...updated[index], longName: e.target.value };
                                                                    setAvailableFaculty(updated);
                                                                }}
                                                                size="small"
                                                                sx={{ minWidth: '200px', flex: 1 }}

                                                            />
                                                            <IconButton
                                                                onClick={() => setAvailableFaculty(availableFaculty.filter((_, i) => i !== index))}
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

                            {/* Subject Time Slots */}
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">Subject Time Slots ({subjects.length})</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box>
                                        <Button
                                            startIcon={<Add />}
                                            onClick={() => setSubjects([...subjects, {
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
                                                day: DayOfWeek.MONDAY
                                            }])}
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        >
                                            Add Subject Time Slot
                                        </Button>

                                        <Box display="flex" flexDirection="column" gap={2}>
                                            {subjects.map((subject, index) => (
                                                <Card variant="outlined" key={`subject-${index}-${subject.code}-${subject.type}`}>
                                                    <CardContent>
                                                        <Box display="flex" flexDirection="column" gap={2}>
                                                            {/* First row: Subject info */}
                                                            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                                                                <Box flex="1" minWidth="200px">
                                                                    <FormControl fullWidth size="small">
                                                                        <InputLabel>Subject</InputLabel>
                                                                        <Select
                                                                            value={
                                                                                isSpecialSlotType(subject.type)
                                                                                    ? `${subject.code}|${subject.name}`
                                                                                    : availableSubjects.find(s => s.code === subject.code && s.name === subject.name)
                                                                                        ? `${subject.code}|${subject.name}`
                                                                                        : ''
                                                                            }
                                                                            onChange={(e) => {
                                                                                if (e.target.value) {
                                                                                    const [code, name] = (e.target.value as string).split('|');
                                                                                    const updated = [...subjects];
                                                                                    updated[index] = { ...updated[index], code, name };
                                                                                    setSubjects(updated);
                                                                                }
                                                                            }}
                                                                            label="Subject"
                                                                            displayEmpty
                                                                            disabled={isSpecialSlotType(subject.type)}
                                                                        >
                                                                            {/* Show current special slot type if it's a special slot */}
                                                                            {isSpecialSlotType(subject.type) && (
                                                                                <MenuItem value={`${subject.code}|${subject.name}`}>
                                                                                    {subject.code} - {subject.name}
                                                                                </MenuItem>
                                                                            )}
                                                                            {/* Show regular available subjects */}
                                                                            {availableSubjects.map(subj => (
                                                                                <MenuItem key={subj.code} value={`${subj.code}|${subj.name}`}>
                                                                                    {subj.code} - {subj.name}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                </Box>
                                                                <Box flex="1" minWidth="120px">
                                                                    <FormControl fullWidth size="small">
                                                                        <InputLabel>Type</InputLabel>
                                                                        <Select
                                                                            value={subject.type || SubjectSlotType.LECTURE}
                                                                            onChange={(e) => {
                                                                                const updated = [...subjects];
                                                                                const newType = e.target.value as SubjectSlotType;

                                                                                // If switching to a special slot type, set appropriate defaults
                                                                                if (isSpecialSlotType(newType)) {
                                                                                    updated[index] = {
                                                                                        ...updated[index],
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
                                                                                    updated[index] = { ...updated[index], type: newType };
                                                                                }
                                                                                setSubjects(updated);
                                                                            }}
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
                                                                            onChange={(e) => {
                                                                                const updated = [...subjects];
                                                                                updated[index] = { ...updated[index], day: e.target.value as DayOfWeek };
                                                                                setSubjects(updated);
                                                                            }}
                                                                            label="Day"
                                                                        >
                                                                            {visibleDays.length > 0 ? (
                                                                                visibleDays.map(day => (
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
                                                                    onClick={() => setSubjects(subjects.filter((_, i) => i !== index))}
                                                                    color="error"
                                                                    size="small"
                                                                >
                                                                    <Delete />
                                                                </IconButton>
                                                            </Box>

                                                            {/* Second row: Faculty, classroom, and time */}
                                                            <Box display="flex" gap={2} flexWrap="wrap">
                                                                <Box flex="2" minWidth="150px">
                                                                    <FormControl fullWidth size="small">
                                                                        <InputLabel>Faculty</InputLabel>
                                                                        <Select
                                                                            value={availableFaculty.find(f => f.shortName === subject.faculty) ? subject.faculty : ''}
                                                                            onChange={(e) => {
                                                                                const updated = [...subjects];
                                                                                updated[index] = { ...updated[index], faculty: e.target.value as string };
                                                                                setSubjects(updated);
                                                                            }}
                                                                            label="Faculty"
                                                                            displayEmpty
                                                                            disabled={isSpecialSlotType(subject.type)}
                                                                        >
                                                                            {availableFaculty.map(faculty => (
                                                                                <MenuItem key={faculty.shortName} value={faculty.shortName}>
                                                                                    {faculty.shortName} ({faculty.longName})
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                </Box>
                                                                <Box flex="2" minWidth="200px">
                                                                    <FormControl fullWidth size="small">
                                                                        <InputLabel>Classroom</InputLabel>
                                                                        <Select
                                                                            value={availableClassrooms.find(c => c.displayName === `${subject.room.buildingCode}${subject.room.floorNumber}${subject.room.roomNumber}`) ? `${subject.room.buildingCode}${subject.room.floorNumber}${subject.room.roomNumber}` : ''}
                                                                            onChange={(e) => {
                                                                                if (e.target.value) {
                                                                                    const displayName = e.target.value as string;
                                                                                    const classroom = availableClassrooms.find(c => c.displayName === displayName);
                                                                                    if (classroom) {
                                                                                        const updated = [...subjects];
                                                                                        updated[index] = {
                                                                                            ...updated[index],
                                                                                            room: {
                                                                                                buildingCode: classroom.buildingCode,
                                                                                                floorNumber: classroom.floorNumber,
                                                                                                roomNumber: classroom.roomNumber
                                                                                            }
                                                                                        };
                                                                                        setSubjects(updated);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            label="Classroom"
                                                                            displayEmpty
                                                                            disabled={isSpecialSlotType(subject.type)}
                                                                        >
                                                                            {availableClassrooms.map(classroom => (
                                                                                <MenuItem key={classroom.displayName} value={classroom.displayName}>
                                                                                    {classroom.displayName}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                </Box>
                                                                <Box flex="1" minWidth="120px">
                                                                    <FormControl fullWidth size="small">
                                                                        <InputLabel>Start Time</InputLabel>
                                                                        <Select
                                                                            value={subject.timeSlot.startTime}
                                                                            onChange={(e) => {
                                                                                const selectedSlot = timeSlots.find(slot => slot.startTime === e.target.value);
                                                                                if (selectedSlot) {
                                                                                    const updated = [...subjects];
                                                                                    updated[index] = {
                                                                                        ...updated[index],
                                                                                        timeSlot: {
                                                                                            startTime: selectedSlot.startTime,
                                                                                            endTime: selectedSlot.endTime
                                                                                        }
                                                                                    };
                                                                                    setSubjects(updated);
                                                                                }
                                                                            }}
                                                                            label="Start Time"
                                                                        >
                                                                            {timeSlots.map((slot, slotIndex) => (
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
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !title.trim() || timetable?.isLocked}
                >
                    {loading ? 'Updating...' : (timetable?.isLocked ? 'Locked' : 'Update Timetable')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTimetableDialog;
