/**
 * GET  /api/support/tickets        → list tickets (own for users, all for employee/admin)
 * POST /api/support/tickets        → create ticket
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { SupportTicket, TicketCounter } from "@Models/SupportTicket";
import { getResolvedUser } from "@Utils/RolePermissions";

async function nextTicketNumber(): Promise<number> {
    const counter = await TicketCounter.findByIdAndUpdate(
        "ticket",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
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

        // Regular users only see their own tickets
        if (!user.isEmployee) {
            query.userId = user.userId;
        } else {
            // Employees can filter by assignedTo=me
            const assignedMe = q.get("assignedMe") === "true";
            if (assignedMe) query.assignedTo = user.userId;
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { ticketId: { $regex: search, $options: "i" } },
                { userEmail: { $regex: search, $options: "i" } },
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
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const num = await nextTicketNumber();
        const ticketId = `TKT-${String(num).padStart(5, "0")}`;

        const firstMessage = {
            messageId: require("uuid").v4(),
            senderId: user.userId,
            senderEmail: user.email,
            senderName: user.name,
            senderRole: "customer",
            content: body.description || "",
            attachments: body.attachments || [],
            isInternal: false,
            createdAt: new Date(),
        };

        const ticket = await SupportTicket.create({
            ticketId,
            ticketNumber: num,
            userId: user.userId,
            userEmail: user.email,
            userName: user.name,
            subject: body.subject,
            category: body.category || "general",
            priority: body.priority || "medium",
            orderId: body.orderId,
            messages: [firstMessage],
            lastRepliedAt: new Date(),
            tags: body.tags || [],
        });

        return NextResponse.json({ success: true, data: ticket.toObject() }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
