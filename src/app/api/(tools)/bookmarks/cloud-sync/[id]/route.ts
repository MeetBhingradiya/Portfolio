/**
 *  @FileID          app/api/(tools)/bookmarks/cloud-sync/[id]/route.ts
 *  @Description     API route for managing individual cloud bookmarks
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

// Rate limiting config for cloud sync operations
const rateLimitConfig = {
  name: "bookmarks_cloud_update",
  limit: 60, // 60 requests
  duration: 60 * 1000, // per minute
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    // Get user ID from auth token (you would implement proper auth)
    const userId = req.headers.get("x-user-id") || "anonymous";
    const bookmarkId = params.id;

    if (!bookmarkId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bookmark ID is required",
        },
        { status: 400 }
      );
    }

    // Get the specific bookmark from the database
    const result = await BookmarkController.getCloudBookmarks(userId);
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to retrieve bookmark",
          error: result.error,
        },
        { status: 500 }
      );
    }
    
    const bookmark = result.data.bookmarks.find(
      (b: any) => b.BookmarkID === bookmarkId || b._id.toString() === bookmarkId
    );

    if (!bookmark) {
      return NextResponse.json(
        {
          success: false,
          message: "Bookmark not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bookmark retrieved successfully",
      data: bookmark,
    });
  } catch (error) {
    log("Error retrieving bookmark", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve bookmark",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    // Get user ID from auth token (you would implement proper auth)
    const userId = req.headers.get("x-user-id") || "anonymous";
    const bookmarkId = params.id;

    if (!bookmarkId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bookmark ID is required",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const bookmark = body.bookmark;

    if (!bookmark) {
      return NextResponse.json(
        {
          success: false,
          message: "Bookmark data is required",
        },
        { status: 400 }
      );
    }

    // Ensure the bookmark ID in the URL matches the one in the body
    if (bookmark.BookmarkID !== bookmarkId) {
      bookmark.BookmarkID = bookmarkId;
    }

    // Update the bookmark in the cloud
    const result = await BookmarkController.updateCloudBookmark(userId, bookmark);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update bookmark",
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bookmark updated successfully",
      data: result.data,
    });
  } catch (error) {
    log("Error updating bookmark", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update bookmark",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth token (you would implement proper auth)
    const userId = req.headers.get("x-user-id") || "anonymous";
    const bookmarkId = params.id;

    if (!bookmarkId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bookmark ID is required",
        },
        { status: 400 }
      );
    }

    // Delete the bookmark from the cloud
    const result = await BookmarkController.deleteCloudBookmarks(userId, [bookmarkId]);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to delete bookmark",
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bookmark deleted successfully",
      data: result.data,
    });
  } catch (error) {
    log("Error deleting bookmark", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete bookmark",
      },
      { status: 500 }
    );
  }
}