'use client';

import { useState, useEffect } from 'react';

interface OfflineState {
    isOffline: boolean;
    isOnline: boolean;
    wasOffline: boolean;
}

export const useOffline = () => {
    const [offlineState, setOfflineState] = useState<OfflineState>({
        isOffline: false,
        isOnline: true,
        wasOffline: false
    });

    useEffect(() => {
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            const isOffline = !isOnline;
            
            setOfflineState(prev => ({
                isOffline,
                isOnline,
                wasOffline: prev.isOffline || isOffline
            }));
        };

        // Set initial state
        updateOnlineStatus();

        // Listen for online/offline events
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    return offlineState;
};

export const useServiceWorker = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            setIsSupported(true);
            
            // Register service worker
            navigator.serviceWorker.register('/timetable-sw.js', {
                scope: '/timetable'
            })
                .then((reg) => {
                    setIsRegistered(true);
                    setRegistration(reg);
                    console.log('Timetable Service Worker registered');
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    const triggerSync = () => {
        if (registration && 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            return (registration as any).sync.register('background-sync-timetables');
        }
        return Promise.reject('Background sync not supported');
    };

    return {
        isSupported,
        isRegistered,
        registration,
        triggerSync
    };
};
