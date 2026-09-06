/**
 * GET   /api/support/tickets/[id]  → get full ticket (own user or employee/admin)
 * PATCH /api/support/tickets/[id]  → update status/priority/assignment (employee/admin), or add reply (any auth)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { createHash, timingSafeEqual } from "crypto";
import mongoose from "mongoose";
import dbConnect from "@Utils/dbConnect";
import { SupportTicket } from "@Models/SupportTicket";
import { getResolvedUser } from "@Utils/RolePermissions";

/** Build a query that matches by ticketId string OR _id (only when id is a valid ObjectId). */
function ticketQuery(id: string) {
    return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { ticketId: id }] } : { ticketId: id };
}

function compareHash(storedHash: string | undefined, provided: string): boolean {
    if (!storedHash || !provided) return false;
    const expected = Buffer.from(storedHash, "hex");
    const actual = Buffer.from(createHash("sha256").update(provided).digest("hex"), "hex");
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const h = await headers();
        const user = await getResolvedUser(h);
        const accessToken = req.headers.get("x-ticket-access-token") || "";

        const ticket = await SupportTicket.findOne({
            ...ticketQuery(id),
            isDeleted: false
        })
            .select(accessToken ? "+accessSessionHash +accessSessionExpiresAt" : "")
            .lean();

        if (!ticket) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        const hasValidAccessSession =
            !!(ticket as any).accessSessionHash &&
            !!(ticket as any).accessSessionExpiresAt &&
            new Date((ticket as any).accessSessionExpiresAt).getTime() > Date.now() &&
            compareHash((ticket as any).accessSessionHash, accessToken);

        // Session user path
        if (user) {
            if (!user.isEmployee && (ticket as any).userId !== user.userId) {
                if (!hasValidAccessSession) {
                    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
                }
            }
        } else if (!hasValidAccessSession) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!user?.isEmployee) {
            (ticket as any).messages = ((ticket as any).messages as any[]).filter((m: any) => !m.isInternal);
        }

        return NextResponse.json({ success: true, data: ticket });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const h = await headers();
        const user = await getResolvedUser(h);
        const accessToken = req.headers.get("x-ticket-access-token") || "";

        const body = await req.json();
        const ticket = await SupportTicket.findOne({
            ...ticketQuery(id),
            isDeleted: false
        }).select(accessToken ? "+accessSessionHash +accessSessionExpiresAt" : "");

        if (!ticket) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        const hasValidAccessSession =
            !!ticket.accessSessionHash &&
            !!ticket.accessSessionExpiresAt &&
            ticket.accessSessionExpiresAt.getTime() > Date.now() &&
            compareHash(ticket.accessSessionHash, accessToken);

        if (!user && !hasValidAccessSession) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const isOwner = !!user && ticket.userId === user.userId;
        if (user && !isOwner && !user.isEmployee && !hasValidAccessSession) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Add reply message
        if (body.reply) {
            const senderRole = user?.isAdmin ? "admin" : user?.isEmployee ? "employee" : "customer";
            const isInternal = !!body.isInternal && !!user?.isEmployee;

            ticket.messages.push({
                messageId: uuidv4(),
                senderId: user?.userId || `guest:${ticket.ticketId}`,
                senderEmail: user?.email || ticket.userEmail,
                senderName: user?.name || ticket.userName || "Guest",
                senderRole,
                content: body.reply,
                attachments: body.attachments || [],
                isInternal,
                createdAt: new Date()
            } as any);
            ticket.lastRepliedAt = new Date();

            // Auto-update status on reply
            if (senderRole === "customer" && ticket.status === "waiting_customer") {
                ticket.status = "in_progress";
            }
            if ((senderRole === "employee" || senderRole === "admin") && ticket.status === "open") {
                ticket.status = "in_progress";
            }
        }

        // Employee/admin can update metadata
        if (user?.isEmployee) {
            if (body.status) {
                ticket.status = body.status;
                if (body.status === "resolved") ticket.resolvedAt = new Date();
                if (body.status === "closed") ticket.closedAt = new Date();
            }
            if (body.priority) ticket.priority = body.priority;
            if (body.assignedTo !== undefined) {
                ticket.assignedTo = body.assignedTo;
                ticket.assignedEmail = body.assignedEmail;
            }
            if (body.tags) ticket.tags = body.tags;
        }

        // Customer can rate resolved ticket
        if ((isOwner || hasValidAccessSession) && body.satisfactionRating && ["resolved", "closed"].includes(ticket.status)) {
            ticket.satisfactionRating = body.satisfactionRating;
            ticket.satisfactionComment = body.satisfactionComment;
        }

        await ticket.save();
        return NextResponse.json({ success: true, data: ticket.toObject() });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        await SupportTicket.findOneAndUpdate(ticketQuery(id), {
            isDeleted: true
        });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
