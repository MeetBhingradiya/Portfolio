"use client";

import { useState, useEffect, useCallback } from "react";
import AccountManager, { StoredAccount, AccountManagerConfig } from "@Utils/AccountManager";
import { Axios } from "@Utils/Axios";

export interface UseAccountSwitcherReturn {
    // Current state
    currentAccount: StoredAccount | null;
    accounts: StoredAccount[];
    isLoading: boolean;
    error: string | null;
    
    // Account management
    addAccount: (accountData: Omit<StoredAccount, 'lastLoginAt' | 'isActive'>) => Promise<boolean>;
    switchAccount: (userID: string) => Promise<boolean>;
    removeAccount: (userID: string) => Promise<boolean>;
    removeAllAccounts: () => Promise<boolean>;
    
    // Utility functions
    refreshAccounts: () => void;
    hasAccount: (identifier: string) => boolean;
    canAddMoreAccounts: () => boolean;
    getAccountsCount: () => number;
    
    // Configuration
    config: AccountManagerConfig;
    updateConfig: (newConfig: Partial<AccountManagerConfig>) => void;
    
    // Auto-switch functionality
    autoSwitchOnLogout: () => Promise<boolean>;
    clearCurrentSession: () => void;
    
    // Account validation
    validateCurrentAccount: () => Promise<boolean>;
    refreshAccountData: (userID?: string) => Promise<boolean>;
}

export function useAccountSwitcher(): UseAccountSwitcherReturn {
    const [currentAccount, setCurrentAccount] = useState<StoredAccount | null>(null);
    const [accounts, setAccounts] = useState<StoredAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<AccountManagerConfig>(AccountManager.getConfig());

    // Refresh accounts from storage
    const refreshAccounts = useCallback(() => {
        try {
            const allAccounts = AccountManager.getAccounts();
            const current = AccountManager.getCurrentAccount();
            
            setAccounts(allAccounts);
            setCurrentAccount(current);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh accounts');
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        refreshAccounts();
    }, [refreshAccounts]);

    // Add account
    const addAccount = useCallback(async (accountData: Omit<StoredAccount, 'lastLoginAt' | 'isActive'>): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const success = AccountManager.addAccount(accountData);
            if (success) {
                refreshAccounts();
                return true;
            } else {
                setError('Failed to add account. Maximum accounts limit reached.');
                return false;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to add account');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [refreshAccounts]);

    // Switch account
    const switchAccount = useCallback(async (userID: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const success = AccountManager.switchAccount(userID);
            if (success) {
                refreshAccounts();
                
                // Validate the switched account by making a test API call
                const isValid = await validateCurrentAccount();
                if (!isValid) {
                    setError('Account token is invalid or expired');
                    return false;
                }
                
                return true;
            } else {
                setError('Failed to switch account');
                return false;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to switch account');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [refreshAccounts]);

    // Remove account
    const removeAccount = useCallback(async (userID: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const success = AccountManager.removeAccount(userID);
            if (success) {
                refreshAccounts();
                return true;
            } else {
                setError('Failed to remove account');
                return false;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to remove account');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [refreshAccounts]);

    // Remove all accounts
    const removeAllAccounts = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const success = AccountManager.removeAllAccounts();
            if (success) {
                refreshAccounts();
                return true;
            } else {
                setError('Failed to remove all accounts');
                return false;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to remove all accounts');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [refreshAccounts]);

    // Auto-switch on logout
    const autoSwitchOnLogout = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const nextAccount = AccountManager.getNextAccountForSwitch();
            if (nextAccount) {
                const success = await switchAccount(nextAccount.userID);
                return success;
            }
            return false;
        } catch (err: any) {
            setError(err.message || 'Failed to auto-switch account');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [switchAccount]);

    // Clear current session
    const clearCurrentSession = useCallback(() => {
        AccountManager.clearCurrentSession();
        refreshAccounts();
    }, [refreshAccounts]);

    // Validate current account
    const validateCurrentAccount = useCallback(async (): Promise<boolean> => {
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                return false;
            }

            // Make a test API call to validate token
            const response = await Axios.get('/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data.Status === 1;
        } catch (error: any) {
            console.error('Account validation error:', error);
            
            // If token is invalid, remove it from current account
            if (error.response?.status === 401) {
                clearCurrentSession();
            }
            
            return false;
        }
    }, [clearCurrentSession]);

    // Refresh account data from server
    const refreshAccountData = useCallback(async (userID?: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const targetUserID = userID || currentAccount?.userID;
            if (!targetUserID) {
                return false;
            }

            const token = localStorage.getItem('auth-token');
            if (!token) {
                return false;
            }

            // Fetch fresh user data from server
            const response = await Axios.get('/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.Status === 1) {
                const userData = response.data.Data.user;
                
                // Update account profile data
                AccountManager.updateAccountProfile(targetUserID, {
                    isAdmin: userData.isAdmin,
                    isEmailVerified: userData.isEmailVerified
                });
                
                refreshAccounts();
                return true;
            }
            
            return false;
        } catch (err: any) {
            setError(err.message || 'Failed to refresh account data');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount?.userID, refreshAccounts]);

    // Update configuration
    const updateConfig = useCallback((newConfig: Partial<AccountManagerConfig>) => {
        AccountManager.updateConfig(newConfig);
        setConfig(AccountManager.getConfig());
    }, []);

    // Utility functions
    const hasAccount = useCallback((identifier: string): boolean => {
        return AccountManager.hasAccount(identifier);
    }, []);

    const canAddMoreAccounts = useCallback((): boolean => {
        return AccountManager.canAddMoreAccounts();
    }, []);

    const getAccountsCount = useCallback((): number => {
        return AccountManager.getAccountsCount();
    }, []);

    return {
        // Current state
        currentAccount,
        accounts,
        isLoading,
        error,
        
        // Account management
        addAccount,
        switchAccount,
        removeAccount,
        removeAllAccounts,
        
        // Utility functions
        refreshAccounts,
        hasAccount,
        canAddMoreAccounts,
        getAccountsCount,
        
        // Configuration
        config,
        updateConfig,
        
        // Auto-switch functionality
        autoSwitchOnLogout,
        clearCurrentSession,
        
        // Account validation
        validateCurrentAccount,
        refreshAccountData
    };
}
