/**
 *  @FileID          Controllers\Bookmarks.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


import { Bookmarks_Model } from "@Models/Bookmarks";
import dbConnect from "@Utils/dbConnect";
import { v4 } from "uuid";
import { BookmarksDB } from "@Data/Tools";

async function Controller_GET_Bookmarks() {
    await dbConnect()
    let Bookmarks = await Bookmarks_Model.find({ isPublished: true, isDeleted: false }).exec();

    if (!Bookmarks || Bookmarks.length === 0) {
        BookmarksDB.forEach(async (data) => {
            const docid: string = v4();
            const Bookmark = new Bookmarks_Model({
                BookmarkID: docid,
                name: data.name,
                url: data.url,
                icon: data.icon,
                description: data.description,
                isSVGSrc: data.isSVGSrc,
                SVGStyles: data.SVGStyles,
                keywords: data.keywords,
                size: data.size,
                isPublished: true,
                isDeleted: false
            })
            await Bookmark.save()
        })

        return await Bookmarks_Model.find({ isPublished: true, isDeleted: false }).exec();
    }

    return Bookmarks
}

async function Controller_GET_SyncBookmarks() {
    // ? Check Data on Database and Sync with BookmarksDB if Exists Update the Data Otherwise Insert the Data
    await dbConnect()
    
    BookmarksDB.forEach(async (data) => {
        const Bookmark = await Bookmarks_Model.findOne({
            url: data.url
        }).exec()

        if (!Bookmark) {
            const docid: string = v4();
            const Bookmark = new Bookmarks_Model({
                BookmarkID: docid,
                name: data.name,
                url: data.url,
                icon: data.icon,
                description: data.description,
                isSVGSrc: data.isSVGSrc,
                SVGStyles: data.SVGStyles,
                keywords: data.keywords,
                size: data.size,
                isPublished: true,
                isDeleted: false
            })
            await Bookmark.save()
        } else {
            Bookmark.name = data.name
            Bookmark.icon = data.icon
            Bookmark.description = data.description
            Bookmark.isSVGSrc = data.isSVGSrc
            Bookmark.SVGStyles = data.SVGStyles
            Bookmark.keywords = data.keywords
            Bookmark.size = data.size
            Bookmark.isPublished = true
            Bookmark.isDeleted = false
            await Bookmark.save()
        }
    })

    return;
}

export {
    Controller_GET_Bookmarks,
    Controller_GET_SyncBookmarks,
}