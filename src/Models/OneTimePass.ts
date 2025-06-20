import mongoose from "mongoose";
import { v4 } from "uuid";

export enum OTPs {
    // ? Used to Verify Emails
    Email = "email",

    // ? Used to Verify Phone Numbers
    Phone = "phone",

    // ? Used to Forgot Passwords
    PasswordReset = "password_reset"
}

const OTP_Schema: mongoose.Schema = new mongoose.Schema(
    {
        OtpID: {
            type: String,
            default: v4,
            unique: true,
            required: true
        },
        Type: {
            type: String,
            enum: [OTPs.Email, OTPs.Phone, OTPs.PasswordReset],
            required: true,
            index: true
        },
        UserID: {
            type: String,
            required: true,
            index: true
        },
        Data: {
            type: String,
            required: true
        },
        ExpiresAt: {
            type: Date,
            default: new Date(Date.now() + 15 * 60 * 1000)
        }
    },
    {
        timestamps: true,
        versionKey: "v1",

        // ? ByDefault Saved for 24 Hours to Lock Account as Anti-Brute Force
        expireAfterSeconds: 60 * 60 * 24
    }
);

export interface IOTP extends mongoose.Document {
    OtpID: string;
    Type: OTPs;
    UserID: string;
    Data: string;
    ExpiresAt: Date;
}

export const OTPs_Model: mongoose.Model<IOTP> =
    mongoose.models?.OTPs || mongoose.model<IOTP>("OTPs", OTP_Schema);
