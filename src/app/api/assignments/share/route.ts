/**
 * Assignment Sharing & Access Control API
 * POST /api/assignments/share → share assignment with specific users
 * POST /api/assignments/share-link → generate public share link
 * GET /api/assignments/share-link/:token → access assignment via share link
 * DELETE /api/assignments/share → revoke access
 */

import { NextRequest, NextResponse } from "next/server";
import AssignmentDocument from "@/Models/AssignmentDocument";
import AssignmentShareLink from "@/Models/AssignmentShareLink";
import dbConnect from "@/Utils/dbConnect";
import { getSession, requireAuth } from "@Library/auth";
import { AssignmentPrivacy, AssignmentPermission } from "@/Types/Assignment";
import { getPrimaryOrigin } from "@/Utils/origin";

const isAdmin = (email?: string | null) => !!email && !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;

type SharedWithEntry = {
    userId: string;
    email: string;
    name: string;
    permissions: AssignmentPermission[];
    sharedAt: Date;
};

export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth(req.headers);
        await dbConnect();

        const pathname = req.nextUrl.pathname;
        const action = req.nextUrl.searchParams.get("action") || "share-user";

        const assignment = await AssignmentDocument.findById(req.nextUrl.searchParams.get("id"));
        if (!assignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        const isOwner = assignment.ownerId === session.user.id;
        const admin = isAdmin(session.user.email);

        if (!isOwner && !admin) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        if (action === "share-user") {
            // Share with specific user
            const { userId, email, permissions } = body;

            if (!userId || !email || !Array.isArray(permissions) || permissions.length === 0) {
                return NextResponse.json(
                    { success: false, error: "Missing required fields: userId, email, permissions" },
                    { status: 400 }
                );
            }

            // Check if already shared
            const existingShare = assignment.sharedWith?.find((s: SharedWithEntry) => s.userId === userId);
            if (existingShare) {
                existingShare.permissions = permissions;
                existingShare.sharedAt = new Date();
            } else {
                if (!assignment.sharedWith) assignment.sharedWith = [];
                assignment.sharedWith.push({
                    userId,
                    email,
                    name: body.name || "Shared User",
                    permissions: permissions as AssignmentPermission[],
                    sharedAt: new Date()
                });
            }

            assignment.shares = (assignment.shares || 0) + 1;
            await assignment.save();

            return NextResponse.json({
                success: true,
                data: assignment,
                message: `Assignment shared with ${email}`
            });
        }

        if (action === "share-link") {
            // Generate public share link
            const { expiresIn, allowDownload } = body; // expiresIn in hours

            const shareLink = new AssignmentShareLink({
                assignmentId: assignment._id,
                createdBy: session.user.id,
                expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : undefined,
                isPublic: true,
                allowDownload: allowDownload !== false
            });

            await shareLink.save();

            const shareUrl = `${getPrimaryOrigin()}/assignments/shared/${shareLink.token}`;

            return NextResponse.json({
                success: true,
                data: {
                    shareLink,
                    shareUrl,
                    token: shareLink.token
                },
                message: "Share link created successfully"
            });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("POST /api/assignments/share error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await requireAuth(req.headers);
        await dbConnect();

        const id = req.nextUrl.searchParams.get("id");
        const userId = req.nextUrl.searchParams.get("userId");
        const tokenId = req.nextUrl.searchParams.get("tokenId");

        const assignment = await AssignmentDocument.findById(id);
        if (!assignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        const isOwner = assignment.ownerId === session.user.id;
        const admin = isAdmin(session.user.email);

        if (!isOwner && !admin) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (userId) {
            // Revoke user access
            assignment.sharedWith = assignment.sharedWith?.filter((s: SharedWithEntry) => s.userId !== userId) || [];
            await assignment.save();
            return NextResponse.json({ success: true, message: "User access revoked" });
        }

        if (tokenId) {
            // Delete share link
            await AssignmentShareLink.findByIdAndDelete(tokenId);
            return NextResponse.json({ success: true, message: "Share link deleted" });
        }

        return NextResponse.json({ success: false, error: "Missing userId or tokenId" }, { status: 400 });
    } catch (error: any) {
        console.error("DELETE /api/assignments/share error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// GET share link access endpoint
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const token = req.nextUrl.searchParams.get("token");
        if (!token) {
            return NextResponse.json({ success: false, error: "Missing share token" }, { status: 400 });
        }

        const shareLink = await AssignmentShareLink.findOne({ token });
        if (!shareLink) {
            return NextResponse.json({ success: false, error: "Invalid share link" }, { status: 404 });
        }

        if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
            return NextResponse.json({ success: false, error: "Share link has expired" }, { status: 410 });
        }

        const assignment = await AssignmentDocument.findById(shareLink.assignmentId);
        if (!assignment || assignment.isDeleted) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        // Increment access count
        await AssignmentShareLink.updateOne({ _id: shareLink._id }, { $inc: { accessCount: 1 } });

        return NextResponse.json({
            success: true,
            data: {
                assignment,
                shareLink: {
                    token: shareLink.token,
                    allowDownload: shareLink.allowDownload,
                    expiresAt: shareLink.expiresAt,
                    accessCount: shareLink.accessCount + 1
                }
            }
        });
    } catch (error: any) {
        console.error("GET /api/assignments/share error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
