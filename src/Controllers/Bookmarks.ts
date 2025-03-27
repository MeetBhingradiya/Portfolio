/**
 *  @FileID          Controllers/Bookmarks.ts
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
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
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
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


import { Bookmarks_Model, ILinkOpenTypes } from "@Models/Bookmarks";
import { IBookmark } from "@App/Tools/Settings/Types";
import dbConnect from "@Utils/dbConnect";
import { v4 } from "uuid";
import { BookmarksDB } from "@Data/Tools";
import { log } from "@Utils";

/**
 * Migrates an old bookmark format to the new IBookmark schema
 * 
 * @param oldBookmark The bookmark in the old format
 * @returns A bookmark in the new IBookmark format
 */
function migrateBookmarkFormat(oldBookmark: any):IBookmark {
    const newBookmark:IBookmark = {
        BookmarkID: oldBookmark.id || v4(),
        Name: oldBookmark.name || '',
        URL: oldBookmark.url || '',
        Android: oldBookmark.androidapp || '',
        Windows: oldBookmark.windowsapp || '',
        Description: oldBookmark.description || '',
        Keywords: oldBookmark.keywords || [],
        Icon: oldBookmark.icon || '',
        isSVG: oldBookmark.isSVGSrc || false,
        SVGStyles: {
            fill: oldBookmark.SVGStyles?.fill || '#000000'
        },
        ClientOptions: {
            OpenLinkPlatformPriority: "web",
            OpenLinkMethod: ILinkOpenTypes.NEW_TAB,
            isSearchVisible: true
        },
        isPublished: true,
        isDeleted: false,
        isServer: true
    };

    return newBookmark;
}

// Get bookmarks with more flexible querying
async function Controller_GET_Bookmarks(options: {
    isAdmin?: boolean,
    excludeIds?: string[],
    showUnpublished?: boolean,
    migrateOldBookmarks?: boolean
} = {}) {
    const { isAdmin = false, excludeIds = [], showUnpublished = false, migrateOldBookmarks = true } = options;
    
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
                URL: data.URL,
                Icon: data.Icon,
                Description: data.Description,
                isSVG: data.isSVG,
                SVGStyles: data.SVGStyles,
                Keywords: data.Keywords,
                ClientOptions: data.ClientOptions,
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

async function Controller_GET_SyncBookmarks() {
    // ? Check Data on Database and Sync with BookmarksDB if Exists Update the Data Otherwise Insert the Data
    await dbConnect();
    
    BookmarksDB.forEach(async (data) => {
        const Bookmark = await Bookmarks_Model.findOne({
            URL: data.URL
        }).exec();

        if (!Bookmark) {
            const docid: string = v4();
            const Bookmark = new Bookmarks_Model({
                BookmarkID: docid,
                Name: data.Name,
                URL: data.URL,
                Icon: data.Icon,
                Description: data.Description,
                isSVG: data.isSVG,
                SVGStyles: data.SVGStyles,
                Keywords: data.Keywords,
                ClientOptions: data.ClientOptions,
                isPublished: true,
                isDeleted: false
            });
            await Bookmark.save();
        } else {
            Bookmark.Name = data.Name;
            Bookmark.Icon = data.Icon ?? "";
            Bookmark.Description = data.Description ?? "";
            Bookmark.isSVG = data.isSVG ?? false;
            Bookmark.SVGStyles.fill = data.SVGStyles?.fill ?? "#000000";
            Bookmark.Keywords = data.Keywords ?? [];
            Bookmark.ClientOptions.OpenLinkPlatformPriority = data.ClientOptions?.OpenLinkPlatformPriority ?? "web";
            Bookmark.ClientOptions.OpenLinkMethod = data.ClientOptions?.OpenLinkMethod ?? ILinkOpenTypes.NEW_TAB;
            Bookmark.ClientOptions.isSearchVisible = data.ClientOptions?.isSearchVisible ?? true;
            Bookmark.isPublished = true;
            Bookmark.isDeleted = false;
            await Bookmark.save();
        }
    });

    return;
}

async function Controller_POST_PublishBookmark(id: string) {
    await dbConnect();
    const Bookmark = await Bookmarks_Model.findOne({
        BookmarkID: id
    }).exec();

    if (!Bookmark) {
        return {
            Status: 404,
            Message: "Bookmark not found"
        };
    }

    Bookmark.isPublished = true;
    await Bookmark.save();
    
    return {
        Status: 200,
        Message: "Bookmark published successfully"
    };
}

// Delete a bookmark (soft delete)
async function Controller_DELETE_Bookmark(id: string) {
    await dbConnect();
    const Bookmark = await Bookmarks_Model.findOne({
        BookmarkID: id
    }).exec();

    if (!Bookmark) {
        return {
            Status: 404,
            Message: "Bookmark not found"
        };
    }

    Bookmark.isDeleted = true;
    await Bookmark.save();
    
    return {
        Status: 200,
        Message: "Bookmark deleted successfully"
    };
}


export {
    Controller_GET_Bookmarks,
    Controller_GET_SyncBookmarks,
    Controller_POST_PublishBookmark,
    Controller_DELETE_Bookmark,
    migrateBookmarkFormat
};