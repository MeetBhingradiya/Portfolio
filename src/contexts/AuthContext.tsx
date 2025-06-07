'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Axios } from '@Utils/Axios';

// Types
interface User {
    UserID: string;
    Username: string;
    FirstName: string;
    LastName: string;
    Email: string;
    Role?: string;
    isAdmin?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    sessionID: string | null;
    
    // Authentication methods
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresUsername?: boolean }>;
    logout: () => Promise<void>;
    
    // Session management
    refreshSession: () => Promise<void>;
    
    // User state
    isAuthenticated: boolean;
    isAdmin: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionID, setSessionID] = useState<string | null>(null);
    const router = useRouter();

    // Initialize authentication state
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const storedSessionID = localStorage.getItem('sessionID');
            if (!storedSessionID) {
                setLoading(false);
                return;
            }

            setSessionID(storedSessionID);
            await validateSession(storedSessionID);
        } catch (error) {
            console.error('Auth initialization error:', error);
            await clearAuth();
        } finally {
            setLoading(false);
        }
    };

    const validateSession = async (sessionId: string) => {
        try {
            const response = await Axios.post('/api/session', { sessionID: sessionId });
            
            if (response.data.Status === 1) {
                const userData = response.data.Data.user;
                setUser(userData);
                setSessionID(sessionId);
                return true;
            } else {
                await clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Session validation error:', error);
            await clearAuth();
            return false;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            
            const response = await Axios.post('/api/signin', {
                email: email.toLowerCase(),
                password
            });

            if (response.data.Status === 1) {
                const data = response.data.Data;
                
                // Check if username creation is required
                if (data.requiresUsername) {
                    return { 
                        success: true, 
                        requiresUsername: true,
                        tempToken: data.tempToken 
                    };
                }

                // Successful login with session
                if (data.sessionID) {
                    localStorage.setItem('sessionID', data.sessionID);
                    setSessionID(data.sessionID);
                    setUser(data.user);
                    return { success: true };
                }
            }

            return { 
                success: false, 
                error: response.data.Message || 'Login failed' 
            };

        } catch (error: any) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.response?.data?.Message || 'Network error occurred' 
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (sessionID) {
                // Call logout API
                await Axios.delete('/api/session', { 
                    data: { sessionID } 
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with local logout even if API fails
        } finally {
            await clearAuth();
            router.push('/');
        }
    };

    const clearAuth = async () => {
        setUser(null);
        setSessionID(null);
        localStorage.removeItem('sessionID');
    };

    const refreshSession = async () => {
        if (sessionID) {
            await validateSession(sessionID);
        }
    };

    // Computed properties
    const isAuthenticated = !!user && !!sessionID;
    const isAdmin = user?.isAdmin || user?.Role?.toLowerCase() === 'admin' || false;

    const value: AuthContextType = {
        user,
        loading,
        sessionID,
        login,
        logout,
        refreshSession,
        isAuthenticated,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context as AuthContextType;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    requireAdmin: boolean = false
) {
    return function AuthenticatedComponent(props: P) {
        const { isAuthenticated, isAdmin, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading) {
                if (!isAuthenticated) {
                    router.push('/auth/signin');
                } else if (requireAdmin && !isAdmin) {
                    router.push('/dashboard');
                }
            }
        }, [isAuthenticated, isAdmin, loading, router]);

        if (loading) {
            return (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    Loading...
                </div>
            );
        }

        if (!isAuthenticated || (requireAdmin && !isAdmin)) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}
