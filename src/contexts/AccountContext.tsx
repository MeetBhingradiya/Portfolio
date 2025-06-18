"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Axios } from '@Utils/Axios';
import { log } from '@Utils';

const StorageKeys = {
	Accounts: "AuthenticatedUsers",
	ActiveSessionUserID: "ActiveSessionUserID",
};

export interface Account {
	UserID: string;
	Username: string;
	FName: string;
	LName: string;
	Avatar: string;
	PrimaryEmail: string;
	Session: {
		ID: string;
		Token: string;
	};
	isAdmin: boolean;
	isVerified_forCurrentSession?: boolean;
	LastUsed?: Date;
}

interface AccountState {
	accounts: Account[];
	activeAccountID: string;
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;
}

type AccountAction =
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_INITIALIZED'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'SET_ACCOUNTS'; payload: Account[] }
	| { type: 'SET_ACTIVE_ACCOUNT'; payload: string }
	| { type: 'ADD_ACCOUNT'; payload: Account }
	| { type: 'REMOVE_ACCOUNT'; payload: string }
	| { type: 'UPDATE_ACCOUNT'; payload: { userID: string; updates: Partial<Account> } }
	| { type: 'CLEAR_ALL_ACCOUNTS' }
	| { type: 'RESET_STATE' };

const initialState: AccountState = {
	accounts: [],
	activeAccountID: '',
	isLoading: true,
	isInitialized: false,
	error: null,
};

function accountReducer(state: AccountState, action: AccountAction): AccountState {
	switch (action.type) {
		case 'SET_LOADING':
			return { ...state, isLoading: action.payload };
			
		case 'SET_INITIALIZED':
			return { ...state, isInitialized: action.payload };
			
		case 'SET_ERROR':
			return { ...state, error: action.payload };
			
		case 'SET_ACCOUNTS':
			return { ...state, accounts: action.payload };
			
		case 'SET_ACTIVE_ACCOUNT':
			return { ...state, activeAccountID: action.payload };
			
		case 'ADD_ACCOUNT':
			// Check account limit (max 5 accounts)
			if (state.accounts.length >= 5) {
				log("WARN : Account limit reached, cannot add more accounts.");
				return state;
			}
			return {
				...state,
				accounts: [...state.accounts, { ...action.payload, LastUsed: new Date() }],
			};
			
		case 'REMOVE_ACCOUNT':
			const filteredAccounts = state.accounts.filter(
				(acc) => acc.UserID !== action.payload
			);
			
			// If removing the active account, set new active account
			let newActiveAccountID = state.activeAccountID;
			if (state.activeAccountID === action.payload) {
				newActiveAccountID = filteredAccounts.length > 0 ? filteredAccounts[0].UserID : '';
			}
			
			return {
				...state,
				accounts: filteredAccounts,
				activeAccountID: newActiveAccountID,
			};
			
		case 'UPDATE_ACCOUNT':
			return {
				...state,
				accounts: state.accounts.map((acc) =>
					acc.UserID === action.payload.userID
						? { ...acc, ...action.payload.updates }
						: acc
				),
			};
			
		case 'CLEAR_ALL_ACCOUNTS':
			return {
				...state,
				accounts: [],
				activeAccountID: '',
			};
			
		case 'RESET_STATE':
			return { ...initialState, isInitialized: true };
			
		default:
			return state;
	}
}

interface AccountContextType {
	// State
	accounts: Account[];
	activeAccount: Account | null;
	activeAccountID: string;
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;
	
	// Actions
	addAccount: (account: Account) => Promise<void>;
	removeAccount: (userID: string) => Promise<void>;
	switchAccount: (userID: string) => Promise<void>;
	removeAllAccounts: () => Promise<void>;
	refreshAccounts: () => Promise<void>;
	clearError: () => void;
}

const AccountContext = createContext<AccountContextType | null>(null);

