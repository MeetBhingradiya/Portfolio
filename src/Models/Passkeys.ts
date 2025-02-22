/**
 *  @FileID          Models\Passkeys.ts
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
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.9
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 */


import mongoose from 'mongoose';
import { v4 } from 'uuid';

type AuthenticatorTransportFuture = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb'

const Passkeys_Schema: mongoose.Schema = new mongoose.Schema({
    PasskeyID: {
        type: String,
        default: v4,
        unique: true
    },
    UserID: {
        type: String,
        required: true
    },
    Challenge: {
        type: String,
        required: true
    },
    PublicKey: {
        type: String
    },
    Transports: {
        type: [String],
        enum: ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']
    },
    Name: {
        type: String
    },
    LastUsed: {
        type: Date
    },
    CreatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IPasskey extends mongoose.Document {

    // ? Identification of Passkey
    PasskeyID: string

    // ? Owner of Passkey
    UserID: string

    // ? Challenge Data
    Challenge: string

    // ? Passkey Data
    PublicKey: string // ? Base64 Encoded
    Transports: AuthenticatorTransportFuture[]

    // ? User Defined Data
    Name?: string

    LastUsed?: Date
    CreatedAt?: Date
}

export const Passkeys_Model: mongoose.Model<IPasskey> = mongoose.models?.Passkeys || mongoose.model<IPasskey>("Passkeys", Passkeys_Schema);