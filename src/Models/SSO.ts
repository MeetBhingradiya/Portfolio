/**
 * SSO Models
 * For managing Third-Party OAuth Apps, access whitelists, and short-lived auth codes.
 */
import mongoose, { Schema, Document } from "mongoose";

// ---------------------------------------------------------------------------
// SSO App Model
// Represents a registered Third-Party Application (like Immich, Grafana, etc.)
// ---------------------------------------------------------------------------
export interface ISSOApp extends Document {
    name: string;
    clientId: string;
    clientSecret?: string; // Optional if not required by the app
    appIcon?: string; // App icon URL (e.g. GitHub CDN)
    redirectUris: string[];
    gateKey?: string; // Optional security gate query param requirement
    enabled: boolean;
    allowNewTokens: boolean; // Allow issuing new tokens
    allowNewSignups: boolean;
    description?: string;
    visibility: "public" | "private";
    accessMode: "public" | "private";
    addedBy: string; // Admin email that added this app
    createdAt: Date;
    updatedAt: Date;
}

const SSOAppSchema = new Schema<ISSOApp>(
    {
        name: { type: String, required: true, trim: true },
        clientId: { type: String, required: true, unique: true, trim: true, index: true },
        clientSecret: { type: String, trim: true },
        appIcon: { type: String, trim: true },
        redirectUris: [{ type: String, required: true, trim: true }],
        gateKey: { type: String, trim: true },
        enabled: { type: Boolean, default: true },
        allowNewTokens: { type: Boolean, default: true },
        allowNewSignups: { type: Boolean, default: false },
        description: { type: String, trim: true },
        visibility: { type: String, enum: ["public", "private"], default: "private" },
        accessMode: { type: String, enum: ["public", "private"], default: "private" },
        addedBy: { type: String, required: true }
    },
    { timestamps: true }
);

export const SSOApp = mongoose.models.SSOApp || mongoose.model<ISSOApp>("SSOApp", SSOAppSchema);

// ---------------------------------------------------------------------------
// SSO App Access Model
// Whitelist of emails allowed to authenticate to a specific application
// ---------------------------------------------------------------------------
export interface ISSOAppAccess extends Document {
    appId: mongoose.Types.ObjectId; // Reference to SSOApp
    email: string;
    label: string;
    note?: string;
    enabled: boolean;
    addedBy: string;
    addedAt: Date;
    lastAccess?: Date;
    accessCount: number;

    // Better Auth linkage
    userId?: string;
    linkedAccount: boolean;
    subOverride?: string;
    lastIssuedSub?: string;
}

const SSOAppAccessSchema = new Schema<ISSOAppAccess>(
    {
        appId: { type: Schema.Types.ObjectId, ref: "SSOApp", required: true, index: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        label: { type: String, required: true, trim: true },
        note: { type: String, trim: true },
        enabled: { type: Boolean, default: true },
        addedBy: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
        lastAccess: { type: Date },
        accessCount: { type: Number, default: 0 },

        userId: { type: String, sparse: true },
        linkedAccount: { type: Boolean, default: false },
        subOverride: { type: String, trim: true },
        lastIssuedSub: { type: String, trim: true }
    },
    { timestamps: true }
);

// Prevent duplicate emails per app
SSOAppAccessSchema.index({ appId: 1, email: 1 }, { unique: true });

export const SSOAppAccess = mongoose.models.SSOAppAccess || mongoose.model<ISSOAppAccess>("SSOAppAccess", SSOAppAccessSchema);

// ---------------------------------------------------------------------------
// SSO Auth Code Model
// Short-lived codes exchanged for ID tokens
// ---------------------------------------------------------------------------
export interface ISSOAuthCode extends Document {
    code: string;
    sub: string;
    email: string;
    name: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    nonce?: string;
    expiresAt: Date;
}

const SSOAuthCodeSchema = new Schema<ISSOAuthCode>({
    code: { type: String, required: true, unique: true, index: true },
    sub: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, default: "" },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    scope: { type: String, default: "openid email profile" },
    nonce: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index
});

export const SSOAuthCode = mongoose.models.SSOAuthCode || mongoose.model<ISSOAuthCode>("SSOAuthCode", SSOAuthCodeSchema);
