/**
 * SiteSettings Mongoose Model
 * Singleton document that stores site-wide admin settings.
 */

import mongoose from "mongoose";

const PaymentProviderSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, default: false },
        publicKey: { type: String, default: "" },
        secretKey: { type: String, default: "" }, // Encrypted at rest
        extra: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    { _id: false }
);

const SiteSettings_Schema = new mongoose.Schema(
    {
        ConfigID: {
            type: String,
            default: "site_settings_singleton",
            unique: true,
            index: true
        },
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

export interface IPaymentProvider {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    extra: Record<string, unknown>;
}

export interface ISiteSettings extends mongoose.Document {
    ConfigID: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maintenanceUpdatedBy: string;
    allowSignup: boolean;
    shopEnabled: boolean;
    productivityEnabled: boolean;
    phonePolicies: {
        maxPhonesPerAccount: number;
        maxAccountsPerPhone: number;
        otpExpiryMinutes: number;
        otpMaxAttempts: number;
    };
    emailPolicies: {
        verificationRateLimitWindowMinutes: number;
        verificationRateLimitMax: number;
    };
    paymentProviders: {
        stripe: IPaymentProvider;
        razorpay: IPaymentProvider;
        paypal: IPaymentProvider;
        lemonSqueezy: IPaymentProvider;
        paddle: IPaymentProvider;
    };
    createdAt: Date;
    updatedAt: Date;
}

export const SiteSettings_Model: mongoose.Model<ISiteSettings> =
    mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettings_Schema);

/**
 * Get the singleton SiteSettings document.
 * Creates it with defaults if it doesn't exist.
 */
export async function getSiteSettings(): Promise<ISiteSettings> {
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
