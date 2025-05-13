/**
 *  @FileID          Models/Sessions.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Sessions_Schema: mongoose.Schema = new mongoose.Schema({
    SessionID: {
        type: String,
        default: v4,
        unique: true
    },
    UserID: {
        type: String,
        required: true,
        index: true
    },
    LocalStorage_RSAKeyID: {
        type: String,
        required: true
    },
    Cookie_RSAKeyID: {
        type: String,
        required: true
    },
    AccessToken: {
        type: String,
        required: true
    },
    UserAgent: {
        type: String,
        required: true
    },
    UnknownRequestHeaders: {
        type: [Object]
    },
    DetectedExtensions: {
        type: [String]
    },
    Platform: {
        type: String
    },
    Browser: {
        type: String
    },
    IPDataMappedResponse: {
        type: Object
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface ISessions extends Document {
    SessionID: string

    UserID: string

    // ? Linked Local Storage & Cookies Encryption

    // ? Used to Access Identiy on Local Storage or Cookie as Non Trackable Key
    LocalStorage_RSAKeyID: string
    Cookie_RSAKeyID: string
    AccessToken: string // ? Send Encrypted Using 2 Different RSA Keys (Local & Cookie)

    // ? NEW Properties
    UserAgent: string
    
    UnknownRequestHeaders: Array<{
        [key: string]: string
    }>
    
    DetectedExtensions: string[]
    Platform: "Windows" | "Linux" | "Android" | "iOS" | "MacOS"
    Browser: "Chrome" | "Edge" | "Safari" | "Firefox" | "Opera" | "Arc" | "Unknown"

    IPDataMappedResponse: {
        IP: string

        // ? Region
        City: string
        Region: string
        RegionCode: string
        Country: string
        CountryCode: string
        Flag: string

        // ? Provider
        Company: {
            Name: string
            Domain: string
            Type: string
            Network: string
        }

        // ? Timezone
        Timezone: {
            name: string
            abbreviation: string
            gmt_offset: number
            current_time: string
            is_daylight_saving: boolean
        }

        // ? Maplocation
        Latitude: number
        Longitude: number
    }
}

export const Sessions_Model: mongoose.Model<ISessions> = mongoose.models?.Sessions || mongoose.model<ISessions>("Sessions", Sessions_Schema);