'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDesignTheme } from '../../Hooks/useDesignTheme';
import { LiquidGlassCard, LiquidGlassButton } from '../../Components/LiquidGlass';
import { OneUICard, OneUIButton } from '../../Components/OneUI';
import {
    Add,
    ArrowBack,
    Refresh,
    CalendarMonth,
    Security,
    Close,
    Schedule,
    Event,
    Today,
    AccessTime,
    Class,
    LocationOn,
    Person,
    GridView,
    ViewList as ViewListIcon,
    Search,
    FilterList
} from '@mui/icons-material';
import { TimetableProvider, useTimetable } from '../../Components/Timetable/index';
import { Timetable } from '../../Types/Timetable';

interface TimetableEntry {
    day: string;
    time: string;
    subject: string;
    location: string;
    instructor?: string;
    type?: 'lecture' | 'lab' | 'tutorial';
}

function TimetablePageContent() {
    const { designTheme, colorMode } = useDesignTheme();
    const isApple = designTheme === 'apple';
    const isDark = colorMode === 'dark';
    const { timetables, loading } = useTimetable();

    const [currentView, setCurrentView] = useState<'list' | 'view'>('list');
    const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'lecture':
                return 'from-blue-500 to-blue-600';
            case 'lab':
                return 'from-purple-500 to-purple-600';
            case 'tutorial':
                return 'from-green-500 to-green-600';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    const TimetableCard = ({ timetable }: { timetable: Timetable }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -8 }}
            onClick={() => {
                setSelectedTimetable(timetable);
                setCurrentView('view');
            }}
            className="cursor-pointer"
        >
            <Card className="h-full group">
                <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-2 rounded-${isApple ? 'lg' : 'xl'} bg-gradient-to-br ${getTypeColor('lecture')}`}>
                                    <CalendarMonth className="text-white w-5 h-5" />
                                </div>
                                {timetable.isActive && (
                                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                        Active
                                    </span>
                                )}
                            </div>
                            <h3 className={`font-${isApple ? 'bold' : 'black'} text-xl ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-accent-500 transition-colors line-clamp-1`}>
                                {timetable.title}
                            </h3>
                            {timetable.metadata?.programName && (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mt-1`}>
                                    {timetable.metadata.programName}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm">
                        {timetable.metadata?.publishDate && (
                            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Today className="w-4 h-4" />
                                <span>Published: {new Date(timetable.metadata.publishDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        {timetable.metadata?.semester && (
                            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Event className="w-4 h-4" />
                                <span>Semester {timetable.metadata.semester}</span>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className={`flex items-center gap-4 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                            <Class className="w-4 h-4 text-blue-500" />
                            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {timetable.subjects?.length || 0}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                classes
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    const TimetableDetailView = ({ timetable }: { timetable: Timetable }) => (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="p-8">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <h1 className={`text-4xl font-${isApple ? 'bold' : 'black'} ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                            {timetable.title}
                        </h1>
                        {timetable.metadata?.programName && (
                            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {timetable.metadata.programName} - {timetable.metadata.semester}
                            </p>
                        )}
                    </div>
                    {timetable.isActive && (
                        <div className="px-4 py-2 rounded-full bg-green-500 text-white font-bold shadow-lg flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span>Active Schedule</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <Today className="text-blue-500" />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Published: {timetable.metadata?.publishDate ? new Date(timetable.metadata.publishDate).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    {timetable.metadata?.academicYear && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-${isApple ? 'lg' : 'xl'} ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <Event className="text-purple-500" />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Academic Year: {timetable.metadata.academicYear}
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-${isApple ? 'bold' : 'black'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Schedule
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-${isApple ? 'lg' : 'xl'} transition-all ${
                            viewMode === 'grid'
                                ? 'bg-accent-500 text-white'
                                : isDark
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <GridView />
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-2 rounded-${isApple ? 'lg' : 'xl'} transition-all ${
                            viewMode === 'calendar'
                                ? 'bg-accent-500 text-white'
                                : isDark
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <ViewListIcon />
                    </button>
                </div>
            </div>

            {/* Schedule Display */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timetable.subjects?.map((entry, index: number) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-5 h-full hover:shadow-xl transition-all">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTypeColor(entry.type.toLowerCase())} text-white`}>
                                            {entry.day}
                                        </span>
                                        <span className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {entry.timeSlot.startTime} - {entry.timeSlot.endTime}
                                        </span>
                                    </div>
                                    
                                    <h4 className={`font-${isApple ? 'semibold' : 'bold'} text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {entry.name}
                                    </h4>
                                    
                                    {entry.room && entry.room.buildingCode && (
                                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <LocationOn className="w-4 h-4" />
                                            <span>{entry.room.buildingCode}{entry.room.floorNumber}{entry.room.roomNumber}</span>
                                        </div>
                                    )}
                                    
                                    {entry.faculty && (
                                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <Person className="w-4 h-4" />
                                            <span>{entry.faculty}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="p-6">
                    <div className="space-y-4">
                        {days.map((day) => {
                            const daySchedule = timetable.subjects?.filter((s) => s.day === day) || [];
                            return (
                                <div key={day} className={`pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} last:border-0`}>
                                    <h3 className={`font-${isApple ? 'semibold' : 'bold'} text-lg ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                                        {day}
                                    </h3>
                                    {daySchedule.length > 0 ? (
                                        <div className="space-y-2">
                                            {daySchedule.map((entry, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-4 p-3 rounded-${isApple ? 'lg' : 'xl'} ${
                                                        isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                                                    }`}
                                                >
                                                    <div className={`flex items-center gap-2 min-w-[100px] px-3 py-1 rounded-${isApple ? 'md' : 'lg'} bg-accent-500/10 text-accent-600 dark:text-accent-400`}>
                                                        <AccessTime className="w-4 h-4" />
                                                        <span className="text-sm font-semibold">{entry.timeSlot.startTime}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`font-${isApple ? 'semibold' : 'bold'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {entry.name}
                                                        </div>
                                                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {entry.room?.buildingCode && `${entry.room.buildingCode}${entry.room.floorNumber}${entry.room.roomNumber}`} {entry.faculty && `• ${entry.faculty}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
                                            No classes scheduled
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
            {/* Background Effects */}
            {isApple && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                </div>
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className={`sticky top-0 z-50 ${
                    isDark 
                        ? 'bg-gray-900/80 border-gray-800' 
                        : 'bg-white/80 border-gray-200'
                } backdrop-blur-xl border-b`}>
                    <div className="container mx-auto px-4 py-4 max-w-7xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {currentView === 'view' && (
                                    <motion.button
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => {
                                            setCurrentView('list');
                                            setSelectedTimetable(null);
                                        }}
                                        className={`p-2 rounded-${isApple ? 'lg' : 'xl'} transition-all ${
                                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <ArrowBack />
                                    </motion.button>
                                )}
                                <div>
                                    <h1 className={`text-3xl font-${isApple ? 'bold' : 'black'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {currentView === 'list' ? 'Timetables' : 'Schedule View'}
                                    </h1>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {currentView === 'list' ? 'Manage your schedules' : 'View your timetable'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    className={`p-2 rounded-${isApple ? 'lg' : 'xl'} transition-all ${
                                        isDark 
                                            ? 'bg-gray-800 hover:bg-gray-700' 
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                    title="Refresh"
                                >
                                    <Refresh />
                                </button>
                                {currentView === 'list' && (
                                    <Button variant="primary">
                                        <span className="flex items-center gap-2">
                                            <Add />
                                            <span>New Timetable</span>
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <AnimatePresence mode="wait">
                        {currentView === 'list' ? (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Search & Filter */}
                                <Card className="p-6 mb-6">
                                    <div className="relative">
                                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <input
                                            type="text"
                                            placeholder="Search timetables..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                                isDark
                                                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            } focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500`}
                                        />
                                    </div>
                                </Card>

                                {/* Timetables Grid */}
                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className={`h-64 rounded-${isApple ? 'xl' : '2xl'} ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`} />
                                        ))}
                                    </div>
                                ) : timetables && timetables.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {timetables.map((timetable: Timetable, index: number) => (
                                            <motion.div
                                                key={timetable._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <TimetableCard timetable={timetable} />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="p-12 text-center">
                                        <Schedule className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                                        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            No timetables found
                                        </h3>
                                        <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} mb-6`}>
                                            Create your first timetable to get started
                                        </p>
                                        <Button variant="primary">
                                            <span className="flex items-center gap-2">
                                                <Add />
                                                <span>Create Timetable</span>
                                            </span>
                                        </Button>
                                    </Card>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="detail"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {selectedTimetable && <TimetableDetailView timetable={selectedTimetable} />}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

const TimetablePage: React.FC = () => {
    return (
        <TimetableProvider refreshTrigger={0}>
            <TimetablePageContent />
        </TimetableProvider>
    );
};

export default TimetablePage;
