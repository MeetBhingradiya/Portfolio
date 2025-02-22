/**
 *  @FileID          app\api\(tools)\bookmarks\route.ts
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
 *  @modified 22/02/25 7:25 PM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { Controller_GET_Bookmarks } from "@Controllers/Bookmarks";
import { APIResponse } from "@/Data/APIMessages";

// ? Enables Cache 
export const revalidate = 60

export async function GET(req: NextRequest) {
    let Response: Array<any> = await Controller_GET_Bookmarks()

    if (Response.length === 0) {
        return APIResponse(404, {})
    }

    return APIResponse(200, {
        data: Response
    })
}