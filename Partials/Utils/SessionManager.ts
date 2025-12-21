// Global session cleanup utilities
class SessionManager {
    private static instance: SessionManager;

    private constructor() {}

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    // Clean up when session is invalid
    cleanupInvalidSession(userID?: string): void {
        const savedAccounts = localStorage.getItem("saved-accounts");
        const currentToken = localStorage.getItem("auth-token");

        if (!savedAccounts) return;

        try {
            const accounts = JSON.parse(savedAccounts);
            const targetUserID =
                userID || this.getCurrentUserID(currentToken, accounts);

            if (targetUserID) {
                // Remove the invalid account
                const updatedAccounts = accounts.filter(
                    (acc: any) => acc.userID !== targetUserID
                );

                // If this was the current account
                if (
                    currentToken &&
                    accounts.find(
                        (acc: any) =>
                            acc.userID === targetUserID &&
                            acc.encryptedToken === currentToken
                    )
                ) {
                    // Clear current token
                    localStorage.removeItem("auth-token");
                    document.cookie =
                        "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

                    // Switch to another account if available
                    if (updatedAccounts.length > 0) {
                        const mostRecentAccount = updatedAccounts.sort(
                            (a: any, b: any) =>
                                new Date(b.lastUsed || 0).getTime() -
                                new Date(a.lastUsed || 0).getTime()
                        )[0];

                        localStorage.setItem(
                            "auth-token",
                            mostRecentAccount.encryptedToken
                        );
                        document.cookie = `auth-token=${mostRecentAccount.encryptedToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;

                        // Trigger page reload to reflect the account switch
                        setTimeout(() => {
                            window.location.reload();
                        }, 100);
                        return;
                    }
                }

                // Update saved accounts
                if (updatedAccounts.length > 0) {
                    localStorage.setItem(
                        "saved-accounts",
                        JSON.stringify(updatedAccounts)
                    );
                } else {
                    localStorage.removeItem("saved-accounts");
                }
            }

            // If no valid accounts remain, redirect to sign in
            if (!localStorage.getItem("auth-token")) {
                this.redirectToSignIn();
            }
        } catch (error) {
            console.error("Error cleaning up invalid session:", error);
            this.clearAllAccountData();
        }
    }

    // Get current user ID from token and accounts
    private getCurrentUserID(
        token: string | null,
        accounts: any[]
    ): string | null {
        if (!token || !accounts.length) return null;

        const currentAccount = accounts.find(
            (acc) => acc.encryptedToken === token
        );
        return currentAccount?.userID || null;
    }

    // Clear all account data
    clearAllAccountData(): void {
        localStorage.removeItem("saved-accounts");
        localStorage.removeItem("auth-token");
        document.cookie =
            "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }

    // Redirect to sign in
    redirectToSignIn(): void {
        // Use setTimeout to avoid issues with React Router during component rendering
        setTimeout(() => {
            if (typeof window !== "undefined") {
                window.location.href = "/auth/signin";
            }
        }, 100);
    }

    // Handle 401 errors
    handle401Error(): void {
        const currentToken = localStorage.getItem("auth-token");
        if (currentToken) {
            // Find and remove the account with this token
            const savedAccounts = localStorage.getItem("saved-accounts");
            if (savedAccounts) {
                try {
                    const accounts = JSON.parse(savedAccounts);
                    const invalidAccount = accounts.find(
                        (acc: any) => acc.encryptedToken === currentToken
                    );
                    if (invalidAccount) {
                        this.cleanupInvalidSession(invalidAccount.userID);
                        return;
                    }
                } catch (error) {
                    console.error(
                        "Error parsing saved accounts during 401 handling:",
                        error
                    );
                }
            }
        }

        // Fallback: clear everything and redirect
        this.clearAllAccountData();
        this.redirectToSignIn();
    }
}

export const sessionManager = SessionManager.getInstance();

// Utility functions for easy access
export const cleanupInvalidSession = (userID?: string) =>
    sessionManager.cleanupInvalidSession(userID);

export const handle401Error = () => sessionManager.handle401Error();

export const clearAllAccountData = () => sessionManager.clearAllAccountData();

export const redirectToSignIn = () => sessionManager.redirectToSignIn();
