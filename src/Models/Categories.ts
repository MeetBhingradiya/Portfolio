/**
 *  @FileID          Models\Categories.ts
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
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.9
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 30/01/25 8:47 PM IST (Kolkata +5:30 UTC)
 */


import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Categorie_Schema: mongoose.Schema = new mongoose.Schema({
    CategorieID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    Title: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    AuthorID: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface ICategorie extends mongoose.Document {
    CategorieID: string;
    Title: string;
    Description: string;
    AuthorID: string;
}

export const Categories_Model: mongoose.Model<ICategorie> = mongoose.models?.Categories || mongoose.model<ICategorie>("Categories", Categorie_Schema);