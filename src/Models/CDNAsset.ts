/**
 * CDN Asset Model
 * Tracks every file stored in the private GitHub repository used as CDN storage.
 * Each document represents one uploaded file with its GitHub location, SHA, and status.
 */
import mongoose, { Schema, Document } from "mongoose";

export type AssetType = "icon" | "avatar" | "banner" | "background" | "video" | "document" | "other";
export type AssetStatus = "active" | "missing" | "deleted";

export interface ICDNAsset extends Document {
    assetId: string; // Unique nanoid — used in CDN URLs  /api/cdn/<assetId>
    filename: string; // Original file name (e.g. "profile.png")
    githubRepo: string; // Which repo holds this file (e.g. "PrivateCloud-1")
    githubPath: string; // Path inside repo (e.g. "uploads/avatars/abc123.png")
    sha: string; // GitHub blob SHA — required for updates/deletions
    checksumMd5: string; // MD5 hex of raw file bytes (fast, for dedup)
    checksumSha256: string; // SHA-256 hex of raw file bytes (strong integrity)
    mimeType: string; // MIME type detected at upload
    size: number; // File size in bytes
    type: AssetType; // Categorisation for admin filtering
    tags: string[]; // Free-form tags for searching
    context?: string; // Owning entity e.g. "user:abc", "project:xyz", "company:Google"
    uploadedBy: string; // User ID or "system"
    status: AssetStatus; // Updated by integrity checks
    lastChecked?: Date; // Last time GitHub confirmed the file exists
    lastCheckOk?: boolean; // Result of the last integrity check
    checksumVerified?: boolean; // Whether last check confirmed checksum still matches
    createdAt: Date;
    updatedAt: Date;
    altText?: string; // Accessibility description
}

const CDNAssetSchema = new Schema<ICDNAsset>(
    {
        assetId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        filename: { type: String, required: true, trim: true },
        githubRepo: { type: String, required: true, trim: true, index: true },
        githubPath: { type: String, required: true, trim: true },
        sha: { type: String, required: true, trim: true },
        checksumMd5: { type: String, required: true, trim: true, index: true },
        checksumSha256: { type: String, required: true, trim: true },
        mimeType: { type: String, required: true, trim: true },
        size: { type: Number, required: true, min: 0 },
        type: {
            type: String,
            enum: ["icon", "avatar", "banner", "background", "video", "document", "other"],
            default: "other"
        },
        tags: { type: [String], default: [] },
        context: { type: String, trim: true, index: true, sparse: true },
        uploadedBy: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ["active", "missing", "deleted"],
            default: "active",
            index: true
        },
        lastChecked: { type: Date },
        lastCheckOk: { type: Boolean },
        checksumVerified: { type: Boolean },
        altText: { type: String, trim: true }
    },
    { timestamps: true }
);

// Text index for search across filename, tags, altText
CDNAssetSchema.index({ filename: "text", tags: "text", altText: "text" });
// Each (repo, path) pair is unique — same path may exist in different repos (they won't, but enforced at repo level)
CDNAssetSchema.index({ githubRepo: 1, githubPath: 1 }, { unique: true });
// Compound index for type + status + repo queries (admin filters)
CDNAssetSchema.index({ type: 1, status: 1 });
CDNAssetSchema.index({ githubRepo: 1, status: 1 });

export const CDNAsset = mongoose.models.CDNAsset || mongoose.model<ICDNAsset>("CDNAsset", CDNAssetSchema);
