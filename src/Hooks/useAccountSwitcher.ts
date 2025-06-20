"use client";

import { useAccount } from "@contexts/AccountContext";

// Legacy hook - now a wrapper around the new AccountContext
// This provides backward compatibility for existing components
export function useAccountSwitcher() {
    const context = useAccount();

    return {
        Accounts: context.accounts,
        ActiveAccount: context.activeAccount,
        ActiveAccountID: context.activeAccountID,
        isLoading: context.isLoading,
        currentAccount: context.activeAccount,
        AddAccount: context.addAccount,
        RemoveAccount: context.removeAccount,
        SwitchAccount: context.switchAccount,
        RemoveAllAccounts: context.removeAllAccounts
    };
}

// Re-export the Account interface for backward compatibility
export type { Account } from "@contexts/AccountContext";
