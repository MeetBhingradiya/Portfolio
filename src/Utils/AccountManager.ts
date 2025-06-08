import { RSA } from "@Utils/RSA";

export interface StoredAccount {
    userID: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    encryptedToken: string;
    lastLoginAt: string;
    isActive: boolean;
    profileData?: {
        isAdmin: boolean;
        isEmailVerified: boolean;
        avatar?: string;
    };
}

export interface AccountManagerConfig {
    maxAccounts: number;
    encryptionEnabled: boolean;
    autoSwitchOnLogout: boolean;
}

export class AccountManager {
    private static instance: AccountManager;
    private config: AccountManagerConfig = {
        maxAccounts: 5,
        encryptionEnabled: true,
        autoSwitchOnLogout: true
    };

    private constructor() {}

    public static getInstance(): AccountManager {
        if (!AccountManager.instance) {
            AccountManager.instance = new AccountManager();
        }
        return AccountManager.instance;
    }

    // Get all stored accounts
    public getAccounts(): StoredAccount[] {
        try {
            const accounts = localStorage.getItem('stored-accounts');
            return accounts ? JSON.parse(accounts) : [];
        } catch (error) {
            console.error('Error loading accounts:', error);
            return [];
        }
    }

    // Get current active account
    public getCurrentAccount(): StoredAccount | null {
        const accounts = this.getAccounts();
        return accounts.find(account => account.isActive) || null;
    }

    // Add or update account
    public addAccount(accountData: Omit<StoredAccount, 'lastLoginAt' | 'isActive'>): boolean {
        try {
            const accounts = this.getAccounts();
            
            // Check if account already exists
            const existingAccountIndex = accounts.findIndex(
                account => account.userID === accountData.userID || 
                          account.username === accountData.username
            );

            const newAccount: StoredAccount = {
                ...accountData,
                lastLoginAt: new Date().toISOString(),
                isActive: true
            };

            // Deactivate all other accounts
            accounts.forEach(account => account.isActive = false);

            if (existingAccountIndex >= 0) {
                // Update existing account
                accounts[existingAccountIndex] = newAccount;
            } else {
                // Check max accounts limit
                if (accounts.length >= this.config.maxAccounts) {
                    // Remove oldest inactive account
                    const inactiveAccounts = accounts
                        .filter(account => !account.isActive)
                        .sort((a, b) => new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime());
                    
                    if (inactiveAccounts.length > 0) {
                        const indexToRemove = accounts.indexOf(inactiveAccounts[0]);
                        accounts.splice(indexToRemove, 1);
                    } else {
                        return false; // Cannot add more accounts
                    }
                }
                
                // Add new account
                accounts.push(newAccount);
            }

            this.saveAccounts(accounts);
            return true;
        } catch (error) {
            console.error('Error adding account:', error);
            return false;
        }
    }

    // Switch to account by userID
    public switchAccount(userID: string): boolean {
        try {
            const accounts = this.getAccounts();
            const targetAccount = accounts.find(account => account.userID === userID);
            
            if (!targetAccount) {
                return false;
            }

            // Deactivate all accounts
            accounts.forEach(account => account.isActive = false);
            
            // Activate target account
            targetAccount.isActive = true;
            targetAccount.lastLoginAt = new Date().toISOString();

            this.saveAccounts(accounts);
            
            // Set the auth token
            localStorage.setItem('auth-token', targetAccount.encryptedToken);
            document.cookie = `auth-token=${targetAccount.encryptedToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;

            return true;
        } catch (error) {
            console.error('Error switching account:', error);
            return false;
        }
    }

    // Remove account by userID
    public removeAccount(userID: string): boolean {
        try {
            const accounts = this.getAccounts();
            const accountIndex = accounts.findIndex(account => account.userID === userID);
            
            if (accountIndex === -1) {
                return false;
            }

            const wasActive = accounts[accountIndex].isActive;
            accounts.splice(accountIndex, 1);
            
            // If removed account was active, switch to most recent account
            if (wasActive && accounts.length > 0 && this.config.autoSwitchOnLogout) {
                const mostRecent = accounts
                    .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime())[0];
                mostRecent.isActive = true;
                
                // Set the auth token for the most recent account
                localStorage.setItem('auth-token', mostRecent.encryptedToken);
                document.cookie = `auth-token=${mostRecent.encryptedToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
            } else if (wasActive) {
                // Clear auth token if no auto-switch
                localStorage.removeItem('auth-token');
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }

            this.saveAccounts(accounts);
            return true;
        } catch (error) {
            console.error('Error removing account:', error);
            return false;
        }
    }

    // Remove all accounts
    public removeAllAccounts(): boolean {
        try {
            localStorage.removeItem('stored-accounts');
            localStorage.removeItem('auth-token');
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            return true;
        } catch (error) {
            console.error('Error removing all accounts:', error);
            return false;
        }
    }

    // Get account by userID
    public getAccountById(userID: string): StoredAccount | null {
        const accounts = this.getAccounts();
        return accounts.find(account => account.userID === userID) || null;
    }    // Update account profile data
    public updateAccountProfile(userID: string, profileData: Partial<StoredAccount['profileData']>): boolean {
        try {
            const accounts = this.getAccounts();
            const account = accounts.find(acc => acc.userID === userID);
            
            if (!account) {
                return false;
            }

            // Merge with existing profile data, ensuring required fields have defaults
            account.profileData = {
                isAdmin: false,
                isEmailVerified: false,
                ...account.profileData,
                ...profileData
            };
            this.saveAccounts(accounts);
            return true;
        } catch (error) {
            console.error('Error updating account profile:', error);
            return false;
        }
    }

    // Check if account exists
    public hasAccount(identifier: string): boolean {
        const accounts = this.getAccounts();
        return accounts.some(account => 
            account.userID === identifier || 
            account.username === identifier || 
            account.email === identifier
        );
    }

    // Get accounts count
    public getAccountsCount(): number {
        return this.getAccounts().length;
    }

    // Check if can add more accounts
    public canAddMoreAccounts(): boolean {
        return this.getAccounts().length < this.config.maxAccounts;
    }

    // Get inactive accounts (sorted by last login)
    public getInactiveAccounts(): StoredAccount[] {
        return this.getAccounts()
            .filter(account => !account.isActive)
            .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime());
    }

    // Update configuration
    public updateConfig(newConfig: Partial<AccountManagerConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    // Get configuration
    public getConfig(): AccountManagerConfig {
        return { ...this.config };
    }

    // Private method to save accounts
    private saveAccounts(accounts: StoredAccount[]): void {
        localStorage.setItem('stored-accounts', JSON.stringify(accounts));
    }

    // Clear current session without switching
    public clearCurrentSession(): void {
        const accounts = this.getAccounts();
        accounts.forEach(account => account.isActive = false);
        this.saveAccounts(accounts);
        
        localStorage.removeItem('auth-token');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // Get next account for auto-switch
    public getNextAccountForSwitch(): StoredAccount | null {
        if (!this.config.autoSwitchOnLogout) {
            return null;
        }

        const inactiveAccounts = this.getInactiveAccounts();
        return inactiveAccounts.length > 0 ? inactiveAccounts[0] : null;
    }
}

export default AccountManager.getInstance();
