/**
 *  @FileID          Controllers/Bookmarks.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 11/04/25 4:27 PM IST (Kolkata +5:30 UTC)
 */

import { Bookmarks_Model } from "@Models/Bookmarks";
import dbConnect from "@Utils/dbConnect";
import { v4 } from "uuid";
import { BookmarksDB } from "@Data/Tools";

// Get bookmarks with more flexible querying
async function Controller_GET_Bookmarks(options: {
    isAdmin?: boolean,
    excludeIds?: string[],
    showUnpublished?: boolean,
} = {}) {
    const { isAdmin = false, excludeIds = [], showUnpublished = false } = options;
    
    await dbConnect();
    
    // Base query - only admins or explicit request can see unpublished or deleted items
    const query: any = {};
    
    if (!isAdmin && !showUnpublished) {
        query.isPublished = true;
        query.isDeleted = false;
    }
    
    let Bookmarks = await Bookmarks_Model.find(query).lean().exec();

    if (!Bookmarks || Bookmarks.length === 0) {
        // Initialize with default bookmarks
        const defaultBookmarks = [];
        
        for (const data of BookmarksDB) {
            const docid: string = v4();
            const newBookmark = new Bookmarks_Model({
                BookmarkID: docid,
                Name: data.Name,
                WebLink: data.WebLink,
                Icon: data.Icon,
                Description: data.Description,
                isSVG: data.isSVG,
                fillColor: data.fillColor,
                Keywords: data.Keywords,
                isPublished: true,
                isDeleted: false
            });
            
            // Add to return array
            defaultBookmarks.push(newBookmark.toObject());
            
            // Save to database (don't await here to avoid blocking)
            newBookmark.save().catch(err => {
                console.error("Error saving default bookmark:", err);
            });
        }
        
        // Return the default bookmarks immediately
        return defaultBookmarks;
    }

    // Filter out excluded IDs if provided
    if (excludeIds.length > 0) {
        Bookmarks = Bookmarks.filter(bookmark => 
            !excludeIds.includes(bookmark.BookmarkID || bookmark.id || '')
        );
    }

    return Bookmarks;
}


export {
    Controller_GET_Bookmarks
};