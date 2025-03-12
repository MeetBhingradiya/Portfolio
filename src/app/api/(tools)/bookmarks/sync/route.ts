/**
 *  @FileID          app/api/(tools)/bookmarks/sync/route.ts
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
 *  @modified 03/03/25 11:03 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { Controller_GET_SyncBookmarks } from "@Controllers";

export async function GET(req: NextRequest) {
    try {
        await Controller_GET_SyncBookmarks()
        return NextResponse.json({
            Status: 1,
            Message: "Bookmarks Synced",
            StatusCode: 200
        }, {
            status: 200
        })
    } catch (error) {
        console.error("Error syncing bookmarks:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Failed to sync bookmarks",
            StatusCode: 500,
            Error: error instanceof Error ? error.message : "Unknown error"
        }, {
            status: 500
        });
    }
}