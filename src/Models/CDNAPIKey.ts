/**
 * CDN API Key Model
 *
 * Issued after an admin approves a CDNApplication.
 * Each key carries its own rate-limit policy (requests per minute and per day).
 * A hashed version of the key is stored so the plain-text key is only shown once.
 *
 * Key format:  cdn_<32-char-hex>   e.g. cdn_a1b2c3d4e5f6...
 * Stored:      SHA-256 hash of the full key string.
 *
 * Rate-limit windows stored in MongoDB (via CDNRateWindow) to survive restarts.
 */
import mongoose, { Schema, Document } from "mongoose";

export type KeyStatus = "active" | "revoked" | "suspended" | "expired";

export interface IRateLimitPolicy {
    requestsPerMinute: number; // hard cap per 1-min sliding window
    requestsPerHour: number; // hard cap per 1-hour sliding window
    requestsPerDay: number; // hard cap per calendar day (UTC)
    maxFileSizeBytes: number; // max single upload size via external API
    allowUpload: boolean; // whether this key may call the upload endpoint
    allowDownload: boolean; // whether this key may call the download endpoint
    allowedMimeTypes: string[]; // empty = all; ["image/*","application/pdf"] = restricted
}

export interface ICDNAPIKey extends Document {
    // Identity
    keyId: string; // Unique opaque ID shown in admin (e.g. "key_<nanoid>")
    keyHash: string; // SHA-256 hex of the raw key string (stored, never plain)
    keyPrefix: string; // First 8 chars of raw key for display ("cdn_a1b2...")

    // Linked application
    applicationId: string; // CDNApplication._id (string ref)
    appName: string; // Denormalised for quick display
    applicantEmail: string; // Denormalised

    // Plan & policy
    plan: "free" | "basic" | "pro" | "enterprise";
    rateLimit: IRateLimitPolicy;

    // Lifecycle
    status: KeyStatus;
    expiresAt?: Date; // Undefined = no expiry
    revokedAt?: Date;
    revokedBy?: string; // Admin who revoked
    revokeReason?: string;

    // Admin notes
    issuedBy: string; // Admin email/userId who issued the key
    notes?: string;

    // Usage counters (lightweight, updated async — not transactional)
    totalRequests: number;
    totalUploads: number;
    totalDownloads: number;
    lastUsedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const RateLimitPolicySchema = new Schema<IRateLimitPolicy>(
    {
        requestsPerMinute: { type: Number, required: true, default: 60 },
        requestsPerHour: { type: Number, required: true, default: 1000 },
        requestsPerDay: { type: Number, required: true, default: 10000 },
        maxFileSizeBytes: {
            type: Number,
            required: true,
            default: 10 * 1024 * 1024
        }, // 10 MB default
        allowUpload: { type: Boolean, required: true, default: true },
        allowDownload: { type: Boolean, required: true, default: true },
        allowedMimeTypes: { type: [String], default: [] }
    },
    { _id: false }
);

const CDNAPIKeySchema = new Schema<ICDNAPIKey>(
    {
        keyId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        keyHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        keyPrefix: { type: String, required: true, trim: true },

        applicationId: {
            type: String,
            required: true,
            index: true,
            trim: true
        },
        appName: { type: String, required: true, trim: true },
        applicantEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },

        plan: {
            type: String,
            enum: ["free", "basic", "pro", "enterprise"],
            default: "free"
        },
        rateLimit: { type: RateLimitPolicySchema, required: true },

        status: {
            type: String,
            enum: ["active", "revoked", "suspended", "expired"],
            default: "active",
            index: true
        },
        expiresAt: { type: Date },
        revokedAt: { type: Date },
        revokedBy: { type: String, trim: true },
        revokeReason: { type: String, trim: true },

        issuedBy: { type: String, required: true, trim: true },
        notes: { type: String, trim: true },

        totalRequests: { type: Number, default: 0 },
        totalUploads: { type: Number, default: 0 },
        totalDownloads: { type: Number, default: 0 },
        lastUsedAt: { type: Date }
    },
    { timestamps: true }
);

CDNAPIKeySchema.index({ status: 1, plan: 1 });

export const CDNAPIKey = mongoose.models.CDNAPIKey || mongoose.model<ICDNAPIKey>("CDNAPIKey", CDNAPIKeySchema);

// ── Default rate-limit policies per plan ──────────────────────────────────────

export const PLAN_DEFAULTS: Record<string, IRateLimitPolicy> = {
    free: {
        requestsPerMinute: 10,
        requestsPerHour: 200,
        requestsPerDay: 1000,
        maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    },
    basic: {
        requestsPerMinute: 30,
        requestsPerHour: 1000,
        requestsPerDay: 10_000,
        maxFileSizeBytes: 20 * 1024 * 1024, // 20 MB
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    },
    pro: {
        requestsPerMinute: 120,
        requestsPerHour: 5000,
        requestsPerDay: 50_000,
        maxFileSizeBytes: 49 * 1024 * 1024, // 49 MB (GitHub limit)
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    },
    enterprise: {
        requestsPerMinute: 600,
        requestsPerHour: 20_000,
        requestsPerDay: 200_000,
        maxFileSizeBytes: 49 * 1024 * 1024,
        allowUpload: true,
        allowDownload: true,
        allowedMimeTypes: []
    }
};
