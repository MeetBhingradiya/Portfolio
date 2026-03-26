/**
 * UserPhone Model
 * Stores verified phone numbers linked to accounts with primary selection.
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IUserPhone extends Document {
    userId: string;
    phoneNumber: string;
    isPrimary: boolean;
    verified: boolean;
    verifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserPhoneSchema = new Schema<IUserPhone>(
    {
        userId: { type: String, required: true, index: true },
        phoneNumber: { type: String, required: true, index: true },
        isPrimary: { type: Boolean, default: false, index: true },
        verified: { type: Boolean, default: true },
        verifiedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

UserPhoneSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });

export const UserPhone =
    (mongoose.models.UserPhone as mongoose.Model<IUserPhone>) ||
    mongoose.model<IUserPhone>("UserPhone", UserPhoneSchema);
