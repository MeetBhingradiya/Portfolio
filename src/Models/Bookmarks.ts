/**
 *  @FileID          Models/Bookmarks.ts
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 11/04/25 4:27 PM IST (Kolkata +5:30 UTC)
 */

import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Bookmarks_Schema: mongoose.Schema = new mongoose.Schema({
    BookmarkID: {
        type: String,
        default: v4,
        unique: true
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        default: ""
    },
    Keywords: {
        type: [String],
        default: []
    },
    WebLink: {
        type: String,
        required: true
    },
    Android: {
        type: String,
        default: ""
    },
    Windows: {
        type: String,
        default: ""
    },
    Priority: {
        type: String,
        default: "web"
    },
    Icon: {
        type: String,
        default: ""
    },
    isSVG: {
        type: Boolean,
        default: false
    },
    fillColor: {
        type: String,
        default: ""
    },
    CORSProxy: {
        type: Boolean,
        default: false
    },
    isSponsored: {
        type: Boolean,
        default: false
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isCloudSync: {
        type: Boolean,
        default: false
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isAdminOnly: {
        type: Boolean,
        default: false
    },
    isDeleteBlock: {
        type: Boolean,
        default: false
    },
    isEditBlock: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

export interface IBookmark extends mongoose.Document {
    BookmarkID: string
    Name: string
    Description?: string

    Keywords?: string[]

    WebLink: string
    Android?: string
    Windows?: string
    Priority?: "windows" | "android" | "web"

    Icon?: string
    isSVG?: boolean
    fillColor?: string
    CORSProxy?: boolean 

    isSponsored: boolean
    isPublished: boolean
    isCloudSync: boolean
    isDefault: boolean
    isAdminOnly: boolean

    isDeleteBlock: boolean
    isEditBlock: boolean
}

export const Bookmarks_Model: mongoose.Model<IBookmark> = mongoose.models?.Bookmarks || mongoose.model<IBookmark>("Bookmarks", Bookmarks_Schema);