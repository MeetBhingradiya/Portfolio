/**
 *  @file        Models\VerificationCodes.ts
 *  @description No description available for Models\VerificationCodes.ts.
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