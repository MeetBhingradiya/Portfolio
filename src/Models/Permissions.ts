/**
 *  @FileID          Models\Permissions.ts
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

const Permissions_Schema: Schema = new Schema({
    PermissionsID: {
        type: String,
        default: v4,
        unique: true
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    ACCESS_CONSTANT: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true
});

export interface IPermissions extends Document {
    PermissionsID: string
    Name: string
    Description: string
    ACCESS_CONSTANT: string
}

export default model<IPermissions>('Permissions', Permissions_Schema);