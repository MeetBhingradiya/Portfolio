/**
 *  @FileID          app\api\(tools)\bookmarks\sync\route.ts
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
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
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
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { Controller_GET_SyncBookmarks } from "@Controllers";

/**
 * Handles an HTTP GET request to sync bookmarks.
 *
 * This function invokes a controller to synchronize bookmarks and returns a JSON response confirming the operation.
 * The response includes a status flag, a confirmation message, and an HTTP status code.
 *
 * @returns A JSON response with keys `Status`, `Message`, and `StatusCode`, sent with HTTP status 200.
 */
export async function GET(req: NextRequest) {
    await Controller_GET_SyncBookmarks()

    return NextResponse.json({
        Status: 1,
        Message: "Bookmarks Synced",
        StatusCode: 200
    }, {
        status: 200
    })
}