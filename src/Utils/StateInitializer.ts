import { getCurrentState } from "@Controllers/State";
import { log } from "@Utils";

/**
 * Initialize application state on startup
 * This should be called when the application starts
 */
export async function initializeAppState(): Promise<void> {
    try {
        log("Initializing application state...");
        
        const state = await getCurrentState();
        
        if (state) {
            log("Application state initialized successfully");
            log(`State ID: ${state.StateID}`);
            log(`Signup Enabled: ${state.Authentication.Signup_Enabled}`);
            log(`Signin Enabled: ${state.Authentication.Signin_Enabled}`);
            log(`Vercel Analytics: ${state.Analytics.Vercel}`);
            log(`Google Ads: ${state.Monitization.GoogleADS}`);
            log(`React Scan: ${state.Debugging.ReactScan}`);
            log(`Whitelisted Domains: ${state.Authentication.Whitelisted_Email_Domains.length} domains`);
            log(`Blocked Threats: ${state.Authentication.Blocked_Threats.join(", ")}`);
        } else {
            log("Warning: Failed to initialize application state");
        }
    } catch (error) {
        log(`Error during state initialization: ${error}`);
    }
}

/**
 * Get a summary of current state configuration
 */
export async function getStateInfo(): Promise<Record<string, any> | null> {
    try {
        const state = await getCurrentState();
        
        if (!state) {
            return null;
        }

        return {
            stateId: state.StateID,
            lastUpdated: state.updatedAt,
            features: {
                signupEnabled: state.Authentication.Signup_Enabled,
                signinEnabled: state.Authentication.Signin_Enabled,
                vercelAnalytics: state.Analytics.Vercel,
                googleAds: state.Monitization.GoogleADS,
                reactScan: state.Debugging.ReactScan
            },
            security: {
                whitelistedDomains: state.Authentication.Whitelisted_Email_Domains,
                blockedThreats: state.Authentication.Blocked_Threats,
                passwordRequirements: {
                    minLength: state.Authentication.Password_Strength.Min_Length,
                    maxLength: state.Authentication.Password_Strength.Max_Length,
                    requireUppercase: state.Authentication.Password_Strength.Require_Uppercase,
                    requireLowercase: state.Authentication.Password_Strength.Require_Lowercase,
                    requireNumbers: state.Authentication.Password_Strength.Require_Numbers,
                    requireSpecialCharacters: state.Authentication.Password_Strength.Require_Special_Characters
                }
            }
        };
    } catch (error) {
        log(`Error getting state info: ${error}`);
        return null;
    }
}
