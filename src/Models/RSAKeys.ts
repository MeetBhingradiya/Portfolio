/**
 *  @FileID          Models/RSAKeys.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


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