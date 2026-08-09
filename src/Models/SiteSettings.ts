/**
 * SiteSettings Mongoose Model
 * Singleton document that stores site-wide admin settings.
 */

import mongoose from "mongoose";

const PaymentProviderSchema = new mongoose.Schema(
    {
        enabled: {
            type: Boolean,
            default: false
        },
        publicKey: {
            type: String,
            default: ""
        },
        secretKey: {
            type: String,
            default: ""
        },
        extra: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        _id: false
    }
);

interface ISiteSettings extends mongoose.Document {

    // ! New Site Settings
    ConfigID: string;

    Maintenance?: {
        enabled?: boolean;
        message?: string;
        updatedBy?: string;
    }

    Features?: {
        // ? Profile
        Past_Avatar_History?: boolean;

        // ? Tools
        Tool_Productivity_Tracking: boolean;
        Tool_Wallet_Tracker: boolean;
        Tool_Document_Vault: boolean;
        Tool_Assignment_Docs: boolean;
        Tool_Resume_Builder: boolean;

        // @ Merged in Feature
        Tool_Trade_Journal: boolean;
        Tool_Trading_System: boolean;

        // ? Administrative
        CDN_Management: boolean;
        Shop_Management: boolean; // Orders, Products, Refunds
        Support_Ticketing: boolean;
    }

    Policy?: {
        // ? Authentication
        Allow_New_Signups: boolean;
        Allow_New_Signins: boolean;

        // ? Social Accounts
        Social_Account_Link_Google: boolean;
        Social_Account_Link_Github: boolean;
        Social_Account_Link_Microsoft: boolean;
        Social_Account_Link_Apple: boolean;

        // ? Security
        Anti_Debug: boolean;
    }

    Limits?: {
        Email_Verification: {
            Limit_Window_in_Minutes: number;
            Limit_Max_Attempts: number;
            OTP_Expiry_in_Minutes: number;
            OTP_Max_Attempts: number;
        },
        SMS_Verification: {
            Limit_Window_in_Minutes: number;
            Limit_Max_Attempts: number;
            OTP_Expiry_in_Minutes: number;
            OTP_Max_Attempts: number;
        };
        Contact_Form?: {
            Limit_Window_in_Minutes: number;
            Limit_Max_Messages_per_IP: number;
            Limit_Max_Messages_per_Email: number;
            Cooldown_in_Minutes: number;
            Max_Message_Length: number;
        };
    }

    RateLimits?: {
        globalEnabled: boolean;
        configRepoName: string;
        configPath: string;
        lastSyncedAt: Date;
        lastSyncedBy: string;
    }

    createdAt: Date;
    updatedAt: Date;
}

