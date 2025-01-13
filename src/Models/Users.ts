/**
 *  @file        Models\Users.ts
 *  @description No description available for Models\Users.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
 */

import mongoose from 'mongoose';
import { v4 } from 'uuid';

enum IGender {
    FEMALE = "Female",
    MALE = "male",
    CUSTOM = "Custom",
    UNSPECIFIED = "Unspecified"
}

const User_Schema: mongoose.Schema = new mongoose.Schema({
    UserID: {
        type: String,
        default: v4,
        unique: true
    },
    Emails: {
        type: Array<{
            Email: string
            isVerified: boolean
            isPrimary: boolean
            isStudent: boolean
            isNominated: boolean
        }>,
        default: []
    },
    PhoneNumbers: {
        type: Array<{
            PhoneNumber: string
            isPrimary: boolean
            isVerified: boolean
        }>,
        default: []
    },
    Salt: {
        type: String,
        required: true
    },
    HashKey: {
        type: String,
        required: true
    },
    Username: {
        type: String,
    },
    Icon: {
        type: String,
        default: null
    },
    FirstName: {
        type: String,
        required: true
    },
    LastName: {
        type: String,
        required: true
    },
    DateOfBirth: {
        type: Date,
        required: true
    },
    Permissions: {
        type: Array<String>,
        default: []
    },
    isMultiFactorAuthEnabled: {
        type: Boolean,
        default: false
    },
    AuthenticatorApp: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        Secret: {
            type: String,
            default: null
        }
    },
    Passkey: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        Passkey: {
            type: String,
            default: null
        }
    },
    Priority: {
        type: Array<String>,
        enum: [
            "Passkey",
            "AuthenticatorApp",
            "Phone",
            "Email"
        ],
        default: [
            "Email",
            "Phone",
            "Passkey",
            "AuthenticatorApp",
        ]
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface IUser extends mongoose.Document {
    UserID: string;
    Emails: Array<{
        Email: string
        isVerified: boolean

        // ? Email Settings
        isPrimary: boolean
        isStudent: boolean
        isNominated: boolean
    }>
    PhoneNumbers: Array<{
        PhoneNumber: string
        isPrimary: boolean
        isVerified: boolean
    }>

    // ? Credentials
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