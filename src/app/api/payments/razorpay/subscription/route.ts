/**
 * Razorpay — Subscription (Autopay)
 *
 * POST /api/payments/razorpay/subscription
 *
 * Creates a Razorpay subscription plan + subscription for recurring CDN plan billing.
 *
 * Body:
 *   { planId: string (Razorpay plan ID), purpose?: string, referenceId?: string }
 *
 * Returns the Razorpay subscription object for client-side checkout.
 */
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { Payment } from "@Models/Payment";

export async function POST(req: NextRequest) {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
    try {
        const session = await getSession(req.headers);
        if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

        const { planId, totalCount = 12, purpose = "cdn_plan", referenceId } = await req.json();
        if (!planId) return NextResponse.json({ error: "planId is required." }, { status: 422 });

        await dbConnect();

        const subscription = await (razorpay.subscriptions as any).create({
            plan_id: planId,
            total_count: totalCount, // number of billing cycles
            quantity: 1,
            customer_notify: 1,
            notes: {
                userId: session.user.id || "",
                userEmail: session.user.email || "",
                purpose,
                referenceId: referenceId || ""
            }
        });

        // Record pending subscription payment
        await Payment.create({
            userId: session.user.id || session.user.email,
            userEmail: session.user.email,
            provider: "razorpay",
            type: "subscription",
            purpose,
            referenceId,
            amount: 0, // updated on first charge webhook
            currency: "INR",
            razorpaySubscriptionId: subscription.id,
            status: "pending"
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err: any) {
        console.error("[Razorpay subscription]", err);
        return NextResponse.json({ error: err?.message || "Failed to create subscription." }, { status: 500 });
    }
}
