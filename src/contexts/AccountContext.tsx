"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Account {
    id: string;
    UserID?: string;
    Username?: string;
    email: string;
    PrimaryEmail?: string;
    name: string;
    FName?: string;
    LName?: string;
    avatar?: string;
    isActive: boolean;
    isAdmin?: boolean;
    isVerified_forCurrentSession?: boolean;
    role?: string;
    createdAt: string;
    lastUsed: string;
    Session?: {
        Token: string;
        ExpiresAt: string;
    };
}

interface AccountContextType {
    accounts: Account[];
    activeAccount: Account | null;
    activeAccountID: string | null;
    isLoading: boolean;
    addAccount: (account: Omit<Account, 'id' | 'isActive' | 'createdAt' | 'lastUsed'>) => void;
    removeAccount: (accountId: string) => void;
    switchAccount: (accountId: string) => void;
    removeAllAccounts: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

interface AccountProviderProps {
    children: ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [activeAccountID, setActiveAccountID] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const activeAccount = accounts.find(acc => acc.id === activeAccountID) || null;

    // Load accounts from localStorage on mount
    useEffect(() => {
        try {
            const savedAccounts = localStorage.getItem('user-accounts');
            const savedActiveId = localStorage.getItem('active-account-id');
            
            if (savedAccounts) {
                const parsedAccounts = JSON.parse(savedAccounts);
                setAccounts(parsedAccounts);
            }
            
            if (savedActiveId) {
                setActiveAccountID(savedActiveId);
            }
        } catch (error) {
            console.error('Error loading accounts from localStorage:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save accounts to localStorage when they change
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('user-accounts', JSON.stringify(accounts));
        }
    }, [accounts, isLoading]);

    // Save active account ID to localStorage when it changes
    useEffect(() => {
        if (!isLoading && activeAccountID) {
            localStorage.setItem('active-account-id', activeAccountID);
        }
    }, [activeAccountID, isLoading]);

    const addAccount = (accountData: Omit<Account, 'id' | 'isActive' | 'createdAt' | 'lastUsed'>) => {
        const newAccount: Account = {
            ...accountData,
            id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isActive: accounts.length === 0, // First account is active by default
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };

        setAccounts(prev => [...prev, newAccount]);
        
        // Set as active if it's the first account
        if (accounts.length === 0) {
            setActiveAccountID(newAccount.id);
        }
    };

    const removeAccount = (accountId: string) => {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        
        // If the removed account was active, switch to another account
        if (activeAccountID === accountId) {
            const remainingAccounts = accounts.filter(acc => acc.id !== accountId);
            if (remainingAccounts.length > 0) {
                setActiveAccountID(remainingAccounts[0].id);
            } else {
                setActiveAccountID(null);
                localStorage.removeItem('active-account-id');
            }
        }
    };

    const switchAccount = (accountId: string) => {
        const account = accounts.find(acc => acc.id === accountId);
        if (account) {
            // Update last used timestamp
            setAccounts(prev => 
                prev.map(acc => 
                    acc.id === accountId 
                        ? { ...acc, lastUsed: new Date().toISOString() }
                        : acc
                )
            );
            setActiveAccountID(accountId);
        }
    };

    const removeAllAccounts = () => {
        setAccounts([]);
        setActiveAccountID(null);
        localStorage.removeItem('user-accounts');
        localStorage.removeItem('active-account-id');
    };

    const value: AccountContextType = {
        accounts,
        activeAccount,
        activeAccountID,
        isLoading,
        addAccount,
        removeAccount,
        switchAccount,
        removeAllAccounts
    };

    return (
        <AccountContext.Provider value={value}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error('useAccount must be used within an AccountProvider');
    }
    return context;
}
