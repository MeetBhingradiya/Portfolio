/**
 *  @FileID          app/api/(tools)/bookmarks/cloud-sync/route.ts
 *  @Description     API route for synchronizing bookmarks with cloud storage
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
 *  @created 01/05/25 1:00 PM IST (Kolkata +5:30 UTC)
 *  @modified 01/05/25 1:00 PM IST (Kolkata +5:30 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { log } from "@/Utils";
import { BookmarkController } from "@/Controllers/Bookmarks";
export async function GET(req: NextRequest) {
  try {

    // Get user ID from auth token (you would implement proper auth)
    const userId = req.headers.get("x-user-id") || "anonymous";
    
    // Get cloud bookmarks
    const result = await BookmarkController.getCloudBookmarks(userId);
    
    return NextResponse.json({
      success: true,
      message: "Cloud bookmarks retrieved successfully",
      data: result.data
    });
  } catch (error) {
    log("Error retrieving cloud bookmarks", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to retrieve cloud bookmarks",
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {

    // Get user ID from auth token (you would implement proper auth)
    const userId = req.headers.get("x-user-id") || "anonymous";
    
    // Parse request body
    const body = await req.json();
    const { bookmarks } = body;
    
    if (!Array.isArray(bookmarks)) {
      return NextResponse.json({
        success: false,
        message: "Invalid request body. Expected 'bookmarks' array."
      }, { status: 400 });
    }

    // Sync bookmarks with cloud
    const result = await BookmarkController.syncCloudBookmarks(userId, bookmarks);
    
    return NextResponse.json({
      success: true,
      message: "Bookmarks synced with cloud successfully",
      data: result.data
    });
  } catch (error) {
    log("Error syncing bookmarks with cloud", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to sync bookmarks with cloud",
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {

    // Get user ID from auth token (you would implement proper auth)
    const userId = req.headers.get("x-user-id") || "anonymous";
    
    // Parse request body
    const body = await req.json();
    const { bookmarkIds } = body;
    
    if (!Array.isArray(bookmarkIds)) {
      return NextResponse.json({
        success: false,
        message: "Invalid request body. Expected 'bookmarkIds' array."
      }, { status: 400 });
    }

    // Delete bookmarks from cloud
    const result = await BookmarkController.deleteCloudBookmarks(userId, bookmarkIds);
    
    return NextResponse.json({
      success: true,
      message: "Bookmarks deleted from cloud successfully",
      data: result.data
    });
  } catch (error) {
    log("Error deleting bookmarks from cloud", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to delete bookmarks from cloud",
    }, { status: 500 });
  }
}