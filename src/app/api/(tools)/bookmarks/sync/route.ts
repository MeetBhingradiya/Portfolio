/**
 *  @FileID          app\api\(tools)\bookmarks\sync\route.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { Controller_GET_SyncBookmarks } from "@Controllers/Bookmarks";
import { APIResponse } from "@/Data/APIMessages";

export async function GET(req: NextRequest) {
    await Controller_GET_SyncBookmarks()

    return APIResponse(200, {})
}