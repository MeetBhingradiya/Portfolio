/**
 * GET  /api/support/tickets        → list tickets (own for users, all for employee/admin)
 * POST /api/support/tickets        → create ticket
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHash, randomBytes } from "crypto";
import dbConnect from "@Utils/dbConnect";
import { SupportTicket, TicketCounter } from "@Models/SupportTicket";
import { getResolvedUser, hasPermission } from "@Utils/RolePermissions";
import { getSession } from "@Library/auth";
import { sendEmail } from "@Utils/Email";

async function nextTicketNumber(): Promise<number> {
    const counter = await TicketCounter.findByIdAndUpdate("ticket", { $inc: { seq: 1 } }, { new: true, upsert: true });
    return counter.seq;
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(50, parseInt(q.get("limit") || "20"));
        const status = q.get("status") || "";
        const priority = q.get("priority") || "";
        const search = q.get("search") || "";

        const query: any = { isDeleted: false };

        // Check if user can view all tickets
        const canViewAll = await hasPermission(req.headers, "support.tickets.view");

        // Regular users only see their own tickets unless they have view permission
        if (!canViewAll && !user.isEmployee) {
            query.userId = user.userId;
        } else if (!canViewAll && user.isEmployee) {
            // Employees without permission see their own + assigned tickets
            const assignedMe = q.get("assignedMe") === "true";
            if (assignedMe) query.assignedTo = user.userId;
            else query.userId = user.userId;
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { ticketId: { $regex: search, $options: "i" } },
                { userEmail: { $regex: search, $options: "i" } }
            ];
        }

        const total = await SupportTicket.countDocuments(query);
        const tickets = await SupportTicket.find(query)
            .select("-messages") // don't send full message thread in list
            .sort({ lastRepliedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: tickets,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);

        const body = await req.json();
        const email = String(user?.email || body?.email || "")
            .trim()
            .toLowerCase();
        const name = String(user?.name || body?.name || "").trim();
        if (!email || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ success: false, error: "Valid name and email are required." }, { status: 400 });
        }

        const num = await nextTicketNumber();
        const ticketId = `TKT-${String(num).padStart(5, "0")}`;
        const accessSecret = randomBytes(6).toString("hex").toUpperCase();
        const accessSecretHash = createHash("sha256").update(accessSecret).digest("hex");

        const firstMessage = {
            messageId: require("uuid").v4(),
            senderId: user?.userId || `guest:${email}`,
            senderEmail: email,
            senderName: name,
            senderRole: "customer",
            content: body.description || "",
            attachments: body.attachments || [],
            isInternal: false,
            createdAt: new Date()
        };

        const ticket = await SupportTicket.create({
            ticketId,
            ticketNumber: num,
            userId: user?.userId || `guest:${email}`,
            userEmail: email,
            userName: name,
            subject: body.subject,
            category: body.category || "general",
            priority: body.priority || "medium",
            orderId: body.orderId,
            messages: [firstMessage],
            lastRepliedAt: new Date(),
            tags: body.tags || [],
            accessSecretHash
        });

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.meetbhingradiya.in";
            const isGuest = ticket.userId.startsWith("guest:");
            const lookupUrl = isGuest 
                ? `${baseUrl}/support/tickets/lookup?ticketId=${ticketId}`
                : `${baseUrl}/support/tickets/${ticket._id}`;

            await sendEmail({
                to: email,
                subject: `Support Ticket ${ticketId} Created`,
                html: `<p>Your support ticket <strong>${ticketId}</strong> was created.</p>
                       <p>Ticket secret code: <strong>${accessSecret}</strong></p>
                       <p>Keep this secret code safe. You will need it to securely access your ticket.</p>
                       <p><a href="${lookupUrl}">Track your ticket here</a></p>`,
                text: `Ticket ${ticketId} created. Secret code: ${accessSecret}. Track it here: ${lookupUrl}`
            });
        } catch {
            // Non-blocking: ticket is already created.
        }

        const data = ticket.toObject() as any;
        delete data.accessSecretHash;
        delete data.accessOtpHash;
        delete data.accessSessionHash;
        data.accessSecret = accessSecret;
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
