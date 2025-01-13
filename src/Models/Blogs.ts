/**
 *  @file        Models\Blogs.ts
 *  @description No description available for Models\Blogs.ts.
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
