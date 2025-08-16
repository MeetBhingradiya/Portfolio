'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    InputAdornment,
    Alert,
    CircularProgress,
    useTheme,
    useMediaQuery,
    Fade,
    Slide,
    alpha
} from '@mui/material';
import {
    MoreVert,
    Search,
    Schedule,
    School,
    DateRange,
    Edit,
    Delete,
    FileDownload,
    Visibility
} from '@mui/icons-material';
import { useTimetable } from './TimetableProvider';
import { Timetable, Batch, ProgramType } from '@/Types/Timetable';
import EditTimetableDialog from './EditTimetableDialog';

interface TimetableListProps {
    onTimetableSelect: (timetable: Timetable) => void;
}

const TimetableList: React.FC<TimetableListProps> = ({ onTimetableSelect }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { timetables, loading, error, isOffline, deleteTimetable, exportTimetable } = useTimetable();

    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, timetableId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedTimetableId(timetableId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTimetableId(null);
    };

    const handleDelete = async () => {
        if (selectedTimetableId) {
            try {
                await deleteTimetable(selectedTimetableId);
                handleMenuClose();
            } catch (error) {
                console.error('Error deleting timetable:', error);
            }
        }
    };

    const handleExport = async () => {
        if (selectedTimetableId) {
            try {
                await exportTimetable(selectedTimetableId, {
                    format: 'A4',
                    orientation: 'landscape',
                    includeMetadata: true,
                    includeEmptySlots: false
                });
                handleMenuClose();
            } catch (error) {
                console.error('Error exporting timetable:', error);
            }
        }
    };

    const handleEdit = () => {
        if (selectedTimetableId) {
            const timetable = timetables.find(t => t._id === selectedTimetableId);
            if (timetable) {
                setSelectedTimetable(timetable);
                setEditDialogOpen(true);
            }
        }
        handleMenuClose();
    };

    const handleEditSuccess = () => {
        setEditDialogOpen(false);
        setSelectedTimetable(null);
        // The list will automatically refresh through the context
    };

    const filteredTimetables = (timetables || []).filter(timetable =>
        timetable.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        timetable.metadata?.programName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        timetable.metadata?.semester?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getBatchColor = (batch?: Batch) => {
        switch (batch) {
            case Batch.A: return 'primary';
            case Batch.B: return 'secondary';
            case Batch.C: return 'success';
            default: return 'default';
        }
    };

    const getProgramTypeColor = (type?: ProgramType) => {
        return type === ProgramType.D2D ? 'warning' : 'info';
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

    return (
        <Box>
            {/* Modern Search Section */}
            <Fade in={true}>
                <Card 
                    sx={{ 
                        mb: 4,
                        background: theme.palette.mode === 'dark' 
                            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`
                    }}
                >
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Typography 
                                variant="h5" 
                                fontWeight="700"
                                sx={{
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}
                            >
                                My Timetables ({filteredTimetables.length})
                            </Typography>
                            {isOffline && (
                                <Chip
                                    label="🔄 Offline Mode"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                />
                            )}
                        </Box>

                        <TextField
                            fullWidth
                            placeholder="Search timetables by title, program, or semester..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ 
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background: alpha(theme.palette.background.paper, 0.6),
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                                    },
                                    '&.Mui-focused': {
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                                    }
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </Fade>

            {/* Timetable Grid */}
            {filteredTimetables.length === 0 ? (
                <Slide direction="up" in={true}>
                    <Box 
                        textAlign="center" 
                        py={8}
                        sx={{
                            background: theme.palette.mode === 'dark' 
                                ? alpha(theme.palette.background.paper, 0.3)
                                : alpha(theme.palette.background.paper, 0.6),
                            borderRadius: 3,
                            border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                    >
                        <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {searchQuery ? 'No timetables found' : 'No timetables yet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchQuery 
                                ? 'Try adjusting your search terms' 
                                : 'Create your first timetable to get started'
                            }
                        </Typography>
                    </Box>
                </Slide>
            ) : (
                <Box
                    display="grid"
                    gridTemplateColumns={{
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)'
                    }}
                    gap={3}
                >
                    {filteredTimetables.map((timetable, index) => (
                        <Fade in={true} timeout={300 + index * 100} key={timetable._id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.6)
                                        : alpha(theme.palette.background.paper, 0.9),
                                    backdropFilter: 'blur(20px)',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    borderRadius: 3,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                                        '& .card-actions': {
                                            transform: 'translateY(0)',
                                            opacity: 1
                                        }
                                    },
                                    cursor: 'pointer'
                                }}
                                onClick={() => onTimetableSelect(timetable)}
                            >
                                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography 
                                            variant="h6" 
                                            fontWeight="700"
                                            sx={{
                                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text',
                                                flex: 1,
                                                pr: 1
                                            }}
                                        >
                                            {timetable.title}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMenuOpen(e, timetable._id);
                                                setSelectedTimetable(timetable);
                                            }}
                                            sx={{ 
                                                opacity: 0.7,
                                                '&:hover': { opacity: 1 }
                                            }}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    </Box>

                                    <Box display="flex" flexDirection="column" gap={1.5} mb={2}>
                                        <Box display="flex" alignItems="center">
                                            <School sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                                            <Typography variant="body2" fontWeight="500">
                                                {timetable.metadata?.programName || 'N/A'}
                                            </Typography>
                                        </Box>
                                        
                                        <Box display="flex" alignItems="center">
                                            <DateRange sx={{ fontSize: 16, mr: 1, color: 'secondary.main' }} />
                                            <Typography variant="body2" fontWeight="500">
                                                {timetable.metadata?.semester || 'N/A'}
                                            </Typography>
                                        </Box>
                                        
                                        <Box display="flex" alignItems="center">
                                            <Schedule sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {timetable.subjects?.length || 0} subjects • {timetable.visibleDays?.length || 0} days
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        <Chip
                                            label={`Batch ${timetable.metadata?.batch || 'N/A'}`}
                                            color={getBatchColor(timetable.metadata?.batch)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 500 }}
                                        />
                                        <Chip
                                            label={timetable.metadata?.programType || 'N/A'}
                                            color={getProgramTypeColor(timetable.metadata?.programType)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 500 }}
                                        />
                                        {timetable.isActive && (
                                            <Chip
                                                label="Active"
                                                color="success"
                                                size="small"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        )}
                                    </Box>
                                </CardContent>

                                <CardActions 
                                    className="card-actions"
                                    sx={{ 
                                        pt: 0,
                                        px: 2,
                                        pb: 2,
                                        transform: 'translateY(8px)',
                                        opacity: 0,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<Visibility />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTimetableSelect(timetable);
                                        }}
                                        sx={{
                                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            '&:hover': {
                                                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                                            }
                                        }}
                                    >
                                        View Timetable
                                    </Button>
                                </CardActions>
                            </Card>
                        </Fade>
                    ))}
                </Box>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    const timetable = timetables.find(t => t._id === selectedTimetableId);
                    if (timetable) onTimetableSelect(timetable);
                    handleMenuClose();
                }}>
                    <Visibility sx={{ mr: 1 }} />
                    View
                </MenuItem>
                <MenuItem onClick={handleEdit}>
                    <Edit sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleExport}>
                    <FileDownload sx={{ mr: 1 }} />
                    Export PDF
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <Delete sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Edit Dialog */}
            <EditTimetableDialog
                open={editDialogOpen}
                timetable={selectedTimetable}
                onClose={() => setEditDialogOpen(false)}
                onSuccess={handleEditSuccess}
            />
        </Box>
    );
};

export default TimetableList;