// Storage utilities
const StorageUtils = {
	getAccounts(): Account[] {
		try {
			const storedAccounts = localStorage.getItem(StorageKeys.Accounts);
			if (storedAccounts) {
				const parsedAccounts: Account[] = JSON.parse(storedAccounts);
				log("INFO : Accounts loaded from localStorage.");
				return parsedAccounts.map((account) => ({
					...account,
					isVerified_forCurrentSession: false,
				}));
			}
		} catch (error) {
			log("ERROR : Corrupted accounts data in localStorage, clearing.");
			localStorage.removeItem(StorageKeys.Accounts);
		}
		return [];
	},

	setAccounts(accounts: Account[]): void {
		if (accounts.length === 0) {
			localStorage.removeItem(StorageKeys.Accounts);
			log("INFO : Cleared accounts from localStorage.");
		} else {
			localStorage.setItem(StorageKeys.Accounts, JSON.stringify(accounts));
			log("INFO : Accounts saved to localStorage.");
		}
	},

	getActiveAccountID(): string {
		const activeUserID = localStorage.getItem(StorageKeys.ActiveSessionUserID);
		return activeUserID || '';
	},

	setActiveAccountID(userID: string): void {
		if (userID) {
			localStorage.setItem(StorageKeys.ActiveSessionUserID, userID);
			log(`INFO : Active account ID set to: ${userID}`);
		} else {
			localStorage.removeItem(StorageKeys.ActiveSessionUserID);
			log("INFO : Active account ID cleared.");
		}
	},

	setAuthenticationCookie(token: string, expires?: Date): void {
		const expiryDate = expires || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		if (token) {
			document.cookie = `auth-token=${token}; path=/; expires=${expiryDate.toUTCString()}; secure; SameSite=Strict`;
			log("INFO : Authentication cookie set.");
		} else {
			document.cookie = `auth-token=; path=/; expires=${new Date(0).toUTCString()}; secure; SameSite=Strict`;
			log("INFO : Authentication cookie cleared.");
		}
	}
};

interface AccountProviderProps {
	children: React.ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
	const [state, dispatch] = useReducer(accountReducer, initialState);

	// Validate a single account
	const validateAccount = useCallback(async (account: Account): Promise<boolean> => {
		try {
			const response = await Axios.post(
				"/api/auth/validate",
				{},
				{
					headers: {
						Authorization: `Bearer ${account.Session.Token}`,
					},
				}
			);
			return response.data.Status === 1;
		} catch (error) {
			log(`ERROR : Failed to validate account ${account.UserID}:`, error);
			return false;
		}
	}, []);

	// Validate all accounts and update state
	const validateAllAccounts = useCallback(async (): Promise<void> => {
		const localAccounts = StorageUtils.getAccounts();
		const activeAccountID = StorageUtils.getActiveAccountID();

		log("INFO : Starting account validation...");

		if (localAccounts.length === 0) {
			log("INFO : No accounts found in localStorage.");
			dispatch({ type: 'SET_ACCOUNTS', payload: [] });
			dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: '' });
			dispatch({ type: 'SET_LOADING', payload: false });
			dispatch({ type: 'SET_INITIALIZED', payload: true });
			return;
		}

		dispatch({ type: 'SET_LOADING', payload: true });

		const validAccounts: Account[] = [];

		// Validate each account
		for (const account of localAccounts) {
			const isValid = await validateAccount(account);
			if (isValid) {
				validAccounts.push({
					...account,
					isVerified_forCurrentSession: true,
					LastUsed: new Date(),
				});
				log(`INFO : Account ${account.UserID} validated successfully.`);
			} else {
				log(`WARN : Account ${account.UserID} validation failed.`);
			}
		}

		// Update state with valid accounts
		dispatch({ type: 'SET_ACCOUNTS', payload: validAccounts });

		// Set active account
		let newActiveAccountID = '';
		if (validAccounts.length > 0) {
			if (activeAccountID && validAccounts.some(acc => acc.UserID === activeAccountID)) {
				newActiveAccountID = activeAccountID;
			} else {
				newActiveAccountID = validAccounts[0].UserID;
				log("INFO : Setting first valid account as active.");
			}

			const activeAccount = validAccounts.find(acc => acc.UserID === newActiveAccountID);
			if (activeAccount) {
				StorageUtils.setActiveAccountID(newActiveAccountID);
				StorageUtils.setAuthenticationCookie(activeAccount.Session.Token);
			}
		} else {
			log("INFO : No valid accounts found, clearing authentication.");
			StorageUtils.setActiveAccountID('');
			StorageUtils.setAuthenticationCookie('');
		}

		dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: newActiveAccountID });
		StorageUtils.setAccounts(validAccounts);

		dispatch({ type: 'SET_LOADING', payload: false });
		dispatch({ type: 'SET_INITIALIZED', payload: true });

		log(`INFO : Account validation completed. ${validAccounts.length} valid accounts found.`);
	}, [validateAccount]);

	// Initialize accounts on mount
	useEffect(() => {
		if (!state.isInitialized) {
			validateAllAccounts();
		}
	}, [state.isInitialized, validateAllAccounts]);

	// Sync accounts to localStorage when state changes
	useEffect(() => {
		if (state.isInitialized) {
			StorageUtils.setAccounts(state.accounts);
		}
	}, [state.accounts, state.isInitialized]);

	// Sync active account to localStorage when it changes
	useEffect(() => {
		if (state.isInitialized) {
			StorageUtils.setActiveAccountID(state.activeAccountID);
			
			if (state.activeAccountID) {
				const activeAccount = state.accounts.find(acc => acc.UserID === state.activeAccountID);
				if (activeAccount) {
					StorageUtils.setAuthenticationCookie(activeAccount.Session.Token);
				}
			} else {
				StorageUtils.setAuthenticationCookie('');
			}
		}
	}, [state.activeAccountID, state.accounts, state.isInitialized]);

	// Context methods
	const addAccount = useCallback(async (account: Account): Promise<void> => {
		log(`INFO : Adding account: ${account.UserID}`);
		
		// Check if account already exists
		if (state.accounts.some(acc => acc.UserID === account.UserID)) {
			log(`WARN : Account ${account.UserID} already exists.`);
			return;
		}

		// Validate the new account
		const isValid = await validateAccount(account);
		if (!isValid) {
			throw new Error('Account validation failed');
		}

		const accountWithMetadata = {
			...account,
			isVerified_forCurrentSession: true,
			LastUsed: new Date(),
		};

		dispatch({ type: 'ADD_ACCOUNT', payload: accountWithMetadata });

		// If this is the first account, make it active
		if (state.accounts.length === 0) {
			dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: account.UserID });
		}

		log(`INFO : Account ${account.UserID} added successfully.`);
	}, [state.accounts, validateAccount]);

	const removeAccount = useCallback(async (userID: string): Promise<void> => {
		log(`INFO : Removing account: ${userID}`);
		
		const account = state.accounts.find(acc => acc.UserID === userID);
		if (!account) {
			log(`WARN : Account ${userID} not found.`);
			return;
		}

		dispatch({ type: 'REMOVE_ACCOUNT', payload: userID });

		// If no accounts left, clear authentication
		const remainingAccounts = state.accounts.filter(acc => acc.UserID !== userID);
		if (remainingAccounts.length === 0) {
			StorageUtils.setActiveAccountID('');
			StorageUtils.setAuthenticationCookie('');
		}

		log(`INFO : Account ${userID} removed successfully.`);
	}, [state.accounts]);

	const switchAccount = useCallback(async (userID: string): Promise<void> => {
		log(`INFO : Switching to account: ${userID}`);
		
		const account = state.accounts.find(acc => acc.UserID === userID);
		if (!account) {
			throw new Error(`Account ${userID} not found`);
		}

		// Validate the account before switching
		const isValid = await validateAccount(account);
		if (!isValid) {
			throw new Error(`Account ${userID} validation failed`);
		}

		// Update last used timestamp
		dispatch({
			type: 'UPDATE_ACCOUNT',
			payload: {
				userID,
				updates: { LastUsed: new Date() }
			}
		});

		dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: userID });

		log(`INFO : Switched to account ${userID} successfully.`);
	}, [state.accounts, validateAccount]);

	const removeAllAccounts = useCallback(async (): Promise<void> => {
		log("INFO : Removing all accounts.");
		
		dispatch({ type: 'CLEAR_ALL_ACCOUNTS' });
		StorageUtils.setActiveAccountID('');
		StorageUtils.setAuthenticationCookie('');
		StorageUtils.setAccounts([]);

		log("INFO : All accounts removed successfully.");
	}, []);

	const refreshAccounts = useCallback(async (): Promise<void> => {
		log("INFO : Refreshing accounts...");
		dispatch({ type: 'SET_LOADING', payload: true });
		await validateAllAccounts();
	}, [validateAllAccounts]);

	const clearError = useCallback((): void => {
		dispatch({ type: 'SET_ERROR', payload: null });
	}, []);

	const contextValue: AccountContextType = {
		// State
		accounts: state.accounts,
		activeAccount: state.accounts.find(acc => acc.UserID === state.activeAccountID) || null,
		activeAccountID: state.activeAccountID,
		isLoading: state.isLoading,
		isInitialized: state.isInitialized,
		error: state.error,
		
		// Actions
		addAccount,
		removeAccount,
		switchAccount,
		removeAllAccounts,
		refreshAccounts,
		clearError,
	};

	return (
		<AccountContext.Provider value={contextValue}>
			{children}
		</AccountContext.Provider>
	);
}

export function useAccount(): AccountContextType {
	const context = useContext(AccountContext);
	if (!context) {
		throw new Error('useAccount must be used within an AccountProvider');
	}
	return context;
}

// Legacy hook for backward compatibility (can be removed later)
export function useAccountSwitcher() {
	const context = useAccount();
	return {
		Accounts: context.accounts,
		ActiveAccount: context.activeAccount,
		ActiveAccountID: context.activeAccountID,
		isLoading: context.isLoading,
		AddAccount: context.addAccount,
		RemoveAccount: context.removeAccount,
		SwitchAccount: context.switchAccount,
		RemoveAllAccounts: context.removeAllAccounts,
		// Legacy properties for compatibility
		currentAccount: context.activeAccount,
	};
}
