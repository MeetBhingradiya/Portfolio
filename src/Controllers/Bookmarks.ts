/**
 *  @file        Controllers\Bookmarks.ts
 *  @description No description available for Controllers\Bookmarks.ts.
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