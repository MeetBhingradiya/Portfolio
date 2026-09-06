/**
 * GET   /api/shop/refunds/[id]   → single refund
 * PATCH /api/shop/refunds/[id]   → review/approve/reject (employee/admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import dbConnect from "@Utils/dbConnect";
import { RefundRequest } from "@Models/RefundRequest";
import { Order } from "@Models/Order";
import { getResolvedUser } from "@Utils/RolePermissions";

function getRefundQuery(id: string) {
    return mongoose.isValidObjectId(id)
        ? { $or: [{ refundId: id }, { _id: id }] }
        : { refundId: id };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const refund = await RefundRequest.findOne({
            ...getRefundQuery(id),
            isDeleted: false
        }).lean();

        if (!refund) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        if (!user.isEmployee && (refund as any).userId !== user.userId) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ success: true, data: refund });
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
        if (!user?.isEmployee) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const { status, reviewNote } = body;

        const refund = await RefundRequest.findOneAndUpdate(
            getRefundQuery(id),
            {
                status,
                reviewedBy: user.email,
                reviewNote,
                ...(status === "processed" ? { processedAt: new Date() } : {})
            },
            { new: true }
        );

        if (!refund) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        // Update order status based on refund decision
        if (status === "processed") {
            await Order.findOneAndUpdate({ orderId: refund.orderId }, { status: "refunded", paymentStatus: "refunded" });
        } else if (status === "rejected") {
            await Order.findOneAndUpdate({ orderId: refund.orderId }, { status: "completed" });
        }

        return NextResponse.json({ success: true, data: refund });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
