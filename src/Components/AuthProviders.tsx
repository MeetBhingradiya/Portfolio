"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@contexts/NextAuthContext";

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
