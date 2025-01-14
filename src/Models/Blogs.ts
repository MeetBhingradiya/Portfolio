/**
 *  @FileID          Models\Blogs.ts
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
