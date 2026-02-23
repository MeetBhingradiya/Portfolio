'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email?: string;
}

interface Session {
    user: User;
}

interface AuthContextType {
    data: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    signIn: (credentials: { name: string; email?: string }) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSession = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useSession must be used within an AuthProvider');
    }
    return { data: context.data, status: context.status };
};

interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('authenticated');

    const signIn = async (credentials: { name: string; email?: string }) => {
        setStatus('loading');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSession({
            user: {
                id: Date.now().toString(),
                name: credentials.name,
                email: credentials.email
            }
        });
        setStatus('authenticated');
    };

    const signOut = async () => {
        setStatus('loading');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSession(null);
        setStatus('unauthenticated');
    };

    return (
        <AuthContext.Provider
            value={{
                data: session,
                status,
                signIn,
                signOut
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
