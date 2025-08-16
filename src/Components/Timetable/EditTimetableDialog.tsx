'use client';

import React, { useState, useEffect } from 'react';
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
    Person
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useTimetable } from './TimetableProvider';
import { Axios } from '@Utils/Axios';
import {
    Timetable,
    Subject,
    TimeSlot,
    DayOfWeek,
    Batch,
    ProgramType,
    SubjectSlotType
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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchingData, setFetchingData] = useState(false);

    // Initialize form with timetable data
    useEffect(() => {
        const fetchTimetableData = async () => {
            if (timetable && open && timetable._id) {
                try {
                    setFetchingData(true);
                    setError(null);
                    
                    // Fetch complete timetable data including subjects and timeSlots
                    const response = await Axios.get(`/api/timetable/${timetable._id}`);
                    const fullTimetable = response.data.timetable;
                    
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
                    
                } catch (err: any) {
                    console.error('Error fetching complete timetable data:', err);
                    setError('Failed to load timetable data. Please try again.');
                    
                    // Fallback to basic data if API fails
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
                } finally {
                    setFetchingData(false);
                }
            }
        };

        if (timetable && open) {
            fetchTimetableData();
        }
    }, [timetable, open]);

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleAddTimeSlot = () => {
        setTimeSlots([...timeSlots, { startTime: '09:00', endTime: '10:00' }]);
    };

    const handleRemoveTimeSlot = (index: number) => {
        setTimeSlots(timeSlots.filter((_, i) => i !== index));
    };

    const handleTimeSlotChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const updated = [...timeSlots];
        updated[index] = { ...updated[index], [field]: value };
        setTimeSlots(updated);
    };

    const handleAddSubject = () => {
        setSubjects([...subjects, {
            code: '',
            name: '',
            type: SubjectSlotType.LECTURE,
            faculty: '',
            room: {
                buildingCode: '',
                floorNumber: 0,
                roomNumber: ''
            },
            timeSlot: { startTime: '09:00', endTime: '10:00' },
            day: DayOfWeek.MONDAY
        }]);
    };

    const handleRemoveSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleSubjectChange = (index: number, field: string, value: any) => {
        const updated = [...subjects];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'room') {
                updated[index] = {
                    ...updated[index],
                    room: {
                        ...updated[index].room,
                        [child]: value
                    }
                };
            } else if (parent === 'timeSlot') {
                updated[index] = {
                    ...updated[index],
                    timeSlot: {
                        ...updated[index].timeSlot,
                        [child]: value
                    }
                };
            }
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setSubjects(updated);
    };

    const handleVisibleDaysChange = (day: DayOfWeek) => {
        if (visibleDays.includes(day)) {
            setVisibleDays(visibleDays.filter(d => d !== day));
        } else {
            setVisibleDays([...visibleDays, day]);
        }
    };

    const handleSubmit = async () => {
        if (!timetable) return;

        setLoading(true);
        setError(null);

        try {
            const updatedData = {
                title,
                metadata: {
                    programName,
                    semester,
                    batch,
                    programType,
                    academicYear,
                    publishDate: publishDate ? new Date(publishDate) : new Date(),
                    validFrom: validFrom ? new Date(validFrom) : new Date(),
                    validTo: validTo ? new Date(validTo) : null
                },
                subjects,
                timeSlots,
                visibleDays,
                isActive
            };

            await updateTimetable(timetable._id, updatedData);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to update timetable');
        } finally {
            setLoading(false);
        }
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
                                        onClick={() => handleVisibleDaysChange(day)}
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
                                    onClick={handleAddTimeSlot}
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
                                                        value={slot.startTime}
                                                        onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                                                        size="small"
                                                        sx={{ minWidth: '150px' }}
                                                    />
                                                    <TextField
                                                        type="time"
                                                        label="End Time"
                                                        value={slot.endTime}
                                                        onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                                                        size="small"
                                                        sx={{ minWidth: '150px' }}
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
                            <Typography variant="h6">Subjects ({subjects.length})</Typography>
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
                                    {subjects.map((subject, index) => (
                                        <Card variant="outlined" key={index}>
                                            <CardContent>
                                                <Box display="flex" flexDirection="column" gap={2}>
                                                    {/* First row: Basic subject info */}
                                                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                                                        <Box flex="1" minWidth="120px">
                                                            <TextField
                                                                fullWidth
                                                                label="Subject Code"
                                                                value={subject.code}
                                                                onChange={(e) => handleSubjectChange(index, 'code', e.target.value)}
                                                                size="small"
                                                            />
                                                        </Box>
                                                        <Box flex="2" minWidth="200px">
                                                            <TextField
                                                                fullWidth
                                                                label="Subject Name"
                                                                value={subject.name}
                                                                onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                                                                size="small"
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
                                                                    {Object.values(DayOfWeek).map(day => (
                                                                        <MenuItem key={day} value={day}>{day}</MenuItem>
                                                                    ))}
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
                                                    
                                                    {/* Second row: Faculty and room info */}
                                                    <Box display="flex" gap={2} flexWrap="wrap">
                                                        <Box flex="2" minWidth="150px">
                                                            <TextField
                                                                fullWidth
                                                                label="Faculty"
                                                                value={subject.faculty}
                                                                onChange={(e) => handleSubjectChange(index, 'faculty', e.target.value)}
                                                                size="small"
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="100px">
                                                            <TextField
                                                                fullWidth
                                                                label="Building"
                                                                value={subject.room.buildingCode}
                                                                onChange={(e) => handleSubjectChange(index, 'room.buildingCode', e.target.value)}
                                                                size="small"
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
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="100px">
                                                            <TextField
                                                                fullWidth
                                                                label="Room"
                                                                value={subject.room.roomNumber}
                                                                onChange={(e) => handleSubjectChange(index, 'room.roomNumber', e.target.value)}
                                                                size="small"
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="120px">
                                                            <TextField
                                                                type="time"
                                                                label="Start Time"
                                                                value={subject.timeSlot.startTime}
                                                                onChange={(e) => handleSubjectChange(index, 'timeSlot.startTime', e.target.value)}
                                                                size="small"
                                                                fullWidth
                                                            />
                                                        </Box>
                                                        <Box flex="1" minWidth="120px">
                                                            <TextField
                                                                type="time"
                                                                label="End Time"
                                                                value={subject.timeSlot.endTime}
                                                                onChange={(e) => handleSubjectChange(index, 'timeSlot.endTime', e.target.value)}
                                                                size="small"
                                                                fullWidth
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
                    disabled={loading || !title.trim()}
                >
                    {loading ? 'Updating...' : 'Update Timetable'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTimetableDialog;
