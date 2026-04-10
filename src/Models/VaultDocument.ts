/**
 * VaultDocument Model
 * Stores metadata for every file uploaded to the Private Vault.
 * Actual file bytes live in the GitHub CDN; only metadata is persisted here.
 * Large files are split into chunks, each with its own CDN asset ID.
 */
import mongoose, { Schema, Document } from "mongoose";

export type VaultFileType = "pdf" | "document" | "presentation" | "image" | "video" | "other";
export type VaultShareLinkStatus = "active" | "revoked" | "deleted";

export interface IVaultChunk {
    chunkIndex: number;
    assetId: string; // CDNAsset.assetId reference
    githubRepo: string;
    githubPath: string;
    sha: string;
    size: number;
}

export interface IVaultShareLink {
    linkId: string;
    token: string;
    status: VaultShareLinkStatus;
    expiresAt?: Date;
    createdBy: string;
    createdAt: Date;
    lastUsedAt?: Date;
    revokedAt?: Date;
    deletedAt?: Date;
}

export interface IVaultDocument extends Document {
    docId: string; // Unique slug used in URLs and API
    userId: string; // Better Auth user ID (owner)
    filename: string; // User-editable display name
    originalName: string; // File name at upload time
    mimeType: string;
    size: number; // Total unencrypted file size in bytes
    type: VaultFileType;

    // GitHub CDN storage (single-chunk files use the first array entry)
    chunks: IVaultChunk[];
    isChunked: boolean; // true when file was split (> 49 MB per chunk)

    // Sharing (new)
    shareLinks: IVaultShareLink[];
    // Legacy sharing fields retained for backward compatibility with existing records
    shareToken?: string; // deprecated
    shareExpires?: Date; // deprecated
    isShared: boolean; // deprecated

    // Organisation
    tags: string[];
    description?: string;

    // Status
    status: "active" | "deleted";

    createdAt: Date;
    updatedAt: Date;
}

const VaultChunkSchema = new Schema<IVaultChunk>(
    {
        chunkIndex: { type: Number, required: true },
        assetId: { type: String, required: true, trim: true },
        githubRepo: { type: String, required: true, trim: true },
        githubPath: { type: String, required: true, trim: true },
        sha: { type: String, required: true, trim: true },
        size: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const VaultShareLinkSchema = new Schema<IVaultShareLink>(
    {
        linkId: { type: String, required: true, trim: true },
        token: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ["active", "revoked", "deleted"],
            default: "active",
            index: true
        },
        expiresAt: { type: Date },
        createdBy: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date },
        revokedAt: { type: Date },
        deletedAt: { type: Date }
    },
    { _id: false }
);

const VaultDocumentSchema = new Schema<IVaultDocument>(
    {
        docId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        userId: {
            type: String,
            required: true,
            index: true,
            trim: true
        },
        filename: { type: String, required: true, trim: true, maxlength: 255 },
        originalName: { type: String, required: true, trim: true },
        mimeType: { type: String, required: true, trim: true },
        size: { type: Number, required: true, min: 0 },
        type: {
            type: String,
            enum: ["pdf", "document", "presentation", "image", "video", "other"],
            default: "other",
            index: true
        },

        chunks: { type: [VaultChunkSchema], default: [] },
        isChunked: { type: Boolean, default: false },

        shareLinks: { type: [VaultShareLinkSchema], default: [] },
        shareToken: { type: String, trim: true, sparse: true, index: true },
        shareExpires: { type: Date },
        isShared: { type: Boolean, default: false, index: true },

        tags: { type: [String], default: [] },
        description: { type: String, trim: true, maxlength: 1000 },

        status: {
            type: String,
            enum: ["active", "deleted"],
            default: "active",
            index: true
        }
    },
    { timestamps: true }
);

VaultDocumentSchema.index({ userId: 1, status: 1 });
VaultDocumentSchema.index({ userId: 1, type: 1, status: 1 });
VaultDocumentSchema.index({ "shareLinks.token": 1 }, { sparse: true });
VaultDocumentSchema.index({ filename: "text", tags: "text", description: "text" });

export const VaultDocument =
    mongoose.models.VaultDocument || mongoose.model<IVaultDocument>("VaultDocument", VaultDocumentSchema);
