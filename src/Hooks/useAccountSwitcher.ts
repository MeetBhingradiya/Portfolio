"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@contexts/NextAuthContext";
import { Axios } from "@Utils/Axios";

// Account interface for compatibility
export interface Account {
    id: string;
    UserID: string;
    Username: string;
    email: string;
    PrimaryEmail: string;
    name: string;
    FName: string;
    LName: string;
    avatar?: string;
    isActive: boolean;
    isAdmin: boolean;
    isVerified_forCurrentSession: boolean;
    role: string;
    createdAt: Date;
    lastUsed: Date;
    Session?: any;
}

// Hook for account switching functionality
export function useAccountSwitcher() {
    const { user, isAuthenticated, logout, refreshSession } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Convert NextAuth user to Account format
    const convertUserToAccount = useCallback((authUser: any): Account => {
        return {
            id: authUser.id,
            UserID: authUser.id,
            Username: authUser.username || authUser.email?.split('@')[0] || '',
            email: authUser.email,
            PrimaryEmail: authUser.email,
            name: authUser.name || `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim(),
            FName: authUser.firstName || authUser.name?.split(' ')[0] || '',
            LName: authUser.lastName || authUser.name?.split(' ').slice(1).join(' ') || '',
            avatar: authUser.image || authUser.avatar,
            isActive: true,
            isAdmin: authUser.isAdmin || false,
            isVerified_forCurrentSession: authUser.isEmailVerified || false,
            role: authUser.isAdmin ? 'admin' : 'user',
            createdAt: new Date(),
            lastUsed: new Date(),
            Session: { isValid: true }
        };
    }, []);

    // Get current active account
    const activeAccount = user ? convertUserToAccount(user) : null;

    // Initialize accounts with current user
    useEffect(() => {
        if (isAuthenticated && user) {
            setAccounts([convertUserToAccount(user)]);
        } else {
            setAccounts([]);
        }
    }, [user, isAuthenticated, convertUserToAccount]);

    // Switch account (in a single-user system, this would typically redirect to signin)
    const switchAccount = useCallback(async (accountId: string) => {
        setIsLoading(true);
        try {
            // In a true multi-account system, you would switch to the account here
            // For now, if switching to a different account, redirect to signin
            if (accountId !== user?.id) {
                await logout();
                return;
            }
            
            // If switching to current account, just refresh
            await refreshSession();
        } catch (error) {
            console.error('Error switching account:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, logout, refreshSession]);

    // Add account (redirect to signin)
    const addAccount = useCallback(() => {
        window.location.href = '/auth/signin?acs=1';
    }, []);

    // Remove account
    const removeAccount = useCallback(async (accountId: string) => {
        setIsLoading(true);
        try {
            if (accountId === user?.id) {
                // If removing current account, logout
                await logout();
            }
            // In a multi-account system, you would remove from local storage here
        } catch (error) {
            console.error('Error removing account:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, logout]);

    // Remove all accounts
    const removeAllAccounts = useCallback(async () => {
        setIsLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error('Error removing all accounts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    // Legacy compatibility properties
    return {
        // New format
        accounts,
        activeAccount,
        activeAccountID: activeAccount?.id || null,
        isLoading,
        currentAccount: activeAccount,
        
        // Methods
        switchAccount,
        addAccount,
        removeAccount,
        removeAllAccounts,

        // Legacy format for backward compatibility
        Accounts: accounts,
        ActiveAccount: activeAccount,
        ActiveAccountID: activeAccount?.id || null,
        AddAccount: addAccount,
        RemoveAccount: removeAccount,
        SwitchAccount: switchAccount,
        RemoveAllAccounts: removeAllAccounts
    };
}
