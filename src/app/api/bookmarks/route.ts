import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { Bookmark } from "@Models/Bookmark";

// GET: Fetch all bookmarks for the authenticated user
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const bookmarks = await Bookmark.find({ UserID: user.userId })
            .sort({ createdAt: -1 }) // Newest first
            .lean();

        return NextResponse.json({ success: true, data: bookmarks, isAdmin: user.isAdmin }, { status: 200 });
    } catch (err) {
        console.error("GET /api/bookmarks:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch bookmarks" }, { status: 500 });
    }
}

// POST: Create a new bookmark
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        let { Title, Url, Description, Icon, Tags } = body;

        if (!Title?.trim() || !Url?.trim()) {
            return NextResponse.json({ success: false, error: "Title and Url are required" }, { status: 400 });
        }
        
        // Ensure Url has a protocol
        if (!Url.startsWith("http://") && !Url.startsWith("https://")) {
            Url = `https://${Url}`;
        }

        // Auto-generate favicon if not provided
        if (!Icon || !Icon.trim()) {
            try {
                const urlObj = new URL(Url);
                Icon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
            } catch (e) {
                // Ignore parsing errors and leave Icon empty
            }
        }

        const bookmark = await Bookmark.create({
            UserID: user.userId,
            Title: Title.trim(),
            Url: Url.trim(),
            Description: Description?.trim(),
            Icon: Icon?.trim(),
            Tags: Array.isArray(Tags) ? Tags.map(t => t.trim()).filter(Boolean) : [],
        });

        return NextResponse.json({ success: true, data: bookmark }, { status: 201 });
    } catch (err) {
        console.error("POST /api/bookmarks:", err);
        return NextResponse.json({ success: false, error: "Failed to create bookmark" }, { status: 500 });
    }
}
