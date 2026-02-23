import { State_Model, IState } from "../Models/State";
import { dbConnect } from "../Utils/dbConnect";
import { log } from "../Utils";

interface RemoteStateData {
    "DatabaseBydefualt": {
        Signup_Username_Prefix: string;
        LocalStorage_RSAID: string;
        Cookie_RSAID: string;
    };
    "WhiteListed_Email_Domains": string[];
    "Password_Strength": {
        Length: number;
        UpperCase: boolean;
        LowerCase: boolean;
        Digits: boolean;
        SpecialCharacters: boolean;
    };
    "Authentication": {
        LoginPermission: boolean;
        RegisterPermission: boolean;
        ForgotPasswordPermission: boolean;
        ThreatIntelligence: string[];
    };
    "Analytics_And_Monitization": {
        GoogleADS: boolean;
        VercelSpeedInsight: boolean;
        ReactScan: boolean;
    };
    "CI/CD_Pipeline": {
        Release: boolean;
    };
}

const REMOTE_STATE_URL =
    "https://raw.githubusercontent.com/MeetBhingradiya/Portfolio-RemoteState/refs/heads/Release/State.json";

/**
 * Fetch remote state configuration from GitHub repository
 */
export async function fetchRemoteState(): Promise<RemoteStateData | null> {
    try {
        const response = await fetch(REMOTE_STATE_URL, {
            cache: "no-store",
            headers: {
                "Cache-Control": "no-cache"
            }
        });

        if (!response.ok) {
            log(
                `Failed to fetch remote state: ${response.status} ${response.statusText}`
            );
            return null;
        }

        const data = await response.json();
        return data.File;
    } catch (error) {
        log(`Error fetching remote state: ${error}`);
        return null;
    }
}

/**
 * Get current state settings from database or initialize from remote state
 */
export async function getCurrentState(): Promise<IState | null> {
    try {
        await dbConnect();

        // Check if state document exists in database
        let state = await State_Model.findOne().sort({ createdAt: -1 });

        if (!state) {
            // No state found in database, fetch from remote and initialize
            log(
                "No state found in database, fetching from remote repository..."
            );
            const remoteState = await fetchRemoteState();
            if (remoteState) {
                // Map remote state to database schema
                state = await State_Model.create({
                    Analytics: {
                        Vercel: remoteState.Analytics_And_Monitization
                            .VercelSpeedInsight
                    },
                    Debugging: {
                        ReactScan:
                            remoteState.Analytics_And_Monitization.ReactScan
                    },
                    Monitization: {
                        GoogleADS:
                            remoteState.Analytics_And_Monitization.GoogleADS
                    },
                    Authentication: {
                        Whitelisted_Email_Domains:
                            remoteState.WhiteListed_Email_Domains,
                        Blocked_Threats: remoteState.Authentication
                            .ThreatIntelligence as any,
                        Signup_Enabled:
                            remoteState.Authentication.RegisterPermission,
                        Signin_Enabled:
                            remoteState.Authentication.LoginPermission,
                        Password_Strength: {
                            Min_Length: remoteState.Password_Strength.Length,
                            Max_Length: 64, // Default max length
                            Require_Uppercase:
                                remoteState.Password_Strength.UpperCase,
                            Require_Lowercase:
                                remoteState.Password_Strength.LowerCase,
                            Require_Numbers:
                                remoteState.Password_Strength.Digits,
                            Require_Special_Characters:
                                remoteState.Password_Strength.SpecialCharacters
                        }
                    }
                });

                log("State initialized from remote repository");
            } else {
                // Create default state if remote fetch fails
                state = await State_Model.create({});
                log("State initialized with default values");
            }
        }

        return state;
    } catch (error) {
        log(`Error getting current state: ${error}`);
        return null;
    }
}

/**
 * Update state settings in database
 */
export async function updateState(
    updates: Partial<IState>
): Promise<IState | null> {
    try {
        await dbConnect();

        let state = await State_Model.findOne().sort({ createdAt: -1 });

        if (!state) {
            // Create new state if none exists
            state = await State_Model.create(updates);
        } else {
            // Update existing state
            Object.assign(state, updates);
            await state.save();
        }

        log("State updated successfully");
        return state;
    } catch (error) {
        log(`Error updating state: ${error}`);
        return null;
    }
}

/**
 * Sync local state with remote state (admin function)
 */
export async function syncWithRemoteState(): Promise<IState | null> {
    try {
        const remoteState = await fetchRemoteState();
        if (!remoteState) {
            throw new Error("Failed to fetch remote state");
        }
        const updates = {
            Analytics: {
                Vercel: remoteState.Analytics_And_Monitization
                    .VercelSpeedInsight
            },
            Debugging: {
                ReactScan: remoteState.Analytics_And_Monitization.ReactScan
            },
            Monitization: {
                GoogleADS: remoteState.Analytics_And_Monitization.GoogleADS
            },
            Authentication: {
                Whitelisted_Email_Domains:
                    remoteState.WhiteListed_Email_Domains,
                Blocked_Threats: remoteState.Authentication
                    .ThreatIntelligence as any,
                Signup_Enabled: remoteState.Authentication.RegisterPermission,
                Signin_Enabled: remoteState.Authentication.LoginPermission,
                Password_Strength: {
                    Min_Length: remoteState.Password_Strength.Length,
                    Max_Length: 64,
                    Require_Uppercase: remoteState.Password_Strength.UpperCase,
                    Require_Lowercase: remoteState.Password_Strength.LowerCase,
                    Require_Numbers: remoteState.Password_Strength.Digits,
                    Require_Special_Characters:
                        remoteState.Password_Strength.SpecialCharacters
                }
            }
        };

        const updatedState = await updateState(updates);
        log("State synced with remote repository");
        return updatedState;
    } catch (error) {
        log(`Error syncing with remote state: ${error}`);
        return null;
    }
}

/**
 * Get state for specific feature check
 */
export async function getFeatureState(feature: string): Promise<boolean> {
    try {
        const state = await getCurrentState();
        if (!state) return false;

        switch (feature) {
            case "signup":
                return state.Authentication.Signup_Enabled;
            case "signin":
                return state.Authentication.Signin_Enabled;
            case "vercel_analytics":
                return state.Analytics.Vercel;
            case "react_scan":
                return state.Debugging.ReactScan;
            case "google_ads":
                return state.Monitization.GoogleADS;
            default:
                return false;
        }
    } catch (error) {
        log(`Error getting feature state for ${feature}: ${error}`);
        return false;
    }
}
