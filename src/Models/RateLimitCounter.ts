/**
 * Rate Limit Counter Model
 *
 * Persistent MongoDB counters for cross-isolate rate limiting state
 * and admin dashboard visibility. Documents auto-expire via TTL index.
 *
 * Used by:
 *   - /api/rate-limit-status (internal proxy helper)
 *   - /api/admin/rate-limits/counters (admin dashboard)
 *
 * NOT used directly by the Edge proxy (too heavy) — the proxy uses
 * in-memory counters and periodically syncs to this collection.
 */

import mongoose, { Schema, Document } from "mongoose";

export type RateLimitIdentityType = "ip" | "fingerprint";

export interface IRateLimitCounter extends Document {
    /** Identity value: IP address or fingerprint hash */
    identity: string;
    /** Type of identity */
    identityType: RateLimitIdentityType;
    /** Endpoint path or group name that triggered the limit */
    endpoint: string;
    /** Rule ID from the rate limit config */
    ruleId: string;
    /** Rule name for display */
    ruleName: string;
    /** When this window started */
    windowStart: Date;
    /** Request count in this window */
    count: number;
    /** Whether this identity is currently rate-limited */
    blocked: boolean;
    /** When the last request was received */
    lastRequestAt: Date;
    /** Additional metadata for the admin dashboard */
    metadata: {
        userAgent?: string;
        country?: string;
        city?: string;
        firstSeenAt?: Date;
    };
    /** TTL auto-delete timestamp */
    expiresAt: Date;
}

const RateLimitCounterSchema = new Schema<IRateLimitCounter>(
    {
        identity: { type: String, required: true, index: true },
        identityType: {
            type: String,
            enum: ["ip", "fingerprint"],
            required: true
        },
        endpoint: { type: String, required: true },
        ruleId: { type: String, required: true },
        ruleName: { type: String, default: "" },
        windowStart: { type: Date, required: true },
        count: { type: Number, required: true, default: 0 },
        blocked: { type: Boolean, default: false },
        lastRequestAt: { type: Date, default: Date.now },
        metadata: {
            userAgent: { type: String, default: "" },
            country: { type: String, default: "" },
            city: { type: String, default: "" },
            firstSeenAt: { type: Date, default: Date.now }
        },
        expiresAt: { type: Date, required: true }
    },
    {
        timestamps: false,
        versionKey: false
    }
);

// Compound index for fast lookups during rate limit checks
RateLimitCounterSchema.index(
    { identity: 1, identityType: 1, endpoint: 1, windowStart: 1 },
    { unique: true }
);

// Index for admin queries — find all blocked entries
RateLimitCounterSchema.index({ blocked: 1, lastRequestAt: -1 });

// TTL index — MongoDB automatically deletes expired documents
RateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitCounter =
    mongoose.models.RateLimitCounter ||
    mongoose.model<IRateLimitCounter>("RateLimitCounter", RateLimitCounterSchema);
