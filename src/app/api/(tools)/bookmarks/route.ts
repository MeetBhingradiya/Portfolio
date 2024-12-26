import { NextRequest, NextResponse } from "next/server";
import { Controller_GET_Bookmarks } from "@Controllers/Bookmarks";
import { APIResponse } from "@Data/APIMessages";

export async function GET(req: NextRequest) {
    let Response: Array<any> = await Controller_GET_Bookmarks()

    if (Response.length === 0) {
        return APIResponse(404, {})
    }

    return APIResponse(200, {
        data: Response
    })
}