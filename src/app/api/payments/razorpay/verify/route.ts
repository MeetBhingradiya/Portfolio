/**
 * Razorpay — Verify Payment
 *
 * POST /api/payments/razorpay/verify
 *
 * Body:
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Validates the HMAC-SHA256 signature, marks the Payment as completed,
 * and (optionally) upgrades the CDN plan or fulfils a shop order.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { Payment } from "@Models/Payment";
import { CDNApplication } from "@Models/CDNApplication";
import { CDNAPIKey } from "@Models/CDNAPIKey";
import { PLAN_DEFAULTS } from "@Models/CDNAPIKey";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required." }, { status: 422 });
        }

        // Verify HMAC signature
        const secret    = process.env.RAZORPAY_KEY_SECRET!;
        const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected  = createHmac("sha256", secret).update(body).digest("hex");
        if (expected !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
        }

        await dbConnect();

        // Update payment record
        const payment = await Payment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id, provider: "razorpay" },
            {
                razorpayPaymentId  : razorpay_payment_id,
                razorpaySignature  : razorpay_signature,
                status             : "completed",
            },
            { new: true }
        );

        if (!payment) {
            return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
        }

        // ── Post-payment fulfilment ────────────────────────────────────────
        if (payment.purpose === "cdn_plan" && payment.referenceId) {
            // Upgrade CDN application plan from metadata
            const app = await CDNApplication.findById(payment.referenceId);
            if (app && (payment.metadata as any)?.upgradePlan) {
                const newPlan = (payment.metadata as any).upgradePlan as "free" | "basic" | "pro" | "enterprise";
                app.requestedPlan = newPlan;
                await app.save();

                // Update active key rate limits
                const newLimits = PLAN_DEFAULTS[newPlan] || PLAN_DEFAULTS.free;
                await CDNAPIKey.updateMany(
                    { applicationId: payment.referenceId, status: "active" },
                    { plan: newPlan, rateLimit: newLimits }
                );
            }
        }

        return NextResponse.json({ success: true, paymentId: razorpay_payment_id, status: payment.status });
    } catch (err: any) {
        console.error("[Razorpay verify]", err);
        return NextResponse.json({ error: err?.message || "Verification failed." }, { status: 500 });
    }
}
