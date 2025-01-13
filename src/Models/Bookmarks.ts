/**
 *  @file        Models\Bookmarks.ts
 *  @description No description available for Models\Bookmarks.ts.
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