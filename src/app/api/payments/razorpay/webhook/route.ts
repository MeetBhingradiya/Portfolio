/**
 * Razorpay — Webhook
 *
 * POST /api/payments/razorpay/webhook
 *
 * Handles Razorpay event notifications (subscription charges, failures, etc.)
 * Verifies X-Razorpay-Signature header before processing.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import dbConnect from "@Utils/dbConnect";
import { Payment } from "@Models/Payment";
import { CDNAPIKey } from "@Models/CDNAPIKey";
import { PLAN_DEFAULTS } from "@Models/CDNAPIKey";

export async function POST(req: NextRequest) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Validate webhook signature
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (expected !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    await dbConnect();

    const { event: eventName, payload } = event;

    try {
        switch (eventName) {
            // ── One-time payment ──────────────────────────────────────────
            case "payment.captured": {
                const payment = payload.payment?.entity;
                if (payment?.order_id) {
                    await Payment.findOneAndUpdate(
                        { razorpayOrderId: payment.order_id },
                        { razorpayPaymentId: payment.id, status: "completed" }
                    );
                }
                break;
            }
            case "payment.failed": {
                const payment = payload.payment?.entity;
                if (payment?.order_id) {
                    await Payment.findOneAndUpdate(
                        { razorpayOrderId: payment.order_id },
                        {
                            status: "failed",
                            failureReason: payment.error_description || "Payment failed"
                        }
                    );
                }
                break;
            }
            // ── Subscription ──────────────────────────────────────────────
            case "subscription.charged": {
                const sub = payload.subscription?.entity;
                if (sub?.id) {
                    const rec = await Payment.findOneAndUpdate(
                        { razorpaySubscriptionId: sub.id },
                        {
                            status: "completed",
                            amount: sub.current_end - sub.current_start
                        },
                        { new: true }
                    );
                    // Re-activate key if it was suspended due to payment lapse
                    if (rec?.referenceId) {
                        await CDNAPIKey.updateMany(
                            {
                                applicationId: rec.referenceId,
                                status: "suspended"
                            },
                            { status: "active" }
                        );
                    }
                }
                break;
            }
            case "subscription.cancelled":
            case "subscription.halted": {
                const sub = payload.subscription?.entity;
                if (sub?.id) {
                    await Payment.findOneAndUpdate({ razorpaySubscriptionId: sub.id }, { status: "cancelled" });
                }
                break;
            }
            default:
                // Unknown event — log and acknowledge
                console.info(`[Razorpay webhook] Unhandled event: ${eventName}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("[Razorpay webhook handler]", err);
        return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
    }
}
