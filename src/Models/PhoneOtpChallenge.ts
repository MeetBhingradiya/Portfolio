/**
 * Phone OTP Challenge Model
 * Temporary OTP records for phone number verification.
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IPhoneOtpChallenge extends Document {
    userId: string;
    phoneNumber: string;
    otpHash: string;
    attempts: number;
    consumed: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PhoneOtpChallengeSchema = new Schema<IPhoneOtpChallenge>(
    {
        userId: { type: String, required: true, index: true },
        phoneNumber: { type: String, required: true, index: true },
        otpHash: { type: String, required: true },
        attempts: { type: Number, default: 0 },
        consumed: { type: Boolean, default: false, index: true },
        expiresAt: { type: Date, required: true, index: true },
    },
    { timestamps: true }
);

PhoneOtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PhoneOtpChallengeSchema.index({ userId: 1, phoneNumber: 1, consumed: 1, createdAt: -1 });

export const PhoneOtpChallenge =
    (mongoose.models.PhoneOtpChallenge as mongoose.Model<IPhoneOtpChallenge>) ||
    mongoose.model<IPhoneOtpChallenge>("PhoneOtpChallenge", PhoneOtpChallengeSchema);
