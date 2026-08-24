import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { Bookmark } from "@Models/Bookmark";

// PUT: Update an existing bookmark
export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { Title, Url, Description, Icon, Tags } = body;

        const updateData: Record<string, any> = {};
        if (Title !== undefined) updateData.Title = Title.trim();
        if (Url !== undefined) {
            updateData.Url = Url.trim();
            if (!updateData.Url.startsWith("http://") && !updateData.Url.startsWith("https://")) {
                updateData.Url = `https://${updateData.Url}`;
            }
        }
        if (Description !== undefined) updateData.Description = Description.trim();
        if (Icon !== undefined) updateData.Icon = Icon.trim();
        if (Tags !== undefined) updateData.Tags = Array.isArray(Tags) ? Tags.map(t => t.trim()).filter(Boolean) : [];

        const updatedBookmark = await Bookmark.findOneAndUpdate(
            { _id: id, UserID: user.userId },
            { $set: updateData },
            { new: true }
        );

        if (!updatedBookmark) {
            return NextResponse.json({ success: false, error: "Bookmark not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedBookmark }, { status: 200 });
    } catch (err) {
        console.error(`PUT /api/bookmarks/[id]:`, err);
        return NextResponse.json({ success: false, error: "Failed to update bookmark" }, { status: 500 });
    }
}

// DELETE: Delete a specific bookmark
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const deletedBookmark = await Bookmark.findOneAndDelete({ _id: id, UserID: user.userId });

        if (!deletedBookmark) {
            return NextResponse.json({ success: false, error: "Bookmark not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Bookmark deleted" }, { status: 200 });
    } catch (err) {
        console.error(`DELETE /api/bookmarks/[id]:`, err);
        return NextResponse.json({ success: false, error: "Failed to delete bookmark" }, { status: 500 });
    }
}
