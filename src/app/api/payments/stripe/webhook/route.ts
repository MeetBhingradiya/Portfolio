/**
 * Stripe — Webhook Handler
 *
 * POST /api/payments/stripe/webhook
 *
 * Handles Stripe events: checkout.session.completed, invoice.paid,
 * customer.subscription.deleted, payment_intent.payment_failed, etc.
 *
 * Verifies the Stripe-Signature header using the webhook endpoint secret.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@Utils/dbConnect";
import { Payment } from "@Models/Payment";
import { CDNAPIKey } from "@Models/CDNAPIKey";
import { CDNApplication } from "@Models/CDNApplication";
import { PLAN_DEFAULTS } from "@Models/CDNAPIKey";

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover",
    });
    const rawBody   = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err: any) {
        console.error("[Stripe webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    await dbConnect();

    try {
        switch (event.type) {
            // ── Checkout completed ────────────────────────────────────────
            case "checkout.session.completed": {
                const sess = event.data.object as Stripe.Checkout.Session;
                const paymentIntentId  = typeof sess.payment_intent === "string" ? sess.payment_intent : null;
                const subscriptionId   = typeof sess.subscription   === "string" ? sess.subscription   : null;

                const update: Record<string, any> = {
                    status          : "completed",
                    amount          : sess.amount_total ?? 0,
                    currency        : sess.currency?.toUpperCase() ?? "USD",
                };
                if (paymentIntentId) update.stripePaymentIntentId = paymentIntentId;
                if (subscriptionId)  update.stripeSubscriptionId  = subscriptionId;
                if (sess.customer)   update.stripeCustomerId       = sess.customer as string;

                const rec = await Payment.findOneAndUpdate(
                    { stripeSessionId: sess.id },
                    update,
                    { new: true }
                );

                // CDN plan upgrade fulfilment
                if (rec?.purpose === "cdn_plan" && rec.referenceId && (sess.metadata as any)?.upgradePlan) {
                    const newPlan = (sess.metadata as any).upgradePlan as "free" | "basic" | "pro" | "enterprise";
                    await CDNApplication.findByIdAndUpdate(rec.referenceId, { requestedPlan: newPlan });
                    await CDNAPIKey.updateMany(
                        { applicationId: rec.referenceId, status: "active" },
                        { plan: newPlan, rateLimit: PLAN_DEFAULTS[newPlan] || PLAN_DEFAULTS.free }
                    );
                }
                break;
            }

            // ── Invoice paid (recurring subscriptions) ────────────────────
            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                // In Stripe API v2026, subscription is accessed via invoice.lines or parent object
                const subId = (invoice as any).subscription as string | null | undefined;
                if (subId) {
                    await Payment.findOneAndUpdate(
                        { stripeSubscriptionId: subId },
                        { status: "completed", stripeInvoiceId: invoice.id }
                    );
                }
                break;
            }

            // ── Subscription deleted / cancelled ──────────────────────────
            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                await Payment.findOneAndUpdate(
                    { stripeSubscriptionId: sub.id },
                    { status: "cancelled" }
                );
                break;
            }

            // ── Payment intent failed ─────────────────────────────────────
            case "payment_intent.payment_failed": {
                const pi = event.data.object as Stripe.PaymentIntent;
                await Payment.findOneAndUpdate(
                    { stripePaymentIntentId: pi.id },
                    {
                        status        : "failed",
                        failureReason : pi.last_payment_error?.message || "Payment failed",
                    }
                );
                break;
            }

            default:
                console.info(`[Stripe webhook] Unhandled event: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("[Stripe webhook handler]", err);
        return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
    }
}
