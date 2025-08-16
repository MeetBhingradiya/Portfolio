'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    IconButton, 
    Card,
    CardContent,
    Slide,
    Fade,
    useTheme,
    alpha
} from '@mui/material';
import { 
    Add, 
    ArrowBack, 
    Refresh, 
    CalendarMonth,
    GridView 
} from '@mui/icons-material';
import TimetableList from './TimetableList';
import TimetableView from './TimetableView';
import CreateTimetableDialog from './CreateTimetableDialog';
import TimetableProvider from './TimetableProvider';
import { Timetable } from '@/Types/Timetable';

const TimetableManager: React.FC = () => {
    const theme = useTheme();
    const [currentView, setCurrentView] = useState<'list' | 'view'>('list');
    const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleTimetableSelect = (timetable: Timetable) => {
        setSelectedTimetable(timetable);
        setCurrentView('view');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedTimetable(null);
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <TimetableProvider refreshTrigger={refreshTrigger}>
            <Box 
                sx={{ 
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark' 
                        ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`
                        : `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Modern Header */}
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        background: theme.palette.mode === 'dark'
                            ? alpha(theme.palette.grey[900], 0.8)
                            : alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(20px)',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        py: 2
                    }}
                >
                    <Container maxWidth="lg">
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={2}>
                                {currentView === 'view' && (
                                    <Fade in={true}>
                                        <IconButton
                                            onClick={handleBackToList}
                                            sx={{
                                                background: alpha(theme.palette.primary.main, 0.1),
                                                '&:hover': {
                                                    background: alpha(theme.palette.primary.main, 0.2),
                                                    transform: 'scale(1.05)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <ArrowBack />
                                        </IconButton>
                                    </Fade>
                                )}
                                
                                <Box>
                                    <Typography 
                                        variant="h4" 
                                        fontWeight="700"
                                        sx={{
                                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text'
                                        }}
                                    >
                                        {currentView === 'list' ? 'Timetables' : selectedTimetable?.title}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ opacity: 0.7 }}
                                    >
                                        {currentView === 'list' ? 'Manage your schedules' : 'View your schedule'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Action Buttons */}
                            <Box display="flex" gap={1}>
                                <IconButton
                                    onClick={handleRefresh}
                                    sx={{
                                        background: alpha(theme.palette.secondary.main, 0.1),
                                        '&:hover': {
                                            background: alpha(theme.palette.secondary.main, 0.2),
                                            transform: 'rotate(180deg)'
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <Refresh />
                                </IconButton>
                                
                                {currentView === 'list' && (
                                    <IconButton
                                        onClick={() => setCreateDialogOpen(true)}
                                        sx={{
                                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            color: 'white',
                                            '&:hover': {
                                                transform: 'scale(1.1)',
                                                boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
                                            },
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Add />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Container>
                </Box>

                {/* Content Area */}
                <Container maxWidth="lg" sx={{ py: 3 }}>
                    <Slide direction="up" in={true} mountOnEnter unmountOnExit>
                        <Box>
                            {currentView === 'list' ? (
                                <TimetableList onTimetableSelect={handleTimetableSelect} />
                            ) : (
                                <TimetableView 
                                    timetable={selectedTimetable!} 
                                    onBack={handleBackToList}
                                />
                            )}
                        </Box>
                    </Slide>
                </Container>

                {/* Create Dialog */}
                <CreateTimetableDialog
                    open={createDialogOpen}
                    onClose={() => setCreateDialogOpen(false)}
                    onSuccess={() => {
                        setCreateDialogOpen(false);
                        handleRefresh();
                    }}
                />

                {/* Background Decoration */}
                <Box
                    sx={{
                        position: 'fixed',
                        top: -100,
                        right: -100,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                        pointerEvents: 'none',
                        zIndex: -1
                    }}
                />
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: -150,
                        left: -150,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
                        pointerEvents: 'none',
                        zIndex: -1
                    }}
                />
            </Box>
        </TimetableProvider>
    );
};

export default TimetableManager;
