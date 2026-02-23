/**
 * Immich SSO - Whitelist Model
 * Only emails listed here can authenticate to your Immich instance
 * via the portfolio's OIDC broker.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IImmichWhitelist extends Document {
    email: string;           // Email address to whitelist (always present)
    label: string;           // Friendly display name
    note?: string;           // Admin note
    enabled: boolean;        // Soft enable/disable without deleting
    addedBy: string;         // Admin email that added this entry
    addedAt: Date;
    lastAccess?: Date;       // Last time this email authenticated to Immich
    accessCount: number;     // How many times they've authenticated

    // Better Auth account linkage (optional — email-only entries have no userId)
    userId?: string;         // Better Auth user._id — match takes priority over email
    linkedAccount: boolean;  // true when userId is set
}

const ImmichWhitelistSchema = new Schema<IImmichWhitelist>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        label: { type: String, required: true, trim: true },
        note: { type: String, trim: true },
        enabled: { type: Boolean, default: true },
        addedBy: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
        lastAccess: { type: Date },
        accessCount: { type: Number, default: 0 },

        // Better Auth linkage
        userId: { type: String, index: true, sparse: true }, // unique per BA user
        linkedAccount: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const ImmichWhitelist =
    mongoose.models.ImmichWhitelist ||
    mongoose.model<IImmichWhitelist>("ImmichWhitelist", ImmichWhitelistSchema);

// ---------------------------------------------------------------------------
// Immich SSO Auth Code Model
// Short-lived codes exchanged for ID tokens (valid 5 minutes)
// ---------------------------------------------------------------------------
export interface IImmichAuthCode extends Document {
    code: string;
    sub: string;          // User's unique ID (better-auth user ID)
    email: string;
    name: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    nonce?: string;
    expiresAt: Date;
}

const ImmichAuthCodeSchema = new Schema<IImmichAuthCode>({
    code: { type: String, required: true, unique: true, index: true },
    sub: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, default: "" },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    scope: { type: String, default: "openid email profile" },
    nonce: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },  // TTL index
});

export const ImmichAuthCode =
    mongoose.models.ImmichAuthCode ||
    mongoose.model<IImmichAuthCode>("ImmichAuthCode", ImmichAuthCodeSchema);
