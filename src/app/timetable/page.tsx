'use client';

import React from 'react';
import TimetableManager from '@/Components/Timetable/TimetableManager';

const TimetablePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background">
            <TimetableManager />
        </div>
    );
};

export default TimetablePage;
