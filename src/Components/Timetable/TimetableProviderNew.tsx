'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Timetable, TimetableListResponse, DayOfWeek, Batch, ProgramType } from '@/Types/Timetable';
import { useOffline, useServiceWorker } from '@/Hooks/useOffline';
import { useSession } from './AuthProvider';

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
    const { data: session } = useSession();
    const { isOffline } = useOffline();
    const { isRegistered, triggerSync } = useServiceWorker();
    
    const [timetables, setTimetables] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTimetables = async () => {
        if (!session?.user?.id) {
            console.log('No session user ID, skipping fetch');
            return;
        }
        
        console.log('Fetching timetables for user:', session.user.id);
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/timetable?limit=50&sortBy=createdAt&sortOrder=desc');
            
            if (!response.ok) {
                throw new Error('Failed to fetch timetables');
            }
            
            const data: TimetableListResponse = await response.json();
            
            // Check if response indicates offline mode
            if (data.offline) {
                setError('You are offline. Showing cached data.');
            }
            
            setTimetables(data.timetables as Timetable[]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
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
            const response = await fetch('/api/timetable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to create timetable');
            }

            await fetchTimetables(); // Refresh the list
        } catch (err) {
            throw err;
        }
    };

    const updateTimetable = async (id: string, data: any) => {
        if (isOffline) {
            throw new Error('Cannot update timetables while offline');
        }
        
        try {
            const response = await fetch(`/api/timetable/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update timetable');
            }

            await fetchTimetables(); // Refresh the list
        } catch (err) {
            throw err;
        }
    };

    const deleteTimetable = async (id: string) => {
        if (isOffline) {
            throw new Error('Cannot delete timetables while offline');
        }
        
        try {
            const response = await fetch(`/api/timetable/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete timetable');
            }

            await fetchTimetables(); // Refresh the list
        } catch (err) {
            throw err;
        }
    };

    const exportTimetable = async (id: string, options: any) => {
        if (isOffline) {
            throw new Error('Cannot export timetables while offline');
        }
        
        try {
            const response = await fetch(`/api/timetable/${id}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ options }),
            });

            if (!response.ok) {
                throw new Error('Failed to export timetable');
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timetable-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        fetchTimetables();
    }, [session, refreshTrigger]);

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
