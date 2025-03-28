/**
 *  @FileID          Models/Bookmarks.ts
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
import { ILinkOpenTypes } from '@App/Tools/Settings/Types';

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
    URL: {
        type: String,
        required: true
    },
    Android: {
        type: String,
    },
    Windows: {
        type: String,
    },
    Description: {
        type: String,
    },
    Keywords: {
        type: [String],
    },
    Icon: {
        type: String,
    },
    isSVG: {
        type: Boolean,
        default: false
    },
    SVGStyles: {
        type: Object,
        default: {
            fill: "#000000"
        }
    },
    ClientOptions: {
        type: Object,
        default: {
            OpenLinkPlatformPriority: "web",
            OpenLinkMethod: ILinkOpenTypes.NEW_TAB,
            isSearchVisible: true
        }
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isServer: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: "v2"
});

export interface IBookmark extends mongoose.Document {
    BookmarkID: string
    Name: string
    URL: string
    Android: string
    Windows: string
    Description: string
    Keywords: string[]
    Icon: string
    isSVG: boolean
    SVGStyles: {
        fill: string
    }
    ClientOptions: {
        OpenLinkPlatformPriority: "desktop" | "mobile" | "web"
        OpenLinkMethod: ILinkOpenTypes
        isSearchVisible: boolean
    }
    isPublished: boolean
    isDeleted: boolean
    isServer: boolean
}

export { ILinkOpenTypes }
export const Bookmarks_Model: mongoose.Model<IBookmark> = mongoose.models?.Bookmarks || mongoose.model<IBookmark>("Bookmarks", Bookmarks_Schema);