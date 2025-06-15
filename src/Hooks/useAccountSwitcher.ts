import { useState, useEffect } from 'react';

export interface Account {
    userID: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    encryptedToken: string;
    profileData: {
        isAdmin: boolean;
        isEmailVerified: boolean;
    };
    lastUsed?: Date;
}

export function useAccountSwitcher() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

    // Load accounts from localStorage on mount
    useEffect(() => {
        const storedAccounts = localStorage.getItem('saved-accounts');
        if (storedAccounts) {
            try {
                const parsedAccounts = JSON.parse(storedAccounts);
                setAccounts(parsedAccounts);
                
                // Set current account if there's an active token
                const activeToken = localStorage.getItem('auth-token');
                if (activeToken) {
                    const activeAccount = parsedAccounts.find((acc: Account) => 
                        acc.encryptedToken === activeToken
                    );
                    if (activeAccount) {
                        setCurrentAccount(activeAccount);
                    }
                }
            } catch (error) {
                console.error('Failed to parse saved accounts:', error);
                localStorage.removeItem('saved-accounts');
            }
        }
    }, []);

    // Save accounts to localStorage whenever accounts change
    useEffect(() => {
        if (accounts.length > 0) {
            localStorage.setItem('saved-accounts', JSON.stringify(accounts));
        }
    }, [accounts]);

    const addAccount = async (newAccount: Account): Promise<void> => {
        setAccounts(prev => {
            // Remove existing account with same userID
            const filtered = prev.filter(acc => acc.userID !== newAccount.userID);
            
            // Add new account with current timestamp
            const accountWithTimestamp = {
                ...newAccount,
                lastUsed: new Date()
            };
            
            return [accountWithTimestamp, ...filtered];
        });

        setCurrentAccount(newAccount);
    };

    const removeAccount = (userID: string): void => {
        setAccounts(prev => prev.filter(acc => acc.userID !== userID));
        
        if (currentAccount?.userID === userID) {
            setCurrentAccount(null);
            localStorage.removeItem('auth-token');
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    };

    const switchAccount = (account: Account): void => {
        // Update last used timestamp
        setAccounts(prev => prev.map(acc => 
            acc.userID === account.userID 
                ? { ...acc, lastUsed: new Date() }
                : acc
        ));

        // Set as current account
        setCurrentAccount(account);
        
        // Update localStorage and cookies
        localStorage.setItem('auth-token', account.encryptedToken);
        document.cookie = `auth-token=${account.encryptedToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
    };

    const clearAllAccounts = (): void => {
        setAccounts([]);
        setCurrentAccount(null);
        localStorage.removeItem('saved-accounts');
        localStorage.removeItem('auth-token');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    };

    return {
        accounts,
        currentAccount,
        addAccount,
        removeAccount,
        switchAccount,
        clearAllAccounts
    };
}