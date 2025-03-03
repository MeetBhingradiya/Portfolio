/**
 *  @FileID          Models\Pomodoros.ts
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
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
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
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Pomodoros_Schema: mongoose.Schema = new mongoose.Schema({
    PomodoroID: {
        type: String,
        default: v4,
        unique: true
    },
    UserID: {
        type: String,
        required: true
    },

    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },

    Start: {
        type: Date,
        required: true
    },
    End: {
        type: Date,
        required: true
    },

    isPaused: {
        type: Boolean,
        default: false
    },
    isEnded: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: "v2"
});

interface IPomodoro extends mongoose.Document {
    PomodoroID: string
    UserID: string
    
    Name: string
    Description: string
    
    Start: Date
    End: Date

    isPaused: boolean
    isEnded: boolean
    isArchived: boolean
    isDeleted: boolean
}

export const Pomodoros_Model: mongoose.Model<IPomodoro> = mongoose.models?.Pomodoros || mongoose.model<IPomodoro>("Pomodoros", Pomodoros_Schema);