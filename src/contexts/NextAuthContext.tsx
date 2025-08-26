"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession, signIn, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Axios } from "@Utils/Axios";

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
    const { data: session, status, update } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Update user state when session changes
    useEffect(() => {
        if (status === "loading") {
            setLoading(true);
            return;
        }

        if (session?.user) {
            setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.name!,
                username: session.user.username,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                image: session.user.image || session.user.avatar,
                isAdmin: session.user.isAdmin || false,
                isEmailVerified: session.user.isEmailVerified || false,
                isMFAEnabled: session.user.isMFAEnabled || false,
            });
        } else {
            setUser(null);
        }

        setLoading(false);
    }, [session, status]);

    // Login with different providers
    const login = async (provider: string, options?: any) => {
        try {
            setLoading(true);
            
            if (provider === "credentials" && options?.email && options?.password) {
                const result = await signIn("credentials", {
                    email: options.email,
                    password: options.password,
                    redirect: false,
                });

                if (result?.error) {
                    throw new Error(result.error);
                }

                if (result?.ok) {
                    // Force session refresh
                    await update();
                    
                    // Redirect to dashboard or specified URL
                    router.push(options?.callbackUrl || "/dashboard");
                }
            } else {
                // OAuth providers
                await signIn(provider, {
                    callbackUrl: options?.callbackUrl || "/dashboard",
                    ...options
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

            const result = await signIn("credentials", {
                email: email.toLowerCase(),
                password,
                redirect: false,
            });

            if (result?.error) {
                return {
                    success: false,
                    error: result.error
                };
            }

            if (result?.ok) {
                // Force session refresh
                await update();
                return { success: true };
            }

            return {
                success: false,
                error: "Invalid credentials"
            };
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
            await signOut({ 
                callbackUrl: "/",
                redirect: true 
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh session
    const refreshSession = async () => {
        try {
            await update();
        } catch (error) {
            console.error("Session refresh error:", error);
        }
    };

    // Computed properties
    const isAuthenticated = !!user && status === "authenticated";
    const isAdmin = user?.isAdmin || false;

    const value: AuthContextType = {
        user,
        loading: loading || status === "loading",
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
