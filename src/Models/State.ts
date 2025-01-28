/**
 *  @FileID          Models\State.ts
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


import { Schema, Document, model } from 'mongoose';

const StateSchema: Schema = new Schema({
    StateID: {
        type: String,
        required: true,
        unique: true,
        enum: [
            "Site@Active#State"
        ]
    },
    Maintenance: {
        Global: {
            type: Boolean,
            default: false
        },
        Partial: {
            type: Boolean,
            default: false
        },
        Endpoints: {
            type: Array<String>,
            default: []
        },
        Message: {
            type: String,
            default: ""
        }
    },
    CommingSoon: {
        Global: {
            type: Boolean,
            default: false
        },
        Partial: {
            type: Boolean,
            default: false
        },
        Endpoints: {
            type: Array<String>,
            default: []
        },
        Message: {
            type: String,
            default: ""
        }
    },
    Homepage: {
        Links: {
            type: Array<{
                Title: string
                URL: string
                Icon?: string
                isShown: boolean
            }>,
            default: []
        }
    },
    Authentication: {
        CookieDuration: {
            type: Number,
            // ? 7 days
            default: 604800
        },
        MaxUserProfiles: {
            type: Number,
            default: 5
        },
        saltRounds: {
            type: Number,
            default: 10
        },
        saltFormat: {
            type: String,
            default: "#SALT@TOKEN#SALT"
        },
        AllowSignup: {
            type: Boolean,
            default: true
        },
        AllowLogin: {
            type: Boolean,
            default: true
        }
    },
    Notifications: {
        type: Array<{
            icon?: string,
            description?: string,
            message: string,
            type: "error" | "warning" | "info" | "success"
            visibleAt: Date
            VisibleTill?: Date
        }>,
        default: []
    }
}, {
    timestamps: true,
    versionKey: true
});

export interface IState extends Document {
    StateID: string
    Maintenance?: {
        Global?: boolean
        Partial?: boolean
        Endpoints?: Array<string>
        Message?: string
    }
    CommingSoon?: {
        Global?: boolean
        Partial?: boolean
        Endpoints?: Array<string>
        Message?: string
    }
    Homepage: {
        Links: Array<{
            Title: string
            URL: string
            Icon?: string
            isShown: boolean
        }>
    }
    Authentication: {
        CookieDuration: number
        MaxUserProfiles: number
        saltRounds: number
        saltFormat: string
        AllowSignup: boolean
        AllowLogin: boolean
    }
    Notifications: Array<{
        icon?: string
        description?: string
        message: string
        type: "error" | "warning" | "info" | "success"
        visibleAt: Date
        VisibleTill?: Date
    }>;
}

export default model<IState>('State', StateSchema);