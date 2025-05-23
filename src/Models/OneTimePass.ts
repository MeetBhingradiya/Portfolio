import mongoose from 'mongoose';
import { v4 } from 'uuid';

export enum OTPs {
    Email = "email",
    SMS = "sms",
    Notification = "notification"
}

const OTP_Schema: mongoose.Schema = new mongoose.Schema({
    OtpID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    Type: {
        type: String,
        enum: [
            OTPs.Email,
            OTPs.SMS,
            OTPs.Notification
        ],
        required: true
    },
    Data: {
        type: String,
        required: true
    },
    ExpiresAt: {
        type: Date,
        default: new Date(Date.now() + 15 * 60 * 1000),
    }
}, {
    timestamps: true,
    versionKey: "v1",

    // ? ByDefault 15 Minutes
    // expireAfterSeconds: 15 * 60
});

export interface IOTP extends mongoose.Document {
    OtpID: string
    Type: OTPs
    Data: string
    ExpiresAt: Date
}

export const OTPs_Model: mongoose.Model<IOTP> = mongoose.models?.OTPs || mongoose.model<IOTP>("OTPs", OTP_Schema);