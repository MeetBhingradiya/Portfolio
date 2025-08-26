import { Config } from "@Config";

/**
 * Utility to get enabled authentication providers
 */
export function getEnabledProviders() {
    const enabledProviders = [];
    
    for (const [providerName, config] of Object.entries(Config.AuthProviders)) {
        if (config.enabled && config.clientId && config.clientSecret) {
            enabledProviders.push({
                id: providerName.toLowerCase(),
                name: providerName,
                enabled: true
            });
        }
    }
    
    return enabledProviders;
}

/**
 * Check if a specific provider is enabled and configured
 */
export function isProviderEnabled(providerName: string): boolean {
    const provider = Config.AuthProviders[providerName];
    return !!(provider?.enabled && provider?.clientId && provider?.clientSecret);
}

/**
 * Get provider configuration
 */
export function getProviderConfig(providerName: string) {
    return Config.AuthProviders[providerName] || null;
}

/**
 * Check if device supports Apple Sign-In
 */
export function supportsAppleSignIn(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) || 
           (userAgent.includes("Mac") && "ontouchend" in document);
}

/**
 * Get available providers for current device/context
 */
export function getAvailableProviders() {
    const providers = getEnabledProviders();
    
    return providers.filter(provider => {
        // Filter out Apple provider on non-Apple devices
        if (provider.id === 'apple') {
            return supportsAppleSignIn();
        }
        return true;
    });
}
