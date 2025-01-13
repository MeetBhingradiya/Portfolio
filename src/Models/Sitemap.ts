/**
 *  @file        Models\Sitemap.ts
 *  @description No description available for Models\Sitemap.ts.
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

 *    @file        Sitemap.ts
 *    @description No description available for Sitemap.ts.
 *    @author      Meet Bhingradiya
 *    @license     Licensed to Meet Bhingradiya
 *    
 *    -----------------------------------------------------------------------------
 *    Copyright (c) 2025 Meet Bhingradiya
 *    All rights reserved.
 *    
 *    This file is part of the SitemapUtils project and is protected under copyright
 *    law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *    without explicit permission from the author.
 *    
 *    
 *    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *    FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *    THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *    FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *    DEALINGS IN THE SOFTWARE.
 *    -----------------------------------------------------------------------------
 *    @created     1/13/2025
 *    @modified    1/13/2025
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