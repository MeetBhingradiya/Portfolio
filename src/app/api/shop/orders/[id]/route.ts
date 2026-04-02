/**
 * GET   /api/shop/orders/[id]   → single order
 * PATCH /api/shop/orders/[id]   → update status/tracking (employee/admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { Order } from "@Models/Order";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const order = await Order.findOne({
            $or: [{ orderId: params.id }, { _id: params.id }],
            isDeleted: false
        }).lean();

        if (!order) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        if (!user.isEmployee && (order as any).userId !== user.userId) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ success: true, data: order });
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
        const order = await Order.findOne({
            $or: [{ orderId: params.id }, { _id: params.id }],
            isDeleted: false
        });
        if (!order) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        // Only employee/admin can update order metadata
        if (!user.isEmployee && (order as any).userId !== user.userId) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (user.isEmployee) {
            if (body.status) order.status = body.status;
            if (body.paymentStatus) order.paymentStatus = body.paymentStatus;
            if (body.trackingNumber) order.trackingNumber = body.trackingNumber;
            if (body.trackingUrl) order.trackingUrl = body.trackingUrl;
            if (body.adminNote) order.adminNote = body.adminNote;
            if (body.invoiceUrl) order.invoiceUrl = body.invoiceUrl;
            if (body.status === "shipped") order.shippedAt = new Date();
            if (body.status === "delivered") order.deliveredAt = new Date();
        }

        // Customer can cancel a pending order
        if (!user.isEmployee && (order as any).userId === user.userId) {
            if (body.cancel && ["pending", "payment_processing"].includes(order.status)) {
                order.status = "cancelled";
            }
        }

        await order.save();
        return NextResponse.json({ success: true, data: order });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
