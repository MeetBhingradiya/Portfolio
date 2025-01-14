/**
 *  @FileID          Models\VerificationCodes.ts
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

const VerificationCodes_Schema: Schema = new Schema({
    CodeID: {
        type: String,
        default: v4,
        unique: true
    },
    HashKey: {
        type: String,
        required: true
    },
    Salt: {
        type: String,
        required: true
    },
    UserID: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true,
    expires: 600,
    _id: false
});

export interface IVerificationCodes extends Document {
    CodeID: string;
    HashKey: string;
    Salt: string;
    UserID: string;
}

export default model<IVerificationCodes>('VerificationCodes', VerificationCodes_Schema);