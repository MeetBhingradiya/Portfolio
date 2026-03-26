/**
 * Razorpay — Create Order
 *
 * POST /api/payments/razorpay/create-order
 *
 * Body:
 *   { amount: number (INR paise), currency?: string, purpose: "cdn_plan" | "shop_order" | "other", referenceId?: string, notes?: Record<string,string> }
 *
 * Returns Razorpay order object which the frontend passes to Razorpay Checkout.
 */
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { Payment } from "@Models/Payment";

export async function POST(req: NextRequest) {
    const razorpay = new Razorpay({
        key_id    : process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    try {
        const session = await getSession(req.headers);
        if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

        const { amount, currency = "INR", purpose = "other", referenceId, notes } = await req.json();
        if (!amount || amount <= 0) return NextResponse.json({ error: "amount (paise) is required and must be > 0." }, { status: 422 });

        await dbConnect();

        // Create order in Razorpay
        const order = await razorpay.orders.create({
            amount  : Math.round(amount),
            currency,
            notes   : {
                userId      : session.user.id    || "",
                userEmail   : session.user.email || "",
                purpose,
                referenceId : referenceId || "",
                ...(notes || {}),
            },
        });

        // Save pending payment record
        await Payment.create({
            userId            : session.user.id    || session.user.email,
            userEmail         : session.user.email,
            provider          : "razorpay",
            type              : "one_time",
            purpose,
            referenceId,
            amount,
            currency,
            razorpayOrderId   : order.id,
            status            : "pending",
        });

        return NextResponse.json({
            orderId  : order.id,
            amount   : order.amount,
            currency : order.currency,
            keyId    : process.env.RAZORPAY_KEY_ID,
        });
    } catch (err: any) {
        console.error("[Razorpay create-order]", err);
        return NextResponse.json({ error: err?.message || "Failed to create order." }, { status: 500 });
    }
}
