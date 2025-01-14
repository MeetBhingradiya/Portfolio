/**
 *  @FileID          Models\Bookmarks.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Bookmarks_Schema: mongoose.Schema = new mongoose.Schema({
    BookmarkID: {
        type: String,
        default: v4,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    icon: {
        type: String,
    },
    isSVGSrc: {
        type: Boolean,
        default: false
    },
    SVGStyles: {
        fill: {
            type: String,
        }
    },
    description: {
        type: String,
    },
    keywords: {
        type: [String],
    },
    size: {
        type: String,
        enum: ["128", "64", "32", "16"],
        default: "128"
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IBookmark extends mongoose.Document {
    // ? Unique identifier for the bookmark
    BookmarkID: string

    // ? Site Name if given by the user otherwise fetched from Site URL
    name: string

    // ? Site URL
    url: string

    // ? Site Icon
    icon?: string

    // ? Site Icon as SVG
    isSVGSrc?: boolean
    SVGStyles?: {
        fill?: string
    }

    // ? Site Description if given by the user or fetched from meta tags of the site
    description?: string

    // ? Site Keywords if given by the user or fetched from meta tags of the site
    keywords?: Array<string>

    // ? Defualt Icon Size
    size?: "128" | "64" | "32" | "16"

    isPublished: boolean

    isDeleted: boolean
}

export const Bookmarks_Model: mongoose.Model<IBookmark> = mongoose.models?.Bookmarks || mongoose.model<IBookmark>("Bookmarks", Bookmarks_Schema);