/**
 * GET   /api/support/tickets/[id]  → get full ticket (own user or employee/admin)
 * PATCH /api/support/tickets/[id]  → update status/priority/assignment (employee/admin), or add reply (any auth)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@Utils/dbConnect";
import { SupportTicket } from "@Models/SupportTicket";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const ticket = await SupportTicket.findOne({
            $or: [{ _id: params.id }, { ticketId: params.id }],
            isDeleted: false,
        }).lean();

        if (!ticket) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        // Users can only see their own tickets; filter internal messages
        if (!user.isEmployee) {
            if ((ticket as any).userId !== user.userId) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
            // Strip internal notes for regular users
            (ticket as any).messages = ((ticket as any).messages as any[]).filter(
                (m: any) => !m.isInternal
            );
        }

        return NextResponse.json({ success: true, data: ticket });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const ticket = await SupportTicket.findOne({
            $or: [{ _id: params.id }, { ticketId: params.id }],
            isDeleted: false,
        });

        if (!ticket) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        // Only owner or employee/admin can touch this ticket
        const isOwner = ticket.userId === user.userId;
        if (!isOwner && !user.isEmployee) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Add reply message
        if (body.reply) {
            const senderRole = user.isAdmin ? "admin" : user.isEmployee ? "employee" : "customer";
            const isInternal = !!body.isInternal && user.isEmployee;

            ticket.messages.push({
                messageId: uuidv4(),
                senderId: user.userId,
                senderEmail: user.email,
                senderName: user.name,
                senderRole,
                content: body.reply,
                attachments: body.attachments || [],
                isInternal,
                createdAt: new Date(),
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
        if (user.isEmployee) {
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
        if (isOwner && body.satisfactionRating && ["resolved", "closed"].includes(ticket.status)) {
            ticket.satisfactionRating = body.satisfactionRating;
            ticket.satisfactionComment = body.satisfactionComment;
        }

        await ticket.save();
        return NextResponse.json({ success: true, data: ticket });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        await SupportTicket.findOneAndUpdate(
            { $or: [{ _id: params.id }, { ticketId: params.id }] },
            { isDeleted: true }
        );
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
