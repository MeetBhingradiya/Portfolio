'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Timetable, TimetableListResponse, DayOfWeek, Batch, ProgramType } from '@/Types/Timetable';
import { useOffline, useServiceWorker } from '@/Hooks/useOffline';
import { Axios } from '@/Utils/Axios';

interface TimetableContextType {
    timetables: Timetable[];
    loading: boolean;
    error: string | null;
    isOffline: boolean;
    refetch: () => Promise<void>;
    createTimetable: (data: any) => Promise<void>;
    updateTimetable: (id: string, data: any) => Promise<void>;
    deleteTimetable: (id: string) => Promise<void>;
    exportTimetable: (id: string, options: any) => Promise<void>;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const useTimetable = () => {
    const context = useContext(TimetableContext);
    if (!context) {
        throw new Error('useTimetable must be used within a TimetableProvider');
    }
    return context;
};

interface TimetableProviderProps {
    children: ReactNode;
    refreshTrigger?: number;
}

const TimetableProvider: React.FC<TimetableProviderProps> = ({ children, refreshTrigger = 0 }) => {
    const { isOffline } = useOffline();
    const { isRegistered, triggerSync } = useServiceWorker();
    
    const [timetables, setTimetables] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTimetables = async () => {
        console.log('Fetching timetables (anonymous mode)');
        setLoading(true);
        setError(null);
        
        try {
            const response = await Axios.get('/api/timetable', {
                params: {
                    limit: 50,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                }
            });
            
            const data: TimetableListResponse = response.data;
            
            // Check if response indicates offline mode
            if (data.offline) {
                setError('You are offline. Showing cached data.');
            }
            
            setTimetables(data.timetables as Timetable[]);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred';
            setError(isOffline ? 'You are offline. Please check your connection.' : errorMessage);
            console.error('Error fetching timetables:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTimetable = async (data: any) => {
        if (isOffline) {
            throw new Error('Cannot create timetables while offline');
        }
        
        try {
            await Axios.post('/api/timetable', data);
            await fetchTimetables(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create timetable';
            throw new Error(errorMessage);
        }
    };

    const updateTimetable = async (id: string, data: any) => {
        if (isOffline) {
            throw new Error('Cannot update timetables while offline');
        }
        
        try {
            await Axios.put(`/api/timetable/${id}`, data);
            await fetchTimetables(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update timetable';
            throw new Error(errorMessage);
        }
    };

    const deleteTimetable = async (id: string) => {
        if (isOffline) {
            throw new Error('Cannot delete timetables while offline');
        }
        
        try {
            await Axios.delete(`/api/timetable/${id}`);
            await fetchTimetables(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete timetable';
            throw new Error(errorMessage);
        }
    };

    const exportTimetable = async (id: string, options: any) => {
        if (isOffline) {
            throw new Error('Cannot export timetables while offline');
        }
        
        try {
            const response = await Axios.post(`/api/timetable/${id}/export`, 
                { options },
                { responseType: 'blob' }
            );

            // Download the PDF
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timetable-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to export timetable';
            throw new Error(errorMessage);
        }
    };

    useEffect(() => {
        fetchTimetables();
    }, [refreshTrigger]);

    // Trigger background sync when coming back online
    useEffect(() => {
        if (!isOffline && isRegistered) {
            triggerSync().catch(console.error);
        }
    }, [isOffline, isRegistered, triggerSync]);

    const value: TimetableContextType = {
        timetables: timetables || [], // Ensure it's never undefined
        loading,
        error,
        isOffline,
        refetch: fetchTimetables,
        createTimetable,
        updateTimetable,
        deleteTimetable,
        exportTimetable,
    };

    return (
        <TimetableContext.Provider value={value}>
            {children}
        </TimetableContext.Provider>
    );
};

export default TimetableProvider;
