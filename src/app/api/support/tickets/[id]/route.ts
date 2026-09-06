/**
 * GET   /api/support/tickets/[id]  → get full ticket (own user or has support.tickets.view permission)
 * PATCH /api/support/tickets/[id]  → update status/priority/assignment (requires support.tickets.manage), or add reply (any auth)
 * DELETE /api/support/tickets/[id] → delete ticket (requires support.tickets.delete permission)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { createHash, timingSafeEqual } from "crypto";
import mongoose from "mongoose";
import dbConnect from "@Utils/dbConnect";
import { SupportTicket } from "@Models/SupportTicket";
import { sendEmail, supportTicketReplyAdminEmail, supportTicketReplyCustomerEmail } from "@Utils/Email";
import { getResolvedUser, hasPermission } from "@Utils/RolePermissions";
import { getSession } from "@Library/auth";

/** Build a query that matches by ticketId string OR _id (only when id is a valid ObjectId). */
function ticketQuery(id: string) {
    if (!id || typeof id !== "string") return { ticketId: "__invalid__" };
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
            const canViewAll = await hasPermission(h, "support.tickets.view");
            if (!user.isEmployee && !user.isAdmin && !canViewAll && (ticket as any).userId !== user.userId) {
                if (!hasValidAccessSession) {
                    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
                }
            }
        } else if (!hasValidAccessSession) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!user?.isEmployee && !user?.isAdmin) {
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
        if (user && !isOwner && !user.isEmployee && !user.isAdmin && !hasValidAccessSession) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Add reply message
        if (body.reply) {
            const senderRole = user?.isAdmin ? "admin" : user?.isEmployee ? "employee" : "customer";
            const isInternal = !!body.isInternal && (!!user?.isEmployee || !!user?.isAdmin);

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

        // Employee/admin can update metadata (requires permission)
        if (body.status || body.priority || body.assignedTo !== undefined || body.tags) {
            const canManage = user ? await hasPermission(h, "support.tickets.manage") : false;
            if (!canManage && (user?.isEmployee || user?.isAdmin)) {
                // Fallback for legacy employee/admin access
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
            } else if (canManage) {
                // New permission-based access
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
        }

        // Customer can rate resolved ticket
        if ((isOwner || hasValidAccessSession) && body.satisfactionRating && ["resolved", "closed"].includes(ticket.status)) {
            ticket.satisfactionRating = body.satisfactionRating;
            ticket.satisfactionComment = body.satisfactionComment;
        }

        await ticket.save();

        // Send Email Notifications
        if (body.reply) {
            const senderRole = user?.isAdmin ? "admin" : user?.isEmployee ? "employee" : "customer";
            const isInternal = !!body.isInternal && (!!user?.isEmployee || !!user?.isAdmin);
            
            if (!isInternal) {
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.meetbhingradiya.in";
                    
                    if (senderRole === "customer") {
                        // Notify assigned employee or admin fallback
                        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "meetbhingradiya199@gmail.com";
                        const notifyEmail = ticket.assignedEmail || adminEmail;
                        const ticketUrlAdmin = `${baseUrl}/admin/tickets`;
                        
                        await sendEmail({
                            to: notifyEmail,
                            subject: `New Reply on Ticket ${ticket.ticketId}`,
                            html: supportTicketReplyAdminEmail({
                                ticketId: ticket.ticketId,
                                ticketUrl: ticketUrlAdmin,
                                replyBody: body.reply,
                                replierName: ticket.userName || "the customer"
                            }),
                            text: `A new reply was added to ticket ${ticket.ticketId} by ${ticket.userName || "the customer"}.`
                        });
                    } else {
                        // Notify customer
                        const isGuest = ticket.userId.startsWith("guest:");
                        const ticketUrlCustomer = isGuest ? 
                            `${baseUrl}/support/tickets/lookup?ticketId=${ticket.ticketId}` : 
                            `${baseUrl}/support/tickets/${ticket.ticketId}`;
                            
                        await sendEmail({
                            to: ticket.userEmail,
                            subject: `Update on your support ticket ${ticket.ticketId}`,
                            html: supportTicketReplyCustomerEmail({
                                ticketId: ticket.ticketId,
                                ticketUrl: ticketUrlCustomer,
                                replyBody: body.reply
                            }),
                            text: `Support has replied to your ticket ${ticket.ticketId}.`
                        });
                    }
                } catch (emailErr) {
                    console.error("[Ticket API] Failed to send notification email:", emailErr);
                }
            }
        }

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
        
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Check permission to delete tickets
        const canDelete = await hasPermission(h, "support.tickets.delete");
        if (!canDelete && !user?.isAdmin) {
            return NextResponse.json({ success: false, error: "Forbidden: Permission required: support.tickets.delete" }, { status: 403 });
        }

        await SupportTicket.findOneAndUpdate(ticketQuery(id), {
            isDeleted: true
        });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
