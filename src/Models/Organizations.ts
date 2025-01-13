/**
 *  @file        Models\Organizations.ts
 *  @description No description available for Models\Organizations.ts.
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
import { Organization_Roles } from '@Types/Organization';

const Organizations_Schema: Schema = new Schema({
    OrganizationID: {
        type: String,
        default: v4,
        unique: true
    },
    Members: {
        type: [{
            UserID: {
                type: String,
                required: true
            },
            Role: {
                type: String,
                required: true,
                enum: Object.values(Organization_Roles)
            }
        }],
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
    icon: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface IOrganization extends Document {
    OrganizationID: string
    Members: Array<{
        UserID: string
        Role: Organization_Roles
    }>

    // ? ORG Details
    Name: string
    Description: string
    icon: string
}

export default model<IOrganization>('Organizations', Organizations_Schema);