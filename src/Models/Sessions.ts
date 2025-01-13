/**
 *  @file        Models\Sessions.ts
 *  @description No description available for Models\Sessions.ts.
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