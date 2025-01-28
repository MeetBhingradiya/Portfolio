/**
 *  @FileID          Models\Blogs.ts
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
import mongoosePaginate from 'mongoose-paginate-v2';
import { v4 } from 'uuid';

const BlogSchema: Schema = new Schema({
    UserID: {
        type: String,
        required: true
    },
    BannerImage: {
        type: String,
    },
    BlogID: {
        type: String,
        default: v4,
        unique: true
    },
    Content: {
        type: String
    },
    CreateDate: {
        type: Date
    },
    Description: {
        type: String
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    PublishDate: {
        type: Date
    },
    Tags: [
        {
            type: String
        }
    ],
    Title: {
        type: String,
        unique: true
    },
    UpdateDate: {
        type: Date
    },
    Visiblity: {
        type: String,
        default: 'public',
        enum: [
            'public', 
            'private', 
            'unlisted'
        ],
    },
});

export interface IBlog extends Document {
    Author?: string;
    BannerImage?: string;
    BlogID: string;
    Content?: string;
    CreateDate?: Date;
    Description?: string;
    isPublished?: boolean;
    PublishDate?: Date;
    Tags?: string[];
    Title?: string;
    UpdateDate?: Date;
    Visiblity?: string;
}

BlogSchema.index({ BlogID: 1 });
BlogSchema.plugin(mongoosePaginate);

export default model<IBlog>('Blog', BlogSchema);
