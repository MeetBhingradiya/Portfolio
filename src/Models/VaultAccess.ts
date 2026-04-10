/**
 * VaultAccess Model
 * Admin-controlled whitelist that governs which users can access the Private Vault
 * and how much storage each user is allowed.
 * Mirrors the ImmichWhitelist pattern.
 */
import mongoose, { Schema, Document } from "mongoose";

/** 500 MB default limit */
const DEFAULT_LIMIT_BYTES = 500 * 1024 * 1024;

export interface IVaultAccess extends Document {
    userId: string; // Better Auth user._id
    email: string; // Displayed in admin panel; kept in sync with the user record
    label: string; // Friendly display name (usually user's name)
    note?: string; // Admin note
    enabled: boolean; // Soft enable/disable without deleting the entry

    storageLimitBytes: number; // Quota in bytes (default 500 MB)

    grantedBy: string; // Admin user ID who created this entry
    grantedAt: Date;

    lastActivity?: Date; // Set when the user uploads or deletes a file
    fileCount: number; // Cached count of active vault documents
    usedBytes: number; // Cached total of active file sizes
}

const VaultAccessSchema = new Schema<IVaultAccess>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        label: { type: String, required: true, trim: true },
        note: { type: String, trim: true },
        enabled: { type: Boolean, default: true, index: true },
        storageLimitBytes: {
            type: Number,
            default: DEFAULT_LIMIT_BYTES,
            min: 0
        },
        grantedBy: { type: String, required: true, trim: true },
        grantedAt: { type: Date, default: Date.now },
        lastActivity: { type: Date },
        fileCount: { type: Number, default: 0, min: 0 },
        usedBytes: { type: Number, default: 0, min: 0 }
    },
    { timestamps: true }
);

export const VaultAccess =
    mongoose.models.VaultAccess || mongoose.model<IVaultAccess>("VaultAccess", VaultAccessSchema);
