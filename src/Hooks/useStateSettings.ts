"use client";

import { useState, useEffect } from "react";

interface StateSettings {
    Analytics: {
        Vercel: boolean;
    };
    Debugging: {
        ReactScan: boolean;
    };
    Monitization: {
        GoogleADS: boolean;
    };
    Authentication: {
        Whitelisted_Email_Domains: string[];
        Blocked_Threats: string[];
        Signup_Enabled: boolean;
        Signin_Enabled: boolean;
        Password_Strength: {
            Min_Length: number;
            Max_Length: number;
            Require_Uppercase: boolean;
            Require_Lowercase: boolean;
            Require_Numbers: boolean;
            Require_Special_Characters: boolean;
        };
    };
}

/**
 * Custom hook to manage site state settings
 */
export function useStateSettings() {
    const [settings, setSettings] = useState<StateSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/state');
            const data = await response.json();
            
            if (data.Status === 1) {
                setSettings(data.Data);
                setError(null);
            } else {
                setError(data.Message);
            }
        } catch (err) {
            setError('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (updates: Partial<StateSettings>) => {
        try {
            const response = await fetch('/api/admin/state', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });
            
            const data = await response.json();
            
            if (data.Status === 1) {
                setSettings(data.Data);
                setError(null);
                return true;
            } else {
                setError(data.Message);
                return false;
            }
        } catch (err) {
            setError('Failed to update settings');
            return false;
        }
    };

    const syncWithRemote = async () => {
        try {
            const response = await fetch('/api/admin/state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'sync' }),
            });
            
            const data = await response.json();
            
            if (data.Status === 1) {
                setSettings(data.Data);
                setError(null);
                return true;
            } else {
                setError(data.Message);
                return false;
            }
        } catch (err) {
            setError('Failed to sync with remote state');
            return false;
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return {
        settings,
        loading,
        error,
        refetch: fetchSettings,
        updateSettings,
        syncWithRemote
    };
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureEnabled(feature: string) {
    const { settings, loading } = useStateSettings();

    const isEnabled = () => {
        if (!settings) return false;

        switch (feature) {
            case 'signup':
                return settings.Authentication.Signup_Enabled;
            case 'signin':
                return settings.Authentication.Signin_Enabled;
            case 'vercel_analytics':
                return settings.Analytics.Vercel;
            case 'react_scan':
                return settings.Debugging.ReactScan;
            case 'google_ads':
                return settings.Monitization.GoogleADS;
            default:
                return false;
        }
    };

    return {
        isEnabled: isEnabled(),
        loading,
        settings
    };
}

/**
 * Hook to check if an email domain is whitelisted
 */
export function useEmailDomainCheck() {
    const { settings } = useStateSettings();

    const isWhitelisted = (email: string) => {
        if (!settings) return false;
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return false;
        
        return settings.Authentication.Whitelisted_Email_Domains.includes(domain);
    };

    const getWhitelistedDomains = () => {
        return settings?.Authentication.Whitelisted_Email_Domains || [];
    };

    return {
        isWhitelisted,
        getWhitelistedDomains,
        settings
    };
}

/**
 * Hook to get password strength requirements
 */
export function usePasswordRequirements() {
    const { settings } = useStateSettings();

    const getRequirements = () => {
        if (!settings) {
            return {
                minLength: 8,
                maxLength: 64,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialCharacters: true
            };
        }

        return {
            minLength: settings.Authentication.Password_Strength.Min_Length,
            maxLength: settings.Authentication.Password_Strength.Max_Length,
            requireUppercase: settings.Authentication.Password_Strength.Require_Uppercase,
            requireLowercase: settings.Authentication.Password_Strength.Require_Lowercase,
            requireNumbers: settings.Authentication.Password_Strength.Require_Numbers,
            requireSpecialCharacters: settings.Authentication.Password_Strength.Require_Special_Characters
        };
    };

    const validatePassword = (password: string) => {
        const requirements = getRequirements();
        const errors: string[] = [];

        if (password.length < requirements.minLength) {
            errors.push(`Password must be at least ${requirements.minLength} characters long`);
        }

        if (password.length > requirements.maxLength) {
            errors.push(`Password must not exceed ${requirements.maxLength} characters`);
        }

        if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (requirements.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (requirements.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (requirements.requireSpecialCharacters && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    return {
        getRequirements,
        validatePassword,
        settings
    };
}
