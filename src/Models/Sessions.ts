/**
 *  @FileID          Models\Sessions.ts
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
import { v4 } from 'uuid';

const Session_Schema: Schema = new Schema({
    SessionID: {
        type: String,
        default: v4,
        unique: true
    },
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface ISessions extends Document {
    SessionID: string;
    IPv4: string
    IPv6: string
    NativeIP: string
    IPProvider: string
    UserAgent: string
    Extensions: string[]
    OS: "Windows" | "Mac" | "Linux" | "Android" | "iOS" | "Huawei"
    Browser?: "Chrome" | "Edge"
    JWTTokenHash: string
    JWTTokenSalt: string
}

export default model<ISessions>('Sessions', Session_Schema);