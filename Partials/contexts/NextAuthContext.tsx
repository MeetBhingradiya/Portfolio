"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession, signIn, signOut } from "../Lib/auth-client";
import { useRouter } from "next/navigation";
import { Axios } from "../Utils/Axios";

// Types
interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    firstName: string;
    lastName: string;
    image?: string;
    isAdmin: boolean;
    isEmailVerified: boolean;
    isMFAEnabled: boolean;
}

interface AuthContextType {
    // User state
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;

    // Authentication methods
    login: (provider: string, options?: any) => Promise<void>;
    logout: () => Promise<void>;
    
    // Session management
    refreshSession: () => Promise<void>;
    
    // Credential-based auth (for backward compatibility)
    credentialLogin: (email: string, password: string) => Promise<{
        success: boolean;
        error?: string;
        requiresUsername?: boolean;
    }>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { data: session, isPending } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Update user state when session changes
    useEffect(() => {
        if (isPending) {
            setLoading(true);
            return;
        }

        if (session?.user) {
            const user = session.user as any;
            setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.name!,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                image: session.user.image || user.avatar,
                isAdmin: user.isAdmin || false,
                isEmailVerified: session.user.emailVerified || false,
                isMFAEnabled: user.isMFAEnabled || false,
            });
        } else {
            setUser(null);
        }

        setLoading(false);
    }, [session, isPending]);

    // Login with different providers
    const login = async (provider: string, options?: any) => {
        try {
            setLoading(true);
            
            if (provider === "credentials" && options?.email && options?.password) {
                const result = await signIn.email({
                    email: options.email,
                    password: options.password,
                });

                if (result?.error) {
                    throw new Error(result.error.message || "Login failed");
                }

                // Redirect to dashboard or specified URL
                router.push(options?.callbackUrl || "/dashboard");
            } else {
                // OAuth providers
                await signIn.social({
                    provider,
                    callbackURL: options?.callbackUrl || "/dashboard",
                });
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Credential login for backward compatibility
    const credentialLogin = async (email: string, password: string) => {
        try {
            setLoading(true);

            const result = await signIn.email({
                email: email.toLowerCase(),
                password,
            });

            if (result?.error) {
                return {
                    success: false,
                    error: result.error.message || "Login failed"
                };
            }

            return { success: true };
        } catch (error: any) {
            console.error("Credential login error:", error);
            return {
                success: false,
                error: error.message || "Login failed"
            };
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        try {
            setLoading(true);
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh session - Better Auth handles this automatically
    const refreshSession = async () => {
        try {
            // Better Auth automatically refreshes session
            // This is kept for backward compatibility
            window.location.reload();
        } catch (error) {
            console.error("Session refresh error:", error);
        }
    };

    // Computed properties
    const isAuthenticated = !!user && !!session;
    const isAdmin = user?.isAdmin || false;

    const value: AuthContextType = {
        user,
        loading: loading || isPending,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        refreshSession,
        credentialLogin
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
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
                    router.push("/auth/signin");
                    return;
                }

                if (requireAdmin && !isAdmin) {
                    router.push("/dashboard");
                    return;
                }
            }
        }, [isAuthenticated, isAdmin, loading, router]);

        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                </div>
            );
        }

        if (!isAuthenticated || (requireAdmin && !isAdmin)) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}
