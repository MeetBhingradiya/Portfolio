/**
 *  @FileID          Models\VerificationCodes.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last sUpdated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 22/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */


import mongoose from 'mongoose';
import { v4 } from 'uuid';

const VerificationCodes_Schema: mongoose.Schema = new mongoose.Schema({
    CodeID: {
        type: String,
        default: v4,
        unique: true
    },
    HashKey: {
        type: String,
        required: true
    },
    Salt: {
        type: String,
        required: true
    },
    Type: {
        type: String,
        enum: ["Email", "Phone"],
        required: true
    },
    Expiry: {
        type: Date,
        default: new Date(Date.now() + 15 * 60000)
    },
    UserID: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface IVerificationCodes extends mongoose.Document {
    CodeID: string
    HashKey: string
    Salt: string
    Type: "Email" | "Phone"
    Expiry: Date
    UserID: string
}

export const VerificationCodes_Model: mongoose.Model<IVerificationCodes> = mongoose.models?.VerificationCodes || mongoose.model<IVerificationCodes>("VerificationCodes", VerificationCodes_Schema);