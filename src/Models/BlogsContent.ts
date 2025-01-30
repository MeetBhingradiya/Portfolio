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

import mongoose from 'mongoose';
import { v4 } from 'uuid';

const BlogsContents_Schema: mongoose.Schema = new mongoose.Schema({
    ContentID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    Data: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IBlogsContents extends mongoose.Document {
    ContentID: string;
    Data: string;
}

export const BlogsContents_Model: mongoose.Model<IBlogsContents> = mongoose.models?.BlogsContents || mongoose.model<IBlogsContents>("BlogsContents", BlogsContents_Schema);