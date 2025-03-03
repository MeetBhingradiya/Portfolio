/**
 *  @FileID          Models\OneTimePass.ts
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
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
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
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


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