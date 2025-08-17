'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Chip,
    IconButton,
    Button,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Fade,
    Slide,
    alpha
} from '@mui/material';
import {
    ArrowBack,
    MoreVert,
    FileDownload,
    Edit,
    Schedule,
    School,
    DateRange,
    ContentCopy
} from '@mui/icons-material';
import { Timetable, TimetableGrid, Subject, SubjectSlotType, Batch, ProgramType, DayOfWeek } from '@/Types/Timetable';
import { useTimetable } from './TimetableProvider';
import { Axios } from '@Utils/Axios';
import { TimetableUtility } from '@/Utils/TimetableUtility';
import EditTimetableDialog from './EditTimetableDialog';

interface TimetableViewProps {
    timetable: Timetable;
    onBack: () => void;
}

const TimetableView: React.FC<TimetableViewProps> = ({ timetable, onBack }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { exportTimetable, createTimetable } = useTimetable();
    
    const [grid, setGrid] = useState<TimetableGrid | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [duplicating, setDuplicating] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    useEffect(() => {
        const fetchTimetableGrid = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await Axios.get(`/api/timetable/${timetable._id}`);
                
                if (response.data && response.data.grid) {
                    setGrid(response.data.grid);
                } else {
                    throw new Error('Invalid response format - grid data not found');
                }
            } catch (err: any) {
                console.error('Error fetching timetable grid:', err);
                
                // Handle different types of errors
                if (err.response) {
                    // API returned an error response
                    const status = err.response.status;
                    const errorMessage = err.response.data?.error || err.response.data?.Message || 'Failed to fetch timetable details';
                    
                    if (status === 404) {
                        setError('Timetable not found');
                    } else if (status === 500) {
                        setError('Server error occurred while fetching timetable');
                    } else if (err.response.data?.StatusCode === 'INVALID_AUTHORIZATION') {
                        setError('Authentication required. Please refresh the page and try again.');
                    } else {
                        setError(errorMessage);
                    }
                } else if (err.request) {
                    // Network error
                    setError('Network error - please check your connection');
                } else if (err.message === 'CSRF token retrieval failed') {
                    setError('Authentication required. Please refresh the page and try again.');
                } else {
                    // Other errors
                    setError(err.message || 'An unexpected error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        // Validate timetable ID before making API call
        if (timetable && timetable._id) {
            // Skip API call for invalid or demo IDs to prevent spam requests
            if (!TimetableUtility.isValidTimetableId(timetable._id)) {
                console.warn('TimetableView: Skipping API call for invalid/demo timetable ID:', timetable._id);
                setError('This is a demo timetable. Real API functionality is not available.');
                setLoading(false);
                return;
            }
            
            console.log('TimetableView: Fetching grid for timetable ID:', timetable._id);
            fetchTimetableGrid();
        } else {
            setError('Invalid timetable data');
            setLoading(false);
        }
    }, [timetable._id]);

    // Debug logging for subjects
    useEffect(() => {
        if (timetable?.subjects) {
            console.log('TimetableView: Timetable subjects loaded:', timetable.subjects);
            console.log('TimetableView: Special slot types found:', 
                timetable.subjects.filter(s => s.type === 'Break' || s.type === 'Lunch' || s.type === 'Short Break'));
        }
    }, [timetable?.subjects]);

    // Debug logging for grid data
    useEffect(() => {
        if (grid?.cells) {
            console.log('TimetableView: Grid loaded:', grid);
            const nonEmptyCells = grid.cells.flat().filter(cell => !cell.isEmpty);
            console.log('TimetableView: Non-empty cells:', nonEmptyCells);
            console.log('TimetableView: Special slot cells:', 
                nonEmptyCells.filter(cell => cell.subject && 
                    (cell.subject.type === 'Break' || cell.subject.type === 'Lunch' || cell.subject.type === 'Short Break')));
        }
    }, [grid]);

    const handleEdit = () => {
        setEditDialogOpen(true);
        handleMenuClose();
    };

    const handleEditSuccess = () => {
        setEditDialogOpen(false);
        // Refresh the grid data after successful edit
        const fetchTimetableGrid = async () => {
            try {
                setLoading(true);
                const response = await Axios.get(`/api/timetable/${timetable._id}`);
                if (response.data && response.data.grid) {
                    setGrid(response.data.grid);
                }
            } catch (err) {
                console.error('Error refreshing timetable after edit:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTimetableGrid();
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleExport = async () => {
        try {
            await exportTimetable(timetable._id, {
                format: 'A4',
                orientation: 'landscape',
                includeMetadata: true,
                includeEmptySlots: false
            });
            handleMenuClose();
        } catch (error) {
            console.error('Error exporting timetable:', error);
        }
    };

    const handleDuplicate = async () => {
        try {
            setDuplicating(true);
            
            // Create a duplicate with modified title and current date
            const duplicateData = {
                ...timetable,
                title: `${timetable.title} - Copy`,
                metadata: {
                    ...timetable.metadata,
                    publishDate: new Date().toISOString(),
                    validFrom: new Date().toISOString(),
                    validTo: timetable.metadata?.validTo || null
                },
                isActive: false, // Set duplicate as inactive by default
                createdAt: undefined, // Let the API set new timestamps
                updatedAt: undefined,
                _id: undefined // Remove ID so a new one is generated
            };

            await createTimetable(duplicateData);
            handleMenuClose();
            
            // Optional: Show success message or navigate to the new timetable
            console.log('Timetable duplicated successfully');
            
        } catch (error) {
            console.error('Error duplicating timetable:', error);
        } finally {
            setDuplicating(false);
        }
    };

    const getSubjectTypeColor = (type: SubjectSlotType) => {
        const isDark = theme.palette.mode === 'dark';
        switch (type) {
            case SubjectSlotType.LECTURE:
                return isDark ? theme.palette.primary.dark : theme.palette.primary.light;
            case SubjectSlotType.LAB:
                return isDark ? theme.palette.secondary.dark : theme.palette.secondary.light;
            case SubjectSlotType.TUTORIAL:
                return isDark ? theme.palette.success.dark : theme.palette.success.light;
            case SubjectSlotType.BREAK:
            case SubjectSlotType.LUNCH:
            case SubjectSlotType.SHORT_BREAK:
                return isDark ? theme.palette.warning.dark : theme.palette.warning.light;
            default:
                return isDark ? theme.palette.grey[800] : theme.palette.grey[200];
        }
    };

    const getSubjectTypeChipColor = (type: SubjectSlotType) => {
        switch (type) {
            case SubjectSlotType.LECTURE:
                return 'primary';
            case SubjectSlotType.LAB:
                return 'secondary';
            case SubjectSlotType.TUTORIAL:
                return 'success';
            case SubjectSlotType.BREAK:
            case SubjectSlotType.LUNCH:
            case SubjectSlotType.SHORT_BREAK:
                return 'warning';
            default:
                return 'default';
        }
    };

    // Helper function to check if subject type is a special slot (Break, Lunch, Short Break)
    const isSpecialSlotType = (type: SubjectSlotType): boolean => {
        return type === SubjectSlotType.BREAK || 
               type === SubjectSlotType.LUNCH || 
               type === SubjectSlotType.SHORT_BREAK;
    };

    const getBatchColor = (batch: Batch) => {
        switch (batch) {
            case Batch.A: return 'primary';
            case Batch.B: return 'secondary';
            case Batch.C: return 'success';
            default: return 'default';
        }
    };

    const getProgramTypeColor = (type: ProgramType) => {
        return type === ProgramType.D2D ? 'warning' : 'info';
    };

    // Helper function to render timetable content based on selected day
    const renderTimetableContent = () => {
        if (!grid) return null;

        const filteredDays = selectedDay === 'all' ? grid.days : [selectedDay as DayOfWeek];
        
        return isMobile ? renderMobileView(filteredDays) : renderDesktopView(filteredDays);
    };

    const renderMobileView = (filteredDays: DayOfWeek[]) => {
        return (
            <Box>
                {filteredDays.map((day) => (
                    <Fade key={day} in={true} timeout={300}>
                        <Card 
                            sx={{ 
                                mb: 2,
                                background: theme.palette.mode === 'dark' 
                                    ? alpha(theme.palette.background.paper, 0.6)
                                    : alpha(theme.palette.background.paper, 0.9),
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            <CardContent>
                                <Typography 
                                    variant="h6" 
                                    component="h3" 
                                    gutterBottom
                                    fontWeight="600"
                                    sx={{
                                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    {day}
                                </Typography>
                                
                                {(grid?.cells || []).map((row, rowIndex) => {
                                    const dayIndex = (grid?.days || []).indexOf(day);
                                    const cell = row[dayIndex];
                                    
                                    if (!cell || cell.isEmpty) return null;
                                    
                                    const subject = cell.subject!;
                                    
                                    return (
                                        <Box 
                                            key={rowIndex}
                                            sx={{
                                                p: 2.5,
                                                mb: 1.5,
                                                borderRadius: 2,
                                                background: `linear-gradient(135deg, ${getSubjectTypeColor(subject.type)}, ${alpha(getSubjectTypeColor(subject.type), 0.8)})`,
                                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                color: theme.palette.mode === 'dark' ? 'common.white' : 'common.black',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.02)',
                                                    boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`
                                                }
                                            }}
                                        >
                                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                <Typography 
                                                    variant="subtitle1" 
                                                    fontWeight="700"
                                                    sx={{ 
                                                        color: theme.palette.mode === 'dark' ? 'common.white' : 'common.black' 
                                                    }}
                                                >
                                                    {isSpecialSlotType(subject.type) ? subject.type : subject.code}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={subject.type}
                                                    color={getSubjectTypeChipColor(subject.type)}
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            </Box>
                                            
                                            {!isSpecialSlotType(subject.type) && (
                                                <Typography 
                                                    variant="body1" 
                                                    mb={1.5}
                                                    fontWeight="500"
                                                    sx={{ 
                                                        color: theme.palette.mode === 'dark' ? 'common.white' : 'common.black' 
                                                    }}
                                                >
                                                    {subject.name}
                                                </Typography>
                                            )}
                                            
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography 
                                                    variant="body2" 
                                                    fontWeight="500"
                                                    sx={{ 
                                                        color: theme.palette.mode === 'dark' ? 'grey.200' : 'text.secondary' 
                                                    }}
                                                >
                                                    🕐 {subject.timeSlot.startTime} - {subject.timeSlot.endTime}
                                                </Typography>
                                                {!isSpecialSlotType(subject.type) && (
                                                    <Typography 
                                                        variant="body2" 
                                                        fontWeight="500"
                                                        sx={{ 
                                                            color: theme.palette.mode === 'dark' ? 'grey.200' : 'text.secondary' 
                                                        }}
                                                    >
                                                        📍 {subject.room.buildingCode}{subject.room.floorNumber}{subject.room.roomNumber}
                                                    </Typography>
                                                )}
                                            </Box>
                                            
                                            {!isSpecialSlotType(subject.type) && subject.faculty && (
                                                <Typography 
                                                    variant="body2" 
                                                    fontWeight="500"
                                                    sx={{ 
                                                        color: theme.palette.mode === 'dark' ? 'grey.200' : 'text.secondary' 
                                                    }}
                                                >
                                                    👨‍🏫 {subject.faculty}
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                                
                                {/* Show empty state if no subjects for this day */}
                                {!(grid?.cells || []).some((row) => {
                                    const dayIndex = (grid?.days || []).indexOf(day);
                                    const cell = row[dayIndex];
                                    return cell && !cell.isEmpty;
                                }) && (
                                    <Box 
                                        textAlign="center" 
                                        py={4}
                                        sx={{ 
                                            background: alpha(theme.palette.grey[500], 0.1),
                                            borderRadius: 2,
                                            border: `1px dashed ${alpha(theme.palette.grey[500], 0.3)}`
                                        }}
                                    >
                                        <Typography color="text.secondary" fontWeight="500">
                                            No classes scheduled for {day}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                ))}
            </Box>
        );
    };

    const renderDesktopView = (filteredDays: DayOfWeek[]) => {
        return (
            <TableContainer 
                component={Paper} 
                sx={{ 
                    overflowX: 'auto',
                    background: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.paper, 0.6)
                        : alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                    borderRadius: 3
                }}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 'bold', 
                                    minWidth: 120,
                                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                }}
                            >
                                Time Slot
                            </TableCell>
                            {filteredDays.map((day) => (
                                <TableCell 
                                    key={day} 
                                    align="center" 
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        minWidth: 250,
                                        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                    }}
                                >
                                    {day}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(grid?.cells || []).map((row, rowIndex) => (
                            <TableRow 
                                key={rowIndex}
                                sx={{
                                    '&:hover': {
                                        background: alpha(theme.palette.primary.main, 0.05)
                                    }
                                }}
                            >
                                <TableCell 
                                    component="th" 
                                    scope="row" 
                                    sx={{ 
                                        fontWeight: 'medium',
                                        background: alpha(theme.palette.grey[100], theme.palette.mode === 'dark' ? 0.1 : 0.5)
                                    }}
                                >
                                    <Box textAlign="center">
                                        <Typography variant="body2" fontWeight="600">
                                            {grid?.timeSlots?.[rowIndex]?.startTime || ''}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            to
                                        </Typography>
                                        <Typography variant="body2" fontWeight="600">
                                            {grid?.timeSlots?.[rowIndex]?.endTime || ''}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                {filteredDays.map((day, dayIndex) => {
                                    const originalDayIndex = (grid?.days || []).indexOf(day);
                                    const cell = row[originalDayIndex];
                                    
                                    return (
                                        <TableCell 
                                            key={dayIndex} 
                                            align="center" 
                                            sx={{
                                                bgcolor: cell?.subject ? getSubjectTypeColor(cell.subject.type) : 'inherit',
                                                minHeight: 100,
                                                verticalAlign: 'top',
                                                p: 1.5,
                                                color: cell?.subject && theme.palette.mode === 'dark' ? 'common.white' : 'inherit',
                                                position: 'relative'
                                            }}
                                        >
                                            {cell?.subject && (
                                                <Box
                                                    sx={{
                                                        borderRadius: 2,
                                                        p: 1.5,
                                                        background: alpha(theme.palette.background.paper, 0.1),
                                                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                                                    }}
                                                >
                                                    <Typography 
                                                        variant="subtitle2" 
                                                        fontWeight="700" 
                                                        gutterBottom
                                                        sx={{ 
                                                            color: theme.palette.mode === 'dark' ? 'common.white' : 'inherit' 
                                                        }}
                                                    >
                                                        {isSpecialSlotType(cell.subject.type) ? cell.subject.type : cell.subject.code}
                                                    </Typography>
                                                    {!isSpecialSlotType(cell.subject.type) && (
                                                        <Typography 
                                                            variant="body2" 
                                                            gutterBottom
                                                            fontWeight="500"
                                                            sx={{ 
                                                                color: theme.palette.mode === 'dark' ? 'common.white' : 'inherit' 
                                                            }}
                                                        >
                                                            {cell.subject.name}
                                                        </Typography>
                                                    )}
                                                    <Chip
                                                        size="small"
                                                        label={cell.subject.type}
                                                        color={getSubjectTypeChipColor(cell.subject.type)}
                                                        sx={{ mb: 1, fontWeight: 500 }}
                                                    />
                                                    {!isSpecialSlotType(cell.subject.type) && (
                                                        <Typography 
                                                            variant="caption" 
                                                            display="block" 
                                                            sx={{ 
                                                                color: theme.palette.mode === 'dark' ? 'grey.200' : 'text.secondary',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            📍 {cell.subject.room.buildingCode}{cell.subject.room.floorNumber}{cell.subject.room.roomNumber}
                                                        </Typography>
                                                    )}
                                                    {!isSpecialSlotType(cell.subject.type) && cell.subject.faculty && (
                                                        <Typography 
                                                            variant="caption" 
                                                            display="block" 
                                                            sx={{ 
                                                                color: theme.palette.mode === 'dark' ? 'grey.200' : 'text.secondary',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            👨‍🏫 {cell.subject.faculty}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!grid) {
        return (
            <Alert severity="warning" sx={{ mb: 2 }}>
                Timetable data not available
            </Alert>
        );
    }

    return (
        <Box>
            {/* Modern Day Selection Tabs */}
            {grid && grid.days && grid.days.length > 0 && (
                <Card 
                    sx={{ 
                        mb: 3, 
                        background: theme.palette.mode === 'dark' 
                            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                >
                    <CardContent sx={{ pb: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Typography 
                                variant="h6" 
                                fontWeight="600"
                                sx={{ 
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}
                            >
                                Select Day
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={handleEdit}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        fontWeight: 500,
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        '&:hover': {
                                            background: alpha(theme.palette.primary.main, 0.1),
                                            transform: 'translateY(-1px)',
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                                        }
                                    }}
                                >
                                    Edit
                                </Button>
                                <IconButton onClick={handleMenuOpen} size="small">
                                    <MoreVert />
                                </IconButton>
                            </Box>
                        </Box>
                        
                        <Tabs
                            value={selectedDay}
                            onChange={(_, newValue) => setSelectedDay(newValue)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    minHeight: 48,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: 2,
                                    mx: 0.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        background: alpha(theme.palette.primary.main, 0.1),
                                        transform: 'translateY(-1px)'
                                    }
                                },
                                '& .MuiTab-root.Mui-selected': {
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    color: 'white',
                                    fontWeight: 600,
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                                },
                                '& .MuiTabs-indicator': {
                                    display: 'none'
                                }
                            }}
                        >
                            <Tab label="All Days" value="all" />
                            {grid.days.map((day) => (
                                <Tab key={day} label={day} value={day} />
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* Metadata Card */}
            <Fade in={true}>
                <Card 
                    sx={{ 
                        mb: 3,
                        background: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.background.paper, 0.6)
                            : alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`
                    }}
                >
                    <CardContent>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={3}>
                            <Box flex={1}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <School sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                                    <Typography variant="body1" fontWeight="500">
                                        {timetable.metadata?.programName || 'N/A'}
                                    </Typography>
                                </Box>
                                
                                <Box display="flex" alignItems="center" mb={1}>
                                    <DateRange sx={{ fontSize: 20, mr: 1, color: 'secondary.main' }} />
                                    <Typography variant="body1" fontWeight="500">
                                        {timetable.metadata?.semester || 'N/A'}
                                    </Typography>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                                    Academic Year: {timetable.metadata?.academicYear || 'N/A'}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                                    Published: {timetable.metadata?.publishDate ? new Date(timetable.metadata.publishDate).toLocaleDateString() : 'N/A'}
                                </Typography>
                            </Box>

                            <Box>
                                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                    <Chip
                                        label={`Batch ${timetable.metadata?.batch || 'N/A'}`}
                                        color={getBatchColor(timetable.metadata?.batch)}
                                        variant="outlined"
                                        sx={{ fontWeight: 500 }}
                                    />
                                    <Chip
                                        label={timetable.metadata?.programType || 'N/A'}
                                        color={getProgramTypeColor(timetable.metadata?.programType)}
                                        variant="outlined"
                                        sx={{ fontWeight: 500 }}
                                    />
                                    {timetable.isActive && (
                                        <Chip
                                            label="Active"
                                            color="success"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    )}
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                                    {(timetable.subjects?.length || 0)} subjects • {grid?.days?.length || 0} days
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Fade>

            {/* Timetable Grid */}
            <Slide direction="up" in={true}>
                <Box>
                    {renderTimetableContent()}
                </Box>
            </Slide>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        background: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }
                }}
            >
                <MenuItem onClick={handleEdit}>
                    <Edit sx={{ mr: 1 }} />
                    Edit Timetable
                </MenuItem>
                <MenuItem onClick={handleDuplicate} disabled={duplicating}>
                    <ContentCopy sx={{ mr: 1 }} />
                    {duplicating ? 'Duplicating...' : 'Duplicate Timetable'}
                </MenuItem>
                <MenuItem onClick={handleExport}>
                    <FileDownload sx={{ mr: 1 }} />
                    Export PDF
                </MenuItem>
            </Menu>

            {/* Edit Timetable Dialog */}
            <EditTimetableDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                timetable={timetable}
                onSuccess={handleEditSuccess}
            />
        </Box>
    );
};

export default TimetableView;
