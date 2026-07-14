/**
 * HardwareUnlockChallenge Model
 * Stores unlock challenges issued by Windows client, approved/denied by mobile device.
 * 
 * Workflow:
 * 1. Windows client sends unlock request → challenge created in "pending" state
 * 2. Challenge pushed to mobile via FCM/WebSocket
 * 3. User approves with biometric + device signature
 * 4. Windows client polls or receives confirmation
 * 5. Challenge expires after 5 minutes or moved to approved/denied
 */

import mongoose from "mongoose";

export enum ChallengeStatus {
    PENDING = "pending",
    APPROVED = "approved",
    DENIED = "denied",
    EXPIRED = "expired",
    REVOKED = "revoked"
}

export interface IChallengeApproval {
    deviceId: string;
    devicePublicKey: string;
    signature: string; // Ed25519 signature of challenge nonce
    biometricType?: "fingerprint" | "face" | "iris"; // Which biometric was used
    approvedAt: Date;
    userApprovalText?: string; // e.g., "Approve Windows Unlock"
}

export interface IHardwareUnlockChallenge extends mongoose.Document {
    challengeId: string; // UUID for challenge tracking
    userId: string; // Reference to user making unlock request
    
    // Challenge content
    nonce: string; // Random bytes (32), base64-encoded
    challengePayload: {
        action: "windows_unlock" | "auth_approve" | "payment_confirm"; // Type of action
        timestamp: number; // Unix timestamp
        clientInfo?: {
            osVersion: string; // e.g., "Windows 11 23H2"
            deviceName: string;
            ipAddress: string;
            userAgent?: string;
        };
    };
    
    // Device targeting
    targetDeviceId: string; // Which device must approve
    allowedDevices?: string[]; // Other devices that could approve (backup)
    
    // Status & Timing
    status: ChallengeStatus;
    createdAt: Date;
    expiresAt: Date; // Default 5 minutes
    approvedAt?: Date;
    deniedAt?: Date;
    expirationReason?: string;
    
    // Approval data
    approval?: IChallengeApproval;
    
    // Security tracking
    attemptCount: number;
    lastAttemptAt?: Date;
    
    // Blockchain/Compliance (optional)
    blockchainTxId?: string; // If approval is recorded on-chain
    
    updatedAt: Date;
}

const ChallengeApprovalSchema = new mongoose.Schema(
    {
        deviceId: { type: String, required: true },
        devicePublicKey: { type: String, required: true },
        signature: { type: String, required: true },
        biometricType: { type: String, enum: ["fingerprint", "face", "iris"] },
        approvedAt: { type: Date, default: () => new Date() },
        userApprovalText: { type: String }
    },
    { _id: false }
);

const ChallengePayloadSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            enum: ["windows_unlock", "auth_approve", "payment_confirm"],
            required: true
        },
        timestamp: { type: Number, required: true },
        clientInfo: {
            osVersion: String,
            deviceName: String,
            ipAddress: String,
            userAgent: String
        }
    },
    { _id: false }
);

const HardwareUnlockChallengeSchema = new mongoose.Schema<IHardwareUnlockChallenge>(
    {
        challengeId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        
        nonce: { type: String, required: true },
        challengePayload: { type: ChallengePayloadSchema, required: true },
        
        targetDeviceId: { type: String, required: true },
        allowedDevices: [{ type: String }],
        
        status: {
            type: String,
            enum: Object.values(ChallengeStatus),
            default: ChallengeStatus.PENDING,
            index: true
        },
        createdAt: { type: Date, default: () => new Date(), index: true },
        expiresAt: { type: Date, required: true },
        approvedAt: { type: Date },
        deniedAt: { type: Date },
        expirationReason: { type: String },
        
        approval: { type: ChallengeApprovalSchema },
        
        attemptCount: { type: Number, default: 0 },
        lastAttemptAt: { type: Date },
        
        blockchainTxId: { type: String },
        
        updatedAt: { type: Date, default: () => new Date() }
    },
    { timestamps: true }
);

// TTL index for automatic cleanup of expired challenges after 1 hour
HardwareUnlockChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

// Compound indexes for queries
HardwareUnlockChallengeSchema.index({ userId: 1, status: 1 });
HardwareUnlockChallengeSchema.index({ targetDeviceId: 1, status: 1 });

export const HardwareUnlockChallenge =
    mongoose.models.HardwareUnlockChallenge ||
    mongoose.model<IHardwareUnlockChallenge>("HardwareUnlockChallenge", HardwareUnlockChallengeSchema);
