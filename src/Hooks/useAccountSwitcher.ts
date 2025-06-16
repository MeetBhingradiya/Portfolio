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
    const [isLoading, setIsLoading] = useState(true);

    // Load accounts from localStorage on mount
    useEffect(() => {
        const loadAccounts = () => {
            try {
                const storedAccounts = localStorage.getItem('saved-accounts');
                const activeToken = localStorage.getItem('auth-token');
                
                if (storedAccounts) {
                    const parsedAccounts = JSON.parse(storedAccounts);
                    setAccounts(parsedAccounts);
                    
                    // Set current account if there's an active token
                    if (activeToken) {
                        const activeAccount = parsedAccounts.find((acc: Account) => 
                            acc.encryptedToken === activeToken
                        );
                        if (activeAccount) {
                            setCurrentAccount({
                                ...activeAccount,
                                lastUsed: new Date()
                            });
                        }
                    }
                } else if (activeToken) {
                    // If we have a token but no saved accounts, try to create account from current session
                    // This is a fallback for when localStorage gets cleared but session is still active
                    console.warn('Auth token found but no saved accounts. User may need to re-authenticate.');
                }
            } catch (error) {
                console.error('Failed to parse saved accounts:', error);
                localStorage.removeItem('saved-accounts');
                localStorage.removeItem('auth-token');
            } finally {
                setIsLoading(false);
            }
        };

        loadAccounts();
    }, []);

    // Save accounts to localStorage whenever accounts change
    useEffect(() => {
        if (!isLoading && accounts.length > 0) {
            localStorage.setItem('saved-accounts', JSON.stringify(accounts));
        }
    }, [accounts, isLoading]);

    const addAccount = async (newAccount: Account): Promise<void> => {
        const accountWithTimestamp = {
            ...newAccount,
            lastUsed: new Date()
        };

        setAccounts(prev => {
            // Remove existing account with same userID
            const filtered = prev.filter(acc => acc.userID !== newAccount.userID);
            return [accountWithTimestamp, ...filtered];
        });

        setCurrentAccount(accountWithTimestamp);
        
        // Update localStorage and cookies
        localStorage.setItem('auth-token', newAccount.encryptedToken);
        document.cookie = `auth-token=${newAccount.encryptedToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
    };

    const removeAccount = (userID: string): void => {
        setAccounts(prev => {
            const newAccounts = prev.filter(acc => acc.userID !== userID);
            
            // If removing current account and there are other accounts, switch to most recent
            if (currentAccount?.userID === userID && newAccounts.length > 0) {
                const mostRecent = newAccounts.sort((a, b) => 
                    new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime()
                )[0];
                
                setCurrentAccount(mostRecent);
                localStorage.setItem('auth-token', mostRecent.encryptedToken);
                document.cookie = `auth-token=${mostRecent.encryptedToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
            } else if (currentAccount?.userID === userID) {
                // No other accounts, clear everything
                setCurrentAccount(null);
                localStorage.removeItem('auth-token');
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
            
            return newAccounts;
        });
    };

    const switchAccount = (account: Account): void => {
        // Update last used timestamp
        const updatedAccount = { ...account, lastUsed: new Date() };
        
        setAccounts(prev => prev.map(acc => 
            acc.userID === account.userID ? updatedAccount : acc
        ));

        // Set as current account
        setCurrentAccount(updatedAccount);
        
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

    const refreshCurrentAccount = (updatedData: Partial<Account>): void => {
        if (currentAccount) {
            const updatedAccount = { ...currentAccount, ...updatedData };
            setCurrentAccount(updatedAccount);
            
            // Update in accounts array too
            setAccounts(prev => prev.map(acc => 
                acc.userID === currentAccount.userID ? updatedAccount : acc
            ));
        }
    };

    return {
        accounts,
        currentAccount,
        isLoading,
        addAccount,
        removeAccount,
        switchAccount,
        clearAllAccounts,
        refreshCurrentAccount
    };
}