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

export function OTP_Generate({
    Length = 6,
    Digits = true,
    Uppercase = false,
    Lowercase = false,
    Special = false,
    UUIDChars = 0,
    ExcludeSpecialChars = [],
    IncludeSpecialChars = [],
    IncludeSpecialCharsOnly = false,
    ExcludeSpecialCharsOnly = false
}: {
    Length?: number,
    Digits?: boolean,
    Uppercase?: boolean,
    Lowercase?: boolean,
    Special?: boolean,
    UUIDChars?: number,
    ExcludeSpecialChars?: string[],
    IncludeSpecialChars?: string[],
    IncludeSpecialCharsOnly?: boolean,
    ExcludeSpecialCharsOnly?: boolean
}) {
    let Characters = '';

    if (IncludeSpecialCharsOnly) {
        // If only special characters should be included, ignore other character types
        Characters = IncludeSpecialChars.length ? IncludeSpecialChars.join('') : '!@#$%^&*()_+-=[]{}|;:,.<>?';
    } else {
        if (Digits) Characters += '0123456789';
        if (Uppercase) Characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (Lowercase) Characters += 'abcdefghijklmnopqrstuvwxyz';
        if (Special) {
            let specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            
            // If ExcludeSpecialChars is set, remove them
            if (ExcludeSpecialChars.length) {
                specialChars = specialChars.split('').filter(char => !ExcludeSpecialChars.includes(char)).join('');
            }
            
            // If IncludeSpecialChars is set, use only the specified characters
            if (IncludeSpecialChars.length) {
                specialChars = IncludeSpecialChars.join('');
            }

            Characters += specialChars;
        }
    }

    // If only excluded special characters should be removed, reset characters to exclude them only
    if (ExcludeSpecialCharsOnly) {
        Characters = Characters.split('').filter(char => !ExcludeSpecialChars.includes(char)).join('');
    }

    let OTP = '';

    // Generate UUID-based characters if requested
    if (UUIDChars > 0) {
        const uuid = v4().replace(/-/g, '');
        for (let i = 0; i < UUIDChars; i++) {
            OTP += uuid.charAt(Math.floor(Math.random() * uuid.length));
        }
        Length -= UUIDChars;
    }

    // Generate OTP with filtered characters
    for (let i = 0; i < Length; i++) {
        OTP += Characters.charAt(Math.floor(Math.random() * Characters.length));
    }

    return OTP;
}