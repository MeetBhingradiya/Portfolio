/**
 * Avatar Utilities
 * Generate consistent gradients and handle avatar display logic
 */

// Generate consistent gradient based on user ID
export function generateAvatarGradient(userId: string): string {
    // Predefined beautiful gradient combinations
    const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
        "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
        "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)",
        "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
        "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
        "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
        "linear-gradient(135deg, #7f7fd5 0%, #86a8e7 0%, #91eae4 100%)",
        "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)",
        "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)",
        "linear-gradient(135deg, #fd79a8 0%, #e84393 100%)",
        "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
        "linear-gradient(135deg, #55efc4 0%, #00b894 100%)",
        "linear-gradient(135deg, #fab1a0 0%, #e17055 100%)"
    ];

    // Generate consistent index from user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32-bit integer
    }

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

// Get initials from name or email
export function getInitials(name?: string | null, email?: string | null): string {
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0]?.toUpperCase() || "?";
    }

    if (email) {
        return email[0]?.toUpperCase() || "?";
    }

    return "?";
}

// Get avatar URL from linked accounts
export function getAvatarFromAccounts(accounts: any[], selectedProviderId?: string): string | null {
    if (!accounts || accounts.length === 0) return null;

    // If user has selected a specific provider, use that
    if (selectedProviderId) {
        const selectedAccount = accounts.find((acc) => acc.providerId === selectedProviderId);
        if (selectedAccount?.image) return selectedAccount.image;
    }

    // Otherwise, prioritize OAuth providers in order: Google, GitHub, Discord
    const priority = ["google", "github", "discord"];

    for (const provider of priority) {
        const account = accounts.find((acc) => acc.providerId === provider);
        if (account?.image) return account.image;
    }

    // Fallback to any account with an image
    const accountWithImage = accounts.find((acc) => acc.image);
    return accountWithImage?.image || null;
}
