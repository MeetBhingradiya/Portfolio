/**
 * GET  /api/shop/refunds        → list refund requests (own for users, all for employee/admin)
 * POST /api/shop/refunds        → create refund request
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { RefundRequest } from "@Models/RefundRequest";
import { Order } from "@Models/Order";
import { getResolvedUser } from "@Utils/RolePermissions";

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

        const query: any = { isDeleted: false };
        if (!user.isEmployee) query.userId = user.userId;
        if (status) query.status = status;

        const total = await RefundRequest.countDocuments(query);
        const refunds = await RefundRequest.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: refunds,
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
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { orderId, reason, description, refundItems, attachments } = body;

        // Validate order belongs to user
        const order = await Order.findOne({ orderId, isDeleted: false });
        if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        if (!user.isEmployee && (order as any).userId !== user.userId) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Check order is in refundable state
        const refundableStatuses = ["confirmed", "processing", "shipped", "delivered", "completed"];
        if (!user.isEmployee && !refundableStatuses.includes(order.status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Order in status '${order.status}' is not eligible for refund`
                },
                { status: 400 }
            );
        }

        const totalRefundAmount = (refundItems as any[]).reduce((s: number, i: any) => s + (i.refundAmount || 0), 0);

        const refund = await RefundRequest.create({
            orderId,
            orderNumber: (order as any).orderNumber,
            userId: user.userId,
            userEmail: user.email,
            userName: user.name,
            reason,
            description,
            attachments: attachments || [],
            refundItems,
            totalRefundAmount,
            currency: (order as any).currency
        });

        // Update order status
        await Order.findOneAndUpdate({ orderId }, { status: "refund_requested" });

        return NextResponse.json({ success: true, data: refund }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
