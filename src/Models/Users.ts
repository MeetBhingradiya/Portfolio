/**
 *  @FileID          Models\Users.ts
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
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


import mongoose from 'mongoose';
import { v4 } from 'uuid';
import { IGender } from '@Types/Gender';

const User_Schema: mongoose.Schema = new mongoose.Schema({
    UserID: {
        type: String,
        default: v4,
        unique: true
    },
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IUser extends mongoose.Document {
    UserID: string
    Emails: Array<{
        Email: string
        isVerified: boolean
    }>

    PhoneNumbers: Array<{
        PhoneNumber: string
        isPrimary: boolean
        isVerified: boolean
    }>

    // ? Acsess Credentials
    Salt: string
    HashKey: string

    // ? Personal Information
    Username: string
    Icon: string
    FirstName: string
    LastName: string
    DateOfBirth: Date
    Gender: IGender
    CustomGender: string

    // ? Profile Permissions
    Permissions: Array<string>

    // ? Authentication Methods
    isMultiFactorAuthEnabled: boolean

    // ? Authenticator App
    AuthenticatorApp: {
        isEnabled: boolean
        Secret: string
    }

    // ? Passkey
    Passkey: {
        isEnabled: boolean
        Passkey: string
    }

    // ? Priority
    Priority: "Passkey" | "AuthenticatorApp" | "Phone"

    // ? Admins & Security
    isLocked: boolean
    isSuspended: boolean
    isDeleted: boolean
}

export const Users_Model: mongoose.Model<IUser> = mongoose.models?.Users || mongoose.model<IUser>("Users", User_Schema);