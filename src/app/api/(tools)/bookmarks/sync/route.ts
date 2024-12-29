import { NextRequest, NextResponse } from "next/server";
import { Controller_GET_SyncBookmarks } from "@Controllers/Bookmarks";
import { APIResponse } from "@Data/APIMessages";

export async function GET(req: NextRequest) {
    await Controller_GET_SyncBookmarks()

    return APIResponse(200, {})
}