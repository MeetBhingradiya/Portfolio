/**
 *  @FileID          Models\Organizations.ts
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
import { v4 } from 'uuid';
import { Organization_Roles } from '@Types/Organization';

const Organizations_Schema: Schema = new Schema({
    OrganizationID: {
        type: String,
        default: v4,
        unique: true
    },
    Members: {
        type: [{
            UserID: {
                type: String,
                required: true
            },
            Role: {
                type: String,
                required: true,
                enum: Object.values(Organization_Roles)
            }
        }],
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface IOrganization extends Document {
    OrganizationID: string
    Members: Array<{
        UserID: string
        Role: Organization_Roles
    }>

    // ? ORG Details
    Name: string
    Description: string
    icon: string
}

export default model<IOrganization>('Organizations', Organizations_Schema);