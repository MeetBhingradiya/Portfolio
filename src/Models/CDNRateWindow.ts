/**
 * CDN Rate Window Model
 *
 * Stores per-key sliding window counters for rate limiting.
 * Documents expire automatically via MongoDB TTL indexes.
 *
 * Each document tracks a fixed-width time window for a specific keyId.
 * On every request:
 *   1. Upsert the window document for the current minute/hour/day bucket.
 *   2. Increment the `count` field atomically.
 *   3. Compare against the policy limits.
 *
 * Window types:
 *   minute  — 60-second bucket  (TTL: 2 minutes)
 *   hour    — 60-minute bucket  (TTL: 2 hours)
 *   day     — calendar day UTC  (TTL: 2 days)
 */
import mongoose, { Schema, Document } from "mongoose";

export type WindowType = "minute" | "hour" | "day";

export interface ICDNRateWindow extends Document {
    keyId:      string;          // references CDNAPIKey.keyId
    windowType: WindowType;
    bucket:     string;          // ISO-like bucket string e.g. "2026-03-03T14:05" for minute
    count:      number;
    expiresAt:  Date;
}

const CDNRateWindowSchema = new Schema<ICDNRateWindow>(
    {
        keyId:      { type: String, required: true, index: true },
        windowType: { type: String, enum: ["minute", "hour", "day"], required: true },
        bucket:     { type: String, required: true },
        count:      { type: Number, required: true, default: 0 },
        expiresAt:  { type: Date, required: true },
    },
    { timestamps: false }
);

CDNRateWindowSchema.index({ keyId: 1, windowType: 1, bucket: 1 }, { unique: true });
CDNRateWindowSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-delete

export const CDNRateWindow =
    mongoose.models.CDNRateWindow ||
    mongoose.model<ICDNRateWindow>("CDNRateWindow", CDNRateWindowSchema);
