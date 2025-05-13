/**
 *  @FileID          Models/BlogsContent.ts
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
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
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