const SiteSettings_Schema = new mongoose.Schema(
    {
        ConfigID: {
            type: String,
            default: "site_settings_singleton",
            unique: true,
            index: true
        },

        // ! New structured settings format (to replace legacy flat settings below)
        Maintenance: {
            enabled: { type: Boolean, default: false },
            message: { type: String, default: "We're performing scheduled maintenance. We'll be back soon!" },
            updatedBy: { type: String, default: "" }
        },
        Features: {
            Past_Avatar_History: { type: Boolean, default: false },
            Tool_Productivity_Tracking: { type: Boolean, default: true },
            Tool_Wallet_Tracker: { type: Boolean, default: true },
            Tool_Document_Vault: { type: Boolean, default: true },
            Tool_Assignment_Docs: { type: Boolean, default: true },
            Tool_Trade_Journal: { type: Boolean, default: true },
            Tool_Trading_System: { type: Boolean, default: true },
            CDN_Management: { type: Boolean, default: true },
            Shop_Management: { type: Boolean, default: false },
            Support_Ticketing: { type: Boolean, default: false }
        },
        Policy: {
            Allow_New_Signups: { type: Boolean, default: true },
            Allow_New_Signins: { type: Boolean, default: true },
            Social_Account_Link_Google: { type: Boolean, default: true },
            Social_Account_Link_Github: { type: Boolean, default: true },
            Social_Account_Link_Microsoft: { type: Boolean, default: true },
            Social_Account_Link_Apple: { type: Boolean, default: true },
            Anti_Debug: { type: Boolean, default: true }
        },
        Limits: {
            Email_Verification: {
                Limit_Window_in_Minutes: { type: Number, default: 720 },
                Limit_Max_Attempts: { type: Number, default: 3 },
                OTP_Expiry_in_Minutes: { type: Number, default: 5 },
                OTP_Max_Attempts: { type: Number, default: 5 }
            },
            SMS_Verification: {
                Limit_Window_in_Minutes: { type: Number, default: 720 },
                Limit_Max_Attempts: { type: Number, default: 3 },
                OTP_Expiry_in_Minutes: { type: Number, default: 5 },
                OTP_Max_Attempts: { type: Number, default: 5 }
            },
            Contact_Form: {
                Limit_Window_in_Minutes: { type: Number, default: 60 },
                Limit_Max_Messages_per_IP: { type: Number, default: 5 },
                Limit_Max_Messages_per_Email: { type: Number, default: 3 },
                Cooldown_in_Minutes: { type: Number, default: 15 },
                Max_Message_Length: { type: Number, default: 5000 }
            }
        },
        RateLimits: {
            globalEnabled: { type: Boolean, default: true },
            configRepoName: { type: String, default: "" },
            configPath: { type: String, default: "config/rate-limits.json" },
            lastSyncedAt: { type: Date, default: null },
            lastSyncedBy: { type: String, default: "" }
        },

        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },

        // ! Legacy flat settings to be migrated to structured format below

        // ── Maintenance ─────────────────────────────────────────────────
        maintenanceMode: {
            type: Boolean,
            default: false
        },
        maintenanceMessage: {
            type: String,
            default: "We're performing scheduled maintenance. We'll be back soon!"
        },
        maintenanceUpdatedBy: {
            type: String,
            default: ""
        },
        // ── Feature Flags ────────────────────────────────────────────────
        allowSignup: {
            type: Boolean,
            default: true
        },
        shopEnabled: {
            type: Boolean,
            default: false
        },
        productivityEnabled: {
            type: Boolean,
            default: true
        },
        // ── Phone Security Policies ───────────────────────────────────────
        phonePolicies: {
            maxPhonesPerAccount: { type: Number, default: 3 },
            maxAccountsPerPhone: { type: Number, default: 3 },
            otpExpiryMinutes: { type: Number, default: 5 },
            otpMaxAttempts: { type: Number, default: 5 }
        },
        // ── Email Security Policies ───────────────────────────────────────
        emailPolicies: {
            verificationRateLimitWindowMinutes: { type: Number, default: 720 },
            verificationRateLimitMax: { type: Number, default: 3 }
        },
        // ── Payment Providers ────────────────────────────────────────────
        paymentProviders: {
            stripe: { type: PaymentProviderSchema, default: () => ({}) },
            razorpay: { type: PaymentProviderSchema, default: () => ({}) },
            paypal: { type: PaymentProviderSchema, default: () => ({}) },
            lemonSqueezy: { type: PaymentProviderSchema, default: () => ({}) },
            paddle: { type: PaymentProviderSchema, default: () => ({}) }
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

interface IPaymentProvider {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    extra: Record<string, unknown>;
}

const SiteSettings_Model: mongoose.Model<ISiteSettings> = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettings_Schema);

/**
 * Get the singleton SiteSettings document.
 * Creates it with defaults if it doesn't exist.
 */
async function getSiteSettings(): Promise<ISiteSettings> {
    let doc = await SiteSettings_Model.findOne({
        ConfigID: "site_settings_singleton"
    });
    if (!doc) {
        doc = await SiteSettings_Model.create({
            ConfigID: "site_settings_singleton"
        });
    }
    return doc;
}


export {
    SiteSettings_Model,
    SiteSettings_Schema,
    getSiteSettings,
}

export type {
    ISiteSettings,
    IPaymentProvider
}