/**
 * PairingToken Model
 * One-time tokens used to pair a mobile device with the account.
 * 
 * Flow:
 * 1. User requests pairing in mobile app
 * 2. System generates QR code with pairing token + endpoint
 * 3. Mobile app scans QR, exchanges token for public key confirmation
 * 4. Token is consumed (cannot be reused)
 */

import mongoose from "mongoose";

export enum PairingTokenStatus {
    ACTIVE = "active",
    USED = "used",
    EXPIRED = "expired",
    REVOKED = "revoked"
}

export interface IPairingToken extends mongoose.Document {
    token: string; // Random 64-char hex string (256 bits)
    userId: string; // Who initiated pairing
    
    // QR Code & Communication
    qrData: string; // JSON string containing token + endpoint + userId
    
    // Token metadata
    status: PairingTokenStatus;
    createdAt: Date;
    expiresAt: Date; // Default 10 minutes
    usedAt?: Date;
    
    // Device exchange
    claimedDeviceId?: string; // Which device ID claimed this token
    claimedPublicKey?: string; // Device's public key on claim
    
    updatedAt: Date;
}

const PairingTokenSchema = new mongoose.Schema<IPairingToken>(
    {
        token: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        
        qrData: { type: String, required: true },
        
        status: {
            type: String,
            enum: Object.values(PairingTokenStatus),
            default: PairingTokenStatus.ACTIVE,
            index: true
        },
        createdAt: { type: Date, default: () => new Date(), index: true },
        expiresAt: { type: Date, required: true, index: true },
        usedAt: { type: Date },
        
        claimedDeviceId: { type: String },
        claimedPublicKey: { type: String },
        
        updatedAt: { type: Date, default: () => new Date() }
    },
    { timestamps: true }
);

// TTL index for automatic cleanup after 20 minutes
PairingTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 1200 });

// Compound index for finding active tokens
PairingTokenSchema.index({ userId: 1, status: 1 });

export const PairingToken =
    mongoose.models.PairingToken ||
    mongoose.model<IPairingToken>("PairingToken", PairingTokenSchema);
