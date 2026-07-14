/**
 * HardwareUnlockDevice Model
 * Stores paired mobile devices for hardware unlock functionality.
 * 
 * One user can have multiple devices (phone, tablet backup).
 * Each device has its own public key for signing challenges.
 */

import mongoose from "mongoose";

export enum DeviceType {
    PHONE = "phone",
    TABLET = "tablet",
    SMARTWATCH = "smartwatch"
}

export enum DevicePlatform {
    ANDROID = "android",
    IOS = "ios"
}

export interface IHardwareUnlockDevice extends mongoose.Document {
    userId: string; // Reference to user
    deviceId: string; // Unique device identifier (UUID generated at first pairing)
    deviceName: string; // User-friendly name (e.g., "My iPhone 14")
    deviceType: DeviceType;
    platform: DevicePlatform;
    platformVersion: string; // e.g., "14.0"
    appVersion: string; // e.g., "1.0.0"
    
    // Cryptographic keys
    publicKeyEd25519: string; // Base64-encoded public key for signature verification
    publicKeyEncryption?: string; // Optional: for encrypted challenges
    
    // Device identification
    deviceUUID: string; // Unique hardware identifier (ANDROID_ID or UUID.identifierForVendor)
    appSignature?: string; // App signing certificate fingerprint
    
    // Trust & Security
    trustedAt: Date; // When device was paired
    lastUnlockAt?: Date; // Last successful unlock approval
    isActive: boolean; // Can be revoked
    revokedAt?: Date; // If revoked
    revokationReason?: string;
    
    // Metadata
    fcmToken?: string; // Firebase Cloud Messaging token for push notifications
    bluetoothAddress?: string; // MAC address if using BLE
    ipAddress?: string; // Last known IP
    
    // Security logs
    failedChallenges: number; // Counter for failed unlock attempts
    lastFailedAt?: Date;
    
    createdAt: Date;
    updatedAt: Date;
}

const HardwareUnlockDeviceSchema = new mongoose.Schema<IHardwareUnlockDevice>(
    {
        userId: { type: String, required: true, index: true },
        deviceId: { type: String, required: true, unique: true },
        deviceName: { type: String, required: true },
        deviceType: {
            type: String,
            enum: Object.values(DeviceType),
            default: DeviceType.PHONE
        },
        platform: {
            type: String,
            enum: Object.values(DevicePlatform),
            required: true
        },
        platformVersion: { type: String, required: true },
        appVersion: { type: String, required: true },
        
        publicKeyEd25519: { type: String, required: true },
        publicKeyEncryption: { type: String },
        
        deviceUUID: { type: String, required: true, unique: true },
        appSignature: { type: String },
        
        trustedAt: { type: Date, default: () => new Date() },
        lastUnlockAt: { type: Date },
        isActive: { type: Boolean, default: true },
        revokedAt: { type: Date },
        revokationReason: { type: String },
        
        fcmToken: { type: String },
        bluetoothAddress: { type: String },
        ipAddress: { type: String },
        
        failedChallenges: { type: Number, default: 0 },
        lastFailedAt: { type: Date },
        
        createdAt: { type: Date, default: () => new Date() },
        updatedAt: { type: Date, default: () => new Date() }
    },
    { timestamps: true }
);

// Compound index for user's active devices
HardwareUnlockDeviceSchema.index({ userId: 1, isActive: 1 });

export const HardwareUnlockDevice =
    mongoose.models.HardwareUnlockDevice ||
    mongoose.model<IHardwareUnlockDevice>("HardwareUnlockDevice", HardwareUnlockDeviceSchema);
