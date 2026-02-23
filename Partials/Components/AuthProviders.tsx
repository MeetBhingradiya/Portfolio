"use client";

import { SessionProvider } from "../Lib/auth-client";
import { AuthProvider } from "../contexts/NextAuthContext";

interface AuthProvidersProps {
    children: React.ReactNode;
}

export function AuthProviders({ children }: AuthProvidersProps) {
    return (
        <SessionProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </SessionProvider>
    );
}
