import mongoose from 'mongoose';
import { v4 } from 'uuid';

export enum RSAKeyPermissions {
    PaymentWebhooks = "payment", // ? By the Server | Expiry: 1 Transaction

    Local = "localstorage", // ? By the Browser | Expiry: 7 Days
    Cookies = "cookies", // ? By the Server | Expiry: 7 Days
    
    LoginAPI = "login", // ? By the Server | Expiry: 1 Day
    RegisterAPI = "register", // ? By the Server | Expiry: 1 Day
    OTPVerification = "otp", // ? By the Server | Expiry: 7 Days
}

const RSAKey_Schema: mongoose.Schema = new mongoose.Schema({
    KeyID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    Permissions: {
        type: [String],
        required: true,
        enum: Object.values(RSAKeyPermissions)
    },
    CreatedAt: {
        type: Date,
        default: Date.now
    },
    ExpiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Days
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IRSAKey extends mongoose.Document {
    KeyID: string;
    isRevoked: boolean;
    Permissions: RSAKeyPermissions[];
    CreatedAt: Date;
    ExpiresAt: Date;
}

export const RSAKeys_Model: mongoose.Model<IRSAKey> = mongoose.models?.RSAKeys || mongoose.model<IRSAKey>("RSAKeys", RSAKey_Schema);