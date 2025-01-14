/**
 *  @FileID          Models\Sitemap.ts
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

enum Frequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}

const Sitemap_Schema: mongoose.Schema = new mongoose.Schema({
    EndpointID: {
        type: String,
        default: v4,
        unique: true
    },
    Endpoint: {
        type: String,
        required: true
    },
    Priority: {
        type: Number,
        default: 0.5
    },
    Frequency: {
        type: String,
        enum: Object.values(Frequency),
        default: Frequency.WEEKLY
    },
    Enabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: "v1",
});

export interface ISitemap extends mongoose.Document {
    EndpointID: string
    Endpoint: string
    Priority: number
    Frequency: Frequency
    Enabled: boolean
}

export const Sitemap_Model: mongoose.Model<ISitemap> = mongoose.models?.Sitemap || mongoose.model<ISitemap>("Sitemap", Sitemap_Schema);