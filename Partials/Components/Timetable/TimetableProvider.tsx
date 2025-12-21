'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Timetable, TimetableListResponse, DayOfWeek, Batch, ProgramType } from '../../Types/Timetable';
import { Axios } from '../../Utils/Axios';
import { TimetableUtility } from '../../Utils/TimetableUtility';

interface TimetableContextType {
    timetables: Timetable[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    createTimetable: (data: any) => Promise<void>;
    updateTimetable: (id: string, data: any) => Promise<void>;
    deleteTimetable: (id: string) => Promise<void>;
    exportTimetable: (id: string, options: any) => Promise<void>;
    lockTimetable: (id: string, lockData: any) => Promise<void>;
    unlockTimetable: (id: string, unlockData: any) => Promise<void>;
    getLockStatus: (id: string) => Promise<any>;
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
    const [timetables, setTimetables] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTimetables = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await Axios.get('/api/timetable', {
                params: {
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                }
            });
            
            const data: TimetableListResponse = response.data;
            
            console.log('TimetableProvider: Fetched', data.timetables?.length || 0, 'timetables');
            setTimetables(data.timetables as Timetable[]);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred';
            setError(errorMessage);
            console.error('TimetableProvider: Error fetching timetables:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTimetable = async (data: any) => {
        try {
            await Axios.post('/api/timetable', data);
            await fetchTimetables(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create timetable';
            throw new Error(errorMessage);
        }
    };

    const updateTimetable = async (id: string, data: any) => {
        // Validate timetable ID before making API call
        if (!TimetableUtility.isValidTimetableId(id)) {
            throw new Error('Cannot update demo or invalid timetables');
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
        // Validate timetable ID before making API call
        if (!TimetableUtility.isValidTimetableId(id)) {
            throw new Error('Cannot delete demo or invalid timetables');
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
        // Validate timetable ID before making API call
        if (!TimetableUtility.isValidTimetableId(id)) {
            throw new Error('Cannot export demo or invalid timetables');
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

    const lockTimetable = async (id: string, lockData: any) => {
        // Validate timetable ID before making API call
        if (!TimetableUtility.isValidTimetableId(id)) {
            throw new Error('Cannot lock demo or invalid timetables');
        }
        
        try {
            await Axios.post(`/api/timetable/${id}/lock`, lockData);
            await fetchTimetables(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to lock timetable';
            throw new Error(errorMessage);
        }
    };

    const unlockTimetable = async (id: string, unlockData: any) => {
        // Validate timetable ID before making API call
        if (!TimetableUtility.isValidTimetableId(id)) {
            throw new Error('Cannot unlock demo or invalid timetables');
        }
        
        try {
            await Axios.delete(`/api/timetable/${id}/lock`, { data: unlockData });
            await fetchTimetables(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to unlock timetable';
            throw new Error(errorMessage);
        }
    };

    const getLockStatus = async (id: string) => {
        // Validate timetable ID before making API call
        if (!TimetableUtility.isValidTimetableId(id)) {
            throw new Error('Cannot get lock status for demo or invalid timetables');
        }
        
        try {
            const response = await Axios.get(`/api/timetable/${id}/lock`);
            return response.data.lockStatus;
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to get lock status';
            throw new Error(errorMessage);
        }
    };

    useEffect(() => {
        fetchTimetables();
    }, [refreshTrigger]);

    const value: TimetableContextType = {
        timetables: timetables || [], // Ensure it's never undefined
        loading,
        error,
        refetch: fetchTimetables,
        createTimetable,
        updateTimetable,
        deleteTimetable,
        exportTimetable,
        lockTimetable,
        unlockTimetable,
        getLockStatus
    };

    return (
        <TimetableContext.Provider value={value}>
            {children}
        </TimetableContext.Provider>
    );
};

export default TimetableProvider;
