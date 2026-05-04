/**
 * Assignments API Routes — CRUD + Sharing
 * GET  ?id=  → single assignment (permission checks apply)
 * GET  ?mine=true (auth) → user's own assignments
 * GET  ?search=  → search assignments
 * POST → create assignment (auth required, requires Tools.AssignmentSystem.Create)
 * PUT  → update assignment (auth, must be owner or have edit permission)
 * DELETE ?id=  → soft delete assignment
 * PATCH ?id=&action=restore → restore from trash
 */

import { NextRequest, NextResponse } from "next/server";
import AssignmentDocument from "@/Models/AssignmentDocument";
import dbConnect from "@/Utils/dbConnect";
import { getSession, requireAuth } from "@Library/auth";
import { hasPermission } from "@Library/permissions";
import { AssignmentPrivacy, BlockType } from "@/Types/Assignment";

// ── helpers ──────────────────────────────────────────────────────
const isAdmin = (email?: string | null) => !!email && !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;

async function checkPermission(session: any, permissionKey: string): Promise<boolean> {
    if (!session?.user?.id) return false;
    return hasPermission(session.user.id, permissionKey);
}

// ── GET ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const p = req.nextUrl.searchParams;
        const id = p.get("id");
        const mine = p.get("mine") === "true";
        const search = p.get("search");
        const tag = p.get("tag");
        const limit = Math.min(parseInt(p.get("limit") || "20"), 100);
        const skip = parseInt(p.get("skip") || "0");

        const session = await getSession(req.headers).catch(() => null);
        const admin = isAdmin(session?.user?.email);

        // ── Single assignment by ID ──
        if (id) {
            const assignment = await AssignmentDocument.findById(id).lean();
            if (!assignment) {
                return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
            }

            // Check access permissions
            const isOwner = assignment.ownerId === session?.user?.id;
            const canView = admin || isOwner || assignment.privacy === AssignmentPrivacy.Public;

            if (!admin && !isOwner && assignment.privacy === AssignmentPrivacy.Private) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }

            if (!isOwner && assignment.adminRestricted && !admin) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }

            // Increment views for public/unlisted
            if (canView && !isOwner) {
                await AssignmentDocument.findByIdAndUpdate(id, { $inc: { views: 1 } });
            }

            return NextResponse.json({ success: true, data: assignment });
        }

        // ── My assignments (auth required) ──
        if (mine) {
            if (!session) {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            const query: any = { ownerId: session.user.id, isDeleted: false };

            const assignments = await AssignmentDocument.find(query)
                .select("-blocks")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();

            const total = await AssignmentDocument.countDocuments(query);

            return NextResponse.json({
                success: true,
                data: assignments,
                pagination: { total, limit, skip }
            });
        }

        // ── Search public/unlisted assignments ──
        let query: any = {
            isDeleted: false,
            $or: [{ privacy: AssignmentPrivacy.Public }, { privacy: AssignmentPrivacy.Unlisted }]
        };

        if (search) {
            query.$or = [
                { assignmentTitle: { $regex: search, $options: "i" } },
                { assignmentNo: { $regex: search, $options: "i" } },
                { studentName: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } }
            ];
        }

        if (tag) {
            query.tags = tag;
        }

        const assignments = await AssignmentDocument.find(query)
            .select("-blocks")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await AssignmentDocument.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: assignments,
            pagination: { total, limit, skip }
        });
    } catch (error: any) {
        console.error("GET /api/assignments error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ── POST ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth(req);
        await dbConnect();

        // Check permission
        const hasPermission = await checkPermission(session, "Tools.AssignmentSystem.Create");
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: "Missing permission: Tools.AssignmentSystem.Create" }, { status: 403 });
        }

        const body = await req.json();
        const {
            assignmentNo,
            assignmentTitle,
            studentName,
            studentEnrollmentNo,
            subject,
            subjectCode,
            description,
            blocks,
            privacy,
            tags,
            watermarkEnabled
        } = body;

        // Validate required fields
        if (!assignmentNo || !assignmentTitle || !studentName || !studentEnrollmentNo) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: assignmentNo, assignmentTitle, studentName, studentEnrollmentNo" },
                { status: 400 }
            );
        }

        if (!Array.isArray(blocks) || blocks.length === 0) {
            return NextResponse.json(
                { success: false, error: "Assignment must have at least one content block" },
                { status: 400 }
            );
        }

        // Validate blocks
        const validBlockTypes = Object.values(BlockType);
        for (const block of blocks) {
            if (!validBlockTypes.includes(block.type)) {
                return NextResponse.json(
                    { success: false, error: `Invalid block type: ${block.type}` },
                    { status: 400 }
                );
            }
        }

        const assignment = new AssignmentDocument({
            assignmentNo,
            assignmentTitle,
            studentName,
            studentEnrollmentNo,
            subject,
            subjectCode,
            description,
            blocks,
            privacy: privacy || AssignmentPrivacy.Private,
            tags: tags || [],
            watermarkEnabled: watermarkEnabled || false,
            ownerId: session.user.id,
            ownerEmail: session.user.email,
            ownerName: session.user.name,
            views: 0,
            downloads: 0,
            shares: 0,
            version: 1
        });

        await assignment.save();

        return NextResponse.json({
            success: true,
            data: assignment,
            message: "Assignment created successfully"
        });
    } catch (error: any) {
        console.error("POST /api/assignments error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ── PUT ──────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
    try {
        const session = await requireAuth(req);
        await dbConnect();

        const p = req.nextUrl.searchParams;
        const id = p.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing assignment ID" }, { status: 400 });
        }

        const assignment = await AssignmentDocument.findById(id);
        if (!assignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        // Check ownership/permission
        const isOwner = assignment.ownerId === session.user.id;
        const admin = isAdmin(session.user.email);
        
        if (!isOwner && !admin) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (isOwner) {
            const hasPermission = await checkPermission(session, "Tools.AssignmentSystem.Edit");
            if (!hasPermission) {
                return NextResponse.json({ success: false, error: "Missing permission: Tools.AssignmentSystem.Edit" }, { status: 403 });
            }
        }

        const body = await req.json();
        const { assignmentTitle, blocks, privacy, tags, description, subject, subjectCode, watermarkEnabled } = body;

        if (assignmentTitle) assignment.assignmentTitle = assignmentTitle;
        if (description !== undefined) assignment.description = description;
        if (subject !== undefined) assignment.subject = subject;
        if (subjectCode !== undefined) assignment.subjectCode = subjectCode;
        if (privacy) assignment.privacy = privacy;
        if (tags) assignment.tags = tags;
        if (watermarkEnabled !== undefined) assignment.watermarkEnabled = watermarkEnabled;
        if (blocks) {
            // Validate blocks
            const validBlockTypes = Object.values(BlockType);
            for (const block of blocks) {
                if (!validBlockTypes.includes(block.type)) {
                    return NextResponse.json({ success: false, error: `Invalid block type: ${block.type}` }, { status: 400 });
                }
            }
            assignment.blocks = blocks;
        }

        assignment.lastEditedBy = session.user.id;
        assignment.version = (assignment.version || 1) + 1;
        assignment.editedAt = new Date();

        await assignment.save();

        return NextResponse.json({
            success: true,
            data: assignment,
            message: "Assignment updated successfully"
        });
    } catch (error: any) {
        console.error("PUT /api/assignments error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ── DELETE / PATCH ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        const session = await requireAuth(req);
        await dbConnect();

        const p = req.nextUrl.searchParams;
        const id = p.get("id");
        const permanent = p.get("permanent") === "true";

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing assignment ID" }, { status: 400 });
        }

        const assignment = await AssignmentDocument.findById(id);
        if (!assignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        const isOwner = assignment.ownerId === session.user.id;
        const admin = isAdmin(session.user.email);

        if (!isOwner && !admin) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (isOwner) {
            const hasPermission = await checkPermission(session, "Tools.AssignmentSystem.Delete");
            if (!hasPermission) {
                return NextResponse.json({ success: false, error: "Missing permission: Tools.AssignmentSystem.Delete" }, { status: 403 });
            }
        }

        if (permanent && admin) {
            // Permanent delete (admin only)
            await AssignmentDocument.findByIdAndDelete(id);
            return NextResponse.json({ success: true, message: "Assignment permanently deleted" });
        } else {
            // Soft delete (move to trash)
            assignment.isDeleted = true;
            assignment.deletedAt = new Date();
            assignment.deletedBy = session.user.id;
            await assignment.save();
            return NextResponse.json({ success: true, message: "Assignment moved to trash" });
        }
    } catch (error: any) {
        console.error("DELETE /api/assignments error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ── PATCH ────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
    try {
        const session = await requireAuth(req);
        await dbConnect();

        const p = req.nextUrl.searchParams;
        const id = p.get("id");
        const action = p.get("action");

        if (!id || !action) {
            return NextResponse.json({ success: false, error: "Missing id or action parameter" }, { status: 400 });
        }

        const assignment = await AssignmentDocument.findById(id);
        if (!assignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        const isOwner = assignment.ownerId === session.user.id;
        const admin = isAdmin(session.user.email);

        if (!isOwner && !admin) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (action === "restore") {
            if (!assignment.isDeleted) {
                return NextResponse.json({ success: false, error: "Assignment is not deleted" }, { status: 400 });
            }
            assignment.isDeleted = false;
            assignment.deletedAt = undefined;
            assignment.deletedBy = undefined;
            await assignment.save();
            return NextResponse.json({ success: true, message: "Assignment restored from trash" });
        }

        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    } catch (error: any) {
        console.error("PATCH /api/assignments error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
